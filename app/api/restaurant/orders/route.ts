import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { initSocket } from '@/lib/socket';
import { startOfDay, endOfDay } from 'date-fns';
import { sendEmail } from '@/lib/email';


async function getEmailAndSmsSettings(key: string) {
  const emailSettings = await prisma.setting.findUnique({
    where: { key: key }
  });
  return emailSettings?.value;
}

// GET: Fetch all orders for the current restaurant
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email },
    include: {
      role: true
    }
  })

  if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant", "Kitchen_boy"].includes(user.role.name)  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse query parameters instead of req.json()
  const { searchParams } = new URL(req.url)

  const search = searchParams.get('search') || ''
  const dateRange = searchParams.get('dateRange')
  const status = searchParams.get('status')
  const customStart = searchParams.get('startDate')
  const customEnd = searchParams.get('endDate')



  try {
    // Prepare date filter
    const createdAt: any = {}

    if (dateRange) {
      createdAt.gte = startOfDay(new Date(dateRange))
      createdAt.lte = endOfDay(new Date(dateRange))
    }

    if (customStart && customEnd) {
      createdAt.gte = startOfDay(new Date(customStart))
      createdAt.lte = endOfDay(new Date(customEnd))
    }

    const where: any = {
      restaurantId: user.restaurantId,
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search } },

        ]
      })
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        table: {
          select: { number: true }
        },
        kitchenOrder: {
          select: {
            status: true
          }
        }
      }
    })

    const ordersWithTableNumber = orders.map((order: any) => ({
      ...order,
      tableNumber: order.table?.number || null
    }))

    return NextResponse.json({ orders: ordersWithTableNumber })
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// PATCH: Bulk update orders (assign to kitchen, complete, cancel, delete)
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email },
      include: {
        role: true
      }
    });
    if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant", "Kitchen_boy"].includes(user.role.name)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const restaurantId = user.restaurantId;

    const { orderIds, action } = await req.json();
    if (!Array.isArray(orderIds) || !action) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
      let result;
      let updatedOrders;
      // First verify all orders exist and belong to the restaurant
      const existingOrders = await prisma.order.findMany({
        where: { 
          id: { in: orderIds },
          restaurantId 
        }
      });
      if (existingOrders.length !== orderIds.length) {
        return NextResponse.json({ 
          error: 'Some orders were not found or do not belong to your restaurant',
          found: existingOrders.length,
          requested: orderIds.length
        }, { status: 404 });
      }

      // Perform the requested action
      if (action === 'complete') {
        // Update both orders and kitchen orders in a transaction
        await prisma.$transaction(async (tx) => {
          // Update main orders
          result = await tx.order.updateMany({
            where: { id: { in: orderIds }, restaurantId: restaurantId! },
            data: { 
              status: 'completed',
              updatedAt: new Date()
            }
          });

          // Update related kitchen orders
          await tx.kitchenOrder.updateMany({
            where: { orderId: { in: orderIds } },
            data: {
              status: 'completed',
              completedAt: new Date()
            }
          });

          // 2. Find the related tableIds
  const orders = await tx.order.findMany({
    where: {
      id: { in: orderIds }
    },
    select: {
      tableId: true
    }
  });

  const tableIds = orders.map(order => order.tableId).filter(Boolean);

  if (tableIds.length > 0) {
    // 3. Update the table status
    await tx.table.updateMany({
      where: {
        id: { in: tableIds },
        restaurantId: restaurantId!
      },
      data: {
        status: 'available'
      }
    });
  }
        });

        // Fetch the completed orders with their details
        const completedOrders = await prisma.order.findMany({
          where: { id: { in: orderIds } },
          include: { 
            table: true,
            kitchenOrder: true,
            Customer: {
              select: {
                id: true,
                email: true,
                firstName: true
              }
            }
          }
        });

        // Get email settings
        const companySetting = await getEmailAndSmsSettings("company");
        const companyName = companySetting ? JSON.parse(companySetting).name : "Restaurant";
        const emailSetting = await getEmailAndSmsSettings("OTP_EMAIL_ENABLED");
        const emailTemplate = await prisma.emailTemplate.findUnique({
          where: { name: "item_feedback" }
        });

        // Send emails for each completed order
        for (const order of completedOrders) {
          if (
            emailTemplate &&
            emailSetting === "true" &&
            order.Customer?.email &&
            typeof order.items === "string"
          ) {
            const orderItems = JSON.parse(order.items) as {
              menuItemId: string;
              name: string;
            }[];
        
            // Extract all item names (optional for listing)
            const itemNames = orderItems.map(item => item.name).join(', ');
        
            // Extract all menuItemIds
            const itemIds = orderItems.map(item => item.menuItemId).join(',');
        
            const templateData = {
              userName: order.orderType === "dine-in" ? order.Customer.firstName || "Customer" : order.orderType === "pickup" ? order.Customer.firstName || "Customer" : "Customer",
              restaurantName: companyName,
              itemNames,
              feedbackLink: `${process.env.NEXTAUTH_URL}/feedback?userId=${order.Customer.id}&itemId=${itemIds}&restaurantId=${order.restaurantId}&orderId=${order.id}`
            };
            console.log(templateData, 'templateData')
            console.log(order.Customer.email, 'order.Customer.email')
            console.log(emailTemplate.subject, 'emailTemplate.subject')
            console.log(emailTemplate.body, 'emailTemplate.body')
            await sendEmail({
              to: order.Customer.email,
              subject:
                emailTemplate.subject
                  ?.replace("{{restaurantName}}", companyName)
                  .replace("{{userName}}", order.Customer.firstName || "Customer") || "",
              html:
                emailTemplate.body
                  ?.replace("{{userName}}", templateData.userName)
                  .replace("{{restaurantName}}", templateData.restaurantName)
                  .replace("{{itemName}}", templateData.itemNames)
                  .replace("{{feedbackLink}}", templateData.feedbackLink) || ""
            });
          }
        }
        

        updatedOrders = completedOrders;
      } else if (action === 'cancel') {
        // Update both orders and kitchen orders in a transaction
        await prisma.$transaction(async (tx) => {
          // Update main orders
          result = await tx.order.updateMany({
            where: { id: { in: orderIds }, restaurantId },
            data: { 
              status: 'cancelled',
              updatedAt: new Date()
            },
          });

          // Update related kitchen orders
          await tx.kitchenOrder.updateMany({
            where: { orderId: { in: orderIds } },
            data: {
              status: 'cancelled',
              completedAt: new Date()
            }
          });
        });

        updatedOrders = await prisma.order.findMany({
          where: { id: { in: orderIds } },
          include: { 
            table: true,
            kitchenOrder: true 
          }
        });
      } else if (action === 'delete') {
        // For delete, we need to handle related records first
        await prisma.$transaction(async (tx) => {
          // Delete related kitchen orders first
          // await tx.kitchenOrder.deleteMany({
          //   where: { orderId: { in: orderIds } }
          // });
          
          // Then delete the orders
          result = await tx.order.deleteMany({
            where: { id: { in: orderIds }, restaurantId }
          });
        });
      } else {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        result,
        message: `Successfully ${action}ed ${orderIds.length} order${orderIds.length > 1 ? 's' : ''}`
      });
    } catch (error) {
      console.error('Error updating orders:', error);
      return NextResponse.json({ 
        error: 'Failed to update orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
} 
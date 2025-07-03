import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initSocket } from "@/lib/socket";
import { Prisma } from '@prisma/client';
import { sendEmail } from '@/lib/email';

interface KitchenOrderWithRelations {
  id: string;
  orderId: string;
  restaurantId: string;
  staffId: string | null;
  assignedBy: string;
  assignedAt: Date;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: string;
    orderNumber: string;
    items: string;
    estimatedDelivery: Date | null;
    table: {
      number: number;
    } | null;
  };
  assigner: {
    firstName: string;
    lastName: string;
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderIds } = await req.json();

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid order IDs' },
        { status: 400 }
      );
    }

    // Get the user and restaurant ID from the email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        restaurantId: true 
      }
    });

    if (!user?.restaurantId) {
      return NextResponse.json(
        { success: false, message: 'User is not associated with a restaurant' },
        { status: 400 }
      );
    }

    // Create kitchen orders and update order statuses
    const kitchenOrders = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          id: { in: orderIds },
          restaurantId: user.restaurantId as string
        },
        include: {
          table: true
        }
      });

      if (orders.length !== orderIds.length) {
        throw new Error('Some orders were not found');
      }

      const kitchenOrders = await Promise.all(
        orders.map(async (order) => {
          // Check if kitchen order already exists
          const existingKitchenOrder = await tx.kitchenOrder.findUnique({
            where: { orderId: order.id }
          });

          
          if (existingKitchenOrder) {
            throw new Error(`Order ${order.orderNumber} is already assigned to kitchen`);
          }

          const kitchenOrder = await tx.kitchenOrder.create({
            data: {
              orderId: order.id,
              restaurantId: user.restaurantId as string,
              status: 'pending',
              assignedBy: user.id
            },
            include: {
              order: {
                include: {
                  table: true
                }
              },
              assigner: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          });

          await tx.order.update({
            where: { id: order.id },
            data: { status: 'preparing' }
          });

          return kitchenOrder;
        })
      );

      return kitchenOrders;
    });

    // Initialize socket and emit update
    try {
      const socket = await initSocket();
      console.log('Socket initialized in assign endpoint');
      if (socket) {
        console.log('Socket initialized in assign endpoint');
        
        // Log the data we're about to emit
        console.log('Emitting kitchen order data:', {
          type: 'update',
          orders: kitchenOrders.map(ko => ({
            orderId: ko.orderId,
            status: ko.status,
            orderNumber: ko.order.orderNumber
          }))
        });

        // Emit both events to ensure all clients are updated

    
        
        // Emit new kitchen order event
        socket.emit('newKitchenOrder', {
          type: 'update',
          orders: kitchenOrders
        });
        

        // Also emit a general orders update
        socket.emit('ordersUpdate', {
          type: 'update',
          orderIds: orderIds
        });
        

        
      } else {
        console.error('Socket initialization failed in assign endpoint');
      }
    } catch (socketError) {
      console.error('Error with socket operations:', socketError);
      // Continue with the response even if socket operations fail
    }

    return NextResponse.json({
      success: true,
      message: 'Orders assigned to kitchen successfully',
      kitchenOrders
    });
  } catch (error) {
    console.error('Error assigning orders to kitchen:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to assign orders to kitchen' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId')
    const orderId = searchParams.get('orderId')
    if (!restaurantId) {
      return new NextResponse('Restaurant ID is required', { status: 400 })
    }

    if (!orderId) {
      return new NextResponse('Order ID is required', { status: 400 })
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        userId: restaurantId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            restaurantName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const order = await prisma.order.findUnique({
      where: {
        id: orderId
      }
    })

    const feedback = await prisma.menuItemReview.findMany({
      where: {
        menuItemId: {
          in: menuItems.map(item => item.id)
        },
        restaurantId: restaurantId
      }
    })

    return NextResponse.json({ menuItems, order, feedback })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}


export async function POST(request: Request) {
    try {
      const body = await request.json();
      const { userId, itemId, restaurantId, orderId, rating, comment } = body;
      const getUser = await prisma.customer.findUnique({
        where: {
          id: userId
        }
      })
      
  
      const itemIds = itemId.includes(",") ? itemId.split(",") : [itemId];
      // Create reviews for each itemId
      const feedbacks = await Promise.all(
        itemIds.map(async (id: string) => {
          return await prisma.menuItemReview.create({
            data: {
              userId: getUser?.userId,
              menuItemId: id,
              restaurantId,
              orderId,
              rating,
              comment
            }
          });
        })
      );
  
      return NextResponse.json(feedbacks);
    } catch (error) {
      console.error("Error creating feedback:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }
  
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initSocket } from '@/lib/socket';


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the restaurant ID from the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { restaurantId: true }
    });

    if (!user?.restaurantId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Fetch kitchen orders for the restaurant
    const kitchenOrders = await prisma.kitchenOrder.findMany({
      where: {
        restaurantId: user.restaurantId,
        // status: {
        //   in: ['pending', 'preparing', 'ready', 'completed']
        // }
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
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      orders: kitchenOrders
    });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch kitchen orders" },
      { status: 500 }
    );
  }
}

// Endpoint to accept an order
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get user and their restaurant
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

    // Update kitchen order
    const updatedOrder = await prisma.kitchenOrder.update({
      where: {
        orderId,
        restaurantId: user.restaurantId,
      },
      data: {
        status: 'preparing',
        startedAt: new Date(),
        staffId: user.id
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
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });


    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    });


  } catch (error) {
    console.error('Error accepting kitchen order:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to accept kitchen order'
      },
      { status: 500 }
    );
  }
} 
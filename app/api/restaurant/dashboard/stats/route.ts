import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    
    const today = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = startOfDay(today);
        break;
      case 'weekly':
        startDate = startOfDay(subDays(today, 7));
        break;
      case 'monthly':
      default:
        startDate = startOfDay(subDays(today, 30));
        break;
    }


    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }


    const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        include: {
          role: true,
        },
      });
      
      if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        // valid role
        return new NextResponse("Unauthorized", { status: 401 })
      }

    // Get total menus
    const totalMenus = await prisma.menuItem.count({
        where: {
            userId: user.restaurantId
        }
    });

    // Get orders stats
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endOfDay(today)
        },
        restaurantId: user.restaurantId
      }
    });

    const totalOrders = orders.length;
    const totalIncome = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Get customer stats
    const totalCustomers = await prisma.customer.count({
        where: {
            restaurantId: user.restaurantId
        }
    });
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endOfDay(today)
        },
        restaurantId: user.restaurantId
      }
    });

    // Get ratings
    const ratings = await prisma.menuItemReview.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endOfDay(today)
        },
        restaurantId: user.restaurantId
      }
    });

    const ratingDistribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length,
    };

    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        Customer: true
      },
      where: {
        restaurantId: user.restaurantId
      }
    });






    // Get all completed orders and their items
const completedOrders = await prisma.order.findMany({
    where: { status: 'completed' },
    select: { items: true }
  });

  
  
  // Count how often each menuItemId appears
  const itemFrequencyMap: Record<string, number> = {};
  completedOrders.forEach(order => {
    JSON.parse(order.items as string).forEach((item: any) => {
        console.log( "item data", item)
      if (item.menuItemId) {
        itemFrequencyMap[item.menuItemId] = (itemFrequencyMap[item.menuItemId] || 0) + 1;
      }
    });
  });

  
  
  // Sort and get top 3 item IDs
  const sortedItemIds = Object.entries(itemFrequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  
  // Fetch menu item details
  const trendingItems = await prisma.menuItem.findMany({
    where: {
      id: { in: sortedItemIds }
    }
  });
  
  // Add orderCount to each
  const trendingItemsWithDetails = trendingItems.map(item => ({
    ...item,
    orderCount: itemFrequencyMap[item.id] || 0
  }));
  


    return NextResponse.json({
      stats: {
        menus: totalMenus,
        orders: totalOrders,
        customers: totalCustomers,
        income: totalIncome,
        newCustomers
      },
      ratings: {
        distribution: ratingDistribution,
        average: averageRating,
        total: ratings.length
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        customer: order.Customer ? `${order.Customer.firstName} ${order.Customer.lastName}` : 'Guest',
        total: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      })),
      trendingItems: trendingItemsWithDetails,
    //   countTotalOrderBaseOnItemId: trendingItemCountMap
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 
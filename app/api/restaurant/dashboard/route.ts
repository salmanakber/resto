import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "monthly"
    const restaurant = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        restaurantId: true,
      },
    })

    if (!restaurant?.restaurantId) {
      return NextResponse.json({ error: "Restaurant ID not found" }, { status: 400 })
    }

    const restaurantId = restaurant.restaurantId

    // Get date ranges based on period
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case "daily":
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case "weekly":
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case "monthly":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    // Get customer activity data
    const customerActivity = await getCustomerActivity(restaurantId, startDate, endDate)

    // Get category performance data
    const { performanceData: categoryPerformance, trendingItems } = await getCategoryPerformance(restaurantId, startDate, endDate)

    // Get revenue analytics
    const revenueAnalytics = await getRevenueAnalytics(restaurantId, startDate, endDate)

    // Get order performance metrics
    const orderPerformance = await getOrderPerformance(restaurantId, startDate, endDate)

    // Get staff performance
    const staffPerformance = await getStaffPerformance(restaurantId, startDate, endDate)

    // Get customer reviews
    const customerReviews = await getCustomerReviews(restaurantId)

    // Get hourly orders data
    const hourlyOrders = await getHourlyOrders(restaurantId, startDate, endDate)

    // Get tables data
    const tables = await getTables(restaurantId)

    // Get previous month data
    const previousMonthDataStat = await previousMonthData(
        restaurantId,
        subMonths(startDate, 1), // e.g., May 1
        subMonths(endDate, 1)    // e.g., May 31
      );

    // console.log(customerActivity, 'customerActivity')
    // console.log(categoryPerformance, 'categoryPerformance')
    // console.log(revenueAnalytics, 'revenueAnalytics')
    // console.log(orderPerformance, 'orderPerformance')
    // console.log(staffPerformance, 'staffPerformance')
    // console.log(customerReviews, 'customerReviews')
    // console.log(hourlyOrders, 'hourlyOrders')
    // console.log(tables, 'tables')

    return NextResponse.json({
      customerActivity,
      categoryPerformance,
      trendingItems,
      revenueAnalytics,
      orderPerformance,
      staffPerformance,
      customerReviews,
      hourlyOrders,
      tables,
      previousMonthDataStat,
    })
  } catch (error) {
    console.error("Dashboard data error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function getCustomerActivity(restaurantId: string, startDate: Date, endDate: Date) {
  // Get all customers for the restaurant
  const customers = await prisma.customer.findMany({
    where: {
      restaurantId,
    },
    include: {
      orders: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  })

  // Calculate engagement metrics
  const activityData = customers.map(customer => {
    const orders = customer.orders
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const orderCount = orders.length

    return {
      customerId: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      orderCount,
      totalSpent,
      lastOrderDate: customer.lastOrderDate,
      visitFrequency: orderCount, // This could be enhanced with actual visit tracking
    }
  })

  return activityData
}

async function getCategoryPerformance(restaurantId: string, startDate: Date, endDate: Date) {
  const categories = await prisma.menuCategory.findMany({
    where: {
      userId: restaurantId,
    },
    include: {
      items: {
        include: {
          reviews: true,
        },
      },
    },
  })

  // Get all orders for the period
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      items: true,
      totalAmount: true,
    },
  })

  // Process orders to get menu item statistics
  const menuItemStats = new Map()
  orders.forEach(order => {
    try {
      const items = JSON.parse(order.items as string)
      items.forEach((item: any) => {
        const current = menuItemStats.get(item.menuItemId) || {
          name: item.name,
          image: item.image || '/placeholder.svg',
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
        }
        current.totalQuantity += item.quantity
        current.totalRevenue += item.price * item.quantity
        current.orderCount += 1
        menuItemStats.set(item.menuItemId, current)
      })
    } catch (error) {
      console.error('Error parsing order items:', error)
    }
  })

// Keep your existing async image fetch function

    const itemImages = await prisma.menuItem.findMany({
      where: {userId: restaurantId},
      select: { id: true, image: true },
    });

  
  
  // Build base items with promises
  const trendingItemsWithPromises = Array.from(menuItemStats.entries())
  .filter(([id, _]) => !!id) // ✅ skip entries with falsy ID
  .map(([id, stats]: [string, any]) => ({
    id,
    name: stats.name,
    price: stats.totalRevenue / stats.totalQuantity,
    orderCount: stats.totalQuantity,
    image: itemImages.find(item => item.id === id)?.image || '/placeholder.svg',
  }))
  .sort((a, b) => b.orderCount - a.orderCount)
  .slice(0, 5);

  
  // Await and finalize the `image` in each item
  const trendingItems = await Promise.all(
    trendingItemsWithPromises.map(async (item) => ({
      ...item,
      image: item.image || '/placeholder.svg', // resolved value
    }))
  );

  

  const performanceData = await Promise.all(
    categories.map(async (category) => {
      const categoryItems = category.items
      const categoryStats = categoryItems.reduce((acc, item) => {
        const stats = menuItemStats.get(item.id)
        if (stats) {
          acc.totalQuantity += stats.totalQuantity
          acc.totalRevenue += stats.totalRevenue
          acc.orderCount += stats.orderCount
        }
        return acc
      }, { totalQuantity: 0, totalRevenue: 0, orderCount: 0 })

      // Calculate average rating
      const ratings = categoryItems.flatMap(item => item.reviews.map(review => review.rating))
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0

      return {
        categoryId: category.id,
        name: category.name,
        orderCount: categoryStats.orderCount,
        revenue: categoryStats.totalRevenue,
        averageRating,
        margin: 65, // This should be calculated based on actual cost data
      }
    })
  )

  return {
    performanceData,
    trendingItems,
  }
}

async function getRevenueAnalytics(restaurantId: string, startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "completed",
      },
    });
  
    const payrolls = await prisma.payroll.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "paid",
        employee: {
          restaurantId: restaurantId,
        },
      },
      include: {
        employee: true,
      },
    });
  
    const revenueData = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + Number(order.totalAmount);
      return acc;
    }, {} as Record<string, number>);
  
    const expenseData = payrolls.reduce((acc, payroll) => {
      const date = payroll.createdAt.toISOString().split("T")[0];
      const netSalary = payroll.netSalary || 0;
      acc[date] = (acc[date] || 0) + Number(netSalary);
      return acc;
    }, {} as Record<string, number>);
  
    const allDates = Array.from(new Set([...Object.keys(revenueData), ...Object.keys(expenseData)])).sort();
  
    return allDates.map((date) => ({
      date,
      revenue: revenueData[date] || 0,
      expenses: expenseData[date] || 0,
      net: (revenueData[date] || 0) - (expenseData[date] || 0),
    }));
  }
  

async function getOrderPerformance(restaurantId: string, startDate: Date, endDate: Date) {
  const orders = await prisma.kitchenOrder.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      status: true,
      startedAt: true,
      readyAt: true,
      createdAt: true,  
    },
  })

  const totalOrders = orders.length
  if (totalOrders === 0) {
    return {
      onTime: 0,
      delayed: 0,
      cancelled: 0,
      totalOrders: 0,
    }
  }

  const onTimeOrders = orders.filter(order => {
    if (order.status !== "completed") return false
    const deliveryTime = order.readyAt
    const estimatedTime = order.startedAt
    return deliveryTime && estimatedTime && deliveryTime <= estimatedTime
  }).length

  const delayedOrders = orders.filter(order => {
    if (order.status !== "completed") return false
    const deliveryTime = order.readyAt
    const estimatedTime = order.startedAt
    return deliveryTime && estimatedTime && deliveryTime > estimatedTime
  }).length

  const cancelledOrders = orders.filter(order => order.status === "cancelled").length

  return {
    onTime: Math.round((onTimeOrders / totalOrders) * 100) || 0,
    delayed: Math.round((delayedOrders / totalOrders) * 100) || 0,
    cancelled: Math.round((cancelledOrders / totalOrders) * 100) || 0,
    totalOrders,
  }
}

async function getStaffPerformance(restaurantId: string, startDate: Date, endDate: Date) {
    const kitchenOrders = await prisma.kitchenOrder.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        staff: true,
      },
    });
  
    const staffPerformance = kitchenOrders.reduce((acc, order) => {
      if (!order.staff) return acc;
  
      const staffId = order.staff.id;
      if (!acc[staffId]) {
        acc[staffId] = {
          name: `${order.staff.firstName} ${order.staff.lastName}`,
          role: "Kitchen Staff",
          orders: 0,
          completedOrders: 0,
          totalTimeMs: 0, // Use milliseconds for accuracy
        };
      }
  
      acc[staffId].orders++;
  
      if (
        order.status === "completed" &&
        order.assignedAt &&
        order.readyAt
      ) {
        const durationMs = order.readyAt.getTime() - order.assignedAt.getTime() || 0;
        acc[staffId].completedOrders++;
        acc[staffId].totalTimeMs += durationMs;
      }
  
      return acc;
    }, {} as Record<string, any>);
  
    return Object.values(staffPerformance).map((staff) => {
      const avgTimeMinutes =
        staff.completedOrders > 0
          ? +(staff.totalTimeMs / staff.completedOrders / 60000).toFixed(1) // to minutes with 1 decimal
          : 0;
  
          return {
            ...staff,
            efficiency:
              staff.orders > 0
                ? Math.round((staff.completedOrders / staff.orders) * 100)
                : 0,
            averageTime:
              staff.completedOrders > 0
                ? +(staff.totalTimeMs / staff.completedOrders / 60000).toFixed(1) // ms → minutes
                : 0,
            totalTimeMs: staff.totalTimeMs, // ✅ include raw total time in ms
            completedOrders: staff.completedOrders,
            orders: staff.orders,
          };
          
    });
  }
  

async function getCustomerReviews(restaurantId: string) {
  const reviews = await prisma.menuItemReview.findMany({
    where: {
      restaurantId,
    },
    include: {
      user: true,
      menuItem: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  })

  return reviews.map(review => ({
    id: review.id,
    name: `${review.user.firstName} ${review.user.lastName}`,
    avatar: review.user.profileImage,
    rating: review.rating,
    date: review.createdAt,
    comment: review.comment,
    dish: review.menuItem.name,
  }))
}

async function getHourlyOrders(restaurantId: string, startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  })

  // Initialize hourly data
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const dummyDate = new Date()
    dummyDate.setHours(i, 0, 0, 0)
    return {
      hour: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: true,
      }).format(dummyDate), // e.g. "1 AM"
      date: '', // will be overwritten below
      orders: 0,
      revenue: 0,
    }
  })

  // Process orders
  orders.forEach(order => {
    const hour = order.createdAt.getHours()

    hourlyData[hour].orders++
    hourlyData[hour].revenue += Number(order.totalAmount)

    hourlyData[hour].date = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',   // "Monday"
      day: 'numeric',    // "12"
      year: 'numeric',   // "2025"
    }).format(order.createdAt) // "Monday, 12, 2025"
  })

  return hourlyData
}

async function getTables(restaurantId: string) {
  const tables = await prisma.table.findMany({
    where: {
      restaurantId,
      isActive: true,
    },
    include: {
      orders: {
        where: {
          status: {
            in: ["pending", "preparing", "accepted"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })

  return tables.map(table => ({
    id: table.id,
    number: table.number,
    name: `Table ${table.number}`,
    status: table.orders.length > 0 ? "occupied" : "available",
    capacity: table.capacity,
  }))
} 

async function previousMonthData(restaurantId: string , startDate: Date, endDate: Date) {    

    const orders = await prisma.order.findMany({
        where: {
            restaurantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
            status: "completed",
        },
    })
    const customers = await prisma.customer.findMany({
        where: {
            restaurantId: restaurantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    })
    
    const revenue = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0)
    const menuCategories = await prisma.menuCategory.findMany({
        where: {
            userId: restaurantId,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    })

    return { orders, customers, revenue, menuCategories }
}
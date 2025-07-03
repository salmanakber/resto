import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all restaurants
    const restaurants = await prisma.user.findMany({
      where: {
        role: {
          name: 'Restaurant'
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        restaurantName: true,
        email: true,
        restaurantId: true,
        locationId: true
      }
    })

    // Get restaurant-specific metrics
    const restaurantMetrics = await Promise.all(
      restaurants.map(async (restaurant) => {
        // Get restaurant revenue
        const revenue = await prisma.order.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            restaurantId: restaurant.id,
            status: 'completed',
          },
        })

        // Get restaurant orders
        const orders = await prisma.order.count({
          where: {
            restaurantId: restaurant.id,
          },
        })

        // Get restaurant menu items
        const menuItems = await prisma.menuItem.count({
          where: {
            userId: restaurant.id,
          },
        })

        // Get restaurant reviews
        const reviews = await prisma.menuItemReview.count({
          where: {
            menuItem: {
              userId: restaurant.id
            }
          },
        })

        // Get restaurant average rating
        const averageRating = await prisma.menuItemReview.aggregate({
          _avg: {
            rating: true,
          },
          where: {
            menuItem: {
              userId: restaurant.id
            }
          },
        })

        // Get restaurant revenue by month
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const revenueByMonth = await prisma.order.groupBy({
          by: ['createdAt'],
          _sum: {
            totalAmount: true,
          },
          where: {
            restaurantId: restaurant.id,
            createdAt: {
              gte: sixMonthsAgo,
            },
            status: 'completed',
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        // Get restaurant top selling items
        const topSellingItems = await prisma.order.groupBy({
          by: ['items'],
          _count: {
            items: true,
          },
          where: {
            restaurantId: restaurant.id,
          },
          orderBy: {
            _count: {
              items: 'desc',
            },
          },
          take: 5,
        })

        // Get restaurant order status distribution
        const orderStatusDistribution = await prisma.order.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
          where: {
            restaurantId: restaurant.id,
          },
        })

        // Get restaurant customer growth
        const customerGrowth = await prisma.order.groupBy({
          by: ['createdAt'],
          _count: {
            id: true,
          },
          where: {
            restaurantId: restaurant.id,
            createdAt: {
              gte: sixMonthsAgo,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

        // Get restaurant orders by payment method
        const ordersByPaymentMethod = await prisma.order.groupBy({
          by: ['paymentMethodId'],
          _count: {
            paymentMethodId: true,
          },
          where: {
            restaurantId: restaurant.id,
          },
        })

        // Get restaurant orders by location
        const ordersByLocation = await prisma.order.groupBy({
          by: ['locationId'],
          _count: {
            locationId: true,
          },
          where: {
            restaurantId: restaurant.id,
          },
        })

        // Get restaurant recent orders
// 1. Fetch latest 5 orders
const rawOrders = await prisma.order.findMany({
  take: 10,
  where: {
    restaurantId: restaurant.id,
  },
  orderBy: { createdAt: 'desc' },
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  },
})

// 2. Extract unique restaurantIds from orders
const restaurantIds = [...new Set(rawOrders.map(order => order.restaurantId).filter(Boolean))]

// 3. Fetch restaurant users by ID
const restaurantUsers = await prisma.user.findMany({
  where: {
    id: { in: restaurantIds },
    role: {
      name: 'Restaurant'
    },
  },
  select: {
    id: true,
    restaurantName: true,
  },
})

// 4. Create a lookup map for restaurantId -> restaurantName
const restaurantMap = restaurantUsers.reduce((acc, user) => {
  acc[user.id] = user.restaurantName
  return acc
}, {} as Record<string, string>)

// 5. Merge restaurantName into each order
const recentOrders = rawOrders.map(order => ({
  ...order,
  restaurantName: restaurantMap[order.restaurantId] || 'Unknown',
}))


        return {
          id: restaurant.id,
          name: `${restaurant.firstName} ${restaurant.lastName}`,
          email: restaurant.email,
          restaurantName: restaurant.restaurantName,
          metrics: {
            totalRevenue: revenue._sum.totalAmount || 0,
            totalOrders: orders,
            totalMenuItems: menuItems,
            totalReviews: reviews,
            averageRating: averageRating._avg?.rating || 0,
            revenueByMonth,
            topSellingItems,
            orderStatusDistribution,
            customerGrowth,
            ordersByPaymentMethod,
            ordersByLocation,
            recentOrders,
          },
        }
      })
    )

    // Get overall metrics
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        status: 'completed',
      },
    })

    const totalOrders = await prisma.order.count()
    const totalUsers = await prisma.user.count({
      where: {
        role: {
          name: 'customer',
        },
      },
    })

    const totalRestaurants = restaurants.length
    

    return NextResponse.json({
      restaurants: restaurantMetrics,
      overall: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalOrders,
        totalUsers,
        totalRestaurants,
      },
    })
  } catch (error) {
    console.error('[DASHBOARD_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
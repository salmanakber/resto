import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log(session, 'session')
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        role: true,
      },
    })
    if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const restaurantId = user?.restaurantId

    const getCurrency = await prisma.setting.findUnique({
        where: {
          key: "currency",
        },
        select: {
          value: true,
        },
      });
      
      const parsedCurrencies = JSON.parse(getCurrency?.value || "{}");
      
      // Find the currency where default is true
      const defaultCurrencyEntry = Object.entries(parsedCurrencies).find(
        ([, currencyData]) => currencyData.default === true
      );
      
      const defaultCurrency = defaultCurrencyEntry
        ? { code: defaultCurrencyEntry[0], ...defaultCurrencyEntry[1] }
        : { code: "USD", symbol: "$", name: "United States Dollar" }; // Fallback
      

    // Fetch customers with their loyalty points and order history
    const customers = await prisma.customer.findMany({
      where: {
        restaurantId: restaurantId,
      },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            status: true,
            items: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Get last 5 orders
        },
      },
      orderBy: {
        totalSpent: 'desc',
      },
    })

    // Calculate additional metrics for each customer
    const customersWithMetrics = await Promise.all(
      customers.map(async (customer) => {
        // Get total loyalty points
        const earnedPoints = await prisma.loyaltyPoint.aggregate({
          where: {
            userId: customer.userId || "",
            type: 'earn',
            expiresAt: {
              gte: new Date(),
            },
          },
          _sum: {
            points: true,
          },
        })
        
        const redeemedPoints = await prisma.loyaltyPoint.aggregate({
          where: {
            userId: customer.userId || "",
            type: 'redeem',
            expiresAt: {
              gte: new Date(),
            },
          },
          _sum: {
            points: true,
          },
        })
        
        const loyaltyPoints = (earnedPoints._sum.points || 0) - (redeemedPoints._sum.points || 0)
        

        

        // Calculate total spent and order count
        const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
        const totalOrders = customer.orders.length

        // Get last order date
        const lastOrderDate = customer.orders[0]?.createdAt || null

        // Calculate monthly spending
        const monthlySpending = await prisma.order.groupBy({
          by: ['createdAt'],
          where: {
            customerId: customer.id,
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 3)), // Last 3 months
            },
          },
          _sum: {
            totalAmount: true,
          },
        })

        // Get favorite items
        const favoriteItems = await prisma.order.findMany({
          where: {
            customerId: customer.id,
          },
          select: {
            items: true,
          },
          take: 10,
        })

        // Process favorite items
        const itemCounts = favoriteItems.reduce((acc: any, order) => {
          const items = JSON.parse(order.items as string)
          items.forEach((item: any) => {
            acc[item.name] = (acc[item.name] || 0) + item.quantity
          })
          return acc
        }, {})

        const topItems = Object.entries(itemCounts)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([name]) => name)

        return {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phoneNumber,
          address: customer.address,
          loyaltyPoints: loyaltyPoints,
          totalOrders,
          totalSpent,
          lastVisit: lastOrderDate,
          joinDate: customer.createdAt,
          currency: defaultCurrency.symbol || "$",
          tier: calculateTier(loyaltyPoints),
          favoriteItems: topItems,
          orderHistory: customer.orders.map(order => ({
            id: order.id,
            date: order.createdAt,
            items: JSON.parse(order.items as string).map((item: any) => item.name),
            total: Number(order.totalAmount),
            status: order.status,
          })),
          monthlySpending: monthlySpending.map(month => ({
            month: new Date(month.createdAt).toLocaleString('default', { month: 'short' }),
            amount: Number(month._sum.totalAmount),
          })),
        }
      })
    )

    return NextResponse.json(customersWithMetrics)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

function calculateTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" {
  if (points >= 10000) return "Platinum"
  if (points >= 5000) return "Gold"
  if (points >= 1000) return "Silver"
  return "Bronze"
} 
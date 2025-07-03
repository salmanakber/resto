import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
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


    const customer = await prisma.customer.findUnique({
      where: {
        id: params.id,
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
            orderNumber: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    })

    if (!customer) {
      return new NextResponse("Customer not found", { status: 404 })
    }
    let customerPRofileImage = '';
    const prilfeImage = await prisma.user.findUnique({
      where: {
        id: customer.userId || "",
      },
      select: {
        profileImage: true,
      },    
    })
    if(prilfeImage)
    {
      customerPRofileImage = prilfeImage.profileImage || '';
    }

    // Get loyalty points
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
    

    // Calculate metrics
    const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const totalOrders = customer.orders.length
    const lastOrderDate = customer.orders[0]?.createdAt || null

    // Get monthly spending
    const monthlySpending = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        customerId: customer.id,
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
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


      const now = new Date();
const monthsRange = Array.from({ length: 5 }, (_, i) => {
  const date = new Date(now.getFullYear(), now.getMonth() + i - 2); // -2 to +2 range
  return {
    key: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
    label: date.toLocaleString('default', { month: 'short' }),
  };
});

// Create a lookup from your actual data
const dataMap = new Map(
  monthlySpending.map(item => {
    const date = new Date(item.createdAt);
    const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    return [key, Number(item._sum.totalAmount)];
  })
);

// Final formatted data
const finalMonthlySpending = monthsRange.map(month => ({
  month: month.label,
  amount: dataMap.get(month.key) || 0,
}));


    return NextResponse.json({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phoneNumber,
      status: customer.status,
      address: customer.address,
      loyaltyPoints: loyaltyPoints || 0,
      totalOrders,
      totalSpent,
      lastVisit: lastOrderDate,
      profileImage: customerPRofileImage || "/placeholder.svg",
      joinDate: customer.createdAt,
      tier: calculateTier(loyaltyPoints || 0),
      favoriteItems: topItems,
      orderHistory: customer.orders.map(order => ({
        id: order.id,
        date: order.createdAt,
        items: JSON.parse(order.items as string).map((item: any) => item.name + " x " + item.quantity + " " + item.selectedAddons.map((addon: any) => addon.name).join(", ")),
        total: Number(order.totalAmount),
        orderNumber: order.orderNumber,
        status: order.status,
      })),
      monthlySpending: finalMonthlySpending,
      currency: defaultCurrency.symbol || "$",
    })
  } catch (error) {
    console.error("Error fetching customer:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
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

    const body = await request.json()
    const { firstName, lastName, email, phone, address, status } = body

    // Update customer
    const customer = await prisma.customer.update({
      where: {
        id: params.id,
        restaurantId: restaurantId,
      },
      data: {
        firstName: firstName,
        lastName: lastName,
        email,
        phoneNumber: phone,
        address,
        status,
      }
    })
    
    if (customer) {
     const user = await prisma.user.update({
            where: {
                id: customer.userId,
            },
            data: {
                firstName: firstName,
                lastName: lastName,
                email,
                phoneNumber: phone,
                addresses: {
                    create: {
                        streetAddress: address,
                        city: 'N/A',
                        state: 'N/A',
                        postalCode: 'N/A',
                        country: 'N/A',
                        isDefault: true,
                        type: 'home',
                    }
                }
            }
        })
        return NextResponse.json({
            message: "Customer updated successfully",
            user: user,
            customer: customer,
        })
    }



    return NextResponse.json({
        message: "Customer not found",
    })
  } catch (error) {
    console.error("Error updating customer:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

function calculateTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" {
  if (points >= 10000) return "Platinum"
  if (points >= 5000) return "Gold"
  if (points >= 1000) return "Silver"
  return "Bronze"
} 
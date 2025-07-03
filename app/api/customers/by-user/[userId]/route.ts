import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

 


export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
  ) {
    try {  
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
  

          console.log("params userId owow", params.userId)
  
      const customer = await prisma.customer.findFirst({
        where: { userId: params.userId },
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
  
      // Get loyalty points
      const earned = await prisma.loyaltyPoint.aggregate({
        where: {
          userId: customer.userId || "",
          type: "earn",
          expiresAt: {
            gte: new Date(),
          },
        },
        _sum: {
          points: true,
        },
      });
      
      const redeemed = await prisma.loyaltyPoint.aggregate({
        where: {
          userId: customer.userId || "",
          type: "redeem",
        },
        _sum: {
          points: true,
        },
      });
      
      const availablePoints =
        (earned._sum.points || 0) - (redeemed._sum.points || 0);
      
  
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
        loyaltyPoints: availablePoints,
        totalOrders,
        totalSpent,
        lastVisit: lastOrderDate,
        joinDate: customer.createdAt,
        tier: calculateTier(availablePoints),
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

  function calculateTier(points: number): "Bronze" | "Silver" | "Gold" | "Platinum" {
    if (points >= 10000) return "Platinum"
    if (points >= 5000) return "Gold"
    if (points >= 1000) return "Silver"
    return "Bronze"
  } 
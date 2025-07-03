import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface Order {
  id: string;
  totalAmount: number;
  createdAt: Date;
  restaurantId: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  orders: Order[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  loyaltyPoints: number;
}

interface RestaurantReport {
  restaurantId: string;
  restaurantName: string;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  activeCustomers: number;
  customerRetentionRate: number;
  customers: {
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
    loyaltyPoints: number;
  }[];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({ 
      where: {
        id: session?.user?.id,
      },
      select: {
        role: true,
      },
    })
    
    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all restaurants
    const restaurants = await prisma.user.findMany({
      where: {
        role: {
          name: 'Restaurant',
        },
      },
      select: {
        id: true,
        restaurantName: true,
      },
    })

    // Get all customers with their orders
    const users = await prisma.user.findMany({
      where: {
        role: {
          name: 'Customer',
        },
      },
    })

    const customers = await prisma.customer.findMany({
      where: {
        userId: {
          in: users.map((user) => user.id),
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            restaurantId: true,
          },
        },
      },
    })

    
    // Group customers by restaurant
    const reportData: RestaurantReport[] = restaurants.map((restaurant) => {
      const restaurantCustomers = customers.filter((customer) =>
        customer.orders.some((order) => order.restaurantId === restaurant.id)
      )

      const totalCustomers = restaurantCustomers.length
      const totalOrders = restaurantCustomers.reduce(
        (sum, customer) => sum + customer.orders.filter(order => order.restaurantId === restaurant.id).length,
        0
      )
      const totalRevenue = restaurantCustomers.reduce(
        (sum, customer) => sum + customer.orders
          .filter(order => order.restaurantId === restaurant.id)
          .reduce((orderSum, order) => orderSum + Number(order.totalAmount), 0),
        0
      )
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      // Calculate customer retention (customers with orders in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const activeCustomers = restaurantCustomers.filter((customer) =>
        customer.orders.some(
          (order) =>
            order.restaurantId === restaurant.id &&
            new Date(order.createdAt) > thirtyDaysAgo
        )
      ).length

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.restaurantName || 'Unnamed Restaurant',
        totalCustomers,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        activeCustomers,
        customerRetentionRate: totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0,
        customers: restaurantCustomers.map((customer) => ({
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phoneNumber: customer.phoneNumber || '',
          totalOrders: customer.orders.filter(order => order.restaurantId === restaurant.id).length,
          totalSpent: customer.orders
            .filter(order => order.restaurantId === restaurant.id)
            .reduce((sum, order) => sum + Number(order.totalAmount), 0),
          lastOrderDate: customer.orders
            .filter(order => order.restaurantId === restaurant.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt.toISOString() || null,
          loyaltyPoints: customer.loyaltyPoints || 0,
        })),
      }
    })

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error fetching customer report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer report' },
      { status: 500 }
    )
  }
} 
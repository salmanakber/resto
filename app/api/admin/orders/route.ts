import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns'


import { Prisma } from '@prisma/client'

type RestaurantUser = {
  id: string
  firstName: string
  restaurantName: string | null
  email: string
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const view = searchParams.get('view') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Base query for orders
    const baseQuery = {
      where: {
        ...(restaurantId && restaurantId !== 'all' ? { restaurantId } : {}),
        ...(startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },

      },
    }

    // Fetch orders
    const orders = await prisma.order.findMany(baseQuery)

    // Fetch restaurant users
    const restaurantUsers = await prisma.user.findMany({
      where: {
        role: {
          name: 'Restaurant',
        },
      },
      select: {
        id: true,
        firstName: true,
        restaurantName: true,
        email: true,
      },
    }) as RestaurantUser[]

const location = await prisma.location.findMany({
  where: {
    userId: restaurantUsers.id,
  },
  select: {
    id: true,
    userId: true,
    name: true,
    address: true,
  },
}) as Location[]




    // Add restaurant data to orders
    const ordersWithRestaurant = orders.map(order => ({
      ...order,
      restaurant: restaurantUsers.find(user => user.id === order.restaurantId) || null,
      location: location.find(loc => loc.userId === order.restaurantId) || null,
    }))

    // Get time series data
    

    const now = new Date()
    const timeRanges = {
      daily: {
        start: startOfDay(now),
        end: endOfDay(now),
        format: 'HH:mm',
      },
      weekly: {
        start: startOfWeek(now),
        end: endOfWeek(now),
        format: 'EEE',
      },
      monthly: {
        start: startOfMonth(now),
        end: endOfMonth(now),
        format: 'dd',
      },
      yearly: {
        start: startOfYear(now),
        end: endOfYear(now),
        // we won’t use this format in yearly grouping but keep for consistency
        format: 'yyyy-MM',
      },
    }
    
    const timeSeriesData = await Promise.all(
      Object.entries(timeRanges).map(async ([range, config]) => {
        const orders = await prisma.order.findMany({
          where: {
            ...baseQuery.where,
            createdAt: {
              gte: config.start,
              lte: config.end,
            },
          },
          select: {
            createdAt: true,
            totalAmount: true,
          },
        })
    
        let grouped: Record<string, { orders: number; revenue: number }> = {}
    
        if (range === 'yearly') {
          // Group by month in format 'yyyy-MM' (e.g. '2025-01')
          grouped = orders.reduce((acc, order) => {
            const key = format(new Date(order.createdAt), 'yyyy-MM')
            if (!acc[key]) {
              acc[key] = { orders: 0, revenue: 0 }
            }
            acc[key].orders += 1
            acc[key].revenue += Number(order.totalAmount)
            return acc
          }, {} as Record<string, { orders: number; revenue: number }>)
    
          // Ensure all 12 months exist even if zero orders
          const year = format(now, 'yyyy')
          for (let month = 1; month <= 12; month++) {
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`
            if (!grouped[monthKey]) {
              grouped[monthKey] = { orders: 0, revenue: 0 }
            }
          }
        } else {
          // Existing grouping logic (by format string)
          grouped = orders.reduce((acc, order) => {
            const key = format(new Date(order.createdAt), config.format)
            if (!acc[key]) {
              acc[key] = { orders: 0, revenue: 0 }
            }
            acc[key].orders += 1
            acc[key].revenue += Number(order.totalAmount)
            return acc
          }, {} as Record<string, { orders: number; revenue: number }>)
        }
    
        // Convert grouped data to sorted array
        const data = Object.entries(grouped)
          .map(([date, { orders, revenue }]) => ({
            date,
            orders,
            revenue,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
    
        return {
          range,
          data,
        }
      })
    )
    
    

    // Get reporting data
    const reporting = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum: number, order) => sum + Number(order.totalAmount), 0).toString(),
      ordersByStatus: await prisma.order.groupBy({
        by: ['status'],
        where: baseQuery.where,
        _count: true,
      }),
      ordersByMonth: await prisma.order.groupBy({
        by: ['restaurantId'],
        where: baseQuery.where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
      }),
      topRestaurants: await prisma.order.groupBy({
        by: ['restaurantId'],
        where: baseQuery.where,
        _count: true,
        _sum: {
          totalAmount: true,
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc',
          },
        },
        take: 5,
      }),
      averageOrderValue: (
        orders.reduce((sum: number, order) => sum + Number(order.totalAmount), 0) / orders.length || 0
      ).toString(),
      timeSeries: timeSeriesData,
    }

    // Add restaurant names to top restaurants
    reporting.topRestaurants = reporting.topRestaurants.map((r) => ({
      ...r,
      restaurantName: restaurantUsers.find((res) => res.id === r.restaurantId)?.restaurantName || 'Unknown',
    }))

    return NextResponse.json({
      orders: ordersWithRestaurant,
      reporting,
    })
  } catch (error) {
    console.error('Error in orders API:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
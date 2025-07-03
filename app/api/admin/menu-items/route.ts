import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const view = searchParams.get('view') || 'list'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Base query
    const where = {
      ...(restaurantId && { userId: restaurantId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    }

    // Get menu items with related data
    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get reporting data
    const currentMonth = new Date()
    const lastMonth = subMonths(currentMonth, 1)

    const [
      totalItems,
      totalCategories,
      itemsByCategory,
      topRatedItems,
      averageRating,
      popularItems,
    ] = await Promise.all([
      // Total items
      prisma.menuItem.count({ where }),
      
      // Total categories
      prisma.menuCategory.count({
        where: {
          userId: restaurantId || undefined,
        },
      }),

      // Items by category
      prisma.menuItem.groupBy({
        by: ['categoryId'],
        where,
        _count: true,
        _avg: {
          price: true,
        },
      }),

      // Top rated items
      prisma.menuItem.findMany({
        where,
        include: {
          reviews: true,
          category: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          reviews: {
            _avg: {
              rating: 'desc',
            },
          },
        },
        take: 5,
      }),

      // Average rating
      prisma.menuItemReview.aggregate({
        where: {
          menuItem: {
            userId: restaurantId || undefined,
          },
        },
        _avg: {
          rating: true,
        },
      }),

      // Popular items (most ordered)
      prisma.menuItem.findMany({
        where,
        include: {
          category: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          reviews: {
            _count: 'desc',
          },
        },
        take: 5,
      }),
    ])

    // Get category details for items by category
    const itemsByCategoryWithDetails = await Promise.all(
      itemsByCategory.map(async (category) => {
        const details = await prisma.menuCategory.findUnique({
          where: { id: category.categoryId },
          select: { name: true },
        })
        return {
          ...category,
          categoryName: details?.name,
        }
      })
    )

    return NextResponse.json({
      menuItems,
      reporting: {
        totalItems,
        totalCategories,
        itemsByCategory: itemsByCategoryWithDetails,
        topRatedItems,
        averageRating: averageRating._avg.rating || 0,
        popularItems,
      },
    })
  } catch (error) {
    console.error('[MENU_ITEMS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
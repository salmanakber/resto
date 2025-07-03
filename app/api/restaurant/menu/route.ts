import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        userId: user.id
      },
      include: {
        category: true,
        services: {
          include: {
            service: true
          }
        },
        reviews: true
      }
    })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await request.json()
    const { name, description, price, categoryId, image, tags, isAvailable, isPopular, calories, prepTime, services } = body

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price,
        categoryId,
        userId: user.id,
        image,
        tags,
        isAvailable,
        isPopular,
        calories,
        prepTime,
        services: {
          create: services.map((serviceId: string) => ({
            service: {
              connect: { id: serviceId }
            }
          }))
        }
      },
      include: {
        category: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error creating menu item:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { 
      name, 
      description, 
      price, 
      categoryIds, 
      image, 
      tags, 
      isAvailable, 
      isPopular, 
      calories, 
      prepTime, 
      services 
    } = body

    // Validate required fields
    if (!name || !description || !price || !categoryIds || categoryIds.length === 0) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Create the menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: categoryIds[0], // Use the first category as the primary category
        userId: user.id,
        image: image || null,
        tags: JSON.stringify(tags || []),
        isAvailable: isAvailable ?? true,
        isPopular: isPopular ?? false,
        calories: calories ? parseInt(calories) : null,
        prepTime: prepTime || null,
        services: services ? {
          create: services.map((serviceId: string) => ({
            service: {
              connect: { id: serviceId }
            }
          }))
        } : undefined
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
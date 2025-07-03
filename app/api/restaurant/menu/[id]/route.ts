import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    console.log("id sss" , id);
    if (!id) {
      return new NextResponse('Menu item ID is required', { status: 400 })
    }

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

    const menuItem = await prisma.menuItem.findFirst({
      where: { 
        id,
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

    if (!menuItem) {
      return new NextResponse('Menu item not found', { status: 404 })
    }

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    if (!id) {
      return new NextResponse('Menu item ID is required', { status: 400 })
    }

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

    // Check if menu item exists and belongs to user
    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingMenuItem) {
      return new NextResponse('Menu item not found', { status: 404 })
    }

    const body = await request.json()
    const { name, description, price, categoryId, image, tags, isAvailable, isPopular, calories, prepTime, services } = body

    // Get all existing services for the user
    const existingServices = await prisma.service.findMany({
      where: {
        userId: user.id
      }
    })

    // Separate existing and new services
    const existingServiceIds = services.filter((serviceId: string) => 
      existingServices.some(s => s.id === serviceId)
    )

    // Update the menu item
    const updateData: any = {
      name,
      description,
      price,
      categoryId,
      image,
      tags,
      isAvailable,
      isPopular,
      calories,
      prepTime
    }

    // First, delete existing services
    await prisma.menuItemService.deleteMany({
      where: { menuItemId: id }
    })

    // Create new menu item services if provided
    if (services && services.length > 0) {
      // Create the menu item services
      for (const service of services) {
        // Check if service exists
        let serviceId = service.serviceId
        if (serviceId.startsWith('temp-')) {
          // Create new service
          const newService = await prisma.service.create({
            data: {
              name: service.name || 'New Service',
              price: service.price,
              userId: user.id
            }
          })
          serviceId = newService.id
        }

        await prisma.menuItemService.create({
          data: {
            menuItemId: id,
            serviceId: serviceId,
          }
        })
      }
    }

    const menuItem = await prisma.menuItem.update({
      where: { 
        id,
        userId: user.id
      },
      data: updateData,
      include: {
        category: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })
    console.log("services", services)
    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error updating menu item:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    if (!id) {
      return new NextResponse('Menu item ID is required', { status: 400 })
    }

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

    // Check if menu item exists and belongs to user
    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingMenuItem) {
      return new NextResponse('Menu item not found', { status: 404 })
    }

    // First, delete associated services and reviews
    await prisma.menuItemService.deleteMany({
      where: { menuItemId: id }
    })
    await prisma.menuItemReview.deleteMany({
      where: { menuItemId: id }
    })

    // Then delete the menu item
    await prisma.menuItem.delete({
      where: { 
        id,
        userId: user.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session?.user?.role !== 'Restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    

    const categories = await prisma.MenuCategory.findMany({
      where: {
        userId: user.id
      },
      include: {
        children: {
          include: {
            children: true // Include nested children
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })


    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching menu categories:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch menu categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session?.user?.role !== 'Restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    
    
    const { name, description, image, isActive, parentId, order } = body

    // Validate parentId if it exists
    if (parentId) {
      const parentCategory = await prisma.menuCategory.findUnique({
        where: { id: parentId }
      })
      
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.menuCategory.create({
      data: {
        name,
        description,
        image,
        isActive: isActive ?? true,
        order: order ?? 0,
        userId: user.id,
        parentId: parentId || null
      },
      include: {
        children: true
      }
    })

    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating menu category:', error)
    return NextResponse.json(
      { error: 'Failed to create menu category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session?.user?.role !== 'Restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, image, isActive, parentId } = body

    const category = await prisma.menuCategory.update({
      where: {
        id,
        userId: user.id,
      },
      data: {
        name,
        description,
        image,
        isActive,
        parentId,
      },
      include: {
        children: true
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating menu category:', error)
    return NextResponse.json(
      { error: 'Failed to update menu category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
     if (!session?.user || session?.user?.role !== 'Restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Delete the category and all its children recursively
    await prisma.menuCategory.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id }
        ],
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu category:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu category' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session?.user?.role !== 'Restaurant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const categoryId = params.id;
   
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    
    const { name, description, image, isActive, order } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.menuCategory.findFirst({
      where: {
        id: categoryId,
        userId: user.id,
      },
    })

    if (!existingCategory) {
      
      return NextResponse.json(
        { 
          error: 'Category not found or unauthorized',
          details: `Category with ID ${categoryId} not found for user ${user.id}`
        },
        { status: 404 }
      )
    }

    const category = await prisma.menuCategory.update({
      where: {
        id: categoryId,
        userId: user.id,
      },
      data: {
        name,
        description,
        image,
        isActive,
        order,
      },
    })

    
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating menu category:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update menu category',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session?.user?.role !== 'Restaurant') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
  
      const user = await prisma.user.findUnique({
        where: {
          email: session?.user?.email,
        },
      })

    await prisma.menuCategory.delete({
      where: {
        id: params.id,
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
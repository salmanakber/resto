import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

   if(!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   const user = await prisma.user.findUnique({  
    where: { email: session.user.email },
    include: {
      role: true,
    },
   })
   if (!user || user.role.name !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }

    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    const whereClause: any = {}
    if (restaurantId) {
      whereClause.userId = restaurantId
    }

    const categories = await prisma.menuCategory.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            restaurantName: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: true,
      },
    })
    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    const category = await prisma.menuCategory.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
} 
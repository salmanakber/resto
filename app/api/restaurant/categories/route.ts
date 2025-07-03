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
    

    const categories = await prisma.menuCategory.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
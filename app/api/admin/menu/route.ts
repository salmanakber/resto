import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as z from 'zod'

const menuItemSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  image: z.string().optional(),
  tags: z.string(),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  calories: z.number().optional(),
  order: z.number().optional(),
  prepTime: z.string().optional(),
  categoryId: z.string(),
  userId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = menuItemSchema.parse(json)

    const menuItem = await prisma.menuItem.create({
      data: body,
      include: {
        category: true,
        user: true,
      },
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: true,
        user: true,
      },
      orderBy: {
        category: {
          name: 'asc',
        },
        name: 'asc',
      },
    })

    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('[MENU_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
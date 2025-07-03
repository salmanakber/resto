import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if(!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    })
    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const setting = await prisma.setting.findUnique({
      where: { key: 'brand_assets' },
    })

    return NextResponse.json(setting || { value: null })
  } catch (error) {
    console.error('Error fetching brand assets:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if(!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    })
    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        category: 'brand',
        description: 'Brand assets (logo and favicon) for the website',
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error saving brand assets:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
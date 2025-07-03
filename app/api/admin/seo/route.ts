import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const setting = await prisma.setting.findUnique({
      where: { key: 'seo_settings' },
    })

    return NextResponse.json(setting || { value: null })
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        category: 'seo',
        description: 'SEO settings for the website',
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error saving SEO settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
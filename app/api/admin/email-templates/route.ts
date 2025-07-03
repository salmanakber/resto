import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('[EMAIL_TEMPLATES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const requestBody = await req.json()
    const { name, subject, body, variables, description, isActive } = requestBody

    if (!name || !subject || !body || !variables) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body,
        variables: JSON.stringify(variables),
        description,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('[EMAIL_TEMPLATES_POST]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
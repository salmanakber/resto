import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: {
    templateName: string
  }
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const template = await prisma.emailTemplate.findUnique({
      where: {
        name: params.templateName,
      },
    })

    if (!template) {
      return new NextResponse('Template not found', { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const requestBody = await req.json()
    const { subject, body, variables, description, isActive } = requestBody

    if (!subject || !body || !variables) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const template = await prisma.emailTemplate.update({
      where: {
        name: params.templateName,
      },
      data: {
        subject,
        body,
        variables: (variables),
        description,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await prisma.emailTemplate.delete({
      where: {
        name: params.templateName,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
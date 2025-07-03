import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  orderNotifications: z.boolean(),
  marketingNotifications: z.boolean(),
  systemNotifications: z.boolean(),
  pushNotifications: z.boolean(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        role: true,
      },
    })
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    if (user.role.name !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const settings = await prisma.notificationSettings.findFirst()

    return NextResponse.json(settings)
  } catch (error) {
    console.error('[NOTIFICATION_SETTINGS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = notificationSettingsSchema.parse(json)

    const settings = await prisma.notificationSettings.upsert({
      where: {
        id: '1',
      },
      update: {
        emailNotifications: body.emailNotifications,
        orderNotifications: body.orderNotifications,
        marketingNotifications: body.marketingNotifications,
        systemNotifications: body.systemNotifications,
        pushNotifications: body.pushNotifications,
      },
      create: {
        id: '1',
        emailNotifications: body.emailNotifications,
        orderNotifications: body.orderNotifications,
        marketingNotifications: body.marketingNotifications,
        systemNotifications: body.systemNotifications,
        pushNotifications: body.pushNotifications,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 })
    }

    console.error('[NOTIFICATION_SETTINGS_PUT]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
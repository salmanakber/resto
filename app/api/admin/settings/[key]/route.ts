import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

const settingSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  category: z.string(),
  isPublic: z.boolean().default(false),
})

interface SettingRouteProps {
  params: {
    key: string
  }
}

export async function GET(req: Request, { params }: SettingRouteProps) {
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

    const setting = await prisma.setting.findUnique({
      where: {
        key: params.key,
      },
    })

    if (!setting) {
      return new NextResponse('Setting not found', { status: 404 })
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error('[SETTING_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: SettingRouteProps) {
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

    const json = await req.json()
    const body = settingSchema.parse(json)

    const setting = await prisma.setting.update({
      where: {
        key: params.key,
      },
      data: body,
    })

    return NextResponse.json(setting)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    console.error('[SETTING_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: SettingRouteProps) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await prisma.setting.delete({
      where: {
        key: params.key,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[SETTING_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
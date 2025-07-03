import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.string().min(1),
  passwordExpiry: z.string().min(1),
  maxLoginAttempts: z.string().min(1),
  ipWhitelist: z.string().optional(),
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

    const settings = await prisma.securitySettings.findFirst()

    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SECURITY_SETTINGS_GET]', error)
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
    const body = securitySettingsSchema.parse(json)

    const settings = await prisma.securitySettings.upsert({
      where: {
        id: '1',
      },
      update: {
        twoFactorAuth: body.twoFactorAuth,
        sessionTimeout: body.sessionTimeout,
        passwordExpiry: body.passwordExpiry,
        maxLoginAttempts: body.maxLoginAttempts,
        ipWhitelist: body.ipWhitelist,
      },
      create: {
        id: '1',
        twoFactorAuth: body.twoFactorAuth,
        sessionTimeout: body.sessionTimeout,
        passwordExpiry: body.passwordExpiry,
        maxLoginAttempts: body.maxLoginAttempts,
        ipWhitelist: body.ipWhitelist,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 422 })
    }

    console.error('[SECURITY_SETTINGS_PUT]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

export async function PATCH(req: Request) {
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

    const requestBody = await req.json()
    const updateSettings = await prisma.setting.update({
      where: {
        key: 'currency',
      },
      data: requestBody,
    })
    return NextResponse.json(updateSettings)
  } catch (error) {
    console.error('[CURRENCY_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
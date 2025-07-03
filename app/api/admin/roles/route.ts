import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as z from 'zod'

const roleSchema = z.object({
  name: z.string().min(2),
  displayName: z.string().min(2),
  description: z.string().optional(),
  access_area: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = roleSchema.parse(json)

    const role = await prisma.role.create({
      data: body,
    })

    return NextResponse.json(role)
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

    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('[ROLES_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
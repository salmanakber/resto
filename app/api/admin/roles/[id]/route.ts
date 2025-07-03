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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const role = await prisma.role.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!role) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = roleSchema.parse(json)

    const role = await prisma.role.update({
      where: {
        id: params.id,
      },
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Check if role is in use
    const usersWithRole = await prisma.user.findFirst({
      where: {
        roleId: params.id,
      },
    })

    if (usersWithRole) {
      return new NextResponse(
        'Cannot delete role that is assigned to users',
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
} 
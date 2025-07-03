import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hash } from 'bcryptjs'
import * as z from 'zod'

const userSchema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }).optional(),
  roleId: z.string({
    required_error: 'Please select a role.',
  }),
})

interface UserRouteProps {
  params: {
    id: string
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      include: {
        role: true,
      },
    })

    if (!user) {
      return new NextResponse('Not found', { status: 404 })
    }

    return NextResponse.json(user)
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

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = userSchema.parse(json)

    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: body,
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: UserRouteProps) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = userSchema.parse(json)

    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    const existingEmail = await prisma.user.findUnique({
      where: {
        email: body.email,
        NOT: {
          id: params.id,
        },
      },
    })

    if (existingEmail) {
      return new NextResponse('Email already exists', { status: 400 })
    }

    const data: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      roleId: body.roleId,
    }

    if (body.password) {
      data.password = await hash(body.password, 12)
    }

    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data,
      include: {
        role: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    console.error('[USER_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: UserRouteProps) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    await prisma.user.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[USER_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
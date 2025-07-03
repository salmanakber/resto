import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as z from 'zod'

const locationSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(5),
  country: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  description: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const location = await prisma.location.findUnique({
      where: {
        id: params.locationId
      }
    })

    if (!location) {
      return new NextResponse('Location not found', { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('[LOCATION_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = locationSchema.parse(json)

    const location = await prisma.location.update({
      where: {
        id: params.locationId,
      },
      data: body,
    })

    return NextResponse.json(location)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await prisma.location.delete({
      where: {
        id: params.locationId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[LOCATION_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
  const user = await prisma.user.findUnique({
    where: {
      email: session?.user?.email,
    },
    include: {
      role: true,
    },
  })

  if (!user || user.role.name !== 'Admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }
    

    const body = await req.json()
    const { name, address, timeZone, lat, lng, isActive } = body

    const location = await prisma.location.update({
      where: {
        id: params.locationId
      },
      data: {
        name,
        address,
        timeZone,
        lat: lat.toString(),
        lng: lng.toString(),
        isActive
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('[LOCATION_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
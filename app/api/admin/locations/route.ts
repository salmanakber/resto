import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as z from 'zod'

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  lat: z.number(),
  lng: z.number(),
  isActive: z.boolean().default(true),
})

export async function POST(req: Request) {
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

    const json = await req.json()
    const body = locationSchema.parse(json)

    const location = await prisma.location.create({
      data: {
        ...body,
        lat: body.lat.toString(),
        lng: body.lng.toString(),
  
      },
    })

    return NextResponse.json(location)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function GET(req: Request) {
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

    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        timeZone: true,
        lat: true,
        lng: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('[LOCATIONS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(req: Request) {
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

    const json = await req.json()
    const body = locationSchema.parse(json)

    const location = await prisma.location.update({
      where: { id: json.id },
      data: {
        ...body,
        lat: body.lat.toString(),
        lng: body.lng.toString(),
      },
    })

    return NextResponse.json(location)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}
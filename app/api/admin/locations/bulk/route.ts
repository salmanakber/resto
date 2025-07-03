import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email
      },
      include: {
        role: true
      }

    })
    if (!user || user.role.name !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { ids, isActive } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Invalid request body', { status: 400 })
    }

    const updatedLocations = await prisma.location.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        isActive
      }
    })

    return NextResponse.json(updatedLocations)
  } catch (error) {
    console.error('[LOCATIONS_BULK_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email
      },
      include: {
        role: true
      }
    })
    if (!user || user.role.name !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return new NextResponse('Invalid request body', { status: 400 })
    }

    // Check if any of the locations have associated restaurants or users
    const locations = await prisma.location.findMany({
      where: {
        id: {
          in: ids
        }
      },
      include: {
        users: true
      }
    })

    const locationsWithDependencies = locations.filter(
      location => location.users.length > 0
    )

    if (locationsWithDependencies.length > 0) {
      return new NextResponse(
        'Cannot delete locations with associated restaurants or users',
        { status: 400 }
      )
    }

    const deletedLocations = await prisma.location.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json(deletedLocations)
  } catch (error) {
    console.error('[LOCATIONS_BULK_DELETE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 
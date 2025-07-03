import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ServiceInput {
  name: string
  description?: string
  price?: number
}

interface Service {
  id: string
  name: string
  description: string | null
  price: number | null
  userId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await request.json()
    const { services } = body

    if (!Array.isArray(services)) {
      return new NextResponse('Services must be an array', { status: 400 })
    }

    // Validate each service
    for (const service of services) {
      if (!service.name || typeof service.name !== "string") {
        return NextResponse.json(
          { error: "Each service must have a valid name" },
          { status: 400 }
        )
      }
    }

    // Check for existing services with the same names for this user
    const existingServices = await prisma.service.findMany({
      where: {
        userId: user.id,
        name: {
          in: services.map(s => s.name)
        }
      }
    })

    // Filter out services that already exist
    const newServices = services.filter(
      service => !existingServices.some((existing: Service) => existing.name === service.name)
    )

    if (newServices.length === 0) {
      return NextResponse.json(existingServices)
    }

    // Create new services
    const createdServices = await prisma.service.createMany({
      data: newServices.map((service: ServiceInput) => ({
        name: service.name,
        description: service.description || null,
        price: service.price ? parseFloat(service.price) : null,
        userId: user.id
      }))
    })

    // Fetch all services (existing and newly created)
    const allServices = await prisma.service.findMany({
      where: {
        userId: user.id,
        name: {
          in: services.map(s => s.name)
        }
      }
    })

    return NextResponse.json(allServices)
  } catch (error) {
    console.error('Error creating services:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
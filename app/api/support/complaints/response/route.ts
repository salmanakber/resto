import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { complaintId, message, isInternal } = await request.json()

    // Get the complaint
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId }
    })
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!complaint) {
      return new NextResponse('Complaint not found', { status: 404 })
    }

    // Create the response
    const response = await prisma.complaintResponse.create({
      data: {
        complaintId,
        userId: session.user.id,
        message,
        isInternal: isInternal || false
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in complaint response:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
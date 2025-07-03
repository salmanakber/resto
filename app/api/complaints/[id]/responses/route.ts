import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEmailTemplate, sendEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const responses = await prisma.complaintResponse.findMany({
      where: { complaintId: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    })


    return NextResponse.json(responses)
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const response = await prisma.complaintResponse.create({
      data: {
        message,
        complaintId: params.id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: complaint.userId },
    })

    const restaurant = await prisma.user.findUnique({
      where: { id: user?.restaurantId },
    })
    await sendEmail({
      to: user.email,
      subject: (await getEmailTemplate('complain_update', { userName: user.firstName, restaurantName: restaurant.restaurantName, supportLink: `${process.env.NEXTAUTH_URL}/complaints/${params.id}` })).subject,
      html: (await getEmailTemplate('complain_update', { userName: user.firstName, restaurantName: restaurant.restaurantName, supportLink: `${process.env.NEXTAUTH_URL}/complaints/${params.id}` })).body
    })

    // Update complaint status to in_progress if it was pending
    if (complaint.status === 'pending') {
      await prisma.complaint.update({
        where: { id: params.id },
        data: { status: 'in_progress' },
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
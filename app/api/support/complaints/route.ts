import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/support/complaints - Get all complaints for a user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    const complaints = await prisma.complaint.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
        ...(type && { type }),
        ...(category && { category }),
      },
      include: {
        responses: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/support/complaints - Create a new complaint
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        restaurantId: true,
      },
    });
    if(!user?.restaurantId) {
      return NextResponse.json({ error: 'You are not authorized because you have not ordered yet to any restaurant' }, { status: 404 });
    }

    const body = await request.json();
    const { type, subject, description, category, subCategory, orderId, attachments, tags } = body;

    const complaint = await prisma.complaint.create({
      data: {
        userId: session.user.id,
        type,
        subject,
        description,
        category,
        subCategory,
        orderId,
        attachments: attachments ? JSON.stringify(attachments) : null,
        tags: tags ? JSON.stringify(tags) : null,
        restaurantId: body.resturantId,
      },
    });

    return NextResponse.json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
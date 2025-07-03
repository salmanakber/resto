import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all IT access records
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const itAccess = await prisma.iTAccess.findMany({
      where: {
        user: {
          restaurantId: user.restaurantId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(itAccess || []);
  } catch (error) {
    console.error('Error fetching IT access:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST new IT access record
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const body = await req.json();
    const { userId, expiryDate } = body;

    if (!userId || !expiryDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!targetUser || targetUser.restaurantId !== user.restaurantId) {
      return new NextResponse('Invalid user or unauthorized', { status: 403 });
    }

    const itAccess = await prisma.iTAccess.create({
      data: {
        userId,
        expiryDate: new Date(expiryDate),
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(itAccess);
  } catch (error) {
    console.error('Error creating IT access:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE IT access record
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing ID parameter', { status: 400 });
    }

    const itAccess = await prisma.iTAccess.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!itAccess || itAccess.user.restaurantId !== user.restaurantId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    await prisma.iTAccess.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting IT access:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
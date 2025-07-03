import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const LoggedInUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        role: true,
      },
    });
    if (!LoggedInUser || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(LoggedInUser.role.name)) {
      return new NextResponse("User not found", { status: 404 });
    }
    if (!LoggedInUser.restaurantId) {
      return new NextResponse("User is not associated with a restaurant", { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear());
    const employeeId = searchParams.get('employeeId');

    const where: any = {
      month,
      year,
      ...(employeeId ? { employeeId } : {}),
    };

    
    const attendance = await prisma.attendance.findMany({
      where: {
        ...where, // any other conditions you're passing
        employee: {
          restaurantId: LoggedInUser.restaurantId,
        },
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const {
      employeeId,
      date,
      checkIn,
      checkOut,
      status,
      notes,
    } = data;

    // Extract month and year from date
    const attendanceDate = new Date(date);
    const month = attendanceDate.getMonth() + 1;
    const year = attendanceDate.getFullYear();

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: attendanceDate,
        checkIn: new Date(checkIn),
        checkOut: checkOut ? new Date(checkOut) : null,
        status,
        notes,
        month,
        year,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    );
  }
} 

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        role: true,
      },
    });
    if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
      const attendance = await prisma.attendance.delete({
        where: {
          id: id,
        },
      });
      return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    );
  }
}
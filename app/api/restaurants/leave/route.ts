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
    const status = searchParams.get('status') || 'on_leave';
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const where: any = {
      tempStatus: {
        not: 'active',
      },
      restaurantId: LoggedInUser.restaurantId,
      ...(employeeId ? { id: employeeId } : {}),
      ...(startDate ? { leaveStartDate: { gte: new Date(startDate) } } : {}),
      ...(endDate ? { leaveEndDate: { lte: new Date(endDate) } } : {}),
    };
    

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        position: true,
        department: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        typeLeave: true,
        leaveStartDate: true,
        leaveEndDate: true,
        tempStatus: true,
        note: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching leave records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave records' },
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

    const data = await req.json();
    const {
      employeeId,
      startDate,
      endDate,
      type,
      notes,
      status,
    } = data;

    const updateStatus = (status && status === 'active') ? { tempStatus: 'none', status: 'active' } : (status === 'on_leave' ? { status: 'on_leave', tempStatus: status } : { status: 'active', tempStatus: status });

    // Update employee status to on_leave
    
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...updateStatus,
        typeLeave: type,
        note: notes,
        leaveStartDate: new Date(startDate),
        leaveEndDate: new Date(endDate),
      },
    });
  
    // Create a leave record in attendance for tracking
    if (status === 'on_leave') {
      const start = new Date(startDate);
      const end = new Date(endDate);
    
      const leaveDays = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        leaveDays.push(new Date(d)); // clone to avoid mutation issues
      }
    
      const attendanceRecords = await prisma.$transaction(
        leaveDays.map((date) =>
          prisma.attendance.create({
            data: {
              employeeId,
              date,
              status: 'absent',
              notes: `${type} leave: ${notes || ''}`,
              month: date.getMonth() + 1,
              year: date.getFullYear(),
            },
          })
        )
      );
      
      return NextResponse.json({ employee, attendanceRecords });
    }
    
    return NextResponse.json({ employee });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { employeeId, status } = data;

    console.log(data , "employeeId and status dss 123");
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: status === 'approved' ? 'active' : status,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error updating leave status:', error);
    return NextResponse.json(
      { error: 'Failed to update leave status' },
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

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: 'active',
      },
    });

    return NextResponse.json({ message: 'Leave request cancelled', employee });
  } catch (error) {
    console.error('Error cancelling leave request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel leave request' },
      { status: 500 }
    );
  }
} 
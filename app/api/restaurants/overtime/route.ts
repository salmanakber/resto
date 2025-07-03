import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { employeeId, date, hours, rate, notes } = data;

    // Validate input
    if (!employeeId || !date || !hours || !rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (hours <= 0) {
      return NextResponse.json(
        { error: 'Hours must be greater than 0' },
        { status: 400 }
      );
    }

    if (rate <= 0) {
      return NextResponse.json(
        { error: 'Rate must be greater than 0' },
        { status: 400 }
      );
    }

    // Calculate amount
    const amount = Number(hours) * Number(rate);

    // Get month and year from date
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create overtime record
    const overtime = await prisma.overtime.create({
      data: {
        employeeId,
        date: new Date(date),
        month,
        year,
        hours: Number(hours),
        rate: Number(rate),
        amount,
        notes,
      },
    });

    // Update payroll if exists for this month
    const payroll = await prisma.payroll.findFirst({
      where: {
        employeeId,
        month,
        year,
      },
    });

    if (payroll) {
      await prisma.payroll.update({
        where: { id: payroll.id },
        data: {
          overtimePay: {
            increment: amount,
          },
          netSalary: {
            increment: amount,
          },
          overtimeRecords: {
            connect: { id: overtime.id },
          },
        },
      });
    }

    return NextResponse.json(overtime);
  } catch (error) {
    console.error('Error creating overtime:', error);
    return NextResponse.json(
      { error: 'Failed to create overtime record' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const overtime = await prisma.overtime.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(month && year && { month: parseInt(month), year: parseInt(year) }),
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(overtime);
  } catch (error) {
    console.error('Error fetching overtime:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overtime records' },
      { status: 500 }
    );
  }
} 
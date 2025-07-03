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
    const { employeeId, date, amount, type, notes } = data;

    // Validate input
    if (!employeeId || !date || !amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate tip type
    const validTypes = ['individual', 'pooled'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid tip type' },
        { status: 400 }
      );
    }

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

    // Create tip record
    const tip = await prisma.tip.create({
      data: {
        employeeId,
        date: new Date(date),
        month,
        year,
        amount: Number(amount),
        type,
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
          tipsAmount: {
            increment: Number(amount),
          },
          netSalary: {
            increment: Number(amount),
          },
          tipRecords: {
            connect: { id: tip.id },
          },
        },
      });
    }

    return NextResponse.json(tip);
  } catch (error) {
    console.error('Error creating tip:', error);
    return NextResponse.json(
      { error: 'Failed to create tip record' },
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
    const type = searchParams.get('type');

    const tips = await prisma.tip.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(month && year && { month: parseInt(month), year: parseInt(year) }),
        ...(type && { type }),
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

    return NextResponse.json(tips);
  } catch (error) {
    console.error('Error fetching tips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tip records' },
      { status: 500 }
    );
  }
} 
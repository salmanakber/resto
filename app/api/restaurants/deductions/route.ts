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
    const { employeeId, type, amount, description, startDate, endDate } = data;

    // Validate input
    if (!employeeId || !type || !amount || !startDate) {
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

    // Validate deduction type
    const validTypes = ['tax', 'insurance', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid deduction type' },
        { status: 400 }
      );
    }

    // Get month and year from startDate
    const dateObj = new Date(startDate);
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

    // Create deduction record
    const deduction = await prisma.deduction.create({
      data: {
        employeeId,
        type,
        amount: Number(amount),
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        month,
        year,
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
          deductions: {
            increment: Number(amount),
          },
          netSalary: {
            decrement: Number(amount),
          },
          deductionRecords: {
            connect: { id: deduction.id },
          },
        },
      });
    }

    return NextResponse.json(deduction);
  } catch (error) {
    console.error('Error creating deduction:', error);
    return NextResponse.json(
      { error: 'Failed to create deduction record' },
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
    const type = searchParams.get('type');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const deductions = await prisma.deduction.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(type && { type }),
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
        startDate: 'desc',
      },
    });

    return NextResponse.json(deductions);
  } catch (error) {
    console.error('Error fetching deductions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deduction records' },
      { status: 500 }
    );
  }
} 
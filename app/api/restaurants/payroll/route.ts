import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { groupBy } from 'lodash'; // Optional, or use custom grouping

const payrollSchema = z.object({
  employeeId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  baseSalary: z.number(),
  overtimePay: z.number(),
  tipsAmount: z.number(),
  deductions: z.number(),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = payrollSchema.parse(body);

    // Check if payroll already exists for this employee and period
    const existingPayroll = await prisma.payroll.findFirst({
      where: {
        employeeId: validatedData.employeeId,
        month: validatedData.month,
        year: validatedData.year,
      },
    });

    if (existingPayroll) {
      return NextResponse.json(
        { error: 'Payroll already exists for this employee and period' },
        { status: 400 }
      );
    }

    // Calculate net salary
    const netSalary = validatedData.baseSalary + 
                     validatedData.overtimePay + 
                     validatedData.tipsAmount - 
                     validatedData.deductions;

    // Create payroll with transaction to ensure data consistency
    const payroll = await prisma.$transaction(async (tx) => {
      // Create the payroll record
      const newPayroll = await tx.payroll.create({
        data: {
          ...validatedData,
          netSalary,
          status: 'pending',
        },
      });

      // Create deduction record if there are deductions
      if (validatedData.deductions > 0) {
        await tx.deduction.create({
          data: {
            employeeId: validatedData.employeeId,
            month: validatedData.month,
            year: validatedData.year,
            amount: validatedData.deductions,
            type: 'other',
            description: 'Monthly deduction',
            startDate: new Date(validatedData.year, validatedData.month - 1, 1),
            endDate: new Date(validatedData.year, validatedData.month, 0),
            payrollId: newPayroll.id,
          },
        });
      }

      // Create tip record if there are tips
      if (validatedData.tipsAmount > 0) {
        await tx.tip.create({
          data: {
            employeeId: validatedData.employeeId,
            month: validatedData.month,
            year: validatedData.year,
            amount: validatedData.tipsAmount,
            type: 'individual',
            date: new Date(validatedData.year, validatedData.month - 1, 1),
            payrollId: newPayroll.id,
          },
        });
      }

      // Create overtime record if there is overtime pay
      if (validatedData.overtimePay > 0) {
        await tx.overtime.create({
          data: {
            employeeId: validatedData.employeeId,
            month: validatedData.month,
            year: validatedData.year,
            hours: validatedData.overtimePay / (validatedData.baseSalary / 160), // Assuming 160 hours per month
            rate: validatedData.baseSalary / 160, // Hourly rate based on monthly salary
            amount: validatedData.overtimePay,
            date: new Date(validatedData.year, validatedData.month - 1, 1),
            payrollId: newPayroll.id,
          },
        });
      }

      return newPayroll;
    });

    return NextResponse.json(payroll);
  } catch (error) {
    console.error('Payroll creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payroll' },
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!user.restaurantId) {
      return new NextResponse("User is not associated with a restaurant", { status: 400 });
    }

    const { searchParams } = new URL(req.url);      
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const statusParam = searchParams.get('status');

    const whereClause: any = {
      employee: {
        restaurantId: user.restaurantId,
      },
    };

    // Apply month/year only if provided
    if (monthParam && yearParam) {
      whereClause.month = parseInt(monthParam);
      whereClause.year = parseInt(yearParam);
    }

    if (statusParam) {
      whereClause.status = statusParam;
    }

    const payrolls = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: true,
          },
        },
        overtimeRecords: true,
        tipRecords: true,
        deductionRecords: true,
      },
    });

    // Group by employeeId
    const grouped = payrolls.reduce((acc, payroll) => {
      const empId = payroll.employee.id;
      if (!acc[empId]) {
        acc[empId] = {
          employee: payroll.employee,
          payrolls: [],
        };
      }
      acc[empId].payrolls.push(payroll);
      return acc;
    }, {} as Record<string, { employee: any; payrolls: typeof payrolls }>);

      
    const pendingEmployeeIds = new Set<string>();
    payrolls.forEach((p) => {
      if (p.status === 'pending') {
        pendingEmployeeIds.add(p.employee.id);
      }
    });

    return NextResponse.json({
      pendingCount: pendingEmployeeIds.size,
      data: grouped,
    });
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument } from 'pdf-lib';

// GET employee reports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!employeeId || !reportType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        role: true,
        profile: true,
        orders: {
          where: {
            createdAt: {
              gte: startDate ? new Date(startDate) : undefined,
              lte: endDate ? new Date(endDate) : undefined
            }
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Generate report based on type
    let report;
    switch (reportType) {
      case 'monthly':
        report = generateMonthlyReport(employee);
        break;
      case 'weekly':
        report = generateWeeklyReport(employee);
        break;
      case 'yearly':
        report = generateYearlyReport(employee);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Add content to PDF
    page.drawText(`Employee Report: ${employee.firstName} ${employee.lastName}`, {
      x: 50,
      y: height - 50,
      size: 20,
    });

    // Add report content
    page.drawText(JSON.stringify(report, null, 2), {
      x: 50,
      y: height - 100,
      size: 12,
    });

    const pdfBytes = await pdfDoc.save();
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${employee.firstName}-${employee.lastName}-${reportType}-report.pdf`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateMonthlyReport(employee: any) {
  return {
    employee: {
      name: `${employee.firstName} ${employee.lastName}`,
      role: employee.role.name,
      email: employee.email
    },
    orders: employee.orders.length,
    totalRevenue: employee.orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0),
    period: 'Monthly'
  };
}

function generateWeeklyReport(employee: any) {
  return {
    employee: {
      name: `${employee.firstName} ${employee.lastName}`,
      role: employee.role.name,
      email: employee.email
    },
    orders: employee.orders.length,
    totalRevenue: employee.orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0),
    period: 'Weekly'
  };
}

function generateYearlyReport(employee: any) {
  return {
    employee: {
      name: `${employee.firstName} ${employee.lastName}`,
      role: employee.role.name,
      email: employee.email
    },
    orders: employee.orders.length,
    totalRevenue: employee.orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0),
    period: 'Yearly'
  };
} 
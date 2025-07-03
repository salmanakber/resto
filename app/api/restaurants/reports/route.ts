import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'attendance', 'leave', 'payroll', 'performance'
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  let data = [];
  if (type === 'attendance') {
    data = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(start!),
          lte: new Date(end!),
        },
      },
      include: { employee: true },
    });
  } else if (type === 'leave') {
    data = await prisma.leave.findMany({
      where: {
        startDate: { gte: new Date(start!) },
        endDate: { lte: new Date(end!) },
      },
      include: { employee: true },
    });
  } else if (type === 'payroll') {
    data = await prisma.payroll.findMany({
      where: {
        paymentDate: {
          gte: new Date(start!),
          lte: new Date(end!),
        },
      },
      include: { employee: true },
    });
  } else if (type === 'performance') {
    data = await prisma.kitchenOrder.groupBy({
      by: ['staffId'],
      where: {
        createdAt: {
          gte: new Date(start!),
          lte: new Date(end!),
        },
      },
      _count: { id: true },
      _avg: { prepTime: true },
    });
  }
  return NextResponse.json(data);
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  format,
} from 'date-fns';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    const today = new Date();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (
      !user ||
      !['Admin', 'Restaurant_supervisor', 'Restaurant_manager', 'Restaurant'].includes(
        user.role.name
      )
    ) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const revenueData = [];
    let loopCount = 12;

    if (period === 'daily') loopCount = 7;
    if (period === 'weekly') loopCount = 4;
    if (period === 'yearly') loopCount = 5;

    for (let i = 0; i < loopCount; i++) {
      let startDate: Date, endDate: Date, label: string;

      if (period === 'monthly') {
        startDate = startOfMonth(subMonths(today, i));
        endDate = endOfMonth(startDate);
        label = format(startDate, 'MMM yyyy');
      } else if (period === 'weekly') {
        startDate = startOfWeek(subWeeks(today, i));
        endDate = endOfWeek(startDate);
        label = `Week ${format(startDate, 'w')} (${format(startDate, 'MMM d')})`;
      } else if (period === 'daily') {
        startDate = startOfDay(subDays(today, i));
        endDate = endOfDay(startDate);
        label = format(startDate, 'dd MMM');
      } else if (period === 'yearly') {
        startDate = new Date(today.getFullYear() - i, 0, 1);
        endDate = new Date(today.getFullYear() - i, 11, 31, 23, 59, 59);
        label = format(startDate, 'yyyy');
      }

      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          restaurantId: user.restaurantId,
        },
      });

      const income = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const expense = orders.reduce((sum, order) => {
        const items = JSON.parse(order.items as string) as any[];
        return sum + items.reduce((s, item) => s + (item.price || 0) * (item.quantity || 0), 0);
      }, 0);

      revenueData.push({
        name: label,
        income,
        expense,
      });
    }

    return NextResponse.json(revenueData.reverse());
  } catch (error) {
    console.error('Revenue data error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}

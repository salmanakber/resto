import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    
    const today = new Date();
    let days = 30; // Default to 30 days
    
    if (period === 'weekly') {
      days = 7;
    } else if (period === 'daily') {
      days = 1;
    }

    const customerData = [];
    
    for (let i = 0; i < days; i++) {
      const date = subDays(today, i);
      const startDate = startOfDay(date);
      const endDate = endOfDay(date);

      // Get new customers for the day
      const newCustomers = await prisma.customer.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Get orders for the day
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate positive (new customers) and negative (cancelled orders) values
      const positiveValue = newCustomers;
      const negativeValue = orders.filter(order => order.status === 'cancelled').length;

      customerData.push({
        day: i + 1,
        value: positiveValue,
        negative: -negativeValue
      });
    }

    return NextResponse.json(customerData.reverse());
  } catch (error) {
    console.error('Customer map data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer map data' },
      { status: 500 }
    );
  }
} 
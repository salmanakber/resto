import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { restaurantId: true },
  });

  if (!user?.restaurantId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let where = {
  restaurantId: user.restaurantId,
  staffId: { not: null },
  completedAt: { not: null },
  status: 'completed',
}

  if(start && end) {
    where.createdAt = {
      gte: new Date(start!),
      lte: new Date(end!),
    }
  }
  
  const orders = await prisma.kitchenOrder.findMany({
    where,
    select: {
      staffId: true,
      createdAt: true,
      assignedAt: true,
      completedAt: true,
    },
  });
  

  const PREP_TIME_THRESHOLD_MS = 10 * 60 * 1000;

  const staffMap: Record<string, {
    totalPrepTimeMs: number;
    totalOrders: number;
    completedOrders: number;
    onTimeOrders: number;
    lateOrders: number;
  }> = {};

  const trendMap: Record<string, {
    onTimeOrders: number;
    totalOrders: number;
  }> = {};

  
  for (const order of orders) {
    const assigned = new Date(order.assignedAt);
    const completed = new Date(order.completedAt);
    
    const prepTimeMs = completed.getTime() - assigned.getTime();
    
    // Skip invalid times
    if (prepTimeMs < 0 || prepTimeMs > 60 * 60 * 1000) continue;
    const monthKey = `${assigned.getFullYear()}-${String(assigned.getMonth() + 1).padStart(2, '0')}`; // e.g., "2025-06"

    const staffId = order.staffId;
    // const dateKey = assigned.toISOString().split('T')[0];

    // Trend Map
    if (!trendMap[monthKey]) {
      trendMap[monthKey] = {
        totalOrders: 0,
        onTimeOrders: 0,
      };
    }
    trendMap[monthKey].totalOrders += 1;
  if (prepTimeMs <= PREP_TIME_THRESHOLD_MS) {
    trendMap[monthKey].onTimeOrders += 1;
  }

    // Staff Map
    if (!staffMap[staffId]) {
      staffMap[staffId] = {
        totalPrepTimeMs: 0,
        totalOrders: 0,
        completedOrders: 0,
        onTimeOrders: 0,
        lateOrders: 0,
      };
    }

    staffMap[staffId].totalOrders += 1;
    staffMap[staffId].completedOrders += 1;
    staffMap[staffId].totalPrepTimeMs += prepTimeMs;
    if (prepTimeMs <= PREP_TIME_THRESHOLD_MS) {
      staffMap[staffId].onTimeOrders += 1;
    } else {
      staffMap[staffId].lateOrders += 1;
    }
  }

  // Staff details
  const staffIds = Object.keys(staffMap);
  const staffDetails = await prisma.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const staffPerformance = staffIds.map((staffId) => {
    const data = staffMap[staffId];
    const staff = staffDetails.find((s) => s.id === staffId);
    const efficiency = data.completedOrders
      ? (data.onTimeOrders / data.completedOrders) * 100
      : 0;

    return {
      staffId,
      staffName: staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown',
      totalOrders: data.totalOrders,
      completedOrders: data.completedOrders,
      averagePrepTime: data.totalPrepTimeMs / data.completedOrders / 1000, // seconds
      onTimeOrders: data.onTimeOrders,
      lateOrders: data.lateOrders,
      efficiency: parseFloat(efficiency.toFixed(2)),
    };
  });

  // Build trend data array
  const trendData = Object.entries(trendMap).map(([month, stats]) => {
    const efficiency = stats.totalOrders > 0 ? (stats.onTimeOrders / stats.totalOrders) * 100 : 0;
    return {
      date: month, // month string like "2025-06"
      efficiency: parseFloat(efficiency.toFixed(2)),
      onTimeRate: parseFloat(efficiency.toFixed(2)),
      orders: stats.totalOrders,
    };
  });

  return NextResponse.json({ staffPerformance, trendData });
}

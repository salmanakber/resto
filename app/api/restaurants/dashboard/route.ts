import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  restaurantId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  otpEnabled: boolean;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  user: {
    firstName: string;
    lastName: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const LoggedInUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        role: true,
      },
    });
    if (!LoggedInUser) {
      return new NextResponse('User not found', { status: 404 });
    }
    if (!LoggedInUser.restaurantId || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(LoggedInUser.role.name)) {
      return new NextResponse('Restaurant ID not found', { status: 400 });
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    const sevenDaysAgo = subDays(today, 7);

    // Get total employees
    const totalEmployees = await prisma.employee.count({
      where: {
        restaurantId: LoggedInUser.restaurantId,
        status: 'active'
      }
    });

    // Get today's attendance stats
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        },
        employee: {
          restaurantId: LoggedInUser.restaurantId
        }
      },
      include: {
        employee: true
      }
    });

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;
    const onLeaveToday = await prisma.employee.count({
      where: {
        restaurantId: LoggedInUser.restaurantId,
        status: 'on_leave',
      },
    });

    // Get payroll stats
    const currentMonthPayroll = await prisma.payroll.findMany({
      where: {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        employee: {
          restaurantId: LoggedInUser.restaurantId
        }
      }
    });

    const totalPayroll = currentMonthPayroll.reduce((sum, payroll) => sum + Number(payroll.netSalary), 0);
    const pendingPayrolls = currentMonthPayroll.filter(p => p.status === 'pending').length;

    // Get department stats
    const activeDepartments = await prisma.employee.groupBy({
      by: ['department'],
      where: {
        restaurantId: LoggedInUser.restaurantId,
        status: 'active'
      },
      _count: {
        department: true
      }
    });

    // Get recent hires (last 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const recentHires = await prisma.employee.count({
      where: {
        restaurantId: LoggedInUser.restaurantId,
        joiningDate: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get pending complaints
    const pendingComplaints = await prisma.complaint.count({
      where: {
        status: 'pending',
        user: {
          restaurantId: LoggedInUser.restaurantId
        }
      }
    });

    // Get recent activities for the last 7 days
    const recentActivities = await Promise.all([
      // Payroll activities
      prisma.payroll.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          employee: {
            restaurantId: LoggedInUser.restaurantId
          }
        },
        select: {
          createdAt: true,
          status: true,
          netSalary: true
        }
      }),
      // Attendance activities
      prisma.attendance.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          employee: {
            restaurantId: LoggedInUser.restaurantId
          }
        },
        select: {
          createdAt: true,
          status: true
        }
      }),
      // Overtime activities
      prisma.overtime.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          employee: {
            restaurantId: LoggedInUser.restaurantId
          }
        },
        select: {
          createdAt: true,
          hours: true
        }
      }),
      // Tips activities
      prisma.tip.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          },
          employee: {
            restaurantId: LoggedInUser.restaurantId
          }
        },
        select: {
          createdAt: true,
          amount: true
        }
      })
    ]);

    // Process activities for the bar chart
    const activityData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, i);
      const dateStr = format(date, 'MMM dd');
      
      return {
        date: dateStr,
        payroll: recentActivities[0].filter(a => format(a.createdAt, 'MMM dd') === dateStr).length,
        attendance: recentActivities[1].filter(a => format(a.createdAt, 'MMM dd') === dateStr).length,
        overtime: recentActivities[2].filter(a => format(a.createdAt, 'MMM dd') === dateStr).length,
        tips: recentActivities[3].filter(a => format(a.createdAt, 'MMM dd') === dateStr).length
      };
    }).reverse();

    return NextResponse.json({
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      onLeaveToday,
      totalPayroll,
      pendingPayrolls,
      activeDepartments: activeDepartments.length,
      recentHires,
      pendingComplaints,
      recentActivities: activityData
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
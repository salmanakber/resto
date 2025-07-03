import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
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
    
    if (!LoggedInUser || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(LoggedInUser.role.name)) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    if (!LoggedInUser.restaurantId) {
      return new NextResponse("User is not associated with a restaurant", { status: 400 });
    }


    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (!month || !year) {
      return new NextResponse('Month and year are required', { status: 400 });
    }

    // Calculate start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Fetch attendance records for the specified month
    const attendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        employee: {
          restaurantId: LoggedInUser.restaurantId,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });
    

    // Group attendance by employee
    const employeeAttendance = attendance.reduce((acc: any, record) => {
      const employeeId = record.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
          department: record.employee.department,
          records: [],
          stats: {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            earlyClockIns: 0,
            totalOvertime: 0,
          },
        };
      }

      // Add record to employee's records
      acc[employeeId].records.push(record);

      // Update stats
      switch (record.status) {
        case 'present':
          acc[employeeId].stats.present++;
          break;
        case 'absent':
          acc[employeeId].stats.absent++;
          break;
        case 'late':
          acc[employeeId].stats.late++;
          break;
        case 'half-day':
          acc[employeeId].stats.halfDay++;
          break;
      }

      // Check for early clock-in
      if (record.checkIn) {
        const checkIn = new Date(record.checkIn);
        if (checkIn.getHours() < 9) {
          acc[employeeId].stats.earlyClockIns++;
        }
      }

      // Calculate overtime
      if (record.checkIn && record.checkOut) {
        const checkIn = new Date(record.checkIn);
        const checkOut = new Date(record.checkOut);
        const workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        if (workHours > 8) {
          acc[employeeId].stats.totalOvertime += workHours - 8;
        }
      }

      return acc;
    }, {});

    // Convert to array and calculate additional metrics
    const monthlyReport = Object.values(employeeAttendance).map((employee: any) => ({
      ...employee,
      stats: {
        ...employee.stats,
        totalDays: employee.records.length,
        averageClockIn: calculateAverageTime(employee.records, 'checkIn'),
        averageClockOut: calculateAverageTime(employee.records, 'checkOut'),
        totalOvertime: formatOvertime(employee.stats.totalOvertime),
      },
    }));

    return NextResponse.json(monthlyReport);
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Helper function to calculate average clock in/out time
function calculateAverageTime(records: any[], field: 'checkIn' | 'checkOut'): string {
  const validRecords = records.filter(record => record[field]);
  if (validRecords.length === 0) return '00:00';

  const totalMinutes = validRecords.reduce((acc, record) => {
    const time = new Date(record[field]);
    return acc + time.getHours() * 60 + time.getMinutes();
  }, 0);

  const averageMinutes = Math.round(totalMinutes / validRecords.length);
  const hours = Math.floor(averageMinutes / 60);
  const minutes = averageMinutes % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Helper function to format overtime hours
function formatOvertime(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
} 
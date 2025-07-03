import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { type } from 'os';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
        const { status, startDate, endDate, typeLeave, note } = body;

    if (!status) {
      return new NextResponse('Status is required', { status: 400 });
    }

let updatedLeave;
    // Update the leave request
    if (status === 'on_leave') {
        const start = new Date(startDate);
        const end = new Date(startDate);
    
        const leaveDays = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          leaveDays.push(new Date(d)); // clone to avoid mutation issues
        }
        
        const attendanceRecords = await prisma.$transaction(
            leaveDays.map((date) =>
              prisma.attendance.create({
                data: {
                  employeeId: params.id,
                  date,
                  status: 'absent',
                  notes: `${typeLeave} leave: ${note || ''}`,
                  month: date.getMonth() + 1,
                  year: date.getFullYear(),
                },
              })
            )
          );
          updatedLeave = {
            ...attendanceRecords,
            employeeId: params.id,
          }
  }

    // If status is 'on_leave', update employee status
    if (status === 'on_leave') {
      await prisma.employee.update({
        where: {
          id: updatedLeave.employeeId,
        },
        data: {
          status: 'on_leave',
          tempStatus: status,
        },
      });
    } else if (status === 'active') {
      // If status is 'active', update employee status back to active
      await prisma.employee.update({
        where: {
          id: updatedLeave.employeeId,
        },
        data: {
          status: 'active',
          tempStatus: status,
        },
      });
    }

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error('[LEAVE_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 
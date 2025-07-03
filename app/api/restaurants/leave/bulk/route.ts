// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { prisma } from '@/lib/prisma';

// export async function PATCH(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return new NextResponse('Unauthorized', { status: 401 });
//     }
//     const user = await prisma.user.findUnique({
//       where: {
//         email: session.user.email,
//       },
//       include: {
//         role: true,
//       },
//     });
//     if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
//       return new NextResponse('Unauthorized', { status: 401 });
//     }

//     const body = await request.json();
//     const { leaveIds, status } = body;

//     if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
//       return new NextResponse('Leave IDs are required', { status: 400 });
//     }

//     if (!status) {
//       return new NextResponse('Status is required', { status: 400 });
//     }

//    const updateEmployee = await prisma.employee.updateMany({
//     where: {
//       id: {
//         in: leaveIds,
//       },
//     },
//     data: {
//       status: status === 'on_leave' ? 'on_leave' : 'active',
//       tempStatus: status !== 'active' ? status : 'none',
//     },
//     select: {
//       id: true,
//     },
//   });




//     return NextResponse.json({
//       message: 'Leaves updated successfully',
//       count: updatedLeaves.count,
//     });
//   } catch (error) {
//     console.error('[LEAVE_BULK_UPDATE]', error);
//     return new NextResponse('Internal error', { status: 500 });
//   }
// } 
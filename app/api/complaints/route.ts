import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getEmailTemplate, sendEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const assignedTo = searchParams.get('assignedTo');

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (assignedTo) whereClause.assignedTo = assignedTo;

    // Fetch complaints and total count
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              restaurantId: true,
              
            },
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where: whereClause }),
    ]);

    // Step 1: Extract unique restaurant IDs
    const restaurantIds = Array.from(
      new Set(complaints.map(c => c.user?.restaurantId).filter(Boolean))
    );

    // Step 2: Fetch all restaurants in one query
    const restaurants = await prisma.user.findMany({
      where: {
        id: {
          in: restaurantIds,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true, // or any other fields you need
        restaurantName: true,
      },
    });

    // Step 3: Build a map for quick access
    const restaurantMap = Object.fromEntries(restaurants.map(r => [r.id, r]));

    // Step 4: Attach restaurant to each complaint
    const complaintsWithRestaurant = complaints.map(complaint => {
      const r = restaurantMap[complaint.user?.restaurantId?.toString()];
      return {
        ...complaint,
        restaurant: r && {
          id: r.id.toString(),
          restaurantName: r.restaurantName,
          email: r.email,
        },
      };
    });
  

    return NextResponse.json({
      complaints: complaintsWithRestaurant,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, subject, description, priority } = body

    const complaint = await prisma.complaint.create({
      data: {
        userId: session.user.id,
        type,
        subject,
        description,
        priority,
      },
    })

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: 'Admin',
        },
      },
    })

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'complaint',
            title: 'New Complaint',
            message: `New ${type} complaint from ${session.user.firstName} ${session.user.lastName}`,
            data: { complaintId: complaint.id },
            priority: priority === 'high' ? 'high' : 'normal',
          },
        })
      )
    )

    return NextResponse.json(complaint)
  } catch (error) {
    console.error('Error creating complaint:', error)
    return NextResponse.json(
      { error: 'Failed to create complaint' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (type === 'resolve') {
      const body = await request.json()
      const { id, status, assignedTo, resolution } = body;

      const complaint = await prisma.complaint.update({
        where: { id },
        data: {
          status,
        },
      })
      
      

      const user = await prisma.user.findUnique({
        where: { id: complaint.userId },
      })
      

      const restaurant = await prisma.user.findUnique({
        where: { id: user?.restaurantId },
      })

      await sendEmail({
        to: user.email,
        subject: 'Complaint Resolved',
        html: (await getEmailTemplate('complaint_resolved', { userName: user.firstName, restaurantName: restaurant.restaurantName })).body
      })
      
      

      return NextResponse.json(complaint)
    }



    return NextResponse.json({ message: 'Complaint updated successfully' })
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json(
      { error: 'Failed to update complaint' },
      { status: 500 }
    )
  }
} 
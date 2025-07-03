import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: Fetch restaurant settings (mock or from DB)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true }
  });

  const validRoles = ["Admin","Restaurant"];
  if (!user || !validRoles.includes(user.role.name)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
  }

  const restaurant = await prisma.user.findUnique({
    where: { id: id as string }
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }
  const storeStaff = await prisma.user.findMany({
    where: {
      role: {
        name: { notIn: ["Customer", "Admin"] }
      },
      restaurantId: restaurant.id
    },
    include: {
      role: true
    },
  });

  const sessionUsers = await prisma.session.findMany({
    where: {
      userId: { in: storeStaff.map(staff => staff.id) }
    },
    include: { loginLog:{include:{user:true}} }
  });

  const settings = await prisma.setting.findMany();

  const sessionUsersWithAddress = await Promise.all(
    sessionUsers.map(async (session: any) => {
      const ip = session?.loginLog?.ipAddress;
      let userAddress = null;
  
      if (ip) {
        try {
          const res = await fetch(`http://www.geoplugin.net/json.gp?ip=${ip}`);
          userAddress = await res.json();
        } catch (err) {
          console.error(`Error fetching address for IP ${ip}:`, err);
        }
      }
  
      return {
        ...session,
        userAddress,
      };
    })
  );
  
  const data = {
    restaurant,
    storeStaff,
    sessionUsers: sessionUsersWithAddress,
    settings,
  };

  return NextResponse.json(data);
}


// POST: Update restaurant settings (mock or to DB)
export async function POST(req: NextRequest) {
  const data = await req.json();
  
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true }
  });

  const validRoles = ["Admin","Restaurant"];
  if (!user || !validRoles.includes(user.role.name)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const restaurant = await prisma.user.findUnique({
    where: { id: data.userId }
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }
  const updatedRestaurant = await prisma.user.update({
    where: { id: data.userId },
    data:  data.data
  });

  return NextResponse.json({ success: true, data });
} 
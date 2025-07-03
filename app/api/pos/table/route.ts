import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderItem } from '@/app/pos/types';
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }


    const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        include: {
          role: true,
        },
      });
      
      if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        // valid role
        return new NextResponse("Unauthorized", { status: 401 })
      }
      
      const tables = await prisma.table.findMany({
        where: {
          restaurantId: user.restaurantId,
        },
      });
      
      return NextResponse.json(tables);
    } catch (error) {   
        console.error('Error fetching tables:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
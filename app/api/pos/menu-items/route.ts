import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';


export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            role: true,
        },
    });

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        return new NextResponse("Unauthorized", { status: 401 })
    }


  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
 
    const menuItems = await prisma.menuItem.findMany({
      where: {
        AND: [
          (categoryId !== 'all') ? { categoryId } : {},
          search ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } }
            ]
          } : {}
        ],
        userId: user.restaurantId
      },
      include: {
        category: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });



    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
} 
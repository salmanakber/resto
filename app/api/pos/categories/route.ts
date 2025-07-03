import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export async function GET() {
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
    const categories = await prisma.menuCategory.findMany({
      where: {
        parentId: null,
        userId: user.restaurantId
      },
      include: {
        children: true
      }
    });

    // Get count of items grouped by categoryId
    const itemCounts = await prisma.menuItem.groupBy({
      by: ['categoryId'],
      _count: true,
    });

    // Create a lookup map for categoryId -> item count
    const itemCountMap = Object.fromEntries(
      itemCounts.map(item => [item.categoryId, item._count])
    );

    // Map categories with their respective item counts
    const categoriesWithItemCount = categories.map(category => ({
      ...category,
      itemCount: itemCountMap[category.id] || 0
    }));

    return NextResponse.json(categoriesWithItemCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

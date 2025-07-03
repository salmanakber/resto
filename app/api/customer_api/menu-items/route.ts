import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const locationId = searchParams.get('locationId');

   

    // Get the location and its associated user
    const location = await prisma.location.findUnique({
      where: {
        id: locationId
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
          { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: location.userId
      }
    ,
    include: {
      role: true
    }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    

    // Get all categories for this restaurant
    const categories = await prisma.menuCategory.findMany({
      where: {
        userId: user.id,
        parentId: null, // Only get parent categories
        isActive: true
      },
      include: {
        children: {
            include: {
                children: true // Include nested children
            },
          where: {
            isActive: true// Include nested children
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Get menu items based on category filter
    const whereClause = {
      userId: user.restaurantId,
      isAvailable: true,
      ...(categoryId && categoryId !== 'all' ? { categoryId } : {})
    };

    const menuItems = await prisma.menuItem.findMany({
      where: whereClause,
      include: {
        category: true,
        reviews: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        order: 'desc'
      }
    });

    return NextResponse.json({
      menuItems: menuItems.map(item => ({
        ...item,
        services: item.services.map(menuItemService => ({
          id: menuItemService.service.id,
          name: menuItemService.service.name,
          price: menuItemService.service.price,
          description: menuItemService.service.description
        }))
      })),
      categories: [
        {
          id: 'all',
          name: 'All',
          description: 'All menu items',
          order: 0
        },
        ...categories
      ]
    });

  } catch (error) {
    console.error('Error in menu items API:', error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
} 
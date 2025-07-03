import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface LocationWithUser {
  id: string;
  address: string;
  isActive: boolean;
  lat: string;
  lng: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    id: string;
    restaurantId: string | null;
  } | null;
}


export async function GET() {
  try {
    // Get all active locations with a userId
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        userId: {
          not: null,
        },
      },
    });

    // Map and fetch corresponding users with role 'Restaurant'
    const enrichedLocations = await Promise.all(
      locations.map(async (location) => {
        const user = await prisma.user.findFirst({
          where: {
            id: location.userId || '',
            role: {
              name: 'Restaurant',
            },
          },
          select: {
            id: true,
          },
        });

        // Only include locations with a valid Restaurant user
        if (user) {
          return {
            ...location,
            user: {
              id: user.id,
            },
          };
        }

        return null;
      })
    );

    // Filter out nulls (invalid or missing users)
    const validLocations = enrichedLocations.filter((item) => item !== null);

    return NextResponse.json(validLocations);
  } catch (error) {
    console.error("Error in locations API:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        loyaltyPoints: {
          where: {
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const totalPoints = user.loyaltyPoints.reduce((sum, point) => {
      if (point.type === "earn") {
        return sum + point.points;
      } else {
        return sum - point.points;
      }
    }, 0);

    return NextResponse.json({ points: totalPoints });
  } catch (error) {
    console.error("Error fetching loyalty points:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty points" },
      { status: 500 }
    );
  }
} 
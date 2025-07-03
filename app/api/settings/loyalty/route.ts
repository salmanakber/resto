import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const loyaltySettings = await prisma.setting.findUnique({
      where: { key: "loyalty" }
    });

    if (!loyaltySettings) {
      return NextResponse.json({
        enabled: false,
        earnRate: 1,
        redeemRate: 100,
        redeemValue: 5,
        minRedeemPoints: 100,
        pointExpiryDays: 365
      });
    }

    return NextResponse.json(JSON.parse(loyaltySettings.value));
  } catch (error) {
    console.error("Error fetching loyalty settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch loyalty settings" },
      { status: 500 }
    );
  }
} 
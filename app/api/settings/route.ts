// /api/profile/route.ts (or /api/profile.ts if not using app router)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    const Setting = await prisma.setting.findUnique({
      where: { key },
    });

    return NextResponse.json(Setting);
  } catch (error) {
    console.error("Error in profile POST:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    return NextResponse.json(setting || { value: null });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for OTP settings validation
const otpSettingsSchema = z.object({
  otpEnabled: z.boolean(),
});

// GET /api/profile/otp
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        otpEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({ otpEnabled: user.otpEnabled });
  } catch (error) {
    console.error("Error fetching OTP settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/otp
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = otpSettingsSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        otpEnabled: validatedData.otpEnabled,
      },
      select: {
        otpEnabled: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating OTP settings:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
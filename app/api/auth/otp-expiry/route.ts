import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

// This should be in an environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = verify(token, JWT_SECRET) as { email: string, id: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { id } = decodedToken;

    // Get user's OTP expiry
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        otpExpires: true,
        email: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      otpExpires: user.otpExpires,
      email: user.email
    });
  } catch (error) {
    console.error("OTP expiry error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching OTP expiry" },
      { status: 500 }
    );
  }
} 
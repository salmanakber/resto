import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Join the OTP array into a string
    const otpString = Array.isArray(otp) ? otp.join("") : otp;

    // Verify OTP
    const otpRecord = await prisma.user.findFirst({
      where: {
        email,
        otp: otpString,
        otpExpires: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return NextResponse.json({ message: "OTP is invalid or expired" }, { status: 400 });
    }

    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    

    // Get the latest OTP for the email
    const otpRecord = await prisma.user.findFirst({
      where: {
        email,
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    

    if (!otpRecord) {
      return NextResponse.json({ error: "No active OTP found" }, { status: 404 });
    }

    // Calculate remaining time in seconds
    const now = new Date();
    const expiresAt = new Date(otpRecord.otpExpires);
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return NextResponse.json({
      otp: otpRecord.otp,
      otpExpires: remainingSeconds,
      expire: (remainingSeconds > 0) ? false : true
    });
  } catch (error) {
    console.error("Error getting OTP:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify OTP
    const otpRecord = await prisma.user.findFirst({
      where: {
        email,
        otp: otp,
        otpExpires: {
          gt: new Date()
        }
      }
    });

    if (!otpRecord) {
      return new NextResponse("Invalid or expired OTP", { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Delete the used OTP
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null }
    });

    return new NextResponse("Password reset successful", { status: 200 });
  } catch (error) {
    console.error("Error in reset password:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user || !user.resetPasswordToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);

    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
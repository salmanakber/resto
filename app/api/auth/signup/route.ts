import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = signupSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Get customer role
    const customerRole = await prisma.role.findFirst({
      where: { name: "customer" },
    });

    if (!customerRole) {
      return NextResponse.json(
        { error: "Customer role not found" + customerRole },
        { status: 500 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: customerRole.id,
        emailVerified: false,
        otp,
        otpExpires,
      },
    });

    // TODO: Send OTP via email
    

    return NextResponse.json(
      { 
        message: "User created successfully",
        redirect: `/verify?email=${btoa(email)}`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
} 
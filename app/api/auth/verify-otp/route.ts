import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export async function POST(req: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate the request body
    const body = await req.json()
    const result = verifyOtpSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      )
    }

    const { email, otp } = result.data

    // Verify that the email matches the session
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 400 }
      )
    }

    // Find the user and verify OTP
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        otp: true,
        otpExpires: true,
        otpEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.otpEnabled) {
      return NextResponse.json(
        { error: "OTP verification is not enabled for this user" },
        { status: 400 }
      )
    }

    if (!user.otp || !user.otpExpires) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      )
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpires) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Verify OTP
    if (user.otp !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      )
    }

    // Clear OTP and update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpires: null,
      },
    })

    return NextResponse.json({
      message: "OTP verified successfully",
    })
  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 
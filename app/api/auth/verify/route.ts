import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify } from "jsonwebtoken"

// This should be in an environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: Request) {
  try {
    const { token, otp } = await req.json()
    
    if (!token || !otp) {
      return NextResponse.json(
        { error: "Token and OTP are required" },
        { status: 400 }
      )
    }
    
    // Verify the token
    let decodedToken;
    try {
      decodedToken = verify(token, JWT_SECRET) as { email: string, id: string, pwd: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }
    
    const { email, id, pwd } = decodedToken;
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Check if OTP matches
    if (user.otp !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      )
    }
    
    // Check if OTP is expired
    const now = new Date()
    const otpExpires = user.otpExpires ? new Date(user.otpExpires) : null
    
    if (!otpExpires || otpExpires < now) {
      return NextResponse.json(
        { error: "OTP has expired" },
        { status: 400 }
      )
    }
    
    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
       // otp: null,
        //otpExpires: null,
      },
    })
    
    return NextResponse.json(
      { 
        message: "Email verified successfully",
        user: {
          id: updatedUser.id,
          pwd: pwd, // Return the plain text password from the token
          email: updatedUser.email,
          emailVerified: true,
          otpEnabled: updatedUser.otpEnabled
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "An error occurred while verifying OTP" },
      { status: 500 }
    )
  }
} 
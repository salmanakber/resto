import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { getClientIp } from 'request-ip';

// This should be in an environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] ?? 'Unknown';
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    })
    
    
    
    if (!user) {
      return NextResponse.json(
        { error: "We couldn’t log you in. Please check your email and password." },
        { status: 401 }
      )
    }
    
    // Verify password
    const isPasswordValid = await compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "We couldn’t log you in. Please check your email and password." },
        { status: 401 }
      )
    }

    
    
    // Check if OTP is enabled
    if (user.otpEnabled) {
      // Generate OTP if not already generated
      if (!user.otp) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otp,
            otpExpires,
          },
        })
      }
      
      // Generate a temporary token with the user's email
      const token = sign(
        { 
          email: user.email,
          pwd: password,
          id: user.id,
          ab: 'Testing',
          otpEnabled: true,
          ip: ip
        },
        JWT_SECRET,
        { expiresIn: '60m' } // Token expires in 15 minutes
      )
      
      // Return temporary token with OTP required flag
      return NextResponse.json({
        token,
        requiresOTP: true,
        ip: ip
      })
    }
    if (!user.emailVerified && !user.phoneVerified){
      

      if (!user.otp) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otp,
            otpExpires,
          },
        })
      }
            // Generate a temporary token with the user's email
            const token = sign(
              { 
                email: user.email,
                pwd: password,
                id: user.id,
                ab: 'Testing',
                otpEnabled: true,
                ip: ip
              },
              JWT_SECRET,
              { expiresIn: '60m' } // Token expires in 15 minutes
            )

      return NextResponse.json({
        token,
        requiresOTP: true,
        ip: ip
      })
    }
    
    // If OTP is not enabled, return success to proceed with main session
    return NextResponse.json({
      token: user,
      requiresOTP: false,
      ip: ip
    })
    
  } catch (error) {
    console.error("Temp token error:", error)
    return NextResponse.json(
      { error: "An error occurred while validating credentials" },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendOTPEmail } from "@/lib/email"
import { sendOTPSMS } from "@/lib/twilio"

const resendOtpSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const body = await req.json()
    const result = resendOtpSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: body, details: result.error.format() },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Get OTP settings from database
    const [otpExpirySetting, otpLengthSetting, otpEmailEnabled, otpPhoneEnabled] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "OTP_EXPIRY_MINUTES" } }),
      prisma.setting.findUnique({ where: { key: "otp_length" } }),
      prisma.setting.findUnique({ where: { key: "otp_email_enabled" } }),
      prisma.setting.findUnique({ where: { key: "otp_phone_enabled" } }),
    ])

    // Use default values if settings are not found
    const otpExpiryMinutes = parseInt(otpExpirySetting?.value || "10")
    const otpLength = parseInt(otpLengthSetting?.value || "6")
    const isEmailEnabled = otpEmailEnabled?.value === "true" || true // Default to true if not set
    const isPhoneEnabled = otpPhoneEnabled?.value === "true" || false // Default to false if not set

    // Check if at least one OTP method is enabled
    if (!isEmailEnabled && !isPhoneEnabled) {
      return NextResponse.json(
        { error: "No OTP methods are enabled" },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        otpEnabled: true,
        phoneNumber: true,
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

    // Generate OTP
    const otp = Math.floor(Math.pow(10, otpLength - 1) + Math.random() * (Math.pow(10, otpLength) - Math.pow(10, otpLength - 1))).toString()
    const otpExpires = new Date(Date.now() + otpExpiryMinutes * 60 * 1000)

    // Update user with new OTP and reset attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpires,
      },
    })

    // Send OTP via all enabled channels
    const sendPromises = []
    
    if (isEmailEnabled) {
      sendPromises.push(sendOTPEmail(email, otp))
    }
    
    if (isPhoneEnabled && user.phoneNumber) {
      sendPromises.push(sendOTPSMS(user.phoneNumber, otp))
    }
    
    // Wait for all OTPs to be sent
    await Promise.all(sendPromises)

    return NextResponse.json(
      { 
        message: "OTP sent successfully",
        otpExpires,
        channels: {
          email: isEmailEnabled,
          sms: isPhoneEnabled && !!user.phoneNumber
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Resend OTP error:", error)
    return NextResponse.json(
      { error: "An error occurred while resending OTP" },
      { status: 500 }
    )
  }
} 
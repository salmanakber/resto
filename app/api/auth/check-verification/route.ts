import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      isVerified: user.emailVerified,
    })
  } catch (error) {
    console.error("Check verification error:", error)
    return NextResponse.json(
      { error: "An error occurred while checking verification status" },
      { status: 500 }
    )
  }
} 
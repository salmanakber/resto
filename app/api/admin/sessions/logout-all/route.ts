import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Logout all sessions
    await prisma.session.deleteMany({})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging out all sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

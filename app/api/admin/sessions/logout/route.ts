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

    const { sessionId, userId } = await request.json()

    if (sessionId) {
      // Logout specific session
      await prisma.session.delete({
        where: { id: sessionId },
      })
    } else if (userId) {
      // Logout all sessions for a user
      await prisma.session.deleteMany({
        where: { userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging out session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

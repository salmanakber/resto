import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        loginLog: {
          select: {
            ipAddress: true,
            userAgent: true,
            device: true,
            location: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lastActiveAt: "desc",
      },
    })

    // Parse location data for each session
    const sessionsWithParsedLocation = sessions.map((session) => ({
      ...session,
      loginLog: session.loginLog
        ? {
            ...session.loginLog,
            locationData: session.loginLog.location
              ? (() => {
                  try {
                    return JSON.parse(session.loginLog.location)
                  } catch {
                    return null
                  }
                })()
              : null,
          }
        : null,
    }))

    return NextResponse.json({ sessions: sessionsWithParsedLocation })
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

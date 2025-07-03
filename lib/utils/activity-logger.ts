import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details,
}: {
  userId: string
  action: string
  entityType: string
  entityId: string
  details: string
}) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.ActivityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
} 
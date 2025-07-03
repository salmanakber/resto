import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      role: true,
    },
  })

  if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
    return res.status(401).json({ error: 'Unauthorized' })
  } 

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    await prisma.notificationRecipient.update({
      where: {
        notificationId_userId: {
          notificationId: id as string,
          userId: user.id
        }
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return res.status(500).json({ error: 'Failed to mark notification as read' })
  }
} 
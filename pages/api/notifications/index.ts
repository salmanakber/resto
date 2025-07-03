import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'    
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the session (checking if the user is authenticated)
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Fetch the user from the database
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      role: true,
    },
  })

  // Check if the user has a valid role
  if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant", "Kitchen_boy","Customer","it_access"].includes(user.role.name)) {
    return res.status(401).json({ error: 'Unauthorized ddsd' })
  }

  // Handling GET request to fetch notifications
  if (req.method === 'GET') {
    try {
      // If user is admin, fetch all notifications
      const whereClause = user.role.name === "Admin" 
        ? {} // No filter for admin - they see everything
        : {
            recipients: {
              some: {
                userId: user.id
              }
            }
          }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        include: {
          recipients: {
            where: {
              userId: user.id
            },
            select: {
              isRead: true,
              readAt: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Transform the notifications to include isRead status
      const transformedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: notification.recipients[0]?.isRead || false,
        readAt: notification.recipients[0]?.readAt
      }))

      return res.status(200).json({ notifications: transformedNotifications || [] })
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return res.status(500).json({ error: 'Failed to fetch notifications' })
    }
  }

  // Handling POST request to create a new notification
  if (req.method === 'POST') {
    try {
      const { type, title, message, data, priority, restaurantId, recipientIds, roleFilter } = req.body

      // Always enforce role filtering, even for admins
      let userIds: string[] = []

      if (recipientIds) {
        // If specific recipients are provided, use them
        userIds = recipientIds
      } else {
        // Otherwise, find users based on role and restaurant filters
        const whereClause: any = {
          isActive: true
        }

        // Always apply role filter if specified
        if (roleFilter) {
          whereClause.role = {
            name: {
              in: roleFilter
            }
          }
        } else {
          // If no role filter is specified, default to the creator's role
          whereClause.role = {
            name: user.role.name
          }
        }

        if (restaurantId) {
          whereClause.restaurantId = restaurantId
        }

        // Find users based on the filters
        const users = await prisma.user.findMany({
          where: whereClause,
          select: { id: true }
        })

        userIds = users.map(user => user.id)
      }

      // Create the notification
      const notification = await prisma.notification.create({
        data: {
          type,
          title,
          message,
          data,
          priority: priority || 'normal',
          restaurantId: restaurantId || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          recipients: {
            create: userIds.map(userId => ({ userId }))
          }
        },
        include: {
          recipients: true
        }
      })

      return res.status(201).json(notification)
    } catch (error) {
      console.error('Error creating notification:', error)
      return res.status(500).json({ error: 'Failed to create notification' })
    }
  }

  // If the method is not allowed, return 405
  return res.status(405).json({ error: 'Method not allowed' })
}

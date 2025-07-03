import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  priority: string
  createdAt: string
  expiresAt: string
  restaurantId?: string
  isRead: boolean
  readAt?: string
}

export interface CreateNotificationInput {
  type: string
  title: string
  message: string
  data?: any
  priority?: string
  restaurantId?: string
  recipientIds?: string[] // Optional specific recipients
  roleFilter?: string[] // Optional role filter
}

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!session?.user?.id) return

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      })
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      if(process.env.NODE_ENV === 'development'){
        console.error('Error marking notification as read:', error)
        toast.error('Failed to mark notification as read')
      }
      
    }
  }

  const markAllAsRead = async () => {
    if (!session?.user?.id) return

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      })
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      if(process.env.NODE_ENV === 'development'){
        console.error('Error marking all notifications as read:', error)
        toast.error('Failed to mark all notifications as read')
      }
    
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!session?.user?.id) return

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      )
      setUnreadCount(prev =>
        notifications.find(n => n.id === notificationId)?.isRead
          ? prev
          : Math.max(0, prev - 1)
      )
    } catch (error) { 
      if(process.env.NODE_ENV === 'development'){
        console.error('Error deleting notification:', error)
        toast.error('Failed to delete notification')
      }
    
    }
  }

  const createNotification = async (input: CreateNotificationInput) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
 
      if (!response.ok) {
        throw new Error('Failed to create notification ')
      }
      

      const data = await response.json()
      // toast.success('Notification created successfully')
      return data
    } catch (error) { 
      if(process.env.NODE_ENV === 'development'){
        console.error('Error creating notification:', error)
        toast.error('Failed to create notification dasdas')
      }
      throw error
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [session])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refresh: fetchNotifications,
  }
} 
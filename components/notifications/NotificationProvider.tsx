import React, { createContext, useContext } from 'react'
import { useNotifications } from '@/lib/hooks/useNotifications'

const NotificationContext = createContext<ReturnType<typeof useNotifications> | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const notificationUtils = useNotifications()

  return (
    <NotificationContext.Provider value={notificationUtils}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
} 
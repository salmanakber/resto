"use client"

import { useState, useCallback } from "react"
import { startOfDay, endOfDay } from "date-fns"
import toast from "react-hot-toast"

export const useOrders = () => {
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [dailyStats, setDailyStats] = useState<any>(null)
  const [availableTables, setAvailableTables] = useState<any[]>([])

  const fetchDailyStats = useCallback(async () => {
    try {
      const today = new Date()
      const response = await fetch(
        `/api/pos/stats?start=${startOfDay(today).toISOString()}&end=${endOfDay(today).toISOString()}`,
      )
      const data = await response.json()

      setRecentOrders(data.kitchenOrdersData)
      setDailyStats(data)
    } catch (error) {
      console.error("Error fetching daily stats:", error)
    }
  }, [])

  const fetchAvailableTables = useCallback(async () => {
    try {
      const response = await fetch("/api/pos/table")
      const data = await response.json()
      setAvailableTables(data)
    } catch (error) {
      console.error("Error fetching available tables:", error)
    }
  }, [])

  const handleRefreshTables = useCallback(async () => {
    try {
      const response = await fetch("/api/pos/table")
      const data = await response.json()
      if (data.length > 0) {
        setAvailableTables(data)
      } else {
        toast.error("No tables found")
      }
    } catch (error) {
      console.error("Error refreshing tables:", error)
    }
  }, [])

  return { recentOrders, dailyStats, availableTables, fetchDailyStats, fetchAvailableTables, handleRefreshTables }
}

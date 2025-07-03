"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

export const useSocket = () => {
  const [userData, setUserData] = useState<any>(null)
  const userDataRef = useRef(userData)
  const kitchenCookSocket = useRef<Socket | null>(null)
  const kitchenAdminSocket = useRef<Socket | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch("/api/users/me")
      const data = await response.json()
      setUserData(data)
      userDataRef.current = data
    }
    fetchUserData()
  }, [])

  
  useEffect(() => {
    if (!userData?.restaurantId) return

    if (!kitchenCookSocket.current) {
      kitchenCookSocket.current = io("/kitchenCook", {
        path: "/api/socket/io",
        query: { restaurantId: userData.restaurantId },
      })
    }

    if (!kitchenAdminSocket.current) {
      kitchenAdminSocket.current = io("/kitchenAdmin", {
        path: "/api/socket/io",
        query: { restaurantId: userData.restaurantId },
      })
    }

    return () => {
      kitchenCookSocket.current?.disconnect()
      kitchenAdminSocket.current?.disconnect()
    }
  }, [userData?.restaurantId])

  return { userData, kitchenCookSocket, kitchenAdminSocket }
}

"use client"

import { useState, useCallback } from "react"
import type { Customer, LoyaltyPoint } from "../types/pos-types"
import { toast } from "sonner"

export const useCustomers = (loyaltySettings: any) => {
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [userLoyaltyPoints, setUserLoyaltyPoints] = useState(false)
  const [isCustomersLoading, setIsCustomersLoading] = useState(false)

  const fetchAllCustomers = useCallback(async () => {
    try {
      setIsCustomersLoading(true)
      const response = await fetch("/api/pos/customers/all")
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      const data = await response.json()
      
      setAllCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast.error("Failed to fetch customers")
    } finally {
      setIsCustomersLoading(false)
    }
  }, [])

  const findCustomerByPhone = useCallback(
    async (phone: string) => {
      if (!phone || phone.length < 10) return null

      try {
        const response = await fetch("/api/pos/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone }),
        })

      
        
        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error("Failed to fetch customer")
        }

        const customer = await response.json()
        console.log(customer , "customer")

        if (loyaltySettings && customer.availablePoints) {
          const canUseLoyalty = customer.availablePoints >= loyaltySettings.minRedeemPoints
          console.log(canUseLoyalty , "canUseLoyalty")
          setUserLoyaltyPoints(canUseLoyalty)

        }

        return customer
      } catch (error) {
        console.error("Error fetching customer:", error)
        return null
      }
    },
    [loyaltySettings],
  )

  return { allCustomers, userLoyaltyPoints, fetchAllCustomers, findCustomerByPhone, isCustomersLoading }
}

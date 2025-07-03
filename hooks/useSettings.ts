"use client"

import { useEffect, useState } from "react"

export const useSettings = () => {
  const [taxSettings, setTaxSettings] = useState<any>(null)
  const [currency, setCurrency] = useState<any>(null)
  const [restaurantSettings, setRestaurantSettings] = useState<any>(null)
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null)
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsSettingsLoading(true)

        const [taxResponse, restaurantResponse, loyaltyResponse, currencyResponse] = await Promise.all([
          fetch("/api/settings", {
            method: "POST",
            body: JSON.stringify({ key: "taxes" }),
          }),
          fetch("/api/settings", {
            method: "POST",
            body: JSON.stringify({ key: "company" }),
          }),
          fetch("/api/settings", {
            method: "POST",
            body: JSON.stringify({ key: "loyalty" }),
          }),
          fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "currency", isPublic: true }),
          }),
        ])

        const [taxData, restaurantData, loyaltyData, currencyData] = await Promise.all([
          taxResponse.json(),
          restaurantResponse.json(),
          loyaltyResponse.json(),
          currencyResponse.json(),
        ])

        setTaxSettings(JSON.parse(taxData.value))
        setRestaurantSettings(JSON.parse(restaurantData.value))
        setLoyaltySettings(JSON.parse(loyaltyData.value))

        if (currencyResponse.ok) {
          const currentCurrencySettings = JSON.parse(currencyData.value)
          const defaultCurrency =
            Object.entries(currentCurrencySettings).find(([_, value]) => (value as any).default)?.[0] || "USD"
          setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: "$" })
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      } finally {
        setIsSettingsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { taxSettings, currency, restaurantSettings, loyaltySettings, isSettingsLoading }
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function KitchenIndexPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/kitchen/dashboard")
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Redirecting...</h2>
        <p className="text-muted-foreground">
          Taking you to the kitchen dashboard
        </p>
      </div>
    </div>
  )
} 
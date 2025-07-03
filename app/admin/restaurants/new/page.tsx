'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { RestaurantForm } from '../_components/RestaurantForm'

export default function NewRestaurantPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'Admin') {
    return null
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Add New Restaurant</h2>
      </div>
      <div className="grid gap-4">
        <RestaurantForm />
      </div>
    </div>
  )
} 
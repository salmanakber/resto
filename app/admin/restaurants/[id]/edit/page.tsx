'use client'

import { useEffect, useState } from 'react'
import { useRouter , useParams } from 'next/navigation'
import { RestaurantForm } from '../../_components/RestaurantForm'
import { useToast } from '@/components/ui/use-toast'

interface Restaurant {
  id: string
  firstName: string
  lastName: string
  email: string
  restaurantName: string
  phone: string
  cuisine: string
  locationId: string
  isActive: boolean
}

export default function EditRestaurantPage({
 
}) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchRestaurant()
  }, [params])

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`/api/admin/restaurants/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant')
      }
      const data = await response.json()
      console.log(data)
      setRestaurant(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch restaurant',
        variant: 'destructive',
      })
    //   router.push('/admin/restaurants')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!restaurant) {
    return null
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-lg font-bold mb-6 ">Edit Restaurant</h1>
      <RestaurantForm restaurant={restaurant} />
    </div>
  )
} 
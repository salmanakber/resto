'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LocationForm } from '../_components/LocationForm'
import { toast } from 'sonner'

interface Location {
  id: string
  name: string
  address: string
  timeZone: string
  lat: string
  lng: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EditLocationPage() {
  const params = useParams()
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch(`/api/admin/locations/${params.locationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) throw new Error('Failed to fetch location')
        const data = await response.json()
        // Convert lat and lng to strings
        setLocation({
          ...data,
          lat: data.lat.toString(),
          lng: data.lng.toString()
        })
      } catch (error) {
        toast.error('Failed to fetch location')
        router.push('/admin/locations')
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [params.locationId, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!location) {
    return null
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Edit Location</h2>
      <LocationForm location={location} />
    </div>
  )
} 
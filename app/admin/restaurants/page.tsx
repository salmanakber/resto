'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TableSkeleton } from '@/app/components/skeletons/TableSkeleton'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface Restaurant {
  id: string
  restaurantName: string
  email: string
  phone: string
  cuisine: string
  rating: number
  status: 'active' | 'inactive'
  createdAt: string
  location: {
    id: string
    name: string
    city: string
  }
}

export default function RestaurantsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/admin/restaurants')
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }
        const data = await response.json()
        
        setRestaurants(data)
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated' && session?.user?.role === 'Admin') {
      fetchRestaurants()
    }
  }, [status, session])

  if (status === 'loading' || loading) {
    return <TableSkeleton columns={8} title="Restaurants" />
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'Admin') {
    return null
  }
  
  const restaurantNames = Array.from(new Set(restaurants.map(r => r.restaurantName)))
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = 
      restaurant.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.location.city.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter
    const matchesRestaurant = restaurantFilter === 'all' || restaurant.id === restaurantFilter

    return matchesSearch && matchesStatus && matchesRestaurant
  })
 

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Restaurants</h2>
        <Link href="/admin/restaurants/new">
          <Button className="bg-red-500 text-white hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Restaurant
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search restaurants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by restaurant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants.map(restaurant => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.restaurantName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredRestaurants} />
    </div>
  )
} 
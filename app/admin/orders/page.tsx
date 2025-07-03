'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TableSkeleton } from '@/app/components/skeletons/TableSkeleton'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './_components/columns'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderReports } from './_components/OrderReports'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  restaurant: {
    id: string
    firstName: string
    restaurantName: string
    email: string
  }
  location: {
    id: string
    name: string
    address: string
  }
}

interface OrderReports {
  totalOrders: number
  totalRevenue: string
  ordersByStatus: Array<{
    _count: number
    status: string
  }>
  ordersByMonth: Array<{
    _count: number
    _sum: {
      totalAmount: string
    }
    restaurantId: string
  }>
  topRestaurants: Array<{
    _sum: {
      totalAmount: string
    }
    _count: number
    restaurantId: string
    restaurantName: string
  }>
  averageOrderValue: string
  timeSeries: Array<{
    range: string
    data: Array<{
      date: string
      orders: number
      revenue: number
    }>
  }>
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [currency, setCurrency] = useState({ symbol: '$' })
  const [reports, setReports] = useState<OrderReports | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/admin/orders?restaurantId=${restaurantFilter}`)
        const currencyResponse = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: 'currency',
            isPublic: true,
          }),
        })
    
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        if (!currencyResponse.ok) {
          throw new Error('Failed to fetch currency')
        }
        const data = await response.json()
        const currencyData = await currencyResponse.json()
        
        setOrders(data.orders)
        setReports(data.reporting)
        
        const currentCurrencySettings = JSON.parse(currencyData.value)
        const defaultCurrency = Object.entries(currentCurrencySettings).find(
          ([_, value]) => (value as any).default
        )?.[0] || 'USD'
        setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: '$' })
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated' && session?.user?.role === 'Admin') {
      fetchOrders()
    }
  }, [status, session, restaurantFilter])

  if (status === 'loading' || loading) {
    return <TableSkeleton columns={8} title="Orders" />
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'Admin') {
    return null
  }

  
  const restaurants = Array.from(
    new Map(
      orders.map((o) => [
        o.restaurant.id,
        {
          id: o.restaurant.id,
          name: o.restaurant.restaurantName,
        },
      ])
    ).values()
  )

  
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.restaurant.restaurantName.toLowerCase().includes(searchQuery.toLowerCase())
  
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
  
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 space-y-4 p-0 pt-0">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <Select
          value={restaurantFilter}
          onValueChange={setRestaurantFilter}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select Restaurant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Restaurants</SelectItem>
            {restaurants.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reports && <OrderReports data={reports} currency={currency} />}

      <div className="flex gap-4">
        {/* Orders Section - 30% width */}
        <div className="w-[100%] space-y-4">
          <div className="flex items-center justify-between">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-4 p-3 bg-white rounded-lg shadow-md">
            <DataTable
              columns={columns}
              data={filteredOrders}
              searchKey="orderNumber"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 
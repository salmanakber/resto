"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Edit,
  Star,
  Trophy,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  DollarSign,
  Crown,
  Gift,
  Clock,
} from "lucide-react"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  lastVisit: string
  joinDate: string
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  avatar?: string
  favoriteItems: string[]
  orderHistory: Array<{
    id: string
    date: string
    items: string[]
    total: number
    status: string
  }>
  monthlySpending: Array<{
    month: string
    amount: number
  }>
  currency: string
  profileImage: string
}

export default function CustomerViewPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [params])

  const fetchCustomer = async () => {
    try {
      if (!params.id) return
      const response = await fetch(`/api/restaurant/customers/${params.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      // Simulated data - replace with actual API call
      const customerData: Customer = {
        id: params.id as string,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        loyaltyPoints: data.loyaltyPoints,
        totalOrders: data.totalOrders,
        totalSpent: data.totalSpent,
        lastVisit: data.lastVisit,
        joinDate: data.joinDate,
        tier: data.tier,
        favoriteItems: data.favoriteItems,
        orderHistory: data.orderHistory,
        monthlySpending: data.monthlySpending,
        currency: data.currency,
        profileImage: data.profileImage,
      }
      setCustomer(customerData)
    } catch (error) {
      console.error("Error fetching customer:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Crown }
      case "Gold":
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Trophy }
      case "Silver":
        return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Star }
      default:
        return { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Gift }
    }
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-200 rounded-full animate-spin border-t-rose-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading customer details...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Customer Not Found</h3>
            <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tierConfig = getTierConfig(customer.tier)
  const TierIcon = tierConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Customer Details</h1>
          </div>
          <Link href={`/restaurant/customers/${customer.id}/edit`}>
            <Button className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Customer
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Profile */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-rose-500 to-red-600"></div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={customer.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="bg-rose-100 text-rose-600 font-semibold text-2xl">
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{customer.name}</h2>
                  <Badge className={`${tierConfig.color} border font-medium px-3 py-1`}>
                    <TierIcon className="w-4 h-4 mr-1" />
                    {customer.tier} Member
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{customer.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{customer.phone}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">Joined {new Date(customer.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      Last visit: {new Date(customer.lastVisit).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Points */}
            <Card className="border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-600">
                  <Star className="w-5 h-5 mr-2" />
                  Loyalty Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">
                    {customer.loyaltyPoints.toLocaleString()}
                  </div>
                  <p className="text-gray-600">Available Points</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance & Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{customer.totalOrders}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Spent</p>
                      <p className="text-2xl font-bold text-green-600">{customer.currency}{customer.totalSpent}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Avg. Order</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {customer.currency}{(customer.totalSpent / customer.totalOrders).toFixed(2)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Favorite Items */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Favorite Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {customer.favoriteItems.map((item, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {customer.orderHistory.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">Order #{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{new Date(order.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{customer.currency}{order.total}</p>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Spending Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.monthlySpending.map((month) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center space-x-2 flex-1 mx-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-rose-500 to-red-600 h-2 rounded-full"
                            style={{ width: `${(month.amount / customer.totalSpent) * 100}%` }}
                          ></div>
                        </div>
                          <span className="text-sm font-semibold">{customer.currency}{month.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

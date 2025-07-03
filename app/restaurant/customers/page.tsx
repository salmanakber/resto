"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Eye, Edit, Star, Trophy, TrendingUp, Users, Crown, Gift } from "lucide-react"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  lastVisit: string
  joinDate: string
  tier: "Bronze" | "Silver" | "Gold" | "Platinum"
  avatar?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/restaurant/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      console.log(data, 'data')
      // Transform API data to match our UI interface
      const transformedCustomers: Customer[] = data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        lastVisit: customer.lastVisit,
        joinDate: customer.joinDate,
        currency: customer.currency,
        tier: customer.tier,
        avatar: undefined // We can add avatar support later if needed
      }))
      
      setCustomers(transformedCustomers)
    } catch (error) {
      console.error("Error fetching customers:", error)
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
  

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-rose-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-rose-600 font-medium">Loading customers...</p>
        </div>
      </div>
    )
  }

  const totalCustomers = customers.length
  const totalLoyaltyPoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0)
  const averageSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / customers.length
  const currency = customers[0].currency

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
            Customer Management
          </h1>
          <p className="text-gray-600 text-lg">Manage your loyal customers and their rewards</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-rose-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Total Customers</p>
                  <p className="text-3xl font-bold">{totalCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-rose-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Loyalty Points</p>
                  <p className="text-3xl font-bold text-yellow-600">{totalLoyaltyPoints.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Average Spent</p>
                  <p className="text-3xl font-bold text-green-600">{currency}{averageSpent.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-rose-500 focus:ring-rose-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => {
            const tierConfig = getTierConfig(customer.tier)
            const TierIcon = tierConfig.icon
            return (
              <Card
                key={customer.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-rose-500 to-red-600"></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={customer.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-rose-100 text-rose-600 font-semibold">
                          {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-800">{customer.name}</h3>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </div>
                    <Badge className={`${tierConfig.color} border font-medium px-2 py-1`}>
                      <TierIcon className="w-3 h-3 mr-1" />
                      {customer.tier}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Loyalty Points</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="font-semibold text-yellow-600">{customer.loyaltyPoints}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Orders</span>
                      <span className="font-semibold">{customer.totalOrders}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Spent</span>
                      <span className="font-semibold text-green-600">{customer.currency}{customer.totalSpent}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Visit</span>
                      <span className="text-sm">{new Date(customer.lastVisit).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link href={`/restaurant/customers/${customer.id}/view`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/restaurant/customers/${customer.id}/edit`} className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Customers Found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

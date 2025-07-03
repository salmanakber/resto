"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "./_components/Overview"
import { RecentOrders } from "./_components/RecentOrders"
import { Analytics } from "./_components/Analytics"
import { RestaurantMetrics } from "./_components/RestaurantMetrics"
import { DashboardSkeleton } from "./_components/DashboardSkeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Users, ShoppingCart, Building2, BarChart3, Store, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Restaurant {
  id: string
  name: string
  email: string
  restaurantName: string
  metrics: {
    totalRevenue: number
    totalOrders: number
    totalMenuItems: number
    totalReviews: number
    averageRating: number
    revenueByMonth: any[]
    customerGrowth: any[]
    orderStatusDistribution: any[]
    topSellingItems: any[]
    recentOrders: any[]
  }
}

interface DashboardData {
  restaurants: Restaurant[]
  overall: {
    totalRevenue: number
    totalOrders: number
    totalUsers: number
    totalRestaurants: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    restaurants: [],
    overall: {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      totalRestaurants: 0,
    },
  })
  const [selectedRestaurant, setSelectedRestaurant] = useState("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard")

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const dashboardData = await response.json()
        console.log(dashboardData)

        setData(dashboardData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated" && session?.user?.role === "Admin") {
      fetchData()
    }
  }, [status, session])

  if (status === "loading" || loading) {
    return <DashboardSkeleton />
  }

  if (status === "unauthenticated" || session?.user?.role !== "Admin") {
    return null
  }

  const { restaurants, overall } = data
  const selectedRestaurantData =
    selectedRestaurant === "all"
      ? {
          id: "all",
          name: "All Restaurants",
          email: "",
          restaurantName: "All",
          metrics: restaurants.reduce(
            (acc, r) => {
              acc.totalRevenue += r.metrics.totalRevenue
              acc.totalOrders += r.metrics.totalOrders
              acc.totalMenuItems += r.metrics.totalMenuItems
              acc.totalReviews += r.metrics.totalReviews

              // Combine arrays if needed (example: concat all recent orders)
              acc.revenueByMonth.push(...r.metrics.revenueByMonth)
              acc.topSellingItems.push(...r.metrics.topSellingItems)
              acc.orderStatusDistribution.push(...r.metrics.orderStatusDistribution)
              acc.customerGrowth.push(...r.metrics.customerGrowth)
              acc.ordersByPaymentMethod.push(...r.metrics.ordersByPaymentMethod)
              acc.ordersByLocation.push(...r.metrics.ordersByLocation)
              acc.recentOrders.push(...r.metrics.recentOrders)

              return acc
            },
            {
              totalRevenue: 0,
              totalOrders: 0,
              totalMenuItems: 0,
              totalReviews: 0,
              averageRating: 0, // Optional: you can calculate weighted average separately
              revenueByMonth: [],
              topSellingItems: [],
              orderStatusDistribution: [],
              customerGrowth: [],
              ordersByPaymentMethod: [],
              ordersByLocation: [],
              recentOrders: [],
            },
          ),
        }
      : restaurants.find((r) => r.id === selectedRestaurant)

  return (
    <div className="flex-1 space-y-6 p-0 pt-6 bg-gray-50/30 min-h-screen">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your restaurants.</p>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Live Data
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white shadow-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="restaurants" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Restaurants
              </TabsTrigger>
            </TabsList>

            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[250px] bg-white shadow-sm">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    All Restaurants
                  </div>
                </SelectItem>
                {restaurants.map((restaurant: Restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      {restaurant.restaurantName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
                  <div className="p-2 rounded-lg bg-green-100">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ${Number(overall.totalRevenue).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total revenue from completed orders</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Orders</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overall.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total number of orders placed</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overall.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total registered customers</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-rose-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Active Restaurants</CardTitle>
                  <div className="p-2 rounded-lg bg-rose-100">
                    <Building2 className="h-4 w-4 text-rose-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overall.totalRestaurants}</div>
                  <p className="text-xs text-muted-foreground">Total registered restaurants</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 border-0 shadow-lg">
                <CardContent className="p-6">
                  <Overview
                    revenueByMonth={selectedRestaurantData?.metrics.revenueByMonth || []}
                    customerGrowth={selectedRestaurantData?.metrics.customerGrowth || []}
                  />
                </CardContent>
              </Card>
              <Card className="col-span-3 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-rose-600" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentOrders orders={selectedRestaurantData?.metrics.recentOrders || []} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Analytics
              orderStatusDistribution={selectedRestaurantData?.metrics.orderStatusDistribution || []}
              topSellingItems={selectedRestaurantData?.metrics.topSellingItems || []}
            />
          </TabsContent>

          <TabsContent value="restaurants" className="space-y-6">
            <RestaurantMetrics restaurants={restaurants} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ShoppingBag,
  Users,
  Star,
  TrendingUp,
  Download,
  Calendar,
  Settings,
  MoreVertical,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Printer,
  UserCircle,
  MessageSquare,
  Filter,
  RefreshCw,
  Package,
  Utensils,
  TrendingDown,
  PackageCheck,
  Clock,
  PieChart,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Legend,
  Pie,
} from "recharts"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from "chart.js"
import Image from "next/image"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler,
)

type Period = "daily" | "weekly" | "monthly"

type Currency = {
  symbol: string;
  code: string;
  name: string;
  default?: boolean;
}

type Order = {
  id: string;
  customer: string;
  total: number;
  status: string;
  time: string;
  order: string;
}

type TrendingItem = {
  id: string;
  name: string;
  price: number;
  orderCount: number;
  image: string;
  trend: string;
  order: string;
}

type StatCard = {
  title: string;
  value: any;
  icon: React.ComponentType<{ className?: string }>;
  change: number;
  changeType: string;
  chartData: any[];
  color: string;
}

export default function RestaurantDashboard() {
  const router = useRouter()
  const [revenuePeriod, setRevenuePeriod] = useState<Period>("monthly")
  const [customerPeriod, setCustomerPeriod] = useState<Period>("monthly")
  const [ratingsPeriod, setRatingsPeriod] = useState<Period>("monthly")
  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [customerData, setCustomerData] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tables, setTables] = useState<any[]>([])
  const [currency, setCurrency] = useState<Currency>({ symbol: "$", code: "USD", name: "US Dollar" })
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([])
  const [staffPerformance, setStaffPerformance] = useState<any[]>([])
  const [hourlyOrders, setHourlyOrders] = useState<any[]>([])
  const [orderPerformance, setOrderPerformance] = useState<any>({})
  const [previousMonthData, setPreviousMonthData] = useState<any>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshingExport, setRefreshingExport] = useState(false)
  function formatShortCurrency(amount: number | string) {
    const number = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
  
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const i = number === 0 ? 0 : Math.floor(Math.log10(Math.abs(number)) / 3);
    const short = number / Math.pow(1000, i);
  
    return `${currency.symbol}${short.toFixed(1)}${suffixes[i]}`;
  }
  

  function formatTimeFromMinutes(minutes: number): string {
    const totalSeconds = Math.round(minutes * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
  
    const formatted = [
      mins > 0 ? `${mins} min` : null,
      secs > 0 ? `${secs} sec` : null,
    ]
      .filter(Boolean)
      .join(' ');
  
    return formatted || '0 sec';
  }
  

  const fetchDashboardData = async (period = "monthly") => {
    try {
      setIsLoading(true)
      const [dashboardRes, settingsRes, previousMonthRes] = await Promise.all([
        fetch(`/api/restaurant/dashboard?period=${period}`),
        fetch("/api/settings", {
          method: "POST",
          body: JSON.stringify({ key: "currency" }),
        }),
        fetch(`/api/restaurant/dashboard?period=${period}&previous=true`),
      ])

      const [dashboardData, settingsData, previousMonthData] = await Promise.all([
        dashboardRes.json(),
        settingsRes.json(),
        previousMonthRes.json(),
      ])
      setPreviousMonthData(previousMonthData.previousMonthDataStat)

      // Update state with dashboard data
      setStats({
        stats: {
          menus: dashboardData.categoryPerformance.length,
          orders: dashboardData.orderPerformance.totalOrders,
          customers: dashboardData.customerActivity.length,
          income: dashboardData.revenueAnalytics.reduce((sum: number, item: any) => sum + item.revenue, 0),
          expenses: dashboardData.revenueAnalytics.reduce((sum: number, item: any) => sum + item.expenses, 0),
        },
        
        ratings: {
          average: dashboardData.customerReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / dashboardData.customerReviews.length || 0,
          total: dashboardData.customerReviews.length,
          distribution: dashboardData.customerReviews.reduce((acc: any, review: any) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1
            return acc
          }, {}),
        },
        recentOrders: dashboardData.customerActivity.slice(0, 5).map((customer: any) => ({
          id: customer.customerId,
          customer: customer.name,
          total: customer.totalSpent,
          status: "completed",
          time: new Date(customer.lastOrderDate).toLocaleTimeString(),
          order: `${customer.orderCount}x`,
        })),
        trendingItems: dashboardData.trendingItems,
      })

      setRevenueData(dashboardData.revenueAnalytics.map((item: any) => ({
        name: new Date(item.date).toLocaleDateString(),
        income: item.revenue,
        expense: item.expenses,
      })))

      setCustomerData(dashboardData.customerActivity.map((customer: any) => ({
        day: new Date(customer.lastOrderDate).toLocaleDateString(),
        value: customer.orderCount,
      })))

      setReviews(dashboardData.customerReviews)
      setTables(dashboardData.tables)

      setCategoryPerformance(dashboardData.categoryPerformance)
      setStaffPerformance(dashboardData.staffPerformance)

      setHourlyOrders(dashboardData.hourlyOrders)
      setOrderPerformance(dashboardData.orderPerformance)

      // Update currency settings
      const currentCurrencySettings = JSON.parse(settingsData.value)
      const defaultCurrency =
        Object.entries(currentCurrencySettings).find(([_, value]) => (value as any).default)?.[0] || "USD"
      setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: "$", code: "USD", name: "US Dollar" })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData(revenuePeriod)
  }, [revenuePeriod])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "delivered":
        return "text-green-600 bg-green-50 border-green-200"
      case "accepted":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "preparing":
        return "text-purple-600 bg-purple-50 border-purple-200"
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const formatCurrency = (value: number) => {
    return currency.symbol + Number(value).toFixed(2)
  }

  const averageRating = stats?.ratings?.average || 0
  const totalRatings = stats?.ratings?.total || 0

  // Mock data for new reporting components
  const hourlyOrdersData = [
    { hour: "6AM", orders: 5, revenue: 125 },
    { hour: "7AM", orders: 12, revenue: 280 },
    { hour: "8AM", orders: 25, revenue: 650 },
    { hour: "9AM", orders: 18, revenue: 420 },
    { hour: "10AM", orders: 15, revenue: 380 },
    { hour: "11AM", orders: 22, revenue: 580 },
    { hour: "12PM", orders: 45, revenue: 1200 },
    { hour: "1PM", orders: 52, revenue: 1450 },
    { hour: "2PM", orders: 38, revenue: 980 },
    { hour: "3PM", orders: 28, revenue: 720 },
    { hour: "4PM", orders: 20, revenue: 520 },
    { hour: "5PM", orders: 35, revenue: 890 },
    { hour: "6PM", orders: 48, revenue: 1280 },
    { hour: "7PM", orders: 55, revenue: 1520 },
    { hour: "8PM", orders: 42, revenue: 1150 },
    { hour: "9PM", orders: 30, revenue: 780 },
    { hour: "10PM", orders: 18, revenue: 450 },
    { hour: "11PM", orders: 8, revenue: 200 },
  ]

  const categoryPerformanceData = [
    { name: "Appetizers", orders: 145, revenue: 2890, margin: 65 },
    { name: "Main Course", orders: 320, revenue: 8960, margin: 58 },
    { name: "Desserts", orders: 89, revenue: 1245, margin: 72 },
    { name: "Beverages", orders: 256, revenue: 1820, margin: 80 },
    { name: "Specials", orders: 67, revenue: 2140, margin: 45 },
  ]

  const deliveryMetrics = [
    { name: "On Time", value: 78, color: "#10b981" },
    { name: "Delayed", value: 15, color: "#f59e0b" },
    { name: "Cancelled", value: 7, color: "#ef4444" },
  ]

  const staffPerformanceData = [
    { name: "John Doe", role: "Chef", orders: 45, rating: 4.8, efficiency: 92 },
    { name: "Sarah Smith", role: "Waiter", orders: 38, rating: 4.6, efficiency: 88 },
    { name: "Mike Johnson", role: "Kitchen", orders: 52, rating: 4.7, efficiency: 90 },
    { name: "Emma Wilson", role: "Cashier", orders: 41, rating: 4.9, efficiency: 95 },
  ]

  
  // Enhanced stats cards with better design
  const statCards: StatCard[] = [
    {
      title: "Total Orders",
      value: stats?.stats?.orders || 0,
      icon: ShoppingBag,
      change: previousMonthData ? calculateChange(stats?.stats?.orders || 0, previousMonthData.orders.length) : 0,
      changeType: previousMonthData ? (stats?.stats?.orders > previousMonthData.orders.length ? "increase" : "decrease") : "neutral",
      chartData: hourlyOrders.map(hour => hour.orders),
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Revenue",
      value: formatShortCurrency(stats?.stats?.income || 0),
      icon: DollarSign,
      change: previousMonthData ? calculateChange(stats?.stats?.income || 0, previousMonthData.revenue) : 0,
      changeType: previousMonthData ? (stats?.stats?.income > previousMonthData.revenue ? "increase" : "decrease") : "neutral",
      chartData: hourlyOrders.map(hour => hour.revenue),
      color: "from-green-500 to-green-600",
    },
    {
      title: "Total Customers",
      value: stats?.stats?.customers || 0,
      icon: Users,
      change: previousMonthData ? calculateChange(stats?.stats?.customers || 0, previousMonthData.customers.length) : 0,
      changeType: previousMonthData ? (stats?.stats?.customers > previousMonthData.customers.length ? "increase" : "decrease") : "neutral",
      chartData: customerData.map(customer => customer.value),
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Menu Items",
      value: stats?.stats?.menus || 0,
      icon: UtensilsCrossed,
      change: previousMonthData ? calculateChange(stats?.stats?.menus || 0, previousMonthData.menuCategories.length) : 0,
      changeType: previousMonthData ? (stats?.stats?.menus > previousMonthData.menuCategories.length ? "increase" : "decrease") : "neutral",
      chartData: categoryPerformance.map(category => category.orderCount),
      color: "from-rose-500 to-rose-600",
    },
  ]

  // Add helper function to calculate percentage change
  function calculateChange(current: number, previous: number): string {
    if (!previous) return "0" + "%"
    const change = Math.round(((current - previous) / previous) * 100)
    if(previous > current) return "" + change + "%"
    if(previous < current) return "+" + change + "%"
    return "0" + "%"
  }

  // Update the ratings data
  const ratingsData = stats?.ratings?.distribution
    ? [
        { name: "5 Stars", value: stats.ratings.distribution[5], fill: "#10b981" },
        { name: "4 Stars", value: stats.ratings.distribution[4], fill: "#22c55e" },
        { name: "3 Stars", value: stats.ratings.distribution[3], fill: "#facc15" },
        { name: "2 Stars", value: stats.ratings.distribution[2], fill: "#f97316" },
        { name: "1 Star", value: stats.ratings.distribution[1], fill: "#ef4444" },
      ]
    : []

  const orderPerformanceChartData = [
    { name: "On Time", value: orderPerformance.onTime },
    { name: "Delayed", value: orderPerformance.delayed },
    { name: "Cancelled", value: orderPerformance.cancelled },
  ]

  // Update the recent reviews
  const recentReviews = reviews.map((review) => ({
    id: review.id,
    name: review.name,
    avatar: review.avatar,
    rating: review.rating,
    date: new Date(review.date).toLocaleDateString(),
    comment: review.comment,
    dish: review.dish,
  }))

  // Update the recent orders
  const mockRecentOrders =
    stats?.recentOrders?.map((order: any) => ({
      id: order.id,
      customer: order.customer,
      location: "Restaurant Location",
      total: Number(order.total),
      status: order.status,
      image: "/images/default-food.jpg",
      order: "1x",
      time: "5 min ago",
    })) || []

  // Update the trending items
  
  const mockTrendingItems =
    stats?.trendingItems?.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      order: `${item.orderCount}x`,
      trend: item.trend,
    })) || []

    
  // Add export function
  const exportDashboardData = async () => {
    setRefreshingExport(true)
    try {
      const response = await fetch('/api/restaurant/dashboard/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: revenuePeriod,
          data: {
            stats,
            categoryPerformance,
            staffPerformance,
            orderPerformance,
            hourlyOrders,
            customerActivity: customerData,
            revenueAnalytics: revenueData,
            customerReviews: reviews,
            tables,
          },
        }),
      })

      if (!response.ok) throw new Error('Export failed')
      toast.success('Dashboard exported successfully downloading...')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `restaurant-dashboard-${revenuePeriod}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting dashboard:', error)
      toast.error('Failed to export dashboard data')
    } finally {
      setRefreshingExport(false)
    }
  }
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData(revenuePeriod)
    setRefreshing(false)
    toast.success("Dashboard refreshed")
  }

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-200 rounded-full animate-spin border-t-rose-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading menu items...</p>
        </div>
      </div>
    )
  }

 
  const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length > 0) {
      const dataPoint = payload[0].payload
      if(dataPoint.revenue > 0) {
  
      return (
        
        <div style={{ backgroundColor: 'white', border: '1px solid #ccc', padding: 10 }}>
          <p style={{ margin: 0 }}>Date: {dataPoint.date} </p>
          <p style={{ margin: 0 }}>Hour: {dataPoint.hour}</p>
          <p style={{ margin: 0 }}>Orders: {dataPoint.orders}</p>
          <p style={{ margin: 0 }}>Revenue: {formatShortCurrency(dataPoint.revenue)}</p>
        </div>
        )
      }
    }
  
    return null
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Restaurant Dashboard
                </h1>
                <p className="text-gray-600 text-lg">Monitor performance and manage operations</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
    
            <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) => setRevenuePeriod(value as Period)}
            defaultValue={revenuePeriod}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <Button 
                variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
            onClick={exportDashboardData}
            disabled={refreshingExport}
            >
              <Download className="mr-2 h-4 w-4" />
              {refreshingExport ? <Loader2 className="animate-spin" /> : null}
              Export Report
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}
              />
              <CardContent className="p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      <div
                        className={`flex items-center text-sm font-medium ${
                          stat.changeType === "increase" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.changeType === "increase" ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 bg-gradient-to-r ${stat.color} text-white shadow-lg`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stat.chartData.map((value, i) => ({ value, name: i }))}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={stat.changeType === "increase" ? "#10b981" : "#ef4444"}
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Hourly Performance Chart */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Hourly Performance</CardTitle>
                <CardDescription className="text-gray-600">Orders and revenue throughout the day</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  Daily
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart   data={hourlyOrders} >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <XAxis dataKey="date" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#ec4899" />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Tables and Ratings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Table Management */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Table Management</CardTitle>
                  <CardDescription className="text-gray-300">Real-time table availability</CardDescription>
                </div>
                <Badge className="bg-white/20 text-white">
                  {tables.filter((t) => t.status === "available").length} Available 
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[300px]">
                {tables.map((table) => (
                  <div key={table.id} className="relative">
                    <button
                      className={`w-full aspect-square rounded-xl shadow-lg flex flex-col items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-105 ${
                        table.status === "occupied"
                          ? "bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse"
                          : "bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                      }`}
                    >
                      <span className="text-2xl mb-1">{table.name}</span>
                      <span className="text-sm opacity-90">#{table.number}</span>
                    </button>
                    <Badge
                      className={`absolute -top-2 -right-2 ${
                        table.status === "occupied"
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-green-100 text-green-800 border-green-200"
                      }`}
                    >
                      {table.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Customer Ratings */}
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Customer Satisfaction</CardTitle>
                  <CardDescription className="text-gray-300">Rating breakdown and feedback</CardDescription>
                </div>
                <Tabs value={ratingsPeriod} onValueChange={(value) => setRatingsPeriod(value as Period)}>
                  <TabsList className="bg-white/10">
                    <TabsTrigger value="monthly" className="text-xs data-[state=active]:bg-white/20">
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-white/20">
                      Weekly
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="relative mb-3">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto">
                      <h3 className="text-2xl font-bold text-white">{averageRating}</h3>
                    </div>
                  </div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${Number.parseFloat(averageRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{totalRatings} reviews</p>
                </div>
              </div>

              <div className="space-y-3">
                {ratingsData.map((rating, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center w-16">
                      <span className="text-sm font-medium">{5 - index}</span>
                      <Star className="h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(rating.value / totalRatings) * 100}%`,
                            backgroundColor: rating.fill,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right">
                      <span className="text-sm font-medium">{rating.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Category Performance Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Category Performance</CardTitle>
            <CardDescription>Revenue and margin analysis by menu category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryPerformance.map((category) => (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.orderCount} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatShortCurrency(category.revenue)}</p>
                    <p className="text-sm text-green-600">{category.orderCount} items sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Revenue Chart & Customer Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Revenue Analytics</CardTitle>
                  <CardDescription>Income vs expenses over time</CardDescription>
                </div>
                <Tabs value={revenuePeriod} onValueChange={(value) => setRevenuePeriod(value as Period)}>
                  <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Income</p>
                  <h4 className="text-xl font-bold text-green-600">{formatShortCurrency(stats?.stats?.income || 0)}</h4>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Expenses</p>
                  <h4 className="text-xl font-bold text-red-600">{formatShortCurrency(stats?.stats?.expenses || 0)}</h4>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#db2777" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#db2777" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <Tooltip formatter={(value) => formatShortCurrency(value as number)} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Customer Activity</CardTitle>
                  <CardDescription>Daily customer engagement patterns</CardDescription>
                </div>
                <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={customerPeriod === "monthly" ? "bg-white shadow-sm" : ""}
                    onClick={() => setCustomerPeriod("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={customerPeriod === "weekly" ? "bg-white shadow-sm" : ""}
                    onClick={() => setCustomerPeriod("weekly")}
                  >
                    Weekly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Delivery Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Order Performance</CardTitle>
              <CardDescription>Order fulfillment metrics</CardDescription>
            </CardHeader>
            <CardContent>
           <div className="h-48 ">
           
           <ResponsiveContainer width="100%" height={200}>
  <BarChart data={orderPerformanceChartData}>
    <XAxis dataKey="name" />
    {/* <YAxis /> */}
    <Tooltip /> 
    <Bar dataKey="value" fill="#db2777" />
  </BarChart>
</ResponsiveContainer>

           </div>

  <div className="space-y-2 mt-4">
    {[
      { name: "On Time", value: orderPerformance.onTime, color: "#10b981" },
      { name: "Delayed", value: orderPerformance.delayed, color: "#f59e0b" },
      { name: "Cancelled", value: orderPerformance.cancelled, color: "#ef4444" },
    ].map((metric, index) => (
      <div key={index} className="flex items-center justify-between ">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
          <span className="text-sm">{metric.name}</span>
        </div>
        <span className="font-semibold">{metric.value}%</span>
      </div>
    ))}
  </div>
</CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Staff Performance</CardTitle>
              <CardDescription>Team efficiency and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformance.map((staff) => (
                  <div key={staff.staffId} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                          {staff.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{staff.name}</h4>
                        <p className="text-sm text-gray-600">{staff.role}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center items-center flex flex-col gap-2  ">
                        <p className="text-sm text-gray-600 text-xs">Average Time</p>
                        <Clock className="h-4 w-4 text-blue-500" />
                        <p className="text-xs">{formatTimeFromMinutes(staff.averageTime / staff.completedOrders / 60 || 0)}</p>
                      </div>

                    <div className="text-center items-center flex flex-col gap-2">
                        <p className="text-sm text-gray-600 text-xs">Incomplete Orders</p>
                        <PackageCheck className="h-4 w-4 text-red-500" />
                        <p className="text-xs">{staff.orders - staff.completedOrders}</p>
                      </div>

                      <div className="text-center items-center flex flex-col gap-2">
                        <p className="text-sm text-gray-600 text-xs">Completed Orders</p>
                        <PackageCheck className="h-4 w-4 text-green-500" />
                        <p className="text-xs ">{staff.completedOrders}</p>
                      </div>
                  
                      <div className="text-center flex flex-col items-center gap-2">
                      <p className="text-sm text-gray-600 text-xs">Efficiency</p>
                      {staff.efficiency > 80 ? (
                        <TrendingUp className={`h-4 w-4 text-green-500`} />
                      ) : (
                        <TrendingDown className={`h-4 w-4 text-red-500`} />
                      )}
                        <p className="text-sm text-gray-600 text-xs">
                          {staff.efficiency}% 
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Recent Orders & Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                  <CardDescription>Latest order requests and status</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentOrders.slice(0, 5).map((order: Order, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{order.customer}</p>
                      <p className="text-sm text-gray-600">{order.time}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-green-600">{formatShortCurrency(order.total)}</span>
                        <span className="text-xs text-gray-500">{order.order}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getStatusColor(order.status)} text-xs font-medium`}>{order.status}</Badge>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold">Customer Reviews</CardTitle>
                  <CardDescription>Recent feedback and ratings</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentReviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.name} />
                          <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                            {review.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{review.name}</h4>
                          <p className="text-xs text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {review.dish}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ThumbsUp className="h-4 w-4 text-gray-400 hover:text-green-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ThumbsDown className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Trending Menus */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-semibold">Trending Menu Items</CardTitle>
                <CardDescription>Most popular dishes and their performance</CardDescription>
              </div>
              <div className="flex gap-2">
         
                <Button variant="outline" size="sm"
                
                onClick={() => router.push("/restaurant/menu-items")}
                  >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {mockTrendingItems.map((item: TrendingItem, i: number) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      width={300}
                      height={200}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3">
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-semibold text-sm mb-1">{item.name}</h3>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{formatShortCurrency(item.price)}</span>
                      <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                        {item.order} sold
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

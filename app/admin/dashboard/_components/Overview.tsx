"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { format, parseISO } from "date-fns"
import { DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react"

interface OverviewProps {
  revenueByMonth: {
    createdAt: Date
    _sum: {
      totalAmount: number
    }
  }[]
  customerGrowth: {
    createdAt: Date
    _count: {
      id: number
    }
  }[]
}

export function Overview({ revenueByMonth, customerGrowth }: OverviewProps) {
  const revenueData = revenueByMonth.map((item) => ({
    date: format(parseISO(item.createdAt.toString()), "MMM yyyy"),
    revenue: Number(item._sum.totalAmount),
  }))

  const customerData = customerGrowth.map((item) => ({
    date: format(parseISO(item.createdAt.toString()), "MMM yyyy"),
    customers: item._count.id,
  }))

  // Calculate growth percentages
  const revenueGrowth =
    revenueData.length > 1
      ? ((revenueData[revenueData.length - 1].revenue - revenueData[revenueData.length - 2].revenue) /
          revenueData[revenueData.length - 2].revenue) *
        100
      : 0

  const customerGrowthRate =
    customerData.length > 1
      ? ((customerData[customerData.length - 1].customers - customerData[customerData.length - 2].customers) /
          customerData[customerData.length - 2].customers) *
        100
      : 0

  const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-600">
            {payload[0].name}:{" "}
            <span className="font-semibold text-rose-600">
              {prefix}
              {payload[0].value.toLocaleString()}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Revenue Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Monthly revenue trends</p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center gap-1 text-sm font-medium ${revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">vs last month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} prefix="$" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2, fill: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Customer Growth</CardTitle>
                <p className="text-sm text-muted-foreground">New customer registrations</p>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center gap-1 text-sm font-medium ${customerGrowthRate >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {customerGrowthRate >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(customerGrowthRate).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">vs last month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip content={(props) => <CustomTooltip {...props} />} />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

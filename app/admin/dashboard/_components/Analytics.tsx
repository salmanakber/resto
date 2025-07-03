"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, Package } from "lucide-react"

interface AnalyticsProps {
  orderStatusDistribution: {
    status: string
    _count: {
      status: number
    }
  }[]
  topSellingItems: {
    items: string
    _count: {
      items: number
    }
  }[]
}

const STATUS_COLORS = {
  completed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  processing: "#8b5cf6",
}

const ITEM_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]

export function Analytics({ orderStatusDistribution, topSellingItems }: AnalyticsProps) {
  const statusData = orderStatusDistribution.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item._count.status,
    color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || "#6b7280",
  }))

  const itemsData = topSellingItems.slice(0, 8).map((item, index) => {
    const parsedItems = JSON.parse(item.items)
    return {
      name: parsedItems[0]?.name || "Unknown",
      value: item._count.items,
      fill: ITEM_COLORS[index % ITEM_COLORS.length],
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Orders: <span className="font-semibold text-rose-600">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-semibold text-rose-600">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
        <p className="text-muted-foreground">Insights into order patterns and popular items</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-rose-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100">
                <TrendingUp className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Order Status Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">Current order statuses breakdown</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => <span style={{ color: entry.color, fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-100">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Top Selling Items</CardTitle>
                <p className="text-sm text-muted-foreground">Most popular menu items</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} stroke="none" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

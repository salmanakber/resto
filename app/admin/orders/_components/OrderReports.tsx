'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { startOfYear, addMonths, format, getDaysInMonth, addDays, startOfMonth, addHours, startOfDay } from 'date-fns';



const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

interface OrderReportsProps {
  data: {
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
  currency: {
    symbol: string
  }
}

export function OrderReports({ data, currency }: OrderReportsProps) {
  const [timeRange, setTimeRange] = useState('yearly')

  const statusData = data.ordersByStatus.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item._count
  }))

  const restaurantData = data.topRestaurants.map(item => ({
    name: item.restaurantName,
    revenue: Number(item._sum.totalAmount),
    orders: item._count
  }))

  const fillTimeSeriesData = (range: string, data: Array<{ date: string, orders: number, revenue: number }>) => {
    const dataMap = new Map<string, { date: string, orders: number, revenue: number }>();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
  
    const dataMapLong = new Map(data.map(item => [item.date, item]));

    data.forEach(item => {
        const [hour, _minute] = item.date.split(':');
        const normalizedHour = String(Number(hour)).padStart(2, '0') + ':00';
    
        if (dataMap.has(normalizedHour)) {
          const existing = dataMap.get(normalizedHour)!;
          existing.orders += item.orders;
          existing.revenue += item.revenue;
        } else {
          dataMap.set(normalizedHour, {
            date: normalizedHour,
            orders: item.orders,
            revenue: item.revenue
          });
        }
      });
  
    const filledData = [];
  
    if (range === 'yearly') {
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i);
        const formattedDate = format(date, 'yyyy-MM');
        filledData.push(dataMapLong.get(formattedDate) || { date: formattedDate, orders: 0, revenue: 0 });
      }
    } else if (range === 'monthly') {
      const daysInMonth = getDaysInMonth(new Date(currentYear, currentMonth));
      for (let i = 1; i <= daysInMonth; i++) {
        const day = String(i).padStart(2, '0');
        filledData.push(dataMapLong.get(day) || { date: day, orders: 0, revenue: 0 });
      }
    } else if (range === 'weekly') {
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (const day of weekDays) {
        filledData.push(dataMapLong.get(day) || { date: day, orders: 0, revenue: 0 });
      }
    }  else if (range === 'daily') {
        for (let i = 0; i < 24; i++) {
          const hour = String(i).padStart(2, '0') + ':00';
          filledData.push(dataMap.get(hour) || { date: hour, orders: 0, revenue: 0 });
        }
    } else {
      return data;
    }
  
    return filledData;
  };
  
  const rawData = data.timeSeries.find(series => series.range === timeRange)?.data || []
  console.log(rawData)
  const timeSeriesData = fillTimeSeriesData(timeRange, rawData)

  return (
    <div className="space-y-4">
      {/* Top Stats Row */}
      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(data.totalRevenue), currency.symbol)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(data.averageOrderValue), currency.symbol)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.topRestaurants[0]?.restaurantName || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.topRestaurants[0]?._count || 0} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order Trends</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange} >
                <SelectTrigger className="w-[180px] focus:ring-0">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="bg-white focus:ring-0">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3"  />
                  <XAxis
  dataKey="date"
  tickFormatter={(value) => {
    if (timeRange === 'yearly') {
      const [year, month] = value.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      return format(date, 'MMM');
    } else if (timeRange === 'monthly') {
      return value;
    } else if (timeRange === 'weekly') {
      return value;
    } else if (timeRange === 'daily') {
      return value;
    } else {
      return value;
    }
  }}
/>

                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name: string) => [name === 'Revenue' ? formatCurrency(value, currency.symbol): value, name === 'orders' ? 'orders' : name
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '10px',
                      color: 'black'
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    stroke="black"
                    name="Orders"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="red"
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
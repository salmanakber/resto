'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TableSkeleton } from '@/app/components/skeletons/TableSkeleton'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './_components/columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Download, Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: string
  orders: {
    id: string
    totalAmount: number
  }[]
  reviews: {
    id: string
    rating: number
  }[]
}

interface RestaurantReport {
  restaurantId: string
  restaurantName: string
  totalCustomers: number
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  activeCustomers: number
  customerRetentionRate: number
  customers: Customer[]
}

const COLORS = ['#e41e3f', '#ff6b6b', '#ff9e7d', '#ffd166', '#06d6a0']

export default function CustomerReportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<RestaurantReport[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [currency, setCurrency] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    const fetchCurrency = async () => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'currency', isPublic: true }),
      })
      if (!response.ok) throw new Error('Failed to fetch currency')
      const currencyData = await response.json()
      const currentCurrencySettings = JSON.parse(currencyData.value)
      const defaultCurrency = Object.entries(currentCurrencySettings).find(
        ([_, value]) => (value as any).default
      )?.[0] || 'USD'
      setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: '$' })
    }
    fetchCurrency()
  }, [])

  const fetchReports = async () => {
      try {
        const response = await fetch('/api/admin/customers')
      if (!response.ok) throw new Error('Failed to fetch reports')
      const data: RestaurantReport[] = await response.json()
      setReports(data)
      } catch (error) {
      console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }

  if (status === 'loading' || loading) {
    return <TableSkeleton columns={7} title="Customers" />
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'Admin') {
    return null
  }

  // Combine all reports when no restaurant is selected
  const allRestaurantsReport: RestaurantReport = {
    restaurantId: 'all',
    restaurantName: 'All Restaurants',
    totalCustomers: reports.reduce((sum, r) => sum + r.totalCustomers, 0),
    totalOrders: reports.reduce((sum, r) => sum + r.totalOrders, 0),
    totalRevenue: reports.reduce((sum, r) => sum + r.totalRevenue, 0),
    averageOrderValue: 0, // optional to calculate if needed
    activeCustomers: reports.reduce((sum, r) => sum + r.activeCustomers, 0),
    customerRetentionRate: reports.length
      ? reports.reduce((sum, r) => sum + r.customerRetentionRate, 0) / reports.length
      : 0,
    customers: reports.flatMap(r => r.customers),
  }

  const selectedReport = selectedRestaurant
    ? reports.find(r => r.restaurantId === selectedRestaurant)
    : allRestaurantsReport

    const exportToCSV = () => {
      if (!selectedReport) return;
    
      const headers = [
        'Name',
        'Email',
        'Phone',
        'Total Orders',
        'Total Spent',
        'Last Order',
        'Rating',
      ];
    
      const csvData = selectedReport.customers.map((customer) => {
        const totalOrders = customer.orders?.length || 0;
        const totalSpent = customer.orders?.reduce(
          (sum, order) => sum + order.totalAmount,
          0
        );
        const lastOrderDate =
          totalOrders > 0
            ? customer.orders[customer.orders.length - 1].createdAt
            : '';
    
        const ratingAvg =
          customer.reviews?.length > 0
            ? (
                customer.reviews.reduce((sum, review) => sum + review.rating, 0) /
                customer.reviews.length
              ).toFixed(1)
            : '0';
    
        return [
          `${customer.firstName} ${customer.lastName}`,
          customer.email || '',
          customer.phone || '',
          totalOrders,
          totalSpent,
          lastOrderDate,
          ratingAvg,
        ];
      });
    
    

    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedReport.restaurantName}-customers.csv`
    link.click()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Reports</h1>
        <div className="flex items-center gap-2">
          <div>
            <Select onValueChange={value => setSelectedRestaurant(value === 'all' ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Restaurant" />
          </SelectTrigger>
          <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {reports.map(report => (
                  <SelectItem key={report.restaurantId} value={report.restaurantId}>
                    {report.restaurantName}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
          </div>
          <Button onClick={exportToCSV} className="bg-[#e41e3f] hover:bg-[#c01835] text-white">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-[#e41e3f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedReport?.totalCustomers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-[#e41e3f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedReport?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#e41e3f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency?.symbol || '$'} {selectedReport?.totalRevenue.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#e41e3f]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedReport?.customerRetentionRate.toFixed(1) || '0'}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer List</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: selectedReport?.activeCustomers || 0 },
                          { name: 'Inactive', value: (selectedReport?.totalCustomers || 0) - (selectedReport?.activeCustomers || 0) },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={selectedReport?.customers
                        ?.sort((a, b) => b.totalSpent - a.totalSpent)
                        .slice(0, 5)
                        .map(c => ({
                          name: c.name, // already full name in "name" field
                          revenue: c.totalSpent,
                        })) || []}
                    >
                      
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
    
                    {/* <YAxis /> */}
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#e41e3f"  label={({ value }) => `${currency?.symbol} ${value.toLocaleString()}`} formatter={(value) => `${currency?.symbol} ${value.toLocaleString()}`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Loyalty Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReport?.customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell>{currency?.symbol || '$'} {customer.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{customer.loyaltyPoints}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Render Table or Charts here using selectedReport.customers */}
    </div>
  )
} 








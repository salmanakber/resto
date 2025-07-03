"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  CalendarIcon,
  Plus,
  Search,
  Trash2,
  Edit2,
  Activity,
  Trophy,
  Users,
  Shield,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RestaurantGroup {
  id: string
  name: string
  totalStaff: number
  users: User[]
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  status: string
  role: {
    name: string
    displayName: string
  }
  createdAt: string
  lastLogin: string | null
  restaurant?: {
    id: string
    name: string
    address: string
    phone: string
  }
  itAccess?: {
    expiryDate: string
    isActive: boolean
  }[]
}

interface KitchenStaffPerformance {
  id: string
  name: string
  role: string
  restaurant: string
  totalOrders: number
  completedOrders: number
  averageCompletionTime: number
  lastActive: string | null
  performance: {
    efficiency: number
    speed: number
  }
  restaurantId: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [kitchenPerformance, setKitchenPerformance] = useState<KitchenStaffPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("admin")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    restaurantId: "",
    expiryDate: null as Date | null,
  })
  const [usersByRestaurant, setUsersByRestaurant] = useState<RestaurantGroup[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all")
  const [restaurantOptions, setRestaurantOptions] = useState<{ id: string; name: string }[]>([])
  const [currentPerformerIndex, setCurrentPerformerIndex] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [activeTab, search, page])

  useEffect(() => {
    if (usersByRestaurant.length > 0) {
      setRestaurantOptions([
        { id: "all", name: "All Restaurants" },
        ...usersByRestaurant.map((restaurant) => ({
          id: restaurant.id,
          name: restaurant.restaurantName,
        })),
      ])
    }
  }, [usersByRestaurant])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users?type=${activeTab}&search=${search}&page=${page}&limit=10`)
      const data = await response.json()
      
      setUsers(data.users)
      setUsersByRestaurant(data.usersByRestaurant)
      setTotal(data.total)
      if (activeTab === "restaurant") {
        setKitchenPerformance(data.kitchenPerformance)
      }
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create user")

      toast.success("User created successfully")
      setIsAddUserOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error("Failed to create user")
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to update user")

      toast.success("User updated successfully")
      setIsEditUserOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error("Failed to update user")
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      toast.success("User deleted successfully")
      fetchUsers()
    } catch (error) {
      toast.error("Failed to delete user")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-3 w-3" />
      case "inactive":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const renderUserTable = (users: User[]) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 border-b border-gray-100">
            <TableHead className="font-semibold text-gray-700">Name</TableHead>
            <TableHead className="font-semibold text-gray-700">Email</TableHead>
            <TableHead className="font-semibold text-gray-700">Role</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="font-semibold text-gray-700">Last Login</TableHead>
            {activeTab === "it" && <TableHead className="font-semibold text-gray-700">Access Expiry</TableHead>}
            <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
              <TableCell className="font-medium text-gray-900">{`${user.firstName} ${user.lastName}`}</TableCell>
              <TableCell className="text-gray-600">{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium">
                  {user.role.displayName}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    user.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-red-100 text-red-700 border-red-200",
                  )}
                  variant="outline"
                >
                  {getStatusIcon(user.status)}
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600">
                {user.lastLogin ? format(new Date(user.lastLogin), "PPp") : "Never"}
              </TableCell>
              {activeTab === "it" && (
                <TableCell className="text-gray-600">
                  {user.itAccess?.[0]?.expiryDate ? format(new Date(user.itAccess[0].expiryDate), "PP") : "N/A"}
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedUser(user)
                      setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        password: "",
                        role: user.role.name,
                        restaurantId: "",
                        expiryDate: user.itAccess?.[0]?.expiryDate ? new Date(user.itAccess[0].expiryDate) : null,
                      })
                      setIsEditUserOpen(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const filteredKitchenPerformance = kitchenPerformance.filter(
    (staff) => selectedRestaurant === "all" || staff.restaurantId === selectedRestaurant,
  )

  const filteredUsers = users.filter((user) => selectedRestaurant === "all" || user.restaurantId === selectedRestaurant)

  const renderPerformanceChart = () => {
    const chartData = filteredKitchenPerformance
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5)
      .map((staff) => ({
        name: staff.name,
        orders: staff.totalOrders,
        efficiency: staff.performance.efficiency,
      }))

    const topPerformers = filteredKitchenPerformance.sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5)

    const nextPerformer = () => {
      setCurrentPerformerIndex((prev) => (prev + 1) % topPerformers.length)
    }

    const prevPerformer = () => {
      setCurrentPerformerIndex((prev) => (prev - 1 + topPerformers.length) % topPerformers.length)
    }

    return (
      <div className="space-y-6">
        {/* Performance Chart */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trophy className="h-5 w-5 text-red-600" />
              </div>
              Kitchen Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="orders" name="Total Orders" fill="#374151" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="efficiency" name="Efficiency %" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers Carousel */}
        {topPerformers.length > 0 && (
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-red-600" />
                  </div>
                  Top Performer Spotlight
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPerformer}
                    className="h-8 w-8 border-red-200 hover:bg-red-50 bg-transparent"
                    disabled={topPerformers.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {currentPerformerIndex + 1} of {topPerformers.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPerformer}
                    className="h-8 w-8 border-red-200 hover:bg-red-50 bg-transparent"
                    disabled={topPerformers.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentPerformerIndex * 100}%)` }}
                >
                  {topPerformers.map((staff, index) => (
                    <div key={staff.id} className="w-full flex-shrink-0">
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
                            <p className="text-sm text-gray-600 font-medium">{staff.role}</p>
                            <p className="text-sm text-red-600 font-medium">{staff.restaurant}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-3 bg-red-100 rounded-full">
                              <Activity className="h-6 w-6 text-red-600" />
                            </div>
                            {index === 0 && (
                              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                #1 Performer
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Orders</span>
                              <span className="text-2xl font-bold text-red-600">{staff.totalOrders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Completed</span>
                              <span className="text-xl font-semibold text-emerald-600">{staff.completedOrders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Success Rate</span>
                              <span className="text-lg font-semibold text-gray-900">
                                {staff.totalOrders
                                  ? `${Math.round((staff.completedOrders / staff.totalOrders) * 100)}%`
                                  : "N/A"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Efficiency</span>
                                <span className="text-sm font-semibold text-gray-700">
                                  {staff.performance.efficiency}%
                                </span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                                  style={{ width: `${staff.performance.efficiency}%` }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Speed Score</span>
                                <span className="text-sm font-semibold text-gray-700">{staff.performance.speed}%</span>
                              </div>
                              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                  style={{ width: `${staff.performance.speed}%` }}
                                />
                              </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Last Active</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {staff.lastActive ? format(new Date(staff.lastActive), "MMM dd, HH:mm") : "Never"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderRestaurantSelector = () => (
    <div className="flex items-center gap-4 mb-8">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-gray-200 focus:border-red-300 focus:ring-red-200"
        />
      </div>
      <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
        <SelectTrigger className="w-[240px] border-gray-200 focus:border-red-300 focus:ring-red-200">
          <SelectValue placeholder="Select restaurant" />
        </SelectTrigger>
        <SelectContent>
          {restaurantOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "admin":
        return <Shield className="h-4 w-4" />
      case "restaurant":
        return <Building2 className="h-4 w-4" />
      case "it":
        return <Users className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users, roles, and permissions across your organization</p>
            </div>
            {activeTab !== "restaurant" && (
              <Button
                onClick={() => setIsAddUserOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            )}
          </div>

          {renderRestaurantSelector()}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="admin"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
              >
                {getTabIcon("admin")}
                Admin Users
              </TabsTrigger>
              <TabsTrigger
                value="restaurant"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
              >
                {getTabIcon("restaurant")}
                Restaurant Staff
              </TabsTrigger>
              <TabsTrigger
                value="it"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
              >
                {getTabIcon("it")}
                IT Access
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="space-y-6">
              {renderUserTable(users)}
            </TabsContent>

            <TabsContent value="restaurant" className="space-y-8">
              {renderPerformanceChart()}

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                  Staff Directory
                </h2>
                {renderUserTable(filteredUsers)}
              </div>
            </TabsContent>

            <TabsContent value="it" className="space-y-6">
              {renderUserTable(users)}
            </TabsContent>
          </Tabs>

          {/* Add User Dialog */}
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">Add New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="border-gray-200 focus:border-red-300 focus:ring-red-200">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="it_access">IT Access</SelectItem>
                      <SelectItem value="Restaurant">Restaurant Owner</SelectItem>
                      <SelectItem value="Restaurant_manager">Restaurant Manager</SelectItem>
                      <SelectItem value="Restaurant_supervisor">Restaurant Supervisor</SelectItem>
                      <SelectItem value="Kitchen_boy">Kitchen Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "it_access" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Access Expiry</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-gray-200",
                            !formData.expiryDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expiryDate ? format(formData.expiryDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expiryDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, expiryDate: date || null })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className="bg-red-600 hover:bg-red-700">
                  Add User
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900">Edit User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="edit-firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="edit-lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-gray-200 focus:border-red-300 focus:ring-red-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="border-gray-200 focus:border-red-300 focus:ring-red-200">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="it_access">IT Access</SelectItem>
                      <SelectItem value="Restaurant">Restaurant Owner</SelectItem>
                      <SelectItem value="Restaurant_manager">Restaurant Manager</SelectItem>
                      <SelectItem value="Restaurant_supervisor">Restaurant Supervisor</SelectItem>
                      <SelectItem value="Kitchen_boy">Kitchen Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "it_access" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Access Expiry</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-gray-200",
                            !formData.expiryDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.expiryDate ? format(formData.expiryDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.expiryDate || undefined}
                          onSelect={(date) => setFormData({ ...formData, expiryDate: date || null })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser} className="bg-red-600 hover:bg-red-700">
                  Update User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

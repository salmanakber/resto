"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  Star, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight 
} from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Types
interface StaffMember {
  id: string
  name: string
  position: string
  email: string
  phone: string
  hireDate: string
  status: "active" | "vacation" | "sick" | "terminated"
  avatar?: string
  performance: {
    ordersCompleted: number
    accuracy: number // percentage
    speed: number // minutes per order
    customerRating: number // 1-5
    monthlyStats: {
      month: string
      ordersCompleted: number
      accuracy: number
      speed: number
      customerRating: number
    }[]
  }
}

export default function KitchenStaffPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openStaffDialog, setOpenStaffDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  // Mock staff data
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: "staff-1",
      name: "John Chen",
      position: "Head Chef",
      email: "john.chen@openpho.com",
      phone: "+1 (555) 123-4567",
      hireDate: "2020-05-15",
      status: "active",
      avatar: "/avatars/chef1.jpg",
      performance: {
        ordersCompleted: 2845,
        accuracy: 98.5,
        speed: 14.2,
        customerRating: 4.8,
        monthlyStats: [
          { month: "Jan", ordersCompleted: 245, accuracy: 98.2, speed: 14.5, customerRating: 4.7 },
          { month: "Feb", ordersCompleted: 230, accuracy: 98.4, speed: 14.3, customerRating: 4.8 },
          { month: "Mar", ordersCompleted: 252, accuracy: 98.6, speed: 14.1, customerRating: 4.8 },
          { month: "Apr", ordersCompleted: 248, accuracy: 98.5, speed: 14.2, customerRating: 4.8 },
          { month: "May", ordersCompleted: 255, accuracy: 98.7, speed: 14.0, customerRating: 4.9 },
          { month: "Jun", ordersCompleted: 258, accuracy: 98.8, speed: 13.9, customerRating: 4.9 }
        ]
      }
    },
    {
      id: "staff-2",
      name: "Maria Rodriguez",
      position: "Sous Chef",
      email: "maria.rodriguez@openpho.com",
      phone: "+1 (555) 234-5678",
      hireDate: "2021-02-10",
      status: "active",
      avatar: "/avatars/chef2.jpg",
      performance: {
        ordersCompleted: 2156,
        accuracy: 97.2,
        speed: 15.4,
        customerRating: 4.6,
        monthlyStats: [
          { month: "Jan", ordersCompleted: 180, accuracy: 97.0, speed: 15.8, customerRating: 4.5 },
          { month: "Feb", ordersCompleted: 175, accuracy: 97.1, speed: 15.6, customerRating: 4.5 },
          { month: "Mar", ordersCompleted: 185, accuracy: 97.2, speed: 15.4, customerRating: 4.6 },
          { month: "Apr", ordersCompleted: 182, accuracy: 97.2, speed: 15.3, customerRating: 4.6 },
          { month: "May", ordersCompleted: 188, accuracy: 97.3, speed: 15.2, customerRating: 4.7 },
          { month: "Jun", ordersCompleted: 192, accuracy: 97.4, speed: 15.0, customerRating: 4.7 }
        ]
      }
    },
    {
      id: "staff-3",
      name: "David Kim",
      position: "Line Cook",
      email: "david.kim@openpho.com",
      phone: "+1 (555) 345-6789",
      hireDate: "2021-08-22",
      status: "sick",
      avatar: "/avatars/chef3.jpg",
      performance: {
        ordersCompleted: 1820,
        accuracy: 95.8,
        speed: 16.2,
        customerRating: 4.4,
        monthlyStats: [
          { month: "Jan", ordersCompleted: 150, accuracy: 95.2, speed: 16.8, customerRating: 4.3 },
          { month: "Feb", ordersCompleted: 155, accuracy: 95.4, speed: 16.6, customerRating: 4.3 },
          { month: "Mar", ordersCompleted: 160, accuracy: 95.6, speed: 16.4, customerRating: 4.4 },
          { month: "Apr", ordersCompleted: 158, accuracy: 95.7, speed: 16.3, customerRating: 4.4 },
          { month: "May", ordersCompleted: 165, accuracy: 95.9, speed: 16.1, customerRating: 4.5 },
          { month: "Jun", ordersCompleted: 162, accuracy: 96.0, speed: 16.0, customerRating: 4.5 }
        ]
      }
    },
    {
      id: "staff-4",
      name: "Sarah Wong",
      position: "Prep Cook",
      email: "sarah.wong@openpho.com",
      phone: "+1 (555) 456-7890",
      hireDate: "2022-03-05",
      status: "active",
      avatar: "/avatars/chef4.jpg",
      performance: {
        ordersCompleted: 1540,
        accuracy: 94.5,
        speed: 17.5,
        customerRating: 4.3,
        monthlyStats: [
          { month: "Jan", ordersCompleted: 120, accuracy: 94.0, speed: 18.0, customerRating: 4.2 },
          { month: "Feb", ordersCompleted: 125, accuracy: 94.2, speed: 17.8, customerRating: 4.2 },
          { month: "Mar", ordersCompleted: 130, accuracy: 94.4, speed: 17.6, customerRating: 4.3 },
          { month: "Apr", ordersCompleted: 132, accuracy: 94.5, speed: 17.5, customerRating: 4.3 },
          { month: "May", ordersCompleted: 135, accuracy: 94.7, speed: 17.3, customerRating: 4.4 },
          { month: "Jun", ordersCompleted: 138, accuracy: 94.8, speed: 17.2, customerRating: 4.4 }
        ]
      }
    },
    {
      id: "staff-5",
      name: "Michael Johnson",
      position: "Dishwasher",
      email: "michael.johnson@openpho.com",
      phone: "+1 (555) 567-8901",
      hireDate: "2022-09-18",
      status: "vacation",
      avatar: "/avatars/chef5.jpg",
      performance: {
        ordersCompleted: 0, // Not directly involved in orders
        accuracy: 96.0,
        speed: 0, // Not measured
        customerRating: 0, // Not rated
        monthlyStats: [
          { month: "Jan", ordersCompleted: 0, accuracy: 95.5, speed: 0, customerRating: 0 },
          { month: "Feb", ordersCompleted: 0, accuracy: 95.6, speed: 0, customerRating: 0 },
          { month: "Mar", ordersCompleted: 0, accuracy: 95.8, speed: 0, customerRating: 0 },
          { month: "Apr", ordersCompleted: 0, accuracy: 96.0, speed: 0, customerRating: 0 },
          { month: "May", ordersCompleted: 0, accuracy: 96.2, speed: 0, customerRating: 0 },
          { month: "Jun", ordersCompleted: 0, accuracy: 96.3, speed: 0, customerRating: 0 }
        ]
      }
    }
  ])

  // Function to handle staff edit
  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff)
    setOpenStaffDialog(true)
  }

  // Function to handle staff save (add/edit)
  const handleSaveStaff = (formData: any) => {
    // Here you would handle saving the staff member (either add new or update existing)
    // For now, just close the dialog
    setOpenStaffDialog(false)
    setSelectedStaff(null)
  }

  // Function to create new staff
  const handleAddStaff = () => {
    setSelectedStaff({
      id: "",
      name: "",
      position: "",
      email: "",
      phone: "",
      hireDate: new Date().toISOString().split('T')[0],
      status: "active",
      performance: {
        ordersCompleted: 0,
        accuracy: 0,
        speed: 0,
        customerRating: 0,
        monthlyStats: []
      }
    })
    setOpenStaffDialog(true)
  }

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-[#e41e3f]"
      case "vacation": return "bg-amber-500"
      case "sick": return "bg-orange-500"
      case "terminated": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date)
  }

  // Filter staff based on active tab
  const filteredStaff = activeTab === "all" 
    ? staffMembers 
    : staffMembers.filter(staff => staff.status === activeTab)

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Kitchen Staff</h1>
        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search staff..."
              className="w-full pl-8 bg-white border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={openStaffDialog} onOpenChange={setOpenStaffDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => handleAddStaff()} className="bg-[#e41e3f] hover:bg-[#d01935] text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedStaff?.id ? "Edit Staff Member" : "Add New Staff Member"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details below to {selectedStaff?.id ? "update the" : "create a new"} staff record.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={selectedStaff?.name || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" defaultValue={selectedStaff?.position || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={selectedStaff?.email || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={selectedStaff?.phone || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input id="hireDate" type="date" defaultValue={selectedStaff?.hireDate || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={selectedStaff?.status || "active"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="vacation">On Vacation</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenStaffDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveStaff({})} className="bg-[#e41e3f] hover:bg-[#d01935] text-white">
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="border border-gray-200 bg-white mb-4">
          <TabsTrigger value="all">All Staff</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="vacation">On Vacation</TabsTrigger>
          <TabsTrigger value="sick">Sick Leave</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-800">Staff Overview</CardTitle>
              <CardDescription className="text-gray-500">
                Manage your kitchen staff members and view their performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Orders Completed</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map(staff => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={staff.avatar} alt={staff.name} />
                            <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{staff.name}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{staff.position}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${getStatusColor(staff.status)} text-white`}>
                          {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          {formatDate(staff.hireDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.performance.ordersCompleted > 0 ? staff.performance.ordersCompleted.toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell>
                        {staff.performance.customerRating > 0 ? (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            {staff.performance.customerRating.toFixed(1)}
                          </div>
                        ) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link 
                          href={`/restaurant/kitchen-staff/${staff.id}`} 
                          className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-white border border-gray-200 shadow-sm text-sm font-medium hover:bg-gray-50"
                        >
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Performance Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-800">Average Order Time</CardTitle>
            <CardDescription className="text-gray-500">
              Average time to prepare orders by staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {staffMembers
                .filter(staff => staff.status === "active" && staff.performance.speed > 0)
                .sort((a, b) => a.performance.speed - b.performance.speed)
                .slice(0, 3)
                .map(staff => (
                  <div key={staff.id} className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={staff.avatar} alt={staff.name} />
                      <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{staff.name}</p>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-sm">{staff.performance.speed} min</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#e41e3f] rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (1 - (staff.performance.speed / 20)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-800">Order Accuracy</CardTitle>
            <CardDescription className="text-gray-500">
              Staff with highest order accuracy rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {staffMembers
                .filter(staff => staff.status === "active" && staff.performance.accuracy > 0)
                .sort((a, b) => b.performance.accuracy - a.performance.accuracy)
                .slice(0, 3)
                .map(staff => (
                  <div key={staff.id} className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={staff.avatar} alt={staff.name} />
                      <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{staff.name}</p>
                        <div className="flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          <span className="text-sm">{staff.performance.accuracy}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ 
                            width: `${staff.performance.accuracy}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-800">Customer Ratings</CardTitle>
            <CardDescription className="text-gray-500">
              Staff with highest customer satisfaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {staffMembers
                .filter(staff => staff.status === "active" && staff.performance.customerRating > 0)
                .sort((a, b) => b.performance.customerRating - a.performance.customerRating)
                .slice(0, 3)
                .map(staff => (
                  <div key={staff.id} className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={staff.avatar} alt={staff.name} />
                      <AvatarFallback>{staff.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{staff.name}</p>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 mr-1 text-yellow-400" />
                          <span className="text-sm">{staff.performance.customerRating.toFixed(1)}/5</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-400 rounded-full" 
                          style={{ 
                            width: `${(staff.performance.customerRating / 5) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, Search, Filter, Clock, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthDialog } from "@/components/auth/auth-dialog"

// Order types
interface OrderItem {
  name: string
  quantity: number
  price: number
  options?: string[]
}

interface Order {
  id: string
  date: string
  status: "completed" | "canceled" | "processing"
  total: number
  items: OrderItem[]
  restaurant: string
  orderType: "pickup"
  receipt: string
}

// Mock order data
const mockOrders: Order[] = [
  {
    id: "ORD-2023-06789",
    date: "2023-06-15T18:30:00",
    status: "completed",
    total: 42.85,
    items: [
      { name: "Special Pho", quantity: 2, price: 14.95, options: ["Large size", "Extra meat +$3.00"] },
      { name: "Spring Rolls", quantity: 1, price: 6.95, options: ["Peanut sauce"] },
      { name: "Vietnamese Coffee", quantity: 1, price: 3.95 }
    ],
    restaurant: "OpenPho Downtown",
    orderType: "pickup",
    receipt: "receipt-6789.pdf"
  },
  {
    id: "ORD-2023-05432",
    date: "2023-05-28T12:15:00",
    status: "completed",
    total: 31.45,
    items: [
      { name: "Beef Pho", quantity: 1, price: 13.95 },
      { name: "Banh Mi Sandwich", quantity: 2, price: 8.75, options: ["Spicy", "Extra vegetables"] }
    ],
    restaurant: "OpenPho Midtown",
    orderType: "pickup",
    receipt: "receipt-5432.pdf"
  },
  {
    id: "ORD-2023-04321",
    date: "2023-04-12T19:45:00",
    status: "canceled",
    total: 53.75,
    items: [
      { name: "Family Pho Set", quantity: 1, price: 39.95, options: ["Extra sides"] },
      { name: "Summer Rolls", quantity: 2, price: 6.95 },
      { name: "Iced Tea", quantity: 2, price: 2.95 }
    ],
    restaurant: "OpenPho Downtown",
    orderType: "pickup",
    receipt: "receipt-4321.pdf"
  },
  {
    id: "ORD-2023-03210",
    date: "2023-03-05T13:20:00",
    status: "completed",
    total: 27.85,
    items: [
      { name: "Chicken Pho", quantity: 1, price: 12.95 },
      { name: "Veggie Spring Rolls", quantity: 1, price: 5.95 },
      { name: "Bubble Tea", quantity: 2, price: 4.50, options: ["Less sugar", "Extra boba"] }
    ],
    restaurant: "OpenPho Downtown",
    orderType: "pickup",
    receipt: "receipt-3210.pdf"
  },
  {
    id: "ORD-2023-02109",
    date: "2023-02-18T18:00:00",
    status: "completed",
    total: 38.95,
    items: [
      { name: "Seafood Pho", quantity: 1, price: 16.95, options: ["Large size"] },
      { name: "Grilled Pork Rice", quantity: 1, price: 14.95 },
      { name: "Lemonade", quantity: 2, price: 3.50 }
    ],
    restaurant: "OpenPho Midtown",
    orderType: "pickup",
    receipt: "receipt-2109.pdf"
  },
  {
    id: "ORD-2023-01098",
    date: "2023-01-02T12:30:00",
    status: "completed",
    total: 22.95,
    items: [
      { name: "Veggie Pho", quantity: 1, price: 11.95 },
      { name: "Tofu Fresh Rolls", quantity: 1, price: 5.95 },
      { name: "Green Tea", quantity: 1, price: 2.95, options: ["Hot"] }
    ],
    restaurant: "OpenPho Downtown",
    orderType: "pickup",
    receipt: "receipt-1098.pdf"
  }
]

export default function OrderHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    })
  }
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit'
    })
  }
  
  // Format to readable date and time
  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`
  }
  
  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }
  
  // Filter orders
  const filteredOrders = mockOrders.filter(order => {
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
    // Status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
      
    // Date filter (simplified for mock data)
    let matchesDate = true
    const orderDate = new Date(order.date)
    const now = new Date()
    
    if (dateFilter === "last30days") {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(now.getDate() - 30)
      matchesDate = orderDate >= thirtyDaysAgo
    } else if (dateFilter === "last6months") {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      matchesDate = orderDate >= sixMonthsAgo
    } else if (dateFilter === "lastyear") {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(now.getFullYear() - 1)
      matchesDate = orderDate >= oneYearAgo
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white text-[#e41e3f] shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto">
          {/* Main header row */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo - Always visible */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="bg-[#e41e3f] text-white p-2 rounded-md">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M7.5 12C7.5 12.83 6.83 13.5 6 13.5C5.17 13.5 4.5 12.83 4.5 12C4.5 11.17 5.17 10.5 6 10.5C6.83 10.5 7.5 11.17 7.5 12Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M19.5 12C19.5 12.83 18.83 13.5 18 13.5C17.17 13.5 16.5 12.83 16.5 12C16.5 11.17 17.17 10.5 18 10.5C18.83 10.5 19.5 11.17 19.5 12Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <span className="font-['RedRose'] font-bold text-lg ml-2 text-gray-800">OPENPHO</span>
              </div>
            </div>

            {/* Mobile menu button - Only visible on mobile */}
            <div className="md:hidden flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full text-white bg-[#e41e3f] hover:bg-[#c01835]"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
              <Button 
                className="bg-[#e41e3f] p-2 rounded-md text-white"
                onClick={() => {
                  const menu = document.getElementById('mobile-menu');
                  if (menu) menu.classList.toggle('hidden');
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </Button>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center">
              <Button
                variant="ghost"
                className="rounded-none px-8 py-5 text-base font-medium transition-all duration-200 bg-[#e41e3f] text-white hover:bg-[#c01835]"
              >
                PICKUP
              </Button>
            </div>

            {/* Desktop Action Buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative w-10 h-10 rounded-full text-white bg-[#e41e3f] hover:bg-[#c01835]"
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <AuthDialog 
                defaultTab="signup"
                trigger={
                  <Button className="bg-[#e41e3f] hover:bg-[#c01835] text-white">Sign Up</Button>
                }
              />
            </div>
          </div>

          {/* Mobile Menu - Hidden by default */}
          <div id="mobile-menu" className="hidden md:hidden border-t border-gray-100 px-4 py-3 bg-white">
            <div className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className="justify-start py-2 text-base font-medium text-white bg-[#e41e3f] hover:bg-[#c01835] transition-all duration-200"
              >
                PICKUP
              </Button>
              <div className="pt-2 border-t border-gray-100">
                <AuthDialog 
                  defaultTab="signup"
                  trigger={
                    <Button className="w-full bg-[#e41e3f] hover:bg-[#c01835] text-white">Sign Up</Button>
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-[#8b1a2b]"></div>
      </header>

      <div className="flex flex-1">
        {/* Left Icon Sticky Menu */}
        <div className="fixed left-0 top-0 bottom-0 w-16 bg-white shadow-md z-10 flex flex-col items-center pt-20 pb-6 space-y-8 border-r border-gray-100">
        <Link href="/order-history" className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Order History
    </span>
  </Link>
  <Link href="/help" className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Help
    </span>
  </Link>
  <Link href="/cart" className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Cart
    </span>
  </Link>
  <Link href="/account" className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      Account
    </span>
  </Link>
          <div className="flex-grow"></div>
          <button className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Sign Out
            </span>
          </button>
        </div>
        
        <main className="flex-1 ml-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold font-['Poppins'] text-gray-900">Order History</h1>
                <p className="text-gray-600 mt-1 font-['Poppins']">View and track your past orders</p>
              </div>
              
              <Link href="/">
                <Button className="bg-[#e41e3f] hover:bg-[#c01835] font-['Poppins']">
                  Order Again
                </Button>
              </Link>
            </div>
            
            {/* Filter and Search */}
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders by ID or item..."
                    className="pl-10 font-['Poppins']"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <div className="flex-1 min-w-[140px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="font-['Poppins']">
                        <Filter className="h-4 w-4 mr-2 text-gray-500" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-['Poppins']">All Statuses</SelectItem>
                        <SelectItem value="completed" className="font-['Poppins']">Completed</SelectItem>
                        <SelectItem value="canceled" className="font-['Poppins']">Canceled</SelectItem>
                        <SelectItem value="processing" className="font-['Poppins']">Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[160px]">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="font-['Poppins']">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <SelectValue placeholder="Filter by time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-['Poppins']">All Time</SelectItem>
                        <SelectItem value="last30days" className="font-['Poppins']">Last 30 Days</SelectItem>
                        <SelectItem value="last6months" className="font-['Poppins']">Last 6 Months</SelectItem>
                        <SelectItem value="lastyear" className="font-['Poppins']">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order List */}
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="border-gray-200 overflow-hidden">
                    <CardHeader className="p-4 bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="font-['Poppins'] text-gray-800 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span>{order.id}</span>
                            <Badge 
                              className={`
                                text-xs font-normal sm:ml-2 
                                ${order.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                  order.status === 'canceled' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                                  'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
                              `}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </CardTitle>
                          <div className="text-sm text-gray-500 font-['Poppins'] mt-1">
                            {formatDateTime(order.date)} • {order.restaurant}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium text-gray-900 font-['Poppins']">${order.total.toFixed(2)}</div>
                            <div className="text-xs text-gray-500 font-['Poppins'] uppercase">{order.orderType}</div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleOrderExpansion(order.id)}
                            aria-label="Toggle order details"
                          >
                            {expandedOrderId === order.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {expandedOrderId === order.id && (
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 font-['Poppins']">Order Items</h4>
                            <div className="space-y-3">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                  <div>
                                    <div className="font-medium font-['Poppins']">
                                      {item.quantity}x {item.name}
                                    </div>
                                    {item.options && item.options.length > 0 && (
                                      <div className="text-sm text-gray-500 font-['Poppins']">
                                        {item.options.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right font-['Poppins']">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2 font-['Poppins']">Pickup Details</h4>
                              <div className="text-sm text-gray-700 font-['Poppins']">
                                <p>{order.restaurant}</p>
                                <p>123 Main Street, Anytown</p>
                                <p>Pickup time: {formatTime(order.date)}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Link href={`/order-history/${order.id}`}>
                                <Button variant="outline" className="font-['Poppins']">
                                  View Details
                                </Button>
                              </Link>
                              
                              {order.status === "completed" && (
                                <Link href={`#`}>
                                  <Button variant="outline" className="font-['Poppins']">
                                    Download Receipt
                                  </Button>
                                </Link>
                              )}
                              
                              {order.status === "completed" && (
                                <Link href={`/`}>
                                  <Button className="bg-[#e41e3f] hover:bg-[#c01835] font-['Poppins']">
                                    Reorder
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow">
                <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100 mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2 font-['Poppins']">No orders found</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto font-['Poppins']">
                  {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                    ? "No orders match your current filters. Try adjusting your search criteria."
                    : "You haven't placed any orders yet. Browse our menu to start ordering."}
                </p>
                <Link href="/">
                  <Button className="bg-[#e41e3f] hover:bg-[#c01835] font-['Poppins']">
                    Browse Menu
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 
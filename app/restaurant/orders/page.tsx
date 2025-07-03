  "use client"

  import { useState, useEffect, useRef } from "react"
  import { Card, CardContent } from "@/components/ui/card"
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
  import { Input } from "@/components/ui/input"
  import { Button } from "@/components/ui/button"
  import { Badge } from "@/components/ui/badge"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { Checkbox } from "@/components/ui/checkbox"
  import {
    ChevronRight,
    Search,
    MapPin,
    User,
    Phone,
    Clock,
    CreditCard,
    DollarSign,
    ChefHat,
    Utensils,
    ShoppingBag,
    BadgeCheck,
    Percent,
    Gift,
    Check,
    X,
    Download,
    ChevronLeft,
    Printer,
    RefreshCw,
    Calendar,
    Loader2,
  } from "lucide-react"
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { io } from "socket.io-client"
  import { format, startOfDay, endOfDay, subDays, isToday, isYesterday, formatDistanceToNow } from "date-fns"
  import { Calendar as CalendarUI } from "@/components/ui/calendar"
  import { toast } from "sonner"
  import { formatCurrency } from "@/lib/utils"
  import PickupOrderReceipt from "../../components/receipt/PickupOrderReceipt"
  // Types
  type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled"

  interface OrderItem {
    id: string
    name: string
    quantity: number
    price: number
    options?: string[]
    prepTime?: number
  }

  interface Order {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    customerPhone: string
    orderType: "dine-in" | "pickup" | "delivery"
    tableNumber?: string
    tableId?: string
    deliveryAddress?: string
    items: OrderItem[]
    subtotal: number
    tax: number
    total: number
    totalAmount?: number
    status: OrderStatus
    paymentMethod: "cash" | "credit_card" | "debit_card" | "mobile_payment"
    paymentStatus?: "paid" | "unpaid"
    placedAt: string
    createdAt: string
    updatedAt?: string
    estimatedReadyTime?: string
    completedAt?: string
    notes?: string
    specialInstructions?: string
    kitchenAssigned?: boolean
    kitchenOrder?: {
      status: string
    }
    customerDetails?: any
    dineInCustomer?: string
  }

  // --- Types ---
  type Notification = { message: string }

  // --- Notification Bar ---
  function NotificationBar({ notifications, onClear }: { notifications: Notification[]; onClear: () => void }) {
    if (!notifications.length) return null
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#e41e3f] text-white flex items-center justify-between px-6 py-2 shadow-lg">
        <div>
          {notifications.map((n: Notification, i: number) => (
            <span key={i} className="mr-4">
              {n.message}
            </span>
          ))}
        </div>
        <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }



  // Move safeFixed to the top level so it is available everywhere
  function safeFixed(val: any, digits = 2) {
    const num = Number(val)
    return Number.isFinite(num) ? num.toFixed(digits) : "0.00"
  }

  // Add this function before the OrdersPage component
  function calculateTotalPrepTime(items: any[]): number {
    if (!Array.isArray(items)) return 0
    return items.reduce((total, item) => {
      const prepTime = item.prepTime || 0
      return total + prepTime * item.quantity
    }, 0)
  }

  // Add these types at the top with other types
  interface KitchenOrderResponse {
    success: boolean
    message: string
    kitchenOrder?: any
  }

  function LoadingSkeleton() {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-4 bg-gray-300 rounded"></div>
              <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
              <div className="w-20 h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  export default function OrdersPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all")
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [quickAssignOrder, setQuickAssignOrder] = useState<string | null>(null)
    const [quickViewOrderId, setQuickViewOrderId] = useState<string | null>(null)
    const [quickViewOrder, setQuickViewOrder] = useState<Order | null>(null)
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [sidebarExpanded, setSidebarExpanded] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [notificationList, setNotificationList] = useState<Notification[]>([])
    const [showReceipt, setShowReceipt] = useState(false)
    const [receiptOrder, setReceiptOrder] = useState<any>(null)
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const ORDERS_PER_PAGE = 8
    const wsRef = useRef<any>(null)
    const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom" | "all">("all")
    const [customDateRange, setCustomDateRange] = useState<{
      start: Date | null
      end: Date | null
    }>({
      start: null,
      end: null,
    })
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [loadingOrders, setLoadingOrders] = useState(false)
    const [currencySymbol, setCurrencySymbol] = useState<any>({ symbol: "$" })
    const [userData, setUserData] = useState(null)
    const userDataRef = useRef(userData)
    const [refreshing, setRefreshing] = useState(false)
    const [applyTax, setApplyTax] = useState<any>({})
    const [company, setCompany] = useState<any>({})
    const [assigning, setAssigning] = useState(false)

    // Mock orders data
    const [orders, setOrders] = useState<any[]>([])
    useEffect(() => {
      const fetchUserData = async () => {
        const response = await fetch("/api/users/me")
        const data = await response.json()
        setUserData(data)
        userDataRef.current = data
      }
      fetchUserData()
    }, [])

    const kitchenAdminSocket = io("/kitchenAdmin", {
      path: "/api/socket/io",
      query: { restaurantId: userData?.restaurantId },
    })

    useEffect(() => {
      if (quickViewOrderId) {
        const found = orders.find((o) => o.id === quickViewOrderId)

        setQuickViewOrder(found || null)
      } else {
        setQuickViewOrder(null)
      }
    }, [quickViewOrderId, orders])

    // Filter orders based on active tab
    const filteredOrders = activeTab === "all" ? orders : orders.filter((order) => order.status === activeTab)

    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)

    let notificationSound: HTMLAudioElement | null = null
    const isInitializing = false
    let hasUserInteracted = true

    // Initialize notification sound
    const initNotificationSound = () => {
      if (typeof window !== "undefined") {
        notificationSound = new Audio("/scan-success.mp3")
        notificationSound.volume = 0.5

        // Add user interaction listener
        const handleUserInteraction = () => {
          hasUserInteracted = true
          // Try to play and pause immediately to unlock audio
          if (notificationSound) {
            notificationSound
              .play()
              .then(() => {
                notificationSound?.pause()
                notificationSound!.currentTime = 0
              })
              .catch(() => {
                // Silent fail
              })
          }
          // Remove listeners after first interaction
          document.removeEventListener("click", handleUserInteraction)
          document.removeEventListener("keydown", handleUserInteraction)
        }

        // Add listeners for user interaction
        document.addEventListener("click", handleUserInteraction)
        document.addEventListener("keydown", handleUserInteraction)
      }
    }

    // Play notification sound
    const playNotificationSound = () => {
      if (!hasUserInteracted) {
        console.log("user not interacted")
        return // Don't try to play if user hasn't interacted
      }

      try {
        if (!notificationSound) {
          initNotificationSound()
          console.log("notification sound")
        }
        if (notificationSound) {
          notificationSound.currentTime = 0
          notificationSound.play().catch(() => {
            console.log("error")
            // Silent fail
          })
        }
      } catch (error) {
        // Silent fail
        console.log(error, "error")
      }
    }

    // Function to get status badge color
    const getStatusColor = (status: OrderStatus) => {
      switch (status) {
        case "new":
          return "bg-blue-500 hover:bg-blue-600"
        case "preparing":
          return "bg-yellow-500 hover:bg-yellow-600"
        case "ready":
          return "bg-green-500 hover:bg-green-600"
        case "completed":
          return "bg-gray-500 hover:bg-gray-600"
        case "cancelled":
          return "bg-red-500 hover:bg-red-600"
        default:
          return "bg-gray-500 hover:bg-gray-600"
      }
    }

    // Function to handle checkbox selection
    const handleSelectOrder = (orderId: string) => {
      setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
    }

    // Function to handle "select all" checkbox
    const handleSelectAll = () => {
      if (selectedOrders.length === filteredOrders.length) {
        setSelectedOrders([])
      } else {
        setSelectedOrders(filteredOrders.map((order) => order.id))
      }
    }

    // Function to format date
    const formatDate = (dateString: string | undefined | null) => {
      if (!dateString) return "N/A"
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "N/A"

      if (isToday(date)) {
        return `Today ${format(date, "HH:mm")}`
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, "HH:mm")}`
      } else {
        return format(date, "MMM dd, HH:mm")
      }
    }

    // Function to get order type icon
    const getOrderTypeIcon = (type: string) => {
      switch (type) {
        case "dine-in":
          return <Utensils className="h-4 w-4 text-[#e41e3f]" />
        case "pickup":
          return <ShoppingBag className="h-4 w-4 text-amber-500" />
        case "delivery":
          return <MapPin className="h-4 w-4 text-green-500" />
        default:
          return <User className="h-4 w-4 text-[#e41e3f]" />
      }
    }

    // Function to get payment method icon
    const getPaymentIcon = (method: string) => {
      switch (method) {
        case "cash":
          return <DollarSign className="h-4 w-4 text-green-500" />
        case "credit_card":
          return <CreditCard className="h-4 w-4 text-blue-500" />
        case "debit_card":
          return <CreditCard className="h-4 w-4 text-orange-500" />
        case "mobile_payment":
          return <Phone className="h-4 w-4 text-purple-500" />
        default:
          return <DollarSign className="h-4 w-4 text-gray-500" />
      }
    }
    const kitchenORderStatus = async (orderId: string, status: string) => {
      const response = await fetch(`/api/restaurant/kitchen/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()
      kitchenAdminSocket.emit("adminNotification", {
        message: "Order status updated",
        restaurantId: userData?.restaurantId,
      })
    }

    // Add this function to handle kitchen assignment
    const assignToKitchen = async (orderIds: string[]) => {
      
      try {
        const response = await fetch("/api/restaurant/kitchen/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderIds }),
        })

        const data: KitchenOrderResponse = await response.json()

        if (data.success) {
          // Update local state
          setOrders((prev) =>
            prev.map((order) => {
              if (orderIds.includes(order.id)) {
                return { ...order, kitchenAssigned: true }
              }
              return order
            }),
          )

          // Show success notification
          kitchenAdminSocket.emit("adminNotification", {
            message: "New order assigned to kitchen",
            restaurantId: userData?.restaurantId,
          })
          toast.success(`Successfully assigned ${orderIds.length} order${orderIds.length > 1 ? "s" : ""} to kitchen`)
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        console.error("Error assigning to kitchen:", error)
        toast.error(`Failed to assign to kitchen: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    // Update the handleQuickAssign function
    const handleQuickAssign = async (orderId: string) => {
      try {
        setAssigning(true)
        await assignToKitchen([orderId])

        setQuickAssignOrder(null)
        setAssigning(false)
      } catch (error) {
        console.error("Error in quick assign:", error)
      }
    }

    // Update the handleBulkAction function
    const handleBulkAction = async (action: string) => {
      if (!selectedOrders.length) return

      try {
        setLoadingOrders(true)
        setAssigning(true)
        switch (action) {
          case "assign":
            await assignToKitchen(selectedOrders)
            break
          case "complete":
          case "delete":
          case "cancel":
            await fetch("/api/restaurant/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderIds: selectedOrders, action }),
            })
            break
        }
        fetchOrders()
        setSelectedOrders([])
        kitchenAdminSocket.emit("adminNotification", {
          message: "Bulk order added to kitchen",
          restaurantId: userData?.restaurantId,
        })
        toast.success("Bulk action performed successfully")
      } catch (error) {
        console.error("Error in bulk action:", error)
        toast.error(`Failed to perform bulk action: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setLoadingOrders(false)
        setAssigning(false)
      }
    }

    // Update the handleAction function
    const handleAction = async (action: string) => {
      if (!quickViewOrder) return
      try {
        switch (action) {
          case "send-to-kitchen":
            await assignToKitchen([quickViewOrder.id])
            break
          case "Return":
            // Handle return logic
            break
          default:
            console.warn("Unknown action:", action)
        }
      } catch (error) {
        console.error("Error in action:", error)
        toast.error(`Failed to perform action: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    // Handler for status change (mocked)
    const handleStatusChange = (status: OrderStatus) => {
      if (!quickViewOrder) return
      setStatusUpdating(true)
      kitchenORderStatus(quickViewOrder.id, status)
      try {
        kitchenORderStatus(quickViewOrder.id, status)
        setOrders((prev) => prev.map((o) => (o.id === quickViewOrder.id ? { ...o, status } : o)))
        setQuickViewOrder({ ...quickViewOrder, status })
        toast.success("Order status updated")
      } catch (error) {
        console.error("Error updating status:", error)
        toast.error("Failed to update order status")
      } finally {
        setStatusUpdating(false)
      }
    }

    // Update fetchOrders to include search and date filtering
    const fetchOrders = async () => {
      if (!userData?.restaurantId) return

      setLoadingOrders(true)
      try {
        const params = new URLSearchParams()

        // Add search query
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim())
        }

        // Add date range filtering - Fixed logic
        let startDate: Date
        let endDate: Date = new Date()

        switch (dateRange) {
          case "today":
            startDate = startOfDay(new Date())
            endDate = endOfDay(new Date())
            break
          case "week":
            startDate = startOfDay(subDays(new Date(), 7))
            endDate = endOfDay(new Date())
            break
          case "month":
            startDate = startOfDay(subDays(new Date(), 30))
            endDate = endOfDay(new Date())
            break
          case "all":
          default:
            // For 'all', we don't add date filters to get all orders
            startDate = new Date(2020, 0, 1) // Far past date
            endDate = new Date(2030, 11, 31) // Far future date
            break
        }

        // Only add date params if not 'all'
        if (dateRange !== "all") {
          params.append("startDate", startDate.toISOString())
          params.append("endDate", endDate.toISOString())
        }

        // Add status filter
        if (activeTab !== "all") {
          params.append("status", activeTab)
        }

        const url = `/api/restaurant/orders?${params.toString()}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch orders vc")
        }

        const data = await response.json()
        setOrders(data.orders || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
        toast.error("Failed to fetch orders")
        setOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }

    // Refresh orders
    const handleRefresh = async () => {
      setRefreshing(true)
      await fetchOrders()
      setRefreshing(false)
      toast.success("Orders refreshed")
    }

    // Add export functionality
    const handleExport = async () => {
      try {
        const response = await fetch("/api/restaurant/orders/export", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            searchQuery,
            dateRange,
            customDateRange,
            status: activeTab,
          }),
        })

        if (!response.ok) throw new Error("Export failed")
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error("Error exporting orders:", error)
        toast.error("Failed to export orders")
      }
    }

    // Update useEffect to include search and date range dependencies
    useEffect(() => {
      if (userData?.restaurantId) {
        fetchOrders()
      }
    }, [searchQuery, dateRange, activeTab, userData?.restaurantId])

    useEffect(() => {
      if (!userDataRef.current) return
      
      const handleNotification = (data: any, restaurantId: string) => {
        
        
        const currentRestaurantId = userDataRef.current?.restaurantId
        if (restaurantId === currentRestaurantId) {
          fetchOrders()
          playNotificationSound()
          console.log("notification done")
          toast.success(data.message)

          setQuickViewOrderId(null)
        } else {
        }
      }

      kitchenAdminSocket.on("cookOrderUpdate", handleNotification)

      return () => {
        kitchenAdminSocket.off("cookOrderUpdate", handleNotification)
      }
    }, [loadingOrders, userDataRef.current?.restaurantId]) // ✅ include `loading`


    // Replace the renderDateRangeFilter function
    const renderDateRangeFilter = () => {
      return (
        <div className="flex items-center gap-2 ">
          <select
            value={dateRange}
            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#e41e3f] bg-white"
            onChange={(e) => {
              setDateRange(e.target.value as any)
              if (e.target.value !== "custom") {
                setCustomDateRange({ start: null, end: null })
                setCalendarOpen(false)
              }
            }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            {/* <option value="custom">Custom Range</option> */}
          </select>
          {dateRange === "custom" && (
            <div className="flex items-center gap-2 relative">
              <Button variant="outline" className="text-xs" onClick={() => setCalendarOpen((open) => !open)}>
                {customDateRange.start && customDateRange.end
                  ? `${format(customDateRange.start, "yyyy-MM-dd")} to ${format(customDateRange.end, "yyyy-MM-dd")}`
                  : "Select range"}
              </Button>
              {calendarOpen && (
                <div className="absolute z-50 top-10 left-0 bg-white border rounded shadow-lg">
                  <CalendarUI
                    mode="range"
                    selected={
                      customDateRange.start && customDateRange.end
                        ? { from: customDateRange.start, to: customDateRange.end }
                        : undefined
                    }
                    onSelect={(range: any) => {
                      if (range && range.from && range.to) {
                        setCustomDateRange({ start: range.from, end: range.to })
                        setCalendarOpen(false)
                      }
                    }}
                    numberOfMonths={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    // Notification bar clear
    const clearNotifications = () => setNotificationList([])

    // Receipt modal handler
    const handleShowReceipt = async (orderId: string) => {
      // Fetch real order by ID
      const res = await fetch(`/api/restaurant/orders?id=${orderId}`)
      const data = await res.json()
      setReceiptOrder(data.order)
      setShowReceipt(true)
    }

    // Place this before the return statement in OrdersPage
    const quickViewItems: OrderItem[] = Array.isArray(quickViewOrder?.items)
      ? quickViewOrder.items
      : typeof quickViewOrder?.items === "string"
        ? JSON.parse(quickViewOrder.items)
        : []

    const filterTable = (value: string) => {
      setSearchValue(value)
      if (value.length > 2) {
        setLoadingOrders(true)
        setOrders(orders.filter((order) => order.orderNumber.includes(value)))
        setLoadingOrders(false)
      } else {
        fetchOrders()
        setLoadingOrders(false)
      }
    }

    useEffect(() => {
      const getCurrencySymbol = async () => {
        const res = await fetch(`/api/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "currency",
          }),
        })
        const data = await res.json()
        const currentCurrencySettings = JSON.parse(data.value)
        const defaultCurrency =
          Object.entries(currentCurrencySettings).find(([_, value]) => (value as any).default)?.[0] || "USD"
        setCurrencySymbol(currentCurrencySettings[defaultCurrency] || { symbol: "$" })
      }
      getCurrencySymbol()
    }, [])

    useEffect(() => {
      const getTaxSettings = async () => {
        const res = await fetch(`/api/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "taxes",
          }),
        })
        const data = await res.json()
        const taxSettings = JSON.parse(data.value)
        setApplyTax(taxSettings)
      }
      getTaxSettings()
    }, [])
    
    useEffect(() => {
    const getCompanySettings = async () => {
      const res = await fetch(`/api/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: "company",
        }),
      })
      const data = await res.json()
      const company = (data)
      setCompany(company)
      
    }
    getCompanySettings()
  }, [])

    const formatCurrency = (amount: number) => {
      if (currencySymbol) {
        return `${currencySymbol.symbol}${safeFixed(amount)}`
      } else {
        return `$${safeFixed(amount)}`
      }
    }

    const calculateTax = (amount: string | number) => {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (!applyTax) {
        return {
          gst: 0,
          pst: 0,
          hst: 0,
          totalTax: 0,
          totalAmount: numAmount,
        };
      }
    
      const gst = applyTax?.gst.enabled ? numAmount * (applyTax.gst.taxRate / 100) : 0;
      const pst = applyTax?.pst.enabled ? numAmount * (applyTax.pst.taxRate / 100) : 0;
      const hst = applyTax?.hst.enabled ? numAmount * (applyTax.hst.taxRate / 100) : 0;
      const totalTax = gst + pst + hst;
      const totalAmount = numAmount - totalTax;

      return { 
        gst: {
          amount: gst,
          rate: applyTax.gst.taxRate,
          enabled: applyTax.gst.enabled,
        },
        pst: {
          amount: pst,
          rate: applyTax.pst.taxRate,
          enabled: applyTax.pst.enabled,
        },
        hst: {
          amount: hst,
          rate: applyTax.hst.taxRate,
          enabled: applyTax.hst.enabled,
        },
        totalTax: {
          amount: totalTax,
        },
        totalAmount,
      };
    };

    const calculateTotal = (order: any) => {
      const subtotal = order.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)
      const tax = calculateTax(subtotal)
      const discount = subtotal * (order.discountPercentage / 100)
      const total = subtotal + tax.totalTax.amount - discount
      return total
    }



    // --- Receipt Modal ---
  function ReceiptModal({ order, open, onClose }: { order: any; open: boolean; onClose: () => void }) {
    if (!open || !order) return null
    let items: any[] = []
    try {
      items = typeof order.items === "string" ? JSON.parse(order.items) : order.items
    } catch {
      items = []
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 hover:bg-gray-100" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>

          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-[#e41e3f]">Receipt</h2>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={`capitalize ${order.status === "completed" ? "bg-green-500" : "bg-yellow-500"}`}>
                  {order.status}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items:</h3>
              <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                      {item.selectedAddons?.map((addon: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-500 mt-1">Addons: {addon.name}  { formatCurrency(addon.price)} x {addon.quantity || ''}</div>
                      ))}
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold text-[#e41e3f]">
                <span>Total:</span>
                <span>${safeFixed(order.totalAmount ?? order.total)}</span>
              </div>
            </div>

    

            <Button className="bg-[#e41e3f] hover:bg-[#c01835] text-white w-full mt-6" 
                onClick={() => {
                  const receiptWindow = window.open('', '_blank');
                  if (receiptWindow) {
                    receiptWindow.document.write(PickupOrderReceipt({ 
                      order, 
                      currency: currencySymbol, 
                      company,
                      taxSettings: applyTax,
                    }));
                    receiptWindow.document.close();
                    // Wait for the document to be fully loaded before printing
                    receiptWindow.onload = () => {
                      receiptWindow.print();
                    };
                  }
                }}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    )
  }


    return (
      <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
        <NotificationBar notifications={notificationList} onClear={() => setNotificationList([])} />

        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders Management</h1>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search orders by number, customer..."
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 border-gray-200">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button variant="outline" onClick={handleExport} className="border-gray-200 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              {selectedOrders.length > 0 && (
                <>
                  <Button
                    onClick={() => handleBulkAction("assign")}
                    disabled={loadingOrders}
                    className="bg-[#e41e3f] hover:bg-[#c01835] text-white"
                  >
                    {loadingOrders ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChefHat className="h-4 w-4 mr-2" />}
                    Assign to Kitchen ({selectedOrders.length})
                  </Button>

                  <Button
                    onClick={() => handleBulkAction("complete")}
                    variant="outline"
                    disabled={loadingOrders}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    {loadingOrders ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Complete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ${quickViewOrder && sidebarExpanded ? "xl:pr-0" : ""}`}>
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
              <TabsList className="grid grid-cols-6 h-12 bg-white border border-gray-200 rounded-lg p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#e41e3f] data-[state=active]:text-white">
                  All ({orders.length})
                </TabsTrigger>

                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-[#e41e3f] data-[state=active]:text-white"
                >
                  Pending ({orders.filter((o) => o.status === "pending").length})
                </TabsTrigger>
                
                <TabsTrigger
                  value="preparing"
                  className="data-[state=active]:bg-[#e41e3f] data-[state=active]:text-white"
                >
                  Preparing ({orders.filter((o) => o.status === "preparing").length})
                </TabsTrigger>
                <TabsTrigger value="ready" className="data-[state=active]:bg-[#e41e3f] data-[state=active]:text-white">
                  Ready ({orders.filter((o) => o.status === "ready").length})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-[#e41e3f] data-[state=active]:text-white"
                >
                  Completed ({orders.filter((o) => o.status === "completed").length})
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="data-[state=active]:bg-[#e41e3f] data-[state=active]:text-white"
                >
                  Cancelled ({orders.filter((o) => o.status === "cancelled").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardContent className="p-0">
                    {loadingOrders ? (
                      <div className="p-6">
                        <LoadingSkeleton />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead className="w-[50px]">
                                  <Checkbox
                                    checked={
                                      selectedOrders.length === paginatedOrders.length && paginatedOrders.length > 0
                                    }
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all orders"
                                  />
                                </TableHead>
                                <TableHead className="font-semibold">Order Info</TableHead>
                                <TableHead className="font-semibold">Customer</TableHead>
                                <TableHead className="font-semibold">Date & Time</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedOrders
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((order) => (
                                  <TableRow
                                    key={order.id}
                                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                                      quickViewOrderId === order.id
                                        ? "bg-[#fff5f7] border-l-4 border-[#e41e3f]"
                                        : order.status === "preparing"
                                          ? "bg-yellow-50/50"
                                          : order.status === "ready"
                                            ? "bg-green-50/50"
                                            : ""
                                    }`}
                                    onClick={() => setQuickViewOrderId(order.id)}
                                  >
                                    <TableCell className="p-4">
                                      <Checkbox
                                        checked={selectedOrders.includes(order.id)}
                                        onCheckedChange={(e) => {
                                          // e.stopPropagation()
                                          handleSelectOrder(order.id)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label={`Select order ${order.orderNumber}`}
                                      />
                                    </TableCell>

                                    <TableCell className="p-4">
                                      <div className="space-y-1">
                                        <div className="font-semibold text-[#e41e3f]">#{order.orderNumber}</div>
                                        <div className="flex items-center text-xs text-gray-500">
                                          <User className="h-3 w-3 mr-1" />
                                          <span className="capitalize">
                                            {order.tableId || order.orderType === "dine-in"
                                              ? JSON.parse(order.dineInCustomer || "{}").name || "Guest"
                                              : JSON.parse(JSON.stringify(order.customerDetails || "{}")).name ||
                                                "Customer"}
                                                
                                          </span>
                                          {order.tableNumber && (
                                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                              Table {order.tableNumber}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>

                                    <TableCell className="p-4">
                                      <div className="space-y-1">
                                      <div className="font-medium text-sm">
                                          {order.orderType === "dine-in"
                                            ? (() => {
                                                try {
                                                  const dineIn = typeof order.dineInCustomer === "string"
                                                    ? JSON.parse(order.dineInCustomer)
                                                    : order.dineInCustomer;

                                                  return dineIn?.name || "Guest";
                                                } catch {
                                                  return "Guest";
                                                }
                                              })()
                                            : (() => {
                                                try {
                                                  const customer = typeof order.customerDetails === "string"
                                                    ? JSON.parse(order.customerDetails)
                                                    : order.customerDetails;

                                                  return customer?.name || "Customer";
                                                } catch {
                                                  return "Customer";
                                                }
                                              })()
                                          }
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500">
                                          <Phone className="h-3 w-3 mr-1" />
                                              {order.orderType === "dine-in"
                                                ? (() => {
                                                    try {
                                                      const dineIn = typeof order.dineInCustomer === "string"
                                                        ? JSON.parse(order.dineInCustomer)
                                                        : order.dineInCustomer;

                                                      return dineIn?.phone || "N/A";
                                                    } catch {
                                                      return "N/A";
                                                    }
                                                  })()
                                                : (() => {
                                                    try {
                                                      const customer = typeof order.customerDetails === "string"
                                                        ? JSON.parse(order.customerDetails)
                                                        : order.customerDetails;

                                                      return customer?.phone || "N/A";
                                                    } catch {
                                                      return "N/A";
                                                    }
                                                  })()
                                              }
                                        </div>
                                      </div>
                                    </TableCell>

                                    <TableCell className="p-4">
                                      <div className="space-y-1">
                                        <div className="text-sm font-medium">{formatDate(order.createdAt)}</div>
                                        <div className="flex items-center text-xs text-gray-500">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {order.status === "completed" && order.updatedAt
                                            ? `Completed ${formatDistanceToNow(new Date(order.updatedAt))} ago`
                                            : `${calculateTotalPrepTime(
                                                Array.isArray(order.items)
                                                  ? order.items
                                                  : typeof order.items === "string"
                                                    ? JSON.parse(order.items)
                                                    : [],
                                              )} min prep`}
                                        </div>
                                        {order.kitchenOrder?.status && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                                          >
                                            <ChefHat className="h-3 w-3 mr-1" />
                                            Kitchen: {order.kitchenOrder.status}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>

                                    <TableCell className="p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                          {getOrderTypeIcon(order.tableId ? "dine-in" : "pickup")}
                                          <span className="ml-2 capitalize font-medium">
                                            {order.tableId ? "Dine-In" : "Pickup"}
                                          </span>
                                        </div>
                                        {order.orderType === "pickup" && (
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              order.paymentStatus === "paid"
                                                ? "bg-green-50 text-green-600 border-green-200"
                                                : "bg-red-50 text-red-600 border-red-200"
                                            }`}
                                          >
                                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>

                                    <TableCell className="p-4">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge className={`${getStatusColor(order.status)} text-white text-xs px-3 py-1`}>
                                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>

                                        {order.status === "new" && !order.kitchenAssigned && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 px-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleQuickAssign(order.id)
                                                  }}
                                                >
                                                  <ChefHat className="h-4 w-4 mr-1" />
                                                  Assign
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Assign to kitchen</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}

                                        {order.kitchenAssigned && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-green-50 text-green-600 border-green-200"
                                          >
                                            <ChefHat className="h-3 w-3 mr-1" />
                                            In Kitchen
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>

                                    <TableCell className="p-4">
                                      <div className="space-y-1">
                                        <div className="font-bold text-[#e41e3f] text-lg">
                                          {formatCurrency(calculateTax(order.totalAmount ?? order.total).totalAmount || 0)}
                                        </div>
                                        <div className="flex flex-col  text-xs text-gray-500">   
                                          <span className="flex items-center">
                                        {getPaymentIcon(
                                              order.paymentDetails
                                                ? order.paymentDetails.status === "COMPLETED"
                                                  ? "credit_card"
                                                  : "cash"
                                                : ""
                                            )}
                                          <span className="ml-1 capitalize">
                                          {(
                                              order.paymentDetails
                                                ? order.paymentDetails.status === "COMPLETED"
                                                  ? "Credit Card"
                                                  : "Cash"
                                                : ""
                                            )}
                                          </span>
                                          </span>

                                          <span className="capitalize flex items-center mt-2">   
                                          {
  (() => {
    let discount = null;

    try {
      if (order.discountUsed) {
        discount =
          typeof order.discountUsed === "string"
            ? JSON.parse(order.discountUsed)
            : order.discountUsed;
      }
    } catch (err) {
      console.error("Invalid discountUsed JSON:", err);
      discount = null;
    }

    if (!discount?.type || discount.amount <= 0) return null;

    const commonClasses = "h-4 w-4 text-green-500 inline-block mr-1";

    switch (discount.type) {
      case "loyalty":
        return (
          <>
            <BadgeCheck className={commonClasses} /> Loyalty Used
            <span className="ml-1 capitalize">{formatCurrency(discount.amount)}</span>
          </>
        );

      case "flat":
        return (
          <>
            <Percent className={commonClasses} /> Flat Used
            <span className="ml-1 capitalize">{formatCurrency(discount.amount)}</span>
          </>
        );

      case "free":
        return (
          <>
            <Gift className={commonClasses} /> Free Used
            <span className="ml-1 capitalize">{formatCurrency(discount.amount)}</span>
          </>
        );

      default:
        return null;
    }
  })()
}

                                          </span>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>

                        {paginatedOrders.length === 0 && !loadingOrders && (
                          <div className="text-center py-12">
                            <div className="text-gray-400 mb-2">
                              <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                            <p className="text-gray-500">
                              {searchQuery ? "Try adjusting your search criteria" : "No orders match the current filters"}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                          Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1} -{" "}
                          {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}{" "}
                          orders
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="border-gray-300"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>

                          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                            const pageNum = currentPage <= 3 ? idx + 1 : currentPage - 2 + idx
                            if (pageNum > totalPages) return null

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className={currentPage === pageNum ? "bg-[#e41e3f] text-white" : "border-gray-300"}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="border-gray-300"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Quick View Panel */}
          {quickViewOrder && (
            <div
              className={`transition-all duration-300 ${sidebarExpanded ? "w-full xl:w-96" : "w-16"} bg-white rounded-xl shadow-lg border border-gray-200 sticky top-6 h-fit`}
            >
              {sidebarExpanded ? (
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Order Details</div>
                      <div className="text-2xl font-bold text-[#e41e3f]">#{quickViewOrder.orderNumber}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuickViewOrderId(null)}
                      className="hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-[#e41e3f]" />
                        <span className="font-medium">
                          {quickViewOrder.tableId
                            ? JSON.parse(quickViewOrder.dineInCustomer || "{}").name || "Guest"
                            : JSON.parse(JSON.stringify(quickViewOrder.customerDetails || "{}")).name || "Customer"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>
                          {quickViewOrder.tableId
                            ? JSON.parse(quickViewOrder.dineInCustomer || "{}").phone || "N/A"
                            : JSON.parse(JSON.stringify(quickViewOrder.customerDetails || "{}")).phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(quickViewOrder.createdAt)}</span>
                      </div>
                      {quickViewOrder.tableNumber && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Utensils className="h-4 w-4" />
                          <span>Table {quickViewOrder.tableNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Order Items */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Order Items</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {(() => {
                        const items = Array.isArray(quickViewOrder.items)
                          ? quickViewOrder.items
                          : typeof quickViewOrder.items === "string"
                            ? JSON.parse(quickViewOrder.items)
                            : []

                        return items.map((item: OrderItem, idx: number) => (
                          <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.name}</div>
                              {item.selectedAddons?.map((addon: any, idx: number) => {
                                return (
                                  <div key={idx} className="text-xs text-gray-500 mt-1">Addons: {addon.name}  { formatCurrency(addon.price)} x {addon.quantity || ''}</div>
                                )
                              })}
                              <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                              {item.options && item.options.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">Options: {item.options.join(", ")}</div>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-[#e41e3f]">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatCurrency(calculateTax(quickViewOrder.totalAmount || 0).totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span>{formatCurrency(calculateTax(quickViewOrder.totalAmount || 0).totalTax.amount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-[#e41e3f] pt-2 border-t">
                        <span>Total</span>
                        <span>{formatCurrency(quickViewOrder.totalAmount || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-900">Update Status</label>
                    <Select
                      value={quickViewOrder.status}
                      onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                      disabled={statusUpdating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <Button
                      className="w-full bg-[#e41e3f] hover:bg-[#c01835] text-white"
                      onClick={() => setShowReceiptModal(true)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Receipt
                    </Button>
                    {!quickViewOrder.kitchenAssigned && (
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleQuickAssign(quickViewOrder.id)}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Send to Kitchen
                        {assigning && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full border-[#e41e3f] text-[#e41e3f] hover:bg-[#fff5f7]"
                      onClick={() => setQuickViewOrderId(null)}
                    >
                      Close Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 p-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSidebarExpanded(true)}
                    className="text-[#e41e3f] hover:bg-[#fff5f7]"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Receipt Modal */}
        <ReceiptModal order={quickViewOrder} open={showReceiptModal} onClose={() => setShowReceiptModal(false)} />

      </div>
    )
  }

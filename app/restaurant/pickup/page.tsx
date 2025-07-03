"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Camera,
  QrCode,
  Loader2,
  Search,
  Printer,
  Package,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import jsQR from "jsqr"
import { getCurrencySettings } from "@/lib/currency"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import PickupOrderReceipt from "../../components/receipt/PickupOrderReceipt"
import { Skeleton } from "@/components/ui/skeleton"

interface Order {
  id: string
  orderNumber: string
  customerDetails: {
    name: string
    phone: string
    email: string
  }
  items: any[]
  totalAmount: number
  paymentStatus: string
  paymentMethod: string
  pickupTime: string
  status: string
  otp: string
  qrCode: string
  discountUsed: string
}

interface TaxSettings {
  gst: {
    enabled: boolean
    taxRate: number
  }
}

interface OrderReceiptProps {
  order: Order
}

const ITEMS_PER_PAGE = 6

export default function PickupPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [otpInput, setOtpInput] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null)
  const [currency, setCurrency] = useState<[string, string, string] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [company, setCompany] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPrinting, setIsPrinting] = useState(false)

  // Enhanced scanner states
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState<"scanning" | "found" | "processing" | "success" | "error">("scanning")
  const [processingProgress, setProcessingProgress] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Fetch currency settings
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const currencyData = await getCurrencySettings()
        setCurrency(currencyData)
      } catch (error) {
        console.error("Error fetching currency:", error)
      }
    }
    fetchCurrency()
  }, [])

  // Fetch orders
  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  function ensureParsedJSON(input: any) {
    if (typeof input !== "string") return input

    try {
      const parsed = JSON.parse(input)
      if (parsed && typeof parsed === "object") {
        return parsed
      }
    } catch (e) {
      // Not a valid JSON, return as-is
    }

    return input
  }

  // Filter orders based on search and date
  useEffect(() => {
    let filtered = [...orders]

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ensureParsedJSON(order.customerDetails).name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ensureParsedJSON(order.customerDetails).phone.includes(searchQuery),
      )
    }

    if (selectedDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.pickupTime)
        return orderDate.toDateString() === selectedDate.toDateString()
      })
    }

    setFilteredOrders(filtered)
    setCurrentPage(1)
  }, [orders, searchQuery, selectedDate])

  const getSettings = async (key: string) => {
    const settings = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: key,
        isPublic: true,
      }),
    })
    const data = await settings.json()
    setCompany(data)
  }

  const fetchTaxSettings = async () => {
    const taxResponse = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: "taxes",
        isPublic: true,
      }),
    })

    if (taxResponse.ok) {
      const taxData = await taxResponse.json()
      setTaxSettings(JSON.parse(taxData.value))
    }
  }

  useEffect(() => {
    getSettings("company")
    fetchTaxSettings()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/restaurant/pickup-orders?status=${activeTab}`)
      const data = await response.json()
      
      setOrders(data)
      console.log(data);
      setFilteredOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to fetch orders")
    } finally {
      setIsLoading(false)
    }
  }

  // Format currency
  const moneyFormat = (amount: number) => {
    const currencySymbol = currency?.symbol || "$"
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "from-amber-500 to-orange-500"
      case "preparing":
        return "from-blue-500 to-indigo-500"
      case "ready":
        return "from-emerald-500 to-green-500"
      case "completed":
        return "from-gray-500 to-slate-500"
      default:
        return "from-gray-500 to-slate-500"
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "preparing":
        return <Package className="h-4 w-4" />
      case "ready":
        return <Package className="h-4 w-4" />
      case "completed":
        return <Package className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Enhanced QR code scanning with better performance and range
  const startScanner = async () => {
    try {
      setShowScanner(true)
      setIsScanning(true)
      console.log("Starting scanning loop below")
      console.log("isScanning ww", isScanning)

      setScanStatus("scanning")
      setScanProgress(0)
      setProcessingProgress(0)

      // Optimized camera constraints for better QR detection
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          focusMode: "continuous",
          exposureMode: "continuous",
          whiteBalanceMode: "continuous",
          frameRate: { ideal: 30, min: 15 },
          // Add these for better focus and clarity
          focusDistance: { ideal: 0.1 },
          zoom: { ideal: 1.0 },
        },
      }

      let stream
      try {
        // Try with optimal settings first
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error) {
        // Fallback to basic settings if optimal fails
        console.warn("Optimal camera settings failed, trying fallback:", error)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })
      }

      streamRef.current = stream

      // Wait for video element to be ready
      await new Promise((resolve) => setTimeout(resolve, 200))

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Optimize video settings
        videoRef.current.setAttribute("playsinline", "true")
        videoRef.current.setAttribute("webkit-playsinline", "true")

        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              // Start scanning after video is playing
              setTimeout(() => {
                startScanningLoop()
              }, 500)
            })
            .catch((error) => {
              console.error("Video play error:", error)
              toast.error("Failed to start camera preview")
            })
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      toast.error("Failed to access camera. Please ensure camera permissions are granted.")
      setScanStatus("error")
      setShowScanner(false)
    }
  }

  const startScanningLoop = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    let scanAttempts = 0
    const maxAttempts = 600 // 20 seconds at 30fps
    let isProcessing = false
  
    const scan = () => {
      if (scanStatus !== "scanning" || isProcessing) return
      

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          // Optimize canvas size for better performance
          const videoWidth = video.videoWidth
          const videoHeight = video.videoHeight
          

          // Use smaller canvas for faster processing
          const scale = Math.min(800 / videoWidth, 600 / videoHeight)
          canvas.width = videoWidth * scale
          canvas.height = videoHeight * scale

          // Draw and enhance image for better QR detection
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Apply image enhancements for better QR detection
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Try multiple QR detection strategies
          const detectionStrategies = [
            // Strategy 1: Normal detection
            () =>
              jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              }),

            // Strategy 2: With inversion attempts
            () =>
              jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              }),

            // Strategy 3: Focus on center area only
            () => {
              const centerX = Math.floor(canvas.width * 0.25)
              const centerY = Math.floor(canvas.height * 0.25)
              const centerWidth = Math.floor(canvas.width * 0.5)
              const centerHeight = Math.floor(canvas.height * 0.5)

              const centerImageData = context.getImageData(centerX, centerY, centerWidth, centerHeight)
              return jsQR(centerImageData.data, centerImageData.width, centerImageData.height, {
                inversionAttempts: "attemptBoth",
              })
            },
          ]

          

          // Try each strategy
          for (const strategy of detectionStrategies) {
            const code = strategy()
            if (code) {
              isProcessing = true
              setScanStatus("found")
              handleScanResult(code.data)
              return
            }
          }

          scanAttempts++
          const progress = Math.min((scanAttempts / maxAttempts) * 100, 100)
          setScanProgress(progress)

          if (scanAttempts < maxAttempts) {
            // Use high frequency scanning for better detection
            setTimeout(scan, 16) // ~60fps for better responsiveness
          } else {
            setScanStatus("error")
            toast.error("QR code not detected. Please ensure the code is clearly visible and try again.")
          }
        } catch (error) {
          console.error("Scanning error:", error)
          setTimeout(scan, 50)
        }
      } else {
        setTimeout(scan, 50)
      }
    }

    scan()
  }, [isScanning, scanStatus])

  const stopScanner = useCallback(() => {
    setIsScanning(false)

    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const playSound = () => {
    try {
      const audio = new Audio("/scan-success.mp3")
      audio.play().catch(() => {}) // Ignore audio errors
    } catch (error) {
      // Ignore audio errors
    }
  }

  const playErrorSound = () => {
    try {
      const audio = new Audio("/error.mp3")
      audio.play().catch(() => {}) // Ignore audio errors
    } catch (error) {
      // Ignore audio errors
    }
  }

  const handleScanResult = async (data: string) => {
    try {
      setScanStatus("processing")
      setProcessingProgress(20)

      // Stop scanning immediately to prevent multiple detections
      setIsScanning(false)
      if (scanIntervalRef.current) {
        clearTimeout(scanIntervalRef.current)
      }

      let orderData
      try {
        orderData = JSON.parse(data)
      } catch (parseError) {
        throw new Error("Invalid QR code format")
      }

      setProcessingProgress(40)

      const response = await fetch(`/api/restaurant/pickup-orders/${orderData.orderId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: orderData }),
      })

      setProcessingProgress(70)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `Server error: ${response.status}`)
      }

      const order = await response.json()
      setProcessingProgress(90)
      if (order) {
        setSelectedOrder(order)
        setScanStatus("success")
        setProcessingProgress(100)
        playSound()
        fetchOrders()
        // Small delay to show success state
        setTimeout(() => {
          stopScanner()
          setShowScanner(false)
          // setShowOTPDialog(true)
          // Reset states
          setScanStatus("scanning")
          setScanProgress(0)
          setProcessingProgress(0)
        }, 1000)
        toast.success("Order verified successfully")
      } else {
        throw new Error("Invalid order response")
      }
    } catch (error) {
      console.error("Error processing QR code:", error)
      setScanStatus("error")
      playErrorSound()

      const errorMessage = error.message || "Invalid QR code or order not found"
      toast.error(errorMessage)

      // Reset to scanning after error with option to retry
      setTimeout(() => {
        setScanStatus("scanning")
        setScanProgress(0)
        setProcessingProgress(0)
        setIsScanning(true)
        startScanningLoop()
      }, 2000)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  // Handle OTP verification
  const verifyOTP = async () => {
    const verifyStatus = selectedOrder ? "selected" : "search"
    const endpoint = selectedOrder
      ? `/api/restaurant/pickup-orders/${selectedOrder.id}/verify`
      : `/api/restaurant/pickup-orders`
  
    setIsVerifying(true)
  
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpInput, verifyStatus }),
      })
  
      const isJson = response.headers.get("content-type")?.includes("application/json")
      const responseData = isJson ? await response.json() : await response.text()
  
      if (response.ok) {
        toast.success("Order verified successfully")
        setShowOTPDialog(false)
        fetchOrders()
      } else {
        toast.error(responseData?.message || responseData || "Verification failed")
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      toast.error("Network or server error occurred")
    } finally {
      setIsVerifying(false)
      setOtpInput("")
    }
  }
  

  // Handle payment status update
  const updatePaymentStatus = async (orderId: string, status: string) => {
    setIsUpdatingPayment(true)
    try {
      const response = await fetch(`/api/restaurant/pickup-orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success("Payment status updated")
        fetchOrders()
      } else {
        toast.error("Failed to update payment status")
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error("Failed to update payment status")
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const calculateTax = (amount: number) => {
    const gst = taxSettings?.gst.enabled ? amount * (taxSettings.gst.taxRate / 100) : 0
    const pst = taxSettings?.pst.enabled ? amount * (taxSettings.pst.taxRate / 100) : 0
    const hst = taxSettings?.hst.enabled ? amount * (taxSettings.hst.taxRate / 100) : 0
    const totalTax = gst + pst + hst
    const totalAmount = amount + totalTax

    return {
      gst: gst,
      pst: pst,
      hst: hst,
      totalTax: totalTax,
      totalAmount: totalAmount,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
              Pickup Orders
            </h1>
            <p className="text-gray-600">Manage and track customer pickup orders</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setShowOTPDialog(true)}
              className="flex items-center gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
            >
              <QrCode className="h-4 w-4" />
              Enter OTP
            </Button>
            <Button
              onClick={startScanner}
              className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
            >
              <Camera className="h-4 w-4" />
              Scan QR Code
            </Button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by order number, customer name, or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full lg:w-[240px] justify-start text-left font-normal border-rose-200 hover:bg-rose-50",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-rose-100">
            <TabsList className="grid w-full grid-cols-4 bg-rose-50 rounded-xl">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Clock className="h-4 w-4 mr-2" />
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="preparing"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Package className="h-4 w-4 mr-2" />
                Preparing
              </TabsTrigger>
              <TabsTrigger
                value="ready"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Package className="h-4 w-4 mr-2" />
                Ready
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Package className="h-4 w-4 mr-2" />
                Completed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="space-y-6 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-rose-200 rounded-full animate-spin border-t-rose-500"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading orders...</p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden border-rose-100">
                    <CardHeader className="bg-gradient-to-r from-gray-200 to-gray-300">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-32 bg-white/30" />
                          <Skeleton className="h-4 w-48 bg-white/30" />
                        </div>
                        <Skeleton className="h-6 w-20 bg-white/30 rounded-full" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Skeleton className="h-5 w-28" />
                          <div className="space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-36" />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Skeleton className="h-5 w-24" />
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex justify-between">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-14" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end gap-3">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
                <div className="w-24 h-24 mx-auto mb-6 bg-rose-50 rounded-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-rose-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">There are no orders matching your current filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {paginatedOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-rose-100 bg-white"
                    >
                      <CardHeader
                        className={`bg-gradient-to-r ${getStatusColor(order.status)} text-white relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10 flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <CardTitle className="text-xl font-bold">Order #{order.orderNumber}</CardTitle>
                            </div>
                            <CardDescription className="text-white/90 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Pickup: {order.pickupTime}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                            className={`${
                              order.paymentStatus === "paid"
                                ? "bg-white/20 text-white border-white/30"
                                : "bg-white text-rose-600 border-white"
                            } backdrop-blur-sm`}
                          >
                            {order.paymentStatus === "paid" ? "Paid" : "Pending Payment"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Customer Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <User className="h-4 w-4 text-rose-500" />
                              Customer Details
                            </h3>
                            <div className="space-y-3 pl-6">
                              <div className="flex items-center gap-2 text-gray-700">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  {(typeof order.customerDetails === "string"
                                    ? JSON.parse(order.customerDetails)
                                    : order.customerDetails
                                  )?.name || "Unknown"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>
                                  {(typeof order.customerDetails === "string"
                                    ? JSON.parse(order.customerDetails)
                                    : order.customerDetails
                                  )?.phoneNumber || "Unknown"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">
                                  {(typeof order.customerDetails === "string"
                                    ? JSON.parse(order.customerDetails)
                                    : order.customerDetails
                                  )?.email || "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Package className="h-4 w-4 text-rose-500" />
                              Order Details
                            </h3>
                            <div className="space-y-3">
                              {order.items.map((item: any, index: number) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-gray-900">
                                      {item.name} x{item.quantity}
                                    </span>
                                    <span className="font-semibold text-rose-600">
                                      {moneyFormat(item.price * item.quantity)}
                                    </span>
                                  </div>
                                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                                    <div className="pl-4 space-y-1">
                                      {item.selectedAddons.map((addon: any, addonIndex: number) => (
                                        <div key={addonIndex} className="flex justify-between text-sm text-gray-600">
                                          <span>+ {addon.name}</span>
                                          <span>{moneyFormat(addon.price)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}

                              <div className="border-t border-rose-100 pt-3 mt-4 space-y-2">
                                <div className="flex justify-between font-semibold text-gray-900">
                                  <span>Subtotal</span>
                                  <span>{moneyFormat(Number(order.totalAmount))}</span>
                                </div>
                                {taxSettings?.gst.enabled && calculateTax(Number(order.totalAmount)).gst > 0 && (
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>GST ({taxSettings.gst.taxRate}%)</span>
                                    <span>{moneyFormat(calculateTax(Number(order.totalAmount)).gst)}</span>
                                  </div>
                                )}
                                {taxSettings?.pst.enabled && calculateTax(Number(order.totalAmount)).pst > 0 && (
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>PST ({taxSettings.pst.taxRate}%)</span>
                                    <span>{moneyFormat(calculateTax(Number(order.totalAmount)).pst)}</span>
                                  </div>
                                )}
                                {taxSettings?.hst.enabled && calculateTax(Number(order.totalAmount)).hst > 0 && (
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>HST ({taxSettings.hst.taxRate}%)</span>
                                    <span>{moneyFormat(calculateTax(Number(order.totalAmount)).hst)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-lg text-rose-600 border-t border-rose-100 pt-2">
                                  <span>Total</span>
                                  <span>{moneyFormat(calculateTax(Number(order.totalAmount)).totalAmount)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-wrap justify-end gap-3">
                          {order.paymentStatus !== "paid" && (
                            <Button
                              onClick={() => updatePaymentStatus(order.id, "paid")}
                              disabled={isUpdatingPayment}
                              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
                            >
                              {isUpdatingPayment ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Updating...
                                </>
                              ) : (
                                "Mark as Paid"
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowOTPDialog(true)
                            }}
                            className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
                          >
                            Verify Order
                          </Button>
                          <Button
                            onClick={async () => {
                              setIsPrinting(true)
                              try {
                                const receiptWindow = window.open("", "_blank")
                                if (receiptWindow) {
                                  receiptWindow.document.write(
                                    PickupOrderReceipt({
                                      order,
                                      currency,
                                      company,
                                      taxSettings,
                                    }),
                                  )
                                  receiptWindow.document.close()
                                  receiptWindow.onload = () => {
                                    receiptWindow.print()
                                    setIsPrinting(false)
                                  }
                                }
                              } catch (error) {
                                setIsPrinting(false)
                              }
                            }}
                            disabled={isPrinting}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
                          >
                            {isPrinting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                            {isPrinting ? "Printing..." : "Print Receipt"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8 bg-white rounded-2xl p-6 border border-rose-100">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:from-rose-600 hover:to-red-600"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50"
                          }
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Enhanced QR Scanner Dialog */}
        <Dialog
          open={showScanner}
          onOpenChange={(open) => {
            if (!open) {
              stopScanner()
            }
            setShowScanner(open)
          }}
        >
          <DialogContent className="sm:max-w-lg border-rose-200">
            <DialogHeader>
              <DialogTitle className="text-rose-900 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                QR Code Scanner
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video ref={videoRef} className="w-full h-80 object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg"></div>

                  {/* Center scanning area */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center">
                      {scanStatus === "scanning" && (
                        <div className="text-white text-center">
                          <QrCode className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                          <p className="text-sm">Position QR code here</p>
                        </div>
                      )}
                      {scanStatus === "found" && (
                        <div className="text-green-400 text-center">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">QR Code Found!</p>
                        </div>
                      )}
                      {scanStatus === "processing" && (
                        <div className="text-blue-400 text-center">
                          <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin" />
                          <p className="text-sm">Processing...</p>
                        </div>
                      )}
                      {scanStatus === "success" && (
                        <div className="text-green-400 text-center">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">Success!</p>
                        </div>
                      )}
                      {scanStatus === "error" && (
                        <div className="text-red-400 text-center">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">Scan Failed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="space-y-3">
                {scanStatus === "scanning" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Scanning for QR code...</span>
                      <span className="text-gray-600">{Math.round(scanProgress)}%</span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                  </div>
                )}

                {(scanStatus === "processing" || scanStatus === "success") && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {scanStatus === "processing" ? "Verifying order..." : "Order verified!"}
                      </span>
                      <span className="text-gray-600">{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div>
                )}
              </div>

              {/* Status Messages */}
              <div className="text-center text-sm text-gray-600">
                {scanStatus === "scanning" && <p>Hold your device steady and ensure the QR code is clearly visible</p>}
                {scanStatus === "found" && (
                  <p className="text-green-600 font-medium">QR code detected! Processing order...</p>
                )}
                {scanStatus === "processing" && <p className="text-blue-600 font-medium">Verifying order details...</p>}
                {scanStatus === "success" && (
                  <p className="text-green-600 font-medium">Order found! Opening verification dialog...</p>
                )}
                {scanStatus === "error" && (
                  <p className="text-red-600 font-medium">Unable to scan QR code. Please try again.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    stopScanner()
                    setShowScanner(false)
                  }}
                  className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Cancel
                </Button>
                {scanStatus === "error" && (
                  <Button
                    onClick={() => {
                      setScanStatus("scanning")
                      setScanProgress(0)
                      setProcessingProgress(0)
                      setIsScanning(true)
                      startScanningLoop()
                    }}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* OTP Verification Dialog */}
        <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
          <DialogContent className="sm:max-w-md border-rose-200">
            <DialogHeader>
              <DialogTitle className="text-rose-900">Verify Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="h-12 text-center text-lg font-mono border-rose-200 focus:border-rose-400 focus:ring-rose-400"
              />
              <Button
                onClick={
                  () => {
                    verifyOTP()
                    setSelectedOrder(null)
                  }
                }
                disabled={isVerifying || !otpInput}
                className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white h-12 text-lg font-semibold"
              >
                {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

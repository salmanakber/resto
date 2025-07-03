"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Camera,
  Grid3X3,
  List,
  MapPin,
  ShoppingCart,
  X,
  AlertCircle,
  User,
  CreditCard,
  Settings,
  LogOut,
  HelpCircle,
  Loader2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import jsQR from "jsqr"
import { calculateDistance } from "@/app/utils/geo"
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { logoutFromAllDevices } from "@/lib/logoutAll"
import { Skeleton } from "@/components/ui/skeleton"
import { type CountryCode, validatePhoneNumberLength } from "libphonenumber-js"
import { toast } from "sonner"

// Import optimized components
import { MenuSkeleton } from "@/components/skeletons/menu-skeleton"
import { CategorySkeleton } from "@/components/skeletons/category-skeleton"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MenuItemCard } from "@/components/restaurant/menu-item-card"
import { CategoryNavigation } from "@/components/restaurant/category-navigation"
import { CartSidebar } from "@/components/restaurant/cart-sidebar"
import { useLoyaltyPointsGlobal } from "../context/AppContextProvider"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"
import { useNotifications } from "@/lib/hooks/useNotifications"


// Types
interface Location {
  id: string
  address: string
  lat: string
  lng: string
  isActive: boolean
  user: {
    id: string
    restaurantId: string
  }
}

interface CustomerDetails {
  name: string
  phone: string
}

interface OrderConfirmation {
  orderId: string
  tableNumber: string
  items: MenuItem[]
  total: number
  customerDetails: CustomerDetails
  orderTime: string
}

interface Service {
  id: string
  name: string
  price: number
  description?: string
}

interface MenuCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: MenuCategory[]
  image?: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  isAvailable: boolean
  isPopular: boolean
  tags: string[]
  services: Service[]
  quantity?: number
  selectedAddons?: Service[]
  tableNumber?: string
  prepTime?: number
}

// Optimized Customer Details Component
const CustomerDetailsPopup = React.memo(
  ({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (details: CustomerDetails) => void
    isSubmitting: boolean
  }) => {
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({ name: "", phone: "" })
    const [countryCode, setCountryCode] = useState<string | null>(null)
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))
    }, [])
    const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))
    }, [])
    useEffect(() => {
      const getCountryCode = async () => {
        const selectedLocation = localStorage.getItem("selectedLocation")
        if (!selectedLocation) return
        const location = JSON.parse(selectedLocation)
        const { lat, lng } = location

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          )
          const data = await res.json()
          setCountryCode(data.countryCode)
        } catch (error) {
          console.error("Error fetching country code:", error)
        }
      }
      getCountryCode()
    }, [])
    const handleSubmit = useCallback(() => {
      if (!customerDetails.name || !customerDetails.phone) return

      const validationResult = validatePhoneNumberLength(customerDetails.phone, {
        defaultCountry: countryCode as CountryCode,
      })

      if (validationResult !== undefined) {
        toast.error(`Invalid phone number: ${validationResult}`)
        return
      }

      onSubmit(customerDetails)
    }, [customerDetails, onSubmit, countryCode])

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="customerName"
                value={customerDetails.name}
                onChange={handleNameChange}
                placeholder="Enter your name"
                className="h-10"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="customerPhone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="customerPhone"
                value={customerDetails.phone}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number"
                className="h-10"
                type="tel"
                autoComplete="tel"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                className="bg-[#e41e3f] hover:bg-[#c01835]"
                onClick={handleSubmit}
                disabled={!customerDetails.name || !customerDetails.phone || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  },
)

CustomerDetailsPopup.displayName = "CustomerDetailsPopup"

export default function RestaurantOrdering() {
  // State management
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "dine-in">("dine-in")
  const [viewMode, setViewMode] = useState<"table" | "list">("list")
  const [menuCategoriesVisible, setMenuCategoriesVisible] = useState(true)
  const [showCategories, setShowCategories] = useState(false)

  // Location state
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationPopup, setShowLocationPopup] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Cart state
  const [dineInCart, setDineInCart] = useState<MenuItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("dineInCart")
      return savedCart ? JSON.parse(savedCart) : []
    }
    return []
  })
  const [showCartSidebar, setShowCartSidebar] = useState(false)
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>("")

  // Order state
  const [showCustomerDetailsPopup, setShowCustomerDetailsPopup] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [scanningError, setScanningError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isInAppScan, setIsInAppScan] = useState(false)

  // Other state
  const [currency, setCurrency] = useState<{ symbol: string } | null>(null)
  const [restaurantBranding, setRestaurantBranding] = useState<any>(null)
  const [brandingLoading, setBrandingLoading] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0)
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null)
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)
  const [userData, setUserData] = useState<any>(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)
  const [couponCode, setCouponCode] = useState("")
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const { loyaltyPointsGlobal, setLoyaltyPointsGlobal, loyaltyDiscount, setLoyaltyDiscount } = useLoyaltyPointsGlobal()
  const router = useRouter()
  const { createNotification } = useNotifications()

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { data: session } = useSession()

  // Memoized calculations
  const calculateItemTotal = useCallback((item: MenuItem) => {
    const basePrice = item.price * (item.quantity || 1)
    const addonsPrice = (item.selectedAddons || []).reduce((total, addon) => total + addon.price, 0)
    return basePrice + addonsPrice
  }, [])

  const calculateLoyaltyDiscount = useCallback(() => {
    if (!loyaltySettings?.enabled || !useLoyaltyPoints || pointsToRedeem === 0) return 0
    return (pointsToRedeem / loyaltySettings.redeemRate) * loyaltySettings.redeemValue
  }, [loyaltySettings, useLoyaltyPoints, pointsToRedeem])

  const calculateCartTotal = useCallback(() => {
    const subtotal = dineInCart.reduce((total, item) => total + calculateItemTotal(item), 0)
    const loyaltyDiscount = calculateLoyaltyDiscount()
    return Math.max(0, subtotal - loyaltyDiscount)
  }, [dineInCart, calculateItemTotal, calculateLoyaltyDiscount])

  // Responsive view mode
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setViewMode(isMobile ? "grid" : "list")
    }
 

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Expand categories by default
  useEffect(() => {
    const allParentIds = new Set<string>()
    function collectParentIds(cats: MenuCategory[]) {
      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          allParentIds.add(cat.id)
          collectParentIds(cat.children)
        }
      })
    }
    collectParentIds(categories.filter((cat) => !cat.parentId))
    setExpandedCategories(allParentIds)
  }, [categories])

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("dineInCart", JSON.stringify(dineInCart))
  }, [dineInCart])

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocation(true)
      try {
        const response = await fetch("/api/customer_api/locations")
        const data = await response.json()

        setLocations(data)

        if (data.length === 0) {
          setShowLocationPopup(true)
          setLocationError("No locations available. Please contact support.")
        }
      } catch (error) {
        console.error("Error fetching locations:", error)
        setLocationError("Failed to fetch locations. Please try again later.")
        setShowLocationPopup(true)
      } finally {
        setIsLoadingLocation(false)
      }
    }

    fetchLocations()
  }, [])

  // Get user location
  useEffect(() => {
    const savedLocation = localStorage.getItem("selectedLocation")
    if (savedLocation) {
      const location = JSON.parse(savedLocation)
      setSelectedLocation(location)
      setUserLocation({
        lat: Number.parseFloat(location.lat),
        lng: Number.parseFloat(location.lng),
      })
      return
    }

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setIsLoadingLocation(false)
      setShowLocationPopup(true)
      return
    }

    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error("Error getting user location:", error)
        setLocationError("Unable to get your location. Please select a location manually.")
        setIsLoadingLocation(false)
        setShowLocationPopup(true)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    )
  }, [])

  // Select nearest location
  useEffect(() => {
    if (userLocation && locations.length > 0 && !selectedLocation) {
      let nearestLocation = locations[0]
      let minDistance = Number.POSITIVE_INFINITY

      locations.forEach((location) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          Number.parseFloat(location.lat),
          Number.parseFloat(location.lng),
        )

        if (distance < minDistance) {
          minDistance = distance
          nearestLocation = location
        }
      })

      if (minDistance <= 5) {
        localStorage.setItem("selectedLocation", JSON.stringify(nearestLocation))
        setSelectedLocation(nearestLocation)
        setShowLocationPopup(false)
        setLocationError(null)
      } else {
        setLocationError("No nearby locations found. Please select a location manually.")
        setShowLocationPopup(true)
      }
    }
  }, [userLocation, locations, selectedLocation])

  // Fetch menu data
  useEffect(() => {
    if (!selectedLocation) return

    const fetchMenuData = async () => {
      setIsLoadingMenu(true)
      try {
        const response = await fetch(
          `/api/customer_api/menu-items?locationId=${selectedLocation.id}&categoryId=${selectedCategory}`,
        )
        const data = await response.json()

        if (data.error) {
          console.error("Error fetching menu:", data.error)
          return
        }

        if (!data.menuItems) {
          console.error("No menu items in response:", data)
          return
        }

        setMenuItems(data.menuItems)
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error("Error fetching menu:", error)
      } finally {
        setIsLoadingMenu(false)
      }
    }

    fetchMenuData()
  }, [selectedLocation, selectedCategory])

  // Fetch currency settings
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "currency", isPublic: true }),
        })
        const data = await response.json()
        const currencySettings = JSON.parse(data.value)
        const defaultCurrency =
          Object.entries(currencySettings).find(([_, value]) => (value as any).default)?.[0] || "USD"
        setCurrency(currencySettings[defaultCurrency] || { symbol: "$" })
      } catch (error) {
        console.error("Error fetching currency:", error)
        setCurrency({ symbol: "$" })
      }
    }

    fetchCurrency()
  }, [])

  // Fetch branding
  useEffect(() => {
    const fetchBranding = async () => {
      setBrandingLoading(true)
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "brand_assets", isPublic: true }),
        })
        const data = await response.json()
        setRestaurantBranding(JSON.parse(data.value))
      } catch (error) {
        console.error("Error fetching branding:", error)
      } finally {
        setBrandingLoading(false)
      }
    }

    fetchBranding()
  }, [])
  

  // Fetch loyalty data
  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        const [settingsResponse, pointsResponse, ] = await Promise.all([
          fetch("/api/settings/loyalty"),
          fetch("/api/user/loyalty-points"),
      
        ])

        const settingsData = await settingsResponse.json()
        const pointsData = await pointsResponse.json()

        setLoyaltySettings(settingsData)
        setLoyaltyPoints(pointsData.points)
        // setLoyaltyPointsGlobal(pointsData.points)
      } catch (error) {
        console.error("Error fetching loyalty data:", error)
      }
    }

    fetchLoyaltyData()
  }, [])

  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/me?locationId=${selectedLocation.id}`)
        const data = await response.json()
        setUserData(data)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoadingUserData(false)
      }
    }

    if (session?.user) {
      fetchUserData()
    } else {
      setIsLoadingUserData(false)
    }
  }, [session])

  // Handle URL table parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tableNumber = urlParams.get("table")

    if (tableNumber) {
      setSelectedTableNumber(tableNumber)
      setOrderType("dine-in")
    }
  }, [])

  // Camera functions
  const startCamera = useCallback(async () => {
    setIsInAppScan(true)
    setCameraOpen(true)
    setScanningError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraStream(stream)
        startQRScanning()
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setScanningError("Failed to access camera. Please check your permissions.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setCameraOpen(false)
    setCapturedImage(null)
    setIsScanning(false)
    setIsInAppScan(false)
  }, [cameraStream])

  const startQRScanning = useCallback(() => {
    setIsScanning(true)
    const scanInterval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (context) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          context.drawImage(video, 0, 0, canvas.width, canvas.height)

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          })
          if (code) {
            handleScanResult(code.data)
            clearInterval(scanInterval)
            setIsScanning(false)
            setCapturedImage(canvas.toDataURL("image/png"))
          }
        }
      }
    }, 100)

    return () => clearInterval(scanInterval)
  }, [])

  const handleScanResult = useCallback(
    async (result: string) => {
      try {
        const url = new URL(result)
        const tableNumber = url.searchParams.get("table")

        if (tableNumber) {
          // Check table availability
          const response = await fetch(`/api/tables/check?number=${tableNumber}`)
          const data = await response.json()

          if (!data.available) {
            setScanningError(`Table ${tableNumber} is currently not available.`)
            return
          }

          setSelectedTableNumber(tableNumber)
          window.history.pushState({}, "", `?table=${tableNumber}`)

          if (isInAppScan) {
            setShowCustomerDetailsPopup(true)
            setCameraOpen(false)
          }
        } else {
          setScanningError("Invalid QR code. Please scan a valid table QR code.")
        }
      } catch (error) {
        setScanningError("Invalid QR code. Please scan a valid URL." + error)
      }
    },
    [isInAppScan],
  )

  // Event handlers
  const handleAddToCart = useCallback((newItem: MenuItem) => {
    setDineInCart((prev) => {
      const existingItemIndex = prev.findIndex(
        (item) =>
          item.id === newItem.id && JSON.stringify(item.selectedAddons) === JSON.stringify(newItem.selectedAddons),
      )

      if (existingItemIndex >= 0) {
        const updatedCart = [...prev]
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: (updatedCart[existingItemIndex].quantity || 1) + (newItem.quantity || 1),
        }
        return updatedCart
      } else {
        return [...prev, newItem]
      }
    })
    setShowCartSidebar(true)
  }, [])

  const handleRemoveFromCart = useCallback((index: number) => {
    setDineInCart((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handlePlaceOrder = useCallback(async () => {
    if (orderType === "dine-in") {
      if (!selectedTableNumber) {
        setScanningError("Please enter a table number or scan a QR code.")
        return
      }
      setShowCustomerDetailsPopup(true)
    } else {
      // Handle pickup/delivery order
      const orderData = {
        items: dineInCart,
        locationId: selectedLocation?.id,
        total: calculateCartTotal(),
        orderType,
        orderTime: new Date().toISOString(),
      }
      localStorage.setItem("pendingOrder", JSON.stringify(orderData))
      if(session?.user){
        router.push("/checkout")
      }
      else  {
        window.location.href = "/login?callbackUrl=/checkout"
      }
    }
  }, [orderType, selectedTableNumber, dineInCart, selectedLocation, calculateCartTotal])

  const handleSubmitOrder = useCallback(
    async (customerDetails: CustomerDetails) => {
      setIsSubmitting(true)
      try {
        const response = await fetch("/api/dine-in/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: Date.now().toString(),
            items: dineInCart,
            tableNumber: selectedTableNumber,
            totalPrepTime: dineInCart.reduce((acc, item) => acc + (item.prepTime || 0), 0),
            orderType: "dine-in",
            customerDetails,
            total: calculateCartTotal(),
            orderTime: new Date().toISOString(),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setErrorMessage(data.error || "Failed to place order. Please try again.")
          setShowErrorPopup(true)
          return
        }
        const confirmation: OrderConfirmation = {
          orderId: data.order.orderNumber,
          tableNumber: selectedTableNumber,
          items: dineInCart,
          total: calculateCartTotal(),
          customerDetails,
          orderTime: new Date().toLocaleString(),
        }
      
                const kitchenCookSocket = io("/kitchenCook", {
                    path: "/api/socket/io",
                    query: { restaurantId: selectedLocation?.userId },
                  })
                  kitchenCookSocket.emit("cookOrderUpdate", {
                    message: "Dine In Order Placed",
                    restaurantId: selectedLocation?.userId,
                  })

                  createNotification({
                    type: "order",
                    title: "Dine In Order Placed",
                    priority: "high",
                    data: {
                      type: "order",
                      data: {
                        orderId: data.order.id,
                        orderNumber: data.order.orderNumber,
                        status: "pending",
                      },
                    },
                    message: "Order status has been changed",
                    roleFilter: ["Restaurant", "Restaurant_manager", "Restaurant_supervisor"],
                    restaurantId: selectedLocation?.userId || "",
                  })

        setOrderConfirmation(confirmation)
        setShowOrderConfirmation(true)
        setShowCustomerDetailsPopup(false)
        setShowCartSidebar(false)
        setDineInCart([])

      } catch (error) {
        console.error("Error placing order:", error)
        setErrorMessage("An unexpected error occurred. Please try again.")
        setShowErrorPopup(true)
      } finally {
        setIsSubmitting(false)
      }
    },
    [dineInCart, selectedTableNumber, calculateCartTotal],
  )

  const handleLoyaltyPointsChange = useCallback(
    (points: number) => {
      if (!loyaltySettings) return

      const maxPoints = Math.min(
        loyaltyPoints,
        Math.floor((calculateCartTotal() * loyaltySettings.redeemRate) / loyaltySettings.redeemValue),
      )
      if(Math.min(points, maxPoints) <= loyaltySettings.minRedeemPoints ){
        setPointsToRedeem(Math.min(points, maxPoints))
        setLoyaltyPointsGlobal(Math.min(points, maxPoints))
     
      }else{
        setPointsToRedeem(loyaltySettings.minRedeemPoints)          
        setLoyaltyPointsGlobal(loyaltySettings.minRedeemPoints)
        
      }
    },
    [loyaltySettings, loyaltyPoints, calculateCartTotal],
  )
  

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // User dropdown component
  const UserDropdown = React.memo(() => {
    if (isLoadingUserData) return <Skeleton className="w-10 h-10 rounded-full" />
    if (!userData) return null



    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Avatar>
              <AvatarImage src={userData?.profileImage || "/placeholder.svg"} />
              <AvatarFallback>{userData?.profileImage?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[250px]">
          <DropdownMenuItem asChild>
            <Link href="/account#profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account#orders" className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              Orders
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account#payment" className="flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account#addresses" className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Addresses
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account#preferences" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logoutFromAllDevices("/login")}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  })

  UserDropdown.displayName = "UserDropdown"

  // Render menu items
  const renderMenuItems = useMemo(() => {
    if (isLoadingMenu) {
      return <MenuSkeleton viewMode={viewMode} />
    }

    if (menuItems.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items available</p>
        </div>
      )
    }

    return (
      <div
        className={cn(
          "grid gap-6",
          viewMode === "table" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2",
        )}
      >
        {menuItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onAddToCart={handleAddToCart}
            viewMode={viewMode}
            orderType={orderType}
            currency={currency}
          />
        ))}
      </div>
    )
  }, [isLoadingMenu, menuItems, viewMode, handleAddToCart, orderType, currency])

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#1a2235] text-white shadow-sm sticky top-0 z-20">
        <div className="max-w-full mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between px-0">
            {/* Logo and Menu Toggle */}
            <div className="flex items-center justify-between w-full md:w-auto px-4 py-2">
              <button
                onClick={() => setMenuCategoriesVisible(!menuCategoriesVisible)}
                className="p-2 hover:bg-[#2a3245] transition-colors rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>

              <div className="flex items-center justify-center text-white px-4 py-2 rounded-md">
                {brandingLoading ? (
                  <Skeleton className="w-20 h-5" />
                ) : restaurantBranding ? (
                  <img src={restaurantBranding["logo-dark"] || "/placeholder.svg"} alt="logo" className="w-[210px]" />
                ) : (
                  "OPENPHO"
                )}
              </div>

              <div className="flex items-center space-x-2 md:hidden">
                {orderType === "dine-in" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-8 h-8 rounded-full text-white hover:bg-[#2a3245]"
                    onClick={startCamera}
                    disabled={dineInCart.length === 0}
                  >
                    <Camera className="h-4 w-4" />
                    {dineInCart.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#e41e3f] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {dineInCart.length}
                      </span>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-8 h-8 rounded-full text-white hover:bg-[#2a3245]"
                  onClick={() => setShowCartSidebar(true)}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {dineInCart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#e41e3f] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {dineInCart.length}
                    </span>
                  )}
                </Button>
              
                {session?.user && <UserDropdown />}
              </div>
            </div>

            {/* Navigation Options */}
            <div className="flex items-center justify-center w-full bg-[#2a3245] md:bg-transparent">
              <div className="flex items-center overflow-x-auto w-full md:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => setDeliveryDialogOpen(true)}
                  className={cn(
                    "flex-1 md:flex-none rounded-none px-4 md:px-8 py-3 md:py-4 h-12 md:h-16 text-sm md:text-base font-medium transition-all duration-200 whitespace-nowrap",
                    orderType === "delivery"
                      ? "text-[#1a2235] bg-white hover:bg-white"
                      : "text-white hover:bg-[#2a3245]",
                  )}
                >
                  ONLINE Delivery
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setOrderType("pickup")}
                  className={cn(
                    "flex-1 md:flex-none rounded-none px-4 md:px-8 py-3 md:py-4 h-12 md:h-16 text-sm md:text-base font-medium transition-all duration-200 whitespace-nowrap",
                    orderType === "pickup" ? "text-[#1a2235] bg-white hover:bg-white" : "text-white hover:bg-[#2a3245]",
                  )}
                >
                  PICKUP
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setOrderType("dine-in")}
                  className={cn(
                    "flex-1 md:flex-none rounded-none px-4 md:px-8 py-3 md:py-4 h-12 md:h-16 text-sm md:text-base font-medium transition-all duration-200 whitespace-nowrap",
                    orderType === "dine-in"
                      ? "text-[#1a2235] bg-white hover:bg-white"
                      : "text-white hover:bg-[#2a3245]",
                  )}
                >
                  DINE-IN
                </Button>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className={`hidden md:flex items-center space-x-3 pr-5 ${session ? session.user.role === 'Customer' ? 'w-[40%]' : 'w-[30%]' : 'w-[30%]'}`}>
              <div className="flex items-center mr-2">
                <span className="mr-1 text-sm font-medium">ENGLISH</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>

              {orderType === "dine-in" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative w-9 h-9 rounded-full text-white hover:bg-[#2a3245]"
                  onClick={startCamera}
                >
                  <Camera className="h-5 w-5" />
                  {dineInCart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#e41e3f] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {dineInCart.length}
                    </span>
                  )}
                </Button>
              )}

              <div
                className="flex items-center justify-center bg-white text-[#1a2235] px-3 py-1 rounded-full cursor-pointer"
                onClick={() => setShowCartSidebar(true)}
              >
                <ShoppingCart className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">
                  {orderType === "delivery" ? "Delivery" : orderType === "pickup" ? "Pickup" : "Dine-In"}:{" "}
                  {dineInCart.length}
                </span>
              </div>

              {session?.user && <UserDropdown />}
            </div>
          </div>
        </div>
        <div className="h-1 bg-[#8b1a2b]"></div>
      </header>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={showCartSidebar}
        onClose={() => setShowCartSidebar(false)}
        items={dineInCart}
        onRemoveItem={handleRemoveFromCart}
        orderType={orderType}
        tableNumber={selectedTableNumber}
        onTableNumberChange={setSelectedTableNumber}
        onScanClick={() => {
          setShowCartSidebar(false)
          startCamera()
        }}
        onPlaceOrder={handlePlaceOrder}
        currency={currency}
        isLoading={isLoadingMenu}
        loyaltySettings={loyaltySettings}
        loyaltyPoints={loyaltyPoints}
        useLoyaltyPoints={useLoyaltyPoints}
        onLoyaltyToggle={setUseLoyaltyPoints}
        pointsToRedeem={pointsToRedeem}
        onPointsChange={handleLoyaltyPointsChange}
        loyaltyDiscount={calculateLoyaltyDiscount()}
      />

      {/* Camera Dialog */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <Button variant="ghost" size="icon" onClick={stopCamera}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* {isScanning && (  
              <div className="flex items-center justify-center position-absolute">
                <Loader2 className="animate-spin" />
              </div>
            )} */}

            <div className="p-4">
              {scanningError ? (
                <div className="w-full h-64 bg-gray-100 rounded-md flex flex-col items-center justify-center">
                  <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                  <p className="text-red-500 text-center px-4">{scanningError}</p>
                  <Button
                    onClick={() => {
                      setScanningError(null)
                      startCamera()
                    }}
                    className="mt-4 bg-[#e41e3f] hover:bg-[#c01835] text-white"
                  >
                    Try Again
                  </Button>
                </div>
              ) : !capturedImage ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-gray-100 rounded-md object-cover"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-red-500 pointer-events-none m-8 rounded"></div>
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-pulse text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
                        Scanning...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={capturedImage || "/placeholder.svg"}
                    alt="Captured"
                    className="w-full h-64 bg-gray-100 rounded-md object-cover"
                  />
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Choose Delivery Partner</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button className="justify-start h-12 text-base" variant="outline">
              UberEats
            </Button>
            <Button className="justify-start h-12 text-base" variant="outline">
              Fantuan
            </Button>
            <Button className="justify-start h-12 text-base" variant="outline">
              DoorDash
            </Button>
            <Button className="justify-start h-12 text-base" variant="outline">
              SkipTheDishes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorPopup} onOpenChange={setShowErrorPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{errorMessage}</p>
          </div>
          <div className="flex justify-end">
            <Button className="bg-[#e41e3f] hover:bg-[#c01835]" onClick={() => setShowErrorPopup(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Popup */}
      <CustomerDetailsPopup
        open={showCustomerDetailsPopup}
        onOpenChange={setShowCustomerDetailsPopup}
        onSubmit={handleSubmitOrder}
        isSubmitting={isSubmitting}
      />

      {/* Order Confirmation Dialog */}
      <Dialog open={showOrderConfirmation} onOpenChange={setShowOrderConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Confirmation</DialogTitle>
          </DialogHeader>
          {orderConfirmation && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Order Placed Successfully!</h3>
                <p className="text-sm text-gray-500">Order ID: {orderConfirmation.orderId}</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Table:</span> #{orderConfirmation.tableNumber}
                  </p>
                  <p>
                    <span className="text-gray-500">Customer:</span> {orderConfirmation.customerDetails.name}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span> {orderConfirmation.customerDetails.phone}
                  </p>
                  <p>
                    <span className="text-gray-500">Time:</span> {orderConfirmation.orderTime}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {orderConfirmation.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>
                        {currency?.symbol}
                        {calculateItemTotal(item).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total</span>
                    <span>
                      {currency?.symbol}
                      {orderConfirmation.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-[#e41e3f] hover:bg-[#c01835]"
                onClick={() => setShowOrderConfirmation(false)}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-x-hidden">
        {/* Left Icon Menu */}
        <div
          className={cn(
            "mt-10 lg:mt-0 fixed left-0 top-0 bottom-0 w-16 bg-white shadow-md z-10 flex flex-col items-center pt-20 pb-6 space-y-8 border-r border-gray-100 transition-transform duration-300",
            menuCategoriesVisible ? "translate-x-0" : "-translate-x-16",
          )}
        >
          <Button
            className="p-3 text-white bg-[#e41e3f] rounded-full hover:bg-gray-100 hover:text-gray-600 transition-all relative group lg:hidden"
            onClick={() => setShowCategories(!showCategories)}
          >
            <List className="h-4 w-4 text-white" />
            <span className="text-white absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Categories
            </span>
          </Button>

          <Link
            href="/account#orders"
            className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Order History
            </span>
          </Link>

          <Link href="/help" className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group">
            <HelpCircle className="h-4 w-4" />
            <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Help
            </span>
          </Link>

          <button
            onClick={() => setShowCartSidebar(true)}
            className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Cart
            </span>
          </button>

          <Link
            href="/account"
            className="p-3 rounded-full hover:bg-gray-100 text-gray-600 transition-all relative group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-2 rounded bg-gray-900 text-white text-xs font-medium py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Account
            </span>
          </Link>
        </div>

        {/* Categories Sidebar */}
        <div
          className={cn(
            "w-64 bg-white border-r border-gray-200 ml-16 overflow-y-auto transition-transform duration-300 shadow-sm",
            "lg:translate-x-0 lg:relative hidden lg:block",
            showCategories ? "fixed top-30 left-0 h-full z-40 translate-x-0 block" : "-translate-x-full",
          )}
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            {isLoadingMenu ? (
              <CategorySkeleton />
            ) : (
              <CategoryNavigation
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                expandedCategories={expandedCategories}
                onToggleCategory={toggleCategory}
              />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-white relative transition-all duration-300">
          <div className="mx-auto  w-[90%] lg:w-full 2xl:w-[100%] 2xl:mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                {isLoadingLocation ? (
                  <LoadingSpinner size="sm" />
                ) : locationError ? (
                  <span className="text-sm text-red-600">{locationError}</span>
                ) : (
                  <span className="text-sm text-gray-600 hidden md:block">
                    {selectedLocation ? selectedLocation.address : "Select a location"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  className="text-sm text-[#e41e3f] hover:text-[#c01835] font-semibold hover:bg-gray-100"
                  onClick={() => setShowLocationPopup(true)}
                >
                  {locationError
                    ? "Select location"
                    : selectedLocation
                      ? selectedLocation.address.slice(0, 30).concat("...")
                      : "Other location"}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-gray-300 bg-white hover:bg-gray-50 shadow-sm h-10 px-4"
                    >
                      <span className="font-medium">COUPONS</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Apply Coupon Code</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Input
                        placeholder="Enter coupon code"
                        className="h-12"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button className="h-10 bg-[#e41e3f] hover:bg-[#c01835] text-white">Apply Coupon</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="hidden md:flex border rounded-md shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={cn("h-10 px-3", viewMode === "table" ? "bg-gray-100" : "bg-white")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={cn("h-10 px-3", viewMode === "list" ? "bg-gray-100" : "bg-white")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            {renderMenuItems}
          </div>
        </div>
      </div>

      {/* Location Popup */}
      {showLocationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Select Location</h3>
              {selectedLocation && (
                <Button variant="ghost" size="icon" onClick={() => setShowLocationPopup(false)}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="p-4">
              {locationError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{locationError}</div>}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedLocation?.id === location.id
                        ? "bg-[#fff5f7] border border-[#e41e3f]"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => {
                      setSelectedLocation(location)
                      localStorage.setItem("selectedLocation", JSON.stringify(location))
                      setLocationError(null)
                      setShowLocationPopup(false)
                    }}
                  >
                    <div className="font-medium">{location.address}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

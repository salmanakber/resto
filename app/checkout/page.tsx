  "use client"

  import type React from "react"
  import { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef, useCallback } from "react"
  import Link from "next/link"
  import { useRouter } from "next/navigation"
  import { ChevronLeft, CreditCard, Check, Loader2, MapPin, Clock, Shield, Phone, User, Mail } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
  import { Separator } from "@/components/ui/separator"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import { Textarea } from "@/components/ui/textarea"
  import { toast } from "sonner"
  import { loadStripe } from "@stripe/stripe-js"
  import { useSession } from "next-auth/react"
  import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
  import { CheckoutSkeleton } from "@/components/skeletons/checkout-skeleton"
  import { useSocket } from "../../hooks/useSocket"
  import { useLoyaltyPointsGlobal } from "../context/AppContextProvider"
  import { useNotifications } from "@/lib/hooks/useNotifications"

  // Enhanced interfaces with better typing
  interface OrderItem {
    id: string
    name: string
    quantity: number
    price: number
    image?: string
    selectedAddons?: Array<{
      name: string
      price: number
    }>
  }

  interface OrderData {
    items: OrderItem[]
    locationId: string
    tip: number
  }

  interface Location {
    id: string
    name: string
    address: string
    phone: string
    rating: number
    estimatedTime: string
  }

  // Stripe promise singleton to prevent re-initialization
  let stripePromise: Promise<any> | null = null

  const getStripe = (publishableKey: string) => {
    if (!stripePromise && publishableKey) {
      stripePromise = loadStripe(publishableKey)
    }
    return stripePromise
  }

  // Enhanced Card Form Component - Fixed version
  const EnhancedCardForm = forwardRef<any, any>(
    ({ onPaymentMethodCreated, customerDetails, total, onSaveForLaterChange }, ref) => {
      const stripe = useStripe()
      const elements = useElements()
      const [error, setError] = useState<string | null>(null)
      const [processing, setProcessing] = useState(false)
      const [saveForLater, setSaveForLater] = useState(false)

      const handleCheckboxChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          const checked = e.target.checked
          setSaveForLater(checked)
          onSaveForLaterChange?.(checked)
        },
        [onSaveForLaterChange],
      )

      // Clear error when saveForLater changes
      useEffect(() => {
        if (error && saveForLater) {
          setError(null)
        }
      }, [saveForLater, error])

      useImperativeHandle(
        ref,
        () => ({
          async submitCard() {
            if (!stripe || !elements) {
              return { success: false, error: "Stripe not ready" }
            }

            setProcessing(true)
            setError(null)

            const cardElement = elements.getElement(CardElement)
            if (!cardElement) {
              const errorMsg = "Card element not found"
              setError(errorMsg)
              setProcessing(false)
              return { success: false, error: errorMsg }
            }

            try {
              const { error: createMethodError, paymentMethod } = await stripe.createPaymentMethod({
                type: "card",
                card: cardElement,
                billing_details: {
                  name: customerDetails.name,
                  email: customerDetails.email,
                  phone: customerDetails.phone,
                },
              })

              if (createMethodError) {
                setError(createMethodError.message || "An error occurred")
                return { success: false, error: createMethodError.message }
              }

              if (!paymentMethod) {
                const msg = "Failed to create payment method"
                setError(msg)
                return { success: false, error: msg }
              }

              onPaymentMethodCreated?.(paymentMethod.id)

              return {
                success: true,
                paymentMethodId: paymentMethod.id,
                saveForLater,
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : "An error occurred"
              setError(msg)
              return { success: false, error: msg }
            } finally {
              setProcessing(false)
            }
          },
        }),
        [stripe, elements, customerDetails, onPaymentMethodCreated, saveForLater],
      )

      return (
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl opacity-50"></div>
            <div className="relative p-6 border-2 border-red-100 rounded-xl bg-white/80 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Secure Payment</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-element" className="text-sm font-medium text-gray-700">
                    Card Details
                  </Label>
                  <div className="p-4 border-2 border-gray-200 rounded-lg bg-white focus-within:border-red-300 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                    <CardElement
                      id="card-element"
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#374151",
                            fontFamily: "system-ui, sans-serif",
                            "::placeholder": {
                              color: "#9CA3AF",
                            },
                          },
                          invalid: {
                            color: "#EF4444",
                          },
                        },
                        hidePostalCode: true,
                      }}
                    />
                  </div>
                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="save-card"
                    checked={saveForLater}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-red-500 focus:ring-red-400 border-gray-300 rounded"
                  />
                  <Label htmlFor="save-card" className="text-sm text-gray-600 cursor-pointer">
                    Save this card for future orders
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
  )
  EnhancedCardForm.displayName = "EnhancedCardForm"
  // Add this interface near other interfaces
  interface SavedCard {
    id: string
    last4: string
    brand: string
    expMonth: number
    expYear: number
    isDefault: boolean
    stripeCustomerId: string
    stripePaymentMethodId: string
  }

  export default function CheckoutPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [orderData, setOrderData] = useState<OrderData | null>(null)
    const [paymentSettings, setPaymentSettings] = useState<any>(null)
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [currency, setCurrency] = useState<any>({ symbol: "$" })
    const [taxSettings, setTaxSettings] = useState<any>(null)
    const [companyDetails, setCompanyDetails] = useState<any>(null)
    const { userData, kitchenCookSocket, kitchenAdminSocket } = useSocket()
    const [loyaltySettings, setLoyaltySettings] = useState<any>(null)
    const [loyaltyPoints, setLoyaltyPoints] = useState(0)
    const cardFormRef = useRef<any>(null)

    const [loginUserData, setUserData] = useState<any>(null)
    const { data: session } = useSession()
    const { loyaltyPointsGlobal, setLoyaltyPointsGlobal, loyaltyDiscount, setLoyaltyDiscount } = useLoyaltyPointsGlobal()
    // Add this state near other state declarations
    const [savedCards, setSavedCards] = useState<SavedCard[]>([])
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("new");
    const { createNotification } = useNotifications()

    // Form state with better organization
    const [customerInfo, setCustomerInfo] = useState({
      name: "",
      email: "",
      phone: "",
      specialInstructions: "",
    })

    useEffect(() => {
      const defaultCard = savedCards.find((c) => c.isDefault);
      if (defaultCard) {
        setSelectedPaymentMethod(defaultCard.id);
      }
    }, [savedCards]);

    const [pickupDetails, setPickupDetails] = useState({
      time: "ASAP (15-25 min)",
      availableTimes: [] as string[],
    })

    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Memoize Stripe promise to prevent re-initialization
    const stripePromise = useMemo(() => {
      if (paymentSettings?.credential?.stripe?.enabled && paymentSettings?.credential?.stripe?.apiKey) {
        return getStripe(paymentSettings.credential.stripe.apiKey)
      }
      return null
    }, [paymentSettings?.credential?.stripe?.enabled, paymentSettings?.credential?.stripe?.apiKey])

    // Fetch loyalty data
    useEffect(() => {
      const fetchLoyaltyData = async () => {
        try {
          const [settingsResponse, pointsResponse] = await Promise.all([
            fetch("/api/settings/loyalty"),
            fetch("/api/user/loyalty-points"),
          ])

          const settingsData = await settingsResponse.json()
          const pointsData = await pointsResponse.json()

          setLoyaltySettings(settingsData)
          setLoyaltyPoints(pointsData.points)
        } catch (error) {
          console.error("Error fetching loyalty data:", error)
        }
      }

      fetchLoyaltyData()
    }, [])

    // Update customer info when user data changes
    useEffect(() => {
      if (loginUserData) {
        setCustomerInfo((prev) => ({
          ...prev,
          name: `${loginUserData.firstName || ""} ${loginUserData.lastName || ""}`.trim(),
          email: loginUserData.email || "",
          phone: loginUserData.phoneNumber || "",
        }))
      }
    }, [loginUserData])

    // Load initial data
    useEffect(() => {
      const loadCheckoutData = async () => {
        try {
          setIsLoading(true)

          // Load order data from localStorage
          const savedOrder = localStorage.getItem("pendingOrder")
          if (!savedOrder) {
            router.push("/dashboard")
            return
          }

          const order = JSON.parse(savedOrder)
          setOrderData(order)

          // Load location details
          if (order.locationId) {
            const locationResponse = await fetch(`/api/customer_api/locations/${order.locationId}`)
            const locationData = await locationResponse.json()
            setSelectedLocation(locationData)

            // Generate pickup times
            const times = generatePickupTimes(locationData.timeZone || "UTC")
            setPickupDetails((prev) => ({ ...prev, availableTimes: times }))
          }

          // Load payment settings
          const settingsResponse = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "paymentGateway", isPublic: true }),
          })

          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json()
            setPaymentSettings(JSON.parse(settingsData.value))
          }

          // Load currency and tax settings
          await Promise.all([loadCurrencySettings(), loadTaxSettings(), CompanyDetails()])
        } catch (error) {
          console.error("Error loading checkout data:", error)
          toast.error("Failed to load checkout information")
        } finally {
          setIsLoading(false)
        }
      }

      loadCheckoutData()
    }, [router])

    const generatePickupTimes = (timeZone: string) => {
      const times = ["ASAP (15-25 min)"]
      const now = new Date()

      for (let i = 1; i <= 8; i++) {
        const time = new Date(now.getTime() + i * 30 * 60000)
        const formattedTime = time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone,
        })
        times.push(`Today, ${formattedTime}`)
      }

      return times
    }

    const loadCurrencySettings = async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "currency", isPublic: true }),
        })

        if (response.ok) {
          const data = await response.json()
          const parsedCurrency = JSON.parse(data.value)
          const defaultCurrency =
            Object.entries(parsedCurrency).find(([_, value]) => (value as any).default)?.[0] || "USD"
          setCurrency(parsedCurrency[defaultCurrency] || { symbol: "$" })
        }
      } catch (error) {
        console.error("Error loading currency settings:", error)
      }
    }

    const CompanyDetails = async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "company", isPublic: true }),
        })
        if (response.ok) {
          const data = await response.json()
          setCompanyDetails(JSON.parse(data.value))
        }
      } catch (error) {
        console.error("Error loading company details:", error)
      }
    }

    const loadTaxSettings = async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "taxes", isPublic: true }),
        })

        if (response.ok) {
          const data = await response.json()
          setTaxSettings(JSON.parse(data.value))
        }
      } catch (error) {
        console.error("Error loading tax settings:", error)
      }
    }

    // Calculate order totals
    const orderTotals = useMemo(() => {
      if (!orderData || !taxSettings) return { subtotal: 0, tax: 0, total: 0, tip: 0 }

      const subtotal = orderData.items.reduce((total, item) => {
        const itemTotal = item.price * item.quantity
        const addonsTotal = (item.selectedAddons || []).reduce((sum, addon) => sum + addon.price, 0)
        return total + itemTotal + addonsTotal
      }, 0)

      let tax = 0
      if (taxSettings.gst?.enabled) tax += (subtotal * taxSettings.gst.taxRate) / 100
      if (taxSettings.pst?.enabled) tax += (subtotal * taxSettings.pst.taxRate) / 100
      if (taxSettings.hst?.enabled) tax += (subtotal * taxSettings.hst.taxRate) / 100

      const total = subtotal + tax + (orderData.tip || 0)

      return { subtotal, tax, total, tip: orderData.tip || 0 }
    }, [orderData, taxSettings])

    const formatCurrency = (amount: number) => {
      const symbol = currency?.symbol || "$"
      return `${symbol}${amount.toFixed(2)}`
    }

    const calculateLoyaltyDiscount = useMemo(() => {
      if (!loyaltySettings?.enabled || !loyaltyPointsGlobal || loyaltyPointsGlobal === 0) return 0
      return (loyaltyPointsGlobal / loyaltySettings.redeemRate) * loyaltySettings.redeemValue
    }, [loyaltySettings, loyaltyPointsGlobal])

    const calculateCartTotal = useMemo(() => {
      return Math.max(0, orderTotals.total - calculateLoyaltyDiscount)
    }, [orderTotals.total, calculateLoyaltyDiscount])

    const generateOrderNumber = () => {
      const timeString = Date.now()
      return timeString
    }
    const validateForm = () => {
      const errors: Record<string, string> = {}

      if (!customerInfo.name.trim()) errors.name = "Name is required"
      if (!customerInfo.email.trim()) errors.email = "Email is required"
      else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) errors.email = "Email is invalid"
      if (!customerInfo.phone.trim()) errors.phone = "Phone number is required"

      setFormErrors(errors)
      return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        toast.error("Please fill in all required fields")
        return
      }

      setIsSubmitting(true)



      try {
        let customerData: any = null;
        let paymentDetails: any = null;
      
        // // Handle new card
        if (selectedPaymentMethod === "new" && cardFormRef.current) {
          const result = await cardFormRef.current.submitCard();
          if (result.success) {
            customerData = {
              paymentMethodId: result.paymentMethodId,
              saveForLater: result.saveForLater,
              customerEmail: customerInfo.email,
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
            };
          } else {
            toast.error(result.error || "Failed to process payment method");
            return;
          }
        }
      
        // Handle saved card
        if (
          selectedPaymentMethod !== "new" &&
          selectedPaymentMethod !== "cash" &&
          selectedPaymentMethod !== "paypal" &&
          selectedPaymentMethod !== null
        ) {
          const foundCard = savedCards.find((card) => card.id === selectedPaymentMethod);
          
          if (foundCard) {
            customerData = {
              paymentMethodId: foundCard.stripePaymentMethodId,
              saveForLater: false,
              customerEmail: customerInfo.email,
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
            };
          }
        }
      
        // Handle cash/paypal – no API call
        if (selectedPaymentMethod === "cash" || selectedPaymentMethod === "paypal") {
          customerData = {
            paymentMethodId: selectedPaymentMethod,
            saveForLater: false,
            customerEmail: customerInfo.email,
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
          };
          paymentDetails = {
            status: selectedPaymentMethod,
          };
        }
        
      
        if (!customerData) {
          toast.error("No payment method selected");
          return;
        }
      
        // 🔁 Only call /api/payment if not cash/paypal
        if (selectedPaymentMethod !== "cash" && selectedPaymentMethod !== "paypal") {
          const paymentRes = await fetch("/api/payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: calculateCartTotal,
              paymentMethodId: customerData.paymentMethodId,
              savePaymentMethod: customerData.saveForLater,
              customerEmail: customerInfo.email,
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
            }),
          });
      
          
          if (!paymentRes.ok) throw new Error("Failed to create payment intent");
      
          const paymentSettingsData = await paymentRes.json();
          if(paymentSettingsData.status === "succeeded" ) {
            paymentDetails = {
              status: "COMPLETED",
              paymentId: paymentSettingsData.clientSecret,
            };
          }
        }
        
         // 🧹 Clean and structure order items
         const cleanedItems = orderData?.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          prepTime: item.prepTime,
          selectedAddons: item.selectedAddons?.map(addon => ({
            name: addon.name,
            price: addon.price
          })) || []
        })) || [];
      
        const orderPayload = {
          items: cleanedItems,
          total: calculateCartTotal,
          paymentDetails: paymentDetails,
          totalPrepTime: orderData?.items.reduce(
            (max, item) => Math.max(max, item.prepTime || 0),
            0
          ),          
          orderType: "pickup",
          locationId: selectedLocation?.id,
          customerDetails: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          specialInstructions: customerInfo?.specialInstructions || "",
          pickupTime: pickupDetails.time,
          paymentMethod: customerData.paymentMethodId,
          userId: session?.user?.id, // Assuming this is required on backend; remove if not used
          loyaltyPoints: {
            usePoints: loyaltyPointsGlobal > 0,
            pointsToRedeem: loyaltyPointsGlobal,
            loyaltyPointType: loyaltyPointsGlobal > 0 ? "redeem" : "earn",
            discount: loyaltyPointsGlobal > 0 ? calculateLoyaltyDiscount : 0,
          },
          orderNumber: generateOrderNumber(), // Optional: generate if required
          resturantId: selectedLocation?.userId || "" // If needed by backend
        };
        const orderResponse = await fetch("/api/pickup/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            orderPayload
          )
        });
      
        if (!orderResponse.ok) {
          throw new Error("Failed to create order");
        }
        
        const orderId = await orderResponse.json();
        kitchenCookSocket.current?.emit("cookOrderUpdate", {
          message: "New order placed by " + customerInfo.name,
          restaurantId: selectedLocation?.userId,
        })
   
        createNotification({
          type: "order",
          title: "New Order Placed",
          priority: "high",
          data: {
            type: "order",
            data: {
              orderId: orderId.orderId,
              orderNumber: orderPayload.orderNumber,
              status: "pending",
            },
          },
          message: "New order placed by " + customerInfo.name,
          roleFilter: ["Restaurant", "Restaurant_manager", "Restaurant_supervisor"],
          restaurantId: selectedLocation?.userId || "",
        })
        localStorage.removeItem("dineInCart");
        localStorage.removeItem("pendingOrder");
        toast.success("Order processing...")
        router.push(`/order-confirmation?orderId=${orderId.orderId}`)
        // Continue with order processing...
        setIsSubmitting(false);
    
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to process order. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }

    // Fetch user data
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const selectedLocation = JSON.parse(localStorage.getItem("selectedLocation") || "{}")
          if (!selectedLocation.id) return

          const response = await fetch(`/api/users/me?locationId=${selectedLocation.id}`)
          const data = await response.json()
          setSavedCards(
            data.paymentMethods.map((paymentMethod: any) => ({
              id: paymentMethod.id,
              last4: paymentMethod.cardNumber,
              brand: paymentMethod.type,
              expMonth: paymentMethod.expiryMonth,
              expYear: paymentMethod.expiryYear,
              isDefault: paymentMethod.isDefault,
              stripeCustomerId: paymentMethod.stripeCustomerId,
              stripePaymentMethodId: paymentMethod.paymentMethodId,
            }))
          )
          setUserData(data)
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }

      if (session?.user) {
        fetchUserData()
      }
    }, [session])

    if (isLoading) {
      return <CheckoutSkeleton />
    }

    if (!orderData || !selectedLocation) {
      return <CheckoutSkeleton />
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        {/* Enhanced Header */}
        <div className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-red-600"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Back
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-xl font-semibold text-gray-900">Secure Checkout</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">SSL Secured</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">Cart</span>
              </div>
              <div className="w-16 h-px bg-red-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">2</span>
                </div>
                <span className="text-sm font-medium text-red-600">Checkout</span>
              </div>
              <div className="w-16 h-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">3</span>
                </div>
                <span className="text-sm text-gray-500">Confirmation</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Restaurant Info Card */}
                <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-red-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedLocation.name}</h3>
                        <p className="text-gray-600 mt-1">{selectedLocation.address}</p>
                        <div className="flex items-center space-x-4 mt-3">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">{companyDetails?.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-400">{companyDetails?.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-red-600" />
                      <span>Contact Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your full name"
                          className={`h-11 ${formErrors.name ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-red-400"}`}
                        />
                        {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                          className={`h-11 ${formErrors.phone ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-red-400"}`}
                        />
                        {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        className={`h-11 ${formErrors.email ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-red-400"}`}
                      />
                      {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                      <p className="text-xs text-gray-500">We'll send your order confirmation here</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pickup-time" className="text-sm font-medium text-gray-700">
                        Pickup Time
                      </Label>
                      <Select
                        value={pickupDetails.time}
                        onValueChange={(value) => setPickupDetails((prev) => ({ ...prev, time: value }))}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupDetails.availableTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">
                        Special Instructions (Optional)
                      </Label>
                      <Textarea
                        id="instructions"
                        value={customerInfo.specialInstructions}
                        onChange={(e) => setCustomerInfo((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                        placeholder="Any special requests or dietary restrictions?"
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-red-600" />
                      <span>Payment Method</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onValueChange={setSelectedPaymentMethod}
                      className="space-y-4"
                    >


                      {/* Saved Cards Section */}
                      {savedCards && savedCards.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs font-medium text-gray-500 px-3">SAVED CARDS</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                          </div>

                          {savedCards.map((card, index) => (

                            <div key={card.id} className="relative">
                              <div
                                className={`flex items-center space-x-3 p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                                  selectedPaymentMethod === card.id
                                    ? "border-red-300 bg-red-50/50 shadow-md"
                                    : "border-gray-200 hover:border-red-200 hover:shadow-sm"
                                }`}
                              >
                                <RadioGroupItem value={card.id} id={card.id} />
                                <Label htmlFor={card.id} className="flex-1 flex items-center gap-4 cursor-pointer">
                                  {/* Card Brand Icon */}
                                  <div
                                    className={`w-12 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                                      card.brand === "visa"
                                        ? "bg-blue-600"
                                        : card.brand === "mastercard"
                                          ? "bg-red-500"
                                          : card.brand === "amex"
                                            ? "bg-green-600"
                                            : "bg-gray-600"
                                    }}`}
                                  >
                                    {card.brand === "visa"
                                      ? "VISA"
                                      : card.brand === "mastercard"
                                        ? "MC"
                                        : card.brand === "amex"
                                          ? "AMEX"
                                          : card.brand.toUpperCase()}
                                  </div>

                                  {/* Card Details */}
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900">{card.last4}</span>
                                      {card.isDefault && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                          Default
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Expires {card.expMonth.toString().padStart(2, "0")}/
                                      {card.expYear.toString().slice(-2)}
                                    </p>
                                  </div>

                                  {/* Security Badge */}
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-xs font-medium">Secured</span>
                                  </div>
                                </Label>
                              </div>
                            </div>
                          ))}

                          <div className="flex items-center space-x-2 mt-4 mb-3">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs font-medium text-gray-500 px-3">OR ADD NEW</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                          </div>
                        </div>
                      )}



                      {paymentSettings?.credential?.stripe?.enabled && (
                        <div className="relative">
                          <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-200 transition-colors">
                            <RadioGroupItem value="new" id="new" />
                            <Label htmlFor="new" className="flex-1 flex items-center gap-3 cursor-pointer">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <span className="font-medium">Credit or Debit Card</span>
                                <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                              </div>
                            </Label>
                          </div>
                        </div>
                      )}

                      {paymentSettings?.credential?.paypal?.enabled && (
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-200 transition-colors">
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label htmlFor="paypal" className="flex-1 flex items-center gap-3 cursor-pointer">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">PP</span>
                            </div>
                            <div>
                              <span className="font-medium">PayPal</span>
                              <p className="text-sm text-gray-500">Pay with your PayPal account</p>
                            </div>
                          </Label>
                        </div>
                      )}

                      {paymentSettings?.credential?.cashAtPickup?.enabled && (
                        <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-200 transition-colors">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex-1 flex items-center gap-3 cursor-pointer">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">$</span>
                            </div>
                            <div>
                              <span className="font-medium">Cash at Pickup</span>
                              <p className="text-sm text-gray-500">Pay when you collect your order</p>
                            </div>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>

                    {selectedPaymentMethod === "new" && paymentSettings?.credential?.stripe?.enabled && stripePromise && (
                      <div className="mt-6">
                        <Elements stripe={stripePromise}>
                          <EnhancedCardForm
                            ref={cardFormRef}
                            onSaveForLaterChange={(checked: boolean) => console.log("Save for later:", checked)}
                            customerDetails={customerInfo}
                            total={orderTotals.total}
                            onPaymentMethodCreated={(paymentMethodId: string) => {
                              
                            }}
                          />
                        </Elements>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </form>
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-6">
              <Card className="shadow-xl border-0 sticky top-4 bg-gradient-to-br from-white to-red-50/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3">
                    {orderData.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{item.quantity}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.selectedAddons.map((addon) => addon.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Order Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(orderTotals.subtotal)}</span>
                    </div>

                    {taxSettings?.gst?.enabled && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{taxSettings.gst.taxName}</span>
                        <span className="font-medium">
                          {formatCurrency((orderTotals.subtotal * taxSettings.gst.taxRate) / 100)}
                        </span>
                      </div>
                    )}

                    {taxSettings?.pst?.enabled && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{taxSettings.pst.taxName}</span>
                        <span className="font-medium">
                          {formatCurrency((orderTotals.subtotal * taxSettings.pst.taxRate) / 100)}
                        </span>
                      </div>
                    )}

                    {calculateLoyaltyDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium">-{formatCurrency(calculateLoyaltyDiscount)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-red-600">{formatCurrency(calculateCartTotal)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Place Order</span>
                        <span>•</span>
                        <span>{formatCurrency(calculateCartTotal)}</span>
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    By placing your order, you agree to our{" "}
                    <Link href="/terms" className="text-red-600 hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-red-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </CardContent>
              </Card>

              {/* Pickup Information */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800 mb-2">Pickup Information</h3>
                      <div className="space-y-1 text-sm text-green-700">
                        <p className="font-medium">{selectedLocation.name}</p>
                        <p>{selectedLocation.address}</p>
                        <p className="flex items-center space-x-1 mt-2">
                          <Clock className="h-4 w-4" />
                          <span>Ready: {pickupDetails.time}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { User, Package2, CreditCard, MapPin, Shield, Star, TrendingUp, Award, Calendar, Edit3, Camera, Settings, LogOut, Plus, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { AccountSkeleton } from "@/components/skeletons/account-skeleton"
import { AddressList } from "@/components/address-list"
import { PaymentMethodForm } from "@/components/payment-method-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { logoutFromAllDevices } from "@/lib/logoutAll"
import { Header } from "@/components/header"
// Enhanced interfaces
interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string
  totalSpent: number
  totalOrders: number
  loyaltyPoints: number
  lastOrderDate: string | null
  memberSince: string
  favoriteItems: string[]
}

interface Order {
  id: string
  orderNumber: string
  date: string
  status: string
  total: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  restaurant: {
    name: string
    image?: string
  }
}

interface LoyaltyPoint {
  id: string
  points: number
  type: "earn" | "redeem"
  description: string
  expiresAt: string | null
  createdAt: string
}

interface Address {
  id: string
  type: string
  isDefault: boolean
  streetAddress: string
  apartment?: string
  city: string
  state: string
  postalCode: string
  country: string
  label?: string
}

interface PaymentMethod {
  id: string
  type: string
  provider: string
  cardNumber: string
  expiryMonth: number
  expiryYear: number
  cardHolderName: string
  isDefault: boolean
  paymentMethodId: string
}

// Country codes for phone numbers
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  
]

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // User data state
  const [userData, setUserData] = useState<any>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([])
  const [currency, setCurrency] = useState<any>({ symbol: "$" })
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [otpEnabled, setOtpEnabled] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [deleteAddressLoading, setDeleteAddressLoading] = useState(false)   
  const [brandAssets, setBrandAssets] = useState<any>(null)
  // Load user data and related information

  const getSettings = async (key: string) => {
    const response = await fetch("/api/settings" , {
      method: "POST",
      body: JSON.stringify({key}),
    })
    const data = await response.json()
    return data
  }
  
  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
  
      const hash = location.hash.replace("#", "");
      if (hash) {
        setActiveTab(hash);
      }
  

    const loadAccountData = async () => {
      try {
        setIsLoading(true)

        // Load user profile using existing endpoint
        const userResponse = await fetch("/api/users/me")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserData(userData)
        }

        // Load customer data using existing endpoint
        if (session?.user?.id) {
          const customerResponse = await fetch(`/api/customers/by-user/${session.user.id}`)
          if (customerResponse.ok) {
            const customerData = await customerResponse.json()
            setCustomer(customerData)
            setRecentOrders(customerData)
          }

          // Load loyalty points using existing endpoint
          const loyaltyResponse = await fetch(`/api/loyalty/${session.user.id}`)
          if (loyaltyResponse.ok) {
            const loyaltyData = await loyaltyResponse.json()
            setLoyaltyPoints(loyaltyData)
          }

          const brandAssets = await getSettings("brand_assets")
          if (brandAssets) {
            const brandAssetsData = brandAssets
            setBrandAssets(JSON.parse(brandAssetsData.value))
          }

          // Load saved addresses using existing endpoint
          const addressesResponse = await fetch('/api/addresses')
          if (addressesResponse.ok) {
            const addressesData = await addressesResponse.json()
            setAddresses(addressesData)
          }

          // Load saved payment methods using existing endpoint
          fetchPaymentMethods();


          // Load OTP settings using existing endpoint
          const otpResponse = await fetch("/api/profile/otp")
          if (otpResponse.ok) {
            const otpData = await otpResponse.json()
            setOtpEnabled(otpData.otpEnabled)
          }
        }

        // Load currency settings using existing endpoint
        const currencyResponse = await getSettings("currency")
        if (currencyResponse) {
          const currencyData = currencyResponse
          const parsedCurrency = JSON.parse(currencyData.value)
          const defaultCurrency =
            Object.entries(parsedCurrency).find(([_, value]) => (value as any).default)?.[0] || "USD"
          setCurrency(parsedCurrency[defaultCurrency] || { symbol: "$" })
        }
      } catch (error) {
        console.error("Error loading account data:", error)
        toast.error("Failed to load account information")
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.id) {
      loadAccountData()
    }
  }, [session, status, router])

  const handleInputChange = (field: string, value: any) => {
    setUserData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle OTP toggle using existing endpoint
  const handleOtpToggle = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/profile/otp", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otpEnabled: enabled }),
      })
      
      if (!response.ok) throw new Error("Failed to update OTP settings")

      const data = await response.json()
      setOtpEnabled(data.otpEnabled)
      toast.success(`OTP has been ${enabled ? "enabled" : "disabled"}`)
    } catch (error) {
      console.error("Error updating OTP settings:", error)
      toast.error("Failed to update OTP settings")
      setOtpEnabled(!enabled)
    }
  }

  // Handle address operations using existing endpoints
  const removeAddress = async (id: string) => {
    setDeleteAddressLoading(true)
    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to remove address')
      }
      // Refresh the addresses list
      const addressesResponse = await fetch('/api/addresses')
      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json()
        setAddresses(addressesData)
      }
      toast.success('Address removed')
    } catch (error) {
      console.error('Error removing address:', error)
      toast.error('Failed to remove address')
    } finally {
      setDeleteAddressLoading(false)
    }
  }

  // Handle payment method operations using existing endpoints
  const setDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isDefault: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to set default payment method')
      }

      // Refresh the payment methods list
      const paymentMethodsResponse = await fetch('/api/payment-methods', {
        credentials: 'include'
      })
      if (paymentMethodsResponse.ok) {
        const paymentMethodsData = await paymentMethodsResponse.json()
        setPaymentMethods(paymentMethodsData)
      }
      toast.success('Default payment method updated')
    } catch (error) {
      console.error('Error setting default payment method:', error)
      toast.error('Failed to update payment method')
    }
  }

  const removePaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to remove payment method')
      }

      // Refresh the payment methods list
      const paymentMethodsResponse = await fetch('/api/payment-methods', {
        credentials: 'include'
      })
      if (paymentMethodsResponse.ok) {
        const paymentMethodsData = await paymentMethodsResponse.json()
        setPaymentMethods(paymentMethodsData)
      }
      toast.success('Payment method removed')
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  // console.log("userData", userData)

  // Handle profile update using existing endpoint
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phoneNumber,
          phoneCountryCode: userData.phoneCountryCode,
          profileImage: userData.profileImage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
        
      }

      toast.success("Profile updated successfully")
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle file upload using existing endpoint
  const updateUserData = async (url: string) => {
    try {
      const user = await fetch(`/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImage: url }),
      })
      const data = await user.json()
      setUserData(data)
    } catch (error) {
      console.error('Error updating user data:', error)
    }
  }

  // Handle file input click
  const handleFileInputClick = () => {

    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("file", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      })

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          setUserData((prev: any) => ({
            ...prev,
            profileImage: data.url,
          }))
          toast.success("Profile picture uploaded successfully")
          await updateUserData(data.url)
        } else {
          throw new Error("Failed to upload image")
        }
      }

      xhr.onerror = () => {
        throw new Error("Failed to upload image")
      }

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${Number(amount).toFixed(2)}`
  }
  
    // Fetch payment methods
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/payment-methods', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch payment methods');
        }
        const data = await response.json();
        setPaymentMethods(data);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setIsLoading(false);
      }
    };


    const handlePaymentMethodSuccess = () => {
      setShowPaymentForm(false);
      fetchPaymentMethods(); // Refresh the list after adding/updating
    };




  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "ready":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleNotificationChange = (key: string) => {
    setUserData((prev: any) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications?.[key]
      }
    }))
  }

  if (status === "loading" || isLoading) {
    return <AccountSkeleton />
  }

  if (!session?.user?.id || !userData) {
    return <AccountSkeleton />
  }

  const cardColor = (cardNumber: string | number): string => {
    const card = String(cardNumber);
  
    if (card.startsWith("4")) {
      return "bg-blue-100 text-blue-800"; // Visa
    }
    if (card.startsWith("51") || card.startsWith("52") || card.startsWith("53") || card.startsWith("54") || card.startsWith("55")) {
      return "bg-red-100 text-red-800"; // MasterCard
    }
    if (card.startsWith("34") || card.startsWith("37")) {
      return "bg-green-100 text-green-800"; // American Express (Amex)
    }
    if (card.startsWith("6011") || card.startsWith("65") || /^64[4-9]/.test(card)) {
      return "bg-yellow-100 text-yellow-800"; // Discover
    }
    if (/^35(2[89]|[3-8][0-9])/.test(card)) {
      return "bg-purple-100 text-purple-800"; // JCB
    }
    if (/^30[0-5]|^36|^38/.test(card)) {
      return "bg-pink-100 text-pink-800"; // Diners Club
    }
    if (card.startsWith("62")) {
      return "bg-indigo-100 text-indigo-800"; // UnionPay
    }
    if (card.startsWith("50") || card.startsWith("56") || card.startsWith("57") || card.startsWith("58")) {
      return "bg-teal-100 text-teal-800"; // Maestro
    }
  
    return "bg-gray-100 text-gray-800"; // Default/Unknown
  };
  

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30">
      {/* Enhanced Header */}
      <Header 
        brandAssets={brandAssets || null}
       />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-red-50/50 sticky top-4">
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={userData?.profileImage || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-2xl">
                        {userData?.firstName?.[0] || ""}
                        {userData?.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={handleFileInputClick}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                    >
                      <Camera className="h-3 w-3" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mt-3">
                    {userData?.firstName || ""} {userData?.lastName || ""}
                  </h2>
                  <p className="text-sm text-gray-500">{userData?.email || ""}</p>

                  {customer && (
                    <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span className="text-gray-600">{customer.loyaltyPoints} pts</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package2 className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-600">{customer.totalOrders} orders</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-6">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center text-gray-500 mt-2">Uploading... {Math.round(uploadProgress)}%</p>
                  </div>
                )}

                {/* Navigation */}
                <nav className="space-y-2">
                  {[
                    { id: "profile", label: "My Profile", icon: User },
                    { id: "orders", label: "Order History", icon: Package2 },
                    { id: "payment", label: "Payment Methods", icon: CreditCard },
                    { id: "addresses", label: "Saved Addresses", icon: MapPin },
                    { id: "preferences", label: "Privacy & Security", icon: Shield },
                  ].map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={`w-full justify-start text-left h-11 ${
                        activeTab === item.id
                          ? "bg-red-100 text-red-700 border-r-2 border-red-500"
                          : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                      }`}
                      onClick={() => {
                        window.location.hash = item.id 
                        setActiveTab(item.id)
                      }}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  ))}
                </nav>

                <Separator className="my-6" />

                <Button
                  variant="outline"
                  className="w-full justify-center text-gray-700 hover:text-red-600 hover:border-red-300"
                  onClick={() => logoutFromAllDevices()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                  <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
                </div>

                {/* Customer Stats */}
                {customer && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Package2 className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{customer.totalOrders}</p>
                        <p className="text-sm text-blue-600">Total Orders</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(customer.totalSpent)}</p>
                        <p className="text-sm text-green-600">Total Spent</p>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{customer.loyaltyPoints}</p>
                        <p className="text-sm text-yellow-600">Loyalty Points</p>
                      </CardContent>
                    </Card>

  
                  </div>
                )}

                {/* Personal Information */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-red-600" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={userData?.firstName || ""}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          className="h-11 border-gray-300 focus:border-red-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={userData?.lastName || ""}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          className="h-11 border-gray-300 focus:border-red-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData?.email || ""}
                        disabled
                        className="h-11 bg-gray-100 border-gray-300"
                      />
                      <p className="text-xs text-gray-500">Email cannot be changed for security reasons</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <div className="flex gap-3">
                        <Select
                          value={userData?.phoneCountryCode || "+1"}
                          onValueChange={(value) => handleInputChange("phoneCountryCode", value)}
                        >
                          <SelectTrigger className="w-[120px] h-11">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                <div className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.code}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          value={userData?.phoneNumber || ""}
                          onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                          placeholder="Phone number"
                          className="flex-1 h-11 border-gray-300 focus:border-red-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 h-11"
                      >
                        {isSaving ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Edit3 className="h-4 w-4" />
                            <span>Save Changes</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                  <p className="text-gray-600 mt-1">Track your past orders and reorder your favorites</p>
                </div>

                {/* Loyalty Points Summary */}
                <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Award className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Loyalty Points</h3>
                          <p className="text-sm text-gray-600">Earn points with every order</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-orange-600">{customer?.loyaltyPoints || 0}</p>
                        <p className="text-sm text-gray-600">Available Points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <Package2 className="h-5 w-5 text-red-600" />
                      <span>Recent Orders</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-500 mb-6">Start exploring our delicious menu options</p>
                        <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                          Browse Menu
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentOrders.orderHistory.map((order) => (
                          <div
                            key={order.id}
                            className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                  <Package2 className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Order #{order.orderNumber}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {new Date(order.date).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                                <Badge className={`mt-1 ${getStatusColor(order.status)}`}>{order.status}</Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {(typeof order.items === 'string' ? JSON.parse(order.items || "[]") : order.items || []).map((item: any, index: number) => (
                                
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    {item}
                                  </span>
                                  {/* <span className="font-medium">{formatCurrency(item.price)}</span> */}
                                  {/* <span className="font-medium">{item.quantity}</span> */}
                                </div>
                              ))}
                            </div>

                             <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                              <div></div>
                              {/* <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                View Details
                              </Button> */}
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                                onClick={() => router.push(`/order-confirmation?orderId=${order.id}`)}
                              >
                                View Details
                              </Button>
                            </div> 
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === "payment" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
                  <p className="text-gray-600 mt-1">Manage your saved payment methods for faster checkout</p>
                </div>

                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-red-600" />
                      <span>Saved Cards</span>
                    </CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
            <p className="text-gray-500 mb-6">Add a payment method to make checkout faster</p>
            <Button 
              onClick={() => setShowPaymentForm(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{method.cardHolderName}</h4>
                      <p className="text-sm text-gray-600">•••• •••• •••• {method.cardNumber.slice(-4)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {method.isDefault && (
                      <Badge className="bg-green-100 text-green-800">Default</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultPaymentMethod(method.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePaymentMethod(method.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Payment Method
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Payment Method</DialogTitle>
                      <DialogDescription>
                        Add a new credit or debit card to your account.
                      </DialogDescription>
                    </DialogHeader>
                    <PaymentMethodForm
                      onSuccess={handlePaymentMethodSuccess}
                      onCancel={() => setShowPaymentForm(false)}
                    />
                  </DialogContent>
                </Dialog>
            
  </div>
)}

{/* Addresses Tab */}
{activeTab === "addresses" && (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
      <p className="text-gray-600 mt-1">Manage your delivery addresses</p>
    </div>

    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        {/* <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-red-600" />
          <span>Your Addresses</span>
        </CardTitle> */}
      </CardHeader>
      <CardContent>
      <AddressList />
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
            <p className="text-gray-500 mb-6">Add an address for faster delivery ordering</p>
            <Button 
              onClick={() => setShowAddressForm(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              Add New Address 
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {address.label || address.type}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.streetAddress}
                        {address.apartment && `, ${address.apartment}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {address.isDefault && (
                      <Badge className="bg-green-100 text-green-800">Default</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => removeAddress(address.id)}
                    variant="outline"
                    size="sm"
                    disabled={deleteAddressLoading}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {deleteAddressLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              onClick={() => setShowAddressForm(true)}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-12"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Address
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
)}

{/* Preferences Tab */}
{activeTab === "preferences" && (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Privacy & Security</h2>
      <p className="text-gray-600 mt-1">Manage your account security and privacy settings</p>
    </div>

    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span>Security Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Two-Factor Authentication (OTP)</h4>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <Switch 
            className="data-[state=checked]:bg-red-500" 
            checked={otpEnabled}
            onCheckedChange={handleOtpToggle}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-600">Receive updates about your orders</p>
          </div>
          <Switch 
            className="data-[state=checked]:bg-red-500" 
            checked={userData?.notifications?.orderUpdates || false}
            onCheckedChange={() => handleNotificationChange('orderUpdates')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">SMS Notifications</h4>
            <p className="text-sm text-gray-600">Get text updates about order status</p>
          </div>
          <Switch 
            className="data-[state=checked]:bg-red-500" 
            checked={userData?.notifications?.smsUpdates || false}
            onCheckedChange={() => handleNotificationChange('smsUpdates')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Marketing Communications</h4>
            <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
          </div>
          <Switch 
            className="data-[state=checked]:bg-red-500" 
            checked={userData?.notifications?.marketing || false}
            onCheckedChange={() => handleNotificationChange('marketing')}
          />
        </div>
      </CardContent>
    </Card>

    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            placeholder="Enter your current password"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" type="password" placeholder="Enter your new password" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            className="h-11"
          />
        </div>
        <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
          Update Password
        </Button>
      </CardContent>
    </Card>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  )
}

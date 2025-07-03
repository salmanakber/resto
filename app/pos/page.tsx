"use client"

import React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Customer } from "./types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  PlusCircle,
  Settings2,
  Minus,
  Plus,
  ChevronLeft,
  Maximize,
  Minimize,
  Loader2,
  X,
  ArrowLeft,
  ArrowRight,
  HandPlatter,
  UserX,
  ShoppingBag,
  Home,
  Filter,
  Sun,
  Moon,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  BarChart3,
  Users,
  FileText,
  RefreshCw,
  Table,
  Check,
  RefreshCcw,
  Receipt,
  Search,
} from "lucide-react"
import { startOfDay, endOfDay } from "date-fns"

// Move interfaces to separate file for better organization
import type { MenuItem, OrderItem, OrderDisplay, CustomizeOrderProps } from "../../types/pos-types"

// Move constants to separate file
import { printStyles } from "../../constants/print-styles"

// Custom hooks for better organization
import { useSocket } from "../../hooks/useSocket"
import { useSettings } from "../../hooks/useSettings"
import { useCustomers } from "../../hooks/useCustomers"
import { useOrders } from "../../hooks/useOrders"
import { useMenuItems } from "../../hooks/useMenuItems"

// Import the missing components
import NewCustomerForm from "./components/NewCustomerForm"
import { AllDayView } from "./components/AllDayView"
import { TodayCustomers } from "./components/TodayCustomers"
import { Reports } from "./components/Reports"
import { Order } from "./components/Order"
import OrderReceipt from "./components/reciept"
import {POSCart} from "./components/pos-cart"
import { CustomerSearch } from "./components/customer-search"
import { CustomerSkeleton, TableSkeleton } from "@/components/Skeletons"

// Memoized components for better performance
const CustomizeOrder = React.memo<CustomizeOrderProps>(({ menuItem, onSave, onCancel, formatCurrency }) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<
    Array<{
      addon: {
        id: string
        name: string
        price: number
      }
      quantity: number
    }>
  >([])
  const [specialInstructions, setSpecialInstructions] = useState("")

  const handleSave = useCallback(() => {
    onSave({
      menuItem,
      quantity,
      isFree: false,
      selectedAddons,
      specialInstructions,
    })
  }, [menuItem, quantity, selectedAddons, specialInstructions, onSave])

  const totalPrice = useMemo(() => {
    return (
      menuItem.price * quantity +
      selectedAddons.reduce((sum, addon) => sum + addon.addon.price * addon.quantity, 0) * quantity
    )
  }, [menuItem.price, quantity, selectedAddons])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{menuItem.name}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Minus size={20} />
            </button>
            <span className="text-lg font-medium">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="p-2 rounded-full hover:bg-gray-100">
              <Plus size={20} />
            </button>
          </div>
        </div>

        {menuItem.services && menuItem.services.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
            <div className="space-y-2">
              {menuItem.services.map((service) => (
                <div key={service.service.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={service.service.id}
                      checked={selectedAddons.some((a) => a.addon.id === service.service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAddons([...selectedAddons, { addon: service.service, quantity: 1 }])
                        } else {
                          setSelectedAddons(selectedAddons.filter((a) => a.addon.id !== service.service.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={service.service.id} className="text-sm">
                      {service.service.name} ({formatCurrency(service.service.price)})
                    </label>
                  </div>
                  {selectedAddons.some((a) => a.addon.id === service.service.id) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAddons(
                            selectedAddons.map((a) =>
                              a.addon.id === service.service.id ? { ...a, quantity: Math.max(1, a.quantity - 1) } : a,
                            ),
                          )
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-sm">
                        {selectedAddons.find((a) => a.addon.id === service.service.id)?.quantity || 1}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedAddons(
                            selectedAddons.map((a) =>
                              a.addon.id === service.service.id ? { ...a, quantity: a.quantity + 1 } : a,
                            ),
                          )
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Add any special instructions..."
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-sm text-gray-500">Total:</span>
            <span className="text-lg font-bold ml-2">{formatCurrency(totalPrice)}</span>
          </div>
          <button onClick={handleSave} className="bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700">
            Add to Order
          </button>
        </div>
      </div>
    </div>
  )
})

export default function POSPage() {
  const router = useRouter()

  // UI State
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOrderSlip, setShowOrderSlip] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [orderTimestamp, setOrderTimestamp] = useState<string>("")

  // Order State
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orderType, setOrderType] = useState<"dine-in" | "pickup" | "delivery">("dine-in")
  const [selectedTable, setSelectedTable] = useState<any | null>(null)
  const [discountPercentage, setDiscountPercentage] = useState<{ amount: number; type: string; points?: number }>({
    amount: 0,
    type: "flat",
    points: 0,
  })
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  // Modal State
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [showAvailableTable, setShowAvailableTable] = useState(false)
  const [showAllDayView, setShowAllDayView] = useState(false)
  const [showTodayCustomers, setShowTodayCustomers] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [showOrders, setShowOrders] = useState(false)

  // Loading States
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false)
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isCustomerSaving, setIsCustomerSaving] = useState(false)
  const [isLoadingAll, setIsLoadingAll] = useState(true)

  // Order Pagination
  const [currentOrderPage, setCurrentOrderPage] = useState(0)
  const [isSliding, setIsSliding] = useState(false)
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null)
  const ordersPerPage = 4

  // Custom hooks for data management
  const { userData, kitchenCookSocket, kitchenAdminSocket } = useSocket()
  const { taxSettings, currency, restaurantSettings, loyaltySettings, isSettingsLoading } = useSettings()
  const { allCustomers, userLoyaltyPoints, fetchAllCustomers, findCustomerByPhone, isCustomersLoading } = useCustomers(loyaltySettings)
  const { recentOrders, availableTables, fetchDailyStats, fetchAvailableTables, dailyStats: globalDailyStats} =
    useOrders()
  const { menuItems, categories, isLoading: isMenuLoading } = useMenuItems(selectedCategory, searchQuery)
  const [localDailyStats, setDailyStats] = useState<any>(null);
  const dailyStats = localDailyStats ?? globalDailyStats;
  const [placingOrder, setPlacingOrder] = useState(false)

  const itemsPerPageRecentOrder = 4
  const [currentPage, setCurrentPage] = useState(0)






  // Memoized calculations
  const calculateTax = useCallback(
    (amount: string | number) => {
      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      if (!taxSettings) {
        return {
          gst: 0,
          pst: 0,
          hst: 0,
          totalTax: 0,
          totalAmount: numAmount,
        }
      }

      const gst = taxSettings?.gst.enabled ? numAmount * (taxSettings.gst.taxRate / 100) : 0
      const pst = taxSettings?.pst.enabled ? numAmount * (taxSettings.pst.taxRate / 100) : 0
      const hst = taxSettings?.hst.enabled ? numAmount * (taxSettings.hst.taxRate / 100) : 0
      const totalTax = gst + pst + hst
      const totalAmount = numAmount + totalTax

      return {
        gst: {
          amount: gst,
          rate: taxSettings.gst.taxRate,
          enabled: taxSettings.gst.enabled,
        },
        pst: {
          amount: pst,
          rate: taxSettings.pst.taxRate,
          enabled: taxSettings.pst.enabled,
        },
        hst: {
          amount: hst,
          rate: taxSettings.hst.taxRate,
          enabled: taxSettings.hst.enabled,
        },
        totalTax: {
          amount: totalTax,
        },
        totalAmount,
      }
    },
    [taxSettings],
  )

  

  const calculateTotal = useMemo(() => {
    if (orderItems.length === 0) {
      return {
        subtotal: "0.00",
        tax: "0.00",
        discount: "0.00",
        total: "0.00",
        totalTax: "0.00",
        totalAmount: "0.00",
      }
    }

    const subtotal = orderItems.reduce((sum, item) => {
      
      const itemTotal = item.menuItem.price * item.quantity
      const addonsTotal =
        (item.selectedAddons || []).reduce(
          (addonSum: number, addon) => addonSum + addon.addon.price * addon.quantity,
          0,
        ) * item.quantity
        if(item.isFree) return sum
      return sum + itemTotal + addonsTotal
    }, 0)

    const tax = calculateTax(subtotal)
    const discount = discountPercentage?.type === "flat"
  ? subtotal * (discountPercentage.amount / 100)
  : discountPercentage?.type === "loyalty"
  ? discountPercentage.amount
  : 0;

    const total = subtotal + (typeof tax.totalTax === "object" ? tax.totalTax.amount : tax.totalTax) - discount

    return {
      subtotal: subtotal && Number(subtotal) !== 0.0 ? subtotal.toFixed(2) : "0.00",
      tax: (typeof tax.totalTax === "object" ? tax.totalTax.amount : tax.totalTax).toFixed(2),
      discount: discount && Number(discount) !== 0.0 ? discount.toFixed(2) : "0.00",
      total: total && Number(total) !== 0.0 ? total.toFixed(2) : "0.00",
      totalTax: (typeof tax.totalTax === "object" ? tax.totalTax.amount : tax.totalTax).toFixed(2),
      totalAmount: total && Number(total) !== 0.0 ? total.toFixed(2) : "0.00",
    }
  }, [orderItems, calculateTax, discountPercentage])

  const formatCurrency = useCallback(
    (amount: string | number) => {
      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      let selectedCurrency
      if (currency) {
        selectedCurrency = currency
      } else {
        selectedCurrency = {
          symbol: "$",
        }
      }
      if (Number(numAmount) === 0.0) return selectedCurrency.symbol + "0.00"
      const currencySymbol = selectedCurrency.symbol || "$"
      return numAmount && Number(numAmount) !== 0.0
        ? `${currencySymbol}${Number(numAmount).toFixed(2)}`
        : `${currencySymbol}0.00`
    },
    [currency],
  )

  // Optimized event handlers
  const handlePhoneSearch = useCallback(
    async (phone: string) => {
      setSearchPhone(phone)
      if (phone.length >= 3) {
        const filtered = allCustomers.filter(
          (customer) =>
            customer.phoneNumber.includes(phone) ||
            `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(phone.toLowerCase()),
        )
        setFilteredCustomers(filtered)
        setShowSuggestions(true)
      } else {
        setShowSuggestions(false)
      }
    },
    [allCustomers],
  )

  const handleCustomerSelect = useCallback(async (customer: Customer) => {
    setCustomer(customer)
    setSearchPhone(customer.phoneNumber)
    // const customerData = await findCustomerByPhone(customer.phoneNumber)
    
    setShowSuggestions(false)
    setShowNewCustomerForm(false)
  }, [])

  const handleAddToOrder = useCallback((item: MenuItem) => {
    setSelectedItem(item)
  }, [])

  const handleDirectAdd = useCallback((item: MenuItem) => {
    setOrderItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        menuItem: item,
        quantity: 1,
        isFree: false,
        selectedAddons: [],
      },
    ])
  }, [])

  const handleCustomizationSave = useCallback((orderItem: Omit<OrderItem, "id">) => {
    setOrderItems((prev) => [
      ...prev,
      {
        ...orderItem,
        id: Math.random().toString(36).substr(2, 9),
        selectedAddons: orderItem.selectedAddons || [],
      },
    ])
    setSelectedItem(null)
  }, [])

  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems((prev) => {
      // Step 1: Find the item being removed
      const removedItem = prev.find((item) => item.id === itemId);
  
      // Step 2: Remove the item from list
      const updatedItems = prev.filter((item) => item.id !== itemId);
  
      // Step 3: If the removed item was free, recalculate discount
      if (removedItem?.isFree) {
        const totalFreeAmount = updatedItems.reduce((sum, item) => {
          if (item.isFree) {
            const itemTotal =
              item.menuItem.price +
              (item.selectedAddons || []).reduce(
                (addonSum, addon) => addonSum + addon.addon.price,
                0
              );
            return sum + itemTotal;
          }
          return sum;
        }, 0);
  
        if (totalFreeAmount === 0) {
          setDiscountPercentage({
            amount: 0,
            type: "flat",
            points: 0,
          }); // Clear if nothing free left
        } else {
          setDiscountPercentage({
            amount: totalFreeAmount,
            type: "free",
            points: 0,
          });
        }
      }
  
      return updatedItems;
    });
  }, []);
  

  const handleToggleFreeItem = useCallback((itemId: string) => {
    setOrderItems((prev) => {
      // Step 1: First, simulate the toggle
      const updatedItems = prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, isFree: !item.isFree };
        }
        return item;
      });
  
      // Step 2: Count free items after toggle
      const freeItems = updatedItems.filter((item) => item.isFree);
      const nonFreeItems = updatedItems.filter((item) => !item.isFree);
  
      // Step 3: Check constraint — at least 1 item must NOT be free
      if (nonFreeItems.length === 0) {
        // ❌ Prevent this toggle — return original state
        return prev;
      }
  
      // Step 4: Sum total of free items
      const totalFreeAmount = freeItems.reduce((sum, item) => {
        const itemTotal =
          item.menuItem.price +
          (item.selectedAddons || []).reduce(
            (addonSum, addon) => addonSum + addon.addon.price,
            0
          );
        return sum + itemTotal;
      }, 0);
  
      // Step 5: Set or clear discount
      if (totalFreeAmount === 0) {
        setDiscountPercentage({ 
          amount: 0,
          type: "flat",
          points: 0,
        }
        ); // Clear discount
      } else {
        setDiscountPercentage({
          amount: totalFreeAmount,
          type: "free",
          points: 0,
        });
      }
  
      return updatedItems;
    });
  }, []);
  
    const handleRefreshTables = async () => {
     await fetchAvailableTables()
    }
  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoadingAll(true)
      try {
        await Promise.all([fetchDailyStats(), fetchAvailableTables(), fetchAllCustomers() ])
      } catch (error) {
        console.error("Error initializing data:", error)
      } finally {
        setIsLoadingAll(false)
      }
    }

    initializeData()
  }, [])

  const playAudio = () => {
    const audio = new Audio("/new-order-updated.mp3")
    audio.play()
  }


  // Socket notification handler
  useEffect(() => {
    if (!userData?.restaurantId) return

    const handleNotification = (data: any, restaurantId: string) => {
      const currentRestaurantId = userData?.restaurantId
      if (restaurantId === currentRestaurantId) {
        // setIsLoadingAll(true)
        Promise.all([fetchDailyStats(), fetchAvailableTables()]).finally(() => {
          // setIsLoadingAll(false)
          playAudio()
        })
        toast.success(data.message)
      }
    }

    kitchenAdminSocket.current?.on("cookOrderUpdate", handleNotification)

    return () => {
      kitchenCookSocket.current?.off("cookOrderUpdate", handleNotification)
    }
  }, [userData?.restaurantId, fetchDailyStats, fetchAvailableTables])

  // Time update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Order pagination logic
  const allOrders: OrderDisplay[] = [
    { id: 16, status: "ready", color: "red", items: 2 },
    { id: 17, status: "in-kitchen", color: "blue", items: 3 },
    { id: 18, status: "in-kitchen", color: "yellow", items: 1 },
    { id: 19, status: "in-kitchen", color: "yellow", items: 4 },
    { id: 20, status: "ready", color: "green", items: 2 },
    { id: 21, status: "in-kitchen", color: "blue", items: 3 },
    { id: 22, status: "ready", color: "red", items: 1 },
    { id: 23, status: "in-kitchen", color: "yellow", items: 2 },
  ]

  const totalPages = Math.ceil(allOrders.length / ordersPerPage)

  const getCurrentOrders = useCallback(
    (page: number) => {
      const normalizedPage = ((page % totalPages) + totalPages) % totalPages
      return allOrders.slice(normalizedPage * ordersPerPage, (normalizedPage + 1) * ordersPerPage)
    },
    [allOrders, totalPages, ordersPerPage],
  )

  const currentOrders = useMemo(() => getCurrentOrders(currentOrderPage), [getCurrentOrders, currentOrderPage])
  const nextOrders = useMemo(() => getCurrentOrders(currentOrderPage + 1), [getCurrentOrders, currentOrderPage])
  const prevOrders = useMemo(() => getCurrentOrders(currentOrderPage - 1), [getCurrentOrders, currentOrderPage])

  const handlePrevPage = useCallback(() => {
    if (isSliding) return
    setSlideDirection("right")
    setIsSliding(true)
    setTimeout(() => {
      setCurrentOrderPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))
      setIsSliding(false)
      setSlideDirection(null)
    }, 300)
  }, [isSliding, totalPages])

  const handleNextPage = useCallback(() => {
    if (isSliding) return
    setSlideDirection("left")
    setIsSliding(true)
    setTimeout(() => {
      setCurrentOrderPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))
      setIsSliding(false)
      setSlideDirection(null)
    }, 300)
  }, [isSliding, totalPages])

  // Payment handler
  
  const handlePayment = useCallback(async () => {
    if (orderType === "dine-in" && !selectedTable) {
      toast.error("Please select a table first")
      return
    }
    if (!customer) {
      toast.error("Please select a customer first")
      return
    }

    try {
      setPlacingOrder(true)
      const orderTime = new Date()
      const orderNum = Date.now().toString().slice(-4)
      const pointsToEarn = Math.floor(Number.parseFloat(calculateTotal.subtotal) * (loyaltySettings?.earnRate || 0))

      const orderData = {
        customerId: customer.userId,
        items: orderItems.map((item) => ({
          menuItemId: item.menuItem.id,
          name: item.menuItem.name,
          quantity: item.quantity,
          price: item.menuItem.price,
          isFree: item.isFree,
          selectedAddons:
            item.selectedAddons?.map((addon) => ({
              id: addon.addon.id,
              quantity: addon.quantity,
              price: addon.addon.price,
              name: addon.addon.name,
            })) || [],
          notes: item.specialInstructions,
        })),
        status: "preparing",

        type: orderType,
        tableId: orderType === "dine-in" ? selectedTable?.id : null,
        subtotal: Number.parseFloat(calculateTotal.subtotal),
        tax: Number.parseFloat(calculateTotal.tax),
        discount: Number.parseFloat(calculateTotal.discount),
        total: Number.parseFloat(calculateTotal.total),
        discountPercentage: JSON.stringify(discountPercentage),
        orderDate: orderTime,
        loyaltyPoints: {
          points: pointsToEarn,
          type: "earn",
        },
      }
      const response = await fetch("/api/pos/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        toast.error("Failed to create order")
        throw new Error("Failed to create order")
      }

      const order = await response.json()
      setOrderNumber(order)
      setOrderTimestamp(orderTime.toLocaleString())
      setOrderComplete(true)
      setShowOrderSlip(true)


      kitchenAdminSocket.current?.emit("adminNotification", { message: "New Order Placed" , restaurantId: userData?.restaurantId})
      // kitchenCookSocket.current?.emit("cookOrderUpdate", { message: "New Order Placed" , restaurantId: userData?.restaurantId})


      setSearchPhone("")
      setOrderType(orderType)
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order. Please try again.")
    } finally {
      setPlacingOrder(false)
    }
  }, [
    orderType,
    selectedTable,
    customer,
    orderItems,
    calculateTotal,
    loyaltySettings,
    userData,
    kitchenAdminSocket,
    kitchenCookSocket,
    setPlacingOrder, 
  ])

  // Utility functions
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }, [])

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }, [])

  const handleOrderSlipClose = useCallback(() => {
    setShowOrderSlip(false)
    setOrderComplete(false)
    setOrderNumber("")
    setOrderItems([])
    setOrderTimestamp("")
  }, [])

  // Render functions
  const renderMenuItems = useMemo(() => {
    if (isMenuLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading items...</p>
        </div>
      </div>
      )
    }

    // if (menuItems.length === 0) {
    //   return (
    //     <div className="text-center py-8 absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-white">
    //       <p className="text-gray-500 pt-10">Add menu items to get started</p>
    //       <button
    //         className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors justify-center items-center flex gap-2 mx-auto mt-3"
    //         onClick={() => router.push("/restaurant/menu-items")}
    //       >
    //         <PlusCircle className="w-5 h-5" />
    //         <span className="text-sm">Add Menu Item</span>
    //       </button>
    //     </div>
    //   )
    // }
    return (
      <div className="grid grid-cols-5 gap-4 pb-20 relative">
        {menuItems.length === 0 ? (
          <div className="text-center py-8 absolute top-0 left-0 right-0 bottom-0 w-full h-full bg-wite">
            <p className="text-gray-500 pt-10">Add menu items to get started</p>
            <button
              className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors justify-center items-center flex gap-2 mx-auto mt-3"
              onClick={() => router.push("/restaurant/menu-items")}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="text-sm">Add Menu Item</span>
            </button>
          </div>
        ) : (
          menuItems.map((item) => (
            <div
              key={item.id}
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow group`}
            >
              <div className="relative">
                <img
                  src={
                    item.image ||
                    `/images/menu/${item.category?.toLowerCase() || "default"}-default.jpg`
                  }
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectAdd(item);
                    }}
                    className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    title="Add to order"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToOrder(item);
                    }}
                    className="p-2 bg-rose-400 text-white rounded-lg hover:bg-rose-500 transition-colors"
                    title="Customize"
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {item.name}
                    </h3>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"} mt-1`}>
                      {currency?.symbol}
                      {item.price?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
    
  }, [isMenuLoading, menuItems, isDarkMode, currency, router, handleDirectAdd, handleAddToOrder])

  const handleNewCustomer = useCallback(async (customer: Partial<Customer>) => {
    try {
      setIsCustomerSaving(true)
      const response = await fetch("/api/pos/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customer),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer")
      }

      const newCustomer = await response.json()
      setCustomer(newCustomer.customer)
      
      setShowNewCustomerForm(false)
      toast.success("Customer created successfully")
    } catch (error) {
      console.error("Error creating customer:", error)
      toast.error("Failed to create customer")
    } finally {
      setIsCustomerSaving(false)
    }
  }, [])

  const handleDateChange = useCallback(async (date: Date) => {
    try {
      const response = await fetch(
        `/api/pos/stats?start=${startOfDay(date).toISOString()}&end=${endOfDay(date).toISOString()}`,
      )
      const data = await response.json()
      console.log(data, 'data')
      setDailyStats(data)
    } catch (error) {
      console.error("Error fetching daily stats:", error)
    }
  }, [])
  

  const handleDateChangeOrder = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch(
        `/api/pos/stats?start=${startOfDay(startDate).toISOString()}&end=${endOfDay(endDate).toISOString()}`,
      )
      const data = await response.json()
      setDailyStats(data)
    } catch (error) {
      console.error("Error fetching daily stats:", error)
    }
  }, [])

  const handleDateChangeReports = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const response = await fetch(
        `/api/pos/stats?start=${startOfDay(startDate).toISOString()}&end=${endOfDay(endDate).toISOString()}`,
      )
      const data = await response.json()
      setDailyStats(data)
    } catch (error) {
      console.error("Error fetching daily stats:", error)
    }
  }, [])

  const handleOrderUpdate = useCallback(async (orderId: string, status: any) => {
    try {
      const response = await fetch(`/api/pos/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status: status }),
      })
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
        return
      }
      toast.success("Order status updated successfully")
    } catch (error) {
      console.error("Error updating order:", error)
    }
  }, [])

  const handlePrintReceipt = useCallback(
    (order: Order) => {
      const receiptHTML = OrderReceipt({
        order,
        currency,
        company: restaurantSettings,
        taxSettings,
      })

      const printFrame = document.createElement("iframe")
      printFrame.style.display = "none"
      document.body.appendChild(printFrame)

      const printDoc = printFrame.contentWindow?.document
      if (printDoc) {
        printDoc.write(receiptHTML)
        printDoc.close()

        printFrame.contentWindow?.print()

        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 4000)
      }
    },
    [currency, restaurantSettings, taxSettings],
  )



  const totalPagesRecentOrder = Math.ceil(recentOrders.length / itemsPerPageRecentOrder)

  const handleNextPageRecentOrder = () => {
    if (currentPage < totalPagesRecentOrder - 1) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevPageRecentOrder = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
    }
  }


  if (isLoadingAll || isSettingsLoading) {
    return (
   

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-white">
<div className="text-center">
  <div className="w-16 h-16 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
    <Loader2 className="w-8 h-8 text-white animate-spin" />
  </div>
  <p className="text-gray-600 font-medium">Loading POS System...</p>
  <p className="text-gray-400 text-sm mt-1">Please wait while we set everything up</p>
</div>
</div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <style>{printStyles}</style>

      {/* Top Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 ${
          isDarkMode ? "bg-gray-800 text-white border-b border-gray-700" : "bg-white"
        } shadow-md px-6 py-2 flex justify-between items-center`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            } rounded-lg px-3 py-1.5 transition-colors`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-2 ${
              isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            } rounded-lg px-3 py-1.5 transition-colors`}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-[#e11d48] text-white">
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
          <span className={`font-bold text-2xl ${isDarkMode ? "text-white" : "text-gray-900"}`}>OPENPHO</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-rose-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <p className="font-medium text-sm">{formatDate(currentDateTime)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <p className="font-mono text-sm font-medium">{formatTime(currentDateTime)}</p>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-lg ${
              isDarkMode
                ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } transition-colors`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex h-screen pt-12">
        {/* Main Content Area (75%) */}
        <div className={`w-[75%] p-8 overflow-y-auto relative ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          {/* Order List */}
          <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order List</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrevPageRecentOrder}
            disabled={currentPage === 0}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                : "bg-white hover:bg-gray-50 text-gray-700"
            } shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextPageRecentOrder}
            disabled={currentPage === totalPagesRecentOrder - 1}
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700 text-gray-200"
                : "bg-white hover:bg-gray-50 text-gray-700"
            } shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden pb-2">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentPage * 100}%)`, width: `100%` }}
        >
          {Array.from({ length: totalPagesRecentOrder }).map((_, pageIndex) => (
            <div key={pageIndex} className="grid grid-cols-4 gap-4 w-full shrink-0 px-1">
              {recentOrders
                .slice(pageIndex * itemsPerPageRecentOrder, pageIndex * itemsPerPageRecentOrder + itemsPerPageRecentOrder)
                .map((order) => (
                  <div
                    key={order.id}
                    className={`${
                      isDarkMode ? "bg-gray-800" : "bg-white"
                    } rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md`}
                  >
                    <div
                      className={`h-12 rounded-xl flex items-center justify-center text-white mb-3 ${
                        order.status === "ready"
                          ? "bg-green-500"
                          : order.status === "preparing"
                          ? "bg-yellow-500" : order.status === "completed" ? "bg-blue-500" : "bg-blue-500"
                      }`}
                    >
                      {order.type === "dine-in"
                        ? `Table #${order.tableNumber}`
                        : order.type === "pickup"
                        ? "Take away"
                        : ""}
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {order.items} items
                    </div>
                    <div className="flex items-center mt-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          order.status === "ready"
                            ? "bg-green-500"
                            : order.status === "preparing"
                            ? "bg-yellow-500"
                            : order.status === "completed"
                            ? "bg-blue-500" : order.status === "pending"
                            ? "bg-blue-500"
                            : "bg-blue-500"
                        } mr-2`}
                      />
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        
                        {order.status === "ready" ? "Ready to serve" : order.status === "preparing" ? "In the kitchen" : order.status === "completed" ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Categories</h2>
            <div className="grid grid-cols-8 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl transition-colors ${
                    selectedCategory === category.id
                      ? "bg-rose-500 text-white"
                      : isDarkMode
                        ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                        : "bg-white hover:bg-gray-50 text-gray-900"
                  }`}
                >
                  <div className="text-2xl mb-2 flex items-center justify-center">
                    <div className="rounded-full overflow-hidden w-10 h-10 flex items-center justify-center">
                      {category.icon ? (
                        <div
                          className={`rounded-full overflow-hidden w-20 h-20 flex items-center justify-center ${isDarkMode ? "bg-rose-500" : "bg-gray-100"}`}
                        >
                          <img
                            src={category.icon || "/placeholder.svg"}
                            alt={category.name}
                            width={30}
                            height={30}
                            className="rounded-full object-cover object-center"
                          />
                        </div>
                      ) : (
                        <div className="text-2xl mb-2">{category.name.charAt(0)}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{category.name}</div>
                  <div
                    className={`text-xs mt-1 ${
                      selectedCategory === category.id ? "text-white" : isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {category.itemCount} items
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full p-4 pl-12 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isDarkMode
                    ? "bg-gray-800 text-white placeholder-gray-400"
                    : "bg-white text-gray-900 placeholder-gray-500"
                }`}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Menu Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Menu Items</h2>
              <button
                className={`px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 ${
                  isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-white hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            {renderMenuItems}
          </div>
        </div>

        {/* Order Details Sidebar (25%) */}

              
        <div
          className={`w-[25%] border-l fixed right-0 top-0 h-screen overflow-auto ${
            isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order Details</h2>
            </div>

            {/* Order Type Selection */}
            <div className="mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setOrderType("dine-in")}
                  className={`flex-1 p-4 rounded-xl transition-colors flex flex-col items-center gap-2 ${
                    orderType === "dine-in"
                      ? "bg-rose-500 text-white"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title="Dine-in"
                >
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-lg ${
                      orderType === "dine-in" ? "bg-white bg-opacity-20" : isDarkMode ? "bg-gray-600" : "bg-white"
                    }`}
                  >
                    <Home className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium">Dine-in</span>
                </button>

                <button
                  onClick={() => setOrderType("pickup")}
                  className={`flex-1 p-4 rounded-xl transition-colors flex flex-col items-center gap-2 ${
                    orderType === "pickup"
                      ? "bg-rose-500 text-white"
                      : isDarkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title="Pickup"
                >
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-lg ${
                      orderType === "pickup" ? "bg-white bg-opacity-20" : isDarkMode ? "bg-gray-600" : "bg-white"
                    }`}
                  >
                    <HandPlatter className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium">Pickup</span>
                </button>
              </div>
            </div>

            {/* Customer Search */}
            <div className="mb-2 relative">
              <div className="relative flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Search customer by name or phone"
                  value={searchPhone}
                  onChange={(e) => handlePhoneSearch(e.target.value)}
                  className={`w-full p-3 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-200 placeholder-gray-400"
                  }`}
                />
                <button
                  onClick={fetchAllCustomers}
                  disabled={isCustomersLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full ${
                    isCustomersLoading ? "text-gray-400 cursor-not-allowed" : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="Refresh customers"
                >
                  <RefreshCw className={`w-4 h-4 ${isCustomersLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Customer Suggestions Dropdown */}
              {showSuggestions && (
                <div
                  className={`absolute z-50 w-full mt-1 rounded-md shadow-lg ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="max-h-60 overflow-auto">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className={`p-3 cursor-pointer hover:bg-rose-50 ${
                            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {customer.phoneNumber}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-3`}>
                          No customer found
                        </p>
                        <button
                          onClick={() => {
                            setShowNewCustomerForm(true)
                            setShowSuggestions(false)
                          }}
                          className="w-full py-2 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
                        >
                          Add New Customer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoadingCustomer ? (
                <CustomerSkeleton />
              ) : (
                customer && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mt-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Details</h3>
                      <button
                        onClick={() => {
                          setCustomer(null)
                          setSearchPhone("")
                          setDiscountPercentage({ amount: 0, type: "loyalty", points: 0 }) 
                          
                        }}
                        className="text-rose-500 hover:text-rose-600 p-1"
                        title="Remove Customer"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Name: {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Phone: {customer.phoneNumber}</p>
                      {customer.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">Email: {customer.email}</p>
                      )}
                      {typeof customer.availablePoints === "number" && loyaltySettings && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              Loyalty Points:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {customer.availablePoints.toLocaleString()}
                            </span>
                          </div>
                          {/* {console.log(calculateTotal.totalAmoun, 'userLoyaltyPoints')} */}
                          {customer.availablePoints && customer.availablePoints >= loyaltySettings.minRedeemPoints && (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  if(calculateTotal.totalAmount && Number(calculateTotal.totalAmount || 0) < 1){
                                    toast.error("Please select items to redeem points")
                                    return  
                                  }
                                  if(discountPercentage.amount > 0 ) {
                                    toast.error(`Discount already applied as ${discountPercentage.type === "flat" ?` Flat discount` : discountPercentage.type === "free" ? `Free item` : ""}`)
                                    return
                                  }
                                  const pointsToRedeem = loyaltySettings.minRedeemPoints
                                  const discountAmount =
                                    (pointsToRedeem / loyaltySettings.redeemRate) * loyaltySettings.redeemValue
                                  setDiscountPercentage({ amount: (discountAmount / Number.parseFloat(calculateTotal.subtotal)) * 100, type: "loyalty", points: pointsToRedeem })
                                }}
                                disabled={discountPercentage.amount > 0 ? true : false}
                                className="w-full py-2 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm">
                                Redeem {loyaltySettings.minRedeemPoints} Points 
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {showNewCustomerForm && (
              <div className="mb-6">
                <NewCustomerForm
                  phone={searchPhone}
                  onSave={(customer: Partial<Customer>) => handleNewCustomer(customer)}
                  onCancel={() => setShowNewCustomerForm(false)}
                  isDarkMode={isDarkMode}
                  isCustomerSaving={isCustomerSaving}
                />
              </div>
            )}

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {Array.isArray(orderItems) && orderItems.length > 0 ? (
                orderItems.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {item.quantity}x
                          </span>
                          <h3 className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {item.menuItem.name}
                          </h3>
                        </div>
                        <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"} mt-1`}>
                          {item.isFree
                            ? "Free of cost"
                            : formatCurrency((item.menuItem.price * item.quantity).toFixed(2))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if(discountPercentage.amount > 0 && discountPercentage.type !== "free") {
                              toast.error(`Discount already applied as ${discountPercentage.type === "loyalty" ? `Loyalty points` : discountPercentage.type === "flat" ? `Flat discount` : ""}`)
                              return
                            }
                            handleToggleFreeItem(item.id)
                          }}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            item.isFree
                              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md"
                              : isDarkMode
                                ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                          }`}
                          title={item.isFree ? "Make Paid" : "Make Free"}
                        >
                          <div className="flex items-center gap-1">
                            {item.isFree ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Free</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4" />
                                <span className="text-xs font-medium">Free</span>
                              </>
                            )}
                          </div>
                        </button>
                        <button onClick={() => handleRemoveItem(item.id)} className="text-rose-500 hover:text-rose-600">
                          ×
                        </button>
                      </div>
                    </div>

                    {Array.isArray(item.selectedAddons) && item.selectedAddons.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.selectedAddons.map((addon, idx) => (
                          <div
                            key={idx}
                            className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"} flex justify-between`}
                          >
                            <span>
                              + {addon.quantity}x {addon.addon.name}
                            </span>
                            <span>{item.isFree ? "Free" : formatCurrency(addon.addon.price * addon.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div className={`mt-2 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"} italic`}>
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className={`${isDarkMode ? "text-gray-300" : "text-gray-500"} text-sm text-center`}>
                  No items in the order.
                </p>
              )}
            </div>

            {orderType === "dine-in" && (
              <div className="mb-2 flex justify-center">
                <button
                  className="p-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300 text-sm cursor-pointer justify-center"
                  onClick={() => setShowAvailableTable(true)}
                >
                  <Table className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {selectedTable ? <>Selected Table: #{selectedTable.number}</> : <>Open Available Tables</>}
                  </span>
                </button>
              </div>
            )}

            {/* Order Summary */}
            <div className={`border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"} pt-4`}>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className={isDarkMode ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}>Subtotal</span>
                  <span className={isDarkMode ? "text-white text-sm" : "text-gray-900 text-sm"}>
                    {formatCurrency(calculateTotal.subtotal)}
                  </span>
                </div>

                {taxSettings &&
                  Object.entries(calculateTax(calculateTotal.subtotal))
                    .filter(([key]) => ["gst", "pst", "hst"].includes(key))
                    .map(
                      ([key, tax]: [string, any]) =>
                        tax.enabled && (
                          <div key={key} className="flex justify-between">
                            <span className={isDarkMode ? "text-gray-300 text-xs" : "text-gray-500 text-xs"}>
                              {key.toUpperCase()} {tax.rate}%
                            </span>
                            <span className={isDarkMode ? "text-white text-xs" : "text-gray-900 text-xs"}>
                              {formatCurrency(tax.amount)}
                            </span>
                          </div>
                        ),
                    )}

                <div className="flex justify-between">
                  <span className={isDarkMode ? "text-gray-300 text-sm" : "text-gray-500 text-sm"}>
                    {/* {console.log(discountPercentage , "discountPercentage")} */}
                    Discount {discountPercentage.type === "flat" && discountPercentage.amount > 0 ? `${discountPercentage.amount}%` : discountPercentage.type === "loyalty" && discountPercentage.amount > 0 ? `(${discountPercentage.points || 0 } points  ${formatCurrency(discountPercentage.amount)})` : discountPercentage.type === "free" && discountPercentage.amount > 0 ? `Free ( ${formatCurrency(discountPercentage.amount)} )` : ""}
                  </span>
                  <span className="text-rose-500 text-sm">-{formatCurrency(calculateTotal.discount)}</span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-lg mb-6">
                <span className={isDarkMode ? "text-white text-sm" : "text-gray-900 text-sm"}>Total</span>
                <span className={isDarkMode ? "text-white text-sm" : "text-gray-900 text-sm"}>
                  {formatCurrency(calculateTotal.totalAmount)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 sticky bottom-0 relative z-100">
                <button
                  onClick={() => {
                    if(discountPercentage.amount > 0 ) {
                        toast.error(`Discount already applied as ${discountPercentage.type === "loyalty" ? `Loyalty points` : discountPercentage.type === "free" ? `Free item` : ""}`)
                        return
                      }

                    const input = prompt("Enter discount percentage (0-100):")
                    const value = Number.parseInt(input || "0")
                    if (!Number.isNaN(value) && value >= 0 && value <= 100) {
                      setDiscountPercentage({ amount: value, type: "flat", points: 0 })
                    } else {
                      alert("Please enter a valid discount percentage between 0 and 100")
                    }
                  }}
                  className={`py-1 p-1 rounded-sm h-10 font-medium transition-colors flex items-center justify-center gap-2 text-xs ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="text-rose-500">%</span>
                  Discount
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!customer || orderItems.length === 0 || placingOrder}
                  className="py-1 p-1 h-10 bg-rose-500 text-white rounded-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 text-xs"
                >
                  {placingOrder ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Receipt className="w-5 h-5" />
                  )}
                  {placingOrder ? "Placing Order" : "Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Order Modal */}
      {selectedItem && (
        <CustomizeOrder
          menuItem={selectedItem}
          formatCurrency={formatCurrency}
          onSave={handleCustomizationSave}
          onCancel={() => setSelectedItem(null)}
        />
      )}

      {/* Order Slip Modal */}
      {showOrderSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center" style={{ zIndex: 1000 }}>
          <div className="bg-white rounded-0 p-6 w-full max-w-md relative">
            <button
              onClick={handleOrderSlipClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 no-print"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="print-section">
              <div className="receipt-header">
                <h2 className="text-md font-bold">{restaurantSettings?.name}</h2>
                <p className="text-xs text-gray-500">{restaurantSettings?.address}</p>
                <p className="text-xs text-gray-500">Phone: {restaurantSettings?.phone}</p>
                <div className="print-divider"></div>


                <p className="text-xs font-medium">Order #{orderNumber.orderNumber}</p>
                <p className="text-xs text-gray-500">{orderTimestamp}</p>
              </div>

              <div className="py-2">
                <p className="text-sm font-medium">Customer Details:</p>
                <p className="text-xs">
                  {customer?.firstName} {customer?.lastName}
                </p>
                <p className="text-xs text-gray-500">{customer?.phoneNumber}</p>
                <p className="text-xs text-gray-500 capitalize">Order Type: {orderType}</p>
              </div>

              <div className="print-divider"></div>

              <div className="py-2">
                <p className="text-sm font-medium mb-2">Order Items:</p>
                {orderItems.length > 0 &&
                  orderItems.map((item) => (
                    <div key={item.id} className="mb-2">
                      <div className="flex justify-between">
                        <span className="text-xs">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <span className="text-xs">
                          {formatCurrency((item.menuItem.price * item.quantity).toFixed(2))}
                        </span>
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="pl-4">
                          {item.selectedAddons.map((addon, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-500">
                              <span>
                                + {addon.quantity} x {addon.addon.name}
                              </span>
                              <span>{formatCurrency(addon.addon.price * addon.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="pl-4 text-xs text-gray-500 italic">Note: {item.specialInstructions}</div>
                      )}
                    </div>
                  ))}
              </div>

              <div className="print-divider"></div>

              <div className="py-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateTotal.subtotal)}</span>
                </div>
                {taxSettings &&
                  orderItems.length > 0 &&
                  Object.entries(calculateTax(calculateTotal.subtotal))
                    .filter(([key]) => ["gst", "pst", "hst"].includes(key))
                    .map(
                      ([key, tax]: [string, any]) =>
                        tax.enabled && (
                          <div key={key} className="flex justify-between">
                            <span className="text-xs">
                              {key.toUpperCase()} {tax.rate}%
                            </span>
                            <span className="text-xs">{formatCurrency(tax.amount)}</span>
                          </div>
                        ),
                    )}
                
                {discountPercentage?.amount > 0 && (
  <div className="flex justify-between text-sm mb-2">
    <span>
      Discount (
      {discountPercentage.type === "flat" && "Flat"}
      {discountPercentage.type === "loyalty" && "Loyalty"}
      {discountPercentage.type === "free" && "Free"}
      )
    </span>
    <span>
      {discountPercentage.type === "flat" && `${discountPercentage.amount}%`}
      {discountPercentage.type === "loyalty" &&
        `(${discountPercentage.points || 0} pts ${formatCurrency(discountPercentage.amount)})`}
      {discountPercentage.type === "free" && `${formatCurrency(discountPercentage.amount)}`}
    </span>
  </div>
)}

                <div className="print-divider"></div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span className="text-sm">Total</span>
                  <span className="text-sm">
                    {orderItems.length > 0 ? formatCurrency(calculateTotal.totalAmount) : "0.00"}
                  </span>
                </div>
              </div>

              <div className="receipt-footer">
                <p className="text-xs">Thank you for your order!</p>
                <p className="text-xs">Please keep this slip for your reference.</p>
                <div className="print-divider"></div>
                <p className="text-xs">{orderTimestamp}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 no-print">
              <button
                onClick={
                  () => {
                    handleOrderSlipClose()
                    setCustomer(null)
                    setSelectedTable(null)
                  }
                }
                className="w-1/2 py-2 rounded-sm h-10 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4 text-xs" />
                Close
              </button>
              <button
                onClick={() => {
                  if (!orderComplete) {
                    alert("Please complete the order payment first")
                    return
                  }
                  window.print()
                  handleOrderSlipClose()
                  setCustomer(null)
                  setSelectedTable(null)
                  setDiscountPercentage(
                    {
                      amount: 0,
                      type: "flat",
                      points: 0,
                    }
                  )
                }}
                className={`w-1/2 py-2 rounded-sm h-10 text-xs font-medium flex items-center justify-center gap-2 ${
                  orderComplete
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Receipt className="w-4 h-4 text-xs" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Tables Modal */}
      {showAvailableTable && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-md w-full max-w-2xl shadow-xl`}>
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className={`text-md font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Available Tables</h2>
                <div className="flex items-center gap-2">
                  <button
                    className="text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md p-2"
                    onClick={() => {
                      setIsLoadingTables(true)
                      handleRefreshTables()
                      setIsLoadingTables(false)
                    }}
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowAvailableTable(false)}
                    className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {isLoadingTables ? (
                <TableSkeleton />
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
                    {availableTables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => {
                          setSelectedTable(table)
                          setShowAvailableTable(false)
                        }}
                        className={`relative group p-4 rounded-xl border-2 transition-all ${
                          table.status === "available"
                            ? "border-green-500 hover:border-green-600 bg-green-50 hover:bg-green-100"
                            : "border-red-500 bg-red-50 cursor-not-allowed opacity-75"
                        } ${isDarkMode ? "bg-opacity-10" : ""}`}
                        disabled={table.status !== "available"}
                      >
                        {selectedTable && table.id === selectedTable.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-10 rounded-xl transition-all">
                            <Check className="w-8 h-8 text-green-500 opacity-100 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}

                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              table.status === "available" ? "bg-green-500" : "bg-red-500"
                            } ${isDarkMode ? "bg-opacity-20" : ""}`}
                          >
                            <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {table.number}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Users className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                            <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {table.capacity} Capacity
                            </span>
                          </div>

                          <span
                            className={`text-sm font-medium ${
                              table.status === "available"
                                ? isDarkMode
                                  ? "text-green-400"
                                  : "text-green-600"
                                : isDarkMode
                                  ? "text-red-400"
                                  : "text-red-600"
                            }`}
                          >
                            {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                          </span>
                        </div>

                        {table.status === "available" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all">
                            <Check className="w-8 h-8 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => setShowAvailableTable(false)}
                  className={`px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Menu */}
      <div
        className={`sticky bottom-0 left-0 right-0 border-t p-4 flex justify-around items-center w-[75%] ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <button
          onClick={() => {
            if (isMenuLoading) return
            setShowAllDayView(true)
            setShowTodayCustomers(false)
            setShowReports(false)
            setShowOrders(false)
          }}
          className="flex flex-col items-center text-gray-600 hover:text-gray-900"
        >
          <BarChart3 className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <span className={`text-xs mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>All Day View</span>
        </button>
        <button
          onClick={() => {
            if (isMenuLoading) return
            setShowAllDayView(false)
            setShowTodayCustomers(true)
            setShowReports(false)
            setShowOrders(false)
          }}
          className="flex flex-col items-center text-gray-600 hover:text-gray-900"
        >
          <Users className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <span className={`text-xs mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Today's Customers</span>
        </button>
        <button
          onClick={() => {
            if (isMenuLoading) return
            setShowAllDayView(false)
            setShowTodayCustomers(false)
            setShowReports(true)
            setShowOrders(false)
          }}
          className="flex flex-col items-center text-gray-600 hover:text-gray-900"
        >
          <FileText className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <span className={`text-xs mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Reports</span>
        </button>
        <button
          onClick={() => {
            if (isMenuLoading) return
            setShowAllDayView(false)
            setShowTodayCustomers(false)
            setShowReports(false)
            setShowOrders(true)
          }}
          className="flex flex-col items-center text-gray-600 hover:text-gray-900"
        >
          <ShoppingBag className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <span className={`text-xs mt-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Orders</span>
        </button>
      </div>

      {/* Drawer-style popup container for views */}
      {(showAllDayView || showTodayCustomers || showReports || showOrders) && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity animate-fade-in"
            style={{ top: "48px" }}
            onClick={() => {
              setShowAllDayView(false)
              setShowTodayCustomers(false)
              setShowReports(false)
              setShowOrders(false)
            }}
          />

          <div
            className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out fade-in"
            style={{ top: "48px" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">
                {showAllDayView && "All Day View"}
                {showTodayCustomers && "Today's Customers"}
                {showReports && "Reports"}
                {showOrders && "Orders"}
              </h2>
              <button
                onClick={() => {
                  setShowAllDayView(false)
                  setShowTodayCustomers(false)
                  setShowReports(false)
                  setShowOrders(false)
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="h-[calc(100%-64px)] overflow-y-auto p-6 animate-fade-in">
              {showAllDayView && dailyStats && (
                <AllDayView
                  onClose={() => setShowAllDayView(false)}
                  dailyStats={dailyStats}
                  isDarkMode={isDarkMode}
                  currency={currency}
                  onDateChange={handleDateChange}
                />
              )}
              {showTodayCustomers && dailyStats && (
                <TodayCustomers
                  onClose={() => setShowTodayCustomers(false)}
                  customers={dailyStats.customerData}
                  onDateChange={handleDateChange}
                  isDarkMode={isDarkMode}
                  currency={currency}
                />
              )}
              {showReports && taxSettings && (
                <Reports
                  onClose={() => setShowReports(false)}
                  onDateChange={handleDateChangeReports}
                  data={dailyStats?.reportsData}
                  isDarkMode={isDarkMode}
                  currency={currency}
                />
              )}
              {showOrders && (
                <Order
                  onClose={() => setShowOrders(false)}
                  data={dailyStats?.orders}
                  onUpdateOrder={handleOrderUpdate}
                  onDateChange={handleDateChangeOrder}
                  isDarkMode={isDarkMode}
                  currency={currency}
                  onPrint={handlePrintReceipt}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

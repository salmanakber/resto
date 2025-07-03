"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronLeft, Minus, Plus, Trash2, ChevronRight, CreditCard, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuthDialog } from "@/components/auth/auth-dialog"

// Mock cart items
const mockCartItems = [
  {
    id: 1,
    name: "Pho Dac Biet",
    description: "Special beef noodle soup with rare steak, well-done flank, tendon, and tripe",
    price: 15.95,
    quantity: 2,
    image: "/placeholder-food.jpg",
    options: ["Large size", "Extra meat +$3.00"],
  },
  {
    id: 2,
    name: "Grilled Pork Spring Rolls",
    description: "Rice paper rolls with grilled pork, vermicelli, and fresh herbs",
    price: 7.50,
    quantity: 1,
    image: "/placeholder-food.jpg",
    options: ["Peanut sauce"],
  },
  {
    id: 3,
    name: "Thai Iced Tea",
    description: "Sweet and creamy Thai tea with milk",
    price: 4.95,
    quantity: 2,
    image: "/placeholder-food.jpg",
    options: ["Less sweet"],
  },
]

// Mock promo codes
const promoCodes = {
  "WELCOME10": { discount: 0.1, maxDiscount: 10, minOrder: 30 },
  "FREESHIP": { discount: 0, shipping: 0, minOrder: 50 },
  "SAVE15": { discount: 0.15, maxDiscount: 20, minOrder: 40 },
}

// Updated interface to correctly type all promo code variations
interface PromoCodeInfo {
  discount: number;
  maxDiscount?: number;
  shipping?: number;
  minOrder: number;
}

type PromoCodeType = keyof typeof promoCodes;

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [promoCode, setPromoCode] = useState<string>("")
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeType | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [tip, setTip] = useState<number>(0)
  const [customTip, setCustomTip] = useState<string>("")
  
  // Calculate subtotal
  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
  
  // Fixed fee for pickup
  const pickupFee = 0
  
  // Calculate discount
  const discount = appliedPromo ? (() => {
    const promo = promoCodes[appliedPromo];
    const discountAmount = subtotal * (promo.discount || 0);
    
    // Check if this promo has a maxDiscount property
    if ('maxDiscount' in promo) {
      return Math.min(discountAmount, promo.maxDiscount || 0);
    }
    
    return discountAmount;
  })() : 0
  
  // Tax calculation (assume 7%)
  const taxRate = 0.07
  const tax = (subtotal - discount) * taxRate
  
  // Calculate total
  const finalTip = customTip ? parseFloat(customTip) : tip
  const total = subtotal - discount + tax + pickupFee + finalTip
  
  // Handle quantity changes
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }
  
  // Handle item removal
  const removeItem = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id))
  }
  
  // Handle promo code application
  const applyPromoCode = () => {
    setPromoError(null)
    const code = promoCode.trim().toUpperCase() as PromoCodeType
    
    if (!promoCodes[code]) {
      setPromoError("Invalid promo code")
      return
    }
    
    if (subtotal < promoCodes[code].minOrder) {
      setPromoError(`Minimum order of $${promoCodes[code].minOrder.toFixed(2)} required`)
      return
    }
    
    setAppliedPromo(code)
    setPromoCode("")
  }
  
  // Handle tip selection
  const handleTipSelection = (amount: number) => {
    setTip(amount)
    setCustomTip("")
  }
  
  // Handle custom tip input
  const handleCustomTipChange = (value: string) => {
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setCustomTip(value)
      setTip(0)
    }
  }
  
  // Proceed to checkout
  const proceedToCheckout = () => {
    router.push("/checkout")
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
    <Header title="Shopping Cart" requireAuth={true} />

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
            <div>
              <h1 className="text-2xl font-bold">Your Cart</h1>
              <p className="text-gray-500 mt-1">Review and edit your items before checkout</p>
            </div>
            
            {cartItems.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Cart items */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Items ({cartItems.reduce((total, item) => total + item.quantity, 0)})</h2>
                      <div className="space-y-6">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row gap-4">
                            <div className="relative w-full sm:w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                              {/* Replace with actual image when available */}
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                  <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                  <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                  <path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                  <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                </svg>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                              
                              {item.options.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium">Options:</p>
                                  <ul className="text-sm text-gray-500">
                                    {item.options.map((option, index) => (
                                      <li key={index}>{option}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-8 w-8" 
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-8 w-8" 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-gray-500 gap-1 ml-4" 
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Remove</span>
                                  </Button>
                                </div>
                                
                                <div className="text-sm text-gray-500">
                                  ${item.price.toFixed(2)} each
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Special instructions */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Special Instructions</h2>
                      <Input
                        placeholder="Add special instructions for the restaurant..."
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Order summary */}
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount ({appliedPromo})</span>
                            <span>-${discount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        
                        {finalTip > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tip</span>
                            <span>${finalTip.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between font-bold text-lg pt-2">
                          <span>Total</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promo code */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Promo Code</h2>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={applyPromoCode}>Apply</Button>
                      </div>
                      {promoError && (
                        <p className="text-red-500 text-sm mt-2">{promoError}</p>
                      )}
                      {appliedPromo && (
                        <p className="text-green-600 text-sm mt-2">
                          {promoCodes[appliedPromo].discount 
                            ? `${promoCodes[appliedPromo].discount * 100}% off applied`
                            : "Free shipping applied"}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Tip */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Add a Tip</h2>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[0, 3, 5, 7].map((amount) => (
                          <Button
                            key={amount}
                            variant={tip === amount && !customTip ? "default" : "outline"}
                            className={tip === amount && !customTip ? "bg-[#e41e3f] hover:bg-[#c01835]" : ""}
                            onClick={() => handleTipSelection(amount)}
                          >
                            {amount === 0 ? "No Tip" : `$${amount}`}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="custom-tip">Custom:</Label>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                          <Input
                            id="custom-tip"
                            className="pl-7"
                            placeholder="Enter amount"
                            value={customTip}
                            onChange={(e) => handleCustomTipChange(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Checkout button */}
                  <Button 
                    onClick={proceedToCheckout} 
                    className="w-full py-6 text-lg bg-[#e41e3f] hover:bg-[#c01835]"
                  >
                    Proceed to Checkout
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-sm text-gray-500 text-center">
                    By proceeding to checkout, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center py-12 bg-white rounded-lg shadow">
                <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100 mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Looks like you haven't added any items to your cart yet. Browse our menu to find your favorite dishes.
                </p>
                <Link href="/">
                  <Button className="bg-[#e41e3f] hover:bg-[#c01835]">
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
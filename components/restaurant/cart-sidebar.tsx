"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ShoppingCart, X, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { CartSkeleton } from "@/components/skeletons/cart-skeleton"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  quantity?: number
  selectedAddons?: Array<{ id: string; name: string; price: number }>
}

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  items: MenuItem[]
  onRemoveItem: (index: number) => void
  orderType: "delivery" | "pickup" | "dine-in"
  tableNumber: string
  onTableNumberChange: (value: string) => void
  onScanClick: () => void
  onPlaceOrder: () => void
  currency: { symbol: string } | null
  isLoading?: boolean
  loyaltySettings?: {
    enabled: boolean
    minRedeemPoints: number
  } | null
  loyaltyPoints?: number
  useLoyaltyPoints?: boolean
  onLoyaltyToggle?: (use: boolean) => void
  pointsToRedeem?: number
  onPointsChange?: (points: number) => void
  loyaltyDiscount?: number
}

export const CartSidebar = React.memo(
  ({
    isOpen,
    onClose,
    items,
    onRemoveItem,
    orderType,
    tableNumber,
    onTableNumberChange,
    onScanClick,
    onPlaceOrder,
    currency,
    isLoading = false,
    loyaltySettings,
    loyaltyPoints = 0,
    useLoyaltyPoints = false,
    onLoyaltyToggle,
    pointsToRedeem = 0,
    onPointsChange,
    loyaltyDiscount = 0,
  }: CartSidebarProps) => {
    const calculateItemTotal = (item: MenuItem) => {
      const basePrice = item.price * (item.quantity || 1)
      const addonsPrice = (item.selectedAddons || []).reduce((total, addon) => total + addon.price, 0)
      return basePrice + addonsPrice
    }

    const calculateCartTotal = () => {
      const subtotal = items.reduce((total, item) => total + calculateItemTotal(item), 0)
      return Math.max(0, subtotal - loyaltyDiscount)
    }

    return (
      <>
        {/* Backdrop */}
        {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-lg z-50 transform transition-transform duration-300",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-[#f8f9fa]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#e41e3f]" />
                <h2 className="text-lg font-semibold">Your Cart</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-200">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <CartSkeleton />
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-2">Add some items to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <img
                          src={item.image || "/placeholder.png"}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-md"
                          loading="lazy"
                        />
                        <span className="absolute -top-1 -right-1 bg-[#e41e3f] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-base line-clamp-2">{item.name}</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveItem(index)}
                            className="h-8 w-8 hover:bg-gray-200 flex-shrink-0 ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-500">
                            Base: {currency?.symbol}
                            {(item.price * (item.quantity || 1)).toFixed(2)}
                          </p>
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="text-sm text-gray-500">
                              <p className="font-medium">Add-ons:</p>
                              <ul className="list-disc list-inside ml-2">
                                {item.selectedAddons.map((addon, i) => (
                                  <li key={i} className="text-gray-600 truncate">
                                    {addon.name} {currency?.symbol}
                                    {addon.price.toFixed(2)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-sm font-medium text-[#e41e3f]">
                            Total: {currency?.symbol}
                            {calculateItemTotal(item).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t bg-[#f8f9fa] space-y-4">
                {/* Loyalty Points */}
                {loyaltySettings?.enabled && loyaltyPoints >= (loyaltySettings?.minRedeemPoints || 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={useLoyaltyPoints} onCheckedChange={onLoyaltyToggle} />
                        <Label>Use Loyalty Points</Label>
                      </div>
                      <span className="text-sm text-gray-500">Available: {loyaltyPoints}</span>
                    </div>

                    {useLoyaltyPoints && (
                      <div className="space-y-2">
                        <Label>Points to Redeem</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={loyaltyPoints}
                            value={pointsToRedeem}
                            onChange={(e) => onPointsChange?.(Number(e.target.value))}
                            className="h-10"
                          />
                          <Button
                            variant="outline"
                            onClick={() => onPointsChange?.(loyaltyPoints)}
                            className="h-10 whitespace-nowrap"
                          >
                            Max
                          </Button>
                        </div>
                        {loyaltyDiscount > 0 && (
                          <p className="text-sm text-green-600">
                            Discount: {currency?.symbol}
                            {loyaltyDiscount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Type Specific Content */}
                {orderType === "dine-in" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tableNumber" className="text-sm font-medium">
                        Table Number
                      </Label>
                      <Input
                        id="tableNumber"
                        value={tableNumber}
                        onChange={(e) => onTableNumberChange(e.target.value)}
                        placeholder="Enter table number"
                        className="h-10"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={onScanClick} className="flex items-center gap-2 flex-1">
                        <Camera className="h-4 w-4" />
                        Scan QR
                      </Button>
                      <Button
                        className="bg-[#e41e3f] hover:bg-[#c01835] flex-1"
                        onClick={onPlaceOrder}
                        disabled={!tableNumber}
                      >
                        Place Order ({currency?.symbol}
                        {calculateCartTotal().toFixed(2)})
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Items: {items.length}</p>
                      {loyaltyDiscount > 0 && (
                        <p className="text-sm text-green-600">
                          Saved: {currency?.symbol}
                          {loyaltyDiscount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button className="bg-[#e41e3f] hover:bg-[#c01835]" onClick={onPlaceOrder}>
                      Checkout ({currency?.symbol}
                      {calculateCartTotal().toFixed(2)})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )
  },
)

CartSidebar.displayName = "CartSidebar"

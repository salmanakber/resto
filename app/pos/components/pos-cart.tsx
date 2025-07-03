"use client"

import { memo } from "react"
import { CheckCircle, Circle, Trash2 } from "lucide-react"
import type { OrderItem } from "../types"

interface POSCartProps {
  orderItems: OrderItem[]
  onRemoveItem: (itemId: string) => void
  onToggleFreeItem: (itemId: string) => void
  formatCurrency: (amount: string | number) => string
  isDarkMode: boolean
}

export const POSCart = memo<POSCartProps>(
  ({ orderItems, onRemoveItem, onToggleFreeItem, formatCurrency, isDarkMode }) => {
    const calculateItemTotal = (item: OrderItem) => {
      if (item.isFree) return 0

      const itemTotal = item.menuItem.price * item.quantity
      const addonsTotal =
        (item.selectedAddons || []).reduce((sum, addon) => sum + addon.addon.price * addon.quantity, 0) * item.quantity

      return itemTotal + addonsTotal
    }

    if (orderItems.length === 0) {
      return (
        <div className={`flex-1 flex items-center justify-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <div className="text-center py-8">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <Circle className="w-8 h-8" />
            </div>
            <p className="text-sm">No items in cart</p>
            <p className="text-xs mt-1">Add items from the menu</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {orderItems.map((item) => (
          <div
            key={item.id}
            className={`relative rounded-lg border transition-all duration-200 ${
              item.isFree
                ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                : isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
            } hover:shadow-sm`}
          >
            {/* Free Badge */}
            {item.isFree && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                FREE
              </div>
            )}

            <div className="p-4">
              {/* Item Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isDarkMode ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {item.quantity}
                    </span>
                    <h3 className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {item.menuItem.name}
                    </h3>
                  </div>

                  <div
                    className={`text-sm font-medium ${
                      item.isFree
                        ? "text-green-600 dark:text-green-400"
                        : isDarkMode
                          ? "text-gray-300"
                          : "text-gray-600"
                    }`}
                  >
                    {item.isFree ? "Free of charge" : formatCurrency(calculateItemTotal(item))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => onToggleFreeItem(item.id)}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      item.isFree
                        ? "bg-green-500 hover:bg-green-600 text-white shadow-sm"
                        : isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                    }`}
                    title={item.isFree ? "Make Paid" : "Make Free"}
                  >
                    {item.isFree ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDarkMode ? "text-red-400 hover:bg-red-900/20" : "text-red-500 hover:bg-red-50"
                    }`}
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add-ons */}
              {item.selectedAddons && item.selectedAddons.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Add-ons:
                  </div>
                  {item.selectedAddons.map((addon, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center text-xs ${
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {addon.quantity}
                        </span>
                        {addon.addon.name}
                      </span>
                      <span className={item.isFree ? "line-through opacity-60" : ""}>
                        {formatCurrency(addon.addon.price * addon.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Special Instructions */}
              {item.specialInstructions && (
                <div
                  className={`mt-3 p-2 rounded text-xs italic ${
                    isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="font-medium">Note:</span> {item.specialInstructions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  },
)

POSCart.displayName = "POSCart"

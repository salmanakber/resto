"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { X, Minus, Plus } from "lucide-react"
import type { CustomizeOrderProps } from "../types"

export const CustomizeOrder: React.FC<CustomizeOrderProps> = ({ menuItem, onSave, onCancel, formatCurrency }) => {
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
}

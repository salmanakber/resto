"use client"

import React, { memo, useState, useCallback } from "react"
import { RefreshCw, UserX, Search } from "lucide-react"
import type { Customer } from "../types"

interface CustomerSearchProps {
  searchPhone: string
  onPhoneSearch: (phone: string) => void
  showSuggestions: boolean
  filteredCustomers: Customer[]
  onCustomerSelect: (customer: Customer) => void
  customer: Customer | null
  onRemoveCustomer: () => void
  onRefreshCustomers: () => void
  onShowNewCustomerForm: () => void
  isCustomersLoading: boolean
  isDarkMode: boolean
}

export const CustomerSearch = memo<CustomerSearchProps>(
  ({
    searchPhone,
    onPhoneSearch,
    showSuggestions,
    filteredCustomers,
    onCustomerSelect,
    customer,
    onRemoveCustomer,
    onRefreshCustomers,
    onShowNewCustomerForm,
    isCustomersLoading,
    isDarkMode,
  }) => {
    const [localShowSuggestions, setLocalShowSuggestions] = useState(showSuggestions)

    const handleCustomerSelect = useCallback(
      (selectedCustomer: Customer) => {
        // Hide suggestions immediately without waiting for API response
        setLocalShowSuggestions(false)
        onCustomerSelect(selectedCustomer)
      },
      [onCustomerSelect],
    )

    // Update local state when parent state changes
    React.useEffect(() => {
      setLocalShowSuggestions(showSuggestions)
    }, [showSuggestions])

    return (
      <div className="mb-4 relative">
        <div className="relative flex items-center justify-between">
          <input
            type="text"
            placeholder="Search customer by name or phone"
            value={searchPhone}
            onChange={(e) => onPhoneSearch(e.target.value)}
            className={`w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-colors ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-gray-50 border-gray-200 placeholder-gray-400"
            }`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Search className="w-4 h-4 text-gray-400" />
            <button
              onClick={onRefreshCustomers}
              disabled={isCustomersLoading}
              className={`p-1 rounded-full transition-colors ${
                isCustomersLoading
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              title="Refresh customers"
            >
              <RefreshCw className={`w-4 h-4 ${isCustomersLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Customer Suggestions Dropdown */}
        {localShowSuggestions && (
          <div
            className={`absolute z-50 w-full mt-1 rounded-lg shadow-lg border max-h-64 overflow-hidden ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="max-h-60 overflow-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customerItem) => (
                  <button
                    key={customerItem.id}
                    onClick={() => handleCustomerSelect(customerItem)}
                    className={`w-full p-3 text-left transition-colors ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    } border-b last:border-b-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
                  >
                    <div className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {customerItem.firstName} {customerItem.lastName}
                    </div>
                    <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {customerItem.phoneNumber}
                    </div>
                    {customerItem.email && (
                      <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {customerItem.email}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center">
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-3`}>No customer found</p>
                  <button
                    onClick={() => {
                      setLocalShowSuggestions(false)
                      onShowNewCustomerForm()
                    }}
                    className="w-full py-2 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-medium"
                  >
                    Add New Customer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Customer Display */}
        {customer && (
          <div
            className={`mt-3 rounded-lg p-4 shadow-sm border ${
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Selected Customer
              </h3>
              <button
                onClick={onRemoveCustomer}
                className="text-rose-500 hover:text-rose-600 p-1 rounded transition-colors"
                title="Remove Customer"
              >
                <UserX className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <span className="font-medium">Name:</span> {customer.firstName} {customer.lastName}
              </p>
              <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <span className="font-medium">Phone:</span> {customer.phoneNumber}
              </p>
              {customer.email && (
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span className="font-medium">Email:</span> {customer.email}
                </p>
              )}
              {typeof customer.totalEarnedPoints === "number" && (
                <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  <span className="font-medium">Loyalty Points:</span> {customer.totalEarnedPoints.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)

CustomerSearch.displayName = "CustomerSearch"

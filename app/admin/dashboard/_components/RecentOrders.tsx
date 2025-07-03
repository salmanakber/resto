"use client"

import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Building2, User, Calendar, DollarSign } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: Date
  restaurantName: string
  user: {
    firstName: string
    lastName: string
    email: string
  } | null
}

interface RecentOrdersProps {
  orders: Order[]
}

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "default"
    case "pending":
      return "secondary"
    case "processing":
      return "outline"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-gray-100 mb-4">
          <DollarSign className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No recent orders</h3>
        <p className="text-sm text-gray-500">Orders will appear here once customers start placing them.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Restaurant
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900">Status</TableHead>
              <TableHead className="font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount
                </div>
              </TableHead>
              <TableHead className="font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 10).map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100">
                      <Building2 className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.restaurantName}</p>
                      <p className="text-xs text-gray-500">#{order.orderNumber}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs">
                        {order.user ? `${order.user.firstName[0]}${order.user.lastName[0]}` : "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest User"}
                      </p>
                      <p className="text-xs text-gray-500">{order.user?.email || "No email"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(order.status)} font-medium`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-900">${Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-xs text-gray-500">{format(new Date(order.createdAt), "h:mm a")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

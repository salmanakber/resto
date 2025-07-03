'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { format } from 'date-fns'

export type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: string
  orders: {
    id: string
    totalAmount: number
  }[]
  reviews: {
    id: string
    rating: number
  }[]
}

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const customer = row.original
      return `${customer.firstName} ${customer.lastName}`
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'orders',
    header: 'Total Orders',
    cell: ({ row }) => {
      const orders = row.original.orders
      return orders.length
    },
  },
  {
    accessorKey: 'spending',
    header: 'Total Spending',
    cell: ({ row }) => {
      const orders = row.original.orders
      const total = orders.reduce((sum, order) => sum + order.totalAmount, 0)
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(total)
    },
  },
  {
    accessorKey: 'rating',
    header: 'Average Rating',
    cell: ({ row }) => {
      const reviews = row.original.reviews
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length || 0
      return avgRating.toFixed(1)
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      return format(new Date(row.original.createdAt), 'MMM d, yyyy')
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 
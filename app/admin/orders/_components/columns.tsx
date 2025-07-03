'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'

export type Order = {
  id: string
  orderNumber: string
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  restaurant: {
    id: string
    firstName: string
    restaurantName: string
    email: string
  }
  location: {
    id: string
    name: string
    address: string
  }
}

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Order Number',
  },
  {
    accessorKey: 'user',
    header: 'Customer',
    cell: ({ row }) => {
      const user = row.original.user
      return `${(user) &&  user.firstName} ${(user) &&  user.lastName}`
    },
  },
  {
    accessorKey: 'restaurant',
    header: 'Restaurant',
    cell: ({ row }) => {
      const restaurant = row.original.restaurant
      return restaurant.restaurantName
    },
    enableSorting: true,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => {
        
      const location = row.original.location
      return location.name
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => {
      return `${row.original.currency} ${Number(row.original.totalAmount).toFixed(2)}`
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variants = {
        pending: 'secondary',
        confirmed: 'default',
        preparing: 'default',
        ready: 'default',
        delivered: 'default',
        cancelled: 'destructive',
      } as const

      return (
        <Badge variant={variants[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      return format(new Date(row.original.createdAt), 'PPP')
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const order = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 
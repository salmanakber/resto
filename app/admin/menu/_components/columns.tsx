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

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  category: string
  isAvailable: boolean
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
  reviews: {
    rating: number
  }[]
}

export const columns: ColumnDef<MenuItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      return row.original.description.length > 50
        ? `${row.original.description.slice(0, 50)}...`
        : row.original.description
    },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      return `$${row.original.price.toFixed(2)}`
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'restaurant',
    header: 'Restaurant',
    cell: ({ row }) => {
      return row.original.restaurant.name
    },
  },
  {
    accessorKey: 'isAvailable',
    header: 'Status',
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.isAvailable ? 'default' : 'secondary'}>
          {row.original.isAvailable ? 'Available' : 'Unavailable'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'reviews',
    header: 'Rating',
    cell: ({ row }) => {
      const ratings = row.original.reviews.map(review => review.rating)
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0
      return `${averageRating.toFixed(1)} ⭐`
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
      const menuItem = row.original

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
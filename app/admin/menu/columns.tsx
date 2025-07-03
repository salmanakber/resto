import { ColumnDef } from '@tanstack/react-table'
import { MenuItem } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil } from 'lucide-react'
import Link from 'next/link'

export const columns: ColumnDef<MenuItem & { category: { name: string } }>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'category.name',
    header: 'Category',
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(price)
      return formatted
    },
  },
  {
    accessorKey: 'isAvailable',
    header: 'Status',
    cell: ({ row }) => {
      const isAvailable = row.getValue('isAvailable')
      return (
        <Badge variant={isAvailable ? 'default' : 'destructive'}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'isPopular',
    header: 'Popular',
    cell: ({ row }) => {
      const isPopular = row.getValue('isPopular')
      return isPopular ? 'Yes' : 'No'
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/menu/${menuItem.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 
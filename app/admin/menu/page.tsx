'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  image: string
  isAvailable: boolean
  category: {
    id: string
    name: string
  }
  user: {
    id: string
    restaurantName: string
  }
}

interface Category {
  id: string
  name: string
  user: {
    id: string
    restaurantName: string
  }
}

export default function MenuPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
  }, [selectedRestaurant, selectedCategory])

    const fetchMenuItems = async () => {
      try {
      const params = new URLSearchParams()
      if (selectedRestaurant) params.append('restaurantId', selectedRestaurant)
      if (selectedCategory) params.append('category', selectedCategory)

      const response = await fetch(`/api/menu?${params.toString()}`)
        const data = await response.json()
      console.log(data , 'data')
        setMenuItems(data)
      } catch (error) {
        console.error('Error fetching menu items:', error)
      toast.error('Failed to fetch menu items')
      } finally {
        setLoading(false)
      }
    }

  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedRestaurant) params.append('restaurantId', selectedRestaurant)

      const response = await fetch(`/api/categories?${params.toString()}`)
      const data = await response.json()
      
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    }
  }

  const handleQuickView = (item: MenuItem) => {
    setSelectedItem(item)
    setIsViewDialogOpen(true)
  }

  // Get unique restaurants from menu items
  const restaurants = Array.from(
    new Set(menuItems.map((item) => item.user.id))
  ).map((id) => {
    const item = menuItems.find((item) => item.user.id === id)
    return {
      id,
      name: item?.user.restaurantName || 'Unknown Restaurant',
    }
  })

  if (status === 'loading' || loading) {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'Admin') {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription>
            View restaurant menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex gap-4 mb-6">
  {/* Restaurant Select */}
  <Select
    value={selectedRestaurant}
    onValueChange={(value) => {
      setSelectedRestaurant(value === 'all' ? null : value)
    }}
  >
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Select Restaurant" />
          </SelectTrigger>
          <SelectContent>
      <SelectItem value="all">All Restaurants</SelectItem>
      {restaurants.map((restaurant) => (
        <SelectItem key={restaurant.id} value={restaurant.id}>
          {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

  {/* Category Select */}
  <Select
    value={selectedCategory}
    onValueChange={(value) => {
      setSelectedCategory(value === 'all' ? null : value)
    }}
  >
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
      <SelectItem value="all">All Categories</SelectItem>
      {categories.map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurant</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.user.restaurantName}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category.name}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickView(item)}
                    >
                      Quick View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Menu Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Restaurant</h3>
                  <p>{selectedItem.user.restaurantName}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <p>{selectedItem.category.name}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Name</h3>
                  <p>{selectedItem.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Price</h3>
                  <p>${selectedItem.price.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p>{selectedItem.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <p>{selectedItem.isAvailable ? 'Available' : 'Unavailable'}</p>
              </div>
              {selectedItem.image && (
                <div>
                  <h3 className="font-semibold mb-2">Image</h3>
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
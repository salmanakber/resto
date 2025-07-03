"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash,
  Star,
  CheckCircle2,
  XCircle,
  ImagePlus,
  Grid3X3,
  List,
  Clock,
  Flame,
} from "lucide-react"
import { getSafeImageUrl } from "@/lib/utils"
import { toast } from "sonner"

// Types
interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  category: {
    id: string
    name: string
  }
  image: string | null
  tags: string
  isAvailable: boolean
  isPopular: boolean
  calories: number | null
  prepTime: string | null
  services: {
    service: {
      id: string
      name: string
    }
  }[]
  reviews: {
    rating: number
  }[]
}

interface Category {
  id: string
  name: string
}

// Constants
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23fef2f2'/%3E%3Cpath d='M150,60 C138,60 128,70 128,82 C128,94 138,104 150,104 C162,104 172,94 172,82 C172,70 162,60 150,60 Z M124,150 L176,150 C176,132 164,118 150,118 C136,118 124,132 124,150 Z' fill='%23fca5a5'/%3E%3Ccircle cx='150' cy='140' r='60' fill='none' stroke='%23f87171' strokeWidth='4' strokeDasharray='12'/%3E%3Ctext x='150' y='180' fontFamily='Arial' fontSize='14' textAnchor='middle' fill='%23dc2626'%3EImage Not Found%3C/text%3E%3C/svg%3E"
const FALLBACK_THUMBNAIL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23fef2f2'/%3E%3Ccircle cx='20' cy='16' r='6' fill='%23fca5a5'/%3E%3Cpath d='M12,32 L28,32 C28,26 24,22 20,22 C16,22 12,26 12,32 Z' fill='%23fca5a5'/%3E%3C/svg%3E"

export default function MenuItemsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("name-asc")
  const [filterAvailable, setFilterAvailable] = useState(false)
  const [filterPopular, setFilterPopular] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch menu items and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [menuResponse, categoriesResponse] = await Promise.all([
          fetch("/api/restaurant/menu", {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }),
          fetch("/api/restaurant/categories", {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }),
        ])

        if (!menuResponse.ok) {
          throw new Error(`Menu API error: ${menuResponse.statusText}`)
        }

        if (!categoriesResponse.ok) {
          throw new Error(`Categories API error: ${categoriesResponse.statusText}`)
        }

        const [menuData, categoriesData] = await Promise.all([menuResponse.json(), categoriesResponse.json()])

        if (!Array.isArray(menuData) || !Array.isArray(categoriesData)) {
          throw new Error("Invalid data format received from API")
        }

        setMenuItems(menuData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load menu items. Please try again later.")
        toast.error("Failed to load menu items")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }))
  }

  const getImageSrc = (item: MenuItem, small = false) => {
    if (imageErrors[item.id] || !item.image) {
      return small ? FALLBACK_THUMBNAIL : FALLBACK_IMAGE
    }
    return getSafeImageUrl(item.image)
  }

  const handleAddItem = () => {
    router.push("/restaurant/menu-items/add")
  }

  const handleEditItem = (item: MenuItem) => {
    router.push(`/restaurant/menu-items/edit/${item.id}`)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/restaurant/menu/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      setMenuItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success("Menu item deleted successfully")
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete menu item")
    }
  }

  // Filter and sort menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory
    const matchesAvailability = !filterAvailable || item.isAvailable
    const matchesPopular = !filterPopular || item.isPopular

    return matchesSearch && matchesCategory && matchesAvailability && matchesPopular
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-200 rounded-full animate-spin border-t-rose-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading menu items...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
              Menu Items
            </h1>
            <p className="text-gray-600">Manage your restaurant's menu items and categories</p>
          </div>
          <Button
            onClick={handleAddItem}
            className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search items by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-[200px] border-rose-200 focus:border-rose-400 focus:ring-rose-400">
                  <SelectValue placeholder="Select category" />
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full lg:w-[200px] border-rose-200 focus:border-rose-400 focus:ring-rose-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filterAvailable ? "default" : "outline"}
                onClick={() => setFilterAvailable(!filterAvailable)}
                className={
                  filterAvailable
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600"
                    : "border-rose-200 text-rose-700 hover:bg-rose-50"
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Available Only
              </Button>
              <Button
                variant={filterPopular ? "default" : "outline"}
                onClick={() => setFilterPopular(!filterPopular)}
                className={
                  filterPopular
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                    : "border-rose-200 text-rose-700 hover:bg-rose-50"
                }
              >
                <Star className="mr-2 h-4 w-4" />
                Popular Only
              </Button>
            </div>
          </div>
        </div>

        {/* View Toggle and Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-rose-100">
            <TabsList className="grid w-full grid-cols-2 bg-rose-50 rounded-xl">
              <TabsTrigger
                value="grid"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grid View
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-rose-100 bg-white group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={getImageSrc(item) || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={() => handleImageError(item.id)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {item.isPopular && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                      {!item.isAvailable && (
                        <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">{item.name}</CardTitle>
                      <span className="text-xl font-bold text-rose-600 whitespace-nowrap">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <CardDescription className="text-gray-600 line-clamp-2">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="border-rose-200 text-rose-700">
                        {item.category.name}
                      </Badge>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {item.calories && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            <span>{item.calories} cal</span>
                          </div>
                        )}
                        {item.prepTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{item.prepTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(item.tags || "[]")
                        .slice(0, 3)
                        .map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-rose-50 text-rose-700 border-rose-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      {JSON.parse(item.tags || "[]").length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600">
                          +{JSON.parse(item.tags || "[]").length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2 pt-0">
                    <Button
                      variant="outline"
                      onClick={() => handleEditItem(item)}
                      className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-rose-50 hover:bg-rose-50">
                    <TableHead className="font-semibold text-rose-900">Item</TableHead>
                    <TableHead className="font-semibold text-rose-900">Category</TableHead>
                    <TableHead className="font-semibold text-rose-900">Price</TableHead>
                    <TableHead className="font-semibold text-rose-900">Status</TableHead>
                    <TableHead className="font-semibold text-rose-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-rose-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden">
                            <Image
                              src={getImageSrc(item, true) || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              onError={() => handleImageError(item.id)}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                            <div className="text-sm text-gray-500 truncate">{item.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.calories && (
                                <Badge variant="outline" className="text-xs border-rose-200 text-rose-700">
                                  <Flame className="h-3 w-3 mr-1" />
                                  {item.calories} cal
                                </Badge>
                              )}
                              {item.prepTime && (
                                <Badge variant="outline" className="text-xs border-rose-200 text-rose-700">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {item.prepTime}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-rose-200 text-rose-700">
                          {item.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-rose-600">${item.price.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.isAvailable ? (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unavailable
                            </Badge>
                          )}
                          {item.isPopular && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-rose-50">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-rose-200">
                            <DropdownMenuItem
                              onClick={() => handleEditItem(item)}
                              className="hover:bg-rose-50 focus:bg-rose-50"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {sortedItems.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
            <div className="w-24 h-24 mx-auto mb-6 bg-rose-50 rounded-full flex items-center justify-center">
              <ImagePlus className="h-12 w-12 text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-500 mb-6">There are no menu items matching your current filters.</p>
            <Button
              onClick={handleAddItem}
              className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Item
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, ImagePlus, Tag, DollarSign, X, ChevronDown, Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { use } from "react"
import { ImageUpload } from "@/components/image-upload"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface Category {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  price: number
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: {
    firstName: string
    lastName: string
  }
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
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
      price: number
    }
  }[]
  reviews: Review[]
}

export default function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: "",
    tags: [] as string[],
    isAvailable: true,
    isPopular: false,
    calories: "",
    prepTime: "",
    services: [] as string[]
  })
  const [isDragging, setIsDragging] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")
  const [newService, setNewService] = useState("")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [open, setOpen] = useState(false)

  // Fetch categories, services, and menu item data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [categoriesResponse, servicesResponse, menuItemResponse] = await Promise.all([
          fetch('/api/restaurant/categories', {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }),
          fetch('/api/restaurant/services', {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }),
          fetch(`/api/restaurant/menu/${resolvedParams.id}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
        ])

        if (!categoriesResponse.ok || !servicesResponse.ok || !menuItemResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [categoriesData, servicesData, menuItemData] = await Promise.all([
          categoriesResponse.json(),
          servicesResponse.json(),
          menuItemResponse.json()
        ])

        setCategories(categoriesData)
        setServices(servicesData)
        setReviews(menuItemData.reviews)
        
        // Set selected services from the menu item's services
        const selectedServices = menuItemData.services.map((s: { service: { id: string; name: string; price: number } }) => ({
          id: s.service.id,
          name: s.service.name,
          price: s.service.price
        }))
        setSelectedServices(selectedServices)
        
        // Parse tags from the menu item
        const parsedTags = JSON.parse(menuItemData.tags || '[]')
        
        // Set form data from menu item
        setFormData({
          name: menuItemData.name,
          description: menuItemData.description,
          price: menuItemData.price.toString(),
          categoryId: menuItemData.categoryId || "",
          image: menuItemData.image || "",
          tags: parsedTags,
          isAvailable: menuItemData.isAvailable,
          isPopular: menuItemData.isPopular,
          calories: menuItemData.calories?.toString() || "",
          prepTime: menuItemData.prepTime || "",
          services: selectedServices.map(s => s.id)
        })

        if (menuItemData.image) {
          setPreviewImage(menuItemData.image)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      }
    }
    

    fetchData()
  }, [resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate categoryId
      if (!formData.categoryId) {
        toast.error("Please select a category")
        setIsLoading(false)
        return
      }
      
      // Format services data correctly
      const formattedServices = selectedServices.map(service => ({
        serviceId: service.id,
        price: parseFloat(service.price.toString())
      }))

      console.log('Form Data:', formData)
      console.log('Selected Services:', selectedServices)
      console.log('Formatted Services:', formattedServices)
      
      const requestBody = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        image: formData.image,
        tags: JSON.stringify(formData.tags),
        isAvailable: formData.isAvailable,
        isPopular: formData.isPopular,
        calories: formData.calories ? parseInt(formData.calories) : null,
        prepTime: formData.prepTime,
        services: formattedServices
      }

      console.log('Request Body:', requestBody)
      
      const response = await fetch(`/api/restaurant/menu/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        throw new Error(error.message || 'Failed to update menu item')
      }

      toast.success('Menu item updated successfully')
      router.push('/restaurant/menu-items')
    } catch (error) {
      console.error('Error updating menu item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update menu item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleServiceSelect = (service: Service) => {
    console.log('Selecting service:', service)
    if (!selectedServices.some(s => s.id === service.id)) {
      setSelectedServices(prev => [...prev, service])
    }
    setNewService("")
    setOpen(false)
  }

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId))
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(id => id !== serviceId)
    }))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag.trim()]
        }))
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
        setFormData(prev => ({ ...prev, image: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
        setFormData(prev => ({ ...prev, image: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }))
    setPreviewImage(url)
  }

  const handleImageUploadError = (error: string) => {
    toast.error(error)
  }

  const handleAddNewService = () => {
    if (newService.trim()) {
      const existingService = services.find(s => 
        s.name.toLowerCase() === newService.trim().toLowerCase()
      )

      if (existingService) {
        console.log('Using existing service:', existingService)
        handleServiceSelect(existingService)
      } else {
        // Create a new service object with a temporary ID
        const newServiceObj: Service = {
          id: `temp-${Date.now()}`,
          name: newService.trim(),
          price: newServicePrice ? parseFloat(newServicePrice) : 0
        }
        console.log('Creating new service:', newServiceObj)
        setSelectedServices(prev => [...prev, newServiceObj])
        setNewService("")
        setNewServicePrice("")
        setOpen(false)
      }
    }
  }

  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Menu Item</CardTitle>
          <CardDescription>Update the details below to modify the menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange('categoryId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category">
                      {categories.find(c => c.id === formData.categoryId)?.name || "Select a category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.categoryId && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-sm">
                      {categories.find(c => c.id === formData.categoryId)?.name}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Services</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {newService || "Select or type services..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Type to search or add new service..."
                        value={newService}
                        onValueChange={setNewService}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="flex flex-col gap-2 p-2">
                            <div className="flex items-center justify-between">
                              <span>No service found.</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Enter price"
                                value={newServicePrice}
                                onChange={(e) => setNewServicePrice(e.target.value)}
                                className="w-32"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddNewService}
                                className="h-8"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add "{newService}"
                              </Button>
                            </div>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {services
                            .filter(service => 
                              service.name.toLowerCase().includes(newService.toLowerCase()) &&
                              !selectedServices.some(s => s.id === service.id)
                            )
                            .map(service => (
                              <CommandItem
                                key={service.id}
                                value={service.name}
                                onSelect={() => handleServiceSelect(service)}
                              >
                                {service.name} (${service.price.toFixed(2)})
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedServices.map(service => (
                    <Badge
                      key={service.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {service.name} (${service.price.toFixed(2)})
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="pl-10"
                    placeholder="Type and press Enter to add tags"
                  />
                </div>
                {formData.tags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Current Tags: {formData.tags.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  name="calories"
                  type="number"
                  value={formData.calories}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prepTime">Preparation Time</Label>
                <Input
                  id="prepTime"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleInputChange}
                  placeholder="e.g., 15-20 minutes"
                />
              </div>

              <div className="space-y-4 col-span-2">
                <Label>Image</Label>
                <ImageUpload
                  onUploadSuccess={handleImageUpload}
                  onUploadError={handleImageUploadError}
                  value={formData.image}
                  className="w-full"
                  previewClassName="max-h-48"
                />
                {/* {previewImage && (
                  <div className="mt-2">
                    <img 
                      src={previewImage} 
                      alt="Current item image" 
                      className="max-h-48 rounded-md"
                    />
                  </div>
                )} */}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleSwitchChange('isAvailable', checked)}
                />
                <Label htmlFor="isAvailable">Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => handleSwitchChange('isPopular', checked)}
                />
                <Label htmlFor="isPopular">Popular</Label>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Reviews</h3>
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {review.user.firstName} {review.user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                  />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm">{review.comment}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No reviews yet</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/restaurant/menu-items')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
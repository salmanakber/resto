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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ImageUpload } from "@/components/image-upload"

interface Category {
  id: string
  name: string
  parentId: string | null
  children?: Category[]
}

interface Service {
  id: string
  name: string
  price?: string
}

export default function AddMenuItemPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryIds: [] as string[],
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

  // Fetch categories and services on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, servicesResponse] = await Promise.all([
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
          })
        ])

        if (!categoriesResponse.ok || !servicesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [categoriesData, servicesData] = await Promise.all([
          categoriesResponse.json(),
          servicesResponse.json()
        ])

        // Build category tree
        const categoryMap = new Map<string, Category>()
        const rootCategories: Category[] = []

        categoriesData.forEach((category: Category) => {
          categoryMap.set(category.id, { ...category, children: [] })
        })

        categoriesData.forEach((category: Category) => {
          const mappedCategory = categoryMap.get(category.id)!
          if (category.parentId) {
            const parent = categoryMap.get(category.parentId)
            if (parent) {
              parent.children!.push(mappedCategory)
            }
          } else {
            rootCategories.push(mappedCategory)
          }
        })

        setCategories(rootCategories)
        setServices(servicesData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // First, create any new services that don't exist
      const newServices = selectedServices.filter(service => service.id.startsWith('temp-'))
      const existingServiceIds = selectedServices.filter(service => !service.id.startsWith('temp-')).map(s => s.id)

      let createdServiceIds: string[] = []
      if (newServices.length > 0) {
        const createServicesResponse = await fetch('/api/restaurant/services/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            services: newServices.map(service => ({ 
              name: service.name,
              price: service.price 
            }))
          })
        })
        console.log('createServicesResponse', createServicesResponse);

        if (!createServicesResponse.ok) {
          throw new Error('Failed to create new services')
        }

        const createdServices = await createServicesResponse.json()
        createdServiceIds = createdServices.map((service: Service) => service.id)
      }

      // Combine existing and newly created service IDs
      const allServiceIds = [...existingServiceIds, ...createdServiceIds]

      // Now create the menu item with all service IDs
      const response = await fetch('/api/restaurant/menu/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          categoryIds: selectedCategories.map(cat => cat.id),
          services: allServiceIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create menu item')
      }

      toast.success('Menu item created successfully')
      router.push('/restaurant/menu-items')
    } catch (error) {
      console.error('Error creating menu item:', error)
      toast.error('Failed to create menu item')
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

  const handleCategorySelect = (category: Category) => {
    if (selectedCategories.some(cat => cat.id === category.id)) {
      setSelectedCategories(prev => prev.filter(cat => cat.id !== category.id))
    } else {
      setSelectedCategories(prev => [...prev, category])
    }
  }

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategories(prev => prev.filter(cat => cat.id !== categoryId))
  }

  const handleServiceSelect = (service: Service) => {
    if (!selectedServices.some(s => s.id === service.id)) {
      setSelectedServices(prev => [...prev, service])
    }
    setNewService("")
    setNewServicePrice("")
    setOpen(false)
  }

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId))
  }

  const handleAddNewService = () => {
    if (newService.trim()) {
      const existingService = services.find(s => 
        s.name.toLowerCase() === newService.trim().toLowerCase()
      )

      if (existingService) {
        handleServiceSelect(existingService)
      } else {
        // Create a new service object with a temporary ID
        const newServiceObj: Service = {
          id: `temp-${Date.now()}`,
          name: newService.trim(),
          price: newServicePrice
        }
        setSelectedServices(prev => [...prev, newServiceObj])
        setNewService("")
        setNewServicePrice("")
        setOpen(false)
      }
    }
  }

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map(category => (
      <div key={category.id}>
        <DropdownMenuCheckboxItem
          checked={selectedCategories.some(cat => cat.id === category.id)}
          onCheckedChange={() => handleCategorySelect(category)}
          className={cn(
            "flex items-center gap-2",
            level > 0 && "pl-6"
          )}
        >
          {category.name}
          {selectedCategories.some(cat => cat.id === category.id) && (
            <Check className="h-4 w-4 ml-auto" />
          )}
        </DropdownMenuCheckboxItem>
        {category.children && category.children.length > 0 && (
          <div className="pl-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image: url }))
  }

  const handleImageUploadError = (error: string) => {
    toast.error(error)
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Menu Item</CardTitle>
          <CardDescription>Fill in the details below to add a new menu item</CardDescription>
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
                <Label>Categories</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      Select categories
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-auto">
                    {renderCategoryTree(categories)}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map(category => (
                    <Badge
                      key={category.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {category.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(category.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
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
                                {service.name}
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
                      {service.name} {service.price && `($${service.price})`}
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
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
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
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type and press Enter to add tags"
                    className="flex-1 min-w-[200px] border-0 focus-visible:ring-0"
                  />
                </div>
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
                  placeholder="e.g., 15 mins"
                />
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

            <div className="space-y-4 col-span-2">
              <Label>Image</Label>
              <ImageUpload
                onUploadSuccess={handleImageUpload}
                onUploadError={handleImageUploadError}
                value={formData.image}
                className="w-full"
                previewClassName="max-h-48"
              />
            </div>

            <div className="flex items-center space-x-4">
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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Menu Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
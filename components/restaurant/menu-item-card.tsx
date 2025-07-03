"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Minus, Plus, ShoppingCart, Utensils, Loader2, Star, StarHalf, Star as StarEmpty } from "lucide-react"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  price: number
  description?: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  categoryId: string
  isAvailable: boolean
  isPopular: boolean
  tags: string[]
  services: Service[]
  quantity?: number
  selectedAddons?: Service[]
  tableNumber?: string
  prepTime?: number
}

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
  viewMode: "table" | "list"
  orderType: "delivery" | "pickup" | "dine-in"
  currency: { symbol: string } | null
}

export const MenuItemCard = React.memo(({ item, onAddToCart, viewMode, orderType, currency }: MenuItemCardProps) => {
  const [quantity, setQuantity] = useState(1)
  const [showAddons, setShowAddons] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState<Service[]>([])
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const tags = typeof item.tags === "string" ? JSON.parse(item.tags || "[]") : item.tags || []

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, prev + change))
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      if (item.services && item.services.length > 0 && !showAddons) {
        setShowAddons(true)
        return
      }

      await onAddToCart({
        ...item,
        quantity,
        selectedAddons,
      })

      setQuantity(1)
      setSelectedAddons([])
      setShowAddons(false)
    } finally {
      setIsAddingToCart(false)
    }
  }

  type Review = {
    rating: number;
  };
  
  function formatReviewCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(count >= 1100 ? 1 : 0) + 'k';
    }
    return count.toString();
  }
  
  function getAverageRating(reviews: Review[]) {
    const totalReviews = reviews.length;
  
    if (totalReviews === 0) {
      return { averageRating: 0, totalReviews: 0, formattedReviews: "0" };
    }
  
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
  
    return {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      formattedReviews: formatReviewCount(totalReviews)
    };
  }
  function getStarRatingIcons(rating: number): ("full" | "half" | "empty")[] {
    const stars: ("full" | "half" | "empty")[] = [];
  
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push("full");
      } else if (rating >= i - 0.5) {
        stars.push("half");
      } else {
        stars.push("empty");
      }
    }
  
    return stars;
  }

  const { averageRating, totalReviews, formattedReviews } = getAverageRating(item.reviews || []);
  const stars = getStarRatingIcons(averageRating);
  

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 hover:shadow-md",
          viewMode === "list" && "flex items-center gap-4",
        )}
      >
        <CardContent className={cn("p-0", viewMode === "list" && "flex items-center gap-4 w-full")}>
          <div className={cn("relative", viewMode === "list" ? "w-[15rem] h-[15rem] flex-shrink-0" : "w-full h-48")}>
            <img
              src={item.image || "/placeholder.png"}
              alt={item.name}
              className={cn("object-cover", viewMode === "list" ? "w-full h-full rounded-l-lg" : "w-full h-full")}
              loading="lazy"
            />
            {item.isPopular && <Badge className="absolute top-2 left-2 bg-[#e41e3f] hover:bg-[#e41e3f]">Popular</Badge>}
            {item.services && item.services.length > 0 && (
              <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-600">
                {item.services.length} Add-ons
              </Badge>
            )}
          </div>

          <div className={cn("p-4", viewMode === "list" && "flex-1")}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
              <div className="block ">
              <div className="font-bold text-[#e41e3f] whitespace-nowrap  text-right">
                {currency?.symbol}
                {item.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-1">
                {stars.map((star, index) => (
                  <Star key={index} className={cn("h-4 w-4", star === "full" ? "text-[#e41e3f]" : star === "half" ? "text-[#e41e3f] fill-current" : "text-gray-300")} />
                ))}
                <span className="text-sm text-gray-500">{formattedReviews}</span>
                </div>
              </div>
            </div>

            <div className="relative mb-3">
              <p className={cn("text-sm text-muted-foreground", !showFullDescription && "line-clamp-2")}>
                {item.description}
              </p>
              {item.description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-sm text-[#e41e3f] hover:underline mt-1"
                >
                  {showFullDescription ? "Show less" : "View more"}
                </button>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={isAddingToCart}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleQuantityChange(1)}
                  disabled={isAddingToCart}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="default"
                size="sm"
                className="rounded-full bg-[#e41e3f] hover:bg-[#c01835]"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : orderType === "dine-in" ? (
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    <span className="hidden sm:inline">Dine-in</span>
                  </div>
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddons} onOpenChange={setShowAddons}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Add-ons</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {item.services?.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{service.name}</h4>
                  {service.description && <p className="text-sm text-gray-500 mt-1">{service.description}</p>}
                  <p className="text-sm font-medium text-[#e41e3f] mt-1">
                    {currency?.symbol}
                    {service.price.toFixed(2)}
                  </p>
                </div>
                <Switch
                  checked={selectedAddons.some((addon) => addon.id === service.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAddons((prev) => [...prev, service])
                    } else {
                      setSelectedAddons((prev) => prev.filter((addon) => addon.id !== service.id))
                    }
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4">
            <Button className="bg-[#e41e3f] hover:bg-[#c01835]" onClick={handleAddToCart} disabled={isAddingToCart}>
              {isAddingToCart ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})

MenuItemCard.displayName = "MenuItemCard"

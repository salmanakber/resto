"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Star, Menu, Users, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Badge } from "@/components/ui/badge"

interface RestaurantMetricsProps {
  restaurants: {
    id: string
    name: string
    email: string
    metrics: {
      totalRevenue: number
      totalOrders: number
      totalMenuItems: number
      totalReviews: number
      averageRating: number
    }
  }[]
}

export function RestaurantMetrics({ restaurants }: RestaurantMetricsProps) {
  const [restaurantCards, setRestaurantCards] = useState(restaurants)

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(restaurantCards)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setRestaurantCards(items)
  }

  const getPerformanceBadge = (revenue: number) => {
    if (revenue > 10000) return { label: "Top Performer", variant: "default" as const }
    if (revenue > 5000) return { label: "Good", variant: "secondary" as const }
    return { label: "Growing", variant: "outline" as const }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restaurant Performance</h2>
          <p className="text-muted-foreground">Drag and drop to reorder restaurants</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {restaurantCards.length} Restaurants
        </Badge>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="restaurants">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {restaurantCards.map((restaurant, index) => {
                const performanceBadge = getPerformanceBadge(restaurant.metrics.totalRevenue)

                return (
                  <Draggable key={restaurant.id} draggableId={restaurant.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group transition-all duration-200 ${
                          snapshot.isDragging ? "rotate-2 scale-105" : ""
                        }`}
                      >
                        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-rose-50/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-600" />

                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-rose-700 transition-colors">
                                  {restaurant.name}
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-1">{restaurant.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge {...performanceBadge} className="text-xs">
                                  {performanceBadge.label}
                                </Badge>
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-1 rounded-md hover:bg-rose-100 transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100">
                                <div className="p-2 rounded-full bg-rose-500 text-white">
                                  <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-600">Revenue</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    ${Number(restaurant.metrics.totalRevenue).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                                <div className="p-2 rounded-full bg-orange-500 text-white">
                                  <ShoppingCart className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-600">Orders</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {restaurant.metrics.totalOrders.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <Menu className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Menu Items</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {restaurant.metrics.totalMenuItems}
                                </p>
                              </div>

                              <div className="text-center p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                                <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1 fill-current" />
                                <p className="text-xs text-gray-600">Rating</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {restaurant.metrics.averageRating.toFixed(1)}
                                </p>
                              </div>

                              <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                                <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                                <p className="text-xs text-gray-600">Reviews</p>
                                <p className="text-sm font-semibold text-gray-900">{restaurant.metrics.totalReviews}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

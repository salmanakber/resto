"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Star, ThumbsUp, MessageSquare, CheckCircle, Utensils, Clock, MapPin } from "lucide-react"

interface FeedbackData {
  userId: string
  itemId: string
  restaurantId: string
  customerName: string
  itemName: string
  restaurantName: string
  orderType: "dine-in" | "pickup"
  orderDate: string
  tableNumber: string
}

export default function FeedbackPage() {
  const searchParams = useSearchParams()

  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [itemData, setItemData] = useState<any[]>([])
  const [existingFeedback, setExistingFeedback] = useState<any[]>([])

  useEffect(() => {
    const userId = searchParams.get("userId");
    const itemIdParam = searchParams.get("itemId");
    const restaurantId = searchParams.get("restaurantId");
    const orderId = searchParams.get("orderId");
  
    // Only fetch once when searchParams change
    if (userId && itemIdParam && restaurantId && orderId && itemData.length === 0) {
      fetchFeedbackData(userId, itemIdParam, restaurantId, orderId);
    }
  
    // Run review check only when itemData is available
    if (itemData.length > 0 && itemIdParam) {
      const reviewedItemIds = itemData.map((item) => String(item.id));
      const incomingItemIds = itemIdParam.includes(",")
        ? Array.from(new Set(itemIdParam.split(",").map((id) => id.trim())))
        : [itemIdParam.trim()];
      const alreadyReviewed = incomingItemIds.some((id) =>
        reviewedItemIds.includes(id)
      );
        const alreadyReviewedOrderId = existingFeedback.some((feedback) =>
          feedback.orderId === orderId
        );
      if (itemData.length > 0 && alreadyReviewed && alreadyReviewedOrderId) {
        
        console.warn("You have already submitted feedback for one or more of these items.");
        toast.error("Feedback already submitted for one or more items.");
        setFeedbackData(null)
      }
    }
  }, [searchParams, itemData]);
  

  const fetchFeedbackData = async (userId: string, itemIdParam: string, restaurantId: string, orderId: string) => {
    try {
      const user = await fetch(`/api/users/${userId}`)
      const restaurant = await fetch(`/api/users/${restaurantId}/resto`)
      const item = await fetch(`/api/feedback?restaurantId=${restaurantId}&orderId=${orderId}`)
      const userData = await user.json()
      const restaurantData = await restaurant.json()
      const itemData = await item.json()
      const orderData = itemData.order
      setExistingFeedback(itemData.feedback)
      let itemName = "";
      let itemId = "";
      if (itemIdParam) {
        // Split and deduplicate item IDs
        const itemIds = Array.from(
          new Set(itemIdParam.includes(",") ? itemIdParam.split(",") : [itemIdParam])
        );
      
        // Filter matched items based on unique IDs
        const matchedItems = itemData.menuItems.filter((item: any) =>
          itemIds.includes(item.id)
        );
      
        // Combine unique item names
        itemName = matchedItems.map((item: any) => item.name).join(",");
      }
      const ActualData: FeedbackData = {
        userId,
        itemId,
        restaurantId,
        customerName: userData.firstName + " " + userData.lastName,
        itemName: itemName,
        restaurantName: restaurantData.restaurantName,
        orderType: orderData.orderType,
        orderDate: orderData.createdAt,
      }

      setFeedbackData(ActualData)
      setItemData(itemData.menuItems)
    } catch (error) {
      console.error("Error fetching feedback data:", error)
      toast.error("Failed to load feedback information")
    } finally {
      setIsLoading(false)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error("Please select a rating before submitting")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulated API call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Here you would send the feedback data to your API
      const feedbackPayload = {
        userId: searchParams.get("userId"),
        itemId: searchParams.get("itemId"),
        restaurantId: searchParams.get("restaurantId"),
        orderId: searchParams.get("orderId"),
        rating,
        comment,
        timestamp: new Date().toISOString(),
      }
      const response = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify(feedbackPayload),
      })
      if (response.ok) {
        setIsSubmitted(true)
      }
      const feedback = await response.json()
      

      setIsSubmitted(true)
      toast.success("Your feedback has been submitted successfully")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      return (
        <button
          key={index}
          type="button"
          className={`text-4xl transition-all duration-200 transform hover:scale-110 ${
            starValue <= (hoverRating || rating) ? "text-yellow-400" : "text-gray-300"
          }`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <Star className="w-8 h-8 fill-current" />
        </button>
      )
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-200 rounded-full animate-spin border-t-rose-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading feedback form...</p>
        </div>
      </div>
    )
  }

  if (!feedbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="border-0 shadow-lg max-w-md">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Invalid Feedback Link</h3>
            <p className="text-gray-600">The feedback link appears to be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center">
        <Card className="border-0 shadow-xl max-w-md">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600"></div>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your feedback has been submitted successfully. We appreciate you taking the time to share your experience
              with us.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-1 mb-2">
                {Array.from({ length: rating }, (_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-green-700 font-medium">You rated: {
              feedbackData.itemName.includes(",")
    ? feedbackData.itemName
        .split(",")
        .filter((v, i, a) => a.indexOf(v) === i) // removes duplicates
        .map((item, index, arr) => (
          <>
                <span className="list-none text-gray-800">{item}</span>
            {index < arr.length - 1 && <span className="text-left"><br></br> </span>}
          </>
        ))
    : (
      <span className="text-gray-800">
        {feedbackData.itemName}
      </span>
    )
              }</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-rose-500 to-red-600 rounded-full mb-4">
            <ThumbsUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
            Rate Your Experience
          </h1>
          <p className="text-gray-600">We'd love to hear about your dining experience</p>
        </div>

        {/* Order Details */}
        <Card className="border-0 shadow-lg mb-8">
          <div className="h-2 bg-gradient-to-r from-rose-500 to-red-600"></div>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <Utensils className="w-5 h-5 mr-2" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Restaurant</p>
                
                <p className="font-semibold text-gray-800">{feedbackData.restaurantName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="font-semibold text-gray-800">{feedbackData.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Item</p>
                <span className="text-sm text-gray-800 list-decimal">
                {
  feedbackData.itemName.includes(",")
    ? feedbackData.itemName
        .split(",")
        .filter((v, i, a) => a.indexOf(v) === i) // removes duplicates
        .map((item, index, arr) => (
          <>
                <span className="list-none text-gray-800">{item}</span>
            {index < arr.length - 1 && <span className="text-left"><br></br> </span>}
          </>
        ))
    : (
      <span className="text-gray-800">
        {feedbackData.itemName}
      </span>
    )
}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Type</p>
                <Badge
                  className={`${
                    feedbackData.orderType === "dine-in"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-green-100 text-green-800 border-green-200"
                  } border font-medium`}
                >
                  {feedbackData.orderType === "dine-in" ? (
                    <>
                      <Utensils className="w-3 h-3 mr-1" />
                      Dine-in
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 mr-1" />
                      Pickup
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              Order Date: {new Date(feedbackData.orderDate).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-red-600 text-white">
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Your Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Rating */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                How would you rate ?

                </h3>
                <div className="flex justify-center space-x-2 mb-4">{renderStars()}</div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-5 h-5 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Your feedback helps us improve our service and food quality</p>
        </div>
      </div>
    </div>
  )
}

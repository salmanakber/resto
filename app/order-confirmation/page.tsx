"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, QrCode, Copy } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface OrderDetails {
  id: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    selectedAddons?: Array<{
      name: string;
      price: number;
    }>;
  }>;
  total: number;
  status: string;
  pickupTime: string;
  otp: string;
  qrCode: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  location: {
    name: string;
    address: string;
  };
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<{ symbol: string } | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        console.log(response)
        if (!response.ok) throw new Error("Failed to fetch order");
        const data = await response.json();
        
      
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const copyOTP = () => {
    if (order?.otp) {
      navigator.clipboard.writeText(order.otp);
      toast.success("OTP copied to clipboard");
    }
  };

  const loadCurrencySettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "currency", isPublic: true }),
      })

      if (response.ok) {
        const data = await response.json()
        const parsedCurrency = JSON.parse(data.value)
        const defaultCurrency =
          Object.entries(parsedCurrency).find(([_, value]) => (value as any).default)?.[0] || "USD"
        setCurrency(parsedCurrency[defaultCurrency] || { symbol: "$" })
      }
    } catch (error) {
      console.error("Error loading currency settings:", error)
    }
  }

  useEffect(() => {
    loadCurrencySettings()
  }, [])

  const formatCurrency = (amount: number) => {
    const symbol = currency?.symbol || "$"
    return `${symbol}${amount.toFixed(2)}`
  }
 

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-600">The order you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  if(order?.orderType === "dine-in")
  {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <p className="text-gray-600">This order is dine-in order the order confirmation page is not available for dine-in orders.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">Thank you for your order</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 ">
              <p className="text-sm text-gray-600">Order Number: {order.orderNumber.replace("ORDER-", "")}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pickup Location</p>
              <p className="font-medium">{order.location.name}</p>
              <p className="text-sm text-gray-600">{order.location.address}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Pickup Time</p>
              <p className="font-medium">{order.pickupTime}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Items</p>
              {JSON.parse(order?.items).map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.name}
                    {item.selectedAddons?.map((addon: any) => (
                      <small key={addon.name} className="ml-2">
                        + {addon.quantity} × {addon.name} {formatCurrency(addon.price)}
                      </small>
                    ))}

                  </span>
                  {/* {item.selectedAddons?.reduce((total: number, addon: any) => total + addon.price || 0)} */}
                  <span>
                            {/* Item base total price */}
              {/* Addon total price */}
              {formatCurrency(
          item.selectedAddons?.reduce(
            (total: number, addon: any) => total + (addon.price || 0) ,
            0
          ) + (item.price || 0)
        )}
                  </span>
                </div>
              ))}
            </div>

            <Separator />
              
            {order?.discountUsed && JSON.parse(order?.discountUsed).amount > 0 && ( 
            <div className="flex justify-between font-sm-bold">
              <span>Discount</span>
              <span>-{formatCurrency(JSON.parse(order?.discountUsed).amount)}</span>
            </div>
            )}
            <div className="flex justify-between">
             <span><span className="font-bold">Total </span><small>(Tax included)</small></span>
              <span>{formatCurrency(Number(order?.totalAmount || 0))}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pickup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Image
                  src={order.qrCode}
                  alt="Order QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Your Pickup OTP</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold tracking-wider">{order.otp}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyOTP}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Show this OTP or scan the QR code at pickup
                </p>
              </div>
            </div>

            <Separator />
            {console.log(order)}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Customer Details</p>
              <p className="font-medium">{order?.customerDetails.name}</p>
              <p className="text-sm text-gray-600">{order?.customerDetails.email}</p>
              <p className="text-sm text-gray-600">{order?.customerDetails.phone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
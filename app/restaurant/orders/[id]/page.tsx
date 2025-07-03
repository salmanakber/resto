"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  User, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  ChefHat,
  MessageSquare,
  Timer,
  MoreVertical,
  Check
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select"

// Types
type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  options?: string[]
}

interface OrderFeedback {
  rating: number
  comment: string
  date: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderType: "dine-in" | "pickup" | "delivery"
  tableNumber?: string
  deliveryAddress?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
  status: OrderStatus
  paymentMethod: "cash" | "credit_card" | "debit_card" | "mobile_payment"
  placedAt: string  // ISO date string
  estimatedReadyTime?: string
  completedAt?: string
  notes?: string
  specialInstructions?: string
  feedback?: OrderFeedback
}

// Move safeFixed to the top level so it is available everywhere
function safeFixed(val: any, digits = 2) {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  // State to track if feedback modal is open
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  
  // State for status update
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("")

  // After the useState declarations for statusUpdateOpen and newStatus, add:
  const [kitchenAssignOpen, setKitchenAssignOpen] = useState(false)
  const [selectedChef, setSelectedChef] = useState("")
  const [prepTime, setPrepTime] = useState("")
  const [priorityLevel, setPriorityLevel] = useState("normal")
  const [kitchenNotes, setKitchenNotes] = useState("")

  // After the other useState declarations, add:
  const [isLoading, setIsLoading] = useState(false)

  // Remove mockOrders and use API fetch
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/restaurant/orders?id=${orderId}`)
      .then(res => res.json())
      .then(data => {
       
        if (data.order) {
          setOrder(data.order)
        } else if (data.orders) {
          const found = data.orders.find((o: any) => o.id === orderId)
          
          setOrder(found || null)
        } else {
          setOrder(null)
          setError('Order not found')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to fetch order')
        setLoading(false)
      })
  }, [orderId])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!order) return <div className="p-8">Order not found.</div>

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Function to get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "new": return "bg-blue-500"
      case "preparing": return "bg-yellow-500"
      case "ready": return "bg-green-500"
      case "completed": return "bg-gray-500"
      case "cancelled": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  // Function to get status icon
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "cancelled": return <XCircle className="h-5 w-5 text-red-500" />
      case "ready": return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      default: return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }
  
  // Function to update order status (mock implementation)
  const updateOrderStatus = (status: OrderStatus) => {
    // In a real app, this would make an API call
    console.log(`Updating order ${order.orderNumber} status to ${status}`)
    setStatusUpdateOpen(false)
    // Here you would update the order status in your state
  }

  // Function to handle kitchen assignment (mock implementation)
  const assignToKitchen = () => {
    setIsLoading(true)
    // In a real app, this would make an API call
    console.log(`Assigning order ${order.orderNumber} to kitchen:`, {
      chef: selectedChef,
      prepTime,
      priorityLevel,
      kitchenNotes
    })
    
    setTimeout(() => {
      setIsLoading(false)
      setKitchenAssignOpen(false)
      // Here you would update the order status in your state
      // For demo purposes, let's just set the status to "preparing"
      console.log("Order assigned to kitchen and status updated to preparing")
    }, 1000)
  }

  // Function to handle receipt printing (mock implementation)
  const printReceipt = () => {
    console.log("Navigating to print receipt for order:", order.orderNumber)
    
    // Navigate to the print page
    router.push(`/restaurant/orders/${order.id}/print`)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Back button and actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setKitchenAssignOpen(true)}
            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
            disabled={order.status !== "new"}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Assign to Kitchen
          </Button>
          <Button variant="outline" size="sm" onClick={printReceipt}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[#e41e3f] hover:bg-[#c01835] text-white" 
                size="sm" 
                disabled={order.status === "completed" || order.status === "cancelled"}
              >
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Change the status of order #{order.orderNumber}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>New Status</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  >
                    <option value="" disabled>Select status</option>
                    <option value="new">New</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Status Note (Optional)</Label>
                  <Textarea placeholder="Add a note about this status update" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>Cancel</Button>
                <Button 
                  className="bg-[#e41e3f] hover:bg-[#c01835] text-white" 
                  onClick={() => newStatus && updateOrderStatus(newStatus as OrderStatus)}
                  disabled={!newStatus}
                >
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Order Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Placed on {formatDate(order.placedAt)}</span>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center">
          <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm text-white`}>
            {getStatusIcon(order.status)}
            {/* <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span> */}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Summary of the ordered items and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      {item.options && item.options.length > 0 
                        ? item.options.map((option, i) => (
                            <Badge key={i} variant="outline" className="mr-1">
                              {option}
                            </Badge>
                          )) 
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                  </TableRow>
                ))} */}
              </TableBody>
            </Table>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Subtotal</span>
                <span>${safeFixed(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Tax</span>
                <span>${safeFixed(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed pt-2">
                <span className="font-bold">Total</span>
                <span className="font-bold">${safeFixed(order.total)}</span>
              </div>
            </div>
            
            {order.specialInstructions && (
              <div className="mt-6 bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Special Instructions:</h4>
                <p className="text-sm">{order.specialInstructions}</p>
              </div>
            )}
            
            {order.notes && (
              <div className="mt-4 bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">Order Notes:</h4>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer and Payment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  {/* <AvatarFallback>{order.customerName.charAt(0)}</AvatarFallback> */}
                </Avatar>
                <div>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">Customer</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{order.customerPhone}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {order.orderType === "dine-in" ? (
                  <>
                    <MapPin className="h-5 w-5 text-[#e41e3f]" />
                    <span className="font-medium">Dine-in (Table {order.tableNumber})</span>
                  </>
                ) : order.orderType === "pickup" ? (
                  <>
                    <User className="h-5 w-5 text-[#e41e3f]" />
                    <span className="font-medium">Pickup</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 text-[#e41e3f]" />
                    <span className="font-medium">Delivery</span>
                  </>
                )}
              </div>
              
              {order.orderType === "delivery" && order.deliveryAddress && (
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <div className="font-medium mb-1">Delivery Address:</div>
                  <address className="not-italic">{order.deliveryAddress}</address>
                </div>
              )}
              
              {order.orderType === "pickup" && order.estimatedReadyTime && (
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <div className="font-medium mb-1">Ready for Pickup:</div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(order.estimatedReadyTime)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-[#e41e3f]" />
                <span className="font-medium">
                  {order.paymentMethod === "credit_card" ? "Credit Card" :
                   order.paymentMethod === "debit_card" ? "Debit Card" :
                   order.paymentMethod === "mobile_payment" ? "Mobile Payment" : "Cash"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Transaction ID: TXN-{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Feedback */}
          {order.feedback ? (
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${
                            i < order.feedback!.rating 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-gray-300"
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {formatDate(order.feedback.date)}
                    </span>
                  </div>
                  <p className="text-sm">{order.feedback.comment}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            order.status === "completed" && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No feedback has been submitted for this order yet.</p>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => setFeedbackOpen(true)}
                  >
                    Add Feedback
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
      
      {/* Modals */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Feedback</DialogTitle>
            <DialogDescription>
              Add feedback for order #{order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Rating</Label>
              <div className="flex mt-2">
                {Array(5).fill(0).map((_, i) => (
                  <Star 
                    key={i}
                    className="h-8 w-8 cursor-pointer text-gray-300 hover:text-yellow-400"
                    onClick={() => console.log(`Rated ${i+1} stars`)}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Comment</Label>
              <Textarea placeholder="Share your thoughts about this order..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button className="bg-[#e41e3f] hover:bg-[#c01835] text-white">
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print-only receipt view */}
      <div className="hidden print:block print:p-4">
        {/* Thermal receipt style with monospaced font and dashed lines */}
        <div className="font-mono text-base mx-auto max-w-sm" style={{ maxWidth: "350px" }}>
          {/* Header */}
          <div className="text-center mb-4">
            <div className="uppercase">*** RECEIPT ***</div>
            <div className="text-left flex justify-between text-sm">
              <span>CASHIER #{Math.floor(Math.random() * 10)}</span>
              <span>{new Date(order.placedAt).toLocaleDateString('en-US', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
              })} - {new Date(order.placedAt).toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
            </div>
          </div>
          
          {/* Separator */}
          <div className="border-t border-dashed border-gray-500 my-3"></div>
          
          {/* Items */}
          <div className="mb-3">
            {order.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-10 gap-1 mb-2">
                <div className="col-span-6 overflow-hidden">
                  <div>ITEM {index + 1}</div>
                  <div className="text-sm truncate">{item.name}</div>
                  {item.options && item.options.length > 0 && (
                    <div className="text-xs italic">{item.options.join(", ")}</div>
                  )}
                </div>
                <div className="col-span-4 text-right">
                  <div>${safeFixed(item.price)}</div>
                  {item.quantity > 1 && (
                    <div className="text-sm">x{item.quantity} @ ${safeFixed((item.quantity * item.price))}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Separator */}
          <div className="border-t border-dashed border-gray-500 my-3"></div>
          
          {/* Totals */}
          <div className="mb-3">
            <div className="flex justify-between">
              <span>SUBTOTAL</span>
              <span>${safeFixed(order.subtotal)}</span>
            </div>
            {(order.orderType === "delivery" || order.customerName.includes("Member")) && (
              <div className="flex justify-between text-sm">
                <span>LOYALTY MEMBER</span>
                <span>-$5.00</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>TAX</span>
              <span>${safeFixed(order.tax)}</span>
            </div>
          </div>
          
          {/* Separator */}
          <div className="border-t border-dashed border-gray-500 my-3"></div>
          
          {/* Final total */}
          <div className="flex justify-between font-bold">
            <span>TOTAL AMOUNT</span>
            <span>${safeFixed(order.total)}</span>
          </div>
          
          {/* Payment details */}
          <div className="mt-2">
            <div className="flex justify-between">
              <span>{order.paymentMethod === "cash" ? "CASH" : 
                     order.paymentMethod === "credit_card" ? "CREDIT CARD" : 
                     order.paymentMethod === "debit_card" ? "DEBIT CARD" : "MOBILE"}</span>
              <span>${safeFixed((order.total + 5))}</span>
            </div>
            {order.paymentMethod === "cash" && (
              <div className="flex justify-between">
                <span>CHANGE</span>
                <span>$5.00</span>
              </div>
            )}
          </div>
          
          {/* Separator */}
          <div className="border-t border-dashed border-gray-500 my-3"></div>
          
          {/* Footer */}
          <div className="text-center my-4">
            <div>THANK YOU FOR SHOPPING!</div>
            <div className="my-3 text-sm">ORDER #{order.orderNumber}</div>
          </div>
          
          {/* Barcode */}
          <div className="flex justify-center my-3">
            <svg className="h-12" viewBox="0 0 100 30">
              <rect x="0" y="0" width="2" height="30" />
              <rect x="4" y="0" width="1" height="30" />
              <rect x="7" y="0" width="3" height="30" />
              <rect x="12" y="0" width="1" height="30" />
              <rect x="14" y="0" width="2" height="30" />
              <rect x="17" y="0" width="1" height="30" />
              <rect x="20" y="0" width="3" height="30" />
              <rect x="26" y="0" width="1" height="30" />
              <rect x="30" y="0" width="2" height="30" />
              <rect x="34" y="0" width="1" height="30" />
              <rect x="36" y="0" width="3" height="30" />
              <rect x="41" y="0" width="1" height="30" />
              <rect x="44" y="0" width="2" height="30" />
              <rect x="47" y="0" width="3" height="30" />
              <rect x="52" y="0" width="1" height="30" />
              <rect x="54" y="0" width="3" height="30" />
              <rect x="58" y="0" width="1" height="30" />
              <rect x="62" y="0" width="2" height="30" />
              <rect x="66" y="0" width="1" height="30" />
              <rect x="69" y="0" width="3" height="30" />
              <rect x="74" y="0" width="2" height="30" />
              <rect x="77" y="0" width="1" height="30" />
              <rect x="81" y="0" width="2" height="30" />
              <rect x="85" y="0" width="3" height="30" />
              <rect x="90" y="0" width="1" height="30" />
              <rect x="93" y="0" width="1" height="30" />
              <rect x="97" y="0" width="3" height="30" />
            </svg>
          </div>
          
          {/* Simulated thermal paper edge */}
          <div className="h-4 w-full bg-white" style={{
            clipPath: "polygon(0% 0%, 100% 0%, 95% 100%, 85% 50%, 75% 100%, 65% 50%, 55% 100%, 45% 50%, 35% 100%, 25% 50%, 15% 100%, 5% 50%, 0% 100%)"
          }}></div>
        </div>
      </div>

      {/* Kitchen Assignment Dialog */}
      <Dialog open={kitchenAssignOpen} onOpenChange={setKitchenAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ChefHat className="h-5 w-5 mr-2 text-blue-600" />
              Assign Order to Kitchen
            </DialogTitle>
            <DialogDescription>
              Assign order #{order.orderNumber} to kitchen staff and set preparation details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="chef">Assign to Chef</Label>
              <Select value={selectedChef} onValueChange={setSelectedChef}>
                <SelectTrigger id="chef">
                  <SelectValue placeholder="Select chef" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chef-1">John Smith (Station 1)</SelectItem>
                  <SelectItem value="chef-2">Maria Garcia (Station 2)</SelectItem>
                  <SelectItem value="chef-3">David Wong (Station 3)</SelectItem>
                  <SelectItem value="chef-4">Sarah Johnson (Station 4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prep-time">Estimated Prep Time</Label>
                <Select value={prepTime} onValueChange={setPrepTime}>
                  <SelectTrigger id="prep-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={priorityLevel} onValueChange={setPriorityLevel}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-400 mr-2"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                        Normal
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-orange-400 mr-2"></div>
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                        Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kitchen-notes">Kitchen Notes</Label>
              <Textarea 
                id="kitchen-notes" 
                value={kitchenNotes}
                onChange={(e) => setKitchenNotes(e.target.value)}
                placeholder="Add special instructions for the kitchen staff"
                className="h-24"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setKitchenAssignOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={assignToKitchen}
              disabled={!selectedChef || !prepTime}
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Assign to Kitchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  Timer, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  AlertCircle
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
  specialRequests?: string[];
}

interface Order {
  id: string;
  orderNumber: string;
  table?: string;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  items: OrderItem[];
  status: "new" | "preparing" | "ready" | "completed";
  priority: "normal" | "high" | "rush";
  timeReceived: string;
  estimatedTime: string;
  allergies?: string[];
}

// Mock data for demonstration purposes
const mockNewOrders: Order[] = [
  {
    id: "order-001",
    orderNumber: "K-1001",
    table: "12",
    customerName: "Table 12",
    orderType: "dine-in",
    items: [
      { 
        name: "Chicken Curry Special", 
        quantity: 2,
        specialRequests: ["Extra spicy"]
      },
      { 
        name: "Margherita Pizza", 
        quantity: 1, 
        notes: "Extra cheese",
        specialRequests: ["Thin crust"]
      },
      {
        name: "Garden Salad",
        quantity: 1,
        notes: "Dressing on the side"
      }
    ],
    status: "new",
    priority: "high",
    timeReceived: "2023-06-12T14:30:00Z",
    estimatedTime: "15-20 min",
    allergies: ["Nuts"]
  },
  {
    id: "order-002",
    orderNumber: "K-1002",
    customerName: "John Smith",
    orderType: "takeaway",
    items: [
      { name: "Beef Noodles", quantity: 1 },
      { name: "Watermelon Juice", quantity: 2 },
      { name: "Spring Rolls", quantity: 4 }
    ],
    status: "new",
    priority: "normal",
    timeReceived: "2023-06-12T14:35:00Z",
    estimatedTime: "10-15 min"
  },
  {
    id: "order-003",
    orderNumber: "K-1003",
    table: "5",
    customerName: "Table 5",
    orderType: "dine-in",
    items: [
      { name: "Tuna Soup with Spinach", quantity: 1 },
      { name: "Italian Pasta", quantity: 1 },
      { 
        name: "Cheesy Pizza for Kids", 
        quantity: 1,
        notes: "Cut into small pieces"
      }
    ],
    status: "new",
    priority: "rush",
    timeReceived: "2023-06-12T14:40:00Z",
    estimatedTime: "15-20 min",
    allergies: ["Shellfish", "Dairy"]
  },
  {
    id: "order-004",
    orderNumber: "K-1004",
    customerName: "Sarah Johnson",
    orderType: "delivery",
    items: [
      { 
        name: "Family Feast Bundle", 
        quantity: 1,
        notes: "No cilantro in any dishes"
      },
      { name: "Chocolate Lava Cake", quantity: 2 }
    ],
    status: "new",
    priority: "high",
    timeReceived: "2023-06-12T14:42:00Z",
    estimatedTime: "25-30 min"
  },
  {
    id: "order-005",
    orderNumber: "K-1005",
    table: "8",
    customerName: "Table 8",
    orderType: "dine-in",
    items: [
      { name: "Grilled Sea Bass", quantity: 1 },
      { name: "Truffle Fries", quantity: 1 },
      { name: "Caesar Salad", quantity: 1 }
    ],
    status: "new",
    priority: "normal",
    timeReceived: "2023-06-12T14:45:00Z",
    estimatedTime: "20-25 min"
  }
];

function getTimeAgo(dateString: string) {
  const now = new Date();
  const orderTime = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes === 1) return "1 minute ago";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return "1 hour ago";
  return `${diffInHours} hours ago`;
}

function getPriorityBadgeStyles(priority: Order['priority']) {
  switch (priority) {
    case "rush":
      return "bg-red-50 text-red-700 border-red-200";
    case "high":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "normal":
    default:
      return "bg-green-50 text-green-700 border-green-200";
  }
}

export default function NewOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockNewOrders);
  const [filterPriority, setFilterPriority] = useState<Order['priority'] | 'all'>('all');
  const [filterType, setFilterType] = useState<Order['orderType'] | 'all'>('all');
  const { toast } = useToast();

  // Filter orders based on selected filters
  const filteredOrders = orders.filter(order => {
    if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
    if (filterType !== 'all' && order.orderType !== filterType) return false;
    return true;
  });

  const handleStartPreparing = (orderId: string) => {
    // Update order status in the UI
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: "preparing" } : order
      )
    );
    
    // Show success toast
    toast({
      title: "Order accepted",
      description: `You've started preparing order #${orders.find(o => o.id === orderId)?.orderNumber}`,
      variant: "default",
    });
    
    // In a real app, you would also update the backend
    console.log(`Started preparing order: ${orderId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">New Orders</h1>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-4 w-4" />
                <span>Priority</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterPriority('all')}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('rush')}>
                Rush Orders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('high')}>
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('normal')}>
                Normal Priority
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-4 w-4" />
                <span>Order Type</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('dine-in')}>
                Dine-in Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('takeaway')}>
                Takeaway Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('delivery')}>
                Delivery Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckCircle2 className="h-10 w-10 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No pending orders</h3>
            <p className="text-sm text-muted-foreground mt-1">All orders have been accepted by the kitchen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className={`border-l-4 ${
              order.priority === "rush" ? "border-l-red-600" :
              order.priority === "high" ? "border-l-amber-600" :
              "border-l-green-600"
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={getPriorityBadgeStyles(order.priority)}
                    >
                      {order.priority.toUpperCase()}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="uppercase text-xs"
                    >
                      {order.orderType}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Received {getTimeAgo(order.timeReceived)}</span>
                  {order.allergies && order.allergies.length > 0 && (
                    <>
                      <span className="mx-1">•</span>
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-500">Allergies: {order.allergies.join(", ")}</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
                    <p className="text-sm">
                      {order.orderType === "dine-in" ? `Table ${order.table}` : order.customerName}
                      {order.orderType === "delivery" && " (Delivery)"}
                      {order.orderType === "takeaway" && " (Takeaway)"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Items</h4>
                    <ul className="space-y-2">
                      {order.items.map((item, index) => (
                        <li key={index} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                          <div className="font-medium">
                            {item.quantity}× {item.name}
                          </div>
                          {(item.notes || (item.specialRequests && item.specialRequests.length > 0)) && (
                            <div className="mt-1 text-xs space-y-1">
                              {item.notes && (
                                <p className="text-muted-foreground">{item.notes}</p>
                              )}
                              {item.specialRequests && item.specialRequests.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.specialRequests.map((request, i) => (
                                    <Badge key={i} variant="outline" className="text-[10px] py-0 h-4">
                                      {request}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">Est. prep time: {order.estimatedTime}</span>
                  </div>
                  <Button 
                    onClick={() => handleStartPreparing(order.id)}
                    className="bg-[#54B435] hover:bg-[#3e8527]"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Accept & Start Preparing
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
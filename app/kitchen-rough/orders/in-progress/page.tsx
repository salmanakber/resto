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
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Utensils,
  Bell
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"

interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
  specialRequests?: string[];
  completed?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  table?: string;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  items: OrderItem[];
  status: "preparing";
  priority: "normal" | "high" | "rush";
  timeStarted: string;
  estimatedCompletionTime: string;
  elapsedTimePercentage: number;
  allergies?: string[];
  assignedTo: string;
}

// Mock data for demonstration purposes
const mockInProgressOrders: Order[] = [
  {
    id: "order-001",
    orderNumber: "K-1000",
    table: "3",
    customerName: "Table 3",
    orderType: "dine-in",
    items: [
      { 
        name: "Chicken Curry Special", 
        quantity: 1,
        completed: true
      },
      { 
        name: "Watermelon Juice", 
        quantity: 2,
        completed: false
      },
    ],
    status: "preparing",
    priority: "normal",
    timeStarted: "2023-06-12T14:25:00Z",
    estimatedCompletionTime: "5 min remaining",
    elapsedTimePercentage: 75,
    assignedTo: "Jamie Chen"
  },
  {
    id: "order-002",
    orderNumber: "K-999",
    customerName: "Sarah Johnson",
    orderType: "delivery",
    items: [
      { 
        name: "Margherita Pizza", 
        quantity: 2,
        specialRequests: ["Extra basil"],
        completed: true
      },
      { 
        name: "Tuna Soup with Spinach", 
        quantity: 1,
        completed: false
      },
    ],
    status: "preparing",
    priority: "high",
    timeStarted: "2023-06-12T14:20:00Z",
    estimatedCompletionTime: "2 min remaining",
    elapsedTimePercentage: 90,
    allergies: ["Shellfish"],
    assignedTo: "Sara Miller"
  },
  {
    id: "order-003",
    orderNumber: "K-998",
    table: "10",
    customerName: "Table 10",
    orderType: "dine-in",
    items: [
      { 
        name: "Beef Wellington", 
        quantity: 1,
        notes: "Medium rare",
        completed: false
      },
      { 
        name: "Mashed Potatoes", 
        quantity: 1,
        completed: true
      },
      { 
        name: "Garlic Bread", 
        quantity: 1,
        completed: true
      },
    ],
    status: "preparing",
    priority: "rush",
    timeStarted: "2023-06-12T14:30:00Z",
    estimatedCompletionTime: "8 min remaining",
    elapsedTimePercentage: 60,
    assignedTo: "Jamie Chen"
  },
];

function getElapsedTime(dateString: string) {
  const now = new Date();
  const startTime = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just started";
  if (diffInMinutes === 1) return "1 minute";
  return `${diffInMinutes} minutes`;
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

function getProgressBarColor(percentage: number, priority: Order['priority']) {
  if (priority === "rush") {
    return percentage < 50 ? "bg-red-600" : percentage < 80 ? "bg-amber-600" : "bg-red-800";
  }
  if (priority === "high") {
    return percentage < 60 ? "bg-blue-600" : percentage < 85 ? "bg-amber-600" : "bg-red-600";
  }
  return percentage < 70 ? "bg-blue-600" : percentage < 90 ? "bg-amber-600" : "bg-red-600";
}

export default function InProgressOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockInProgressOrders);
  const { toast } = useToast();

  const handleItemComplete = (orderId: string, itemIndex: number) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedItems = [...order.items];
          updatedItems[itemIndex] = { 
            ...updatedItems[itemIndex], 
            completed: !updatedItems[itemIndex].completed 
          };
          return { ...order, items: updatedItems };
        }
        return order;
      })
    );
  };

  const handleMarkReady = (orderId: string) => {
    // In a real app, you would update the backend and notify the service staff
    toast({
      title: "Order ready for pickup",
      description: `Order #${orders.find(o => o.id === orderId)?.orderNumber} is ready to be served`,
      variant: "default",
    });
    
    // Remove from the list
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">In Progress Orders</h1>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm py-1">
          {orders.length} Active
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckCircle2 className="h-10 w-10 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No orders in progress</h3>
            <p className="text-sm text-muted-foreground mt-1">All orders have been completed or not yet started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map(order => {
            const allItemsCompleted = order.items.every(item => item.completed);
            return (
              <Card key={order.id} className={`border-l-4 ${
                order.priority === "rush" ? "border-l-red-600" :
                order.priority === "high" ? "border-l-amber-600" :
                "border-l-green-600"
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-blue-600" />
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
                    <span>Started {getElapsedTime(order.timeStarted)} ago</span>
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
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Assigned to: </span>
                        <span className="font-medium">{order.assignedTo}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Customer: </span>
                        <span>
                          {order.orderType === "dine-in" ? `Table ${order.table}` : order.customerName}
                          {order.orderType === "delivery" && " (Delivery)"}
                          {order.orderType === "takeaway" && " (Takeaway)"}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-2 flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Preparation progress</span>
                        <span className="font-medium">{order.estimatedCompletionTime}</span>
                      </div>
                      <Progress 
                        value={order.elapsedTimePercentage} 
                        className={`h-2 ${getProgressBarColor(order.elapsedTimePercentage, order.priority)}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Items</h4>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`item-${order.id}-${index}`}
                                checked={!!item.completed}
                                onChange={() => handleItemComplete(order.id, index)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              />
                              <label 
                                htmlFor={`item-${order.id}-${index}`}
                                className={`text-sm ${item.completed ? 'line-through text-gray-400' : ''}`}
                              >
                                {item.quantity}× {item.name}
                              </label>
                            </div>
                            {(item.notes || (item.specialRequests && item.specialRequests.length > 0)) && (
                              <div className="text-xs text-muted-foreground">{item.notes || item.specialRequests?.join(', ')}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4 pt-3 border-t">
                    <Button 
                      onClick={() => handleMarkReady(order.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!allItemsCompleted}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Mark as Ready
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
} 
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
  CheckCircle2, 
  Clock, 
  Search,
  ChevronDown,
  Filter,
  Download
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface OrderItem {
  name: string;
  quantity: number;
}

interface CompletedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: "dine-in" | "takeaway" | "delivery";
  items: OrderItem[];
  timeCompleted: string;
  preparationDuration: string;
  handledBy: string;
}

// Mock data for demonstration purposes
const mockCompletedOrders: CompletedOrder[] = [
  {
    id: "co-001",
    orderNumber: "K-995",
    customerName: "Table 7",
    orderType: "dine-in",
    items: [
      { name: "Beef Steak (Medium Rare)", quantity: 1 },
      { name: "Grilled Vegetables", quantity: 1 },
      { name: "Red Wine", quantity: 2 }
    ],
    timeCompleted: "2023-06-12T14:20:00Z",
    preparationDuration: "18 mins",
    handledBy: "Jamie Chen"
  },
  {
    id: "co-002",
    orderNumber: "K-994",
    customerName: "Michael Brown",
    orderType: "takeaway",
    items: [
      { name: "Chicken Caesar Salad", quantity: 1 },
      { name: "Garlic Bread", quantity: 1 }
    ],
    timeCompleted: "2023-06-12T14:15:00Z",
    preparationDuration: "12 mins",
    handledBy: "Sara Miller"
  },
  {
    id: "co-003",
    orderNumber: "K-993",
    customerName: "Table 3",
    orderType: "dine-in",
    items: [
      { name: "Mushroom Risotto", quantity: 1 },
      { name: "Tiramisu", quantity: 1 },
      { name: "Sparkling Water", quantity: 1 }
    ],
    timeCompleted: "2023-06-12T14:10:00Z",
    preparationDuration: "22 mins",
    handledBy: "Alex Wong"
  },
  {
    id: "co-004",
    orderNumber: "K-992",
    customerName: "Emma Wilson",
    orderType: "delivery",
    items: [
      { name: "Pepperoni Pizza (Large)", quantity: 1 },
      { name: "Cheesy Garlic Bread", quantity: 1 },
      { name: "Cola", quantity: 2 }
    ],
    timeCompleted: "2023-06-12T14:05:00Z",
    preparationDuration: "15 mins",
    handledBy: "Jamie Chen"
  },
  {
    id: "co-005",
    orderNumber: "K-991",
    customerName: "Table 10",
    orderType: "dine-in",
    items: [
      { name: "Fish & Chips", quantity: 2 },
      { name: "Garden Salad", quantity: 1 },
      { name: "Iced Tea", quantity: 2 }
    ],
    timeCompleted: "2023-06-12T14:00:00Z",
    preparationDuration: "20 mins",
    handledBy: "Sara Miller"
  },
  {
    id: "co-006",
    orderNumber: "K-990",
    customerName: "Robert Davis",
    orderType: "takeaway",
    items: [
      { name: "Vegetarian Burger", quantity: 1 },
      { name: "Sweet Potato Fries", quantity: 1 },
      { name: "Chocolate Milkshake", quantity: 1 }
    ],
    timeCompleted: "2023-06-12T13:55:00Z",
    preparationDuration: "17 mins",
    handledBy: "Alex Wong"
  },
  {
    id: "co-007",
    orderNumber: "K-989",
    customerName: "Table 2",
    orderType: "dine-in",
    items: [
      { name: "Spaghetti Carbonara", quantity: 1 },
      { name: "Caprese Salad", quantity: 1 },
      { name: "White Wine", quantity: 1 }
    ],
    timeCompleted: "2023-06-12T13:50:00Z",
    preparationDuration: "16 mins",
    handledBy: "Jamie Chen"
  },
  {
    id: "co-008",
    orderNumber: "K-988",
    customerName: "Lisa Thompson",
    orderType: "delivery",
    items: [
      { name: "Chicken Biryani", quantity: 1 },
      { name: "Garlic Naan", quantity: 2 },
      { name: "Mango Lassi", quantity: 1 }
    ],
    timeCompleted: "2023-06-12T13:45:00Z",
    preparationDuration: "25 mins",
    handledBy: "Sara Miller"
  }
];

function formatTimeWithAMPM(dateString: string) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${hours}:${minutesStr} ${ampm}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
    return `Today, ${formatTimeWithAMPM(dateString)}`;
  }
  
  if (date.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0)) {
    return `Yesterday, ${formatTimeWithAMPM(dateString)}`;
  }
  
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}, ${formatTimeWithAMPM(dateString)}`;
}

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>(mockCompletedOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [timeFrame, setTimeFrame] = useState<string>("today");
  
  // Apply filters
  const filteredOrders = orders.filter(order => {
    // Search by order number or customer name
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by order type
    const matchesType = orderTypeFilter === "all" || order.orderType === orderTypeFilter;
    
    // For demo purposes, we're not actually filtering by time frame since
    // our mock data is from the same day
    
    return matchesSearch && matchesType;
  });

  const exportToCsv = () => {
    // In a real app, this would generate and download a CSV file
    console.log("Exporting completed orders to CSV...");
    // You could implement actual CSV export functionality here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Completed Orders</h1>
        <Button variant="outline" size="sm" onClick={exportToCsv} className="gap-1">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dine-in">Dine-in</SelectItem>
            <SelectItem value="takeaway">Takeaway</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Search className="h-10 w-10 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No orders found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="text-sm text-muted-foreground">
            Showing {filteredOrders.length} completed orders
          </div>
          
          <div className="divide-y border rounded-lg">
            {filteredOrders.map(order => (
              <div key={order.id} className="p-4 bg-white hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-3 lg:col-span-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium">#{order.orderNumber}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-12 sm:col-span-3 lg:col-span-3">
                    <div className="text-sm">
                      <div className="font-medium">{order.customerName}</div>
                      <Badge variant="outline" className="mt-1 uppercase text-xs">
                        {order.orderType}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="col-span-12 sm:col-span-3 lg:col-span-3">
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Items</div>
                      <ul className="space-y-1 truncate">
                        {order.items.map((item, index) => (
                          <li key={index}>{item.quantity}× {item.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Completed</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatDate(order.timeCompleted)}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Prep time: {order.preparationDuration}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-6 sm:col-span-12 lg:col-span-2 flex items-center justify-end">
                    <div className="text-sm">
                      <div className="text-right text-muted-foreground">Chef</div>
                      <div className="font-medium">{order.handledBy}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
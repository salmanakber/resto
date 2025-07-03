"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ClipboardList, 
  Clock, 
  ChefHat, 
  AlertCircle, 
  CheckCircle2, 
  BarChart4, 
  Timer, 
  Utensils,
  ShoppingBag
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface KitchenStatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  className?: string
}

function KitchenStatCard({ title, value, description, icon, trend, className }: KitchenStatCardProps) {
  return (
    <Card className={`border-l-4 ${className} shadow-sm`}>
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <h4 className="text-3xl font-bold">{value}</h4>
              {trend && (
                <span className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-full h-12 w-12 flex items-center justify-center bg-gray-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderType {
  id: string;
  orderNumber: string;
  customer: string;
  items: {
    name: string;
    quantity: number;
    notes?: string;
  }[];
  status: "new" | "preparing" | "ready" | "completed";
  time: string;
  priority: "normal" | "high" | "rush";
  tableNumber?: string;
  preparationTime: string;
}

const mockPendingOrders: OrderType[] = [
  {
    id: "order-001",
    orderNumber: "K-1001",
    customer: "Dine-in (Table 12)",
    items: [
      { name: "Chicken Curry Special", quantity: 2 },
      { name: "Margherita Pizza", quantity: 1, notes: "Extra cheese" },
    ],
    status: "new",
    time: "2 mins ago",
    priority: "high",
    tableNumber: "12",
    preparationTime: "15-20 min"
  },
  {
    id: "order-002",
    orderNumber: "K-1002",
    customer: "John Smith (Takeaway)",
    items: [
      { name: "Beef Noodles", quantity: 1 },
      { name: "Watermelon Juice", quantity: 2 },
    ],
    status: "new",
    time: "4 mins ago",
    priority: "normal",
    preparationTime: "10-15 min"
  },
  {
    id: "order-003",
    orderNumber: "K-1003",
    customer: "Dine-in (Table 5)",
    items: [
      { name: "Tuna Soup with Spinach", quantity: 1 },
      { name: "Italian Pasta", quantity: 1 },
      { name: "Cheesy Pizza for Kids", quantity: 1 },
    ],
    status: "new",
    time: "8 mins ago",
    priority: "rush",
    tableNumber: "5",
    preparationTime: "15-20 min"
  }
];

const mockInProgressOrders: OrderType[] = [
  {
    id: "order-004",
    orderNumber: "K-1000",
    customer: "Dine-in (Table 3)",
    items: [
      { name: "Chicken Curry Special", quantity: 1 },
      { name: "Watermelon Juice", quantity: 2 },
    ],
    status: "preparing",
    time: "10 mins ago",
    priority: "normal",
    tableNumber: "3",
    preparationTime: "5 min remaining"
  },
  {
    id: "order-005",
    orderNumber: "K-999",
    customer: "Sarah Johnson (Delivery)",
    items: [
      { name: "Margherita Pizza", quantity: 2 },
      { name: "Tuna Soup with Spinach", quantity: 1 },
    ],
    status: "preparing",
    time: "15 mins ago",
    priority: "high",
    preparationTime: "2 min remaining"
  },
];

export default function KitchenDashboard() {
  const [viewTimeframe, setViewTimeframe] = useState<"today" | "week" | "month">("today");
  
  const kitchenMetrics = {
    today: {
      totalOrders: 45,
      avgPrepTime: "14 mins",
      pendingOrders: 8,
      completedOrders: 37,
      trend: "+12%"
    },
    week: {
      totalOrders: 320,
      avgPrepTime: "15 mins",
      pendingOrders: 12,
      completedOrders: 308,
      trend: "+8%"
    },
    month: {
      totalOrders: 1240,
      avgPrepTime: "16 mins",
      pendingOrders: 15,
      completedOrders: 1225,
      trend: "+15%"
    }
  };

  const selectedMetrics = kitchenMetrics[viewTimeframe];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Kitchen Dashboard</h1>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="today" className="w-auto" onValueChange={(value) => setViewTimeframe(value as any)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Kitchen Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KitchenStatCard
          title="Total Orders"
          value={selectedMetrics.totalOrders}
          description="Orders processed"
          icon={<ShoppingBag className="h-6 w-6 text-blue-600" />}
          trend={{ value: selectedMetrics.trend, positive: true }}
          className="border-blue-600"
        />
        <KitchenStatCard
          title="Avg Preparation Time"
          value={selectedMetrics.avgPrepTime}
          description="Across all orders"
          icon={<Timer className="h-6 w-6 text-amber-600" />}
          className="border-amber-600"
        />
        <KitchenStatCard
          title="Pending Orders"
          value={selectedMetrics.pendingOrders}
          description="Awaiting preparation"
          icon={<Clock className="h-6 w-6 text-red-600" />}
          className="border-red-600"
        />
        <KitchenStatCard
          title="Completed Orders"
          value={selectedMetrics.completedOrders}
          description="Successfully delivered"
          icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
          className="border-green-600"
        />
      </div>
      
      {/* Order Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Kitchen Workload</CardTitle>
          <CardDescription>Current order processing status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Orders</span>
                <span className="font-medium">{mockPendingOrders.length}</span>
              </div>
              <Progress className="h-2" value={(mockPendingOrders.length / (mockPendingOrders.length + mockInProgressOrders.length)) * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Preparing</span>
                <span className="font-medium">{mockInProgressOrders.length}</span>
              </div>
              <Progress className="h-2" value={(mockInProgressOrders.length / (mockPendingOrders.length + mockInProgressOrders.length)) * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Staff Utilization</span>
                <span className="font-medium">75%</span>
              </div>
              <Progress className="h-2" value={75} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Active Orders */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Pending Orders</CardTitle>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {mockPendingOrders.length} Waiting
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {mockPendingOrders.map(order => (
                <div key={order.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold">Order #{order.orderNumber}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        order.priority === "rush" ? "bg-red-50 text-red-700 border-red-200" :
                        order.priority === "high" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {order.priority.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="mb-2 text-sm text-muted-foreground">
                    {order.customer} • {order.time}
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.quantity}× {item.name}</span>
                        {item.notes && <span className="text-xs italic text-muted-foreground">({item.notes})</span>}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Preparation time: {order.preparationTime}
                    </div>
                    <Button size="sm" className="bg-[#54B435] hover:bg-[#3e8527]">Start Preparing</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">In Progress</CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {mockInProgressOrders.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {mockInProgressOrders.map(order => (
                <div key={order.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Order #{order.orderNumber}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${
                        order.priority === "rush" ? "bg-red-50 text-red-700 border-red-200" :
                        order.priority === "high" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {order.priority.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="mb-2 text-sm text-muted-foreground">
                    {order.customer} • {order.time}
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.quantity}× {item.name}</span>
                        {item.notes && <span className="text-xs italic text-muted-foreground">({item.notes})</span>}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-xs font-medium text-amber-600">
                      <Timer className="h-3.5 w-3.5 inline mr-1" />
                      {order.preparationTime}
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Mark as Ready</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Kitchen Staff Status */}
      <Card>
        <CardHeader>
          <CardTitle>Kitchen Staff Status</CardTitle>
          <CardDescription>Currently active staff and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/avatars/chef.png" alt="Jamie Chen" />
                  <AvatarFallback className="bg-[#54B435] text-white">JC</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 h-3.5 w-3.5 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-medium">Jamie Chen</div>
                <div className="text-xs text-muted-foreground">Head Chef • 2 orders active</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/avatars/chef2.png" alt="Alex Wong" />
                  <AvatarFallback className="bg-gray-500 text-white">AW</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 h-3.5 w-3.5 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-medium">Alex Wong</div>
                <div className="text-xs text-muted-foreground">Sous Chef • On break (5 min)</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/avatars/chef3.png" alt="Sara Miller" />
                  <AvatarFallback className="bg-[#54B435] text-white">SM</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 h-3.5 w-3.5 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-medium">Sara Miller</div>
                <div className="text-xs text-muted-foreground">Line Cook • 1 order active</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
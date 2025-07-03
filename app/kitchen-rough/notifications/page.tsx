"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BellRing, 
  ChefHat, 
  AlertCircle, 
  InfoIcon, 
  CheckCircle2, 
  Clock,
  Utensils,
  Trash2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Notification {
  id: string
  title: string
  description: string
  timestamp: string
  type: "alert" | "info" | "success"
  isRead: boolean
  from?: string
  fromAvatar?: string
}

const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    title: "New high-priority order received",
    description: "Order #K-1001 for Table 12 has been placed with high priority status.",
    timestamp: "2023-06-12T14:35:00Z",
    type: "alert",
    isRead: false
  },
  {
    id: "notif-002",
    title: "Inventory Alert",
    description: "Running low on fresh tomatoes. Please check inventory system for details.",
    timestamp: "2023-06-12T13:20:00Z", 
    type: "alert",
    isRead: false
  },
  {
    id: "notif-003",
    title: "Staff Schedule Update",
    description: "Alex Wong will be on leave tomorrow. Sara Miller will cover the morning shift.",
    timestamp: "2023-06-12T10:45:00Z",
    type: "info",
    isRead: true,
    from: "Mark Johnson",
    fromAvatar: "/avatars/manager.png"
  },
  {
    id: "notif-004",
    title: "Order completed successfully",
    description: "Order #K-995 for Table 7 has been completed and delivered.",
    timestamp: "2023-06-12T09:15:00Z",
    type: "success",
    isRead: true
  },
  {
    id: "notif-005",
    title: "Special Menu Item Added",
    description: "Chef's Special for today: 'Mediterranean Seabass with Saffron Rice' has been added to the menu.",
    timestamp: "2023-06-12T08:30:00Z",
    type: "info",
    isRead: true,
    from: "Jamie Chen",
    fromAvatar: "/avatars/chef.png"
  },
  {
    id: "notif-006",
    title: "Allergy Alert",
    description: "Customer at Table 5 has reported severe nut allergies. Please ensure all food preparation is nut-free.",
    timestamp: "2023-06-11T19:45:00Z",
    type: "alert",
    isRead: true
  },
  {
    id: "notif-007",
    title: "Equipment Maintenance Completed",
    description: "The maintenance of the main oven has been completed. It's now operational.",
    timestamp: "2023-06-11T15:20:00Z",
    type: "success",
    isRead: true
  }
];

function formatNotificationTime(dateString: string) {
  const now = new Date();
  const notifTime = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - notifTime.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return notifTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "alerts">("all");
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const alertsCount = notifications.filter(n => n.type === "alert").length;
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "unread") return !notif.isRead;
    if (activeTab === "alerts") return notif.type === "alert";
    return true; // "all" tab
  });
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };
  
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "info":
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-muted-foreground"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <Tabs 
        defaultValue="all"
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as any)}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="relative">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-1 bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {alertsCount > 0 && (
              <Badge className="ml-1 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                {alertsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <NotificationsList 
            notifications={filteredNotifications} 
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
            getNotificationIcon={getNotificationIcon}
          />
        </TabsContent>
        
        <TabsContent value="unread" className="mt-0">
          <NotificationsList 
            notifications={filteredNotifications}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification} 
            getNotificationIcon={getNotificationIcon}
          />
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-0">
          <NotificationsList 
            notifications={filteredNotifications}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
            getNotificationIcon={getNotificationIcon} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationsListProps {
  notifications: Notification[]
  markAsRead: (id: string) => void
  deleteNotification: (id: string) => void
  getNotificationIcon: (type: Notification["type"]) => React.ReactNode
}

function NotificationsList({ 
  notifications, 
  markAsRead, 
  deleteNotification,
  getNotificationIcon
}: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BellRing className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You're all caught up! Check back later for updates.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {notifications.map(notification => (
        <Card 
          key={notification.id} 
          className={`transition-all hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-rose-500' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 pt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-medium truncate">{notification.title}</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-rose-500 mr-2" />
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatNotificationTime(notification.timestamp)}
                    </span>
                  </div>
                </div>
                
                {notification.from && (
                  <div className="flex items-center mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={notification.fromAvatar} alt={notification.from} />
                        <AvatarFallback className="text-[10px] bg-gray-200">
                          {notification.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{notification.from}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-3 gap-2">
                  {!notification.isRead && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => markAsRead(notification.id)}
                      className="h-8 px-3 text-xs"
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteNotification(notification.id)}
                    className="h-8 px-2 text-xs text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
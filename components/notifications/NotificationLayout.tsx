"use client"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { Bell, CheckCircle, AlertTriangle, Info, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function NotificationLayout() {
  const router = useRouter()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications()

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "medium":
        return <Info className="h-4 w-4 text-blue-500" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-amber-50 border-amber-200"
      case "medium":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-emerald-50 border-emerald-200"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full border-2 border-rose-100 bg-white hover:bg-rose-50 hover:border-rose-200 transition-all duration-200 shadow-sm"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-rose-600" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 bg-white border border-rose-100 rounded-xl shadow-xl overflow-hidden p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-50 to-rose-100 border-b border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-rose-900">Notifications</h4>
              <p className="text-sm text-rose-600">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-200/50 rounded-lg px-3 py-1.5 font-medium"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-rose-200 border-t-rose-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="h-8 w-8 text-rose-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">{"We'll notify you when something happens"}</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification, index) => (
                <div key={notification.id} className="mb-2">
                  <DropdownMenuItem
                    className={cn(
                      "px-6 py-4 flex items-start space-x-4 hover:bg-rose-50/50 transition-all duration-200 cursor-pointer border-l-4 border-transparent",
                      !notification.isRead && "bg-rose-50/30 border-l-rose-400",
                      notification.priority === "high" && "border-l-amber-400",
                      notification.priority === "medium" && "border-l-blue-400",
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {/* Priority Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                        getPriorityColor(notification.priority),
                      )}
                    >
                      {getPriorityIcon(notification.priority)}
                    </div>

                    {/* Content */}
                    <Link
                      href={`${
                        notification.data.type === "order"
                          ? `/restaurant/orders`
                          : notification.data.type === "complaint"
                            ? `/admin/complaints`
                            : `/`
                      }`}
                      className="flex-1 min-w-0"
                    >
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-semibold text-gray-900 line-clamp-1">{notification.title}</h5>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {!notification.isRead && <div className="w-2 h-2 bg-rose-500 rounded-full"></div>}
                            <time dateTime={notification.createdAt} className="text-xs text-gray-500 font-medium">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </time>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{notification.message}</p>

                        {/* Order Details */}
                        {notification.data && notification.data.type === "order" && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              {notification.data.data.orderNumber && (
                                <Badge variant="secondary" className="text-xs font-medium">
                                  #{notification.data.data.orderNumber}
                                </Badge>
                              )}
                              {notification.data.data.status && (
                                <Badge
                                  variant={notification.data.data.status === "ready" ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {notification.data.data.status}
                                </Badge>
                              )}
                            </div>

                            {notification.data.data.tableNumber && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Table:</span> {notification.data.data.tableNumber}
                              </p>
                            )}

                            {notification.data.data.total && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Total:</span> {notification.data.data.total}
                              </p>
                            )}

                            {notification.data.data.items && (
                              <p className="text-xs text-gray-600 line-clamp-1">
                                <span className="font-medium">Items:</span>{" "}
                                {notification.data.data.items.map((item: any) => item.name).join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full flex-shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="text-sm"
                        >
                          Mark as read
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)

                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </DropdownMenuItem>
                  {index < notifications.length - 1 && <Separator className="mx-6" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-medium"
              onClick={() => router.push("/notifications")}
            >
              View all notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

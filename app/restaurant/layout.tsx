"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Grid3x3,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  MenuIcon,
  XCircle,
  Utensils,
  Table,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import RouteProgress from "@/components/admin/RouteProgress"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { NotificationLayout } from "@/components/notifications/NotificationLayout"
import { useUser } from "@/lib/hooks/user"

interface SidebarNavItem {
  href: string
  title: string
  icon: React.ReactNode
  notifications?: number
  size?: string
  badge?: string
  isNew?: boolean
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[]
  collapsed: boolean
  isLoading: boolean
  clickedPath?: string
  isPending?: boolean
  setClickedPath: (href: string) => void
  setIsPending: (state: boolean) => void
}

export function SidebarNav({
  className,
  items,
  collapsed,
  isPending,
  clickedPath,
  setClickedPath,
  setIsPending,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className={cn("flex flex-col space-y-2", className)} {...props}>
      {items.map((item) => {
        const itemIsLoading = isPending && clickedPath === item.href
        const isActive = pathname === item.href

        return (
          <div key={item.href} className="relative group">
            <button
              onClick={async () => {
                if (pathname === item.href) return
                setClickedPath(item.href)
                setIsPending(true)
                router.push(item.href)
              }}
              className={cn(
                "flex items-center w-full rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 cursor-pointer relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg transform scale-105"
                  : "text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:scale-105 hover:shadow-md",
              )}
            >
              {/* Background gradient effect */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-rose-500/20 to-pink-600/20 opacity-0 transition-opacity duration-300",
                  !isActive && "group-hover:opacity-100",
                )}
              />

              <div className="relative flex items-center w-full">
                {item.icon && (
                  <div className={cn("mr-3 h-5 w-5 transition-transform duration-300", isActive && "scale-110")}>
                    {item.icon}
                  </div>
                )}

                {!collapsed && (
                  <>
                    <span
                      className="flex-1 text-left transition-all duration-300"
                      style={{ fontSize: item.size || "0.95rem" }}
                    >
                      {item.title}
                    </span>

                    <div className="flex items-center space-x-2 ml-auto">
                      {itemIsLoading && <Loader2 className="w-4 h-4 animate-spin" />}

                      {item.isNew && (
                        <Badge className="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-0.5 animate-pulse">
                          New
                        </Badge>
                      )}

                      {item.notifications && (
                        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-0.5 animate-bounce">
                          {item.notifications}
                        </Badge>
                      )}

                      {item.badge && (
                        <Badge variant="outline" className="text-xs border-white/30 text-white/80">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </button>

            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50">
                {item.title}
                {item.notifications && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs">{item.notifications}</Badge>
                )}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const session = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [clickedPath, setClickedPath] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const collapsed = localStorage.getItem("sidebarCollapsed")
      return collapsed === null ? false : collapsed === "true"
    }
    return false
  })

  const { user, loading, error } = useUser()
  const { notifications, unreadCount, createNotification } = useNotifications()
  const [userData, setUserData] = useState<any>(null)
  const [brandAssets, setBrandAssets] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchResults, setSearchResults] = useState("")


  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchBrandAssets = async () => {
      try {
        const response = await fetch(`/api/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "brand_assets",
          }),
        })
        const data = await response.json()
        setBrandAssets(JSON.parse(data.value))
      } catch (error) {
        console.error("Error fetching brand assets:", error)
      }
    }
    fetchBrandAssets()
  }, [])

  useEffect(() => {
    setIsPending(false)
  }, [pathname])

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed ? "true" : "false")
  }, [sidebarCollapsed])

  useEffect(() => {
    if (user) {
      setUserData(user)
    }
  }, [user])

  const sidebarNavItems: SidebarNavItem[] = [
    {
      title: "Dashboard",
      href: "/restaurant/dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Menu Categories",
      href: "/restaurant/categories",
      icon: <Grid3x3 className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Orders",
      href: "/restaurant/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Customers",
      href: "/restaurant/customers",
      icon: <Users className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Menu Items",
      href: "/restaurant/menu-items",
      icon: <Utensils className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Table Management",
      href: "/restaurant/tables",
      icon: <Table className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Pickup Points",
      href: "/restaurant/pickup",
      icon: <MapPin className="h-5 w-5" />,
      size: "0.95rem",
    },
    {
      title: "Staff Management",
      href: "/restaurant/employee",
      icon: <Users className="h-5 w-5" />,
      size: "0.95rem",
      
    },
    {
      title: "Settings",
      href: "/restaurant/settings",
      icon: <Settings className="h-5 w-5" />,
      size: "0.95rem",
    },
  ]

  const roleAccessMap: Record<string, string[] | "all"> = {
    Restaurant: "all",
    Admin: "all",
    It_access: "all",
    Kitchen_boy: ["/restaurant/orders"],
    Restaurant_manager: ["/restaurant/dashboard", "/restaurant/orders", "/restaurant/employee"],
    Restaurant_supervisor: ["/restaurant/dashboard", "/restaurant/orders"],
  };

  
const getSidebarItemsForRole = (role: string): SidebarNavItem[] => {
  const allowedPaths = roleAccessMap[role];

  if (allowedPaths === "all") return sidebarNavItems;

  return sidebarNavItems.filter((item) => allowedPaths?.includes(item.href));
};



const currentUserRole = user?.role.name; // Get from session/context

const menuItems = getSidebarItemsForRole(currentUserRole || "");


  const toggleMobileMenu = () => {
    const mobileNav = document.getElementById("mobile-nav")
    const mobileNavMask = document.getElementById("mobile-nav-mask")
    if (mobileNav) {
      mobileNav.classList.toggle("-translate-x-full")
      mobileNav.classList.toggle("translate-x-0")

      if (mobileNavMask) {
        mobileNavMask.classList.toggle("hidden")
        mobileNavMask.classList.toggle("flex")
      }
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // Update the time every second
    }, 1000);
  
    return () => clearInterval(interval); // Clean up on unmount
  }, []);

const today = new Date()
const options: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
}
const todayFormatted = today.toLocaleDateString(undefined, options)

const FilterSideBarNavItem = menuItems.filter(item =>
  item.title.toLowerCase().includes(searchResults.toLowerCase())
)


  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 relative">
        <div className="flex flex-col items-center justify-center h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-rose-500 border-t-transparent mb-4"></div>
          <p className="text-rose-600 font-medium">Loading your restaurant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-white">
      {/* Enhanced Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl",
          sidebarCollapsed ? "w-20" : "w-80",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center px-6 relative border-b border-white/10">
          <div className="flex items-center space-x-3 flex-1">
            {sidebarCollapsed ? (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-white to-white flex items-center justify-center">
                {brandAssets?.favicon ? (
                  <img src={brandAssets.favicon || "/placeholder.svg"} alt="logo" className="h-6 w-6" />
                ) : (
                  <Utensils className="h-6 w-6 text-white" />
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-white to-white flex items-center justify-center">
                  {brandAssets?.favicon ? (
                    <img src={brandAssets.favicon || "/placeholder.svg"} alt="logo" className="h-6 w-6" />
                  ) : (
                    <Utensils className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="font-bold text-xl text-white">
                    {brandAssets?.["logo-dark"] ? (
                      <img src={brandAssets["logo-dark"] || "/placeholder.svg"} alt="logo" className="w-[140px]" />
                    ) : (
                      "Restaurant Pro"
                    )}
                  </h1>
                  {/* <p className="text-xs text-white/60">Management System</p> */}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Toggle Button */}
          <button
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full shadow-lg border-2 border-white transition-all duration-300 hover:scale-110 hover:shadow-xl"
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setSidebarCollapsed((c) => !c)}
            tabIndex={0}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="px-6 py-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search menu, orders..."
                value={searchResults}
                onChange={(e) => setSearchResults(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-rose-400"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div
          className={cn(
            "flex-1 overflow-auto py-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent",
            sidebarCollapsed ? "px-3" : "px-6",
          )}
        >

          <SidebarNav
            items={FilterSideBarNavItem}
            collapsed={sidebarCollapsed}
            isPending={isPending}
            clickedPath={clickedPath}
            setClickedPath={setClickedPath}
            setIsPending={setIsPending}
          />
        </div>

        {/* Enhanced User Profile Section */}
        <div className="mt-auto border-t border-white/10 p-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-gradient-to-r from-rose-500 to-pink-600 ring-2 ring-white/20">
                <AvatarImage src={userData?.profileImage} />
                <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold">
                  {userData?.firstName?.charAt(0)}
                  {userData?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>

            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white truncate">
                      {userData?.firstName} {userData?.lastName}
                    </p>
                    <p className="text-xs text-white/60 truncate">
                      {userData?.role?.displayName || "Restaurant Admin"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
                    onClick={async () => {
                      try {
                        await signOut({ redirect: false })
                        router.push("/login")
                      } catch (error) {
                        console.error("Logout error:", error)
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Stats */}
                {/* <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/60">Today's Orders</p>
                    <p className="text-sm font-bold text-white">24</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2 text-center">
                    <p className="text-xs text-white/60">Revenue</p>
                    <p className="text-sm font-bold text-white">$1.2k</p>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300", sidebarCollapsed ? "md:pl-20" : "md:pl-80")}>
        {/* Enhanced Header */}
        <header className="flex h-20 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-8 shadow-sm sticky top-0 z-40">
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" className="mr-3" onClick={toggleMobileMenu}>
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              {brandAssets?.logo && <img src={brandAssets.logo || "/placeholder.svg"} alt="logo" className="w-[140px]" />}
            </div>
          </div>

          {/* Desktop Header Content */}
          <div className="hidden md:flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Welcome to {userData?.restaurantName || "Your Restaurant"}
              </h1>
              <p className="text-sm text-gray-600">
                {getGreeting()}, {userData?.firstName}! Here's what's happening today.
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-rose-200 hover:text-white from-rose-600 to-pink-600 bg-gradient-to-r from-rose-600 to-pink-600 text-white">
                <Calendar className="mr-2 h-4 w-4" />
                {todayFormatted}
              </Button>
              <Button variant="outline" size="sm" className="border-rose-200 hover:bg-rose-50"
              onClick={() => router.push("/pos")}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Go to POS
              </Button>
            </div>

            {/* Notifications */}
            <NotificationLayout />

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="font-medium text-gray-900">
                  {getGreeting()}, {session.data?.user?.name?.split(" ")[0]}!
                </p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-rose-200 ring-2 ring-rose-100">
                <AvatarImage src={userData?.profileImage} alt={session.data?.user?.name || "User"} />
                <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                  {session.data?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Enhanced Mobile Navigation */}
        <div
          id="mobile-nav-mask"
          className="md:hidden fixed inset-0 bg-black/50 z-30 hidden backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
        <div
          id="mobile-nav"
          className="md:hidden fixed inset-y-0 left-0 z-40 w-80 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 transform -translate-x-full transition-transform duration-300 ease-in-out shadow-2xl"
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center">
                  {brandAssets?.favicon ? (
                    <img src={brandAssets.favicon || "/placeholder.svg"} alt="logo" className="h-6 w-6" />
                  ) : (
                    <Utensils className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="font-bold text-lg text-white">Restaurant Pro</h1>
                  <p className="text-xs text-white/60">Mobile Dashboard</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 rounded-full"
                onClick={toggleMobileMenu}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Search */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-auto py-6 px-6">
              <SidebarNav
                items={sidebarNavItems}
                collapsed={false}
                isPending={isPending}
                clickedPath={clickedPath}
                setClickedPath={setClickedPath}
                setIsPending={setIsPending}
              />
            </div>

            {/* Mobile User Profile */}
            <div className="mt-auto border-t border-white/10 px-6 py-6">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12 border-2 border-rose-500 ring-2 ring-white/20">
                  <AvatarImage src="/avatars/admin.png" />
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                    {userData?.firstName?.charAt(0)}
                    {userData?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {userData?.firstName} {userData?.lastName}
                  </p>
                  <p className="text-xs text-white/60">Restaurant Admin</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 rounded-full"
                  onClick={async () => {
                    try {
                      await signOut({ redirect: false })
                      router.push("/login")
                    } catch (error) {
                      console.error("Logout error:", error)
                    }
                  }}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-rose-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading your dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <RouteProgress />
              {isPending ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                      ))}
                    </div>
                    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
                  </div>
                </div>
              ) : (
                <div className="p-8">{children}</div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

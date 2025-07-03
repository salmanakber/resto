"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ClipboardList, 
  Clock, 
  ChefHat, 
  Settings, 
  Bell, 
  LogOut,
  Menu as MenuIcon,
  XCircle,
  UtensilsCrossed,
  CheckCircle2,
  BellRing,
  Grid3x3
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ReactNode
    notifications?: number
  }[]
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors",
            pathname === item.href || pathname.startsWith(item.href + "/")
              ? "bg-[#e11d48] text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
          prefetch={true}
        >
          <div className="mr-3 h-5 w-5">{item.icon}</div>
          <span>{item.title}</span>
          {item.notifications && (
            <Badge className="ml-auto bg-white text-[#e11d48]" variant="secondary">
              {item.notifications}
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  )
}

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPOSPage = pathname === '/kitchen/pos'

  // Mock notification count
  const pendingOrdersCount = 8
  const notificationsCount = 3

  const sidebarNavItems = [
    {
      title: "Dashboard",
      href: "/kitchen/dashboard",
      icon: <UtensilsCrossed className="h-5 w-5" />,
    },
    {
      title: "Menu Categories",
      href: "/kitchen/menu-categories",
      icon: <Grid3x3 className="h-5 w-5" />,
    },
    {
      title: "New Orders",
      href: "/kitchen/orders/new",
      icon: <ClipboardList className="h-5 w-5" />,
      notifications: pendingOrdersCount,
    },
    {
      title: "In Progress",
      href: "/kitchen/orders/in-progress",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Completed",
      href: "/kitchen/orders/completed",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: "Notifications",
      href: "/kitchen/notifications",
      icon: <BellRing className="h-5 w-5" />,
      notifications: notificationsCount,
    },
    {
      title: "Settings",
      href: "/kitchen/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const toggleMobileMenu = () => {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavMask = document.getElementById('mobile-nav-mask');
    if (mobileNav) {
      mobileNav.classList.toggle('-translate-x-full');
      mobileNav.classList.toggle('translate-x-0');
      
      if (mobileNavMask) {
        mobileNavMask.classList.toggle('hidden');
        mobileNavMask.classList.toggle('flex');
      }
    }
  };

  if (isPOSPage) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex w-72 flex-col fixed inset-y-0 z-50 kitchen-sidebar">
        <div className="flex h-20 items-center px-8">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#e11d48] text-white">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"></path>
                <path d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z" fill="currentColor"></path>
                <path d="M7.5 12C7.5 12.83 6.83 13.5 6 13.5C5.17 13.5 4.5 12.83 4.5 12C4.5 11.17 5.17 10.5 6 10.5C6.83 10.5 7.5 11.17 7.5 12Z" fill="currentColor"></path>
                <path d="M19.5 12C19.5 12.83 18.83 13.5 18 13.5C17.17 13.5 16.5 12.83 16.5 12C16.5 11.17 17.17 10.5 18 10.5C18.83 10.5 19.5 11.17 19.5 12Z" fill="currentColor"></path>
              </svg>
            </div>
            <span className="font-bold text-2xl text-white">OPENPHO</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto py-8 px-5">
          <SidebarNav items={sidebarNavItems} />
        </div>
        <div className="mt-auto px-6 py-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="border-2 border-white">
                <AvatarImage src="/avatars/chef.png" />
                <AvatarFallback className="bg-[#e11d48] text-white">JC</AvatarFallback>
              </Avatar>
              <div className="text-white">
                <p className="text-sm font-semibold">Jamie Chen</p>
                <p className="text-xs opacity-80">Head Chef</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:pl-72">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b bg-white px-8 shadow-sm">
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" className="mr-2" onClick={toggleMobileMenu}>
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#e11d48] text-white">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"></path>
                  <path d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z" fill="currentColor"></path>
                  <path d="M7.5 12C7.5 12.83 6.83 13.5 6 13.5C5.17 13.5 4.5 12.83 4.5 12C4.5 11.17 5.17 10.5 6 10.5C6.83 10.5 7.5 11.17 7.5 12Z" fill="currentColor"></path>
                  <path d="M19.5 12C19.5 12.83 18.83 13.5 18 13.5C17.17 13.5 16.5 12.83 16.5 12C16.5 11.17 17.17 10.5 18 10.5C18.83 10.5 19.5 11.17 19.5 12Z" fill="currentColor"></path>
                </svg>
              </div>
              <span className="font-bold text-lg">OPENPHO</span>
            </div>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold">Kitchen Dashboard</h1>
          </div>
          <div className="flex items-center space-x-5">
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e11d48] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </Button>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-muted-foreground">Kitchen Staff</p>
                <p className="font-medium">Jamie Chen</p>
              </div>
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src="/avatars/chef.png" alt="Jamie Chen" />
                <AvatarFallback className="bg-[#e11d48] text-white">JC</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile navigation (only shown when menu is clicked) */}
        <div 
          id="mobile-nav-mask"
          className="md:hidden fixed inset-0 bg-black/50 z-30 hidden"
          onClick={toggleMobileMenu}
        ></div>
        <div 
          id="mobile-nav" 
          className="md:hidden fixed inset-y-0 left-0 z-40 w-72 kitchen-sidebar transform -translate-x-full transition-transform duration-300 ease-in-out"
        >
          <div className="flex flex-col h-full">
            <div className="flex h-20 items-center justify-between px-6">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#e11d48] text-white">
                  <ChefHat className="h-6 w-6" />
                </div>
                <span className="font-bold text-xl text-white">KitchenView</span>
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
            <div className="flex-1 overflow-auto py-6 px-4">
              <SidebarNav items={sidebarNavItems} />
            </div>
            <div className="mt-auto border-t border-white/10 px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="border-2 border-white">
                    <AvatarImage src="/avatars/chef.png" />
                    <AvatarFallback className="bg-[#e11d48] text-white">JC</AvatarFallback>
                  </Avatar>
                  <div className="text-white">
                    <p className="text-sm font-semibold">Jamie Chen</p>
                    <p className="text-xs opacity-80">Head Chef</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-8 bg-gray-50 min-h-[calc(100vh-5rem)]">
          <div className="kitchen-fade-in">
            {children}
          </div>
        </main>
      </div>
      
      <style jsx global>{`
        .kitchen-sidebar {
          background-color: #881337;
          background-image: 
            linear-gradient(to bottom, rgba(225, 29, 72, 0.2), transparent 70%),
            linear-gradient(45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%, transparent 50%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.1) 75%, transparent 75%, transparent);
          background-size: auto, 10px 10px;
        }
        
        .kitchen-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
} 
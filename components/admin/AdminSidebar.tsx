'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, UserCog, MapPin, Store,
  ShoppingCart, Menu, Settings, Mail, Activity, LogOut,
  Loader2,
  Book,
  HelpCircle,
  BookOpen,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Locations', href: '/admin/locations', icon: MapPin },
  { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Menu', href: '/admin/menu', icon: Menu },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: 'Complaints & Support', href: '/admin/complaints', icon: Mail, children: [
    { name: 'Complaints', href: '/admin/complaints', icon: Mail },
    { name: 'Articles', href: '/admin/articles', icon: BookOpen },
    { name: 'FAQ', href: '/admin/faqs', icon: HelpCircle },
  ]},
  { name: 'Activity Logs', href: '/admin/activity', icon: Activity },
  { name: 'SEO settings', href: '#', icon: Settings, children:[
    { name: 'SEO settings', href: '/admin/seo', icon: Settings },
    { name: 'Logo and favicon', href: '/admin/seo/logo-and-favicon', icon: Settings },
  ]},
  { name: 'System Settings', href: '/admin/system', icon: Settings },
  { name: 'Account Settings', href: '/admin/settings', icon: UserCog },
  { name: 'Logout', href: '/api/auth/logout', icon: LogOut },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clickedPath, setClickedPath] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [restaurantData, setRestaurantData] = useState<any>(null)
  const toggleExpand = (name: string) => {
    setExpanded(expanded === name ? null : name)
  }
  
  const handleClick = (href: string) => {
    setClickedPath(href)
    startTransition(() => {
      router.push(href)
    })
  }

  useEffect(() => {
    const fetchRestaurantData = async () => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: "brand_assets",
        }),
      });
      const data = await response.json();
      setRestaurantData(JSON.parse(data.value));
    }
    fetchRestaurantData();
  }, [])

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center px-4">
            <h1 className="text-xl font-bold text-red-600">
              {restaurantData ? (
                <img src={restaurantData.logo} alt="logo" width={100} height={100} />
              ) : (
                "Openpho"
              )} 
            </h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
  const isParentActive = item.href && pathname === item.href
  const isLoading = isPending && clickedPath === item.href

  const hasChildren = item.children && item.children.length > 0
  const isExpanded = expanded === item.name

  return (
    <div key={item.name}>
      <button
        onClick={() => {
          if (hasChildren) toggleExpand(item.name)
          else if (item.href) handleClick(item.href)
        }}
        className={`w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isParentActive
            ? 'bg-red-50 text-red-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {item.icon && (
          <item.icon
            className={`mr-3 h-6 w-6 ${
              isParentActive || isLoading
                ? 'text-red-600'
                : 'text-gray-400 group-hover:text-gray-500'
            }`}
          />
        )}
        {item.name}
        {hasChildren && (
          <span className="ml-auto text-xs text-gray-400">
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
        {isLoading && (
          <span className="ml-auto text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child) => {
            const isActive = pathname === child.href
            const isLoading = isPending && clickedPath === child.href
            return (
              <div key={child.name} className="flex items-center">
              <button
                key={child.name}
                onClick={() => handleClick(child.href)}
                className={`w-full text-left text-sm px-2 py-1 rounded-md flex items-center ${
                  isActive
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {child.icon && (
                  <child.icon
                    className={`mr-3 h-4 w-4 ${
                      isActive
                        ? 'text-red-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                )}
                {child.name}
                {isLoading && (
                  <span className="ml-auto text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                )}
              </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})}

          </nav>
        </div>
      </div>
    </div>
  )
}

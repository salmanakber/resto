"use client"

import { SidebarNav } from '@/components/sidebar-nav';
import { usePathname, useRouter } from "next/navigation"
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import clsx from "clsx"

const sidebarNavItems = [
  { title: 'Dashboard', href: '/restaurant/employee', icon: 'LayoutDashboard' },
  { title: 'Employee Directory', href: '/restaurant/employee/directory', icon: 'Users' },
  { title: 'Add Employee', href: '/restaurant/employee/add', icon: 'UserPlus' },
  // { title: 'Roles & Permissions', href: '/restaurant/employee/roles', icon: 'Shield' },
  { title: 'Attendance', href: '/restaurant/employee/attendance', icon: 'Calendar' },
  { title: 'Leave Management', href: '/restaurant/employee/leave', icon: 'Briefcase' },
  { title: 'Payroll', href: '/restaurant/employee/payroll', icon: 'DollarSign' },
  { title: 'Performance', href: '/restaurant/employee/performance', icon: 'BarChart2' },
  // { title: 'IT Access', href: '/restaurant/employee/it-access', icon: 'Key' },
  // { title: 'Reports', href: '/restaurant/employee/reports', icon: 'FileText' },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={clsx(
          "transition-all duration-300 border-r bg-white",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-full px-2 py-4">
          <div className={clsx("px-2 transition-opacity", collapsed && "opacity-0 h-0 overflow-hidden")}>
            <h2 className="text-md font-semibold mb-4">HRM Module</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <nav className="flex flex-col gap-2">
              {sidebarNavItems.map((item) => {
                const Icon = Icons[item.icon as keyof typeof Icons];
                const isActive = pathname === item.href;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm",
                      isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {!collapsed && <span>{item.title}</span>}
                  </a>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-4 transition-opacity animate-fade-in">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}

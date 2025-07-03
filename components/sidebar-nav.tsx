"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { ComponentType } from 'react';

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
    icon: keyof typeof Icons;
    size?: string;
  }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {items.map((item) => {
        const Icon = Icons[item.icon] as ComponentType<{ className?: string }>;
        if (!Icon) return null;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === item.href ? 'bg-accent' : 'transparent'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span style={{ fontSize: item.size || "0.95rem" }}>
              {item.title}
              </span>
          </Link>
        );
      })}
    </nav>
  );
} 

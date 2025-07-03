"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MenuCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: MenuCategory[]
  image?: string
}

interface CategoryNavigationProps {
  categories: MenuCategory[]
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
  expandedCategories: Set<string>
  onToggleCategory: (categoryId: string) => void
}

export const CategoryNavigation = React.memo(
  ({
    categories,
    selectedCategory,
    onCategorySelect,
    expandedCategories,
    onToggleCategory,
  }: CategoryNavigationProps) => {
    const renderCategory = (category: MenuCategory, level = 0) => {
      const isExpanded = expandedCategories.has(category.id)
      const hasChildren = category.children && category.children.length > 0
      const isSelected = selectedCategory === category.id

      return (
        <div key={category.id} className="w-full">
          <Button
            variant="ghost"
            onClick={() => {
              if (hasChildren) onToggleCategory(category.id)
              onCategorySelect(category.id)
            }}
            className={cn(
              "flex items-center w-full px-3 py-2 rounded-sm font-light text-base transition-colors justify-start h-auto",
              isSelected ? "bg-[#e41e3f] text-white hover:bg-[#e41e3f]" : "hover:bg-gray-50 text-[#1a2235]",
              level > 0 && "ml-4",
            )}
          >
            {category.image ? (
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                className="w-6 h-6 rounded mr-3 object-cover bg-gray-200"
              />
            ) : (
              <span className="w-6 h-6 mr-3 flex items-center justify-center bg-gray-200 rounded">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="4" />
                </svg>
              </span>
            )}
            <span className="flex-1 text-left">{category.name}</span>
            {hasChildren && (
              <span className="ml-2">
                {isExpanded ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 15l6-6 6 6" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </span>
            )}
          </Button>
          {hasChildren && isExpanded && (
            <div className="border-l border-gray-200 ml-4">
              {(category.children || []).map((child) => renderCategory(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <nav className="space-y-1">{categories.filter((cat) => !cat.parentId).map((cat) => renderCategory(cat, 0))}</nav>
    )
  },
)

CategoryNavigation.displayName = "CategoryNavigation"

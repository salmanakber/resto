"use client"

import { useState, useEffect } from "react"
import type { MenuItem } from "../types/pos-types"

export const useMenuItems = (selectedCategory: string, searchQuery: string) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch("/api/pos/categories")
      const data = await response.json()

      const categories = data.map((category: any) => ({
        id: category.id,
        name: category.name,
        icon: category.image,
        itemCount: category.itemCount,
      }))

      categories.unshift({
        id: "all",
        name: "All Menu",
        itemCount: "",
      })

      setCategories(categories)
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (selectedCategory) {
          params.append("categoryId", selectedCategory)
        }
        if (searchQuery) {
          params.append("search", searchQuery)
        }
        const response = await fetch(`/api/pos/menu-items?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch menu items")
        }
        const data = await response.json()

        setMenuItems(data)
      } catch (error) {
        console.error("Error fetching menu items:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuItems()
  }, [selectedCategory, searchQuery])

  return { menuItems, categories, isLoading }
}

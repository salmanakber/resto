"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, Folder, FolderOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface MenuCategory {
  id: string
  name: string
  children: MenuCategory[]
}

export default function MenuCategoriesPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([
    {
      id: "1",
      name: "Burgers",
      children: [
        {
          id: "1-1",
          name: "Classic Burgers",
          children: [
            { id: "1-1-1", name: "Cheeseburger", children: [] },
            { id: "1-1-2", name: "Bacon Burger", children: [] },
          ],
        },
        {
          id: "1-2",
          name: "Specialty Burgers",
          children: [
            { id: "1-2-1", name: "Double Patty", children: [] },
            { id: "1-2-2", name: "Veggie Burger", children: [] },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Drinks",
      children: [
        {
          id: "2-1",
          name: "Soft Drinks",
          children: [
            { id: "2-1-1", name: "Coke", children: [] },
            { id: "2-1-2", name: "Sprite", children: [] },
          ],
        },
      ],
    },
  ])

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [newCategoryName, setNewCategoryName] = useState("")
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const addCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: MenuCategory = {
      id: Date.now().toString(),
      name: newCategoryName,
      children: [],
    }

    if (parentCategoryId) {
      const addToParent = (categories: MenuCategory[]): MenuCategory[] => {
        return categories.map(category => {
          if (category.id === parentCategoryId) {
            return {
              ...category,
              children: [...category.children, newCategory],
            }
          }
          return {
            ...category,
            children: addToParent(category.children),
          }
        })
      }
      setCategories(addToParent(categories))
    } else {
      setCategories([...categories, newCategory])
    }

    setNewCategoryName("")
    setParentCategoryId(null)
    setIsAddDialogOpen(false)
  }

  const deleteCategory = (categoryId: string) => {
    const deleteFromCategories = (categories: MenuCategory[]): MenuCategory[] => {
      return categories.filter(category => {
        if (category.id === categoryId) {
          return false
        }
        return {
          ...category,
          children: deleteFromCategories(category.children),
        }
      })
    }
    setCategories(deleteFromCategories(categories))
  }

  const renderCategory = (category: MenuCategory, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children.length > 0

    return (
      <div key={category.id} className="space-y-1">
        <div className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "group"
        )}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 transition-transform",
              isExpanded ? "rotate-0" : "-rotate-90",
              !hasChildren && "invisible"
            )}
            onClick={() => toggleCategory(category.id)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-amber-500" />
              ) : (
                <Folder className="h-4 w-4 text-amber-500" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => {
                setParentCategoryId(category.id)
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600"
              onClick={() => deleteCategory(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 ml-3">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your menu items into categories and subcategories
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#e11d48] hover:bg-[#be123c] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="focus-visible:ring-[#e11d48]"
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={addCategory}
                  className="bg-[#e11d48] hover:bg-[#be123c] text-white"
                >
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-1">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No categories yet</p>
                <p className="text-sm">Add your first category to get started</p>
              </div>
            ) : (
              categories.map(category => renderCategory(category))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
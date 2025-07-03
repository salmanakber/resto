import { useState, useEffect } from 'react'
import { getMenuCategories, createMenuCategory, updateMenuCategory, deleteMenuCategory } from '@/lib/services/menu-categories'

interface MenuCategory {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  order: number | null
  parentId: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
  children?: MenuCategory[]
}

export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await getMenuCategories()
      setCategories(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async (category: Omit<MenuCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newCategory = await createMenuCategory(category)
      setCategories(prev => [...prev, newCategory])
      
      return newCategory
    } catch (err) {
      setError('Failed to create category')
      throw err
    }
  }

  const editCategory = async (id: string, category: Partial<MenuCategory>) => {
    try {
      const updatedCategory = await updateMenuCategory(id, category)
      setCategories(prev => prev.map(cat => 
        cat.id === id ? updatedCategory : cat
      ))
      
      return updatedCategory
    } catch (err) {
      setError('Failed to update category')
      throw err
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await deleteMenuCategory(id)
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (err) {
      setError('Failed to delete category')
      throw err
    }
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    editCategory,
    removeCategory,
    refreshCategories: fetchCategories
  }
} 
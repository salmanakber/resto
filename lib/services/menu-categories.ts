import { type Prisma } from '@prisma/client'

export interface MenuCategory {
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

const API_URL = '/api/menu-categories'

export async function getMenuCategories(): Promise<MenuCategory[]> {
  try {
    const response = await fetch(API_URL)
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Failed to fetch menu categories: ${response.status} ${response.statusText}`)
    }
    return response.json()
  } catch (error) {
    console.error('Network or parsing error:', error)
    throw error
  }
}

export async function createMenuCategory(data: Omit<MenuCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'children'>): Promise<MenuCategory> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create menu category')
  }
  return response.json()
}

export async function updateMenuCategory(id: string, data: Partial<Omit<MenuCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'children'>>): Promise<MenuCategory> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    
    throw new Error('Failed to update menu category')
  }
  return response.json()
}

export async function deleteMenuCategory(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete menu category')
  }
} 
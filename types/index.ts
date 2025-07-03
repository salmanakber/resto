export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  roleId: string
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
  updatedAt: Date
  role: Role
}

export interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  access_area: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string | null
  email: string | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Restaurant {
  id: string
  name: string
  description: string | null
  locationId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  location: Location
}

export interface Order {
  id: string
  restaurantId: string
  userId: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  restaurant: Restaurant
  user: User
}

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description: string | null
  price: number
  category: string
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
  restaurant: Restaurant
}

export interface Customer {
  id: string
  userId: string
  loyaltyPoints: number
  createdAt: Date
  updatedAt: Date
  user: User
}

export interface Setting {
  id: string
  key: string
  value: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  createdAt: Date
  updatedAt: Date
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  details: string | null
  createdAt: Date
  user: User
} 
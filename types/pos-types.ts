export interface DailyStats {
  totalSales: number
  totalOrders: number
  newCustomers: number
  itemSales: { [key: string]: number }
  customerData?: any[]
  reportsData?: any
  orders?: Order[]
  kitchenOrdersData?: any[]
}

export interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
  services: {
    service: {
      id: string
      name: string
      price: number
    }
    quantity: number
  }[]
}

export interface OrderItem {
  id: string
  menuItem: MenuItem
  quantity: number
  customizations?: {
    name: string
    price: number
  }[]
  specialInstructions?: string
  isFree?: boolean
  selectedAddons?: Array<{
    addon: {
      id: string
      name: string
      price: number
    }
    quantity: number
  }>
}

export interface CustomizeOrderProps {
  menuItem: MenuItem
  onSave: (orderItem: Omit<OrderItem, "id">) => void
  onCancel: () => void
  formatCurrency: (amount: number) => string
}

export interface Order {
  id: string
  items: {
    id: string
    name: string
    price: number
    quantity: number
    notes?: string
  }[]
  customer?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled"
  type: string
  total: number
  subtotal: number
  tax: number
  createdAt: string
}

export interface LoyaltyPoint {
  points: number
  type: string
}

export interface Customer {
  id: string
  userId?: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  loyaltyPoints: number
  status: string
  createdAt: string
  updatedAt: string
}

export interface OrderDisplay {
  id: number
  status: string
  color: string
  items: number
  customer?: {
    firstName: string
    lastName: string
    phoneNumber: string
  }
  total?: number
  type?: string
  tableNumber?: string
}

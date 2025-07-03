export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  orderHistory?: Order[];
  loyaltyPoints?: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  isRecommended?: boolean;
  discount?: number;
  customizations?: {
    name: string;
    price: number;
  }[];
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations?: {
    name: string;
    price: number;
  }[];
  specialInstructions?: string;
  isFree?: boolean;
}

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  status: 'ready' | 'in-progress' | 'completed' | 'cancelled';
  type: 'dine-in' | 'pickup' | 'delivery';
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  orderDate: Date;
  specialInstructions?: string;
  tableNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
} 

export interface OrderDisplay {
  id: number
  status: string
  color: string
  items: number
}

export interface CustomizeOrderProps {
  menuItem: MenuItem
  onSave: (orderItem: Omit<OrderItem, "id">) => void
  onCancel: () => void
  formatCurrency: (amount: string | number) => string
}
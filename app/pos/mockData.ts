import { Category, MenuItem, Customer } from './types';

export const categories: Category[] = [
  { id: 'all', name: 'All Menu', icon: '🍽️', itemCount: 72 },
  { id: 'burger', name: 'Burger', icon: '🍔', itemCount: 12 },
  { id: 'juice', name: 'Juice', icon: '🥤', itemCount: 15 },
  { id: 'britto', name: 'Britto', icon: '🌯', itemCount: 5 },
  { id: 'salad', name: 'Salad', icon: '🥗', itemCount: 8 },
  { id: 'tacos', name: 'Tacos', icon: '🌮', itemCount: 6 },
  { id: 'sushi', name: 'Sushi', icon: '🍱', itemCount: 12 },
  { id: 'sides', name: 'Sides', icon: '🍟', itemCount: 12 },
];

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Double Cheese Burger',
    price: 12.28,
    category: 'burger',
    image: '/images/1.jpg',
    customizations: [
      { name: 'Extra pickles', price: 0.72 },
      { name: 'Remove lettuce', price: 0 },
      { name: 'Remove tomatoes', price: 0 },
    ],
  },
  {
    id: '2',
    name: 'Package burger & french fries',
    price: 19.28,
    category: 'burger',
    image: '/images/1.jpg',
    customizations: [
      { name: 'Extra pickles', price: 0.72 },
    ],
  },
  {
    id: '3',
    name: 'Tacos Salsa With Chicken Grilled',
    price: 17.22,
    category: 'tacos',
    image: '/images/2.jpg',
    isRecommended: true,
  },
  {
    id: '4',
    name: 'Black Chicken Burger with French Fries',
    price: 23.22,
    category: 'burger',
    image: '/images/3.jpg',
    discount: 20,
  },
  {
    id: '5',
    name: 'Original Meat Burger with Chips',
    price: 21.22,
    category: 'burger',
    image: '/images/4.jpg',
  },
  {
    id: '6',
    name: 'Fresh Melon Juice with Seed Without Sugar',
    price: 8.99,
    category: 'juice',
    image: '/images/1.jpg',
  },
  {
    id: '7',
    name: 'Fresh Orange Juice with Basil Seed no Sugar',
    price: 7.99,
    category: 'juice',
    image: '/images/2.jpg',
    isRecommended: true,
  },
  {
    id: '8',
    name: 'Tasty Vegetable Salad with Eggs for Healthy Diet',
    price: 12.99,
    category: 'salad',
    image: '/images/3.jpg',
    isRecommended: true,
  },
];

export const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '555-0123',
    email: 'john@example.com',
    address: '123 Main St',
    loyaltyPoints: 2500,
    loyaltyTier: 'gold',
    totalSpent: 1250.50
  },
  {
    id: '2',
    name: 'Jane Smith',
    phone: '555-0124',
    email: 'jane@example.com',
    address: '456 Oak Ave',
    loyaltyPoints: 850,
    loyaltyTier: 'silver',
    totalSpent: 425.75
  },
  {
    id: '3',
    name: 'Mike Johnson',
    phone: '555-0125',
    email: 'mike@example.com',
    address: '789 Pine St',
    loyaltyPoints: 150,
    loyaltyTier: 'bronze',
    totalSpent: 75.25
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    phone: '555-0126',
    email: 'sarah@example.com',
    address: '321 Elm St',
    loyaltyPoints: 5000,
    loyaltyTier: 'platinum',
    totalSpent: 2500.00
  }
]; 
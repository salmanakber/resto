import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderItem } from '@/app/pos/types';
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }


    const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        include: {
          role: true,
        },
      });
      
      if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        // valid role
        return new NextResponse("Unauthorized", { status: 401 })
      }
      




    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Get total sales and orders
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(start),
          lte: new Date(end),        
        },
        restaurantId: user.restaurantId
      },
      include: {
        table: {
          select: {
            number: true
          }
        }
      }
    });
    
    // Calculate total sales
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Get new customers
    const customer = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: new Date(start),
          lte: new Date(end),
        },
        restaurantId: user.restaurantId
        ,
      }
    });

    const newCustomers = customer.length;
    const customerData = customer.map(customer => ({
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      totalSpent: customer.totalSpent,
      totalOrders: customer.totalOrders,
      lastOrderDate: customer.lastOrderDate,
      status: customer.status
    }));


    const kitchenOrdersData = orders.map(order => ({
      id: order.id,
      tableNumber: order.table?.number,
      type: order.orderType,
      status: order.status,
      items: JSON.parse(order.items).length,
    }));




    // 1. Gather total quantity sold per menuItemId
const menuItemQuantities: { [menuItemId: string]: number } = {};

orders.forEach(order => {
  const items: OrderItem[] = JSON.parse(order.items);
  items.forEach(item => {
    if (item.menuItemId) {
      menuItemQuantities[item.menuItemId] = (menuItemQuantities[item.menuItemId] || 0) + item.quantity;
    }
  });
});

// 2. Fetch related menu items and their categories
const menuItemIds = Object.keys(menuItemQuantities);

const menuItems = await prisma.menuItem.findMany({
  where: {
    id: { in: menuItemIds }
  },
  include: {
    category: true
  }
});

// 3. Aggregate sales by category
const categorySales: { [categoryName: string]: number } = {};

menuItems.forEach(menuItem => {
  const quantitySold = menuItemQuantities[menuItem.id] || 0;
  const categoryName = menuItem.category.name;

  categorySales[categoryName] = (categorySales[categoryName] || 0) + quantitySold;
});

// 4. Get top-selling category
let topSellingCategory = '';
let maxSales = 0;

Object.entries(categorySales).forEach(([category, quantity]) => {
  if (quantity > maxSales) {
    topSellingCategory = category;
    maxSales = quantity;
  }
});


    // Calculate item sales
    const itemSales: { [key: string]: number } = {};
    orders.forEach(order => {
        const items: OrderItem[] = JSON.parse(order.items);
        items.forEach(item => {
          const itemName = item.name;
          itemSales[itemName] = (itemSales[itemName] || 0) + item.quantity;
        });
      });

      // Calculate hourly sales
const hourlySalesMap: { [key: string]: number } = {};

orders.forEach(order => {
  const date = new Date(order.createdAt);
  const hour = date.getHours();

  const label =
    hour === 0 ? '12AM' :
    hour < 12 ? `${hour}AM` :
    hour === 12 ? '12PM' : `${hour - 12}PM`;

  hourlySalesMap[label] = (hourlySalesMap[label] || 0) + Number(order.totalAmount);
});

const sortOrder = [
  '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM',
  '8AM', '9AM', '10AM', '11AM',
  '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM',
  '8PM', '9PM', '10PM', '11PM'
];

const hourlySales = sortOrder.map(hour => ({
  hour,
  sales: hourlySalesMap[hour] || 0
}));


const reportsData = {
    salesData: orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const existing = acc.find(entry => entry.date === date);
      if (existing) {
        existing.amount += Number(order.totalAmount);
      } else {
        acc.push({ date, amount: Number(order.totalAmount) });
      }
      return acc;
    }, [] as Array<{ date: string; amount: number }>),
  
    categoryData: Object.entries(categorySales).map(([name, value]) => ({
      name,
      value
    })),
  
    topItems: menuItems
      .map(menuItem => ({
        name: menuItem.name,
        quantity: menuItemQuantities[menuItem.id] || 0,
        revenue: menuItem.price * (menuItemQuantities[menuItem.id] || 0)
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
  
    customerMetrics: {
      newCustomers,
      returningCustomers: orders.length - newCustomers, // simple logic
      averageOrderValue: totalSales / (orders.length || 1),
      customerRetention: 0 // placeholder if not calculated yet
    }
  };
  

    return NextResponse.json({
      totalSales,
      totalOrders: orders.length,
      newCustomers,
      itemSales,
      hourlySales,
      topSellingCategory,
      categorySales,
      customerData,
      reportsData,
      kitchenOrdersData,
      orders

    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 
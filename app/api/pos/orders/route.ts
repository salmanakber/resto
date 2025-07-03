import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TooltipPortal } from '@radix-ui/react-tooltip';
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";
import { generateOTP } from "@/lib/utils";
import QRCode from "qrcode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from '@prisma/client';
import { table } from 'console';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      items,
      status,
      type,
      subtotal,
      tax,
      discount,
      total,
      orderDate,
      tableId,
      discountPercentage  
    } = body;

    
    
    // Create the order
// Assuming you have firstName, lastName, email, phoneNumber, and address coming in from request

const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const getsessionUser = await prisma.user.findFirst({
  where: { email: session.user.email },
  include: {
    restaurantLocations: true,
    role: true
  }
});
if (!getsessionUser || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(getsessionUser.role.name)) {
  return NextResponse.json({ error: "Location not found" }, { status: 400 });
}

const location = await prisma.location.findFirst({
  where: {
    userId: getsessionUser.restaurantId
  }
});

const locationId = location?.id;

const currencySetting = await prisma.setting.findUnique({ where: { key: "currency" } });
const defaultCurrency = Object.entries(JSON.parse(currencySetting?.value || "{}")) 
  .find(([_, value]) => (value as Currency).default)?.[0] || "USD";

const loyaltySettings = await prisma.setting.findUnique({ where: { key: "loyalty" } });
const loyaltyConfig = loyaltySettings ? JSON.parse(loyaltySettings.value) : null;

let pointsEarned = 0;
if (loyaltyConfig?.enabled && discountPercentage.amount === 0) {
  pointsEarned = Math.floor(total * loyaltyConfig.earnRate);
}

const getUserById = await prisma.user.findUnique({
  where: {
    id: customerId
  },
  include: {
    loyaltyPoints: {
      where: {
        expiresAt: {
          gt: new Date()
        }
      }
    }
  }
});


if (getUserById?.loyaltyPoints?.usePoints && getUserById.loyaltyPoints.pointsToRedeem > 0) {
  const totalPoints = getUserById.loyaltyPoints.reduce((sum: number, point: { type: string; points: number }) => {
    if (point.type === "earn") {
      return sum + point.points;
    } else {
      return sum - point.points;
    }
  }, 0);
}

await prisma.loyaltyPoint.create({
  data: {
    points: pointsEarned,
    type: "earn",
    user: {
      connect: { id: customerId }
    }
  }
});



// Step: Check or create customer


let customer = await prisma.customer.findFirst({
  where: {
    OR: [
      { phoneNumber: getUserById.phoneNumber },
      ...(getUserById.email ? [{ email: getUserById.email }] : []),
    ],
  },
});

if (!customer) {
  customer = await prisma.customer.create({
    data: {
      firstName: getUserById.firstName,
      lastName: getUserById.lastName,
      email: getUserById.email,
      phoneNumber: getUserById.phoneNumber,
      restaurantId: getsessionUser.restaurantId,
      userId: getUserById.id,
    },
  });
  if(!customer) {
    return NextResponse.json({ error: "The phone number or email is already in use" }, { status: 400 });
  }
}




const otp = generateOTP();
const timeString = (Date.now());
const qrCodeData = JSON.stringify({
  orderId: `ORDER-${timeString}`,
  otp,
  userId: getsessionUser.id
});
const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
// Final order creation
const result = await prisma.$transaction(async (tx: PrismaClient) => {
const order = await tx.order.create({
  data: {
    customerId: customer.id,
    userId: customer.userId,
    totalAmount: total,
    locationId,
    orderNumber: `${timeString}`,
    shippingAddress: '',
    billingAddress: '',
    tableId: type === 'dine-in' ? tableId : null,
    currency: defaultCurrency,
    items: JSON.stringify(items),
    restaurantId: getsessionUser.restaurantId,
    orderType: type,
    paymentMethodId: null,
    paymentDetails: null,
    customerDetails: (type === 'pickup' ? JSON.stringify({email: customer.email, phone: customer.phoneNumber, name: customer.firstName + ' ' + customer.lastName}) : null),
    dineInCustomer: (type === 'dine-in' ? JSON.stringify({email: customer.email, phone: customer.phoneNumber, name: customer.firstName + ' ' + customer.lastName}) : null),
    pickupTime: (type === 'pickup' ? String(new Date()) : null),
    specialInstructions: null,
    status: "preparing",
    paymentStatus: type === 'dine-in' ? "unpaid" : "cash in hand",
    otp,
    discountUsed: (discountPercentage),
    qrCode: qrCodeUrl,
    loyaltyPoints: pointsEarned > 0 ? {
      create: {
        points: pointsEarned,
        type: "earn",
        user: {
          connect: { id: customerId }
        },
        expiresAt: new Date(Date.now() + (loyaltyConfig?.pointExpiryDays || 365) * 86400000)
      }
    } : undefined
  },
  include: {
    Customer: true,

  }
});



if (type === 'dine-in') {
  await tx.table.update({
    where: { id: tableId },
    data: { status: 'occupied' },
  });
}

const kitchenOrder = await tx.kitchenOrder.create({
  data: {
    orderId: order.id,
    restaurantId: getsessionUser.restaurantId as string,
    status: 'pending',
    assignedBy: getsessionUser.id
  },
  include: {
    order: {
      include: {
        table: true
      }
    },
    assigner: {
      select: {
        firstName: true,
        lastName: true
      }
    }
  }
});

const updateCustomer = await tx.customer.update({
  where: { id: customer.id },
  data: {
    totalSpent: {
      increment: total
    },
    totalOrders: {
      increment: 1
    },
    lastOrderDate: new Date()
  }
});


return order;

});




    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const getsessionUser = await prisma.user.findFirst({
      where: { email: session.user.email },
    });
    if (!getsessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(getsessionUser.role.name)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    where.restaurantId = getsessionUser.restaurantId;
    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    
    const orders = await prisma.order.findMany({
      where,
      
      include: {
        customer: true,
        items: {
          include: {
            menuItem: true,
            addons: {
              include: {
                addon: true
              }
            }
          }
        }
      },
      orderBy: {
        orderDate: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 
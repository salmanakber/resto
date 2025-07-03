import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      items,
      tableNumber,
      totalPrepTime,
      orderType,
      customerDetails,
      total,
      orderTime
    } = body;

    // First, check if the table exists and is available
    const table = await prisma.table.findFirst({
      where: {
        number: parseInt(tableNumber),
        isActive: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    if (table.status !== 'available') {
      return NextResponse.json(
        { error: 'Table is currently not available' },
        { status: 400 }
      );
    }

    // Start a transaction to create order and update table status
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          orderNumber: orderId,
          status: 'pending',
          totalAmount: total,
          currency: 'USD',
          paymentStatus: 'pending',
          items: JSON.stringify(items),
          notes: JSON.stringify(customerDetails),
          tableId: table.id,
          // Add other required fields
          restaurantId: table.restaurantId,
          shippingAddress: JSON.stringify({ type: 'dine-in' }),
          billingAddress: JSON.stringify({ type: 'dine-in' }),
        },
      });

      // Update table status to occupied
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'occupied' },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      order: result,
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
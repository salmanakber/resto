import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateOTP } from '@/lib/utils';
import bcrypt from 'bcrypt';
import QRCode from "qrcode";
import { sendSMS } from '@/lib/twilio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, items, tableNumber, totalPrepTime, orderType, customerDetails, total, orderTime } = body;

    if (!orderId || !items || !tableNumber || !orderType || !customerDetails || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    const table = await prisma.table.findFirst({
      where: {
        number: parseInt(tableNumber),
        isActive: true,
      },
      include: {
        restaurant: true
      }
    });

    if (!table) {
      return NextResponse.json(
        { error: `The table #${tableNumber} is an incorrect table number` },
        { status: 404 }
      );
    }

    if (table.status !== 'available') {
      return NextResponse.json(
        { error: `Table ${tableNumber} is currently not available` },
        { status: 400 }
      );
    }

    const restaurantId = table.restaurantId;
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID not found for this table' },
        { status: 400 }
      );
    }

    const loyaltySettings = await prisma.setting.findUnique({ where: { key: "loyalty" } });
    const loyaltyConfig = loyaltySettings ? JSON.parse(loyaltySettings.value) : null;
    let pointsEarned = 0;

    if (loyaltyConfig?.enabled) {
      pointsEarned = Math.floor(total * loyaltyConfig.earnRate);
    }

    // 🔁 Check or create user
    let user = await prisma.user.findFirst({
      where: {
        phoneNumber: customerDetails.phone,
      },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(customerDetails.phone, 10);
      const firstName = customerDetails.name.split(' ')[0];
      const lastName = customerDetails.name.split(' ').slice(1).join(' ');
      const email = customerDetails.phone + '@dinein.com';
      const role = await prisma.role.findFirst({
        where: {
          name: 'customer',
        },
      });

      user = await prisma.user.create({
        data: {
          phoneNumber: customerDetails.phone,
          email: email,
          password: hashedPassword,
          firstName: firstName,
          lastName: lastName,
          roleId: role?.id,
        },
      });
    }

    const userId = user.id;

    // 🔁 Check or create customer record
    const findCustomer = await prisma.customer.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!findCustomer) {
      await prisma.customer.create({
        data: {
          userId: userId,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          restaurantId: restaurantId,
        },
      });
    }

    const getUserById = await prisma.user.findUnique({
      where: {
        id: userId
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

  
    /*
    if (getUserById?.loyaltyPoints?.usePoints && getUserById.loyaltyPoints.pointsToRedeem > 0) {
      const totalPoints = getUserById.loyaltyPoints.reduce((sum: number, point: { type: string; points: number }) => {
        if (point.type === "earn") {
          return sum + point.points;
        } else {
          return sum - point.points;
        }
      }, 0);
    }
    */

    // 🔁 Loyalty point for this transaction (already handled again in order create)
    await prisma.loyaltyPoint.create({
      data: {
        points: pointsEarned,
        type: "earn",
        user: {
          connect: { id: userId }
        }
      }
    });

    // OTP + QR Code logic (not saved but preserved)
    const otp = generateOTP();
    const qrCodeData = JSON.stringify({
      orderId: orderId, // ✅ now uses actual orderId
      otp,
      userId: userId
    });
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    // 🔁 Transaction: create order, update table, update menu categories
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      const order = await tx.order.create({
        data: {
          orderNumber: orderId,
          items: JSON.stringify(items),
          dineInCustomer: JSON.stringify(customerDetails),
          tableId: table.id,
          totalAmount: total,
          status: 'pending',
          paymentStatus: 'pending',
          restaurantId: restaurantId,
          shippingAddress: JSON.stringify({}),
          billingAddress: JSON.stringify({}),
          otp: otp,
          qrCode: qrCodeUrl,
          currency: 'USD',
          customerId: findCustomer?.id,
          loyaltyPoints: pointsEarned > 0 ? {
            create: {
              points: pointsEarned,
              type: "earn",
              user: {
                connect: { id: userId }
              },
              expiresAt: new Date(Date.now() + (loyaltyConfig?.pointExpiryDays || 365) * 86400000)
            }
          } : undefined
        },
      });

      await tx.table.update({
        where: { id: table.id },
        data: { status: 'occupied' },
      });

      for (const item of items) {
        if (item.categoryId) {
          await tx.menuCategory.update({
            where: { id: item.categoryId },
            data: {
              order: {
                increment: 1,
              },
            },
          });
        }
      }

      return order;
    });

    await sendSMS({
      to: customerDetails.phone,
      body: `Your order has been placed. Please wait for the order to be ready. Your order number is: ${orderId}`,
      ip: request.headers.get('x-forwarded-for') || '::1'
    });

    return NextResponse.json({
      message: 'Order placed successfully',
      order: result,
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { error: 'Failed to place order. Please try again.' },
      { status: 500 }
    );
  }
}

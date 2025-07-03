import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { initSocket } from "@/lib/socket";
import { sendEmail } from '@/lib/email';
import { sendSMS } from "@/lib/twilio";

interface OrderItem {
  id: string;
  name: string;
  status: string;
}

async function getEmailAndSmsSettings(key: string) {
  const emailSettings = await prisma.setting.findUnique({
    where: { key: key }
  });
  return emailSettings?.value;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const { orderId } = params;
    const {status}  = await request.json();

    const order = await prisma.kitchenOrder.findUnique({
      where: { orderId },
      include: {
        order: true,
        staff: true,
        assigner: true
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    let items: OrderItem[] = [];
    try {
      const parsedItems = typeof order.order.items === 'string' 
        ? JSON.parse(order.order.items) 
        : order.order.items;
      
      items = Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid items data format" },
        { status: 400 }
      );
    }

    const updatedItems = items.map((item: OrderItem) => ({
      ...item,
      status: status === 'Completed' ? 'fulfilled' : 'pending'
    }));

    const [updatedKitchenOrder] = await prisma.$transaction([
      prisma.kitchenOrder.update({
        where: { orderId },
        data: {
          status,
          ...(status === 'ready' && { readyAt: new Date() }),
          order: {
            update: {
              items: JSON.stringify(updatedItems),
              status: status
            },
          },
        },
        include: {
          order: true,
          staff: true,
          assigner: true
        }
      })
    ]);

    const companySetting = await getEmailAndSmsSettings("company");
    const companyName = companySetting ? JSON.parse(companySetting).name : "Restaurant";

    const emailSetting = await getEmailAndSmsSettings("OTP_EMAIL_ENABLED");
    const smsSetting = await getEmailAndSmsSettings("OTP_PHONE_ENABLED");

    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: { name: "item_feedback" }
    });

    

    const customer = await prisma.user.findUnique({
      where: {
        id: order.order.userId || undefined
      }
    });

    if (emailTemplate && status === "Completed" && emailSetting === "true" && customer?.email) {
      const firstItem = items[0];
      if (firstItem) {
        const templateData = {
          userName: order.order.orderType === "dine-in" ? customer.firstName || "Customer" : "Customer",
          restaurantName: companyName,
          itemName: firstItem.name,
          feedbackLink: `${process.env.NEXTAUTH_URL}/feedback?userId=${customer.id}&itemId=${firstItem.id}&restaurantId=${order.order.restaurantId}`
        };
      
        await sendEmail({
          to: customer.email,
          subject: emailTemplate.subject?.replace("{{restaurantName}}", companyName).replace("{{userName}}", customer.firstName || "Customer") || "",
          html: emailTemplate.body
            ?.replace("{{userName}}", templateData.userName)
            .replace("{{restaurantName}}", templateData.restaurantName)
            .replace("{{itemName}}", templateData.itemName)
            .replace("{{feedbackLink}}", templateData.feedbackLink) || ""
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order status updated successfully",
      kitchenOrder: updatedKitchenOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update order status" },
      { status: 500 }
    );
  }
} 
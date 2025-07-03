import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/twilio";
import { generateOTP } from "@/lib/utils";
import QRCode from "qrcode";

// Validation schema




const orderSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    selectedAddons: z.array(z.object({
      name: z.string(),
      price: z.number()
    })).optional()
  })),
  total: z.number(),
  orderType: z.literal("pickup"),
  locationId: z.string(),
  paymentMethod: z.enum(["credit", "paypal", "cash"]),
  paymentDetails: z.object({
    paypalOrderId: z.string().optional(),
    status: z.string().optional()
  }).optional(),
  customerDetails: z.object({
    email: z.string().email(),
    phone: z.string(),
    name: z.string()
  }),
  totalPrepTime: z.number().optional(),
  pickupTime: z.string(),
  specialInstructions: z.string().optional(),
  loyaltyPoints: z.object({
    usePoints: z.boolean(),
    pointsToRedeem: z.number(),
    loyaltyPointType: z.enum(["earn", "redeem"]).optional(),
    loyaltyPointsRedeemed: z.number().optional(),
    discount: z.number().optional()
  }).optional(),
  orderNumber: z.number(),
  resturantId: z.string(),
  userId: z.string().optional() // ✅ <-- Add this line
});



async function getEmailAndSmsSettings(key: string) {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value;
}



export async function POST(request: Request) {

  
  try {
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validatedData = await request.json();
    
    // Validate payment status
    if (validatedData.paymentMethod !== "cash" && validatedData.paymentDetails?.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    

    // Get user with active loyalty points
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        loyaltyPoints: {
          where: { expiresAt: { gt: new Date() } }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle loyalty redemption if applicable
    if (validatedData.loyaltyPoints?.loyaltyPointType === "redeem" && validatedData.loyaltyPoints?.pointsToRedeem > 0) {

      await prisma.loyaltyPoint.create({
        data: {
          points: validatedData.loyaltyPoints?.pointsToRedeem,
          type: "redeem",
          expiresAt: new Date(Date.now() +  365 * 86400000),
          user: { connect: { id: user.id } }
        }
      });
    }


    // Generate OTP and QR code
    const otp = generateOTP();
    const orderNumber = validatedData.orderNumber;
    const qrData = JSON.stringify({
      orderId: `ORDER-${orderNumber}`,
      otp,
      userId: user.id
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Get default currency
    const currencySetting = await prisma.setting.findUnique({ where: { key: "currency" } });
    const defaultCurrency = Object.entries(JSON.parse(currencySetting?.value || '{}'))
      .find(([_, value]) => (value as any).default)?.[0] || 'USD';

    // Loyalty points earning
    const loyaltySettings = await prisma.setting.findUnique({ where: { key: "loyalty" } });
    const loyaltyConfig = loyaltySettings ? JSON.parse(loyaltySettings.value) : null;
    let pointsEarned = 0;

    if (loyaltyConfig?.enabled && validatedData.loyaltyPoints?.loyaltyPointType === "earn") {
      pointsEarned = Math.floor(validatedData.total * loyaltyConfig.earnRate);
    }

    
  

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        totalAmount: validatedData.total,
        locationId: validatedData.locationId,
        orderNumber: String(validatedData.orderNumber),
        shippingAddress: '',
        billingAddress: '',
        currency: defaultCurrency,
        items: JSON.stringify(validatedData.items),
        restaurantId: validatedData.resturantId,
        orderType: validatedData.orderType,
        paymentMethodId: null,
        paymentDetails: validatedData.paymentDetails,
        customerDetails: validatedData.customerDetails,
        pickupTime: validatedData.pickupTime,
        specialInstructions: validatedData.specialInstructions,
        discountUsed: JSON.stringify({
          type: 'loyalty',
          points: validatedData.loyaltyPoints?.pointsToRedeem || 0,
          amount: validatedData.loyaltyPoints?.discount || 0
        }),
        status: "pending",
        paymentStatus: validatedData.paymentDetails?.status === 'COMPLETED' ? 'paid' : 'unpaid',
        otp,
        qrCode: qrCodeUrl,
        loyaltyPoints: pointsEarned > 0 ? {
          create: {
            points: pointsEarned,
            type: "earn",
            user: { connect: { id: user.id } },
            expiresAt: new Date(Date.now() + (loyaltyConfig?.pointExpiryDays || 365) * 86400000)
          }
        } : undefined
      }
    });

    // Send notifications
    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: { name: "order_confirmation" }
    });

    const companySetting = await getEmailAndSmsSettings("company");
    const companyName = companySetting ? JSON.parse(companySetting).name : "Restaurant";

    const templateData = {
      userName: validatedData.customerDetails.name,
      restaurantName: companyName,
      orderId: order.orderNumber,
      totalAmount: validatedData.total.toFixed(2),
      estimatedDeliveryTime: validatedData.pickupTime,
    orderTrackingLink: `${process.env.NEXTAUTH_URL}/order-confirmation/${order.id}`,
      qrCodeLink: `${process.env.NEXTAUTH_URL}/scan-qr/${order.id}`
    };

    const emailSetting = await getEmailAndSmsSettings("OTP_EMAIL_ENABLED");
    if (emailTemplate && emailSetting === "true") {
      await sendEmail({
        to: validatedData.customerDetails.email,
        subject: emailTemplate.subject.replace("{{orderId}}", order.orderNumber),
        html: emailTemplate.body
          .replace("{{userName}}", templateData.userName)
          .replace("{{restaurantName}}", templateData.restaurantName || "Restaurant")
          .replace("{{orderId}}", templateData.orderId)
          .replace("{{totalAmount}}", templateData.totalAmount)
          .replace("{{estimatedDeliveryTime}}", templateData.estimatedDeliveryTime)
          .replace("{{orderTrackingLink}}", templateData.orderTrackingLink)
      });
    }

    const smsSetting = await getEmailAndSmsSettings("OTP_PHONE_ENABLED");
    if (smsSetting === "true") {
      const smsTemplate = await getEmailAndSmsSettings("smsTemplate");
      const smsTemplateData = JSON.parse(smsTemplate || '{}');
      const smsBody = smsTemplateData?.order?.body || '';

      await sendSMS({
        to: validatedData.customerDetails.phone,
        body: smsBody
          .replace("{{orderId}}", order.orderNumber)
          .replace("{{otp}}", otp)
      });
    }

    return NextResponse.json({
      orderId: order.id,
      otp,
      qrCodeUrl,
      pointsEarned
    });

  } catch (error) {
    console.error("Error creating order:", error);
    console.log(error ,"error cc")
    if (error instanceof z.ZodError) {
      console.log("🛑 Zod validation failed:\n", JSON.stringify(error.format(), null, 2));
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

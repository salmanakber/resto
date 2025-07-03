import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import Stripe from "stripe";



const getStripeInstance = async () => {
  const settings = await prisma.setting.findUnique({
    where: { key: 'paymentGateway' }
  });

  if (!settings) throw new Error('Payment gateway settings not found');

  const paymentSettings = JSON.parse(settings.value);
  if (!paymentSettings.credential.stripe.enabled) {
    throw new Error('Stripe is not enabled');
  }
  return new Stripe(paymentSettings.credential.stripe.secretKey, {
    apiVersion: '2023-10-16'
  });
};

// Schema for payment method validation
const paymentMethodSchema = z.object({
token: z.string(),
cardHolderName: z.string(),
isDefault: z.boolean().optional(),
});

// GET /api/payment-methods
export async function GET() {
  try {
    const session = await getServerSession(authOptions);


    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    // Get payment methods for the user
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: {
        userId: user.id,
        stripeCustomerId: {
          not: null,
        },
        isActive: true,
      },
      orderBy: {
        isDefault: "desc",
      },
    });

    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/payment-methods
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const stripe = await getStripeInstance();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = paymentMethodSchema.parse(body);

    // ✅ Create Stripe customer if needed
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        phone: user.phoneNumber ?? undefined,
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // ✅ Create a PaymentMethod using the token
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: { token: validated.token },
      billing_details: {
        name: validated.cardHolderName,
        email: user.email,
      },
    });

    // ✅ Attach to customer
    const attachPaymentMethod = await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });

    // ✅ Set default if applicable
    if (validated.isDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      // Unset existing default cards in DB
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    console.log(attachPaymentMethod , "attachPaymentMethod");

    // ✅ Save in DB
    const saved = await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        paymentMethodId: paymentMethod.id,
        stripeCustomerId: customerId,
        type: "card",
        provider: attachPaymentMethod.card?.brand ?? "",
        cardNumber: `****${paymentMethod.card?.last4 ?? ""}`,
        cardHolderName: validated.cardHolderName,
        expiryMonth: paymentMethod.card?.exp_month ?? 0,
        expiryYear: paymentMethod.card?.exp_year ?? 0,
        isDefault: validated.isDefault ?? false,
      },
    });
    console.log(saved , "saved");

    return NextResponse.json(saved);
  } catch (error) {
    console.error("Add Card Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
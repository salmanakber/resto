import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  const currency = await prisma.setting.findUnique({
    where: { key: "currency" }
  });
  const defaultCurrency = Object.entries(JSON.parse(currency?.value as string)).find(([_, value]) => (value as Currency).default)?.[0];

  try {
    const {
      amount,
      paymentMethodId,
      savePaymentMethod,
      customerEmail,
      customerName,
      customerPhone
    } = await req.json();

    if (!amount || !paymentMethodId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stripe = await getStripeInstance();
    let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          phone: customerPhone
        });

        customerId = customer.id;
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            firstName: customerName?.split(' ')[0] || '',
            lastName: customerName?.split(' ').slice(1).join(' ') || '',
            phoneNumber: customerPhone || undefined
          }
        });
      

      
      // Attach payment method to Stripe customer
      const attachPaymentMethod = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      


      // Set default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      
      // Save payment method in DB if not exists
      const cardDetails = await stripe.paymentMethods.retrieve(paymentMethodId);
if(savePaymentMethod){
      const existingPaymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          userId,
          type: 'card',
          stripeCustomerId: customerId,
          cardNumber: `****${cardDetails.card?.last4}`,
        },
      });
      if (!existingPaymentMethod) {
        await prisma.paymentMethod.create({
          data: {
            userId,
            paymentMethodId: paymentMethodId,
            type: 'card',
            provider: attachPaymentMethod.card?.brand ?? "",
            cardNumber: `****${cardDetails.card?.last4}`,
            expiryMonth: cardDetails.card?.exp_month || 0,
            expiryYear: cardDetails.card?.exp_year || 0,
            cardHolderName: customerName,
            isDefault: true,
            stripeCustomerId: customerId,
          },
        });
      }
    }
      // Create payment intent with future usage
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100),
        currency: defaultCurrency,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true
        }
      }
      if (customerId && typeof customerId === "string" && customerId.trim() !== "") {
        paymentIntentData.customer = customerId
        paymentIntentData.off_session = true
      }
      
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: defaultCurrency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
            enabled: true
          },
        off_session: true // <-- only if charging without user input
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    });

  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment failed' },
      { status: 500 }
    );
  }
}








































































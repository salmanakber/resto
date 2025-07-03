import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const getStripeInstance = async () => {
  const settings = await prisma.setting.findUnique({
    where: { key: "paymentGateway" },
  })

  if (!settings) throw new Error("Payment gateway settings not found")

  const paymentSettings = JSON.parse(settings.value)
  if (!paymentSettings.credential.stripe.enabled) {
    throw new Error("Stripe is not enabled")
  }
  return new Stripe(paymentSettings.credential.stripe.secretKey, {
    apiVersion: "2023-10-16",
  })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardNumber, expiryMonth, expiryYear, cvv, cardHolderName, customerDetails } = await req.json()

    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardHolderName) {
      return NextResponse.json({ error: "Missing required card details" }, { status: 400 })
    }

    const stripe = await getStripeInstance()

    // Create a payment method with Stripe
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardNumber,
        exp_month: Number.parseInt(expiryMonth),
        exp_year: Number.parseInt(expiryYear),
        cvc: cvv,
      },
      billing_details: {
        name: cardHolderName,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
    })

    return NextResponse.json({
      paymentMethodId: paymentMethod.id,
      success: true,
    })
  } catch (error) {
    console.error("Payment method creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment method" },
      { status: 500 },
    )
  }
}

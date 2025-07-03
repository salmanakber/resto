import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  context: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { restaurantId: true },
    })

    if (!user?.restaurantId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { otp } = await request.json()
    const { orderId } = context.params

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId: user.restaurantId,
        orderType: "pickup",
      },
    })

    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    if (order.otp !== otp) {
      return new NextResponse("The OTP you entered is incorrect", { status: 400 })
    }

    if (order.status !== "pending" && order.status !== "preparing") {
      return new NextResponse("Order is not in pending or preparing state. Please wait!", {
        status: 400,
      })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: "completed" },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("[PICKUP_ORDER_VERIFY_SELECTED]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

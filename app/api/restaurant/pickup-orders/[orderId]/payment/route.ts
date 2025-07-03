import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  context: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user?.restaurantId) {
      return new NextResponse("User not found", { status: 404 })
    } 



const params = await context.params;
const { orderId } = params;

const { status } = await req.json()

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

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("[PICKUP_ORDER_PAYMENT]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

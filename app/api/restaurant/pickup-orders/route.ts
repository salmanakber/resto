import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Order } from "@prisma/client"

type OrderWithRelations = Order & {
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    console.log("status from url", status)
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        restaurantId: true,
      },
    })

    if(!user?.restaurantId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    
    const orders = await prisma.order.findMany({
      where: {
        restaurantId: user.restaurantId,
        orderType: "pickup",
        status: status
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedOrders = orders.map((order) => {
      const customerDetails = order.customerDetails as {
        name: string;
        phone: string;
        email: string;
      }
      const items = JSON.parse(order.items as string) as Array<{
        name: string;
        quantity: number;
        price: number;
      }>

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerDetails,
        items,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethodId,
        pickupTime: order.pickupTime,
        status: order.status,
        otp: order.otp,
        qrCode: order.qrCode,
        discountUsed: order.discountUsed,
      }
    })

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error("[PICKUP_ORDERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 



export async function POST(request: Request) {
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

    const order = await prisma.order.findFirst({
      where: {
        otp,
        restaurantId: user.restaurantId,
        orderType: "pickup",
        status: "ready",
      },
    })

    if (!order) {
      return new NextResponse("No ready order found with the given OTP", { status: 404 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: "completed" },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("[PICKUP_ORDER_OTP_SEARCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

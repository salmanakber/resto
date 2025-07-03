import { NextResponse, NextRequest  } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
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
    

    // {orderId: 'ORDER-1748038692533', otp: '560976', userId: '5687fa66-029f-4c96-98b1-646a2d6bcd5d'}

    const data = await request.json()
    const { otp, orderId } = data.data
    console.log('otp' , otp)
    console.log('orderId' , orderId)
    console.log('data here ' , data)
    const orderNumber = orderId.replace("ORDER-", "")
    console.log('orderNumber' , orderNumber , otp, user.restaurantId)

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
        restaurantId: user.restaurantId,
        otp,
        orderType: "pickup", 
      },
      include: {
        kitchenOrder: true,
      }
    })

    
    if (!order) {
      return new NextResponse("Order not found", { status: 404 })
    }

    if(!order.kitchenOrder) {
      return new NextResponse("Order not ready yet", { status: 404 })
    }
    

    if (order.otp !== otp) {
      return new NextResponse("Invalid OTP", { status: 400 })
    }
    console.log('order here otp ' , order)

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "completed",
        kitchenOrder: {
          update: {
            status: "completed",
          },
        },
      },
    })
    if (!updatedOrder) {
      return new NextResponse("Order not ready yet", { status: 404 })
    }
    return  NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("[PICKUP_ORDER_VERIFY]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initSocket } from "@/lib/socket";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    // Get the kitchen order
    const kitchenOrder = await prisma.kitchenOrder.findUnique({
      where: { orderId },
      include: { 
        order: true,
        staff: true,
        assigner: true
      }
    });

    if (!kitchenOrder) {
      return NextResponse.json({ error: "Kitchen order not found" }, { status: 404 });
    }

    if (kitchenOrder.status !== "pending") {
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
    }

    // Update both kitchen order and main order in a transaction
    const [updatedKitchenOrder, updatedOrder] = await prisma.$transaction([
      // Update kitchen order
      prisma.kitchenOrder.update({
        where: { orderId },
        data: {
          status: "preparing",
          staffId: user.id,
          startedAt: new Date()
        },
        include: {
          order: true,
          staff: true,
          assigner: true
        }
      }),
      // Update main order
      prisma.order.update({
        where: { id: orderId },
        data: { 
          status: "preparing"
        }
      })
    ]);

    // Initialize socket and emit updates
    const socket = await initSocket();
    if (socket) {
      // Emit kitchen order update
      // socket.emit("kitchenOrder", {
      //   type: "update",
      //   orders: [updatedKitchenOrder]
      // });

      // Emit order accepted event
      socket.emit("orderAccepted", {
        orderId,
        status: "preparing",
        timestamp: new Date().toISOString(),
        kitchenOrder: updatedKitchenOrder
      });

      // Emit general orders update
      socket.emit("ordersUpdate", {
        type: "update",
        orderIds: [orderId]
      });
    }

    return NextResponse.json({
      success: true,
      kitchenOrder: updatedKitchenOrder,
      order: updatedOrder,
      startedAt: updatedKitchenOrder.startedAt
    });
  } catch (error) {
    console.error("Error accepting kitchen order:", error);
    return NextResponse.json(
      { error: "Failed to accept kitchen order" },
      { status: 500 }
    );
  }
} 
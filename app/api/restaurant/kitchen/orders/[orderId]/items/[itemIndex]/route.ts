import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { initSocket } from "@/lib/socket";

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string; itemIndex: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { orderId, itemIndex } = params;
    const { status } = await request.json();

    if (!status || !['pending', 'fulfilled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }


    // Get the current order with all necessary relations
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

    // Parse the items array safely
    let items;
    try {
      items = Array.isArray(order.order.items) 
        ? order.order.items 
        : JSON.parse(order.order.items);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid items data format" },
        { status: 400 }
      );
    }

    // Validate item index
    const itemIndexNum = parseInt(itemIndex);
    if (isNaN(itemIndexNum) || itemIndexNum < 0 || itemIndexNum >= items.length) {
      return NextResponse.json(
        { success: false, message: "Invalid item index" },
        { status: 400 }
      );
    }

    // Update single item status
    items[itemIndexNum] = {
      ...items[itemIndexNum],
      status
    };

    // Update both kitchen order and main order in a transaction
    const [updatedKitchenOrder, updatedOrder] = await prisma.$transaction([
      // Update kitchen order
      prisma.kitchenOrder.update({
        where: { orderId },
        data: {
          order: {
            update: {
              items: JSON.stringify(items)
            }
          }
        },
        include: {
          order: true,
          staff: true,
          assigner: true
        }
      }),
      // Update main order
      prisma.order.update({
        where: { id: order.order.id },
        data: {
          items: JSON.stringify(items)
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

      // Emit item status update
      socket.emit("itemStatusUpdate", {
        type: "update",
        orders: ['test','test2']
      });

      // Emit general orders update
      socket.emit("ordersUpdate", {
        type: "update",
        orderIds: [orderId]
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Item status updated successfully",
      kitchenOrder: updatedKitchenOrder,
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating item status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update item status" },
      { status: 500 }
    );
  }
} 
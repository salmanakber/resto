import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
export async function PATCH(req: Request, { params }: { params: { orderId: string } }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
  
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      });
  
      if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant", "Kitchen_boy"].includes(user.role.name)) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
  
      const { orderId } = params;
      const { status } = await req.json();
  
      const order = await prisma.kitchenOrder.findUnique({
        where: { orderId },
        include: {
          order: true,
          staff: true,
          assigner: true,
        },
      });
  
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
  
      const updatedOrder = await prisma.kitchenOrder.update({
        where: { id: order.id },
        data: {
          status,
          order: {
            update: { status }
          }
        },
      });
  
      return NextResponse.json({ success: true, updatedOrder }, { status: 200 });
  
    } catch (error: any) {
      return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
    }
  }
  
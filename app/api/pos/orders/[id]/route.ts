import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    const { status } = await request.json();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            role: true,
        },
    });
    
    if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        return new NextResponse("User not found", { status: 404 });
    }

    // Get the kitchen order
    const kitchenOrder = await prisma.kitchenOrder.findUnique({
        where: { orderId: id },
        include: { 
          order: true,
          staff: true,
          assigner: true
        }
      });
  
      if (!kitchenOrder) {
        return NextResponse.json({ error: "The order is not been assigned to the kitchen" }, { status: 404 });
      }
  
    
      // Update both kitchen order and main order in a transaction
      const [updatedKitchenOrder, updatedOrder] = await prisma.$transaction([
        // Update kitchen order
        prisma.kitchenOrder.update({
          where: { orderId: id },
          data: {
            status: status.status,
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
          where: { id: id },
          data: { 
            status: status.status
          }
        })
      ]);

    return NextResponse.json(updatedOrder);
}           
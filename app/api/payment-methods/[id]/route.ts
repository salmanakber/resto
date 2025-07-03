import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for payment method validation
const paymentMethodSchema = z.object({
  isDefault: z.boolean().optional(),
});

// PATCH /api/payment-methods/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = paymentMethodSchema.parse(body);
    
    // If this is set as default, unset any existing default payment methods
    if (validatedData.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the payment method
    const paymentMethod = await prisma.paymentMethod.update({
      where: {
        id: params.id,
        userId: user.id, // Ensure the payment method belongs to the user
      },
      data: validatedData,
    });

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error updating payment method:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-methods/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    // Delete the payment method
    await prisma.paymentMethod.delete({
      where: {
        id: params.id,
        userId: user.id, // Ensure the payment method belongs to the user
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
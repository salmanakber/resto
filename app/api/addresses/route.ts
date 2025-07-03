import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for address validation
const addressSchema = z.object({
  type: z.enum(["home", "work", "other"]),
  isDefault: z.boolean().optional(),
  streetAddress: z.string().min(1, "Street address is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  label: z.string().optional(),
});

// GET /api/addresses - Get all addresses for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);


    if (!session?.user?.email) {
      console.log("No session or email found");
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    

    if (!user) {
      console.log("User not found in database");
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    const validatedData = addressSchema.parse(body);

    // If this is the first address or isDefault is true, handle default address logic
    if (validatedData.isDefault) {
      // Set all other addresses to non-default
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error in POST /api/addresses:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 
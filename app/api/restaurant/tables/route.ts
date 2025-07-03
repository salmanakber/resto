import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { initSocket } from "@/lib/socket";

// Validation schemas
const createTableSchema = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().positive().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }


    const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        include: {
          role: true,
        },
      });
      
      if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
        // valid role
        return new NextResponse("Unauthorized", { status: 401 })
      }
    const tables = await prisma.table.findMany({
      where: {
        restaurantId: user.restaurantId,
      },
      orderBy: { number: "asc" },
    });

    // Emit real-time update
    const io = await initSocket();
    if (io) {
      io.emit("tablesUpdate", tables);
    }

    return NextResponse.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    

    const { number, capacity } = await request.json();
    

    if (!number || !capacity) {
      return NextResponse.json(
        { error: "Table number and capacity are required" },
        { status: 400 }
      );
    }

    // Check if table number already exists
    const existingTable = await prisma.table.findFirst({
      where: { 
        number: parseInt(number),
        restaurantId: user?.restaurantId,
      },
    });

    if (existingTable) {
      return NextResponse.json(
        { error: "Table number already exists" },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: parseInt(capacity),
        status: "available",
        isActive: true,
        restaurantId: user.restaurantId,
      },
    });

    // Emit real-time update
    const io = await initSocket();
    if (io) {
      io.emit("tableCreated", table);
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Table ID is required" },
        { status: 400 }
      );
    }

    const table = await prisma.table.delete({
      where: { id },
    });

    // Emit real-time update
    const io = await initSocket();
    if (io) {
      io.emit("tableDeleted", id);
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
}

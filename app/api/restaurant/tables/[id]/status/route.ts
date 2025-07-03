import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initSocket } from "@/lib/socket";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json();

    if (!status || !["available", "occupied", "reserved"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const table = await prisma.table.update({
      where: { id },
      data: { status },
    });

    // Emit real-time update
    const io = await initSocket();
    if (io) {
      io.emit("tableUpdate", table);
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error updating table status:", error);
    return NextResponse.json(
      { error: "Failed to update table status" },
      { status: 500 }
    );
  }
} 
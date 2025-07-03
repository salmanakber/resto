import { NextResponse } from "next/server";
import { initSocket } from "@/lib/socket";

export async function GET(request: Request) {
  try {
    const io = await initSocket();
    if (!io) {
      return NextResponse.json(
        { error: "Socket server not initialized" },
        { status: 500 }
      );
    }

    // Test the socket connection
    io.emit("test", { message: "Socket server is running" });

    return NextResponse.json({ 
      success: true, 
      message: "Socket server initialized",
      connectedClients: io.sockets.sockets.size
    });
  } catch (error) {
    console.error("Error initializing socket:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to initialize socket", message: errorMessage },
      { status: 500 }
    );
  }
} 
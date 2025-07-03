import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

let io: SocketIOServer | null = null;
let lastTablesState: any[] = [];
let lastOrdersState: any[] = [];

export async function initSocket(res?: NextApiResponseWithSocket) {
  if (io) {
    return io;
  }

  try {
    io = new SocketIOServer({
      path: "/api/socket/io",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      allowUpgrades: true,
    });

    if (process.env.NODE_ENV === 'development') {
      if (res?.socket?.server) {
        res.socket.server.io = io;
        return io;
      }
    }

    const httpServer = new NetServer();
    io.attach(httpServer);
    
    const PORT = process.env.WS_PORT || 3001;
    
    await new Promise((resolve, reject) => {
      httpServer.once('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          resolve(io);
        } else {
          reject(error);
        }
      });

      httpServer.listen(PORT, () => {
        resolve(io);
      });
    });

    return io;
  } catch (error) {
    return null;
  }
}

async function checkDatabaseChanges() {
  try {
    const session = await getServerSession(authOptions);
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email },
    });
    
    if (!user || !user.restaurantId) {
      return;
    }

    const currentOrders = await prisma.order.findMany({
      where: { restaurantId: user.restaurantId },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, createdAt: true, updatedAt: true },
    });

    if (JSON.stringify(currentOrders) !== JSON.stringify(lastOrdersState)) {
      if (io) {
        io.emit("ordersUpdate", {
          type: "update",
          orderIds: currentOrders.map(order => order.id)
        });
      }
      lastOrdersState = currentOrders;
    }
  } catch (error) {
    // Silent fail for database checks
  }
} 
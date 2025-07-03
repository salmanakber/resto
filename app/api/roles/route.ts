import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log("Fetching roles from database...");
    const roles = await prisma.role.findMany({
        where: {
            name: {
                notIn: ['Customer', 'Admin', 'Restaurant']
            }
        },
      orderBy: {
        displayName: 'asc',
      },
    });

    console.log("Fetched roles:", roles);

    if (!roles || roles.length === 0) {
      console.log("No roles found in database");
      return NextResponse.json([]);
    }

    return NextResponse.json(roles);
  } catch (error) {
    console.error("[ROLES_GET] Error fetching roles:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
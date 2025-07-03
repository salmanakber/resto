import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const LoggedInUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    const { id } = params;
    
    if (!id) {
      return new NextResponse("Role ID is required", { status: 400 });
    }

    const role = await prisma.role.findUnique({
      where: {
        id: id,
      },
    });

    if (!role) {
      return new NextResponse("Role not found", { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("[ROLE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
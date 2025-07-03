import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } =  params;
    if (!id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: id},
    });

    if (!user) {  
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("[USER_ME]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

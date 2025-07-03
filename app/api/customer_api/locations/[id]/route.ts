import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  const location = await prisma.location.findUnique({
    where: { id },
  });

  return NextResponse.json(location);
}
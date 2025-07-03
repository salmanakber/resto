import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const dbSession = await prisma.session.findFirst({
    where: {
      sessionToken: id,
      expires: { gt: new Date() },
    },
  });
  return NextResponse.json(dbSession);
}

export async function POST(req: Request) {
  const token = await req.json();
  console.log(token.session_id, 'token dds');
  const dbSession = await prisma.session.update({
    where: {
      id: token.session_id,
    },
    data: {
      lastActiveAt: new Date(),
    },
  });
  return NextResponse.json(dbSession);
}
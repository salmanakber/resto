import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { userId } = params
  const customers = await prisma.customer.findMany({
    where: {
      userId: {
        equals: userId
      }
    },
    include: {
      orders: true
    }
  })
  return NextResponse.json(customers)
}
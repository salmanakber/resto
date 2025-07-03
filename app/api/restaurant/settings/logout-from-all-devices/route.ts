import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { id, type } = await request.json();
    if(type === 'single') {
        await prisma.session.delete({
            where: {
                id: id
            }
        })
    } else {
        await prisma.session.deleteMany({
            where: {
                userId: id
            }
        })
    }
    return NextResponse.json({ message: "Logout successful" })
}

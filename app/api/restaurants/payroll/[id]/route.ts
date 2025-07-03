import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Use context to get `params`
export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (
      !user ||
      !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = context.params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status in body" }, { status: 400 });
    }

    await prisma.payroll.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ message: 'Payroll status updated successfully' });

  } catch (error) {
    console.error('Error updating payroll:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

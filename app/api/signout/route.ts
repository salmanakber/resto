
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const POST = async (req: Request) => {

  // if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await prisma.session.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ message: 'Logged out from all devices' });
}

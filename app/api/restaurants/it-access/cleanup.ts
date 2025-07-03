import { prisma } from '@/lib/prisma';

export async function DELETE() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);

  const deleted = await prisma.user.deleteMany({
    where: {
      role: { name: 'it_access' },
      createdAt: { lt: cutoff },
    },
  });

  return new Response(JSON.stringify({ deleted: deleted.count }), { status: 200 });
} 
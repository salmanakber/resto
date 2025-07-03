import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      role: true,
    },
  });

  if (!user?.restaurantId) {
    return new NextResponse("Restaurant not found", { status: 404 });
  }

  const customers = await prisma.customer.findMany({
    where: {
      restaurantId: user.restaurantId,
    },
  });

  

  // Get availablePoints for each customer
  const updatedCustomers = await Promise.all(
    customers.map(async (customer) => {
      const [earned, redeemed] = await Promise.all([
        prisma.loyaltyPoint.aggregate({
          where: {
            userId: customer.userId,
            type: "earn",
            expiresAt: { gte: new Date() },
          },
          _sum: { points: true },
        }),
        prisma.loyaltyPoint.aggregate({
          where: {
            userId: customer.userId,
            type: "redeem",
          },
          _sum: { points: true },
        }),
      ]);
      console.log(earned , "earned")
      console.log(redeemed , "redeemed")

      const availablePoints =
        (earned._sum.points || 0) - (redeemed._sum.points || 0);

      return {
        ...customer,
        availablePoints,
      };
    })
  );

  console.log(updatedCustomers , "customers updated")

  return NextResponse.json(updatedCustomers);
}

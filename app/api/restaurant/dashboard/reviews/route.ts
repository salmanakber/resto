import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const recentReviews = await prisma.menuItemReview.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        menuItem: true
      }
    });

    const formattedReviews = recentReviews.map(review => ({
      id: review.id,
      name: `${review.user.firstName} ${review.user.lastName}`,
      avatar: review.user.profileImage || '/avatars/default.png',
      rating: review.rating,
      date: review.createdAt,
      comment: review.comment,
      dish: review.menuItem.name
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('Reviews data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews data' },
      { status: 500 }
    );
  }
} 
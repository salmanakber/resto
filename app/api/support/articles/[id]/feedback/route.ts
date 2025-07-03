import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma' // ✅ reuse shared prisma instance
import { headers } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { feedback } = await request.json()
    const ip = headers().get('x-forwarded-for') || 'unknown'
    const articleId = params.id
    const userId = session.user.id

    if (!['helpful', 'not_helpful'].includes(feedback)) {
      return new NextResponse('Invalid feedback type', { status: 400 })
    }

    // ✅ Check if article exists
    const article = await prisma.supportArticle.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return new NextResponse('Article not found', { status: 404 })
    }

    const updateData: any = {}

    // ✅ Handle feedback logic
    const existingFeedback = await prisma.articleFeedback.findUnique({
      where: {
        articleId_ipAddress: {
          articleId,
          ipAddress: ip
        }
      }
    })

    if (!existingFeedback) {
      await prisma.articleFeedback.create({
        data: {
          articleId,
          ipAddress: ip,
          userId,
          feedback
        }
      })

      if (feedback === 'helpful') {
        updateData.helpfulCount = { increment: 1 }
      } else {
        updateData.notHelpfulCount = { increment: 1 }
      }
    } else if (existingFeedback.feedback !== feedback) {
      await prisma.articleFeedback.update({
        where: {
          articleId_ipAddress: {
            articleId,
            ipAddress: ip
          }
        },
        data: { feedback }
      })

      if (existingFeedback.feedback === 'helpful') {
        updateData.helpfulCount = { decrement: 1 }
      } else {
        updateData.notHelpfulCount = { decrement: 1 }
      }

      if (feedback === 'helpful') {
        updateData.helpfulCount = { increment: 1 }
      } else {
        updateData.notHelpfulCount = { increment: 1 }
      }
    }

    // ✅ Update article stats
    const updatedArticle = await prisma.supportArticle.update({
      where: { id: articleId },
      data: updateData
    })

    return NextResponse.json(updatedArticle)

  } catch (error) {
    console.error('Error in article feedback:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

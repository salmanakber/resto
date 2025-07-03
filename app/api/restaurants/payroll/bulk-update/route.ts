import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { payrollIds, status } = body

    if (!payrollIds || !status) {
      return NextResponse.json(
        { error: 'Payroll IDs and status are required' },
        { status: 400 }
      )
    }

    // Update all payrolls in a transaction
    await prisma.$transaction(
      payrollIds.map((id: string) =>
        prisma.payroll.update({
          where: { id },
          data: { status },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating payroll status:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 
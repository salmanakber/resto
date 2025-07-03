import { NextResponse } from 'next/server'
import { startOfDay, endOfDay, subDays } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const { searchQuery, dateRange, customDateRange, status } = await req.json()

    // Determine date range
    let startDate: Date
    let endDate: Date = new Date()

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(new Date())
        endDate = endOfDay(new Date())
        break
      case 'week':
        startDate = startOfDay(subDays(new Date(), 7))
        endDate = endOfDay(new Date())
        break
      case 'month':
        startDate = startOfDay(subDays(new Date(), 30))
        endDate = endOfDay(new Date())
        break
      case 'custom':
        if (customDateRange?.start && customDateRange?.end) {
          startDate = startOfDay(new Date(customDateRange.start))
          endDate = endOfDay(new Date(customDateRange.end))
        } else {
          startDate = startOfDay(new Date())
          endDate = endOfDay(new Date())
        }
        break
      default:
        startDate = startOfDay(new Date())
        endDate = endOfDay(new Date())
    }

    const where: Prisma.OrderWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (searchQuery) {
      where.OR = [
        { orderNumber: { contains: searchQuery } }
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // CSV header
    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Order Type',
      'Table Number',
      'Status',
      'Payment Method',
      'Total Amount',
      'Created At',
      'Items'
    ].join(',')

    const rows = orders.map(order => {
      // Parse order.items
      let itemsArray: any[] = []
      if (typeof order.items === 'string') {
        try {
          itemsArray = JSON.parse(order.items)
        } catch {
          itemsArray = []
        }
      } else if (Array.isArray(order.items)) {
        itemsArray = order.items
      }

      const itemsString = itemsArray
        .map(item => `${item.name} (${item.quantity}x)`)
        .join('; ')

      // Parse customerDetails
      let customer: any = {}
      if (typeof order.customerDetails === 'string') {
        try {
          customer = JSON.parse(order.customerDetails)
        } catch {
          customer = {}
        }
      } else if (typeof order.customerDetails === 'object' && order.customerDetails !== null) {
        customer = order.customerDetails
      }

      const customerName = customer.name || ''
      const customerEmail = customer.email || ''
      const customerPhone = customer.phone || ''

      const fields = [
        order.orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        order.orderType || '',
        order.tableId || '',
        order.status,
        order.paymentMethodId || '',
        order.totalAmount,
        order.createdAt.toISOString(),
        itemsString
      ]

      return fields.map(value =>
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    })

    const csv = [headers, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting orders:', error)
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}

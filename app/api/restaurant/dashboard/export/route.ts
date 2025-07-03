import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ExcelJS from "exceljs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { period, data } = await req.json()

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Restaurant Dashboard"
    workbook.created = new Date()

    // Add Overview sheet
    const overviewSheet = workbook.addWorksheet("Overview")
    overviewSheet.columns = [
      { header: "Metric", key: "metric", width: 20 },
      { header: "Value", key: "value", width: 15 },
      { header: "Change", key: "change", width: 15 },
    ]

    overviewSheet.addRows([
      { metric: "Total Orders", value: data.stats.stats.orders, change: `${data.stats.stats.orders} orders` },
      { metric: "Total Revenue", value: data.stats.stats.income, change: `${data.stats.stats.income} revenue` },
      { metric: "Total Customers", value: data.stats.stats.customers, change: `${data.stats.stats.customers} customers` },
      { metric: "Menu Items", value: data.stats.stats.menus, change: `${data.stats.stats.menus} items` },
    ])

    // Add Category Performance sheet
    const categorySheet = workbook.addWorksheet("Category Performance")
    categorySheet.columns = [
      { header: "Category", key: "name", width: 20 },
      { header: "Orders", key: "orders", width: 15 },
      { header: "Revenue", key: "revenue", width: 15 },
      { header: "Rating", key: "rating", width: 15 },
    ]

    categorySheet.addRows(data.categoryPerformance.map((category: any) => ({
      name: category.name,
      orders: category.orderCount,
      revenue: category.revenue,
      rating: category.averageRating,
    })))

    // Add Staff Performance sheet
    const staffSheet = workbook.addWorksheet("Staff Performance")
    staffSheet.columns = [
      { header: "Staff Name", key: "name", width: 20 },
      { header: "Role", key: "role", width: 15 },
      { header: "Orders", key: "orders", width: 15 },
      { header: "Completed", key: "completed", width: 15 },
      { header: "Efficiency", key: "efficiency", width: 15 },
      { header: "Avg Time", key: "avgTime", width: 15 },
    ]

    staffSheet.addRows(data.staffPerformance.map((staff: any) => ({
      name: staff.name,
      role: staff.role,
      orders: staff.orders,
      completed: staff.completedOrders,
      efficiency: `${staff.efficiency}%`,
      avgTime: `${staff.averageTime} min`,
    })))

    // Add Order Performance sheet
    const orderSheet = workbook.addWorksheet("Order Performance")
    orderSheet.columns = [
      { header: "Metric", key: "metric", width: 20 },
      { header: "Percentage", key: "percentage", width: 15 },
    ]

    orderSheet.addRows([
      { metric: "On Time", percentage: `${data.orderPerformance.onTime}%` },
      { metric: "Delayed", percentage: `${data.orderPerformance.delayed}%` },
      { metric: "Cancelled", percentage: `${data.orderPerformance.cancelled}%` },
    ])

    // Add Hourly Orders sheet
    const hourlySheet = workbook.addWorksheet("Hourly Orders")
    hourlySheet.columns = [
      { header: "Hour", key: "hour", width: 15 },
      { header: "Orders", key: "orders", width: 15 },
      { header: "Revenue", key: "revenue", width: 15 },
    ]

    hourlySheet.addRows(data.hourlyOrders)

    // Add Customer Reviews sheet
    const reviewsSheet = workbook.addWorksheet("Customer Reviews")
    reviewsSheet.columns = [
      { header: "Customer", key: "name", width: 20 },
      { header: "Rating", key: "rating", width: 15 },
      { header: "Comment", key: "comment", width: 40 },
      { header: "Date", key: "date", width: 20 },
    ]

    reviewsSheet.addRows(data.customerReviews.map((review: any) => ({
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.date).toLocaleDateString(),
    })))

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="restaurant-dashboard-${period}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 
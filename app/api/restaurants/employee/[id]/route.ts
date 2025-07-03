import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const LoggedInUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    const { id } = params;
    if (!id) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id: id,
        restaurantId: LoggedInUser.id,
      },
    });
    console.log('employee data', employee);

    if (!employee) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    // Format the response to include all necessary fields
    const formattedEmployee = {
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      joiningDate: employee.joiningDate,
      salary: employee.salary,
      status: employee.status,
      restaurantId: employee.restaurantId,
      userId: employee.userId,
    };

    return NextResponse.json(formattedEmployee);
  } catch (error) {
    console.error("[EMPLOYEE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const LoggedInUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    const { id } = params;
    if (!id) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      joiningDate,
      salary,
      status,
    } = body;
    console.log('body', body);
    // Update employee and user data
    const updatedEmployee = await prisma.employee.update({
      where: {
        id: id,
        restaurantId: LoggedInUser.id,
      },
      data: {
        department: department,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        salary: salary,
        phone: phone ? phone : undefined,
        status: status,
        user: {
          update: {
            firstName,
            lastName,
            email,
            phoneNumber: phone ? phone : undefined,
            role,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
      },
    });

    // Format the response
    const formattedEmployee = {
      id: updatedEmployee.id,
      firstName: updatedEmployee.firstName,
      lastName: updatedEmployee.lastName,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      role: updatedEmployee.role,
      department: updatedEmployee.department,
      joiningDate: updatedEmployee.joiningDate,
      salary: updatedEmployee.salary,
      status: updatedEmployee.status,
    };

    return NextResponse.json(formattedEmployee);
  } catch (error) {
    console.error("[EMPLOYEE_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

// Permission types
export const PERMISSION_LEVELS = {
  CLERK_WAITER: [
    'MANAGE_POS',
    'MODIFY_ORDER',
    'KITCHEN_DISPLAY_SCREEN'
  ],
  ASSIST_SUPERVISOR: [
    'MANAGE_POS',
    'MODIFY_ORDER',
    'KITCHEN_DISPLAY_SCREEN',
    'KITCHEN_DASHBOARD'
  ],
  MANAGER_SENIOR: [
    'MANAGE_POS',
    'MODIFY_ORDER',
    'KITCHEN_DISPLAY_SCREEN',
    'KITCHEN_DASHBOARD',
    'EMPLOYEE_MODULE_ACCESS',
    'DELETE_ORDER'
  ],
  OWNER_HEAD: [
    'MANAGE_POS',
    'MODIFY_ORDER',
    'KITCHEN_DISPLAY_SCREEN',
    'KITCHEN_DASHBOARD',
    'RESTAURANT_DASHBOARD',
    'EMPLOYEE_MODULE_ACCESS',
    'DELETE_ORDER',
    'SETUP_IT_DEPARTMENT'
  ]
} as const;

export type PermissionLevel = keyof typeof PERMISSION_LEVELS;

async function getEmailAndSmsSettings(key: string) {
    const emailSettings = await prisma.setting.findUnique({
      where: { key: key }
    });
    return emailSettings?.value;
  }

// GET all employees
export async function GET(req: Request) {
  try {
    
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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
    
    
    if (!user || !["Admin", "Restaurant_supervisor", "Restaurant_manager", "Restaurant"].includes(user.role.name)) {
      return new NextResponse("User not found", { status: 404 });
    }
  
    
    if (!user.restaurantId) {
      return new NextResponse("User is not associated with a restaurant", { status: 400 });
    }
    

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const role = searchParams.get("role");


    const employees = await prisma.employee.findMany({
      where: {
        restaurantId: user.restaurantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
   

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[EMPLOYEE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST new employee
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const LoggedInUser = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    const body = await req.json();
    const { firstName, lastName, email, phone, roleId, department, joiningDate, salary, password } = body;

  

    const findemail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (findemail) {
      return new NextResponse("The email you entered is already in use", { status: 400 });
    }

    const restaurant = await prisma.setting.findUnique({
      where: {
        key: 'company',
      },
    }); 
    if (!restaurant) {
      return new NextResponse("Restaurant not found", { status: 404 });
    }
    const restaurantData = JSON.parse(restaurant.value);

    // Create user first
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: roleId, // Assuming role is the roleId
        restaurantId: LoggedInUser.id, // restaurantId is the id of the user who is logged in
        emailVerified: true,
        isActive: true,
      },
    });

    // Then create employee
    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role: roleId,
        department,
        joiningDate: new Date(joiningDate),
        salary,
        restaurantId: LoggedInUser.id,
        userId: user.id,
      },
    });


    const emailSettings = await getEmailAndSmsSettings('OTP_EMAIL_ENABLED');
    const smsSettings = await getEmailAndSmsSettings('OTP_PHONE_ENABLED');
    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: {
        name: 'employee_welcome_created_by_admin',
      }
    });

    if (!emailTemplate) {
      return new NextResponse("Email template not found", { status: 404 });
    }




    const emailTemplateVariables = JSON.parse(emailTemplate.variables); // array of strings
    const variablesObject = {
      userName: firstName,
      restaurantName: restaurantData.name,
      email: body.email,
      password: body.password,
      loginLink: `${process.env.NEXTAUTH_URL}/login`
    };
    
    let emailTemplateBodyString = emailTemplate.body;
    let emailTemplateSubjectString = emailTemplate.subject;
    
    emailTemplateVariables.forEach((variable: string) => {
      const value = variablesObject[variable as keyof typeof variablesObject] ?? '';
      const regex = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      emailTemplateBodyString = emailTemplateBodyString.replace(regex, value);
      emailTemplateSubjectString = emailTemplateSubjectString.replace(regex, value);
    });
  if(emailSettings === "true"){
    await sendEmail({
      to: email,
      subject: emailTemplateSubjectString,
      html: emailTemplateBodyString
    });
  }
    return NextResponse.json(employee);
  } catch (error) {
  
    console.error("[EMPLOYEE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PUT update employee
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, firstName, lastName, email, phone, role, department, salary, status } = body;

    const employee = await prisma.employee.update({
      where: {
        id,
        restaurantId: session.user.restaurantId,
      },
      data: {
        firstName,
        lastName,
        email,
        phone,
        role,
        department,
        salary,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });

    // Also update the associated user
    await prisma.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        firstName,
        lastName,
        email,
        roleId: role,
        isActive: status === "active",
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("[EMPLOYEE_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE employee
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Employee ID is required", { status: 400 });
    }

    // First get the employee to get the userId
    const employee = await prisma.employee.findUnique({
      where: {
        id,
        restaurantId: session.user.restaurantId,
      },
    });

    if (!employee) {
      return new NextResponse("Employee not found", { status: 404 });
    }

    // Delete the employee
    await prisma.employee.delete({
      where: {
        id,
      },
    });

    // Then delete the associated user
    await prisma.user.delete({
      where: {
        id: employee.userId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[EMPLOYEE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 
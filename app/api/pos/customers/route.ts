import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendEmail } from '@/lib/email';
import { sendSMS } from "@/lib/twilio";
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';



async function getEmailAndSmsSettings(key: string) {
    const emailSettings = await prisma.setting.findUnique({
      where: { key: key }
    });
    return emailSettings?.value;
  }

  async function checkUserRole() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
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
        return new NextResponse("Unauthorized", { status: 401 })
    }
    return user;
  }


  
  export async function POST(request: Request) {
    try {
      const user = await checkUserRole();
      if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
  
      const body = await request.json();
      const { phone, isPublic, name, email, address } = body;
  
      if (!phone) {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 }
        );
      }
  
      let customer = await prisma.user.findFirst({
        where: {
          phoneNumber: phone,
          role: {
            name: "Customer",
          },
        },
      });
  
      // Create new customer if not found
      if (!customer) {
        const plainPassword = crypto.randomBytes(6).toString("base64").slice(0, 10);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
        const companySetting = await getEmailAndSmsSettings("company");
        const companyName = companySetting ? JSON.parse(companySetting).name : "Restaurant";
  
        customer = await prisma.user.create({
          data: {
            phoneNumber: phone,
            firstName: name,
            lastName: "",
            email: email,
            restaurantId: user.restaurantId,
            addresses: {
              create: {
                streetAddress: address,
                city: "n/a",
                state: "n/a",
                type: "home",
                country: "n/a",
                postalCode: "n/a",
              },
            },
            password: hashedPassword,
            role: {
              connect: {
                name: "customer",
              },
            },
          },
        });
  
        await prisma.customer.create({
          data: {
            userId: customer.id,
            restaurantId: user.restaurantId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phoneNumber: customer.phoneNumber,
            status: "active",
          },
        });
  
        // Send welcome email
        const emailSetting = await getEmailAndSmsSettings("OTP_EMAIL_ENABLED");
        const emailTemplate = await prisma.emailTemplate.findUnique({
          where: { name: "customer_welcome_created_by_admin" },
        });
  
        if (emailSetting === "true" && emailTemplate) {
          const templateData = {
            userName: customer.firstName,
            restaurantName: companyName,
            password: plainPassword,
            email: customer.email,
            loginLink: `${process.env.NEXTAUTH_URL}/login`,
          };
  
          await sendEmail({
            to: email,
            subject: emailTemplate.subject
              .replace("{{restaurantName}}", companyName)
              .replace("{{userName}}", customer.firstName),
            html: emailTemplate.body
              .replace("{{userName}}", templateData.userName)
              .replace("{{restaurantName}}", templateData.restaurantName)
              .replace("{{email}}", templateData.email)
              .replace("{{password}}", templateData.password)
              .replace("{{loginLink}}", templateData.loginLink),
          });
        }
      }
  
      // 🟡 Loyalty points calculation
      const [earnedPoints, redeemedPoints] = await Promise.all([
        prisma.loyaltyPoint.aggregate({
          where: {
            userId: customer.id,
            type: "earn",
            expiresAt: {
              gte: new Date(),
            },
          },
          _sum: {
            points: true,
          },
        }),
        prisma.loyaltyPoint.aggregate({
          where: {
            userId: customer.id,
            type: "redeem",
          },
          _sum: {
            points: true,
          },
        }),
      ]);
  
      const availablePoints =
        (earnedPoints._sum.points || 0) - (redeemedPoints._sum.points || 0);
  
        type ExtendedCustomer = typeof customer & { availablePoints: number };
        const extendedCustomer: ExtendedCustomer = {
          ...customer,
          availablePoints,
        };
        return NextResponse.json(extendedCustomer);
    } catch (error) {
      console.error("Error finding or creating customer:", error);
      return NextResponse.json(
        { error: "Failed to find or create customer" },
        { status: 500 }
      );
    }
  }
  
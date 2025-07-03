import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import * as z from 'zod'
import { Prisma } from '@prisma/client'
import { sendEmail } from '@/lib/email'

const restaurantSchema = z.object({
  firstName: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }),
  restaurantName: z.string().min(2, {
    message: 'Restaurant name must be at least 2 characters.',
  }),
  phone: z.string().min(10, {
    message: 'Phone number must be at least 10 characters.',
  }),
  cuisine: z.string().min(2, {
    message: 'Cuisine must be at least 2 characters.',
  }),
  locationId: z.string({
    required_error: 'Please select a location.',
  }),
})

async function getEmailAndSmsSettings(key: string) {
  const emailSettings = await prisma.setting.findUnique({
    where: { key: key }
  });
  return emailSettings?.value;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: {
        email: session?.user?.email,
      },
      select: {
        role: true,
      },
    })
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    if (user.role.name !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = restaurantSchema.parse(json)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return new NextResponse('Email already exists', { status: 400 })
    }

    // Get the Restaurant role ID
    const restaurantRole = await prisma.role.findUnique({
      where: { name: 'Restaurant' },
    })

    if (!restaurantRole) {
      return new NextResponse('Restaurant role not found', { status: 500 })
    }

    // Create the restaurant user
    const hashedPassword = await hash(body.password, 12)
    const restaurant = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.user.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: hashedPassword,
          restaurantName: body.restaurantName,
          phoneNumber: body.phone,
          roleId: restaurantRole.id,
          cuisine: body.cuisine,
          status: 'active',
          locationId: body.locationId,
        },
      });
    
      await tx.user.update({
        where: { id: restaurant.id },
        data: { restaurantId: restaurant.id },
      });
    
      return restaurant;
    });
    


    const emailSettings = await getEmailAndSmsSettings('OTP_EMAIL_ENABLED');
    const smsSettings = await getEmailAndSmsSettings('OTP_PHONE_ENABLED');
    const emailTemplate = await prisma.emailTemplate.findUnique({
      where: {
        name: 'restaurant_welcome',
      }
    });

    if (!emailTemplate) {
      return new NextResponse("Email template not found", { status: 404 });
    }




    const emailTemplateVariables = JSON.parse(emailTemplate.variables); // array of strings
    const variablesObject = {
      userName: body.firstName,
      restaurantName: body.restaurantName,
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
      to: body.email,
      subject: emailTemplateSubjectString,
      html: emailTemplateBodyString
    });
  }
    return NextResponse.json({message: 'Restaurant created successfully'})
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    console.error('[RESTAURANTS_POST]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const restaurants = await prisma.user.findMany({
      where: {
        role: {
          name: 'Restaurant',
        },
      },
      select: {
        id: true,
        restaurantName: true,
        email: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        locationId: true,
      },
    })

    const locationIds = restaurants
      .map(r => r.locationId)
      .filter((id): id is string => id !== null)

    const locations = await prisma.location.findMany({
      where: {
        id: {
          in: locationIds,
        },
      },
      select: {
        id: true,
        name: true,
        address: true,
        lat: true,
        lng: true,
      },
    })

    const formattedRestaurants = restaurants.map(restaurant => {
      const location = locations.find(loc => loc.id === restaurant.locationId)

      return {
        id: restaurant.id,
        restaurantName: restaurant.restaurantName || '',
        email: restaurant.email,
        phone: restaurant.phoneNumber || '',
        cuisine: 'Not specified', // Optional
        rating: 0,                // Optional
        status: restaurant.status as 'active' | 'inactive',
        createdAt: restaurant.createdAt.toISOString(),
        location: location
          ? {
              id: location.id,
              name: location.name,
              city: location.address,
            }
          : {
              id: '',
              name: '',
              city: '',
            },
      }
    })

    return NextResponse.json(formattedRestaurants)
  } catch (error) {
    console.error('[RESTAURANTS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}


import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

function deepMerge(target: any, source: any): any {
  for (const key in source) {
    if (
      source[key] instanceof Object &&
      key in target &&
      target[key] instanceof Object
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
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

    const requestBody = await req.json();

    // Parse the `value` string if it exists
    const newData =
      typeof requestBody.value === 'string'
        ? JSON.parse(requestBody.value)
        : requestBody;

    // Fetch existing data from DB
    const existingSetting = await prisma.setting.findUnique({
      where: {
        key: 'paymentGateway',
      },
    });

    const currentData = existingSetting?.value
      ? JSON.parse(existingSetting.value)
      : {};

    // Perform deep merge
    const mergedData = deepMerge(currentData, newData);
    console.log('mergedData', mergedData)
    // Update DB
    const updateSettings = await prisma.setting.update({
      where: {
        key: 'paymentGateway',
      },
      data: {
        value: JSON.stringify(mergedData),
      },
    });

    return NextResponse.json(updateSettings);
  } catch (error) {
    console.error('[CURRENCY_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}


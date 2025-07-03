import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get('number');
    console.log("tableNumber", tableNumber);    

    if (!tableNumber) {
      return NextResponse.json(
        { error: 'Table number is required' },
        { status: 400 }
      );
    }

    // Find the table
    const table = await prisma.table.findFirst({
      where: {
        number: parseInt(tableNumber),
        isActive: true,
      },
    });

    if (!table) {
      return NextResponse.json(
        { available: false, message: 'Incorrect table number' },
        { status: 404 }
      );
    }

    // Check if table is available
    const isAvailable = table.status === 'available';

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable ? 'Table is available' : 'Table is currently occupied',
    });
  } catch (error) {
    console.error('Error checking table availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import * as z from 'zod'
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays } from 'date-fns'

const userSchema = z.object({
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
  roleId: z.string({
    required_error: 'Please select a role.',
  }),
})

// Types
interface UserWithRole {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  status: string;
  role: {
    name: string;
    displayName: string;
  };
  createdAt: Date;
  lastLogin: Date | null;
  restaurantName?: string | null;
  itAccess?: {
    expiryDate: Date;
    isActive: boolean;
  }[];
}

interface KitchenStaffPerformance {
  id: string;
  name: string;
  totalOrders: number;
  completedOrders: number;
  averageCompletionTime: number;
  lastActive: Date | null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: { email: session?.user?.email },
      select: { role: true },
    })

    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const restaurantId = searchParams.get('restaurantId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // First, get all restaurant owners
    const restaurantOwners = await prisma.user.findMany({
      where: {
        role: {
          name: 'Restaurant'
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        restaurantName: true,
        restaurantId: true,
      }
    })

    // Get staff count for each restaurant owner
    const staffCounts = await Promise.all(
      restaurantOwners.map(async (owner) => {
        const count = await prisma.user.count({
          where: {
            restaurantId: owner.id,
            role: {
              name: {
                in: ['Restaurant_supervisor', 'Restaurant_manager', 'Kitchen_boy']
              }
            }
          }
        })
        return { ownerId: owner.id, count }
      })
    )

    // Base query for users
    const whereClause: any = {
        role: {
          name: {
          in: type === 'admin' ? ['Admin'] : type === 'restaurant' ? ['Restaurant_supervisor', 'Restaurant_manager', 'Kitchen_boy', 'Restaurant'] : ['it_access']
        }
      }
    }

    // Add search condition
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } }
      ]
    }

    // Add restaurant filter for restaurant staff
    if (type === 'restaurant' && restaurantId) {
      whereClause.restaurantId = restaurantId
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          status: true,
        role: {
          select: {
            name: true,
            displayName: true,
          },
        },
          createdAt: true,
          lastLogin: true,
          restaurantId: true,
          itAccess: {
          select: {
              expiryDate: true,
              isActive: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ])

    // Group users by restaurant
    const usersByRestaurant = restaurantOwners.map(owner => ({
      id: owner.id,
      name: `${owner.firstName} ${owner.lastName}`,
      restaurantName: owner.restaurantName,
      email: owner.email,
      totalStaff: staffCounts.find(sc => sc.ownerId === owner.id)?.count || 0,
      users: users.filter(user => user.restaurantId === owner.id),
    }))

    // If type is restaurant, fetch kitchen staff performance
    let kitchenPerformance: any[] = []
    if (type === 'restaurant') {
      const thirtyDaysAgo = subDays(new Date(), 30)
      
      // Get all staff orders
      const staffOrders = await prisma.kitchenOrder.groupBy({
        by: ['staffId'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: {
            id: true,
        },
        _max: {
          completedAt: true,
        },
      })

      // Get staff details with their roles
      const staffDetails = await prisma.user.findMany({
        where: {
          id: {
            in: staffOrders.map(order => order.staffId).filter(Boolean) as string[],
          },
        },
            select: {
              id: true,
          firstName: true,
          lastName: true,
          lastLogin: true,
          role: {
            select: {
              name: true,
              displayName: true,
            },
          },
          restaurantId: true,
        },
      })

      // Calculate performance metrics
      kitchenPerformance = staffDetails.map(staff => {
        const staffOrder = staffOrders.find(order => order.staffId === staff.id)
        const totalOrders = staffOrder?._count.id || 0
        const owner = restaurantOwners.find(owner => owner.id === staff.restaurantId)
        
        return {
          id: staff.id,
          name: `${staff.firstName} ${staff.lastName}`,
          role: staff.role.displayName,
          restaurant: owner ? owner.restaurantName : 'N/A',
          restaurantId: staff.restaurantId,
          totalOrders,
          completedOrders: totalOrders,
          lastActive: staff.lastLogin,
          performance: {
            efficiency: totalOrders > 0 ? Math.round((totalOrders / 30) * 100) : 0,
          }
        }
      })
    }

    return NextResponse.json({
      users,
      usersByRestaurant,
      total,
      page,
      limit,
      kitchenPerformance,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true },
    })

    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      restaurantId,
      expiryDate 
    } = body

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password, // Make sure to hash the password before saving
        role: {
          connect: {
            name: role,
          },
        },
        ...(restaurantId && { restaurantId }),
      },
    })

    // If IT access, create IT access record
    if (role === 'IT' && expiryDate) {
      await prisma.iTAccess.create({
        data: {
          userId: newUser.id,
          expiryDate: new Date(expiryDate),
          isActive: true,
        },
      })
    }

    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true },
    })

    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, 
      firstName, 
      lastName, 
      email, 
      status,
      expiryDate 
    } = body

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        status,
      },
    })

    // If IT access, update IT access record
    if (expiryDate) {
      await prisma.iTAccess.updateMany({
        where: { userId: id },
        data: {
          expiryDate: new Date(expiryDate),
          isActive: true,
        },
      })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const user = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { role: true },
    })

    if (!user || user.role.name !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 
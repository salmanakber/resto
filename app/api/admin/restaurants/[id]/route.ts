import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        const user = await prisma.user.findUnique({
            where: {
                email: session?.user?.email,
            },
            include: {
                role: true,
            },
        })
        if (!user || user.role.name !== 'Admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Get restaurant details
        const restaurant = await prisma.user.findUnique({
            where: {
                id: params.id,
            },
            include: {
                role: true,
            },
        })
        
        if (!restaurant) {
            return new NextResponse('Restaurant not found', { status: 404 })
        }

        // Get all locations
        const locations = await prisma.location.findMany({
            where: {
                OR: [
                    { userId: '' }, // Unassigned locations
                    // { userId: user.id }, // Locations created by this admin
                    // { id: restaurant.locationId || '' }, // Current restaurant's location
                ],
            },
            select: {
                id: true,
                name: true,
                address: true,
                timeZone: true,
                lat: true,
                lng: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
            },
        })

        // Mark locations as assigned if they have a userId
        const formattedLocations = locations.map(location => ({
            ...location,
            isAssigned: location.userId !== null && location.id !== restaurant.locationId,
        }))

        return NextResponse.json({
            restaurant,
            locations: formattedLocations,
        })
    } catch (error) {
        console.error('[RESTAURANT_GET]', error)
        return new NextResponse('Internal error', { status: 500 })
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        const user = await prisma.user.findUnique({
            where: {
                email: session?.user?.email,
            },
            include: {
                role: true,
            },
        })
        if (!user || user.role.name !== 'Admin') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const json = await request.json()
        const { locationId } = json
    
        // Check if the location is already assigned to another restaurant
        
            const location = await prisma.location.findUnique({
                where: { id: locationId },
            })
        
            if (!location) {
                return new NextResponse('Location not found', { status: 404 })
            }
        
            // If location is already assigned to another restaurant (not this one)
            if (location.userId && location.userId !== params.id) {
                return NextResponse.json({ error: 'Location is already assigned to another restaurant' }, { status: 400 })
            }
        


        

        const password = json.password?.trim()
        ? await bcrypt.hash(json.password, 10)
        : undefined
        // Update the restaurant with the new location
        const restaurant = await prisma.user.update({
            where: { id: params.id },
            data: {
                locationId,
                firstName: json.firstName,
                lastName: json.lastName,
                email: json.email,
                phoneNumber: json.phone,
                cuisine: json.cuisine,
                isActive: json.isActive,
                restaurantName: json.restaurantName,
                ...(password && { password }),
            },
            include: {
                role: true,
            },
        })


        // Update the location's userId if it's not already set
        if (!location.userId) {
            await prisma.location.update({
                where: { id: locationId },
                data: {
                    userId: restaurant.id,
                },
            })
        }

        return NextResponse.json(restaurant)
    } catch (error) {
        console.error('[RESTAURANT_PATCH]', error)
        return new NextResponse('Internal error', { status: 500 })
    }
}   
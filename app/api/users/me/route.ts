import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";



export async function GET( req: Request ) {
  try {
    // Get the session from next-auth
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId') || null;
    
    const session = await getServerSession(authOptions);
    // Check if session is valid and user email exists
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Fetch user from the database based on email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true, paymentMethods: {
        where: {
          stripeCustomerId: {
            not: null
          }
        }
      } }, // Including the role data in the response
    });
    
    // If user not found, return 404
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    if (
      user.role.name === "Customer" &&
      (!user.restaurantId || user.restaurantId === '') && locationId ) {
      const findRestaurantId = await prisma.location.findUnique({
        where: { id: locationId },
        select: { userId: true },
      });
      
      if (!findRestaurantId) {
        return new NextResponse("Restaurant not found", { status: 404 });
      }
  
      const customer = await prisma.user.update({
        where: { id: user.id },
        data: { restaurantId: findRestaurantId.userId },
      });
    }
    
    // If user role is not "Restaurant", fetch restaurant data
    let restaurantData = null;
    if (user.role.name !== "Restaurant" && user.restaurantId) {
      restaurantData = await prisma.user.findUnique({
        where: { id: user.restaurantId },
        select: { restaurantName: true },
      });
    }

    if (restaurantData) {
      user.restaurantName = restaurantData.restaurantName;
    }
    

    // Return the user data and restaurant data (if exists)
    return NextResponse.json(user);

  } catch (error) {
    console.error("[USER_ME]", error); // Log the error for debugging
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true, paymentMethods: {
        where: {
          stripeCustomerId: {
            not: null
          }
        }
      } }, // Including the role data in the response
    });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    const data = await request.json();  // Get the profile image from the request body
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { ...data },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_ME]", error); // Log the error for debugging
    return new NextResponse("Internal server error", { status: 500 });
  }
}

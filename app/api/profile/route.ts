import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for profile validation
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  profileImage: z.string().optional(),
});

// GET /api/profile
export async function GET() {
  try {
    
    const session = await getServerSession(authOptions);
    
  

    if (!session) {
      console.log('No session found');
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          details: "No session found",
          debug: { sessionState: "null" }
        },
        { status: 401 }
      );
    }

    if (!session.user) {
      console.log('Session found but no user object');
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          details: "No user in session",
          debug: { 
            sessionState: "has_session_no_user",
            sessionKeys: Object.keys(session)
          }
        },
        { status: 401 }
      );
    }

    if (!session.user.email) {
      console.log('Session and user found but no email');
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          details: "No email in user session",
          debug: { 
            sessionState: "has_session_has_user_no_email",
            userKeys: Object.keys(session.user)
          }
        },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profileImage: true,
        
      },
    });

    if (!user) {
      
      return NextResponse.json(
        { 
          error: "User not found", 
          details: "User not found in database",
          debug: { 
            sessionState: "has_session_has_user_has_email_no_db_user",
            email: session.user.email
          }
        },
        { status: 404 }
      );
    }

    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in profile GET:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error
        }
      },
      { status: 500 }
    );
  }
}

// PATCH /api/profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", details: "User not found in database" },
        { status: 404 }
      );
    }

    // Validate the request body
    const validatedData = await request.json();
    console.log("validatedData", validatedData)
    
    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phone,
        profileImage: validatedData.profileImage,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profileImage: true,
        
      },

    });
    
    if(updatedUser)
    {
      try {
        const updatedCustomer = await prisma.customer.update({
          where: {
            userId: updatedUser.id,
          },
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phoneNumber: validatedData.phone,
          },
        });
        
      } catch (error) {
        console.error("Failed to update customer:", error);
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 
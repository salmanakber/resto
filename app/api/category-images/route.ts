import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { existsSync } from "fs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueId = uuidv4();
    const extension = file.name.split(".").pop();
    const filename = `${uniqueId}.${extension}`;


    // Ensure upload directory exists and is writable
    const uploadDir = join(process.cwd(), "public", "uploads", "categories");
    
    try {
      if (!existsSync(uploadDir)) {
        
        await mkdir(uploadDir, { recursive: true });
      }
      
      // Check if directory is writable
      await access(uploadDir, 0o777);
    } catch (error) {
      console.error('Directory access error:', error);
      return NextResponse.json(
        { 
          error: "Directory access error",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Save to public/uploads/categories directory
    const filepath = join(uploadDir, filename);
    try {
      await writeFile(filepath, buffer);
      
    } catch (error) {
      console.error('File write error:', error);
      return NextResponse.json(
        { 
          error: "File write error",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

    // Return the URL path
    const url = `/uploads/categories/${filename}`;
    

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { 
        error: "Error uploading file",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
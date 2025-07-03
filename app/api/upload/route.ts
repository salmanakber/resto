import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, access, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
  try {
    console.log('Starting file upload process...');

    // Verify authentication
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.email ? 'Authenticated' : 'Not authenticated');
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No valid session found" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    console.log('Received file:', {
      name: file?.name,
      type: file?.type,
      size: file?.size
    });

    // Validate file
    if (!file) {
      console.log('No file received in form data');
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: "Invalid file type", details: `Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: "File too large", details: `Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueId = uuidv4();
    const extension = file.name.split(".").pop();
    const filename = `${uniqueId}.${extension}`;

    console.log('Generated filename:', filename);

    // Determine upload directory based on file type
    const uploadType = file.type.startsWith('image/') ? 'images' : 'files';
    const uploadDir = join(UPLOAD_DIR, uploadType);

    console.log('Upload directory:', uploadDir);

    // Ensure upload directory exists and is writable
    try {
      if (!existsSync(uploadDir)) {
        console.log('Creating upload directory:', uploadDir);
        await mkdir(uploadDir, { recursive: true });
      }
      
      // Test if directory is writable by creating a temporary file
      const testFile = join(uploadDir, '.test-write');
      await writeFile(testFile, 'test');
      await unlink(testFile);
      console.log('Directory is writable');
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

    // Save file
    const filepath = join(uploadDir, filename);
    try {
      console.log('Attempting to save file:', filepath);
      await writeFile(filepath, buffer);
      console.log('File saved successfully:', filepath);
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

    // Return success response
    const url = `/uploads/${uploadType}/${filename}`;
    console.log('Upload successful, returning URL:', url);

    return NextResponse.json({ 
      url,
      filename,
      type: file.type,
      size: file.size,
    });

  } catch (error) {
    console.error("Error in upload process:", error);
    return NextResponse.json(
      { 
        error: "Error uploading file",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
      },
      { status: 500 }
    );
  }
} 
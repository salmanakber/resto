import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file || !type) {
      return new NextResponse('Missing file or type', { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const uniqueId = uuidv4()
    const extension = file.name.split('.').pop()
    const filename = `${type}_${uniqueId}.${extension}`

    // Save file to public directory
    const publicDir = join(process.cwd(), 'public', 'uploads')
    const filepath = join(publicDir, filename)
    await writeFile(filepath, buffer)

    // Return the URL for the uploaded file
    const url = `/uploads/${filename}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 
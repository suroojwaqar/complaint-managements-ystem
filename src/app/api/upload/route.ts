import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('File upload request from user:', session.user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'profile' or 'complaint'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // For profile images, only allow images
    const allowedTypes = type === 'profile' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : ALLOWED_TYPES;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      const typeDescription = type === 'profile' ? 'images (JPEG, PNG, GIF, WebP)' : 'images, PDF, Word, Excel, and text files';
      return NextResponse.json(
        { error: `Unsupported file type. Allowed types: ${typeDescription}.` },
        { status: 400 }
      );
    }

    // Validate file size (5MB for profile images, 10MB for others)
    const maxSize = type === 'profile' ? 5 * 1024 * 1024 : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      const sizeLimit = type === 'profile' ? '5MB' : '10MB';
      return NextResponse.json(
        { error: `File size exceeds ${sizeLimit} limit.` },
        { status: 400 }
      );
    }

    // Create appropriate upload directory
    const uploadSubDir = type === 'profile' ? 'profiles' : 'complaints';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadSubDir);
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.log('Upload directory already exists or created successfully');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileNameWithoutExt = path.basename(file.name, fileExtension);
    const uniqueFilename = `${fileNameWithoutExt}_${crypto.randomUUID()}${fileExtension}`;
    
    // Create file path
    const filePath = path.join(uploadDir, uniqueFilename);
    
    console.log(`Saving file to: ${filePath}`);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Generate file URL (accessible via Next.js public folder)
    const fileUrl = `/uploads/${uploadSubDir}/${uniqueFilename}`;

    console.log(`File saved successfully: ${uniqueFilename}`);

    const result = {
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: fileUrl,
      uploadedAt: new Date(),
      uploadedBy: session.user.id,
      localPath: filePath
    };

    console.log(`Successfully uploaded file: ${uniqueFilename}`);

    return NextResponse.json(
      { 
        message: 'File uploaded successfully',
        file: result,
        url: fileUrl // For easy access
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json(
      { error: `Internal server error during file upload: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GET endpoint to list uploaded files (for debugging)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'complaints');
    
    try {
      const fs = require('fs');
      const files = fs.readdirSync(uploadDir);
      
      const fileList = files.map((filename: string) => {
        const filePath = path.join(uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          size: stats.size,
          uploadedAt: stats.birthtime,
          url: `/uploads/complaints/${filename}`
        };
      });

      return NextResponse.json({
        files: fileList,
        count: fileList.length
      });
    } catch (dirError) {
      return NextResponse.json({
        files: [],
        count: 0,
        note: 'Upload directory not found or empty'
      });
    }
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

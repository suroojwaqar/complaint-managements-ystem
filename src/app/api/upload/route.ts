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
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 files allowed per upload' },
        { status: 400 }
      );
    }

    console.log(`Processing ${files.length} files`);

    const uploadResults = [];
    const errors = [];

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'complaints');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      console.log('Upload directory already exists or created successfully');
    }

    for (const file of files) {
      try {
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`File "${file.name}": Unsupported file type. Allowed types: images, PDF, Word, Excel, and text files.`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`File "${file.name}": File size exceeds 10MB limit.`);
          continue;
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
        const fileUrl = `/uploads/complaints/${uniqueFilename}`;

        console.log(`File saved successfully: ${uniqueFilename}`);

        uploadResults.push({
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: fileUrl,
          uploadedAt: new Date(),
          uploadedBy: session.user.id,
          localPath: filePath
        });
      } catch (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        errors.push(`File "${file.name}": Upload failed. ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }

    if (uploadResults.length === 0) {
      return NextResponse.json(
        { 
          error: 'No files were uploaded successfully',
          errors: errors 
        },
        { status: 400 }
      );
    }

    console.log(`Successfully uploaded ${uploadResults.length} files`);

    return NextResponse.json(
      { 
        message: `Successfully uploaded ${uploadResults.length} file(s)`,
        files: uploadResults,
        errors: errors.length > 0 ? errors : undefined
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

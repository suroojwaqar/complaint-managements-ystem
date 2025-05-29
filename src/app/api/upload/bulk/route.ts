import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

    console.log('Bulk file upload request from user:', session.user.id);

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    const errors = [];

    // Create upload directory
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
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: File size exceeds 10MB limit`);
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

        const uploadedFile = {
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: fileUrl,
          uploadedAt: new Date(),
          uploadedBy: session.user.id,
          localPath: filePath
        };

        uploadedFiles.push(uploadedFile);
        console.log(`Successfully uploaded file: ${uniqueFilename}`);

      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        errors.push(`${file.name}: Upload failed`);
      }
    }

    return NextResponse.json(
      { 
        message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in bulk file upload:', error);
    return NextResponse.json(
      { error: `Internal server error during bulk file upload: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

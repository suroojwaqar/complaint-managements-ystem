'use client';

import { useState } from 'react';
import FileUpload from '@/components/ui/FileUpload';

export default function TestUploadsPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFilesUpload = (files: any[]) => {
    console.log('Files uploaded:', files);
    setUploadedFiles(files);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test File Upload</h1>
        
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Upload Test</h2>
          <FileUpload 
            onFilesUpload={handleFilesUpload}
            maxFiles={5}
            maxFileSize={10}
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="card mt-8">
            <h2 className="text-lg font-medium mb-4">Uploaded Files Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(uploadedFiles, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

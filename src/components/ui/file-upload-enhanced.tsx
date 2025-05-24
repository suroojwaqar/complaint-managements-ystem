'use client';

import { useState, useRef } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FileText, Image as ImageIcon, AlertCircle, CheckCircle2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@radix-ui/react-progress'; // You can add this component separately
import { toast } from 'sonner';

interface FileUploadProps {
  onFilesUpload: (files: any[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  existingFiles?: any[];
}

interface UploadedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export default function FileUpload({
  onFilesUpload,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
  existingFiles = []
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    // Check file count limit
    const totalFiles = files.length + uploadedFiles.length + newFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];

    newFiles.forEach((file) => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`${file.name}: File size exceeds ${maxFileSize}MB limit`);
        return;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes('*')) {
          return file.type.startsWith(type.replace('*', ''));
        }
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast.error(`${file.name}: File type not supported`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) selected for upload`);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    const newUploadedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newUploadedFiles);
    onFilesUpload(newUploadedFiles);
    toast.success('File removed successfully');
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        files.forEach((file, index) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + Math.random() * 30, 90)
          }));
        });
      }, 500);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      // Set progress to 100% for all files
      files.forEach(file => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        toast.error(`Server response error: ${responseText}`);
        return;
      }

      if (response.ok) {
        const newUploadedFiles = [...uploadedFiles, ...data.files];
        setUploadedFiles(newUploadedFiles);
        setFiles([]);
        setUploadProgress({});
        onFilesUpload(newUploadedFiles);

        toast.success(`Successfully uploaded ${data.files.length} file(s)!`);

        if (data.errors && data.errors.length > 0) {
          toast.error(data.errors.join(', '));
        }

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast.error(data.error || `Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Network error during upload. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (mimeType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileText className="h-8 w-8 text-green-600" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleFileDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="mt-4">
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {maxFiles} files, {maxFileSize}MB each. Supported: images, PDF, Word, Excel, text files
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Selected Files (not uploaded yet) */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium">Selected Files</h4>
              <Button
                onClick={uploadFiles}
                disabled={uploading}
                size="sm"
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length} file(s)
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type, file.name)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                        {uploading && uploadProgress[file.name] !== undefined && (
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(uploadProgress[file.name] || 0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-4">Uploaded Files</h4>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.mimeType, file.originalName)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.originalName}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUploadedFile(index)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Count Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {uploadedFiles.length + files.length} of {maxFiles} files selected
        </span>
        <Badge variant="outline" className="text-xs">
          Files saved locally in uploads folder
        </Badge>
      </div>
    </div>
  );
}

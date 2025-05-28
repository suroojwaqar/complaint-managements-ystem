'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from '@/lib/toast';

interface Attachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: {
    _id: string;
    name: string;
  };
}

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  isInternal: boolean;
}

interface CommentsSectionProps {
  complaintId: string;
  userRole?: string;
  className?: string;
}

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

export default function CommentsSection({ complaintId, userRole, className = '' }: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [complaintId]);

  const fetchComments = async () => {
    try {
      setError('');
      const response = await fetch(`/api/complaints/${complaintId}/comments`);
      const data = await response.json();
      
      if (response.ok) {
        setComments(data.comments || []);
      } else {
        setError(data.error || 'Failed to load comments');
        toast.error(data.error || 'Failed to load comments');
      }
    } catch (err) {
      setError('Network error loading comments');
      toast.error('Network error loading comments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Unsupported file type`);
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }
      
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<Attachment | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'complaint');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        return {
          filename: result.file.filename,
          originalName: result.file.originalName,
          mimeType: result.file.mimeType,
          size: result.file.size,
          url: result.file.url,
          uploadedAt: result.file.uploadedAt,
          uploadedBy: {
            _id: 'current-user', // This will be set by the backend
            name: 'You'
          }
        };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() && attachments.length === 0) {
      setError('Please enter a comment or attach files');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Upload attachments first
      const uploadedAttachments: Attachment[] = [];
      
      for (const file of attachments) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        const uploaded = await uploadFile(file);
        if (uploaded) {
          uploadedAttachments.push(uploaded);
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Create comment with attachments
      const response = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          attachments: uploadedAttachments,
          isInternal: false
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setNewComment('');
        setAttachments([]);
        setUploadProgress({});
        await fetchComments(); // Refresh comments
        toast.success('Comment posted successfully');
        
        // Focus back to textarea for easier follow-up
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } else {
        setError(result.error || 'Failed to post comment');
        toast.error(result.error || 'Failed to post comment');
      }
    } catch (error) {
      setError('Failed to post comment. Please try again.');
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'employee': return 'bg-green-100 text-green-700';
      case 'client': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Comments List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {comment.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0 ${getRoleColor(comment.author.role)}`}
                      >
                        {comment.author.role}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(comment.createdAt)}
                      </div>
                      {comment.isInternal && (
                        <Badge variant="secondary" className="text-xs">Internal</Badge>
                      )}
                    </div>
                    
                    {comment.content && (
                      <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
                    )}
                    
                    {/* Attachments */}
                    {comment.attachments.length > 0 && (
                      <div className="space-y-2">
                        {comment.attachments.map((attachment, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 p-2 bg-background rounded border"
                          >
                            {getFileIcon(attachment.mimeType)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {attachment.originalName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                download={attachment.originalName}
                              >
                                <Download className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px] resize-none"
              disabled={submitting}
            />
            
            {/* File Attachments Preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attachments ({attachments.length}/5):</p>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        {uploadProgress[file.name] !== undefined && (
                          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeAttachment(index)}
                        disabled={submitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                disabled={submitting || attachments.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting || attachments.length >= 5}
                className="flex items-center gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Attach Files
              </Button>
              <span className="text-xs text-muted-foreground">
                Max 5 files, 10MB each
              </span>
            </div>

            <Button 
              type="submit" 
              disabled={submitting || (!newComment.trim() && attachments.length === 0)}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

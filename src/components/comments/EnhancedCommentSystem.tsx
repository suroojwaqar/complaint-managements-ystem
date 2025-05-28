'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/lib/toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import FileUpload from '@/components/ui/FileUpload';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Download, 
  Eye,
  Clock,
  FileText,
  Image,
  Film,
  Archive,
  ThumbsUp,
  CheckCircle
} from 'lucide-react';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  attachments?: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  reactions?: Array<{
    userId: string;
    type: 'like' | 'helpful' | 'resolved';
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface EnhancedCommentSystemProps {
  complaintId: string;
  className?: string;
}

export default function EnhancedCommentSystem({ 
  complaintId, 
  className = '' 
}: EnhancedCommentSystemProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [complaintId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/complaints/${complaintId}/comments`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        toast.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Error loading comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() && attachments.length === 0) {
      toast.error('Please add a comment or attachment');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/complaints/${complaintId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          attachments: attachments,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        setAttachments([]);
        setShowAttachments(false);
        toast.success('Comment added successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Error adding comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, reactionType: 'like' | 'helpful' | 'resolved') => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: reactionType }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => 
          prev.map(comment => 
            comment._id === commentId 
              ? { ...comment, reactions: data.reactions }
              : comment
          )
        );
      } else {
        toast.error('Failed to add reaction');
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Error adding reaction');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Film className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'client': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getUserReaction = (reactions: any[], userId: string) => {
    return reactions?.find(r => r.userId === userId);
  };

  const getReactionCount = (reactions: any[], type: string) => {
    return reactions?.filter(r => r.type === type).length || 0;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Communication
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Comment */}
        <div className="space-y-4">
          <Textarea
            placeholder="Add a comment, update, or question..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          
          {/* File Attachments Toggle */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAttachments(!showAttachments)}
              className="flex items-center gap-2"
            >
              <Paperclip className="h-4 w-4" />
              {showAttachments ? 'Hide' : 'Add'} Attachments
              {attachments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {attachments.length}
                </Badge>
              )}
            </Button>
            
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || (!newComment.trim() && attachments.length === 0)}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
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

          {/* File Upload Section */}
          {showAttachments && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <FileUpload
                onFilesUpload={setAttachments}
                maxFiles={5}
                maxFileSize={10}
                existingFiles={attachments}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Attach relevant files, screenshots, or documents to support your comment
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to add a comment or update</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment._id} className="bg-muted/30">
                    <CardContent className="p-4">
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {comment.author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {comment.author.name}
                              </span>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getRoleBadgeColor(comment.author.role)}`}
                              >
                                {comment.author.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comment Content */}
                      {comment.content && (
                        <div className="mb-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      )}

                      {/* Attachments */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mb-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {comment.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 border rounded-lg bg-background"
                              >
                                {getFileIcon(attachment.mimeType)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {attachment.originalName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reactions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReaction(comment._id, 'like')}
                          className={`flex items-center gap-1 h-8 ${
                            getUserReaction(comment.reactions || [], session?.user?.id || '') 
                              ? 'text-blue-600 bg-blue-50 dark:bg-blue-950' 
                              : ''
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {getReactionCount(comment.reactions || [], 'like') > 0 && (
                            <span className="text-xs">
                              {getReactionCount(comment.reactions || [], 'like')}
                            </span>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReaction(comment._id, 'helpful')}
                          className={`flex items-center gap-1 h-8 ${
                            getUserReaction(comment.reactions || [], session?.user?.id || '')?.type === 'helpful'
                              ? 'text-green-600 bg-green-50 dark:bg-green-950' 
                              : ''
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Helpful
                          {getReactionCount(comment.reactions || [], 'helpful') > 0 && (
                            <span className="text-xs">
                              {getReactionCount(comment.reactions || [], 'helpful')}
                            </span>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MessageSquare, Send, Reply, Edit3, Trash2, Heart, ThumbsUp, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  content: string;
  isInternal: boolean;
  isEdited: boolean;
  reactions: Array<{
    userId: { _id: string; name: string };
    type: 'like' | 'helpful' | 'resolved';
  }>;
  replies?: Comment[];
  createdAt: string;
}

interface CommentSystemProps {
  complaintId: string;
  onCommentAdded?: () => void;
}

export default function CommentSystem({ complaintId, onCommentAdded }: CommentSystemProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [complaintId]);

  const fetchComments = async () => {
    try {
      // Mock comments for demonstration
      const mockComments = [
        {
          _id: '1',
          userId: {
            _id: 'user1',
            name: 'John Admin',
            email: 'admin@example.com',
            role: 'admin'
          },
          content: 'This issue has been escalated to our technical team. We\'ll investigate and provide an update within 24 hours.',
          isInternal: false,
          isEdited: false,
          reactions: [
            { userId: { _id: 'user2', name: 'Client User' }, type: 'helpful' as const }
          ],
          replies: [
            {
              _id: '2',
              userId: {
                _id: 'user2',
                name: 'Client User',
                email: 'client@example.com',
                role: 'client'
              },
              content: 'Thank you for the quick response! Looking forward to the update.',
              isInternal: false,
              isEdited: false,
              reactions: [],
              createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            }
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        }
      ];
      setComments(mockComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentId?: string) => {
    const content = parentId ? (textareaRef.current?.value || '') : newComment;
    
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      
      const newCommentData = {
        _id: Date.now().toString(),
        userId: {
          _id: session?.user?.id || 'current-user',
          name: session?.user?.name || 'Current User',
          email: session?.user?.email || 'user@example.com',
          role: session?.user?.role || 'client'
        },
        content: content.trim(),
        isInternal: parentId ? false : isInternal,
        isEdited: false,
        reactions: [],
        createdAt: new Date().toISOString()
      };
      
      if (parentId) {
        setComments(prev => prev.map(comment => {
          if (comment._id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newCommentData]
            };
          }
          return comment;
        }));
        setReplyingTo(null);
        if (textareaRef.current) {
          textareaRef.current.value = '';
        }
      } else {
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
      }
      
      toast.success('Comment added successfully');
      onCommentAdded?.();
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        <div className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.role !== 'client' && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="internal"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                  />
                  <Label htmlFor="internal" className="flex items-center gap-1">
                    {isInternal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {isInternal ? 'Internal' : 'Public'}
                  </Label>
                </div>
              )}
            </div>
            <Button 
              onClick={() => handleSubmitComment()} 
              disabled={submitting || !newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="space-y-4">
                <div className={`border rounded-lg p-4 ${comment.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.userId.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{comment.userId.name}</p>
                          <Badge className={getRoleColor(comment.userId.role)} variant="secondary">
                            {comment.userId.role}
                          </Badge>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Internal
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600">
                            <Heart className="h-3 w-3" />
                            {comment.reactions.filter(r => r.type === 'like').length}
                          </button>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.reactions.filter(r => r.type === 'helpful').length}
                          </button>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            {comment.reactions.filter(r => r.type === 'resolved').length}
                          </button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Reply Form */}
                {replyingTo === comment._id && (
                  <div className="ml-8 space-y-2">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Write a reply..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSubmitComment(comment._id)} disabled={submitting}>
                        <Send className="h-3 w-3 mr-1" />
                        {submitting ? 'Posting...' : 'Reply'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {reply.userId.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-xs">{reply.userId.name}</p>
                              <Badge className={getRoleColor(reply.userId.role)} variant="secondary">
                                {reply.userId.role}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-900 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Complaint from '@/models/Complaint';

// Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;
    const body = await request.json();
    const { content, attachments, mentions = [] } = body;

    const comment = await Comment.findById(commentId).populate('complaintId');
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const currentUser = session.user;

    // Check if user can edit this comment
    const canEdit = 
      comment.userId.toString() === currentUser.id || 
      currentUser.role === 'admin' ||
      (currentUser.role === 'manager' && comment.complaintId.department.toString() === currentUser.department);

    if (!canEdit) {
      return NextResponse.json({ error: 'Cannot edit this comment' }, { status: 403 });
    }

    // Update comment
    const updateData: any = {};
    if (content !== undefined) {
      updateData.content = content.trim();
    }
    if (attachments !== undefined) {
      updateData.attachments = attachments;
    }
    if (mentions !== undefined) {
      updateData.mentions = mentions;
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email role')
      .populate('mentions', 'name email')
      .populate({
        path: 'reactions.userId',
        select: 'name'
      });

    return NextResponse.json(updatedComment);

  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = params;
    const comment = await Comment.findById(commentId).populate('complaintId');
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const currentUser = session.user;

    // Check if user can delete this comment
    const canDelete = 
      comment.userId.toString() === currentUser.id || 
      currentUser.role === 'admin' ||
      (currentUser.role === 'manager' && comment.complaintId.department.toString() === currentUser.department);

    if (!canDelete) {
      return NextResponse.json({ error: 'Cannot delete this comment' }, { status: 403 });
    }

    // Delete the comment and its replies
    await Comment.deleteMany({
      $or: [
        { _id: commentId },
        { parentId: commentId }
      ]
    });

    return NextResponse.json({ message: 'Comment deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

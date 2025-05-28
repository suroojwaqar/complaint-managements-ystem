import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';

// Add or toggle reaction to a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.commentId;
    const currentUser = session.user;
    const body = await request.json();

    // Validate reaction type
    if (!body.type || !['like', 'helpful', 'resolved'].includes(body.type)) {
      return NextResponse.json({ 
        error: 'Invalid reaction type. Must be: like, helpful, or resolved' 
      }, { status: 400 });
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user already has a reaction
    const existingReactionIndex = comment.reactions.findIndex(
      (reaction: any) => reaction.userId.toString() === currentUser.id
    );

    if (existingReactionIndex !== -1) {
      // User already has a reaction - toggle or update it
      const existingReaction = comment.reactions[existingReactionIndex];
      
      if (existingReaction.type === body.type) {
        // Same reaction type - remove it (toggle off)
        comment.reactions.splice(existingReactionIndex, 1);
      } else {
        // Different reaction type - update it
        comment.reactions[existingReactionIndex].type = body.type;
        comment.reactions[existingReactionIndex].createdAt = new Date();
      }
    } else {
      // User doesn't have a reaction - add new one
      comment.reactions.push({
        userId: currentUser.id,
        type: body.type,
        createdAt: new Date()
      });
    }

    await comment.save();

    return NextResponse.json({ 
      reactions: comment.reactions,
      message: 'Reaction updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating reaction:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Get reactions for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const commentId = params.commentId;

    // Find the comment
    const comment = await Comment.findById(commentId)
      .populate('reactions.userId', 'name email');
    
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ reactions: comment.reactions });

  } catch (error: any) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

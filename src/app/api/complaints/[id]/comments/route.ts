import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Complaint from '@/models/Complaint';
import whatsappService from '@/services/whatsappService';
import { NotificationService } from '@/services/notificationService';

// Get comments for a complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaintId = params.id;
    const currentUser = session.user;

    // Verify user has access to this complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      currentUser.role === 'admin' ||
      (currentUser.role === 'manager' && complaint.department.toString() === currentUser.department) ||
      (currentUser.role === 'employee' && complaint.currentAssigneeId.toString() === currentUser.id) ||
      (currentUser.role === 'client' && complaint.clientId.toString() === currentUser.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get comments with populated author information
    const comments = await Comment.find({ complaintId })
      .populate('author', 'name email role')
      .populate('attachments.uploadedBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ comments });

  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaintId = params.id;
    const currentUser = session.user;
    const body = await request.json();

    // Validate input
    if (!body.content && (!body.attachments || body.attachments.length === 0)) {
      return NextResponse.json({ 
        error: 'Comment content or attachments are required' 
      }, { status: 400 });
    }

    // Verify user has access to this complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = 
      currentUser.role === 'admin' ||
      (currentUser.role === 'manager' && complaint.department.toString() === currentUser.department) ||
      (currentUser.role === 'employee' && complaint.currentAssigneeId.toString() === currentUser.id) ||
      (currentUser.role === 'client' && complaint.clientId.toString() === currentUser.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Process attachments if provided
    let processedAttachments = [];
    if (body.attachments && Array.isArray(body.attachments)) {
      processedAttachments = body.attachments.map((attachment: any) => ({
        ...attachment,
        uploadedBy: attachment.uploadedBy || currentUser.id
      }));
    }

    // Create comment
    const comment = await Comment.create({
      complaintId,
      content: body.content?.trim() || '',
      author: currentUser.id,
      attachments: processedAttachments,
      isInternal: body.isInternal || false
    });

    // Populate the created comment for response
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email role')
      .populate('attachments.uploadedBy', 'name');

    // Get populated complaint for WhatsApp notifications
    const populatedComplaint = await Complaint.findById(complaintId)
      .populate('clientId', 'name email phone')
      .populate('department', 'name')
      .populate('currentAssigneeId', 'name email phone')
      .populate('natureType', 'name description');

    // Send WhatsApp notifications for new comment (async, don't wait)
    try {
      console.log('\n=== WHATSAPP NOTIFICATION DEBUG START ===');
      console.log('1. About to send WhatsApp notifications for new comment...');
      console.log('2. Current user:', currentUser.name, '(', currentUser.role, ')');
      console.log('3. Complaint ID:', complaintId);
      console.log('4. Comment content:', body.content ? body.content.substring(0, 50) + '...' : 'No content');
      
      console.log('5. Getting stakeholder phones...');
      const stakeholderPhones = await NotificationService.getComplaintStakeholderPhones(populatedComplaint);
      console.log('6. Stakeholder phones result:', {
        client: stakeholderPhones.client,
        assignee: stakeholderPhones.assignee,
        managers: stakeholderPhones.managers,
        admins: stakeholderPhones.admins
      });
      
      console.log('7. Getting notification recipients...');
      const recipients = NotificationService.getNotificationRecipients(
        'comment_added',
        currentUser.role,
        stakeholderPhones
      );
      console.log('8. Recipients to notify:', recipients);
      console.log('9. Number of recipients:', recipients.length);
      
      if (recipients.length === 0) {
        console.log('\u26a0\ufe0f  WARNING: No recipients found for WhatsApp notifications!');
        console.log('This means no users have phone numbers or notification rules excluded everyone.');
      } else {
        console.log('10. Calling whatsappService.notifyCommentAdded...');
        
        // Send notification in background (don't await)
        whatsappService.notifyCommentAdded(
          populatedComplaint,
          currentUser,
          body.content || 'Attachment added',
          recipients
        ).then(() => {
          console.log('\u2705 WhatsApp notification promise resolved successfully');
        }).catch(error => {
          console.error('\u274c WhatsApp notification promise rejected:', error);
        });
      }
      
      console.log(`11. WhatsApp notifications queued for ${recipients.length} recipients`);
      console.log('=== WHATSAPP NOTIFICATION DEBUG END ===\n');
    } catch (notificationError) {
      console.error('\u274c Error setting up WhatsApp notifications:', notificationError);
      console.error('Notification error stack:', notificationError.stack);
      // Continue without notifications - don't fail the comment creation
    }

    return NextResponse.json({ 
      comment: populatedComment,
      message: 'Comment added successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

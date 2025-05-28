import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import ComplaintHistory from '@/models/ComplaintHistory';
import whatsappService from '@/services/whatsappService';
import { NotificationService } from '@/services/notificationService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const complaintId = params.id;

    // Validate status
    const validStatuses = ['New', 'Assigned', 'In Progress', 'Completed', 'Done', 'Closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    // Check permissions - managers can update complaints in their department
    if (session.user.role === 'manager' && complaint.department.toString() !== session.user.department) {
      return NextResponse.json({ error: 'Not authorized to update this complaint' }, { status: 403 });
    }

    // Update complaint
    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.updatedAt = new Date();
    await complaint.save();

    // Create history entry
    await ComplaintHistory.create({
      complaintId: complaint._id,
      status: status,
      assignedTo: complaint.currentAssigneeId,
      assignedFrom: session.user.id,
      notes: `Status changed from ${oldStatus} to ${status} by ${session.user.name}`
    });

    const updatedComplaint = await Complaint.findById(complaintId)
      .populate('clientId', 'name email phone')
      .populate('department', 'name')
      .populate('currentAssigneeId', 'name email phone')
      .populate('natureType', 'name description');

    // Send WhatsApp notifications for status change (async, don't wait)
    try {
      console.log('Sending WhatsApp notifications for status change...');
      const stakeholderPhones = await NotificationService.getComplaintStakeholderPhones(updatedComplaint);
      const recipients = NotificationService.getNotificationRecipients(
        'status_changed',
        session.user.role,
        stakeholderPhones
      );
      
      // Send notification in background (don't await)
      whatsappService.notifyStatusChanged(
        updatedComplaint,
        session.user,
        oldStatus,
        status,
        recipients
      ).catch(error => {
        console.error('WhatsApp notification failed:', error);
      });
      
      console.log(`WhatsApp notifications queued for ${recipients.length} recipients`);
    } catch (notificationError) {
      console.error('Error setting up WhatsApp notifications:', notificationError);
      // Continue without notifications - don't fail the status update
    }

    return NextResponse.json(updatedComplaint);

  } catch (error: any) {
    console.error('Error updating complaint status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
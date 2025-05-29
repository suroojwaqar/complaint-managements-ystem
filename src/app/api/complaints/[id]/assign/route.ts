import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import Department from '@/models/Department';
import User from '@/models/User';
import ComplaintHistory from '@/models/ComplaintHistory';
import whatsappService from '@/services/whatsappService';
import { NotificationService } from '@/services/notificationService';

interface Params {
  params: {
    id: string;
  };
}

// Reassign complaint to a different department or user
export const POST = async (req: NextRequest, { params }: Params) => {
  try {
    console.log('=== COMPLAINT ASSIGNMENT START ===');
    console.log('Complaint ID:', params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('ERROR: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = session.user;
    console.log('User role:', currentUser.role);
    
    await dbConnect();
    console.log('SUCCESS: Database connected');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    // Validate complaint exists
    const complaint = await Complaint.findById(params.id);
    if (!complaint) {
      console.log('ERROR: Complaint not found');
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    console.log('SUCCESS: Complaint found:', complaint.title);
    
    // Handle different assignment types
    if (body.department) {
      // Department reassignment (admin only)
      if (currentUser.role !== 'admin') {
        console.log('ERROR: Only admins can reassign departments');
        return NextResponse.json({ error: 'Admin access required for department reassignment' }, { status: 403 });
      }
      
      return await handleDepartmentReassignment(params.id, body, currentUser);
    } else if (body.userId) {
      // User assignment (managers and admins)
      if (!['manager', 'admin'].includes(currentUser.role)) {
        console.log('ERROR: Insufficient permissions for user assignment');
        return NextResponse.json({ error: 'Manager or admin access required' }, { status: 403 });
      }
      
      return await handleUserAssignment(params.id, body, currentUser, complaint);
    } else {
      return NextResponse.json({ error: 'Either department or userId must be specified' }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('=== COMPLAINT ASSIGNMENT ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      error: 'Failed to assign complaint',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
};

// Handle department reassignment (admin only)
async function handleDepartmentReassignment(complaintId: string, body: any, currentUser: any) {
  const { department: newDepartmentId, notes } = body;
  
  if (!newDepartmentId) {
    return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
  }
  
  // Validate new department exists and is active
  const newDepartment = await Department.findOne({
    _id: newDepartmentId,
    isActive: true
  }).populate('managerId defaultAssigneeId', 'name email');
  
  if (!newDepartment) {
    console.log('ERROR: Department not found or inactive');
    return NextResponse.json({ error: 'Invalid or inactive department' }, { status: 400 });
  }
  
  console.log('SUCCESS: New department validated:', newDepartment.name);
  
  const complaint = await Complaint.findById(complaintId);
  
  // Get current department info for history
  const currentDepartment = await Department.findById(complaint.department);
  const currentDepartmentName = currentDepartment?.name || 'Unknown';
  
  // Update complaint with new department and assignee
  complaint.department = newDepartmentId;
  complaint.currentAssigneeId = newDepartment.defaultAssigneeId._id;
  complaint.status = 'Assigned';
  
  await complaint.save();
  console.log('SUCCESS: Complaint updated');
  
  // Create history entry
  const historyNote = notes || `Complaint reassigned from ${currentDepartmentName} to ${newDepartment.name} by admin`;
  
  await ComplaintHistory.create({
    complaintId: complaintId,
    status: 'Assigned',
    assignedTo: newDepartment.defaultAssigneeId._id,
    notes: historyNote,
    changedBy: currentUser.id
  });
  
  console.log('SUCCESS: History entry created');
  
  // Return updated complaint
  const updatedComplaint = await Complaint.findById(complaintId)
    .populate('clientId', 'name email phone')
    .populate('department', 'name')
    .populate('currentAssigneeId', 'name email phone')
    .populate('natureType', 'name description');
  
  // Send WhatsApp notifications for department reassignment (async, don't wait)
  try {
    console.log('Sending WhatsApp notifications for department reassignment...');
    const stakeholderPhones = await NotificationService.getComplaintStakeholderPhones(updatedComplaint);
    const recipients = NotificationService.getNotificationRecipients(
      'reassigned',
      currentUser.role,
      stakeholderPhones
    );
    
    // Send notification in background (don't await)
    whatsappService.notifyComplaintAssigned(
      updatedComplaint,
      currentUser,
      currentDepartmentName,
      newDepartment.defaultAssigneeId.name,
      recipients
    ).catch(error => {
      console.error('WhatsApp notification failed:', error);
    });
    
    console.log(`WhatsApp notifications queued for ${recipients.length} recipients`);
  } catch (notificationError) {
    console.error('Error setting up WhatsApp notifications:', notificationError);
    // Continue without notifications - don't fail the assignment
  }
  
  return NextResponse.json({
    complaint: updatedComplaint,
    message: `Complaint successfully reassigned to ${newDepartment.name} department`,
    newAssignee: {
      name: newDepartment.defaultAssigneeId.name,
      email: newDepartment.defaultAssigneeId.email
    }
  });
}

// Handle user assignment within department (managers and admins)
async function handleUserAssignment(complaintId: string, body: any, currentUser: any, complaint: any) {
  const { userId, notes } = body;
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  // Validate new assignee exists and is active
  const newAssignee = await User.findOne({
    _id: userId,
    isActive: true
  }).populate('department', 'name');
  
  if (!newAssignee) {
    console.log('ERROR: User not found or inactive');
    return NextResponse.json({ error: 'Invalid or inactive user' }, { status: 400 });
  }
  
  console.log('SUCCESS: New assignee validated:', newAssignee.name);
  
  // Permission check for managers
  if (currentUser.role === 'manager') {
    const userDepartment = currentUser.department;
    const complaintDepartment = complaint.department.toString();
    const assigneeDepartment = newAssignee.department._id.toString();
    
    // Manager can assign within their department OR to other department managers
    const isAssigningWithinDepartment = userDepartment === assigneeDepartment;
    const isAssigningToOtherManager = newAssignee.role === 'manager' && userDepartment !== assigneeDepartment;
    const isComplaintInTheirDepartment = userDepartment === complaintDepartment;
    
    if (!isComplaintInTheirDepartment) {
      console.log('ERROR: Manager can only manage complaints from their department');
      return NextResponse.json({ 
        error: 'You can only assign complaints from your department' 
      }, { status: 403 });
    }
    
    if (!isAssigningWithinDepartment && !isAssigningToOtherManager) {
      console.log('ERROR: Manager can only assign to team members or other department managers');
      return NextResponse.json({ 
        error: 'You can only assign complaints to your team members or other department managers' 
      }, { status: 403 });
    }
  }
  
  // Get current assignee info for history
  const currentAssignee = await User.findById(complaint.currentAssigneeId);
  const currentAssigneeName = currentAssignee?.name || 'Unknown';
  
  // Update complaint assignee
  complaint.currentAssigneeId = userId;
  complaint.status = 'Assigned';
  
  await complaint.save();
  console.log('SUCCESS: Complaint assignee updated');
  
  // Create history entry with department info for cross-department assignments
  let historyNote = notes;
  if (!historyNote) {
    const isCrossDepartment = currentUser.department !== newAssignee.department._id.toString();
    if (isCrossDepartment) {
      historyNote = `Complaint reassigned from ${currentAssigneeName} to ${newAssignee.name} (${newAssignee.department.name} Department)`;
    } else {
      historyNote = `Complaint reassigned from ${currentAssigneeName} to ${newAssignee.name}`;
    }
  }
  
  await ComplaintHistory.create({
    complaintId: complaintId,
    status: 'Assigned',
    assignedFrom: complaint.currentAssigneeId,
    assignedTo: userId,
    notes: historyNote,
    changedBy: currentUser.id
  });
  
  console.log('SUCCESS: History entry created');
  
  // Return updated complaint
  const updatedComplaint = await Complaint.findById(complaintId)
    .populate('clientId', 'name email phone')
    .populate('department', 'name')
    .populate('currentAssigneeId', 'name email phone')
    .populate('natureType', 'name description');
  
  // Send WhatsApp notifications for user assignment (async, don't wait)
  try {
    console.log('Sending WhatsApp notifications for user assignment...');
    const stakeholderPhones = await NotificationService.getComplaintStakeholderPhones(updatedComplaint);
    const recipients = NotificationService.getNotificationRecipients(
      'assigned',
      currentUser.role,
      stakeholderPhones
    );
    
    // Send notification in background (don't await)
    whatsappService.notifyComplaintAssigned(
      updatedComplaint,
      currentUser,
      currentAssigneeName,
      newAssignee.name,
      recipients
    ).catch(error => {
      console.error('WhatsApp notification failed:', error);
    });
    
    console.log(`WhatsApp notifications queued for ${recipients.length} recipients`);
  } catch (notificationError) {
    console.error('Error setting up WhatsApp notifications:', notificationError);
    // Continue without notifications - don't fail the assignment
  }
  
  // Success message with department info for cross-department assignments
  const isCrossDepartment = currentUser.department !== newAssignee.department._id.toString();
  const successMessage = isCrossDepartment 
    ? `Complaint successfully assigned to ${newAssignee.name} (${newAssignee.department.name} Department)`
    : `Complaint successfully assigned to ${newAssignee.name}`;
  
  return NextResponse.json({
    complaint: updatedComplaint,
    message: successMessage,
    newAssignee: {
      name: newAssignee.name,
      email: newAssignee.email,
      department: newAssignee.department.name
    }
  });
}

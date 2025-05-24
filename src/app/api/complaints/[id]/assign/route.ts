import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import Department from '@/models/Department';
import ComplaintHistory from '@/models/ComplaintHistory';

interface Params {
  params: {
    id: string;
  };
}

// Reassign complaint to a different department
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
    
    // Only admins can reassign departments
    if (session.user.role !== 'admin') {
      console.log('ERROR: User is not admin:', session.user.role);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    console.log('SUCCESS: Admin authenticated');
    
    await dbConnect();
    console.log('SUCCESS: Database connected');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { department: newDepartmentId, notes } = body;
    
    if (!newDepartmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }
    
    // Validate complaint exists
    const complaint = await Complaint.findById(params.id);
    if (!complaint) {
      console.log('ERROR: Complaint not found');
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    console.log('SUCCESS: Complaint found:', complaint.title);
    
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
    
    // Get current department info for history
    const currentDepartment = await Department.findById(complaint.department);
    const currentDepartmentName = currentDepartment?.name || 'Unknown';
    
    // Update complaint with new department and assignee
    complaint.department = newDepartmentId;
    complaint.currentAssigneeId = newDepartment.defaultAssigneeId._id;
    complaint.status = 'Assigned'; // Update status to reflect reassignment
    
    await complaint.save();
    console.log('SUCCESS: Complaint updated');
    
    // Create history entry
    const historyNote = notes || `Complaint reassigned from ${currentDepartmentName} to ${newDepartment.name} by admin`;
    
    await ComplaintHistory.create({
      complaintId: params.id,
      status: 'Assigned',
      assignedTo: newDepartment.defaultAssigneeId._id,
      notes: historyNote,
      changedBy: session.user.id
    });
    
    console.log('SUCCESS: History entry created');
    
    // Return updated complaint with populated fields
    const updatedComplaint = await Complaint.findById(params.id)
      .populate('clientId', 'name email')
      .populate('department', 'name')
      .populate('currentAssigneeId', 'name email')
      .populate('natureType', 'name description');
    
    console.log('=== COMPLAINT ASSIGNMENT COMPLETE ===');
    
    return NextResponse.json({
      complaint: updatedComplaint,
      message: `Complaint successfully reassigned to ${newDepartment.name} department`,
      newAssignee: {
        name: newDepartment.defaultAssigneeId.name,
        email: newDepartment.defaultAssigneeId.email
      }
    });
    
  } catch (error: any) {
    console.error('=== COMPLAINT ASSIGNMENT ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({
      error: 'Failed to reassign complaint',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
};

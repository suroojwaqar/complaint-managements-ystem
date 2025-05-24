import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import ComplaintHistory from '@/models/ComplaintHistory';

interface Params {
  params: {
    id: string;
  };
}

// Get a specific complaint
export async function GET(req: NextRequest, { params }: Params) {
  try {
    console.log(`Fetching complaint with ID: ${params.id}`);
    
    // Step 1: Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', session.user.id, session.user.role);
    
    // Step 2: Connect to database
    await dbConnect();
    console.log('Database connected');
    
    // Step 3: Fetch complaint with basic population first
    console.log('Fetching complaint...');
    const complaint = await Complaint.findById(params.id)
      .populate('clientId', 'name email')
      .populate('department', 'name')
      .populate('currentAssigneeId', 'name email')
      .populate('firstAssigneeId', 'name email')
      .populate('natureType', 'name description');
      
    if (!complaint) {
      console.log('Complaint not found');
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    console.log('Complaint found:', complaint.title);
    
    // Step 4: Check permissions
    const currentUser = session.user;
    
    // Clients can only view their own complaints
    if (currentUser.role === 'client' && complaint.clientId._id.toString() !== currentUser.id) {
      console.log('Client permission denied - not their complaint');
      return NextResponse.json({ error: 'You can only view your own complaints' }, { status: 403 });
    }
    
    // Employees can view complaints assigned to them
    if (currentUser.role === 'employee' && complaint.currentAssigneeId._id.toString() !== currentUser.id) {
      console.log('Employee permission denied - not assigned to them');
      return NextResponse.json({ error: 'You can only view complaints assigned to you' }, { status: 403 });
    }
    
    // Managers can view complaints from their department or assigned to them
    if (currentUser.role === 'manager') {
      const userDepartment = currentUser.department;
      const complaintDepartment = complaint.department._id.toString();
      const isAssignedToManager = complaint.currentAssigneeId._id.toString() === currentUser.id;
      
      console.log('Manager permission check:');
      console.log('User department:', userDepartment);
      console.log('Complaint department:', complaintDepartment);
      console.log('Is assigned to manager:', isAssignedToManager);
      
      if (!userDepartment || (complaintDepartment !== userDepartment && !isAssignedToManager)) {
        console.log('Manager permission denied - not their department and not assigned to them');
        return NextResponse.json({ error: 'You can only view complaints from your department or assigned to you' }, { status: 403 });
      }
    }
    
    // Admins can view all complaints (no additional check needed)
    
    console.log('Permission check passed');
    
    // Step 5: Get complaint history (simplified)
    console.log('Fetching complaint history...');
    try {
      const history = await ComplaintHistory.find({ complaintId: params.id })
        .populate('assignedFrom', 'name')
        .populate('assignedTo', 'name')
        .sort({ timestamp: -1 });
      
      console.log(`Found ${history.length} history entries`);
      
      return NextResponse.json({ 
        complaint, 
        history: history || [] 
      });
    } catch (historyError) {
      console.error('Error fetching history, returning complaint without history:', historyError);
      
      // Return complaint without history if history fetch fails
      return NextResponse.json({ 
        complaint, 
        history: [],
        note: 'History could not be loaded'
      });
    }
    
  } catch (error: any) {
    console.error('Error in complaint GET:', error);
    
    // Return detailed error in development
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Update a complaint (simplified version)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    console.log(`Updating complaint with ID: ${params.id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = session.user;
    const body = await req.json();
    console.log('Update request body:', Object.keys(body));
    
    // Connect to database
    await dbConnect();
    
    // Get current complaint
    const complaint = await Complaint.findById(params.id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    // Basic permission check
    if (currentUser.role === 'client') {
      return NextResponse.json({ error: 'Clients cannot update complaints' }, { status: 403 });
    }
    
    // Create history entry if status changes
    if (body.status && body.status !== complaint.status) {
      console.log(`Status changing from ${complaint.status} to ${body.status}`);
      
      try {
        await ComplaintHistory.create({
          complaintId: complaint._id,
          status: body.status,
          assignedTo: complaint.currentAssigneeId,
          notes: body.notes || `Status changed to ${body.status}`,
          timestamp: new Date()
        });
        console.log('History entry created');
      } catch (historyError) {
        console.error('Failed to create history entry:', historyError);
        // Continue with update even if history fails
      }
    }
    
    // Update complaint
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
    .populate('clientId', 'name email')
    .populate('department', 'name')
    .populate('currentAssigneeId', 'name email')
    .populate('natureType', 'name description');
    
    console.log('Complaint updated successfully');
    return NextResponse.json(updatedComplaint);
    
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Delete a complaint (admin only)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    console.log(`Deleting complaint with ID: ${params.id}`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    await dbConnect();
    
    const deletedComplaint = await Complaint.findByIdAndDelete(params.id);
    
    if (!deletedComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    // Also delete related history
    try {
      await ComplaintHistory.deleteMany({ complaintId: params.id });
      console.log('Related history deleted');
    } catch (historyError) {
      console.error('Failed to delete history:', historyError);
      // Continue even if history deletion fails
    }
    
    console.log('Complaint deleted successfully');
    return NextResponse.json({ message: 'Complaint deleted successfully' });
    
  } catch (error: any) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

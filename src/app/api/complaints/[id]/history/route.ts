import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ComplaintHistory from '@/models/ComplaintHistory';
import Complaint from '@/models/Complaint';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    console.log(`Fetching history for complaint: ${params.id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // First check if complaint exists and user has permission
    const complaint = await Complaint.findById(params.id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }
    
    // Permission check
    const currentUser = session.user;
    
    if (currentUser.role === 'client' && complaint.clientId.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (currentUser.role === 'employee' && complaint.currentAssigneeId.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (currentUser.role === 'manager' && complaint.department.toString() !== currentUser.department) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Fetch history
    const history = await ComplaintHistory.find({ complaintId: params.id })
      .populate('assignedFrom', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ timestamp: -1 });
    
    console.log(`Found ${history.length} history entries`);
    
    return NextResponse.json(history);
    
  } catch (error: any) {
    console.error('Error fetching complaint history:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import ComplaintHistory from '@/models/ComplaintHistory';

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    await dbConnect();
    
    const body = await req.json();
    const { action, complaintIds } = body;
    
    if (!action || !complaintIds || !Array.isArray(complaintIds)) {
      return NextResponse.json(
        { error: 'Invalid request. Action and complaintIds are required.' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'delete':
        // Delete multiple complaints
        result = await Complaint.deleteMany({ _id: { $in: complaintIds } });
        
        // Also delete related history
        try {
          await ComplaintHistory.deleteMany({ complaintId: { $in: complaintIds } });
        } catch (historyError) {
          console.error('Failed to delete related history:', historyError);
        }
        
        return NextResponse.json({
          message: `${result.deletedCount} complaint(s) deleted successfully`,
          deletedCount: result.deletedCount
        });
        
      case 'export':
        // Export complaint data
        const complaints = await Complaint.find({ _id: { $in: complaintIds } })
          .populate('clientId', 'name email')
          .populate('department', 'name')
          .populate('currentAssigneeId', 'name email')
          .populate('firstAssigneeId', 'name email')
          .populate('natureType', 'name description')
          .lean();
          
        return NextResponse.json({
          message: 'Complaints exported successfully',
          data: complaints
        });
        
      case 'updateStatus':
        // Bulk update status
        const { newStatus } = body;
        if (!newStatus) {
          return NextResponse.json(
            { error: 'New status is required for status update' },
            { status: 400 }
          );
        }
        
        result = await Complaint.updateMany(
          { _id: { $in: complaintIds } },
          { $set: { status: newStatus, updatedAt: new Date() } }
        );
        
        // Create history entries for status changes
        const historyEntries = complaintIds.map(id => ({
          complaintId: id,
          status: newStatus,
          notes: `Bulk status update to ${newStatus}`,
          timestamp: new Date()
        }));
        
        try {
          await ComplaintHistory.insertMany(historyEntries);
        } catch (historyError) {
          console.error('Failed to create history entries:', historyError);
        }
        
        return NextResponse.json({
          message: `${result.modifiedCount} complaint(s) status updated successfully`,
          modifiedCount: result.modifiedCount
        });
        
      case 'assign':
        // Bulk assign to user
        const { assigneeId } = body;
        if (!assigneeId) {
          return NextResponse.json(
            { error: 'Assignee ID is required for assignment' },
            { status: 400 }
          );
        }
        
        result = await Complaint.updateMany(
          { _id: { $in: complaintIds } },
          { 
            $set: { 
              currentAssigneeId: assigneeId,
              status: 'Assigned',
              updatedAt: new Date() 
            } 
          }
        );
        
        // Create history entries for assignments
        const assignmentHistoryEntries = complaintIds.map(id => ({
          complaintId: id,
          status: 'Assigned',
          assignedTo: assigneeId,
          notes: 'Bulk assignment',
          timestamp: new Date()
        }));
        
        try {
          await ComplaintHistory.insertMany(assignmentHistoryEntries);
        } catch (historyError) {
          console.error('Failed to create assignment history entries:', historyError);
        }
        
        return NextResponse.json({
          message: `${result.modifiedCount} complaint(s) assigned successfully`,
          modifiedCount: result.modifiedCount
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: delete, export, updateStatus, assign' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in bulk complaint operation:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

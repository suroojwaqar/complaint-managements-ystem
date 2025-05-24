import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Complaint from '@/models/Complaint';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers and admins can view team data
    if (!['manager', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get team members based on user role
    let query = { isActive: true };
    
    // If user is a manager (not admin), they can only see their department
    if (session.user.role === 'manager' && session.user.department) {
      console.log('Manager filtering for department:', session.user.department);
      query = {
        ...query,
        department: session.user.department,
        role: { $in: ['employee', 'manager'] } // Only employees and managers from same department
      };
    } else if (session.user.role === 'admin') {
      // Admins can see all active users except other admins for assignment purposes
      query = {
        ...query,
        role: { $in: ['employee', 'manager'] }
      };
    }

    // Get team members with department info
    console.log('Team query:', JSON.stringify(query));
    const teamMembers = await User.find(query)
      .select('name email role department isActive createdAt updatedAt lastActive')
      .populate('department', 'name description')
      .sort({ department: 1, role: 1, name: 1 });
    
    console.log(`Found ${teamMembers.length} team members for ${session.user.role}:`, 
                teamMembers.map(m => ({ name: m.name, role: m.role, dept: m.department?.name })));

    // Get complaint statistics for each team member
    const teamMembersWithStats = await Promise.all(
      teamMembers.map(async (member) => {
        try {
          // Get complaint stats for this user
          const [activeComplaints, completedComplaints, totalComplaints] = await Promise.all([
            Complaint.countDocuments({
              currentAssigneeId: member._id,
              status: { $in: ['New', 'Assigned', 'In Progress'] }
            }),
            Complaint.countDocuments({
              currentAssigneeId: member._id,
              status: { $in: ['Completed', 'Done', 'Closed'] }
            }),
            Complaint.countDocuments({
              $or: [
                { currentAssigneeId: member._id },
                { firstAssigneeId: member._id }
              ]
            })
          ]);

          // Calculate average resolution time (simplified)
          const recentCompletedComplaints = await Complaint.find({
            currentAssigneeId: member._id,
            status: { $in: ['Completed', 'Done', 'Closed'] },
            updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          }).select('createdAt updatedAt').limit(10);

          let avgResolutionTime = 0;
          if (recentCompletedComplaints.length > 0) {
            const totalTime = recentCompletedComplaints.reduce((sum, complaint) => {
              return sum + (new Date(complaint.updatedAt).getTime() - new Date(complaint.createdAt).getTime());
            }, 0);
            avgResolutionTime = Math.round(totalTime / recentCompletedComplaints.length / (1000 * 60 * 60)); // Convert to hours
          }

          return {
            ...member.toObject(),
            stats: {
              activeComplaints,
              completedComplaints,
              totalComplaints,
              avgResolutionTime
            }
          };
        } catch (error) {
          console.error(`Error getting stats for user ${member._id}:`, error);
          return {
            ...member.toObject(),
            stats: {
              activeComplaints: 0,
              completedComplaints: 0,
              totalComplaints: 0,
              avgResolutionTime: 0
            }
          };
        }
      })
    );

    return NextResponse.json(teamMembersWithStats);

  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Complaint from '@/models/Complaint';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    let teamMembers = [];
    
    // If user is a manager (not admin), get their team + other department managers
    if (session.user.role === 'manager' && session.user.department) {
      console.log('Manager filtering for user ID:', session.user.id, 'department:', session.user.department);
      
      // Get employees from their own department (excluding themselves)
      const ownTeamMembers = await User.find({
        isActive: true,
        department: session.user.department,
        role: 'employee', // Only employees from same department
        _id: { $ne: session.user.id } // Exclude current user
      })
      .select('name email role department isActive createdAt updatedAt lastActive profileImage')
      .populate('department', 'name description')
      .sort({ name: 1 });
      
      // Get managers from OTHER departments (cross-department collaboration)
      const otherDepartmentManagers = await User.find({
        isActive: true,
        role: 'manager',
        department: { $ne: session.user.department }, // Different departments only
        _id: { $ne: session.user.id } // Exclude current user (redundant but safe)
      })
      .select('name email role department isActive createdAt updatedAt lastActive profileImage')
      .populate('department', 'name description')
      .sort({ 'department.name': 1, name: 1 });
      
      // Combine both arrays
      teamMembers = [...ownTeamMembers, ...otherDepartmentManagers];
      
      console.log(`Found ${ownTeamMembers.length} team members + ${otherDepartmentManagers.length} cross-department managers`);
      
    } else if (session.user.role === 'admin') {
      // Admins can see all active users except other admins for assignment purposes
      teamMembers = await User.find({
        isActive: true,
        role: { $in: ['employee', 'manager'] },
        _id: { $ne: session.user.id } // Exclude current admin
      })
      .select('name email role department isActive createdAt updatedAt lastActive profileImage')
      .populate('department', 'name description')
      .sort({ department: 1, role: 1, name: 1 });
    }
    
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
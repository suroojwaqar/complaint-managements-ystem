import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only managers can access team members
    if (session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can access team members' }, { status: 403 });
    }

    // Get team members (employees in same department) and other department managers
    const teamMembers = await User.find({
      $or: [
        // Employees in the same department (excluding the current manager)
        {
          department: session.user.department,
          role: 'employee',
          isActive: true
        },
        // Managers from other departments (for cross-department escalation)
        {
          role: 'manager',
          department: { $ne: session.user.department },
          isActive: true
        }
      ]
    })
    .populate('department', 'name') // Include department name for context
    .select('name email role department') // Include department field
    .sort({ department: 1, name: 1 }); // Sort by department, then name

    return NextResponse.json(teamMembers);

  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
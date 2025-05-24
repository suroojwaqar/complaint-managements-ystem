import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Skipping authentication and authorization checks

    // Get all active team members (employees and managers)
    const teamMembers = await User.find({
      isActive: true,
      $or: [
        { role: 'employee' },
        { role: 'manager' }
      ]
    })
    .select('name email role department')
    .populate('department', 'name') // Include department name for context
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
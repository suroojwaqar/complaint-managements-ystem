import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get fresh user data from database
    const user = await User.findById(session.user.id)
      .select('name email role department profileImage')
      .populate('department', '_id');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return updated session data
    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department?._id?.toString(),
        profileImage: user.profileImage,
      }
    };

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error('Error refreshing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { hasRole, handleApiError } from '@/lib/api-utils';

export const GET = hasRole('admin', async (req: NextRequest) => {
  try {
    await dbConnect();
    
    // Get query parameters for filtering
    const url = new URL(req.url);
    const role = url.searchParams.get('role');
    const departmentId = url.searchParams.get('department');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    // Build query - include inactive users if requested
    const query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }
    if (role) query.role = role;
    if (departmentId) query.department = departmentId;
    
    const users = await User.find(query)
      .select('-password')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = hasRole('admin', async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.email || !body.password || !body.name || !body.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    // Create new user
    const user = await User.create(body);
    
    // Return user without password
    const userWithoutPassword = await User.findById(user._id)
      .select('-password')
      .populate('department', 'name');
      
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

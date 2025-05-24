import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';
import mongoose from 'mongoose';

// Get a specific user
export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    console.log('Getting user details for ID:', params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    await dbConnect();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    const user = await User.findById(params.id)
      .select('-password')
      .populate('department', 'name');
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', user.name);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};

// Update a user
export const PUT = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    console.log('=== USER UPDATE START ===');
    console.log('User ID:', params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('ERROR: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'admin') {
      console.log('ERROR: User is not admin:', session.user.role);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    console.log('SUCCESS: Admin authenticated');
    
    // Connect to database
    await dbConnect();
    console.log('SUCCESS: Database connected');
    
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      console.log('ERROR: Invalid user ID format:', params.id);
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.log('SUCCESS: Request body parsed:', body);
    } catch (error) {
      console.log('ERROR: Failed to parse request body');
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Find user
    const user = await User.findById(params.id);
    if (!user) {
      console.log('ERROR: User not found:', params.id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('SUCCESS: User found:', user.name);
    
    // Create update data object
    const updateData: any = {};
    
    // Handle individual fields
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }
    
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      
      // Check email uniqueness if email is being updated
      if (body.email !== user.email) {
        console.log('INFO: Checking email uniqueness:', body.email);
        const emailExists = await User.findOne({ 
          email: body.email.toLowerCase(),
          _id: { $ne: params.id }
        });
        
        if (emailExists) {
          console.log('ERROR: Email already exists');
          return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
        }
        
        console.log('SUCCESS: Email is unique');
      }
      
      updateData.email = body.email.toLowerCase();
    }
    
    if (body.role !== undefined) {
      const validRoles = ['client', 'employee', 'manager', 'admin'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = body.role;
    }
    
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }
    
    // Handle department
    if (body.department !== undefined) {
      if (body.department === null || body.department === 'none') {
        updateData.department = null;
        console.log('INFO: Department set to null');
      } else {
        if (!mongoose.Types.ObjectId.isValid(body.department)) {
          console.log('ERROR: Invalid department ID format');
          return NextResponse.json({ error: 'Invalid department ID format' }, { status: 400 });
        }
        
        const department = await Department.findById(body.department);
        if (!department) {
          console.log('ERROR: Department not found:', body.department);
          return NextResponse.json({ error: 'Department not found' }, { status: 400 });
        }
        
        updateData.department = body.department;
        console.log('SUCCESS: Department validated:', department.name);
      }
    }
    
    // Handle password update separately to avoid bcrypt double-hashing
    if (body.password) {
      console.log('INFO: Updating password');
      if (typeof body.password !== 'string' || body.password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      
      // Update password directly using save() to trigger pre-save hook
      user.password = body.password;
      await user.save();
      console.log('SUCCESS: Password updated');
    }
    
    // Update other fields if any
    if (Object.keys(updateData).length > 0) {
      console.log('INFO: Updating user fields:', Object.keys(updateData));
      
      // Use findByIdAndUpdate with validation
      const updatedUser = await User.findByIdAndUpdate(
        params.id,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true,
          context: 'query' // This ensures the conditional required validation works
        }
      ).select('-password').populate('department', 'name');
      
      if (!updatedUser) {
        console.log('ERROR: Failed to update user');
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
      
      console.log('SUCCESS: User fields updated');
      
      console.log('SUCCESS: User update complete');
      console.log('=== USER UPDATE END ===');
      
      return NextResponse.json(updatedUser);
    } else if (body.password) {
      // If only password was updated, return the user data
      const updatedUser = await User.findById(params.id)
        .select('-password')
        .populate('department', 'name');
      
      console.log('SUCCESS: Password update complete');
      console.log('=== USER UPDATE END ===');
      
      return NextResponse.json(updatedUser);
    } else {
      console.log('INFO: No fields to update');
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
  } catch (error: any) {
    console.error('=== USER UPDATE ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validationErrors.join(', ')
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'Email already exists'
      }, { status: 409 });
    }
    
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
};

// Delete a user (permanent deletion from database)
export const DELETE = async (req: NextRequest, context: { params: { id: string } }) => {
  try {
    console.log('DELETE request received for user:', context.params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', session.user.id, session.user.role);
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      console.log('User is not admin');
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(context.params.id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }
    
    // Prevent self-deletion
    if (session.user.id === context.params.id) {
      console.log('User trying to delete themselves');
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    await dbConnect();
    console.log('Database connected');
    
    // Check if user exists first
    const user = await User.findById(context.params.id);
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Permanently delete the user
    const deletedUser = await User.findByIdAndDelete(context.params.id);
    
    if (!deletedUser) {
      console.log('User not found during deletion');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User permanently deleted:', deletedUser._id, deletedUser.name, deletedUser.email);
    return NextResponse.json({ 
      message: 'User permanently deleted successfully',
      deletedUser: {
        id: deletedUser._id,
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role
      }
    });
  } catch (error: any) {
    console.error('Error in DELETE route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
};

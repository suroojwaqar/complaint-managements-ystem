import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Department from '@/models/Department';
import User from '@/models/User';

// Get all departments
export async function GET(req: NextRequest) {
  try {
    console.log('Departments API called');
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', session.user.id);
    
    await dbConnect();
    console.log('Database connected');
    
    const departments = await Department.find({})
      .populate('managerId', 'name email')
      .populate('defaultAssigneeId', 'name email')
      .sort({ name: 1 });
      
    console.log(`Found ${departments.length} departments`);
    
    // Return in both formats for compatibility
    return NextResponse.json({ 
      departments: departments,
      // Also include direct array for backward compatibility
      data: departments 
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Create a new department
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields - only name and managerId are required now
    if (!body.name || !body.managerId) {
      return NextResponse.json({ error: 'Missing required fields: name and managerId' }, { status: 400 });
    }
    
    // Verify manager exists and is a manager
    const manager = await User.findOne({ 
      _id: body.managerId, 
      role: 'manager',
      isActive: true 
    });
    
    if (!manager) {
      return NextResponse.json({ error: 'Invalid manager ID or manager not found' }, { status: 400 });
    }
    
    // Check for duplicate department name
    const existingDepartment = await Department.findOne({ name: body.name });
    if (existingDepartment) {
      return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
    }
    
    // Create department with manager as the primary contact
    // In the new auto-routing system, complaints go directly to the manager
    const departmentData = {
      name: body.name,
      description: body.description || '',
      managerId: body.managerId,
      // Set manager as default assignee too for backward compatibility
      defaultAssigneeId: body.managerId,
      isActive: true
    };
    
    const department = await Department.create(departmentData);
    
    // Return populated department
    const populatedDepartment = await Department.findById(department._id)
      .populate('managerId', 'name email')
      .populate('defaultAssigneeId', 'name email');
      
    return NextResponse.json(populatedDepartment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

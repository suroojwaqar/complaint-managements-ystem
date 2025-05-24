import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Department from '@/models/Department';
import User from '@/models/User';
import Complaint from '@/models/Complaint';
import { hasRole, handleApiError } from '@/lib/api-utils';

interface Params {
  params: {
    id: string;
  };
}

// Get a specific department
export const GET = async (req: NextRequest, { params }: Params) => {
  try {
    console.log('Getting department details for ID:', params.id);
    
    // Validate ObjectId format
    if (!params.id || !params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid department ID format:', params.id);
      return NextResponse.json({ error: 'Invalid department ID format' }, { status: 400 });
    }
    
    await dbConnect();
    
    const department = await Department.findById(params.id)
      .populate('managerId', 'name email')
      .populate('defaultAssigneeId', 'name email');
      
    if (!department) {
      console.log('Department not found for ID:', params.id);
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    console.log('Department found:', department.name);
    
    // Safely check if manager and default assignee exist
    if (!department.managerId) {
      console.log('Warning: Department has no manager assigned');
    }
    
    if (!department.defaultAssigneeId) {
      console.log('Warning: Department has no default assignee');
    }
    
    // Fetch team members (users in this department)
    const excludeIds = [];
    if (department.managerId?._id) excludeIds.push(department.managerId._id);
    if (department.defaultAssigneeId?._id) excludeIds.push(department.defaultAssigneeId._id);
    
    const teamMembers = await User.find({ 
      department: params.id, 
      isActive: true,
      _id: { $nin: excludeIds }
    }).select('name email role');
    
    console.log('Team members found:', teamMembers.length);
    
    // Fetch performance metrics from complaints
    const [totalComplaints, resolvedComplaints, pendingComplaints] = await Promise.all([
      Complaint.countDocuments({ department: params.id }),
      Complaint.countDocuments({ department: params.id, status: { $in: ['Completed', 'Done', 'Closed'] } }),
      Complaint.countDocuments({ department: params.id, status: { $in: ['New', 'Assigned', 'In Progress'] } })
    ]);
    
    // Calculate average resolution time (for completed complaints)
    const completedComplaints = await Complaint.find({ 
      department: params.id, 
      status: { $in: ['Completed', 'Done', 'Closed'] } 
    }).select('createdAt updatedAt');
    
    let averageResolutionTime = 0;
    if (completedComplaints.length > 0) {
      const totalResolutionTime = completedComplaints.reduce((sum, complaint) => {
        const resolutionTime = new Date(complaint.updatedAt).getTime() - new Date(complaint.createdAt).getTime();
        return sum + (resolutionTime / (1000 * 60 * 60 * 24)); // Convert to days
      }, 0);
      averageResolutionTime = Math.round(totalResolutionTime / completedComplaints.length * 10) / 10;
    }
    
    console.log('Performance metrics calculated:', {
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      averageResolutionTime
    });
    
    // Prepare response with all data
    const departmentWithData = {
      ...department.toObject(),
      members: teamMembers,
      memberCount: teamMembers.length + (department.managerId ? 1 : 0) + (department.defaultAssigneeId ? 1 : 0),
      statistics: {
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        averageResolutionTime
      }
    };
    
    return NextResponse.json(departmentWithData);
  } catch (error: any) {
    console.error('Error fetching department details:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
    }, { status: 500 });
  }
};

// Update a department
export const PUT = async (req: NextRequest, { params }: Params) => {
  try {
    console.log('=== DEPARTMENT UPDATE START ===');
    console.log('Department ID:', params.id);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('ERROR: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      console.log('ERROR: User is not admin:', session.user.role);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    console.log('SUCCESS: Admin authenticated');
    
    await dbConnect();
    console.log('SUCCESS: Database connected');
    
    const body = await req.json();
    console.log('SUCCESS: Request body parsed:', body);
    
    // Validate department ID format
    if (!params.id || !params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('ERROR: Invalid department ID format:', params.id);
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }
    
    // Check if department exists
    const existingDepartment = await Department.findById(params.id);
    if (!existingDepartment) {
      console.log('ERROR: Department not found:', params.id);
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    console.log('SUCCESS: Department found:', existingDepartment.name);
    
    // Check for duplicate department name
    if (body.name && body.name !== existingDepartment.name) {
      console.log('INFO: Checking name uniqueness:', body.name);
      const duplicateDepartment = await Department.findOne({ 
        name: body.name, 
        _id: { $ne: params.id } 
      });
      
      if (duplicateDepartment) {
        console.log('ERROR: Department name already exists');
        return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
      }
      console.log('SUCCESS: Department name is unique');
    }
    
    // Verify manager if provided
    if (body.managerId) {
      console.log('INFO: Validating manager:', body.managerId);
      
      if (!body.managerId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('ERROR: Invalid manager ID format');
        return NextResponse.json({ error: 'Invalid manager ID format' }, { status: 400 });
      }
      
      const manager = await User.findOne({ 
        _id: body.managerId, 
        role: 'manager',
        isActive: true 
      });
      
      if (!manager) {
        console.log('ERROR: Manager not found or invalid');
        return NextResponse.json({ error: 'Invalid manager ID - user not found or not a manager' }, { status: 400 });
      }
      
      console.log('SUCCESS: Manager validated:', manager.name);
    }
    
    // Verify default assignee if provided (and different from manager)
    if (body.defaultAssigneeId && body.defaultAssigneeId !== body.managerId) {
      console.log('INFO: Validating default assignee:', body.defaultAssigneeId);
      
      if (!body.defaultAssigneeId.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('ERROR: Invalid assignee ID format');
        return NextResponse.json({ error: 'Invalid default assignee ID format' }, { status: 400 });
      }
      
      const defaultAssignee = await User.findOne({ 
        _id: body.defaultAssigneeId, 
        isActive: true 
      });
      
      if (!defaultAssignee) {
        console.log('ERROR: Default assignee not found or invalid');
        return NextResponse.json({ error: 'Invalid default assignee ID - user not found' }, { status: 400 });
      }
      
      console.log('SUCCESS: Default assignee validated:', defaultAssignee.name);
    } else if (body.defaultAssigneeId === body.managerId) {
      console.log('INFO: Default assignee is same as manager - this is allowed');
    }
    
    // Update department
    console.log('INFO: Updating department with data:', Object.keys(body));
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
    .populate('managerId', 'name email')
    .populate('defaultAssigneeId', 'name email');
    
    if (!updatedDepartment) {
      console.log('ERROR: Department not found during update');
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    console.log('SUCCESS: Department updated:', updatedDepartment.name);
    console.log('=== DEPARTMENT UPDATE COMPLETE ===');
    
    return NextResponse.json(updatedDepartment);
  } catch (error: any) {
    console.error('=== DEPARTMENT UPDATE ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to update department',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
};

// Delete a department (complete/permanent delete)
export const DELETE = async (req: NextRequest, { params }: Params) => {
  try {
    console.log('DELETE request received for department:', params.id);
    
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
    
    await dbConnect();
    console.log('Database connected');
    
    // Check if department exists first
    const department = await Department.findById(params.id);
    if (!department) {
      console.log('Department not found');
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    // TODO: Check if department has any complaints assigned to it
    // You might want to prevent deletion if there are active complaints
    // const Complaint = require('@/models/Complaint');
    // const activeComplaints = await Complaint.countDocuments({ department: params.id, status: { $ne: 'Closed' } });
    // if (activeComplaints > 0) {
    //   return NextResponse.json({ 
    //     error: `Cannot delete department. It has ${activeComplaints} active complaints assigned.` 
    //   }, { status: 400 });
    // }
    
    // Permanently delete the department
    const deletedDepartment = await Department.findByIdAndDelete(params.id);
    
    if (!deletedDepartment) {
      console.log('Department not found during deletion');
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    
    console.log('Department permanently deleted:', deletedDepartment._id, deletedDepartment.name);
    return NextResponse.json({ 
      message: 'Department permanently deleted successfully',
      deletedDepartment: {
        id: deletedDepartment._id,
        name: deletedDepartment.name
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

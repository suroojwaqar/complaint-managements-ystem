import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';
import Department from '@/models/Department';
import NatureType from '@/models/NatureType';
import ComplaintHistory from '@/models/ComplaintHistory';
import whatsappService from '@/services/whatsappService';
import { NotificationService } from '@/services/notificationService';
import mongoose from 'mongoose';
import Settings from '@/models/Settings';
import User from '@/models/User';

// Get complaints based on user role and permissions
export async function GET(request: NextRequest) {
  try {
    console.log('Starting complaints GET request...');
    
    // Step 1: Connect to database
    await dbConnect();
    console.log('Database connected successfully');
    
    // Step 2: Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User authenticated:', session.user.id, session.user.role);
    
    // Step 3: Parse query parameters
    const currentUser = session.user;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const departmentId = url.searchParams.get('department');
    const natureTypeId = url.searchParams.get('natureType');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Step 4: Build query based on user role
    let query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (departmentId) {
      query.department = departmentId;
    }

    if (natureTypeId) {
      query.natureType = natureTypeId;
    }
    
    // Role-based filtering
    if (currentUser.role === 'client') {
      query.clientId = currentUser.id;
    } else if (currentUser.role === 'employee') {
      query.currentAssigneeId = currentUser.id;
    } else if (currentUser.role === 'manager') {
      query.department = currentUser.department;
    }
    
    console.log('Final query:', query);
    
    // Step 5: Execute query WITH population
    console.log('Executing complaints query with population...');
    try {
      const complaints = await Complaint.find(query)
        .populate('clientId', 'name email')
        .populate('department', 'name')
        .populate('currentAssigneeId', 'name email')
        .populate('natureType', 'name description')
        .populate('attachments.uploadedBy', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);
      
      console.log(`Found ${complaints.length} complaints with population`);
      
      // Step 6: Get total count
      const total = await Complaint.countDocuments(query);
      console.log(`Total count: ${total}`);
      
      const response = {
        complaints,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit
        }
      };
      
      console.log('Returning successful response with populated fields');
      return NextResponse.json(response);
      
    } catch (populationError) {
      console.error('Population error:', populationError);
      
      // Fallback: try without natureType population
      console.log('Trying without natureType population...');
      try {
        const complaints = await Complaint.find(query)
          .populate('clientId', 'name email')
          .populate('department', 'name')
          .populate('currentAssigneeId', 'name email')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit);
        
        console.log(`Found ${complaints.length} complaints without natureType population`);
        
        const total = await Complaint.countDocuments(query);
        
        return NextResponse.json({
          complaints,
          pagination: {
            total,
            pages: Math.ceil(total / limit),
            page,
            limit
          },
          warning: 'natureType population failed - some fields may show as N/A'
        });
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        
        // Last resort: return without any population
        const basicComplaints = await Complaint.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit);
        
        const total = await Complaint.countDocuments(query);
        
        return NextResponse.json({
          complaints: basicComplaints,
          pagination: {
            total,
            pages: Math.ceil(total / limit),
            page,
            limit
          },
          warning: 'Population failed - showing basic data only'
        });
      }
    }
    
  } catch (error: any) {
    console.error('Error in complaints GET:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Create a new complaint
export async function POST(request: NextRequest) {
  try {
    console.log('Starting complaints POST request...');
    
    // Connect to database
    await dbConnect();
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUser = session.user;
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.errorType || !body.errorScreen || !body.natureType) {
      const missingFields = [];
      if (!body.title) missingFields.push('title');
      if (!body.description) missingFields.push('description');
      if (!body.errorType) missingFields.push('errorType');
      if (!body.errorScreen) missingFields.push('errorScreen');
      if (!body.natureType) missingFields.push('natureType');
      
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Handle creating complaint on behalf of client (Admin/Manager only)
    let clientId = currentUser.id;
    let createdOnBehalf = false;
    
    if (body.clientId && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
      // Verify the client exists
      const client = await User.findOne({
        _id: body.clientId,
        role: 'client',
        isActive: true
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Invalid client selected' }, { status: 400 });
      }
      
      clientId = body.clientId;
      createdOnBehalf = true;
      console.log(`${currentUser.role} creating complaint on behalf of client:`, client.name);
    }
    
    // Verify nature type exists and is active
    const natureType = await NatureType.findOne({
      _id: body.natureType,
      isActive: true
    });

    if (!natureType) {
      return NextResponse.json({ error: 'Invalid nature type' }, { status: 400 });
    }
    
    // Auto-assign department based on system settings
    let assignedDepartment;
    let defaultAssigneeId;
    
    // Get system settings for auto-routing
    let settings = null;
    try {
      settings = await Settings.findOne({ type: 'system' }).populate('autoRouting.departments');
    } catch (settingsError) {
      console.log('Settings model not available, using fallback routing');
      settings = null;
    }
    
    if (settings && settings.autoRouting.enabled && settings.autoRouting.departments.length > 0) {
      // Use settings-based auto-routing
      console.log('Using settings-based auto-routing');
      
      // Get a random department from the enabled departments for load balancing
      const enabledDepartments = await Department.find({
        _id: { $in: settings.autoRouting.departments },
        isActive: true
      }).populate('managerId');
      
      if (enabledDepartments.length > 0) {
        // Simple round-robin or random assignment
        const randomIndex = Math.floor(Math.random() * enabledDepartments.length);
        assignedDepartment = enabledDepartments[randomIndex];
        
        // Assign to department manager instead of default assignee
        defaultAssigneeId = assignedDepartment.managerId._id;
        console.log(`Auto-assigned to department: ${assignedDepartment.name}, Manager: ${assignedDepartment.managerId.name}`);
      } else {
        // Fallback to default department if configured
        if (settings.defaultDepartment) {
          assignedDepartment = await Department.findOne({ 
            _id: settings.defaultDepartment, 
            isActive: true 
          }).populate('managerId');
          
          if (assignedDepartment) {
            defaultAssigneeId = assignedDepartment.managerId._id;
            console.log(`Used default department: ${assignedDepartment.name}`);
          }
        }
      }
    }
    
    // Fallback logic if settings-based routing fails or is disabled
    if (!assignedDepartment) {
      console.log('Using fallback department assignment');
      
      if (currentUser.role === 'admin' && body.department) {
        // Admin can manually assign department
        assignedDepartment = await Department.findOne({ 
          _id: body.department, 
          isActive: true 
        }).populate('managerId');
        
        if (!assignedDepartment) {
          return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
        }
        
        defaultAssigneeId = assignedDepartment.managerId._id;
        console.log('Admin manually assigned department:', assignedDepartment.name);
      } else {
        // Auto-assign to first available active department for clients
        assignedDepartment = await Department.findOne({ isActive: true }).populate('managerId');
        
        if (!assignedDepartment) {
          return NextResponse.json({ 
            error: 'No active departments available. Please contact administrator.' 
          }, { status: 400 });
        }
        
        defaultAssigneeId = assignedDepartment.managerId._id;
        console.log('Fallback assigned to department:', assignedDepartment.name);
      }
    }
    
    // Ensure we have a valid assignee
    if (!defaultAssigneeId) {
      return NextResponse.json({ 
        error: 'No manager assigned to the selected department. Please contact administrator.' 
      }, { status: 400 });
    }
    
    // Process attachments if provided
    let processedAttachments = [];
    if (body.attachments && Array.isArray(body.attachments)) {
      processedAttachments = body.attachments.map((attachment: any) => ({
        ...attachment,
        uploadedBy: attachment.uploadedBy || currentUser.id
      }));
    }

    // Create complaint data
    const complaintData = {
      title: body.title.trim(),
      description: body.description.trim(),
      errorType: body.errorType.trim(),
      errorScreen: body.errorScreen.trim(),
      natureType: body.natureType,
      remark: body.remark?.trim() || '',
      attachments: processedAttachments,
      clientId: clientId,
      department: assignedDepartment._id,
      status: 'New',
      currentAssigneeId: defaultAssigneeId,
      firstAssigneeId: defaultAssigneeId
    };
    
    console.log('Creating complaint...');
    const complaint = await Complaint.create(complaintData);
    console.log('Complaint created successfully:', complaint._id);
    
    // Create complaint history entry
    console.log('Creating complaint history...');
    await ComplaintHistory.create({
      complaintId: complaint._id,
      status: 'New',
      assignedTo: defaultAssigneeId,
      notes: createdOnBehalf 
        ? `Complaint created by ${currentUser.role} (${currentUser.name}) on behalf of client and auto-assigned to ${assignedDepartment.name} department manager. Nature Type: ${natureType.name}`
        : `Complaint created and auto-assigned to ${assignedDepartment.name} department manager. Nature Type: ${natureType.name}`
    });
    console.log('Complaint history created');
    
    // Get populated complaint for WhatsApp notification
    let populatedComplaint;
    try {
      populatedComplaint = await Complaint.findById(complaint._id)
        .populate('clientId', 'name email phone')
        .populate('department', 'name')
        .populate('currentAssigneeId', 'name email phone')
        .populate('natureType', 'name description')
        .populate('attachments.uploadedBy', 'name');
    } catch (populationError) {
      console.error('Failed to populate created complaint:', populationError);
      populatedComplaint = complaint;
    }
    
    // Send WhatsApp notifications (async, don't wait for completion)
    try {
      console.log('Sending WhatsApp notifications for new complaint...');
      const stakeholderPhones = await NotificationService.getComplaintStakeholderPhones(populatedComplaint);
      const recipients = NotificationService.getNotificationRecipients(
        'created',
        currentUser.role,
        stakeholderPhones
      );
      
      // Send notification in background (don't await)
      whatsappService.notifyComplaintCreated(
        populatedComplaint,
        currentUser,
        stakeholderPhones.assignee || undefined,
        recipients
      ).catch(error => {
        console.error('WhatsApp notification failed:', error);
      });
      
      console.log(`WhatsApp notifications queued for ${recipients.length} recipients`);
    } catch (notificationError) {
      console.error('Error setting up WhatsApp notifications:', notificationError);
      // Continue without notifications - don't fail the complaint creation
    }
    
    // Return populated complaint
    if (populatedComplaint && populatedComplaint.toObject) {
      return NextResponse.json({
        ...populatedComplaint.toObject(),
        message: `Complaint submitted successfully and assigned to ${assignedDepartment.name} department manager`
      }, { status: 201 });
    } else {
      return NextResponse.json({
        ...complaint.toObject(),
        message: `Complaint created successfully and assigned to ${assignedDepartment.name} department manager`
      }, { status: 201 });
    }
    
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

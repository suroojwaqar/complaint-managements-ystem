import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';

// Simple test endpoint to debug the basic functionality
export async function GET(request: NextRequest) {
  try {
    console.log('=== STARTING COMPLAINTS TEST ENDPOINT ===');
    
    // Step 1: Test database connection
    console.log('1. Testing database connection...');
    await dbConnect();
    console.log('✅ Database connected successfully');
    
    // Step 2: Test authentication
    console.log('2. Testing authentication...');
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Unauthorized',
        step: 'authentication',
        details: 'No session found'
      }, { status: 401 });
    }
    console.log('✅ User authenticated:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role
    });
    
    // Step 3: Test each model import
    console.log('3. Testing model imports...');
    try {
      console.log('3a. Testing Complaint model...');
      const Complaint = require('@/models/Complaint').default;
      console.log('✅ Complaint model loaded');
      
      console.log('3b. Testing Department model...');
      const Department = require('@/models/Department').default;
      console.log('✅ Department model loaded');
      
      console.log('3c. Testing NatureType model...');
      const NatureType = require('@/models/NatureType').default;
      console.log('✅ NatureType model loaded');
      
      console.log('3d. Testing ComplaintHistory model...');
      const ComplaintHistory = require('@/models/ComplaintHistory').default;
      console.log('✅ ComplaintHistory model loaded');
      
    } catch (modelError: any) {
      console.error('❌ Model import error:', modelError);
      return NextResponse.json({
        error: 'Model import error',
        step: 'model_imports',
        details: modelError.message,
        stack: modelError.stack
      }, { status: 500 });
    }
    
    // Step 4: Test basic query
    console.log('4. Testing basic complaint query...');
    try {
      const Complaint = require('@/models/Complaint').default;
      const count = await Complaint.countDocuments({});
      console.log(`✅ Found ${count} complaints in database`);
      
      // Try a simple find
      const complaints = await Complaint.find({}).limit(1);
      console.log(`✅ Successfully queried complaints: ${complaints.length} returned`);
      
    } catch (queryError: any) {
      console.error('❌ Query error:', queryError);
      return NextResponse.json({
        error: 'Database query error',
        step: 'basic_query',
        details: queryError.message,
        stack: queryError.stack
      }, { status: 500 });
    }
    
    // Step 5: Test with user filtering
    console.log('5. Testing user-specific queries...');
    try {
      const Complaint = require('@/models/Complaint').default;
      const currentUser = session.user;
      
      let query: any = {};
      if (currentUser.role === 'client') {
        query.clientId = currentUser.id;
      } else if (currentUser.role === 'employee') {
        query.currentAssigneeId = currentUser.id;
      } else if (currentUser.role === 'manager') {
        query.department = currentUser.department;
      }
      
      console.log('Query for user:', JSON.stringify(query));
      const userComplaints = await Complaint.find(query).limit(5);
      console.log(`✅ Found ${userComplaints.length} complaints for user`);
      
    } catch (userQueryError: any) {
      console.error('❌ User query error:', userQueryError);
      return NextResponse.json({
        error: 'User query error',
        step: 'user_query',
        details: userQueryError.message,
        stack: userQueryError.stack
      }, { status: 500 });
    }
    
    console.log('=== ALL TESTS PASSED ===');
    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('=== TEST ENDPOINT ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Unexpected error in test endpoint',
      step: 'general_error',
      details: error.message,
      stack: error.stack,
      name: error.name
    }, { status: 500 });
  }
}

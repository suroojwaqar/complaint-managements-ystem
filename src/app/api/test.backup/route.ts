import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';

// Simple test endpoint to debug the basic functionality
export async function GET(request: NextRequest) {
  console.log('=== STARTING COMPLAINTS TEST ENDPOINT ===');
    
  // Step 1: Test database connection
  console.log('1. Testing database connection...');
  await dbConnect();
  console.log('✅ Database connected successfully');
    
  // Step 2: Skip authentication test
  console.log('2. Skipping authentication test...');
    
  // Step 3: Test each model import
  console.log('3. Testing model imports...');
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
    
  // Step 4: Test basic query
  console.log('4. Testing basic complaint query...');
  const count = await Complaint.countDocuments({});
  console.log(`✅ Found ${count} complaints in database`);
      
  // Try a simple find
  const complaints = await Complaint.find({}).limit(1);
  console.log(`✅ Successfully queried complaints: ${complaints.length} returned`);
    
  // Step 5: Skipping user-specific queries
  console.log('5. Skipping user-specific queries...');
    
  return NextResponse.json({
    success: true,
    message: 'All tests passed',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

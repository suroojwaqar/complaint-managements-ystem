// Debug complaint WhatsApp notifications
// Run with: node scripts/debug-complaint-notifications.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function debugComplaintNotifications() {
  try {
    console.log('=== DEBUGGING COMPLAINT WHATSAPP NOTIFICATIONS ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check environment variables
    console.log('1. ENVIRONMENT VARIABLES:');
    console.log('WAAPI_INSTANCE_ID:', process.env.WAAPI_INSTANCE_ID || 'NOT SET');
    console.log('WAAPI_API_KEY:', process.env.WAAPI_API_KEY ? 'SET' : 'NOT SET');
    console.log('WAAPI_BASE_URL:', process.env.WAAPI_BASE_URL || 'NOT SET');
    console.log('');
    
    // Check users with phone numbers
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      role: String,
      isActive: Boolean,
      department: mongoose.Schema.Types.ObjectId
    }));
    
    console.log('2. USERS WITH PHONE NUMBERS:');
    const usersWithPhones = await User.find({ 
      phone: { $exists: true, $ne: null, $ne: '' },
      isActive: true 
    }).select('name email phone role department');
    
    if (usersWithPhones.length === 0) {
      console.log('❌ NO USERS HAVE PHONE NUMBERS!');
      console.log('This is why you\'re not getting WhatsApp notifications.');
      console.log('Run: node scripts/add-test-phone-numbers.js');
      return;
    }
    
    usersWithPhones.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.phone}`);
    });
    console.log('');
    
    // Check recent complaints
    const Complaint = mongoose.model('Complaint', new mongoose.Schema({
      title: String,
      clientId: mongoose.Schema.Types.ObjectId,
      department: mongoose.Schema.Types.ObjectId,
      currentAssigneeId: mongoose.Schema.Types.ObjectId,
      status: String,
      createdAt: Date
    }));
    
    console.log('3. RECENT COMPLAINTS (Last 5):');
    const recentComplaints = await Complaint.find()
      .populate('clientId', 'name phone')
      .populate('currentAssigneeId', 'name phone')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (recentComplaints.length === 0) {
      console.log('❌ No complaints found in database');
      return;
    }
    
    recentComplaints.forEach((complaint, index) => {
      console.log(`${index + 1}. "${complaint.title}"`);
      console.log(`   Client: ${complaint.clientId?.name} (Phone: ${complaint.clientId?.phone || 'NO PHONE'})`);
      console.log(`   Assignee: ${complaint.currentAssigneeId?.name} (Phone: ${complaint.currentAssigneeId?.phone || 'NO PHONE'})`);
      console.log(`   Department: ${complaint.department?.name}`);
      console.log(`   Status: ${complaint.status}`);
      console.log(`   Created: ${complaint.createdAt}`);
      console.log('');
    });
    
    // Test WhatsApp API with actual user phone
    console.log('4. TESTING WHATSAPP API:');
    if (usersWithPhones.length > 0) {
      const testUser = usersWithPhones[0];
      console.log(`Testing with ${testUser.name}'s phone: ${testUser.phone}`);
      
      try {
        const response = await fetch(`${process.env.WAAPI_BASE_URL}/instances/${process.env.WAAPI_INSTANCE_ID}/client/action/send-message`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${process.env.WAAPI_API_KEY}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            chatId: testUser.phone.replace(/\D/g, '').startsWith('92') ? testUser.phone.replace(/\D/g, '') + '@c.us' : '92' + testUser.phone.replace(/\D/g, '') + '@c.us',
            message: 'TEST: Debugging complaint notifications system'
          })
        });
        
        console.log('API Response Status:', response.status, response.statusText);
        const result = await response.text();
        console.log('API Response Body:', result);
        
        if (response.ok) {
          console.log('✅ WhatsApp API is working!');
        } else {
          console.log('❌ WhatsApp API failed');
        }
      } catch (error) {
        console.log('❌ WhatsApp API error:', error.message);
      }
    }
    
    console.log('\n=== ANALYSIS ===');
    console.log('For WhatsApp notifications to work when creating complaints:');
    console.log('1. ✅ Environment variables must be set');
    console.log('2. ✅ Users must have phone numbers');
    console.log('3. ✅ WhatsApp API must be working');
    console.log('4. ✅ Server logs should show "Sending WhatsApp notifications..."');
    console.log('\nCheck your server console when creating a complaint!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugComplaintNotifications();
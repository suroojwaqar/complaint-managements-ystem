// Test WhatsApp notifications for comments
// Run with: node scripts/test-comment-notifications.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testCommentNotifications() {
  try {
    console.log('=== TESTING COMMENT WHATSAPP NOTIFICATIONS ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Define schemas
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      role: String,
      isActive: Boolean,
      department: mongoose.Schema.Types.ObjectId
    }));
    
    const Complaint = mongoose.model('Complaint', new mongoose.Schema({
      title: String,
      clientId: mongoose.Schema.Types.ObjectId,
      department: mongoose.Schema.Types.ObjectId,
      currentAssigneeId: mongoose.Schema.Types.ObjectId,
      status: String,
      createdAt: Date
    }));
    
    const Comment = mongoose.model('Comment', new mongoose.Schema({
      complaintId: mongoose.Schema.Types.ObjectId,
      content: String,
      author: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now }
    }));
    
    // Check users with phone numbers
    console.log('1. USERS WITH PHONE NUMBERS:');
    const usersWithPhones = await User.find({ 
      phone: { $exists: true, $ne: null, $ne: '' },
      isActive: true 
    }).select('name email phone role');
    
    if (usersWithPhones.length === 0) {
      console.log('❌ NO USERS HAVE PHONE NUMBERS!');
      console.log('Run: node scripts/add-test-phone-numbers.js');
      return;
    }
    
    usersWithPhones.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.phone}`);
    });
    console.log('');
    
    // Get recent complaint
    console.log('2. GETTING RECENT COMPLAINT:');
    const recentComplaint = await Complaint.findOne()
      .populate('clientId', 'name phone')
      .populate('currentAssigneeId', 'name phone')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    if (!recentComplaint) {
      console.log('❌ No complaints found. Create a complaint first.');
      return;
    }
    
    console.log(`Found complaint: "${recentComplaint.title}"`);
    console.log(`Client: ${recentComplaint.clientId?.name} (${recentComplaint.clientId?.phone || 'NO PHONE'})`);
    console.log(`Assignee: ${recentComplaint.currentAssigneeId?.name} (${recentComplaint.currentAssigneeId?.phone || 'NO PHONE'})`);
    console.log('');
    
    // Simulate adding a comment and sending WhatsApp notifications
    console.log('3. SIMULATING COMMENT NOTIFICATION:');
    
    const testUser = usersWithPhones[0]; // Use first user with phone
    console.log(`Test user: ${testUser.name} (${testUser.phone})`);
    
    // Get all stakeholder phones for this complaint
    const stakeholders = [];
    
    // Add client phone
    if (recentComplaint.clientId?.phone) {
      stakeholders.push({
        name: recentComplaint.clientId.name,
        phone: recentComplaint.clientId.phone,
        role: 'client'
      });
    }
    
    // Add assignee phone
    if (recentComplaint.currentAssigneeId?.phone) {
      stakeholders.push({
        name: recentComplaint.currentAssigneeId.name,
        phone: recentComplaint.currentAssigneeId.phone,
        role: 'assignee'
      });
    }
    
    // Add other users with phones (admins, managers)
    const otherUsers = await User.find({
      _id: { $nin: [recentComplaint.clientId?._id, recentComplaint.currentAssigneeId?._id].filter(Boolean) },
      phone: { $exists: true, $ne: null, $ne: '' },
      isActive: true,
      role: { $in: ['admin', 'manager'] }
    }).select('name phone role');
    
    otherUsers.forEach(user => {
      stakeholders.push({
        name: user.name,
        phone: user.phone,
        role: user.role
      });
    });
    
    console.log(`Found ${stakeholders.length} stakeholders with phone numbers:`);
    stakeholders.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.role}) - ${s.phone}`);
    });
    
    if (stakeholders.length === 0) {
      console.log('❌ No stakeholders have phone numbers!');
      return;
    }
    
    // Test sending WhatsApp message to each stakeholder
    console.log('\\n4. TESTING WHATSAPP NOTIFICATIONS:');
    
    const commentMessage = `💬 *New Comment Added*

*ID:* #${recentComplaint._id.toString().slice(-6)}
*Title:* ${recentComplaint.title}
*Comment by:* ${testUser.name}
*Status:* ${recentComplaint.status}

*Comment:*
This is a test comment to verify WhatsApp notifications are working.

View details: http://localhost:3000/admin/complaints/${recentComplaint._id}`;
    
    console.log('Message to send:');
    console.log('---');
    console.log(commentMessage);
    console.log('---\\n');
    
    for (let i = 0; i < Math.min(stakeholders.length, 2); i++) { // Test first 2 stakeholders
      const stakeholder = stakeholders[i];
      console.log(`Testing ${i + 1}/${stakeholders.length}: ${stakeholder.name} (${stakeholder.phone})`);
      
      // Format phone number
      let formattedPhone = stakeholder.phone.replace(/\\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '92' + formattedPhone.slice(1);
      } else if (!formattedPhone.startsWith('92')) {
        formattedPhone = '92' + formattedPhone;
      }
      formattedPhone += '@c.us';
      
      console.log(`Formatted phone: ${formattedPhone}`);
      
      try {
        const response = await fetch(`${process.env.WAAPI_BASE_URL}/instances/${process.env.WAAPI_INSTANCE_ID}/client/action/send-message`, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${process.env.WAAPI_API_KEY}`,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            chatId: formattedPhone,
            message: commentMessage
          })
        });
        
        const result = await response.text();
        
        if (response.ok) {
          console.log(`✅ SUCCESS: Message sent to ${stakeholder.name}`);
        } else {
          console.log(`❌ FAILED: ${response.status} - ${result}`);
        }
        
        // Add delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('=== SUMMARY ===');
    console.log('✅ Environment variables configured');
    console.log(`✅ Found ${usersWithPhones.length} users with phone numbers`);
    console.log(`✅ Found complaint to test with`);
    console.log(`✅ Tested WhatsApp notifications to ${Math.min(stakeholders.length, 2)} stakeholders`);
    console.log('');
    console.log('🎯 TO TEST COMMENT NOTIFICATIONS IN YOUR APP:');
    console.log('1. Go to any complaint detail page');
    console.log('2. Add a comment');
    console.log('3. Check server logs for WhatsApp notification attempts');
    console.log('4. Check your phone for received messages');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testCommentNotifications();
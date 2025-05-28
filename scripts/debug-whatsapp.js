// Run with: node scripts/debug-whatsapp.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function debugWhatsApp() {
  try {
    // Check environment variables
    console.log('=== ENVIRONMENT VARIABLES ===');
    console.log('WAAPI_INSTANCE_ID:', process.env.WAAPI_INSTANCE_ID || 'NOT SET');
    console.log('WAAPI_API_KEY:', process.env.WAAPI_API_KEY ? 'SET (hidden)' : 'NOT SET');
    console.log('WAAPI_BASE_URL:', process.env.WAAPI_BASE_URL || 'NOT SET');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n=== DATABASE CONNECTION ===');
    console.log('Connected to MongoDB successfully');
    
    // Check users with phone numbers
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      role: String,
      isActive: Boolean
    }));
    
    const usersWithPhones = await User.find({ 
      phone: { $exists: true, $ne: null, $ne: '' },
      isActive: true 
    }).select('name email phone role');
    
    console.log('\n=== USERS WITH PHONE NUMBERS ===');
    console.log(`Found ${usersWithPhones.length} users with phone numbers:`);
    usersWithPhones.forEach(user => {
      console.log(`- ${user.name} (${user.role}): ${user.phone}`);
    });
    
    if (usersWithPhones.length === 0) {
      console.log('❌ NO USERS HAVE PHONE NUMBERS! Add phone numbers to users.');
    }
    
    // Test WhatsApp API connection
    console.log('\n=== TESTING WHATSAPP API ===');
    
    if (!process.env.WAAPI_INSTANCE_ID || !process.env.WAAPI_API_KEY) {
      console.log('❌ WAAPI credentials not configured');
      console.log('Set WAAPI_INSTANCE_ID and WAAPI_API_KEY in .env.local');
      return;
    }
    
    const response = await fetch(`${process.env.WAAPI_BASE_URL}/instances/${process.env.WAAPI_INSTANCE_ID}/client/action/is-connected`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.WAAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ WhatsApp API connection successful');
      console.log('Connection status:', result.connected ? 'Connected' : 'Disconnected');
    } else {
      console.log('❌ WhatsApp API connection failed');
      console.log('Status:', response.status);
      console.log('Error:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugWhatsApp();
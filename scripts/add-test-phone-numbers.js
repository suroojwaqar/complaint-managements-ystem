// Add test phone numbers to users
// Run with: node scripts/add-test-phone-numbers.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function addTestPhoneNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      role: String,
      isActive: Boolean
    }));
    
    // Get all active users
    const users = await User.find({ isActive: true }).select('name email role phone');
    console.log(`\\n📋 Found ${users.length} active users:`);
    
    // Show current users
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.email} - Phone: ${user.phone || 'NOT SET'}`);
    });
    
    // Add phone numbers to users who don't have them
    const testPhoneNumbers = [
      '923001234567', // Admin
      '923009876543', // Manager 1
      '923005555555', // Manager 2
      '923007777777', // Employee 1
      '923008888888', // Employee 2
      '923343867280', // Your working test number
      '923001111111', // Client 1
      '923002222222', // Client 2
    ];
    
    let phoneIndex = 0;
    let updated = 0;
    
    for (const user of users) {
      if (!user.phone && phoneIndex < testPhoneNumbers.length) {
        const newPhone = testPhoneNumbers[phoneIndex];
        await User.updateOne(
          { _id: user._id },
          { $set: { phone: newPhone } }
        );
        console.log(`📱 Added phone ${newPhone} to ${user.name} (${user.role})`);
        updated++;
        phoneIndex++;
      }
    }
    
    console.log(`\\n✅ Updated ${updated} users with phone numbers`);
    
    // Show final state
    const updatedUsers = await User.find({ 
      isActive: true,
      phone: { $exists: true, $ne: null, $ne: '' }
    }).select('name email role phone');
    
    console.log(`\\n📱 Users with phone numbers (${updatedUsers.length}):`);
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role}) - ${user.phone}`);
    });
    
    if (updatedUsers.length === 0) {
      console.log('⚠️  No users have phone numbers! WhatsApp notifications won\\'t work.');
    } else {
      console.log(`\\n🎉 Ready for WhatsApp notifications!`);
      console.log('Create a new complaint to test automatic notifications.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addTestPhoneNumbers();
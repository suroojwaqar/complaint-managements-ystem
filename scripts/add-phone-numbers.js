// Run with: node scripts/add-phone-numbers.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function addPhoneNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      role: String,
      isActive: Boolean
    }));
    
    // Add phone numbers to specific users (replace with your actual user emails and phone numbers)
    const updates = [
      { email: 'admin@example.com', phone: '923001234567' }, // Pakistani format: 92 + 10 digits
      { email: 'manager@example.com', phone: '923009876543' },
      { email: 'employee@example.com', phone: '923005555555' },
      // Add more users as needed with their actual emails
    ];
    
    console.log('=== ADDING PHONE NUMBERS ===');
    for (const update of updates) {
      const result = await User.updateOne(
        { email: update.email },
        { $set: { phone: update.phone } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated phone for ${update.email}: ${update.phone}`);
      } else {
        console.log(`❌ User not found: ${update.email}`);
      }
    }
    
    // Show all users with phones
    const usersWithPhones = await User.find({ 
      phone: { $exists: true, $ne: null, $ne: '' } 
    }).select('name email phone role');
    
    console.log('\n=== ALL USERS WITH PHONE NUMBERS ===');
    usersWithPhones.forEach(user => {
      console.log(`${user.name} (${user.role}): ${user.phone}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addPhoneNumbers();
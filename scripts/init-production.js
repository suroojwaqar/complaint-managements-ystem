/**
 * Production Database Initialization Script
 * Creates only the essential admin user for production deployment
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^"(.+)"$/, '$1');
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

// Load environment variables
loadEnvFile();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set in .env.local');
  process.exit(1);
}

// User Schema (simplified for production)
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password should be at least 6 characters long'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['client', 'employee', 'manager', 'admin'],
      default: 'client',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      system: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', UserSchema);

async function initializeProduction() {
  try {
    console.log('🚀 Initializing production database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists in the system');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log('⚠️  Use existing admin credentials to login');
      await mongoose.disconnect();
      return;
    }

    // Prompt for admin details (or use defaults for production)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourcompany.com';
    const adminPassword = process.env.ADMIN_PASSWORD || generateSecurePassword();
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    console.log('👤 Creating system administrator...');
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'admin',
      isActive: true,
    });

    await adminUser.save();
    
    console.log('✅ System administrator created successfully!');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log('=====================');
    console.log(`📧 Email: ${adminEmail}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`🔑 Password: ${adminPassword}`);
      console.log('');
      console.log('⚠️  IMPORTANT SECURITY NOTICE:');
      console.log('   - Save these credentials securely');
      console.log('   - Change the password after first login');
      console.log('   - Set ADMIN_EMAIL and ADMIN_PASSWORD in environment variables for production');
    } else {
      console.log('🔑 Password: [Set via environment variable]');
    }
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Start your application: npm run dev');
    console.log('2. Navigate to: http://localhost:3000');
    console.log('3. Login with the admin credentials above');
    console.log('4. Create departments and users through the admin interface');
    console.log('5. Configure system settings as needed');
    
  } catch (error) {
    console.error('❌ Error initializing production database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Generate a secure random password
function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the initialization
initializeProduction();

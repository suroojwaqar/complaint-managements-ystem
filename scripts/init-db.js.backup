/**
 * Simple initialization script without external dependencies
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
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
  console.error('MONGODB_URI environment variable is not set in .env.local');
  process.exit(1);
}

// User Schema
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
      required: function() {
        return this.role !== 'client' && this.role !== 'admin';
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Department Schema
const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Department manager is required'],
    },
    defaultAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Default assignee is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      console.log('Email: admin@company.com');
      console.log('⚠️  Use existing admin credentials to login');
      await mongoose.disconnect();
      return;
    }

    // Create default admin user
    console.log('Creating default admin user...');
    const adminPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      email: 'admin@company.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      isActive: true,
    });

    await adminUser.save();
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: admin@company.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

    // Create sample data
    console.log('\nCreating sample data...');
    await createSampleData();

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Login with admin credentials');
    console.log('4. Change default passwords immediately!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

async function createSampleData() {
  try {
    const salt = await bcrypt.genSalt(10);

    // Step 1: Create temporary manager and employee without department (we'll add it later)
    console.log('Creating temporary users...');
    
    // Create manager without department first
    const tempManager = new User({
      email: 'temp_manager@company.com',
      password: await bcrypt.hash('temp123', salt),
      name: 'Temp Manager',
      role: 'admin', // Temporarily set as admin to bypass department requirement
      isActive: true,
    });
    await tempManager.save();

    // Create employee without department first  
    const tempEmployee = new User({
      email: 'temp_employee@company.com',
      password: await bcrypt.hash('temp123', salt),
      name: 'Temp Employee',
      role: 'admin', // Temporarily set as admin to bypass department requirement
      isActive: true,
    });
    await tempEmployee.save();

    // Step 2: Create department with the temporary users
    console.log('Creating IT Support department...');
    const itDepartment = new Department({
      name: 'IT Support',
      description: 'Information Technology Support Department',
      managerId: tempManager._id,
      defaultAssigneeId: tempEmployee._id,
      isActive: true,
    });
    await itDepartment.save();

    // Step 3: Update the temporary users with correct roles and department
    console.log('Updating user roles and departments...');
    await User.findByIdAndUpdate(tempManager._id, {
      email: 'manager@company.com',
      password: await bcrypt.hash('manager123', salt),
      name: 'John Manager',
      role: 'manager',
      department: itDepartment._id
    });

    await User.findByIdAndUpdate(tempEmployee._id, {
      email: 'employee@company.com',
      password: await bcrypt.hash('employee123', salt),
      name: 'Jane Employee',
      role: 'employee',
      department: itDepartment._id
    });

    // Step 4: Create client (no department required)
    console.log('Creating client user...');
    const client = new User({
      email: 'client@company.com',
      password: await bcrypt.hash('client123', salt),
      name: 'Bob Client',
      role: 'client',
      isActive: true,
    });
    await client.save();

    console.log('✅ Sample data created successfully!');
    console.log('👤 Users created:');
    console.log('   Admin:    admin@company.com    / admin123');
    console.log('   Manager:  manager@company.com  / manager123');
    console.log('   Employee: employee@company.com / employee123');
    console.log('   Client:   client@company.com   / client123');
    console.log('🏢 Department: IT Support');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

// Run the initialization
initializeDatabase();

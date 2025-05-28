/**
 * Demo data creation script
 * This script will create users for all roles, departments, and sample complaints
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

// Schemas
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['client', 'employee', 'manager', 'admin'], default: 'client', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    defaultAssigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ComplaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    errorType: { type: String, required: true, trim: true },
    errorScreen: { type: String, required: true, trim: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['New', 'Assigned', 'In Progress', 'Completed', 'Done', 'Closed'], default: 'New', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    currentAssigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    firstAssigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ filename: String, originalName: String, mimeType: String, size: Number, url: String }],
  },
  { timestamps: true }
);

const ComplaintHistorySchema = new mongoose.Schema(
  {
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
    status: { type: String, required: true },
    assignedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const User = mongoose.model('User', UserSchema);
const Department = mongoose.model('Department', DepartmentSchema);
const Complaint = mongoose.model('Complaint', ComplaintSchema);
const ComplaintHistory = mongoose.model('ComplaintHistory', ComplaintHistorySchema);

async function createDemoData() {
  try {
    console.log('🚀 Starting demo data creation...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);

    // 1. Create Additional Users
    console.log('\n👥 Creating users for all roles...');
    
    const usersToCreate = [
      // Additional Admins
      { name: 'Sarah Admin', email: 'sarah.admin@company.com', role: 'admin', password: 'admin123' },
      
      // Managers for different departments
      { name: 'David IT Manager', email: 'david.manager@company.com', role: 'manager', password: 'manager123' },
      { name: 'Lisa HR Manager', email: 'lisa.manager@company.com', role: 'manager', password: 'manager123' },
      { name: 'Mike Sales Manager', email: 'mike.manager@company.com', role: 'manager', password: 'manager123' },
      { name: 'Anna Finance Manager', email: 'anna.manager@company.com', role: 'manager', password: 'manager123' },
      
      // Employees for different departments
      { name: 'Tom IT Employee', email: 'tom.employee@company.com', role: 'employee', password: 'employee123' },
      { name: 'Emma IT Employee', email: 'emma.employee@company.com', role: 'employee', password: 'employee123' },
      { name: 'James HR Employee', email: 'james.employee@company.com', role: 'employee', password: 'employee123' },
      { name: 'Sophie Sales Employee', email: 'sophie.employee@company.com', role: 'employee', password: 'employee123' },
      { name: 'Alex Finance Employee', email: 'alex.employee@company.com', role: 'employee', password: 'employee123' },
      
      // Clients
      { name: 'John Client', email: 'john.client@company.com', role: 'client', password: 'client123' },
      { name: 'Maria Client', email: 'maria.client@company.com', role: 'client', password: 'client123' },
      { name: 'Robert Client', email: 'robert.client@company.com', role: 'client', password: 'client123' },
      { name: 'Jennifer Client', email: 'jennifer.client@company.com', role: 'client', password: 'client123' },
      { name: 'William Client', email: 'william.client@company.com', role: 'client', password: 'client123' }
    ];

    const createdUsers = {};

    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`  ⚠️  User ${userData.email} already exists, skipping...`);
          createdUsers[userData.email] = existingUser;
          continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, salt);
        const user = await User.create({
          ...userData,
          password: hashedPassword
        });
        
        createdUsers[userData.email] = user;
        console.log(`  ✅ Created ${userData.role}: ${userData.name} (${userData.email})`);
      } catch (error) {
        console.log(`  ❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    // 2. Create Departments
    console.log('\n🏢 Creating departments...');
    
    const departmentsToCreate = [
      {
        name: 'Human Resources',
        description: 'Employee relations, recruitment, and HR policies',
        managerEmail: 'lisa.manager@company.com',
        defaultAssigneeEmail: 'james.employee@company.com'
      },
      {
        name: 'Sales & Marketing',
        description: 'Sales operations, marketing campaigns, and customer acquisition',
        managerEmail: 'mike.manager@company.com',
        defaultAssigneeEmail: 'sophie.employee@company.com'
      },
      {
        name: 'Finance & Accounting',
        description: 'Financial management, accounting, and budget planning',
        managerEmail: 'anna.manager@company.com',
        defaultAssigneeEmail: 'alex.employee@company.com'
      },
      {
        name: 'Technical Support',
        description: 'Advanced technical support and system maintenance',
        managerEmail: 'david.manager@company.com',
        defaultAssigneeEmail: 'tom.employee@company.com'
      }
    ];

    const createdDepartments = {};

    for (const deptData of departmentsToCreate) {
      try {
        // Check if department already exists
        const existingDept = await Department.findOne({ name: deptData.name });
        if (existingDept) {
          console.log(`  ⚠️  Department ${deptData.name} already exists, skipping...`);
          createdDepartments[deptData.name] = existingDept;
          continue;
        }

        const manager = createdUsers[deptData.managerEmail];
        const defaultAssignee = createdUsers[deptData.defaultAssigneeEmail];

        if (!manager || !defaultAssignee) {
          console.log(`  ❌ Cannot create ${deptData.name}: Missing manager or assignee`);
          continue;
        }

        const department = await Department.create({
          name: deptData.name,
          description: deptData.description,
          managerId: manager._id,
          defaultAssigneeId: defaultAssignee._id
        });

        // Update users with department
        await User.findByIdAndUpdate(manager._id, { department: department._id });
        await User.findByIdAndUpdate(defaultAssignee._id, { department: department._id });

        createdDepartments[deptData.name] = department;
        console.log(`  ✅ Created department: ${deptData.name}`);
      } catch (error) {
        console.log(`  ❌ Failed to create department ${deptData.name}:`, error.message);
      }
    }

    // Also update existing IT Support department users
    const itDepartment = await Department.findOne({ name: 'IT Support' });
    if (itDepartment) {
      const itEmployees = [
        createdUsers['emma.employee@company.com']
      ].filter(Boolean);

      for (const employee of itEmployees) {
        await User.findByIdAndUpdate(employee._id, { department: itDepartment._id });
      }
      createdDepartments['IT Support'] = itDepartment;
    }

    // 3. Create Sample Complaints
    console.log('\n📝 Creating sample complaints...');
    
    const complaintsToCreate = [
      {
        title: 'Login System Not Working',
        description: 'I cannot log into the system. Getting error "Invalid credentials" even with correct password.',
        errorType: 'Authentication Error',
        errorScreen: 'Login Page',
        clientEmail: 'john.client@company.com',
        departmentName: 'IT Support',
        status: 'New'
      },
      {
        title: 'Payment Gateway Timeout',
        description: 'Customer payments are failing due to gateway timeouts during checkout process.',
        errorType: 'Payment Processing Error',
        errorScreen: 'Checkout Page',
        clientEmail: 'maria.client@company.com',
        departmentName: 'Technical Support',
        status: 'Assigned'
      },
      {
        title: 'HR Portal Access Issues',
        description: 'Cannot access employee benefits section in HR portal. Page shows 404 error.',
        errorType: 'Page Not Found',
        errorScreen: 'HR Benefits Page',
        clientEmail: 'robert.client@company.com',
        departmentName: 'Human Resources',
        status: 'In Progress'
      },
      {
        title: 'Sales Report Generation Failed',
        description: 'Monthly sales reports are not generating. System shows "Report generation failed" error.',
        errorType: 'Report Generation Error',
        errorScreen: 'Sales Dashboard',
        clientEmail: 'jennifer.client@company.com',
        departmentName: 'Sales & Marketing',
        status: 'Completed'
      },
      {
        title: 'Invoice Processing Delay',
        description: 'Automatic invoice processing is delayed by 24+ hours. Affecting customer billing.',
        errorType: 'Processing Delay',
        errorScreen: 'Invoice Management',
        clientEmail: 'william.client@company.com',
        departmentName: 'Finance & Accounting',
        status: 'Done'
      },
      {
        title: 'Email Notifications Not Sent',
        description: 'Order confirmation emails are not being sent to customers after purchase.',
        errorType: 'Email Service Error',
        errorScreen: 'Order Confirmation',
        clientEmail: 'john.client@company.com',
        departmentName: 'IT Support',
        status: 'Closed'
      },
      {
        title: 'Database Connection Timeouts',
        description: 'Intermittent database connection timeouts causing application crashes.',
        errorType: 'Database Error',
        errorScreen: 'Various Pages',
        clientEmail: 'maria.client@company.com',
        departmentName: 'Technical Support',
        status: 'In Progress'
      },
      {
        title: 'Employee Directory Not Loading',
        description: 'Company employee directory page is not loading. Spinner shows indefinitely.',
        errorType: 'Loading Error',
        errorScreen: 'Employee Directory',
        clientEmail: 'robert.client@company.com',
        departmentName: 'Human Resources',
        status: 'New'
      }
    ];

    const createdComplaints = [];

    for (const complaintData of complaintsToCreate) {
      try {
        const client = createdUsers[complaintData.clientEmail];
        const department = createdDepartments[complaintData.departmentName];

        if (!client || !department) {
          console.log(`  ❌ Cannot create complaint "${complaintData.title}": Missing client or department`);
          continue;
        }

        const complaint = await Complaint.create({
          title: complaintData.title,
          description: complaintData.description,
          errorType: complaintData.errorType,
          errorScreen: complaintData.errorScreen,
          clientId: client._id,
          status: complaintData.status,
          department: department._id,
          currentAssigneeId: department.defaultAssigneeId,
          firstAssigneeId: department.defaultAssigneeId
        });

        // Create complaint history
        await ComplaintHistory.create({
          complaintId: complaint._id,
          status: complaintData.status,
          assignedTo: department.defaultAssigneeId,
          notes: `Complaint created and assigned to default assignee. Status: ${complaintData.status}`,
          timestamp: new Date()
        });

        createdComplaints.push(complaint);
        console.log(`  ✅ Created complaint: ${complaintData.title} (${complaintData.status})`);
      } catch (error) {
        console.log(`  ❌ Failed to create complaint "${complaintData.title}":`, error.message);
      }
    }

    // 4. Summary
    console.log('\n📊 Demo Data Creation Summary:');
    console.log('===============================');
    
    const allUsers = await User.find({});
    const allDepartments = await Department.find({});
    const allComplaints = await Complaint.find({});
    
    console.log(`👤 Total Users: ${allUsers.length}`);
    console.log(`   - Admins: ${allUsers.filter(u => u.role === 'admin').length}`);
    console.log(`   - Managers: ${allUsers.filter(u => u.role === 'manager').length}`);
    console.log(`   - Employees: ${allUsers.filter(u => u.role === 'employee').length}`);
    console.log(`   - Clients: ${allUsers.filter(u => u.role === 'client').length}`);
    
    console.log(`\n🏢 Total Departments: ${allDepartments.length}`);
    allDepartments.forEach(dept => {
      console.log(`   - ${dept.name}`);
    });
    
    console.log(`\n📝 Total Complaints: ${allComplaints.length}`);
    const statusCounts = {};
    allComplaints.forEach(complaint => {
      statusCounts[complaint.status] = (statusCounts[complaint.status] || 0) + 1;
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    // 5. Login Credentials
    console.log('\n🔑 Login Credentials:');
    console.log('=====================');
    console.log('📧 All passwords are the same as role + "123"');
    console.log('\n🔴 Admins:');
    console.log('   admin@company.com / admin123');
    console.log('   sarah.admin@company.com / admin123');
    
    console.log('\n🔵 Managers:');
    console.log('   manager@company.com / manager123 (IT Support)');
    console.log('   david.manager@company.com / manager123 (Technical Support)');
    console.log('   lisa.manager@company.com / manager123 (Human Resources)');
    console.log('   mike.manager@company.com / manager123 (Sales & Marketing)');
    console.log('   anna.manager@company.com / manager123 (Finance & Accounting)');
    
    console.log('\n🟢 Employees:');
    console.log('   employee@company.com / employee123 (IT Support)');
    console.log('   tom.employee@company.com / employee123 (Technical Support)');
    console.log('   emma.employee@company.com / employee123 (IT Support)');
    console.log('   james.employee@company.com / employee123 (Human Resources)');
    console.log('   sophie.employee@company.com / employee123 (Sales & Marketing)');
    console.log('   alex.employee@company.com / employee123 (Finance & Accounting)');
    
    console.log('\n🟣 Clients:');
    console.log('   client@company.com / client123');
    console.log('   john.client@company.com / client123');
    console.log('   maria.client@company.com / client123');
    console.log('   robert.client@company.com / client123');
    console.log('   jennifer.client@company.com / client123');
    console.log('   william.client@company.com / client123');

    console.log('\n✅ Demo data creation completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Login with any of the credentials above');
    console.log('4. Explore different role dashboards and functionality');
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the demo data creation
createDemoData();

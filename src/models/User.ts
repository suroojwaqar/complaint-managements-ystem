import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'client' | 'employee' | 'manager' | 'admin';
  department?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  findActive(): mongoose.Query<IUser[], IUser>;
  findByRole(role: string): mongoose.Query<IUser[], IUser>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please enter a valid email address'
      }
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
      minlength: [2, 'Name should be at least 2 characters long'],
      maxlength: [100, 'Name should not exceed 100 characters']
    },
    role: {
      type: String,
      enum: {
        values: ['client', 'employee', 'manager', 'admin'],
        message: 'Role must be one of: client, employee, manager, admin'
      },
      default: 'client',
      required: [true, 'Role is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      validate: {
        validator: function(departmentId: mongoose.Types.ObjectId) {
          // If department is null/undefined, check if it's required
          if (!departmentId) {
            return this.role === 'client' || this.role === 'admin';
          }
          return true; // If department is provided, it will be validated in the API
        },
        message: 'Department is required for employees and managers'
      }
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

// Create compound index for better performance
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1, department: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  try {
    // Only hash password if it has been modified (or is new)
    if (!this.isModified('password')) {
      return next();
    }
    
    // Validate password length
    if (this.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Validate department requirement before save
UserSchema.pre('save', function(next) {
  // Check if department is required for this role
  if ((this.role === 'employee' || this.role === 'manager') && !this.department) {
    return next(new Error('Department is required for employees and managers'));
  }
  
  // Clear department for roles that don't need it
  if ((this.role === 'client' || this.role === 'admin') && this.department) {
    this.department = undefined;
  }
  
  next();
});

// Pre-update middleware for findOneAndUpdate operations
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate() as any;
  
  // If role is being updated, check department requirements
  if (update.$set && update.$set.role) {
    const newRole = update.$set.role;
    const newDepartment = update.$set.department;
    
    // If role requires department but none provided
    if ((newRole === 'employee' || newRole === 'manager') && !newDepartment) {
      return next(new Error('Department is required for employees and managers'));
    }
    
    // Clear department for roles that don't need it
    if ((newRole === 'client' || newRole === 'admin')) {
      if (update.$set) {
        update.$set.department = null;
      } else {
        update.$set = { department: null };
      }
    }
  }
  
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    if (!candidatePassword || !this.password) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Static method to find active users
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find users by role
UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

// Transform output to remove sensitive data
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Handle unique constraint errors
UserSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.keyPattern && error.keyPattern.email) {
      next(new Error('Email address is already registered'));
    } else {
      next(new Error('Duplicate key error'));
    }
  } else {
    next(error);
  }
});

UserSchema.post(['findOneAndUpdate', 'updateOne', 'updateMany'], function(error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.keyPattern && error.keyPattern.email) {
      next(new Error('Email address is already registered'));
    } else {
      next(new Error('Duplicate key error'));
    }
  } else {
    next(error);
  }
});

// Delete the User model if it's already defined (for development hot reloading)
delete mongoose.models.User;

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;

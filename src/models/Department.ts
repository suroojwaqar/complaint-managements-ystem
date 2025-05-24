import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  managerId: mongoose.Types.ObjectId;
  defaultAssigneeId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Department manager is required'],
    },
    defaultAssigneeId: {
      type: Schema.Types.ObjectId,
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

const Department = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;

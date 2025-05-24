import mongoose, { Schema, Document } from 'mongoose';

interface IAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface IComplaint extends Document {
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  natureType: mongoose.Types.ObjectId;
  remark?: string;
  clientId: mongoose.Types.ObjectId;
  status: 'New' | 'Assigned' | 'In Progress' | 'Completed' | 'Done' | 'Closed';
  department: mongoose.Types.ObjectId;
  currentAssigneeId: mongoose.Types.ObjectId;
  firstAssigneeId: mongoose.Types.ObjectId;
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const ComplaintSchema = new Schema<IComplaint>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    errorType: {
      type: String,
      required: [true, 'Error type is required'],
      trim: true,
    },
    errorScreen: {
      type: String,
      required: [true, 'Error screen is required'],
      trim: true,
    },
    natureType: {
      type: Schema.Types.ObjectId,
      ref: 'NatureType',
      required: [true, 'Nature type is required'],
    },
    remark: {
      type: String,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    status: {
      type: String,
      enum: ['New', 'Assigned', 'In Progress', 'Completed', 'Done', 'Closed'],
      default: 'New',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    currentAssigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Current assignee is required'],
    },
    firstAssigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'First assignee is required'],
    },
    attachments: [AttachmentSchema],
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ clientId: 1 });
ComplaintSchema.index({ department: 1 });
ComplaintSchema.index({ currentAssigneeId: 1 });
ComplaintSchema.index({ natureType: 1 });

// Force delete any cached model and recreate
if (mongoose.models.Complaint) {
  delete mongoose.models.Complaint;
}

const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);

export default Complaint;

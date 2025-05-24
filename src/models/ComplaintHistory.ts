import mongoose, { Schema, Document } from 'mongoose';

export interface IComplaintHistory extends Document {
  complaintId: mongoose.Types.ObjectId;
  status: string;
  assignedFrom: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  notes: string;
  timestamp: Date;
}

const ComplaintHistorySchema = new Schema<IComplaintHistory>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
    },
    assignedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Create index for faster queries
ComplaintHistorySchema.index({ complaintId: 1 });

const ComplaintHistory = mongoose.models.ComplaintHistory || mongoose.model<IComplaintHistory>('ComplaintHistory', ComplaintHistorySchema);

export default ComplaintHistory;

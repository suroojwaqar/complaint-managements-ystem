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

interface IReaction {
  userId: mongoose.Types.ObjectId;
  type: 'like' | 'helpful' | 'resolved';
  createdAt: Date;
}

export interface IComment extends Document {
  complaintId: mongoose.Types.ObjectId;
  content: string;
  author: mongoose.Types.ObjectId;
  attachments: IAttachment[];
  reactions: IReaction[];
  isInternal: boolean;
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

const ReactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['like', 'helpful', 'resolved'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CommentSchema = new Schema<IComment>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    attachments: [AttachmentSchema],
    reactions: [ReactionSchema],
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
CommentSchema.index({ complaintId: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });
CommentSchema.index({ 'reactions.userId': 1 });

// Ensure a user can only have one reaction per comment
CommentSchema.index(
  { _id: 1, 'reactions.userId': 1 },
  { unique: true, sparse: true }
);

// Export model with proper handling for serverless
const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;

import mongoose, { Schema, Document } from 'mongoose';

export interface INatureType extends Document {
  name: string;
  description: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NatureTypeSchema = new Schema<INatureType>(
  {
    name: {
      type: String,
      required: [true, 'Nature type name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
NatureTypeSchema.index({ isActive: 1 });
NatureTypeSchema.index({ name: 1 });

const NatureType = mongoose.models.NatureType || mongoose.model<INatureType>('NatureType', NatureTypeSchema);

export default NatureType;

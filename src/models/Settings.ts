import mongoose, { Schema, Document } from 'mongoose';

interface ISettings extends Document {
  type: 'system' | 'whatsapp' | 'email';
  autoRouting: {
    enabled: boolean;
    departments: mongoose.Types.ObjectId[];
  };
  defaultDepartment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  type: {
    type: String,
    required: true,
    enum: ['system', 'whatsapp', 'email'],
    unique: true
  },
  autoRouting: {
    enabled: {
      type: Boolean,
      default: false
    },
    departments: [{
      type: Schema.Types.ObjectId,
      ref: 'Department'
    }]
  },
  defaultDepartment: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  }
}, {
  timestamps: true
});

// Ensure we have a default system settings record
SettingsSchema.statics.ensureSystemSettings = async function() {
  const systemSettings = await this.findOne({ type: 'system' });
  if (!systemSettings) {
    await this.create({
      type: 'system',
      autoRouting: {
        enabled: false,
        departments: []
      }
    });
  }
};

const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

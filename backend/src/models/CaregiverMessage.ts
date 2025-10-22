import mongoose, { Schema, Document } from 'mongoose';

export interface ICaregiverMessage extends Document {
  deviceId: string;
  senderName: string;
  senderPhone?: string;
  messageText: string;
  deliveredToPatient: boolean;
  deliveredAt?: Date;
  read: boolean;
  readAt?: Date;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

const caregiverMessageSchema = new Schema<ICaregiverMessage>({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderPhone: {
    type: String
  },
  messageText: {
    type: String,
    required: true
  },
  deliveredToPatient: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
caregiverMessageSchema.index({ deviceId: 1, deliveredToPatient: 1 });
caregiverMessageSchema.index({ deviceId: 1, createdAt: -1 });

export const CaregiverMessage = mongoose.model<ICaregiverMessage>('CaregiverMessage', caregiverMessageSchema);

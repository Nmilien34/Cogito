import mongoose, { Schema, Document } from 'mongoose';
import { OTPRecord } from '../types';

export interface IOTPDocument extends Omit<OTPRecord, 'id'>, Document {}

const otpSchema = new Schema<IOTPDocument>({
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    sparse: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });
otpSchema.index({ phoneNumber: 1 });

export const OTP = mongoose.model<IOTPDocument>('OTP', otpSchema);

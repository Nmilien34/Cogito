import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserSettings, UserSubscription } from '../types';

export interface IUserDocument extends Omit<IUser, 'id'>, Document {}

const userSettingsSchema = new Schema<UserSettings>({
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  font: {
    type: String,
    enum: ['sans', 'serif', 'mono'],
    default: 'sans'
  },
  fontSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  language: {
    type: String,
    enum: ['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ko', 'ru', 'ht'],
    default: 'en'
  }
}, { _id: false });

const userSubscriptionSchema = new Schema<UserSubscription>({
  stripeCustomerId: { type: String },
  plan: {
    type: String,
    enum: ['free', 'pro', 'admin'],
    default: 'free'
  },
  currentPeriodEnd: { type: Date },
  cancelAtPeriodEnd: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false // Don't return password by default
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  avatar: { type: String },
  phoneNumber: { type: String, sparse: true, unique: true },
  phoneVerified: { type: Boolean, default: false },
  authType: {
    type: String,
    enum: ['GOOGLE', 'EMAIL'],
    required: true
  },
  googleId: { type: String, sparse: true, unique: true },
  termsAccepted: { type: Boolean, default: false },
  subscription: {
    type: userSubscriptionSchema,
    default: () => ({
      plan: 'free',
      cancelAtPeriodEnd: false
    })
  },
  referralCode: { type: String, unique: true, sparse: true },
  settings: {
    type: userSettingsSchema,
    default: () => ({
      theme: 'system',
      font: 'sans',
      fontSize: 'medium',
      language: 'en'
    })
  },
  refreshToken: { type: String, select: false }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(_doc, ret: any) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ referralCode: 1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);

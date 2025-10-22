import { Request } from 'express';

export type AuthType = 'GOOGLE' | 'EMAIL';
export type SubscriptionPlan = 'free' | 'pro' | 'admin';
export type ThemeType = 'light' | 'dark' | 'system';
export type FontType = 'sans' | 'serif' | 'mono';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'zh' | 'ko' | 'ru' | 'ht';

export interface UserSettings {
  theme: ThemeType;
  font: FontType;
  fontSize: FontSize;
  language: Language;
}

export interface UserSubscription {
  stripeCustomerId?: string;
  plan: SubscriptionPlan;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
}

export interface IUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  authType: AuthType;
  googleId?: string;
  termsAccepted: boolean;
  subscription: UserSubscription;
  referralCode?: string;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
  password?: string; // For email auth (hashed)
  refreshToken?: string;
}

export interface AuthMeta {
  needsPhoneVerification: boolean;
  needsNames: boolean;
  needsTermsAcceptance: boolean;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface OTPRecord {
  email?: string;
  phoneNumber?: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

export interface VoiceSession {
  id: string;
  userId: string;
  conversationId?: string;
  voiceModel?: string;
  streamingMode: boolean;
  startedAt: Date;
  endedAt?: Date;
  active: boolean;
}

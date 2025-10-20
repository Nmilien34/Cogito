export type AuthType = "GOOGLE" | "EMAIL";
export type SubscriptionPlan = "free" | "pro" | "admin";
export type ThemeType = "light" | "dark" | "system";
export type FontType = "sans" | "serif" | "mono";
export type FontSize = "small" | "medium" | "large";
export type Language =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "zh"
  | "ko"
  | "ru"
  | "ht";

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

export interface User {
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
  createdAt: string;
  updatedAt: string;
}

export interface AuthMeta {
  needsPhoneVerification: boolean;
  needsNames: boolean;
  needsTermsAcceptance: boolean;
}

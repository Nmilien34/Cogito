import { Router } from 'express';
import {
  sendEmailCode,
  verifyEmailCode,
  verifyGoogleToken,
  sendPhoneOTP,
  verifyPhoneOTP,
  setNamesAndTerms,
  refreshToken,
  logout
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Email authentication
router.post('/email/send-code', sendEmailCode as any);
router.post('/email/verify-code', verifyEmailCode as any);

// Google OAuth
router.post('/google/verify', verifyGoogleToken as any);

// Phone authentication (requires existing auth)
router.post('/phone/send-otp', authenticate as any, sendPhoneOTP as any);
router.post('/phone/verify-otp', authenticate as any, verifyPhoneOTP as any);

// User onboarding
router.post('/set-names-and-terms', authenticate as any, setNamesAndTerms as any);

// Token management
router.post('/refresh', refreshToken as any);
router.post('/logout', authenticate as any, logout as any);

export default router;

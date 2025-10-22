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
router.post('/email/send-code', sendEmailCode);
router.post('/email/verify-code', verifyEmailCode);

// Google OAuth
router.post('/google/verify', verifyGoogleToken);

// Phone authentication (requires existing auth)
router.post('/phone/send-otp', authenticate, sendPhoneOTP);
router.post('/phone/verify-otp', authenticate, verifyPhoneOTP);

// User onboarding
router.post('/set-names-and-terms', authenticate, setNamesAndTerms);

// Token management
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);

export default router;

import { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { AuthRequest, AuthMeta } from '../types';
import { User } from '../models/User';
import { OTP } from '../models/OTP';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOTP, isOTPExpired } from '../utils/otp';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';
import { config } from '../config/env';

const googleClient = new OAuth2Client(config.googleClientId);

// Helper function to determine auth meta
const getAuthMeta = (user: any): AuthMeta => {
  return {
    needsPhoneVerification: !user.phoneVerified,
    needsNames: !user.firstName || !user.lastName,
    needsTermsAcceptance: !user.termsAccepted
  };
};

// Email authentication: Send OTP
export const sendEmailCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    await OTP.findOneAndDelete({ email }); // Remove old OTP if exists
    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP via email
    await emailService.sendOTP(email, otp);

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Send email code error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

// Email authentication: Verify OTP
export const verifyEmailCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      res.status(400).json({ message: 'Invalid or expired verification code' });
      return;
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      await OTP.deleteOne({ email });
      res.status(400).json({ message: 'Verification code has expired' });
      return;
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ email });
      res.status(400).json({ message: 'Too many attempts. Please request a new code' });
      return;
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    // OTP is valid, delete it
    await OTP.deleteOne({ email });

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        authType: 'EMAIL',
        phoneVerified: false,
        termsAccepted: false
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    const meta = getAuthMeta(user);

    res.status(200).json({
      accessToken,
      user: user.toJSON(),
      meta
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    res.status(500).json({ message: 'Failed to verify code' });
  }
};

// Google OAuth: Verify token
export const verifyGoogleToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, clientType } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.googleClientId
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: payload.email },
        { googleId: payload.sub }
      ]
    });

    if (!user) {
      user = await User.create({
        email: payload.email,
        googleId: payload.sub,
        authType: 'GOOGLE',
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatar: payload.picture,
        phoneVerified: false,
        termsAccepted: false
      });
    } else {
      // Update Google info if not set
      if (!user.googleId) {
        user.googleId = payload.sub;
      }
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
      }
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    const meta = getAuthMeta(user);

    res.status(200).json({
      accessToken,
      user: user.toJSON(),
      meta
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Failed to authenticate with Google' });
  }
};

// Phone authentication: Send OTP
export const sendPhoneOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    await OTP.findOneAndDelete({ phoneNumber }); // Remove old OTP if exists
    await OTP.create({
      phoneNumber,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP via SMS
    await smsService.sendOTP(phoneNumber, otp);

    res.status(200).json({ message: 'Verification code sent to phone' });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

// Phone authentication: Verify OTP
export const verifyPhoneOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      res.status(400).json({ message: 'Phone number and OTP are required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ phoneNumber });

    if (!otpRecord) {
      res.status(400).json({ message: 'Invalid or expired verification code' });
      return;
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      await OTP.deleteOne({ phoneNumber });
      res.status(400).json({ message: 'Verification code has expired' });
      return;
    }

    // Check if too many attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ phoneNumber });
      res.status(400).json({ message: 'Too many attempts. Please request a new code' });
      return;
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    // OTP is valid, delete it
    await OTP.deleteOne({ phoneNumber });

    // Update user's phone number
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.phoneNumber = phoneNumber;
    user.phoneVerified = true;
    await user.save();

    const meta = getAuthMeta(user);

    res.status(200).json({
      user: user.toJSON(),
      meta
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({ message: 'Failed to verify phone number' });
  }
};

// Set names and accept terms
export const setNamesAndTerms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, termsAccepted } = req.body;

    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!firstName || !lastName) {
      res.status(400).json({ message: 'First name and last name are required' });
      return;
    }

    if (!termsAccepted) {
      res.status(400).json({ message: 'You must accept the terms and conditions' });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.termsAccepted = termsAccepted;
    await user.save();

    const meta = getAuthMeta(user);

    res.status(200).json({
      user: user.toJSON(),
      meta
    });
  } catch (error) {
    console.error('Set names and terms error:', error);
    res.status(500).json({ message: 'Failed to update user information' });
  }
};

// Refresh access token
export const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyRefreshToken(token);

      const user = await User.findById(decoded.userId).select('+refreshToken');

      if (!user || user.refreshToken !== token) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      // Generate new access token
      const accessToken = generateAccessToken(user._id.toString(), user.email);

      res.status(200).json({ accessToken });
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};

// Logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.id);

    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
};

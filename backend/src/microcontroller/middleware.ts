/**
 * Microcontroller Middleware
 * Authentication and validation middleware for microcontroller requests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface DeviceAuthRequest extends Request {
  deviceId?: string;
  deviceInfo?: any;
}

/**
 * Middleware to authenticate microcontroller requests
 * Expects Bearer token in Authorization header
 */
export const authenticateDevice = async (
  req: DeviceAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      // Verify device token
      const decoded = jwt.verify(token, config.jwtSecret) as any;

      if (!decoded.deviceId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token format'
        });
        return;
      }

      // Attach device info to request
      req.deviceId = decoded.deviceId;
      req.deviceInfo = decoded;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token expired'
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    console.error('Device authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate device'
    });
  }
};

/**
 * Middleware to validate device ID in request body/params
 */
export const validateDeviceId = (
  req: DeviceAuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const deviceId = req.deviceId || req.body?.deviceId || req.params?.deviceId;

  if (!deviceId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Device ID is required'
    });
    return;
  }

  // Ensure authenticated device matches request device ID
  if (req.deviceId && deviceId !== req.deviceId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Device ID mismatch'
    });
    return;
  }

  next();
};


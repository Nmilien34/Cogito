import { Router } from 'express';
import {
  registerDevice,
  getDeviceInfo,
  updateDeviceStatus,
  getDeviceStatus,
  getDeviceConfiguration,
  updateDeviceConfiguration,
  submitSensorData,
  healthCheck
} from './controller';
import { authenticateDevice, validateDeviceId } from './middleware';

const router = Router();

/**
 * Public routes (no authentication required)
 */

// Device registration (public - device needs to register first)
router.post('/register', registerDevice);

/**
 * Protected routes (require device authentication)
 */

// Health check (simple heartbeat)
router.get('/health', authenticateDevice, healthCheck);

// Device information
router.get('/info', authenticateDevice, getDeviceInfo);
router.get('/info/:deviceId', authenticateDevice, getDeviceInfo);

// Device status
router.get('/status', authenticateDevice, getDeviceStatus);
router.get('/status/:deviceId', authenticateDevice, getDeviceStatus);
router.post('/status', authenticateDevice, validateDeviceId, updateDeviceStatus);

// Device configuration
router.get('/config', authenticateDevice, getDeviceConfiguration);
router.get('/config/:deviceId', authenticateDevice, getDeviceConfiguration);
router.put('/config', authenticateDevice, validateDeviceId, updateDeviceConfiguration);

// Sensor data
router.post('/sensor', authenticateDevice, validateDeviceId, submitSensorData);

export default router;


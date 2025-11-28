/**
 * Radio Routes - FM Radio control API endpoints
 */

import { Router } from 'express';
import * as radioController from './controller';

const router = Router();

/**
 * POST /api/radio/scan-up
 * Scan radio up by 0.1 MHz
 */
router.post('/scan-up', radioController.scanUp);

/**
 * POST /api/radio/scan-down
 * Scan radio down by 0.1 MHz
 */
router.post('/scan-down', radioController.scanDown);

/**
 * POST /api/radio/set-frequency
 * Set specific frequency
 * Body: { frequency: number }
 */
router.post('/set-frequency', radioController.setFrequency);

/**
 * POST /api/radio/on
 * Turn radio ON
 */
router.post('/on', radioController.radioOn);

/**
 * POST /api/radio/off
 * Turn radio OFF
 */
router.post('/off', radioController.radioOff);

/**
 * GET /api/radio/status
 * Get radio status
 */
router.get('/status', radioController.getStatus);

export default router;

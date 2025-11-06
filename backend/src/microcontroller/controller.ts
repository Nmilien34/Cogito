import { Response } from 'express';
import { DeviceAuthRequest } from './middleware';
import { microcontrollerService } from './service';
import {
  DeviceRegistrationRequest,
  DeviceStatusUpdate,
  SensorData,
  DeviceConfigurationUpdate
} from './types';

/**
 * Register a new microcontroller device
 */
export const registerDevice = async (req: DeviceAuthRequest, res: Response): Promise<void> => {
  try {
    const registrationData: DeviceRegistrationRequest = {
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
      deviceType: req.body.deviceType || 'microcontroller',
      firmwareVersion: req.body.firmwareVersion,
      hardwareVersion: req.body.hardwareVersion,
      macAddress: req.body.macAddress
    };

    if (!registrationData.deviceId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Device ID is required'
      });
      return;
    }

    const result = await microcontrollerService.registerDevice(registrationData);

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Device registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register device'
    });
  }
};

/**
 * Get device information
 */
export const getDeviceInfo = async (req: DeviceAuthRequest, res: Response): Promise<void> => {
  try {
    const deviceId = req.deviceId || req.params.deviceId;

    if (!deviceId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Device ID is required'
      });
      return;
    }

    const deviceInfo = await microcontrollerService.getDeviceInfo(deviceId);

    if (!deviceInfo) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Device not found'
      });
      return;
    }

    res.json(deviceInfo);
  } catch (error) {
    console.error('❌ Get device info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get device information'
    });
  }
};

/**
 * Update device status (heartbeat)
 */
export const updateDeviceStatus = async (req: DeviceAuthRequest, res: Response): Promise<void> => {
  try {
    const deviceId = req.deviceId!;
    const statusUpdate: DeviceStatusUpdate = {
      deviceId,
      status: req.body.status,
      batteryLevel: req.body.batteryLevel,
      signalStrength: req.body.signalStrength,
      temperature: req.body.temperature,
      uptime: req.body.uptime,
      memoryUsage: req.body.memoryUsage,
      cpuUsage: req.body.cpuUsage
    };

    const status = await microcontrollerService.updateDeviceStatus(deviceId, statusUpdate);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ Update device status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update device status'
    });
  }
};

/**
 * Get device status
 */
export const getDeviceStatus = async (req: DeviceAuthRequest, res: Response): Promise<void> => {
  try {
    const deviceId = req.deviceId || req.params.deviceId;

    if (!deviceId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Device ID is required'
      });
      return;
    }

    const status = await microcontrollerService.getDeviceStatus(deviceId);

    if (!status) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Device status not found'
      });
      return;
    }

    res.json(status);
  } catch (error) {
    console.error('❌ Get device status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get device status'
    });
  }
};

/**
 * Get device configuration
 */
export const getDeviceConfiguration = async (
  req: DeviceAuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deviceId = req.deviceId || req.params.deviceId;

    if (!deviceId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Device ID is required'
      });
      return;
    }

    const config = await microcontrollerService.getDeviceConfiguration(deviceId);

    if (!config) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Device configuration not found'
      });
      return;
    }

    res.json(config);
  } catch (error) {
    console.error('❌ Get device configuration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get device configuration'
    });
  }
};

/**
 * Update device configuration
 */
export const updateDeviceConfiguration = async (
  req: DeviceAuthRequest,
  res: Response
): Promise<void> => {
  try {
    const deviceId = req.deviceId!;
    const configUpdate: DeviceConfigurationUpdate = {
      volume: req.body.volume,
      brightness: req.body.brightness,
      autoStart: req.body.autoStart,
      timeout: req.body.timeout,
      features: req.body.features
    };

    const config = await microcontrollerService.updateDeviceConfiguration(deviceId, configUpdate);

    res.json({
      success: true,
      configuration: config
    });
  } catch (error) {
    console.error('❌ Update device configuration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update device configuration'
    });
  }
};

/**
 * Submit sensor data
 */
export const submitSensorData = async (req: DeviceAuthRequest, res: Response): Promise<void> => {
  try {
    const deviceId = req.deviceId!;
    const sensorData: SensorData = {
      deviceId,
      timestamp: new Date(),
      sensorType: req.body.sensorType || 'other',
      value: req.body.value,
      unit: req.body.unit,
      metadata: req.body.metadata
    };

    if (sensorData.value === undefined) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Sensor value is required'
      });
      return;
    }

    await microcontrollerService.recordSensorData(sensorData);

    res.json({
      success: true,
      message: 'Sensor data recorded'
    });
  } catch (error) {
    console.error('❌ Submit sensor data error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit sensor data'
    });
  }
};

/**
 * Health check endpoint for microcontroller
 */
export const healthCheck = async (req: DeviceAuthRequest, res: Response): Promise<void> => {
  try {
    const deviceId = req.deviceId!;

    // Update last seen timestamp
    await microcontrollerService.updateDeviceStatus(deviceId, {
      deviceId,
      status: 'online'
    });

    res.json({
      status: 'ok',
      deviceId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Health check failed'
    });
  }
};


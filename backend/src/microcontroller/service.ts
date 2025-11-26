/**
 * Microcontroller Service
 * Business logic for microcontroller communication
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import {
  DeviceInfo,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  DeviceStatus,
  DeviceStatusUpdate,
  SensorData,
  DeviceConfiguration,
  DeviceConfigurationUpdate
} from './types';

export class MicrocontrollerService {
  // In-memory device registry (could be moved to database)
  private deviceRegistry: Map<string, DeviceInfo> = new Map();
  private deviceStatuses: Map<string, DeviceStatus> = new Map();
  private deviceConfigs: Map<string, DeviceConfiguration> = new Map();

  /**
   * Register a new device
   */
  async registerDevice(request: DeviceRegistrationRequest): Promise<DeviceRegistrationResponse> {
    const deviceInfo: DeviceInfo = {
      deviceId: request.deviceId,
      deviceName: request.deviceName || `Device ${request.deviceId.substring(0, 8)}`,
      deviceType: request.deviceType || 'microcontroller',
      firmwareVersion: request.firmwareVersion,
      hardwareVersion: request.hardwareVersion,
      macAddress: request.macAddress
    };

    // Store device info
    this.deviceRegistry.set(request.deviceId, deviceInfo);

    // Initialize device status
    const deviceStatus: DeviceStatus = {
      deviceId: request.deviceId,
      status: 'online',
      lastSeen: new Date()
    };
    this.deviceStatuses.set(request.deviceId, deviceStatus);

    // Initialize default configuration
    const defaultConfig: DeviceConfiguration = {
      deviceId: request.deviceId,
      vapiAssistantId: config.vapiAssistantConfigId,
      volume: 70,
      brightness: 50,
      autoStart: false,
      timeout: 300 // 5 minutes
    };
    this.deviceConfigs.set(request.deviceId, defaultConfig);

    // Generate access token
    const accessToken = this.generateDeviceToken(request.deviceId);

    console.log('✅ Device registered:', request.deviceId);

    return {
      success: true,
      deviceId: request.deviceId,
      accessToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      deviceInfo
    };
  }

  /**
   * Get device information
   */
  async getDeviceInfo(deviceId: string): Promise<DeviceInfo | null> {
    return this.deviceRegistry.get(deviceId) || null;
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string, update: DeviceStatusUpdate): Promise<DeviceStatus> {
    const currentStatus = this.deviceStatuses.get(deviceId);

    const status: DeviceStatus = {
      deviceId,
      status: update.status || currentStatus?.status || 'online',
      batteryLevel: update.batteryLevel ?? currentStatus?.batteryLevel,
      signalStrength: update.signalStrength ?? currentStatus?.signalStrength,
      temperature: update.temperature ?? currentStatus?.temperature,
      lastSeen: new Date(),
      uptime: update.uptime ?? currentStatus?.uptime,
      memoryUsage: update.memoryUsage ?? currentStatus?.memoryUsage,
      cpuUsage: update.cpuUsage ?? currentStatus?.cpuUsage
    };

    this.deviceStatuses.set(deviceId, status);
    console.log('📊 Device status updated:', deviceId, status);

    return status;
  }

  /**
   * Get device status
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    return this.deviceStatuses.get(deviceId) || null;
  }

  /**
   * Get device configuration
   */
  async getDeviceConfiguration(deviceId: string): Promise<DeviceConfiguration | null> {
    return this.deviceConfigs.get(deviceId) || null;
  }

  /**
   * Update device configuration
   */
  async updateDeviceConfiguration(
    deviceId: string,
    update: DeviceConfigurationUpdate
  ): Promise<DeviceConfiguration> {
    const currentConfig = this.deviceConfigs.get(deviceId) || {
      deviceId,
      vapiAssistantId: config.vapiAssistantConfigId
    };

    const deviceConfig: DeviceConfiguration = {
      ...currentConfig,
      ...update
    };

    this.deviceConfigs.set(deviceId, deviceConfig);
    console.log('⚙️ Device configuration updated:', deviceId);

    return deviceConfig;
  }

  /**
   * Record sensor data
   */
  async recordSensorData(data: SensorData): Promise<void> {
    // In production, this would save to database
    console.log('📡 Sensor data received:', data);
    // TODO: Store in database for analytics
  }

  /**
   * Generate JWT token for device
   */
  private generateDeviceToken(deviceId: string): string {
    return jwt.sign(
      {
        deviceId,
        type: 'device',
        iat: Math.floor(Date.now() / 1000)
      },
      config.jwtSecret,
      {
        expiresIn: '7d' // 7 days
      }
    );
  }

  /**
   * Verify device exists
   */
  async verifyDevice(deviceId: string): Promise<boolean> {
    return this.deviceRegistry.has(deviceId);
  }

  /**
   * Get all registered devices
   */
  async getAllDevices(): Promise<DeviceInfo[]> {
    return Array.from(this.deviceRegistry.values());
  }
}

// Export singleton instance
export const microcontrollerService = new MicrocontrollerService();


/**
 * Microcontroller Types
 * Type definitions for microcontroller communication
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: 'fm_radio' | 'microcontroller';
  firmwareVersion?: string;
  hardwareVersion?: string;
  macAddress?: string;
  ipAddress?: string;
}

export interface DeviceRegistrationRequest {
  deviceId: string;
  deviceName?: string;
  deviceType?: 'fm_radio' | 'microcontroller';
  firmwareVersion?: string;
  hardwareVersion?: string;
  macAddress?: string;
}

export interface DeviceRegistrationResponse {
  success: boolean;
  deviceId: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  deviceInfo: DeviceInfo;
}

export interface DeviceStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  batteryLevel?: number;
  signalStrength?: number;
  temperature?: number;
  lastSeen: Date;
  uptime?: number; // seconds
  memoryUsage?: number; // percentage
  cpuUsage?: number; // percentage
}

export interface DeviceStatusUpdate {
  deviceId: string;
  status?: 'online' | 'offline' | 'maintenance' | 'error';
  batteryLevel?: number;
  signalStrength?: number;
  temperature?: number;
  uptime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface SensorData {
  deviceId: string;
  timestamp: Date;
  sensorType: 'temperature' | 'humidity' | 'motion' | 'audio' | 'button' | 'other';
  value: number | string | boolean;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface DeviceConfiguration {
  deviceId: string;
  vapiAssistantId?: string;
  vapiPublicKey?: string;
  volume?: number; // 0-100
  brightness?: number; // 0-100
  autoStart?: boolean;
  timeout?: number; // seconds
  features?: Record<string, any>;
}

export interface DeviceConfigurationUpdate {
  volume?: number;
  brightness?: number;
  autoStart?: boolean;
  timeout?: number;
  features?: Record<string, any>;
}

export interface OTAUpdateInfo {
  deviceId: string;
  firmwareVersion: string;
  updateUrl: string;
  checksum: string;
  size: number;
  releaseNotes?: string;
}


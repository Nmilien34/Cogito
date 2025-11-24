/**
 * DeviceAuthService - Simplified authentication for FM Radio device
 *
 * This service provides device-based authentication without requiring
 * user interaction (no Google OAuth, email OTP, or phone verification).
 */

// Simple localStorage wrapper for web compatibility
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }
};

// Simple API utility (can be expanded later)
const api = {
  async post(endpoint: string, data?: any) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: await response.json() };
  }
};

const DEVICE_ID_KEY = 'device_id';
const ACCESS_TOKEN_KEY = 'accessToken';

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: 'fm_radio';
}

export class DeviceAuthService {
  private deviceId: string | null = null;
  private accessToken: string | null = null;

  /**
   * Initialize device authentication
   * Generates or retrieves a unique device ID
   */
  public async initialize(): Promise<void> {
    try {
      // Try to get existing device ID
      let deviceId = await storage.getItem(DEVICE_ID_KEY);

      if (!deviceId) {
        // Generate new device ID if none exists
        deviceId = this.generateDeviceId();
        await storage.setItem(DEVICE_ID_KEY, deviceId);
        console.log('🆔 Generated new device ID:', deviceId);
      }

      this.deviceId = deviceId;

      // Try to load existing access token
      const storedToken = await storage.getItem(ACCESS_TOKEN_KEY);
      if (storedToken) {
        this.accessToken = storedToken;
        console.log('✅ Loaded existing access token');
      }
    } catch (error) {
      console.error('Failed to initialize device auth:', error);
      throw error;
    }
  }

  /**
   * Authenticate device with the backend
   * This should be called on app startup
   */
  public async authenticateDevice(deviceName?: string): Promise<string> {
    if (!this.deviceId) {
      throw new Error('Device not initialized. Call initialize() first.');
    }

    try {
      const deviceInfo: DeviceInfo = {
        deviceId: this.deviceId,
        deviceName: deviceName || `FM Radio ${this.deviceId.substring(0, 8)}`,
        deviceType: 'fm_radio'
      };

      // TODO: Implement backend endpoint for device authentication
      // For now, use a mock token
      console.log('🔐 Authenticating device:', deviceInfo);

      // In production, this should call:
      // const response = await api.post('/api/auth/device', deviceInfo);
      // const { accessToken } = response.data;

      // Mock token for development
      const mockToken = `device_${this.deviceId}_${Date.now()}`;

      this.accessToken = mockToken;
      await storage.setItem(ACCESS_TOKEN_KEY, mockToken);

      console.log('✅ Device authenticated successfully');
      return mockToken;
    } catch (error) {
      console.error('Device authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the device ID
   */
  public getDeviceId(): string | null {
    return this.deviceId;
  }

  /**
   * Check if device is authenticated
   */
  public isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Logout and clear device credentials
   */
  public async logout(): Promise<void> {
    try {
      // Optionally notify backend
      if (this.accessToken) {
        await api.post('/api/auth/logout').catch(() => {
          // Ignore errors on logout
        });
      }

      // Clear local storage
      await storage.removeItem(ACCESS_TOKEN_KEY);
      this.accessToken = null;

      console.log('✅ Device logged out');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Reset device (clear device ID and token)
   * This effectively "factory resets" the device authentication
   */
  public async resetDevice(): Promise<void> {
    try {
      await storage.removeItem(DEVICE_ID_KEY);
      await storage.removeItem(ACCESS_TOKEN_KEY);

      this.deviceId = null;
      this.accessToken = null;

      console.log('✅ Device reset complete');
    } catch (error) {
      console.error('Device reset error:', error);
      throw error;
    }
  }

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    // Generate a UUID-like identifier
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Refresh access token if needed
   */
  public async refreshToken(): Promise<string> {
    try {
      // TODO: Implement token refresh logic with backend
      console.log('🔄 Refreshing device token');

      // For now, re-authenticate
      return await this.authenticateDevice();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const deviceAuthService = new DeviceAuthService();

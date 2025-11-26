/**
 * VAPI Service
 * Service for making API calls to VAPI platform
 */

import { config } from '../config/env';

export class VapiService {
  private apiKey: string;
  private assistantConfigId: string;
  private baseUrl: string = 'https://api.vapi.ai';

  constructor() {
    this.apiKey = config.vapiApiKey;
    this.assistantConfigId = config.vapiAssistantConfigId;

    if (!this.apiKey) {
      console.warn('⚠️ VAPI_API_KEY not set. VAPI API calls will not work.');
    }
  }

  /**
   * Make an authenticated request to VAPI API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    if (!this.apiKey) {
      throw new Error('VAPI API key is not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: any = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`VAPI API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ VAPI API request failed:', error);
      throw error;
    }
  }

  /**
   * Create a phone call using VAPI
   */
  async createCall(options: {
    phoneNumberId?: string;
    customer?: {
      number: string;
    };
    metadata?: Record<string, any>;
  }): Promise<any> {
    const callData = {
      assistantConfigId: this.assistantConfigId,
      phoneNumberId: options.phoneNumberId,
      customer: options.customer,
      metadata: options.metadata,
    };

    return this.makeRequest('/call', 'POST', callData);
  }

  /**
   * Get call status
   */
  async getCall(callId: string): Promise<any> {
    return this.makeRequest(`/call/${callId}`);
  }

  /**
   * End a call
   */
  async endCall(callId: string): Promise<any> {
    return this.makeRequest(`/call/${callId}`, 'PUT', { status: 'ended' });
  }

  /**
   * Get assistant config
   */
  async getAssistantConfig(): Promise<any> {
    if (!this.assistantConfigId) {
      throw new Error('Assistant config ID is not configured');
    }
    return this.makeRequest(`/assistant-config/${this.assistantConfigId}`);
  }

  /**
   * Get assistant config ID
   */
  getAssistantConfigId(): string {
    return this.assistantConfigId;
  }
}

// Export singleton instance
export const vapiService = new VapiService();



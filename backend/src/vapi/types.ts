/**
 * VAPI Types
 * Type definitions for VAPI integration
 */

export interface VapiWebhookRequest {
  message?: {
    toolCalls?: Array<{
      id: string;
      function?: {
        name: string;
        arguments?: any;
      };
    }>;
  };
  [key: string]: any;
}

export interface VapiToolCallResult {
  toolCallId: string;
  result: string;
}

export interface VapiToolCallResponse {
  results: VapiToolCallResult[];
}

export interface VapiCallOptions {
  assistantConfigId?: string;
  phoneNumberId?: string;
  customer?: {
    number: string;
  };
  metadata?: Record<string, any>;
}

export interface VapiCallResponse {
  id: string;
  status: string;
  [key: string]: any;
}

export interface VapiAssistantConfig {
  id: string;
  name: string;
  [key: string]: any;
}



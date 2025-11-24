export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export const DEFAULT_PROFILE_ID = import.meta.env.VITE_PROFILE_ID || "ruth-profile";

// FM Radio Configuration (TEA5767 Hardware)
export const FM_RADIO_CONFIG = {
  defaultFrequency: parseFloat(import.meta.env.VITE_FM_DEFAULT_FREQUENCY || '99.1'),
  minFrequency: 87.5,
  maxFrequency: 108.0,
  step: 0.1,
};

// Vapi Voice AI Configuration
export const VAPI_CONFIG = {
  publicKey: import.meta.env.VITE_VAPI_PUBLIC_KEY || '',
  assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID || '',
};

// Hardware Service Configuration (Raspberry Pi - TEA5767 FM Radio + Button Controls)
export const HARDWARE_SERVICE_URL = import.meta.env.VITE_HARDWARE_SERVICE_URL || 'http://localhost:3001';

// Validation function to check if Vapi configs are present
export const validateVapiConfig = () => {
  const errors: string[] = [];

  if (!VAPI_CONFIG.publicKey) {
    errors.push('VITE_VAPI_PUBLIC_KEY is not set');
  }

  if (!VAPI_CONFIG.assistantId) {
    errors.push('VITE_VAPI_ASSISTANT_ID is not set');
  }

  if (errors.length > 0) {
    console.warn('⚠️ Vapi configuration warnings:', errors);
    return false;
  }

  return true;
};

// Deprecated - kept for backwards compatibility
export const RADIO_STREAM_URL = ""; // No longer used - physical FM radio only


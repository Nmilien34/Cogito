import { Platform } from "react-native";
import Constants from "expo-constants";

// Log environment information for debugging
export const logEnvironmentInfo = (context = "General") => {
  console.log(`📱 ${context} Environment Info:`, {
    OS: Platform.OS,
    Version: Platform.Version,
    manifest: Constants.manifest2,
    appOwnership: Constants.appOwnership,
    devMode: __DEV__,
  });
};

// Socket.IO configuration
export const SOCKET_CONFIG = {
  URL: process.env.EXPO_PUBLIC_API_URL,
  OPTIONS: {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  },
};

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL,
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_DATA: "userData",
};

// Log configuration for debugging
console.log("🔧 Environment Config:", {
  env: __DEV__ ? "development" : "production",
  apiUrl: API_CONFIG.BASE_URL,
  socketUrl: SOCKET_CONFIG.URL,
  platform: Platform.OS,
  devMode: __DEV__,
  appOwnership: Constants.appOwnership,
  fullEnv: process.env, // Log all environment variables
});

// Add network error logging
export const logNetworkError = (error: any, context: string) => {
  console.error(`🌐 Network Error (${context}):`, {
    message: error.message,
    status: error.status,
    response: error.response,
    url: error.url,
    config: error.config,
    timestamp: new Date().toISOString(),
  });
};

import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS, logEnvironmentInfo } from "../config";

// Log environment for debugging
logEnvironmentInfo("API");

// Create axios instance with proper configuration
export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

// Log the final API configuration
console.log("⚙️ API Configuration:", {
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: api.defaults.headers,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request debugging
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (__DEV__) {
      console.log("🚀 Request:", {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data,
      });
    }
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    if (__DEV__) {
      console.error("❌ Request Error:", error);
    }
    return Promise.reject(error);
  }
);

// Add response debugging
api.interceptors.response.use(
  async (response: AxiosResponse) => {
    if (__DEV__) {
      console.log("✅ Response:", {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
    }
    const newAccessToken = response.headers["x-new-access-token"];
    if (newAccessToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    }
    return response;
  },
  async (error: any) => {
    if (__DEV__) {
      console.error("❌ Response Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post("/api/auth/refresh");
        const { accessToken } = response.data;

        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to create streaming session (simplified for mobile)
export const createStreamingSession = async (
  conversationId: string,
  requestBody: {
    message: string;
    model?: string;
    style?: string;
    selectedResources?: string[];
    resources?: any[];
  },
  threadId?: string
) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) throw new Error("No access token found");

  // Step 1: Create streaming session
  const startEndpoint = threadId
    ? `/api/conversations/${conversationId}/threads/${threadId}/stream/start`
    : `/api/conversations/${conversationId}/stream/start`;

  const response = await api.post(startEndpoint, {
    ...requestBody,
    token,
  });

  return response.data;
};

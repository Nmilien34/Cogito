import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SOCKET_CONFIG, STORAGE_KEYS, logEnvironmentInfo } from "../config";

// Log environment for debugging
logEnvironmentInfo("Socket");

// Singleton socket instance
let socket: Socket | null = null;

/**
 * Initialize the socket connection with authentication
 * @returns A promise that resolves when the socket is connected
 */
export const initializeSocket = async (): Promise<Socket> => {
  console.log("Initializing socket with URL:", SOCKET_CONFIG.URL);

  if (socket?.connected) {
    console.log("Socket already connected:", socket.id);
    return socket;
  }

  // Get authentication tokens
  const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!accessToken) {
    throw new Error("No access token found");
  }

  // Create new socket connection with auth
  socket = io(SOCKET_CONFIG.URL, {
    ...SOCKET_CONFIG.OPTIONS,
    auth: {
      token: accessToken,
      refreshToken: refreshToken || undefined,
    },
  });

  // Return a promise that resolves when connected or rejects on error
  return new Promise((resolve, reject) => {
    // Set timeout to prevent hanging indefinitely
    const timeout = setTimeout(() => {
      if (socket && !socket.connected) {
        reject(new Error("Socket connection timeout"));
      }
    }, SOCKET_CONFIG.OPTIONS.timeout || 10000);

    // Connection events
    socket?.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket?.id);
      clearTimeout(timeout);
      resolve(socket!);
    });

    socket?.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      clearTimeout(timeout);
      reject(err);
    });

    socket?.on("error", (err) => {
      console.error("Socket error:", err);
      // Don't reject here as this might happen after initial connection
    });

    socket?.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  });
};

/**
 * Get the socket instance if it exists and is connected
 * @returns The socket instance or null if not connected
 */
export const getSocket = async (): Promise<Socket> => {
  if (!socket?.connected) {
    return initializeSocket();
  }
  return socket;
};

/**
 * Disconnect the socket if it exists
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected manually");
  }
};

// Voice-specific socket methods
export const startVoiceSession = async (data: {
  voiceModel?: string;
  streamingMode?: boolean;
}): Promise<string> => {
  const socket = await getSocket();
  return new Promise((resolve, reject) => {
    socket.emit("startVoiceSession", data);

    const handleEvent = (event: any) => {
      if (event.type === "VOICE_SESSION_STARTED") {
        socket.off("event", handleEvent);
        socket.off("error", handleError);
        resolve(event.data.voiceConversationId);
      }
    };

    const handleError = (error: string) => {
      socket.off("event", handleEvent);
      socket.off("error", handleError);
      reject(new Error(error));
    };

    socket.on("event", handleEvent);
    socket.on("error", handleError);
  });
};

export const sendAudioData = async (
  voiceConversationId: string,
  audio: string
) => {
  const socket = await getSocket();
  return new Promise<void>((resolve, reject) => {
    socket.emit("sendAudio", { voiceConversationId, audio }, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const stopVoiceSession = async (sessionId: string) => {
  const socketInstance = await getSocket();

  return new Promise<void>((resolve, reject) => {
    // Setup one-time event listener for session stop
    socketInstance.once("event", (event) => {
      if (event.type === "VOICE_SESSION_STOPPED") {
        console.log("🎙️ Voice session stopped");
        resolve();
      }
    });

    // Setup one-time error listener
    socketInstance.once("error", (error) => {
      console.error("🎙️ Voice session stop error:", error);
      reject(new Error(error));
    });

    // Emit stop event
    socketInstance.emit("stopVoiceSession", sessionId);
  });
};

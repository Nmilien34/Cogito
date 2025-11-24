/**
 * VapiProvider - Context provider for Vapi Voice AI integration
 *
 * Provides Vapi service instance and state management throughout the app.
 * Handles initialization, hardware button integration, and conversation state.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type PropsWithChildren,
} from "react";
import { io, Socket } from "socket.io-client";
import { VapiService, type VapiMessage, type ConversationStatus } from "../services/VapiService";
import { deviceAuthService } from "../services/DeviceAuthService";
import { VAPI_CONFIG, HARDWARE_SERVICE_URL, validateVapiConfig } from "../config";

interface VapiContextValue {
  vapiService: VapiService | null;
  status: ConversationStatus;
  messages: VapiMessage[];
  isSpeaking: boolean;
  isMuted: boolean;
  isAuthenticated: boolean;
  deviceId: string;
  hardwareMode: "radio" | "ai";
  startConversation: () => Promise<void>;
  stopConversation: () => void;
  toggleMute: () => void;
  clearHistory: () => void;
}

const VapiContext = createContext<VapiContextValue | undefined>(undefined);

export const VapiProvider = ({ children }: PropsWithChildren) => {
  const [vapiService, setVapiService] = useState<VapiService | null>(null);
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [messages, setMessages] = useState<VapiMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [hardwareMode, setHardwareMode] = useState<"radio" | "ai">("radio");
  const socketRef = useRef<Socket | null>(null);

  // Initialize device authentication on mount
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        await deviceAuthService.initialize();
        await deviceAuthService.authenticateDevice();

        setDeviceId(deviceAuthService.getDeviceId() || "unknown");
        setIsAuthenticated(true);

        console.log("✅ Device initialized and authenticated");
      } catch (error) {
        console.error("❌ Device initialization failed:", error);
      }
    };

    initializeDevice();
  }, []);

  // Initialize Vapi service when authenticated
  useEffect(() => {
    if (!isAuthenticated || vapiService) return;

    console.log("🎤 Initializing Vapi service...");
    
    // Validate configuration
    if (!validateVapiConfig()) {
      console.error("❌ Vapi credentials not configured!");
      console.error("Please set VITE_VAPI_PUBLIC_KEY and VITE_VAPI_ASSISTANT_ID in .env");
      return;
    }

    const service = new VapiService({
      publicKey: VAPI_CONFIG.publicKey,
      assistantId: VAPI_CONFIG.assistantId,
      onMessage: (message) => {
        console.log("📩 Message received:", message);
        setMessages((prev) => [...prev, message]);
      },
      onStatusChange: (newStatus) => {
        console.log("📊 Status changed:", newStatus);
        setStatus(newStatus);
      },
      onError: (error) => {
        console.error("❌ Vapi error:", error);
      },
      onSpeechStart: () => {
        console.log("🎤 User started speaking");
        setIsSpeaking(true);
      },
      onSpeechEnd: () => {
        console.log("🎤 User stopped speaking");
        setIsSpeaking(false);
      },
    });

    setVapiService(service);

    return () => {
      service.destroy();
    };
  }, [isAuthenticated, vapiService]);

  // Connect to hardware service WebSocket and listen for button events
  useEffect(() => {
    if (!vapiService) return;

    console.log("🔌 Connecting to hardware service:", HARDWARE_SERVICE_URL);

    const socket = io(HARDWARE_SERVICE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // Connection established
    socket.on("connect", () => {
      console.log("✅ Connected to hardware service");
      console.log("📡 Socket ID:", socket.id);
    });

    // Listen for button press → START voice AI
    socket.on("start-voice", async (data) => {
      console.log("🎤 Hardware button pressed - Starting Vapi conversation", data);
      setHardwareMode("ai");

      try {
        await vapiService.startConversation();
        console.log("✅ Vapi conversation started via button");
      } catch (error) {
        console.error("❌ Failed to start Vapi via button:", error);
      }
    });

    // Listen for auto-timeout or button press → STOP voice AI
    socket.on("stop-voice", (data) => {
      console.log("📻 Returning to radio mode - Stopping Vapi conversation", data);
      setHardwareMode("radio");

      try {
        vapiService.stopConversation();
        console.log("✅ Vapi conversation stopped");
      } catch (error) {
        console.error("❌ Failed to stop Vapi:", error);
      }
    });

    // Listen for general mode changes
    socket.on("mode-changed", (data) => {
      console.log("🔄 Mode changed:", data);
      setHardwareMode(data.mode);
    });

    // Connection errors
    socket.on("connect_error", (error) => {
      console.error("❌ Hardware service connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from hardware service:", reason);
    });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up hardware service connection");
      socket.off("start-voice");
      socket.off("stop-voice");
      socket.off("mode-changed");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [vapiService]);

  // Start conversation handler
  const startConversation = useCallback(async () => {
    if (!vapiService) {
      console.error("❌ Vapi service not initialized");
      return;
    }

    try {
      await vapiService.startConversation();
    } catch (error) {
      console.error("❌ Failed to start conversation:", error);
    }
  }, [vapiService]);

  // Stop conversation handler
  const stopConversation = useCallback(() => {
    if (!vapiService) {
      console.error("❌ Vapi service not initialized");
      return;
    }

    try {
      vapiService.stopConversation();
    } catch (error) {
      console.error("❌ Failed to stop conversation:", error);
    }
  }, [vapiService]);

  // Toggle mute handler
  const toggleMute = useCallback(() => {
    if (!vapiService) return;

    const newMutedState = !isMuted;
    vapiService.setMuted(newMutedState);
    setIsMuted(newMutedState);
  }, [vapiService, isMuted]);

  // Clear message history handler
  const clearHistory = useCallback(() => {
    if (vapiService) {
      vapiService.clearHistory();
    }
    setMessages([]);
  }, [vapiService]);

  return (
    <VapiContext.Provider
      value={{
        vapiService,
        status,
        messages,
        isSpeaking,
        isMuted,
        isAuthenticated,
        deviceId,
        hardwareMode,
        startConversation,
        stopConversation,
        toggleMute,
        clearHistory,
      }}
    >
      {children}
    </VapiContext.Provider>
  );
};

export const useVapi = () => {
  const ctx = useContext(VapiContext);
  if (!ctx) throw new Error("useVapi must be used within VapiProvider");
  return ctx;
};

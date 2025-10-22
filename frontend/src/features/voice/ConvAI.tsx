"use dom";

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useConversation } from "@11labs/react";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

const ToolOutput = ({
  data,
  assistantMessage,
  onAction,
}: {
  data: any;
  assistantMessage: string;
  onAction: (action: any) => void;
}) => (
  <View>
    <Text style={{ color: colors.dark.foreground, marginBottom: 10 }}>
      Assistant: {assistantMessage}
    </Text>
    <Text style={{ color: colors.dark.foreground }}>
      Tool Data: {JSON.stringify(data, null, 2)}
    </Text>
    <TouchableOpacity
      onPress={() => onAction({ type: "example_action" })}
      style={{
        marginTop: 10,
        padding: 5,
        backgroundColor: colors.dark.secondary,
      }}
    >
      <Text style={{ color: colors.dark.foreground }}>Perform Action</Text>
    </TouchableOpacity>
  </View>
);

const MockPulseCircle = ({
  isConnecting,
  isMuted,
  theme,
}: {
  isConnecting: boolean;
  isMuted: boolean;
  theme: any;
}) => (
  <View style={[styles.mockPulseCircleBase, { borderColor: theme.foreground }]}>
    {isConnecting ? (
      <ActivityIndicator size="large" color={theme.foreground} />
    ) : (
      <MaterialIcons
        name={isMuted ? "mic-off" : "mic"}
        size={48}
        color={theme.foreground}
      />
    )}
  </View>
);

const ShimmerText = ({ text, theme }: { text: string; theme: any }) => (
  <Text style={{ color: theme.foreground, fontStyle: "italic" }}>{text}</Text>
);

async function requestMicrophonePermission() {
  try {
    if (navigator?.mediaDevices?.getUserMedia) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted via getUserMedia");
      return true;
    } else {
      console.warn("getUserMedia not supported on this platform/browser.");
      return false;
    }
  } catch (error) {
    console.error("Microphone permission denied or error:", error);
    return false;
  }
}

export default function ConvAI({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [currentToolOutput, setCurrentToolOutput] = useState<string | null>(
    null
  );
  const [toolData, setToolData] = useState<any>(null);
  const [hookStatus, setHookStatus] = useState("disconnected");
  const [hookError, setHookError] = useState<string | null>(null);

  const handleMessage = (message: any) => {
    console.log("Message received:", message);
    if (typeof message === "object" && message !== null && "type" in message) {
      if (message.type === "transcript" && "transcript" in message) {
        setCurrentTranscript(message.transcript as string);
      } else if (message.type === "text" && "text" in message) {
        setDisplayedMessage(message.text as string);
        setCurrentTranscript("");
      } else if (
        message.type === "tool_call" &&
        "toolName" in message &&
        "args" in message
      ) {
        console.log("Tool call:", message);
        setCurrentToolOutput(message.toolName as string);
        setToolData(message.args);
        setDisplayedMessage("");
        setCurrentTranscript("");
      } else if (message.type === "tool_response" && "toolName" in message) {
        console.log("Tool response:", message);
      }
    }
  };

  const handleStateUpdate = (state: any) => {
    console.log("State Update:", state);
    if (typeof state === "object" && state !== null) {
      if ("isMuted" in state) {
        setIsMuted(state.isMuted ?? false);
      }
      if ("status" in state) {
        setHookStatus(state.status as string);
      }
    }
  };

  const handleError = (errorMessage: string) => {
    console.error("Conversation Error:", errorMessage);
    setHookError(errorMessage);
    setDisplayedMessage(`Error: ${errorMessage}`);
    setCurrentToolOutput(null);
    setToolData(null);
  };

  const { startSession, endSession, status } = useConversation({
    onMessage: handleMessage,
    onStateUpdate: handleStateUpdate,
    onError: handleError,
  });

  const currentStatus = hookStatus;
  const currentError = hookError;
  const isConnecting = currentStatus === "connecting";
  const isConnected = currentStatus === "connected";

  useEffect(() => {
    let isMounted = true;
    const start = async () => {
      if (isVisible && currentStatus === "disconnected" && isMounted) {
        console.log("Modal visible, attempting to start conversation...");
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          alert("Microphone permission is required to start the conversation.");
          if (isMounted) onClose();
          return;
        }
        try {
          setCurrentTranscript("");
          setDisplayedMessage("");
          setCurrentToolOutput(null);
          setToolData(null);
          setIsMuted(false);
          setHookError(null);
          await startSession?.({
            agentId: "n3MbanaRoXM0G18j3JS5",
          });
          console.log(
            "Conversation started successfully (called startSession)."
          );
        } catch (error) {
          console.error("Failed to start conversation:", error);
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          setHookError(errorMsg);
          setDisplayedMessage(`Failed to start: ${errorMsg}`);
          if (isMounted) onClose();
        }
      }
    };

    start();
    return () => {
      isMounted = false;
      if (currentStatus !== "disconnected") {
        console.log(
          "Modal closing or unmounting, ending conversation session."
        );
        endSession?.();
      }
    };
  }, [isVisible, currentStatus, startSession, endSession, onClose]);

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    console.log("Speaker toggled. Library might need specific control.");
  };

  const toggleMute = () => {
    if (!isConnected) return;
    const currentlyMuted = isMuted;
    console.log(
      `Toggling mute button state. Currently ${
        currentlyMuted ? "muted" : "unmuted"
      }.`
    );
    alert(
      "Mute/Unmute control not available via this hook structure. Button state reflects reported state."
    );
  };

  const getStatusMessage = () => {
    if (currentError) return `Error: ${currentError}`;
    if (isConnecting) return "Connecting...";
    if (isConnected) return isMuted ? "Muted" : "Connected";
    if (currentStatus === "disconnecting") return "Disconnecting...";
    if (currentStatus === "disconnected" && isVisible) return "Initializing...";
    return "";
  };

  const provideFeedback = (type: string) => {
    console.log(`Feedback provided: ${type}`);
  };

  const handleToolAction = (action: any) => {
    console.log("Tool action triggered:", action);
    alert(`Action triggered: ${JSON.stringify(action)}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.modalContainer}>
        <View style={styles.speakerButtonContainer}>
          <TouchableOpacity
            style={[
              styles.circularButton,
              {
                backgroundColor: isSpeakerOn
                  ? theme.foreground
                  : theme.secondary,
                opacity: !isConnected ? 0.7 : 1,
              },
            ]}
            onPress={toggleSpeaker}
            disabled={!isConnected}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isSpeakerOn ? "volume-up" : "volume-down"}
              size={24}
              color={isSpeakerOn ? theme.background : theme.foreground}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.centerContentContainer}>
          <View style={{ flex: 0.5 }} />

          <View style={styles.pulseOrOutputContainer}>
            {currentToolOutput && toolData ? (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <ToolOutput
                  data={toolData}
                  assistantMessage={displayedMessage}
                  onAction={handleToolAction}
                />
              </ScrollView>
            ) : (
              <MockPulseCircle
                isConnecting={isConnecting}
                isMuted={isMuted}
                theme={theme}
              />
            )}
          </View>

          <View style={styles.historyContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {displayedMessage && (
                <Text
                  style={[
                    styles.historyText,
                    {
                      color: theme.foreground,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {displayedMessage}
                </Text>
              )}
              {currentTranscript && (
                <Text
                  style={[
                    styles.historyText,
                    { color: theme.mutedForeground, textAlign: "left" },
                  ]}
                >
                  {currentTranscript}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: isMuted ? theme.destructive : theme.secondary,
              opacity: !isConnected ? 0.7 : 1,
            },
          ]}
          onPress={toggleMute}
          disabled={!isConnected}
        >
          <MaterialIcons
            name={isMuted ? "mic-off" : "mic"}
            size={28}
            color={theme.foreground}
          />
        </TouchableOpacity>

        <View style={styles.statusMessageContainer}>
          {getStatusMessage() && (
            <ShimmerText text={getStatusMessage()} theme={theme} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.secondary }]}
          onPress={() => {
            provideFeedback("disconnect");
            onClose();
          }}
        >
          <MaterialIcons name="close" size={28} color={theme.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  speakerButtonContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  circularButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContentContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  pulseOrOutputContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    width: "100%",
    height: "70%",
    maxHeight: 400,
  },
  mockPulseCircleBase: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    width: "100%",
    paddingHorizontal: 12,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  historyContainer: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 16,
  },
  historyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  bottomBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  statusMessageContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
});

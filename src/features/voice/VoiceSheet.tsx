import React from "react";
import { Modal, SafeAreaView, useColorScheme } from "react-native";
import ConvAI from "./ConvAI";
import { colors } from "../../theme/colors";

interface VoiceSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function VoiceSheet({ isVisible, onClose }: VoiceSheetProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ConvAI isVisible={isVisible} onClose={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

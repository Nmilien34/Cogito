import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import VoiceSheet from "../../src/features/voice/VoiceSheet";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Svg, {
  Path,
  G,
  Circle,
  Polygon,
  LinearGradient,
  Defs,
} from "react-native-svg";
import { colors } from "../../src/theme/colors";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [isVoiceSheetVisible, setIsVoiceSheetVisible] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  // Animation values for the text rotation
  const animationValue = useRef(new Animated.Value(0)).current;
  const [buttonTextIndex, setButtonTextIndex] = useState(0);
  const buttonTexts = [
    "What does NFT mean?",
    "How to remove stains?",
    "When is the tax deadline?",
    "How to integrate OpenAI?",
    "Why is the sky blue?",
    "What is the news today?",
    "How long to cook rice?",
    "Summarize my unread emails",
    "Where is my package?",
  ];

  // Start the animation cycle
  useEffect(() => {
    const startAnimation = () => {
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 450,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        animationValue.setValue(0);
        setButtonTextIndex((prev) => (prev + 1) % buttonTexts.length);

        // Longer pause between switches (1.5 seconds)
        setTimeout(startAnimation, 2000);
      });
    };

    startAnimation();

    return () => {
      // Cleanup
      animationValue.stopAnimation();
    };
  }, []);

  // Calculate positions for three text items (current, next, previous)
  const position1 = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30], // Move upward and out of view
  });

  const opacity1 = animationValue.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  const position2 = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0], // Move from below into view
  });

  const opacity2 = animationValue.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1, 1],
  });

  const position3 = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 30], // Next one waiting below
  });

  const opacity3 = animationValue.interpolate({
    inputRange: [0, 0.4, 0.8, 1],
    outputRange: [0, 0, 0.5, 0.5],
  });

  const openVoiceSheet = async () => {
    // Simple haptic feedback when button is pressed
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Initialize audio session before playing sound
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Play preconnect sound
      const { sound } = await Audio.Sound.createAsync(
        require("../../src/assets/sounds/preconnect.mp3")
      );
      await sound.playAsync();
    } catch (error) {
      console.error("Error playing sound:", error);
    }

    setIsVoiceSheetVisible(true);
  };

  const closeVoiceSheet = () => {
    setIsVoiceSheetVisible(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <MaterialIcons
            name="logout"
            size={24}
            color={theme.mutedForeground}
          />
        </TouchableOpacity>
        <Image
          source={
            colorScheme === "dark"
              ? require("../../src/assets/Boltzman-logo-dark.png")
              : require("../../src/assets/Boltzman-logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />
        {user?.avatar ? (
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              resizeMode="cover"
              onLoadStart={() => setIsAvatarLoading(true)}
              onLoadEnd={() => setIsAvatarLoading(false)}
              onError={() => {
                setIsAvatarLoading(false);
                setAvatarError(true);
              }}
            />
            {isAvatarLoading && (
              <ActivityIndicator
                style={styles.avatarLoader}
                color={theme.foreground}
              />
            )}
          </View>
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.secondary },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.foreground }]}>
              {user?.firstName?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: theme.foreground }]}>
            How can I help you today, {user?.firstName || "there"}?
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            {
              borderColor: theme.border,
            },
          ]}
          onPress={openVoiceSheet}
        >
          <MaterialIcons name="mic" size={24} color={theme.foreground} />
          <View style={styles.animatedTextContainer}>
            <Animated.Text
              style={[
                styles.voiceButtonText,
                {
                  color: theme.foreground,
                  opacity: opacity1,
                  transform: [{ translateY: position1 }],
                  position: "absolute",
                },
              ]}
            >
              {buttonTexts[buttonTextIndex]}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.voiceButtonText,
                {
                  color: theme.foreground,
                  opacity: opacity2,
                  transform: [{ translateY: position2 }],
                  position: "absolute",
                },
              ]}
            >
              {buttonTexts[(buttonTextIndex + 1) % buttonTexts.length]}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.voiceButtonText,
                {
                  color: theme.foreground,
                  opacity: opacity3,
                  transform: [{ translateY: position3 }],
                  position: "absolute",
                },
              ]}
            >
              {buttonTexts[(buttonTextIndex + 2) % buttonTexts.length]}
            </Animated.Text>
          </View>
          <MaterialIcons name="graphic-eq" size={20} color={theme.foreground} />
        </TouchableOpacity>
      </View>

      <VoiceSheet isVisible={isVoiceSheetVisible} onClose={closeVoiceSheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerRight: {
    width: 24,
  },
  logoutButton: {
    padding: 4,
  },
  logo: {
    height: 28,
    width: 120,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeContainer: {
    alignItems: "center",
    maxWidth: 300,
    gap: 12,
    marginBottom: 160,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 44,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 40,
    gap: 12,
    borderWidth: 2,
    shadowRadius: 12,
  },
  animatedTextContainer: {
    flex: 1,
    height: 40,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  voiceButtonText: {
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
    textShadowColor: "rgba(255,255,255,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

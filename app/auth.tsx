import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useGoogleAuth } from "../src/hooks/useGoogleAuth";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "../src/theme/colors";
import { Image } from "expo-image";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Use the same splash image as background
const BACKGROUND_IMAGE = require("../src/assets/splash.png");

export default function AuthScreen() {
  const { user } = useAuth();
  const {
    signIn: googleSignIn,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  // Hide splash screen once the component is mounted
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (err) {
      console.error("Google sign in error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={BACKGROUND_IMAGE}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        placeholder={blurhash}
      />
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <View style={styles.authContainer}>
            <TouchableOpacity
              style={[styles.authButton, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <View style={styles.googleIconContainer}>
                <GoogleIcon color="#000000" />
              </View>
              <Text style={styles.authButtonText}>Continue with Google</Text>
              <View style={{ width: 20, height: 20 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authButton, styles.emailButton]}
              onPress={() => router.push("/email-auth")}
            >
              <View style={styles.emailIconContainer}>
                <Ionicons name="mail" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.authButtonText, styles.emailButtonText]}>
                Continue with email
              </Text>
              <View style={{ width: 20, height: 20 }} />
            </TouchableOpacity>

            {googleError && <Text style={styles.errorText}>{googleError}</Text>}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{" "}
              <Text
                style={styles.footerLink}
                onPress={() =>
                  Linking.openURL("https://www.boltzman.ai/terms-of-service")
                }
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={styles.footerLink}
                onPress={() =>
                  Linking.openURL("https://www.boltzman.ai/privacy-policy")
                }
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// This is a placeholder blurhash - you should generate a proper one for your image
const blurhash = "L6PZfSi_.AyE_3t7t7R**0o#DgR4"; // You should replace this with a proper blurhash for your image

const GoogleIcon = ({ color }: { color: string }) => (
  <View style={styles.googleIcon}>
    <Ionicons name="logo-google" size={20} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "flex-end",
    paddingBottom: 48,
  },
  authContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 12,
    marginBottom: 32,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    opacity: 0.8,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
  },
  emailButton: {
    backgroundColor: "#4D4D4D",
  },
  googleIconContainer: {
    marginRight: 8,
  },
  emailIconContainer: {
    marginRight: 8,
  },
  googleIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  emailButtonText: {
    color: "#FFFFFF",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    alignItems: "center",
    maxWidth: 210,
    alignSelf: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  footerLink: {
    color: "#FFFFFF",
  },
});

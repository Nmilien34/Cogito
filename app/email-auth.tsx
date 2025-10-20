import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const colors = {
  light: {
    background: "#FFFFFF",
    foreground: "#000000",
    muted: "#666666",
    input: "#F5F5F5",
    border: "#E5E5E5",
    primary: "#007AFF",
    error: "#FF3B30",
  },
  dark: {
    background: "#000000",
    foreground: "#FFFFFF",
    muted: "#999999",
    input: "#1C1C1E",
    border: "#2C2C2E",
    primary: "#0A84FF",
    error: "#FF453A",
  },
};

export default function EmailAuthScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  const {
    signInWithEmail,
    verifyEmailCode,
    error: authError,
    isLoading: authLoading,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const handleEmailSubmit = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    try {
      await signInWithEmail(email);
      setShowEmailOtp(true);
      clearError();
    } catch (err) {
      console.error("Email sign in error:", err);
    }
  };

  const handleEmailOtpSubmit = async () => {
    try {
      await verifyEmailCode(email, emailOtp);
      router.replace("/");
    } catch (err) {
      console.error("OTP verification error:", err);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.foreground} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.foreground }]}>
              {showEmailOtp ? "Enter verification code" : "Sign in with email"}
            </Text>
            {showEmailOtp && (
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                We've sent a 6-digit code to {email}
              </Text>
            )}
          </View>

          {!showEmailOtp ? (
            <View style={styles.formContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input,
                    color: theme.foreground,
                    borderColor: theme.border,
                  },
                  emailError && styles.inputError,
                ]}
                placeholder="Enter your email address"
                placeholderTextColor={theme.muted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError(null);
                  clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!authLoading}
              />
              {emailError && (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {emailError}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleEmailSubmit}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <TextInput
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.input,
                    color: theme.foreground,
                    borderColor: theme.border,
                  },
                ]}
                value={emailOtp}
                onChangeText={setEmailOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={theme.muted}
                editable={!authLoading}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.primary },
                  emailOtp.length !== 6 && styles.disabledButton,
                ]}
                onPress={handleEmailOtpSubmit}
                disabled={authLoading || emailOtp.length !== 6}
              >
                {authLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setShowEmailOtp(false);
                  setEmailOtp("");
                  clearError();
                }}
                disabled={authLoading}
              >
                <Text style={[styles.textButtonText, { color: theme.primary }]}>
                  Try a different method
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {authError && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {authError}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
  },
  otpInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  textButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
});

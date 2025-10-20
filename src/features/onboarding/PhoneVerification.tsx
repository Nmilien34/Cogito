import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { User } from "../../types/user";
import PhoneInput from "./PhoneInput";
import { colors } from "../../theme/colors";

interface PhoneVerificationProps {
  onComplete: () => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  theme: typeof colors.dark;
}

interface SendOtpResponse {
  message: string;
}

interface VerifyOtpResponse {
  user: User;
  meta: {
    needsPhoneVerification: boolean;
    needsNames: boolean;
    needsTermsAcceptance: boolean;
  };
}

export default function PhoneVerification({
  onComplete,
  phone,
  onPhoneChange,
  theme,
}: PhoneVerificationProps) {
  const { updateAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");

  // Format the phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, "");
    const parts = {
      areaCode: digits.slice(0, 3),
      prefix: digits.slice(3, 6),
      line: digits.slice(6, 10),
    };

    let formatted = "";
    if (parts.areaCode) formatted += `(${parts.areaCode}`;
    if (parts.prefix) formatted += `) ${parts.prefix}`;
    if (parts.line) formatted += `-${parts.line}`;

    return formatted;
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<SendOtpResponse>(
        "/api/auth/phone/send-otp",
        {
          phoneNumber: phone,
        }
      );

      setShowOtp(true);
      console.log(response.data.message);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send verification code"
      );
      setShowOtp(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post<VerifyOtpResponse>(
        "/api/auth/phone/verify-otp",
        {
          phoneNumber: phone,
          code: otp,
        }
      );

      // Update both user and meta state
      await updateAuth(data.user, data.meta);

      // Check if we still need phone verification
      if (!data.meta.needsPhoneVerification) {
        onComplete();
      } else {
        setError("Phone verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!showOtp ? (
        <View style={styles.form}>
          <PhoneInput
            value={phone}
            onChange={onPhoneChange}
            error={error || undefined}
            disabled={loading}
            theme={theme}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !phone.trim()) && styles.disabledButton,
                { flex: 1 },
              ]}
              onPress={handleSendOtp}
              disabled={loading || !phone.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.otpMessage, { color: theme.mutedForeground }]}>
            Enter the 6-digit code sent to {phone}
          </Text>
          <TextInput
            style={[
              styles.otpInput,
              { backgroundColor: theme.input, color: theme.foreground },
              error && styles.inputError,
            ]}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, "").slice(0, 6));
              if (error) setError(null);
            }}
            placeholder="000000"
            placeholderTextColor={theme.mutedForeground}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => {
              setShowOtp(false);
              setOtp("");
            }}
            disabled={loading}
          >
            <Text style={[styles.resendButtonText, { color: theme.primary }]}>
              Try a different number
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            {showOtp ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowOtp(false);
                  setOtp("");
                }}
                disabled={loading}
              >
                <Text
                  style={[styles.backButtonText, { color: theme.foreground }]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!showOtp ? !phone.trim() : otp.length !== 6 || loading) &&
                  styles.disabledButton,
                !showOtp && { flex: 1 },
              ]}
              onPress={showOtp ? handleVerifyOtp : handleSendOtp}
              disabled={
                !showOtp
                  ? loading || !phone.trim()
                  : loading || otp.length !== 6
              }
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {!showOtp ? "Send Code" : "Verify"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error && (
        <Text style={[styles.errorText, { color: theme.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    marginTop: 0,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#B0B0B0",
  },
  otpMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  otpInput: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 24,
  },
  resendButton: {
    alignItems: "center",
    marginBottom: 24,
  },
  resendButtonText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Linking,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import Checkbox from "../../components/ui/Checkbox";
import { User } from "../../types/user";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../theme/colors";

interface NameAndTermsFormProps {
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
  onFirstNameChange: (firstName: string) => void;
  onLastNameChange: (lastName: string) => void;
  onTermsAcceptedChange: (accepted: boolean) => void;
  onBack: () => void;
  theme: typeof colors.dark;
}

interface SetNamesAndTermsResponse {
  user: User;
  meta: {
    needsPhoneVerification: boolean;
    needsNames: boolean;
    needsTermsAcceptance: boolean;
  };
}

export default function NameAndTermsForm({
  firstName,
  lastName,
  termsAccepted,
  onFirstNameChange,
  onLastNameChange,
  onTermsAcceptedChange,
  onBack,
  theme,
}: NameAndTermsFormProps) {
  const { updateAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async () => {
    if (!showTerms && firstName.trim() && lastName.trim()) {
      setShowTerms(true);
      return;
    }

    if (!termsAccepted) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post<SetNamesAndTermsResponse>(
        "/api/auth/set-names-and-terms",
        {
          firstName,
          lastName,
          termsAccepted: true,
        }
      );

      await updateAuth(data.user, data.meta);

      if (
        !data.meta.needsPhoneVerification &&
        !data.meta.needsTermsAcceptance &&
        !data.meta.needsNames
      ) {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.foreground }]}>
              First Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.input, color: theme.foreground },
                error && styles.inputError,
              ]}
              value={firstName}
              onChangeText={onFirstNameChange}
              placeholder="Enter your first name"
              placeholderTextColor={theme.mutedForeground}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.foreground }]}>
              Last Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.input, color: theme.foreground },
                error && styles.inputError,
              ]}
              value={lastName}
              onChangeText={onLastNameChange}
              placeholder="Enter your last name"
              placeholderTextColor={theme.mutedForeground}
              editable={!loading}
            />
          </View>

          <View style={styles.termsContainer}>
            <Checkbox
              checked={termsAccepted}
              onValueChange={onTermsAcceptedChange}
              disabled={loading}
              theme={theme}
            />
            <Text style={[styles.termsText, { color: theme.foreground }]}>
              I accept the{" "}
              <Text
                style={[styles.termsLink, { color: theme.primary }]}
                onPress={() =>
                  Linking.openURL("https://www.boltzman.ai/terms-of-service")
                }
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={[styles.termsLink, { color: theme.primary }]}
                onPress={() =>
                  Linking.openURL("https://www.boltzman.ai/privacy-policy")
                }
              >
                Privacy Policy
              </Text>
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.input }]}
              onPress={onBack}
              disabled={loading}
            >
              <Text
                style={[styles.backButtonText, { color: theme.foreground }]}
              >
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!firstName.trim() ||
                  !lastName.trim() ||
                  !termsAccepted ||
                  loading) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={
                !firstName.trim() ||
                !lastName.trim() ||
                !termsAccepted ||
                loading
              }
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <Text style={[styles.errorText, { color: theme.destructive }]}>
            {error}
          </Text>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  termsContainer: {
    marginTop: 32,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
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
  errorText: {
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
});

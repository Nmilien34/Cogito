import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import PhoneVerification from "../src/features/onboarding/PhoneVerification";
import NameAndTermsForm from "../src/features/onboarding/NameAndTermsForm";
import { colors } from "../src/theme/colors";

interface OnboardingState {
  phone: string;
  firstName: string;
  lastName: string;
  termsAccepted: boolean;
  currentStep: "phone" | "namesAndTerms";
}

export default function OnboardScreen() {
  const { user, meta, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;
  const [state, setState] = useState<OnboardingState>({
    phone: "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    termsAccepted: false,
    currentStep: "phone",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const navigate = async () => {
      try {
        if (!user) {
          await router.push("/auth");
          return;
        }

        if (
          meta &&
          !meta.needsPhoneVerification &&
          !meta.needsNames &&
          !meta.needsTermsAcceptance
        ) {
          await router.push("/(tabs)");
          return;
        }

        if (meta?.needsPhoneVerification) {
          setState((prev) => ({ ...prev, currentStep: "phone" }));
        } else if (meta?.needsNames || meta?.needsTermsAcceptance) {
          setState((prev) => ({ ...prev, currentStep: "namesAndTerms" }));
        }
      } catch (error) {
        console.error("Navigation error:", error);
      }
    };

    navigate();
  }, [user, meta, mounted]);

  const handlePhoneComplete = () => {
    setState((prev) => ({ ...prev, currentStep: "namesAndTerms" }));
  };

  const handleBack = () => {
    setState((prev) => ({ ...prev, currentStep: "phone" }));
  };

  const renderStep = () => {
    if (!user) return null;

    switch (state.currentStep) {
      case "phone":
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.foreground }]}>
                Verify your phone
              </Text>
              <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                We'll send you a code to verify your phone number
              </Text>
              <View style={styles.userInfo}>
                <Text
                  style={[styles.userEmail, { color: theme.mutedForeground }]}
                >
                  Logged in as {user.email}
                </Text>
                <TouchableOpacity onPress={signOut}>
                  <Text style={[styles.logoutText, { color: theme.primary }]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <PhoneVerification
              onComplete={handlePhoneComplete}
              phone={state.phone}
              onPhoneChange={(phone) =>
                setState((prev) => ({ ...prev, phone }))
              }
              theme={theme}
            />
          </View>
        );
      case "namesAndTerms":
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.foreground }]}>
                Complete your profile
              </Text>
              <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                Please provide your name and accept the terms to continue
              </Text>
              <View style={styles.userInfo}>
                <Text
                  style={[styles.userEmail, { color: theme.mutedForeground }]}
                >
                  Logged in as {user.email}
                </Text>
                <TouchableOpacity onPress={signOut}>
                  <Text style={[styles.logoutText, { color: theme.primary }]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <NameAndTermsForm
              firstName={state.firstName}
              lastName={state.lastName}
              termsAccepted={state.termsAccepted}
              onFirstNameChange={(firstName) =>
                setState((prev) => ({ ...prev, firstName }))
              }
              onLastNameChange={(lastName) =>
                setState((prev) => ({ ...prev, lastName }))
              }
              onTermsAcceptedChange={(termsAccepted) =>
                setState((prev) => ({ ...prev, termsAccepted }))
              }
              onBack={handleBack}
              theme={theme}
            />
          </View>
        );
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      {renderStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: "500",
  },
  logoutText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "600",
  },
});

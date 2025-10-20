import React from "react";
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { useAuth } from "../src/context/AuthContext";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { colors } from "../src/theme/colors";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading, meta } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000000",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (
    meta &&
    (meta.needsPhoneVerification ||
      meta.needsNames ||
      meta.needsTermsAcceptance)
  ) {
    return <Redirect href="/onboard" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ presentation: "card" }} />
          <Stack.Screen name="onboard" options={{ presentation: "card" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

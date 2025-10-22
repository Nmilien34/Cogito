/**
 * Root Layout for FM Radio Voice AI App
 * Simplified version without complex authentication flows
 */

import React from "react";
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="radio" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

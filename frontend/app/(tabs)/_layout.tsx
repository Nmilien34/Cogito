import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthWrapper } from "../_layout";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthWrapper>
      <Tabs
        screenOptions={{
          tabBarStyle: { display: "none" },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="comment" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="memory"
          options={{
            title: "Memory",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="lightbulb-o" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: "Tools",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="wrench" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="book" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthWrapper>
  );
}

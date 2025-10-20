import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const LogoPlaceholder = ({ size = 80, color = "#007AFF" }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={[styles.text, { color }]}>B</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: "#F0F8FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  text: {
    fontSize: 40,
    fontWeight: "bold",
  },
});

export default LogoPlaceholder;

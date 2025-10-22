import React from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  theme: typeof colors.dark;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  theme,
}: PhoneInputProps) {
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

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={[styles.countryCode, { color: theme.foreground }]}>
          +1
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.input, color: theme.foreground },
            error && styles.inputError,
          ]}
          value={formatPhoneNumber(value)}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, "");
            if (digits.length <= 10) {
              onChange(digits);
            }
          }}
          placeholder="(555) 555-5555"
          placeholderTextColor={theme.mutedForeground}
          keyboardType="phone-pad"
          maxLength={14}
          editable={!disabled}
        />
      </View>
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
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    marginRight: 8,
    fontSize: 16,
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
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
});

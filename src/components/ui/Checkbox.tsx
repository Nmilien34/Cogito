import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

interface CheckboxProps {
  checked: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  theme: typeof colors.dark;
}

export default function Checkbox({
  checked,
  onValueChange,
  disabled = false,
  theme,
}: CheckboxProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        checked && styles.checked,
        disabled && styles.disabled,
        {
          borderColor: checked ? theme.primary : theme.border,
          backgroundColor: checked ? theme.primary : theme.background,
        },
      ]}
      onPress={() => !disabled && onValueChange(!checked)}
      disabled={disabled}
    >
      {checked && (
        <MaterialIcons name="check" size={16} color={theme.primaryForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: {
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});

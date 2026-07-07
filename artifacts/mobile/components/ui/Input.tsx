import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  type TextInputProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof Feather>["name"];
  rightIcon?: React.ComponentProps<typeof Feather>["name"];
  onRightIconPress?: () => void;
  multiline?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  multiline,
  ...props
}: InputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const isPassword = secureTextEntry;
  const actualSecure = isPassword ? !showPassword : false;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            borderColor: error
              ? colors.destructive
              : focused
              ? colors.primary
              : colors.input,
            backgroundColor: colors.card,
            borderRadius: colors.radius,
          },
          multiline && { height: 90, alignItems: "flex-start" },
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={16}
            color={focused ? colors.primary : colors.mutedForeground}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
            },
            multiline && { height: 80, textAlignVertical: "top", paddingTop: 10 },
          ]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={actualSecure}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.rightIcon}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
        {rightIcon && !isPassword && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather name={rightIcon} size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    height: 48,
    paddingHorizontal: 12,
  },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

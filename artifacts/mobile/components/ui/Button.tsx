import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface ButtonProps extends Omit<PressableProps, "onPress"> {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  loading = false,
  variant = "primary",
  size = "md",
  disabled = false,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
      ? colors.secondary
      : variant === "destructive"
      ? colors.destructive
      : "transparent";

  const textColor =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "secondary"
      ? colors.secondaryForeground
      : variant === "destructive"
      ? colors.destructiveForeground
      : colors.primary;

  const height = size === "sm" ? 38 : size === "md" ? 48 : 54;
  const fontSize = size === "sm" ? 13 : size === "md" ? 15 : 16;

  async function handlePress() {
    if (!onPress || disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          height,
          borderRadius: colors.radius,
          opacity: pressed || disabled ? 0.7 : 1,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: variant === "ghost" ? colors.border : undefined,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor, fontSize }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
  },
});

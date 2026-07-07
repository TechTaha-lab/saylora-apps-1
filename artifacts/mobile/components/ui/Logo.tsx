import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const colors = useColors();
  const fontSize = size === "sm" ? 18 : size === "md" ? 24 : 32;
  const dotSize = size === "sm" ? 6 : size === "md" ? 8 : 10;

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { fontSize, color: colors.primary }]}>
        saylora
      </Text>
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            backgroundColor: colors.primary,
            borderRadius: dotSize / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  text: {
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  dot: {
    marginBottom: 4,
  },
});

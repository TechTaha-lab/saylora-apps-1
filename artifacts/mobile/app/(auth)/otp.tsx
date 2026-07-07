import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useVerifyOtp } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email, flow } = useLocalSearchParams<{ email: string; flow: string }>();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const mutation = useVerifyOtp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleVerify() {
    if (!otp.trim() || otp.length < 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    try {
      const result = await mutation.mutateAsync({ data: { email: email ?? "", otp: otp.trim() } });
      router.push({
        pathname: "/(auth)/reset-password",
        params: { resetToken: result.resetToken },
      });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Invalid or expired code.";
      Alert.alert("Error", msg);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad + 32 }]}>
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { paddingHorizontal: 24 }]}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.secondary, borderRadius: 20 }]}>
          <Feather name="mail" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          We sent a 6-digit code to{"\n"}
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
        </Text>

        <Input
          label="Verification Code"
          placeholder="000000"
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          leftIcon="key"
          error={error}
        />

        <Button title="Verify Code" onPress={handleVerify} loading={mutation.isPending} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingTop: 16, alignSelf: "flex-start" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 20 },
  iconBox: { width: 72, height: 72, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});

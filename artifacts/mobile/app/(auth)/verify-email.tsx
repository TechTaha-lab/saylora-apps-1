import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useVerifyEmail, useResendVerification } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function VerifyEmailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { user, updateUser } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleVerify() {
    if (!otp.trim() || otp.length < 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    try {
      await verifyMutation.mutateAsync({ data: { email: email ?? "", otp: otp.trim() } });
      // Update user in context to reflect verified status
      if (user) {
        await updateUser({ ...user, emailVerified: true });
      }
      Alert.alert("Email Verified!", "Your email has been verified successfully.", [
        { text: "Continue", onPress: () => router.replace("/(home)/") },
      ]);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Invalid code.";
      Alert.alert("Error", msg);
    }
  }

  async function handleResend() {
    try {
      await resendMutation.mutateAsync({ data: { email: email ?? "" } });
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to resend.";
      Alert.alert("Error", msg);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad + 32 }]}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: colors.secondary, borderRadius: 20 }]}>
          <Feather name="mail" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Verify your email</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          We sent a verification code to{"\n"}
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

        <Button title="Verify Email" onPress={handleVerify} loading={verifyMutation.isPending} size="lg" />

        <View style={styles.resendRow}>
          <Text style={[styles.resendText, { color: colors.mutedForeground }]}>Didn't receive the code? </Text>
          <Pressable onPress={handleResend} disabled={resendMutation.isPending}>
            <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace("/(home)/")} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 48, gap: 20, alignItems: "stretch" },
  iconBox: { width: 80, height: 80, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  resendLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

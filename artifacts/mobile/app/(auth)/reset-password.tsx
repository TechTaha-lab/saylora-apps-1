import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useResetPassword } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useResetPassword();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function validate() {
    const e: Record<string, string> = {};
    if (!password || password.length < 8) e["password"] = "Password must be at least 8 characters";
    if (password !== confirm) e["confirm"] = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    try {
      await mutation.mutateAsync({ data: { resetToken: resetToken ?? "", password, confirmPassword: confirm } });
      Alert.alert("Success", "Password reset successfully. Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Reset failed.";
      Alert.alert("Error", msg);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad + 32 }]}>
      <Pressable onPress={() => router.back()} style={[styles.backBtn, { paddingHorizontal: 24 }]}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>New Password</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Create a strong password for your account
        </Text>

        <Input label="New Password" placeholder="Min. 8 characters" value={password} onChangeText={setPassword} secureTextEntry leftIcon="lock" error={errors["password"]} />
        <Input label="Confirm Password" placeholder="Repeat your password" value={confirm} onChangeText={setConfirm} secureTextEntry leftIcon="lock" error={errors["confirm"]} />

        <Button title="Reset Password" onPress={handleReset} loading={mutation.isPending} size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: { paddingTop: 16, alignSelf: "flex-start" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
});

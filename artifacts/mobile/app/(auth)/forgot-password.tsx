import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useForgotPassword } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const mutation = useForgotPassword();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSubmit() {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email"); return; }
    setError("");
    try {
      await mutation.mutateAsync({ data: { email: email.trim().toLowerCase() } });
      router.push({ pathname: "/(auth)/otp", params: { email: email.trim().toLowerCase(), flow: "reset" } });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Something went wrong.";
      Alert.alert("Error", msg);
    }
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <Logo size="md" />

      <View style={styles.hero}>
        <View style={[styles.iconBox, { backgroundColor: colors.secondary, borderRadius: 20 }]}>
          <Feather name="lock" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your email and we'll send a reset code
        </Text>
      </View>

      <Input
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon="mail"
        error={error}
      />

      <Button title="Send Reset Code" onPress={handleSubmit} loading={mutation.isPending} size="lg" />

      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Feather name="arrow-left" size={14} color={colors.primary} />
        <Text style={[styles.backLinkText, { color: colors.primary }]}>Back to sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 20 },
  backBtn: { padding: 4, alignSelf: "flex-start" },
  hero: { alignItems: "center", gap: 12, paddingVertical: 8 },
  iconBox: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  backLinkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = useLogin();

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e["email"] = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e["email"] = "Enter a valid email";
    if (!password) e["password"] = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      const result = await loginMutation.mutateAsync({
        data: { email: email.trim().toLowerCase(), password, rememberMe },
      });
      await login(result.user as Parameters<typeof login>[0], result.accessToken, result.refreshToken);
      if (result.user.isAdmin) {
        router.replace("/(admin)/");
      } else {
        router.replace("/(home)/");
      }
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Login failed. Please try again.";
      Alert.alert("Login Failed", msg);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 20, paddingBottom: bottomPad + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoRow}>
        <Logo size="md" />
      </View>

      <View style={styles.heroText}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Welcome back
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to manage your business
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius + 4, borderColor: colors.border }]}>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon="mail"
          error={errors["email"]}
        />
        <Input
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock"
          error={errors["password"]}
        />

        <View style={styles.row}>
          <Pressable
            onPress={() => setRememberMe((v) => !v)}
            style={styles.checkRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: rememberMe ? colors.primary : colors.border,
                  backgroundColor: rememberMe ? colors.primary : "transparent",
                },
              ]}
            >
              {rememberMe && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text style={[styles.rememberText, { color: colors.mutedForeground }]}>
              Remember me
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </Pressable>
        </View>
      </View>

      <Button
        title="Sign In"
        onPress={handleLogin}
        loading={loginMutation.isPending}
        size="lg"
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
          Don't have an account?{" "}
        </Text>
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Create one
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 20 },
  logoRow: { alignItems: "flex-start" },
  heroText: { gap: 6 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
  card: { padding: 20, gap: 16, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

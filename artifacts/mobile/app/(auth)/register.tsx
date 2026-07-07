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
import { SelectModal } from "@/components/ui/SelectModal";
import {
  useRegister,
  useListCategories,
  useListCountries,
  useListCities,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = useRegister();
  const { data: categories = [] } = useListCategories();
  const { data: countries = [] } = useListCountries();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cities = [] } = useListCities(
    countryId ? { countryId } : undefined,
    { query: { enabled: !!countryId } } as any
  );

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const countryOptions = countries.map((c) => ({ label: `${c.flag ?? ""} ${c.name}`, value: c.id }));
  const cityOptions = cities.map((c) => ({ label: c.name, value: c.id }));

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e["name"] = "Name is required";
    if (!email.trim()) e["email"] = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e["email"] = "Enter a valid email";
    if (!password || password.length < 8) e["password"] = "Password must be at least 8 characters";
    if (!whatsapp.trim()) e["whatsapp"] = "WhatsApp number is required";
    if (!businessName.trim()) e["businessName"] = "Business name is required";
    if (!categoryId) e["categoryId"] = "Please select a category";
    if (!countryId) e["countryId"] = "Please select a country";
    if (!cityId) e["cityId"] = "Please select a city";
    if (!acceptTerms) e["terms"] = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    try {
      const result = await registerMutation.mutateAsync({
        data: {
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          businessName: businessName.trim(),
          categoryId: categoryId!,
          countryId: countryId!,
          cityId: cityId!,
          acceptTerms: true,
        },
      });
      await login(result.user as Parameters<typeof login>[0], result.accessToken, result.refreshToken);
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: result.user.email },
      });
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ??
        "Registration failed. Please try again.";
      Alert.alert("Error", msg);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>

      <Logo size="md" />

      <View style={styles.heroText}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Create your store
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Start your 14-day free trial
        </Text>
      </View>

      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR INFO</Text>
        <View style={styles.fields}>
          <Input label="Full Name *" placeholder="John Doe" value={name} onChangeText={setName} leftIcon="user" error={errors["name"]} />
          <Input label="Email *" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon="mail" error={errors["email"]} />
          <Input label="Password *" placeholder="Min. 8 characters" value={password} onChangeText={setPassword} secureTextEntry leftIcon="lock" error={errors["password"]} />
          <Input label="WhatsApp Number *" placeholder="+1 234 567 8900" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" leftIcon="phone" error={errors["whatsapp"]} />
        </View>
      </View>

      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>YOUR BUSINESS</Text>
        <View style={styles.fields}>
          <Input label="Business Name *" placeholder="My Awesome Store" value={businessName} onChangeText={setBusinessName} leftIcon="briefcase" error={errors["businessName"]} />
          <SelectModal label="Category *" placeholder="Select category" options={categoryOptions} value={categoryId} onChange={(v) => setCategoryId(Number(v))} error={errors["categoryId"]} searchable />
          <SelectModal label="Country *" placeholder="Select country" options={countryOptions} value={countryId} onChange={(v) => { setCountryId(Number(v)); setCityId(null); }} error={errors["countryId"]} searchable />
          {countryId && (
            <SelectModal label="City *" placeholder="Select city" options={cityOptions} value={cityId} onChange={(v) => setCityId(Number(v))} error={errors["cityId"]} searchable />
          )}
        </View>
      </View>

      <Pressable onPress={() => setAcceptTerms((v) => !v)} style={styles.termsRow}>
        <View style={[styles.checkbox, { borderColor: acceptTerms ? colors.primary : errors["terms"] ? colors.destructive : colors.border, backgroundColor: acceptTerms ? colors.primary : "transparent" }]}>
          {acceptTerms && <Feather name="check" size={12} color="#fff" />}
        </View>
        <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
          I agree to the{" "}
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
            Terms of Service
          </Text>
          {" "}and{" "}
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
            Privacy Policy
          </Text>
        </Text>
      </Pressable>
      {errors["terms"] && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{errors["terms"]}</Text>
      )}

      <Button
        title="Create Account"
        onPress={handleRegister}
        loading={registerMutation.isPending}
        size="lg"
      />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have an account? </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>Sign in</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 20 },
  backBtn: { padding: 4, alignSelf: "flex-start" },
  heroText: { gap: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
  section: { gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  fields: { gap: 14 },
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 2 },
  termsText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -12 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

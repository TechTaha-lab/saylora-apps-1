import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@workspace/api-client-react";

const SUPPORT_NUMBER = "96171735478";

function getDaysLeft(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, refreshToken, logout } = useAuth();
  const logoutMutation = useLogout();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const isDeactivated = user?.businessIsActive === false;

  const subType = user?.businessSubscriptionType;
  const expiryDateStr =
    subType === "trial"
      ? user?.businessTrialEndsAt
      : user?.businessSubscriptionExpiresAt;
  const daysLeft = getDaysLeft(expiryDateStr);

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            if (refreshToken) {
              await logoutMutation.mutateAsync({ data: { refreshToken } });
            }
          } catch {}
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  function openStore() {
    if (!user?.businessSlug) return;
    router.push(`/(store)/${user.businessSlug}` as never);
  }

  async function shareStore() {
    if (!user?.businessSlug) return;
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const url = `https://${domain}/store/${user.businessSlug}`;
    try {
      await Linking.openURL(`whatsapp://send?text=Check out my store: ${url}`);
    } catch {
      Alert.alert("Share Store", `Your store link:\n${url}`);
    }
  }

  function openSupportWhatsApp() {
    Linking.openURL(`whatsapp://send?phone=${SUPPORT_NUMBER}&text=Hi, my store account has been deactivated. Can you help me?`)
      .catch(() =>
        Linking.openURL(`https://wa.me/${SUPPORT_NUMBER}?text=Hi, my store account has been deactivated.`)
      );
  }

  const cards = [
    { icon: "package" as const, label: "My Products", sub: "Add and manage items", onPress: () => router.push("/(home)/products"), color: "#7C3AED" },
    { icon: "shopping-bag" as const, label: "Orders", sub: "WhatsApp orders received", onPress: () => router.push("/(home)/orders"), color: "#059669" },
    { icon: "eye" as const, label: "View My Store", sub: "See what customers see", onPress: openStore, color: "#0284C7" },
    { icon: "share-2" as const, label: "Share Store", sub: "Send your store link", onPress: shareStore, color: "#D97706" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Logo size="sm" />
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {isDeactivated ? (
        <View style={[styles.deactivatedContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.deactivatedCard, { backgroundColor: colors.card, borderColor: "#EF444440", borderRadius: colors.radius + 8 }]}>
            <View style={[styles.deactivatedIcon, { backgroundColor: "#EF444422", borderRadius: 40 }]}>
              <Feather name="slash" size={40} color="#EF4444" />
            </View>
            <Text style={[styles.deactivatedTitle, { color: colors.foreground }]}>Store Deactivated</Text>
            <Text style={[styles.deactivatedDesc, { color: colors.mutedForeground }]}>
              Your store has been deactivated. Please contact our support team to reactivate your account.
            </Text>
            <Pressable onPress={openSupportWhatsApp} style={[styles.waBtn, { borderRadius: colors.radius }]}>
              <Feather name="message-circle" size={20} color="#fff" />
              <Text style={styles.waBtnText}>Contact Support on WhatsApp</Text>
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.logoutLink}>
              <Text style={[styles.logoutLinkText, { color: colors.mutedForeground }]}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { borderRadius: colors.radius + 8 }]}
          >
            <View>
              <Text style={styles.heroGreeting}>Welcome back, {user?.name?.split(" ")[0]}</Text>
              {user?.businessName && (
                <Text style={styles.heroStore}>{user.businessName}</Text>
              )}
            </View>
            {!user?.emailVerified && (
              <Pressable
                style={styles.verifyBadge}
                onPress={() => router.push({ pathname: "/(auth)/verify-email", params: { email: user?.email ?? "" } })}
              >
                <Feather name="alert-circle" size={13} color="#fff" />
                <Text style={styles.verifyBadgeText}>Verify email</Text>
              </Pressable>
            )}
          </LinearGradient>

          {daysLeft !== null && (
            <View style={[styles.trialBox, {
              backgroundColor: daysLeft <= 0 ? "#EF444422" : daysLeft <= 3 ? "#F59E0B22" : colors.card,
              borderColor: daysLeft <= 0 ? "#EF444460" : daysLeft <= 3 ? "#F59E0B60" : colors.border,
              borderRadius: colors.radius,
            }]}>
              <Feather name="clock" size={16} color={daysLeft <= 0 ? "#EF4444" : daysLeft <= 3 ? "#F59E0B" : colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.trialLabel, { color: daysLeft <= 0 ? "#EF4444" : daysLeft <= 3 ? "#F59E0B" : colors.foreground }]}>
                  {subType === "trial"
                    ? daysLeft <= 0 ? "Free trial expired" : `Free trial: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                    : daysLeft <= 0 ? "Subscription expired" : `${subType === "monthly" ? "Monthly" : "Yearly"} plan: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                </Text>
                {daysLeft <= 0 && (
                  <Pressable onPress={openSupportWhatsApp}>
                    <Text style={[styles.trialContact, { color: "#25D366" }]}>Contact support to renew →</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MANAGE YOUR STORE</Text>

          <View style={styles.grid}>
            {cards.map((card) => (
              <Pressable
                key={card.label}
                onPress={card.onPress}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.cardIcon, { backgroundColor: card.color + "22", borderRadius: 10 }]}>
                  <Feather name={card.icon} size={22} color={card.color} />
                </View>
                <Text style={[styles.cardLabel, { color: colors.foreground }]}>{card.label}</Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{card.sub}</Text>
              </Pressable>
            ))}
          </View>

          {user?.businessSlug && (
            <View style={[styles.slugBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Feather name="link" size={14} color={colors.primary} />
              <Text style={[styles.slugText, { color: colors.mutedForeground }]} numberOfLines={1}>
                Store: <Text style={{ color: colors.primary }}>/{user.businessSlug}</Text>
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  logoutBtn: { padding: 8 },
  scroll: { padding: 20, gap: 20 },
  heroBanner: { padding: 24, gap: 12 },
  heroGreeting: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.3 },
  heroStore: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },
  verifyBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", marginTop: 4 },
  verifyBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  trialBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderWidth: 1 },
  trialLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  trialContact: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 3 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", padding: 16, gap: 10, borderWidth: 1 },
  cardIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  slugBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderWidth: 1 },
  slugText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  deactivatedContainer: { flex: 1, padding: 24, justifyContent: "center" },
  deactivatedCard: { padding: 32, borderWidth: 1, alignItems: "center", gap: 16 },
  deactivatedIcon: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  deactivatedTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  deactivatedDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#25D366", paddingHorizontal: 24, paddingVertical: 14, width: "100%", justifyContent: "center" },
  waBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  logoutLink: { paddingVertical: 8 },
  logoutLinkText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

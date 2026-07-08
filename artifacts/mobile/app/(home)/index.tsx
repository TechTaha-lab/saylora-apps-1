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
import { useAuth } from "@/context/AuthContext";
import { useListMyProducts } from "@workspace/api-client-react";

const SUPPORT_NUMBER = "96171735478";

function getDaysLeft(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: products = [] } = useListMyProducts();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const isDeactivated = user?.businessIsActive === false;
  const subType = user?.businessSubscriptionType;
  const expiryStr =
    subType === "trial" ? user?.businessTrialEndsAt : user?.businessSubscriptionExpiresAt;
  const daysLeft = getDaysLeft(expiryStr);
  const availableCount = products.filter((p) => p.available).length;

  function openStore() {
    if (user?.businessSlug) router.push(`/(store)/${user.businessSlug}` as never);
  }

  async function shareStore() {
    if (!user?.businessSlug) return;
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const url = `https://${domain}/store/${user.businessSlug}`;
    try {
      await Linking.openURL(`whatsapp://send?text=Check out my store: ${url}`);
    } catch {
      Alert.alert("Store Link", url);
    }
  }

  function openSupportWhatsApp() {
    Linking.openURL(
      `whatsapp://send?phone=${SUPPORT_NUMBER}&text=Hi, my account has been deactivated. Can you help?`
    ).catch(() =>
      Linking.openURL(`https://wa.me/${SUPPORT_NUMBER}`)
    );
  }

  if (isDeactivated) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.deactivatedCenter}>
          <View style={[styles.deactivatedCard, { backgroundColor: colors.card, borderColor: "#EF444430", borderRadius: colors.radius + 8 }]}>
            <View style={[styles.deactivatedIcon, { backgroundColor: "#EF444415", borderRadius: 40 }]}>
              <Feather name="slash" size={36} color={colors.destructive} />
            </View>
            <Text style={[styles.deactivatedTitle, { color: colors.foreground }]}>Store Deactivated</Text>
            <Text style={[styles.deactivatedDesc, { color: colors.mutedForeground }]}>
              Your store has been deactivated. Contact support to resolve this.
            </Text>
            <Pressable
              style={[styles.waBtn, { borderRadius: colors.radius }]}
              onPress={openSupportWhatsApp}
            >
              <Feather name="message-circle" size={20} color="#fff" />
              <Text style={styles.waBtnText}>Contact Support on WhatsApp</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 4, paddingBottom: bottomPad + 100 }]}
      >
        {/* Hero gradient card */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroBanner, { borderRadius: colors.radius + 4 }]}
        >
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroGreeting}>
                {user?.businessName ?? "My Store"}
              </Text>
              {user?.businessSlug ? (
                <Text style={styles.heroSlug}>store/{user.businessSlug}</Text>
              ) : null}
            </View>
            {user?.isAdmin ? (
              <Pressable
                style={styles.adminPill}
                onPress={() => router.push("/(admin)/" as never)}
              >
                <Feather name="shield" size={12} color="#fff" />
                <Text style={styles.adminPillText}>Admin</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{products.length}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{availableCount}</Text>
              <Text style={styles.statLabel}>Live</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {daysLeft !== null ? (daysLeft > 0 ? daysLeft : 0) : "—"}
              </Text>
              <Text style={styles.statLabel}>
                {subType === "trial" ? "Trial days" : "Days left"}
              </Text>
            </View>
          </View>

          {/* Trial / subscription warning */}
          {daysLeft !== null && daysLeft <= 5 && daysLeft >= 0 ? (
            <View style={styles.warningPill}>
              <Feather name="alert-circle" size={13} color="#fff" />
              <Text style={styles.warningText}>
                {daysLeft === 0
                  ? "Trial expired today"
                  : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on trial`}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Email verification banner */}
        {user?.emailVerified === false ? (
          <Pressable
            style={[styles.verifyBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B30", borderRadius: colors.radius }]}
            onPress={() => router.push({ pathname: "/(auth)/verify-email", params: { email: user.email } })}
          >
            <Feather name="mail" size={16} color="#D97706" />
            <Text style={styles.verifyText}>Please verify your email address.</Text>
            <View style={styles.verifyBtn}>
              <Text style={styles.verifyBtnText}>Verify Now</Text>
              <Feather name="chevron-right" size={13} color="#D97706" />
            </View>
          </Pressable>
        ) : null}

        {/* Quick actions */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            icon="eye"
            label="View Store"
            color="#0284C7"
            onPress={openStore}
            colors={colors}
          />
          <QuickAction
            icon="share-2"
            label="Share Store"
            color="#7C3AED"
            onPress={shareStore}
            colors={colors}
          />
          <QuickAction
            icon="message-circle"
            label="Support"
            color="#25D366"
            onPress={openSupportWhatsApp}
            colors={colors}
          />
          {user?.isAdmin ? (
            <QuickAction
              icon="users"
              label="Users"
              color="#D97706"
              onPress={() => router.push("/(admin)/" as never)}
              colors={colors}
            />
          ) : null}
        </View>

        {/* Getting started tips if no products */}
        {products.length === 0 ? (
          <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Get your store ready</Text>
            <TipRow num="1" text="Add products using the Products tab below" colors={colors} />
            <TipRow num="2" text="View your live store page with the link above" colors={colors} />
            <TipRow num="3" text="Share your store link with customers on WhatsApp" colors={colors} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
  colors,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function TipRow({ num, text, colors }: { num: string; text: string; colors: any }) {
  return (
    <View style={styles.tipRow}>
      <View style={[styles.tipNum, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.tipNumText, { color: colors.primary }]}>{num}</Text>
      </View>
      <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },

  heroBanner: { padding: 22, gap: 16 },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroGreeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.4 },
  heroSlug: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", marginTop: 3 },
  adminPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  warningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  warningText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#fff" },

  verifyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  verifyText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#D97706", flex: 1 },
  verifyBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  verifyBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#D97706" },

  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: -6 },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", padding: 18, gap: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: "flex-start" },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  tipsCard: { padding: 20, borderWidth: StyleSheet.hairlineWidth, gap: 14 },
  tipsTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tipNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  deactivatedCenter: { flex: 1, padding: 24, justifyContent: "center" },
  deactivatedCard: { padding: 32, borderWidth: 1, alignItems: "center", gap: 16 },
  deactivatedIcon: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  deactivatedTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  deactivatedDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#25D366", paddingHorizontal: 24, paddingVertical: 14, width: "100%", justifyContent: "center" },
  waBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

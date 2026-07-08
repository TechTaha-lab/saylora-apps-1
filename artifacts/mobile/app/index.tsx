import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useListStores, type StorePreview } from "@workspace/api-client-react";
import { Logo } from "@/components/ui/Logo";

// Category icon mapping
function categoryIcon(category: string | null | undefined): string {
  const c = (category ?? "").toLowerCase();
  if (c.includes("fashion") || c.includes("cloth")) return "shopping-bag";
  if (c.includes("food") || c.includes("restaurant")) return "coffee";
  if (c.includes("tech") || c.includes("electr")) return "cpu";
  if (c.includes("beauty") || c.includes("cosmet")) return "heart";
  if (c.includes("home") || c.includes("furni")) return "home";
  if (c.includes("sport")) return "activity";
  if (c.includes("book")) return "book";
  if (c.includes("art") || c.includes("craft")) return "feather";
  return "shopping-bag";
}

// Accent colors for store cards
const CARD_ACCENTS = [
  "#7C3AED", "#0284C7", "#059669", "#D97706",
  "#DC2626", "#7C3AED", "#2563EB", "#DB2777",
];

function StoreCard({
  store,
  index,
  colors,
}: {
  store: StorePreview;
  index: number;
  colors: ReturnType<typeof useColors>;
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const initials = store.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.storeCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() => router.push(`/(store)/${store.slug}` as never)}
    >
      {/* Logo / Avatar */}
      <View style={[styles.storeAvatar, { backgroundColor: accent + "18", borderRadius: 16 }]}>
        {store.logo ? (
          <Image source={{ uri: store.logo }} style={styles.storeLogoImg} />
        ) : (
          <Text style={[styles.storeInitials, { color: accent }]}>{initials}</Text>
        )}
      </View>

      <View style={styles.storeInfo}>
        <Text style={[styles.storeName, { color: colors.foreground }]} numberOfLines={1}>
          {store.name}
        </Text>
        {store.category ? (
          <View style={styles.storeTagRow}>
            <Feather
              name={categoryIcon(store.category) as any}
              size={11}
              color={colors.mutedForeground}
            />
            <Text style={[styles.storeTag, { color: colors.mutedForeground }]}>
              {store.category}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.storeRight}>
        <View style={[styles.productBadge, { backgroundColor: accent + "15" }]}>
          <Text style={[styles.productCount, { color: accent }]}>
            {store.productCount}
          </Text>
          <Text style={[styles.productLabel, { color: accent }]}>items</Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

function FeaturePill({
  icon,
  label,
  colors,
}: {
  icon: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.featurePill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
      <Feather name={icon as any} size={13} color="rgba(255,255,255,0.9)" />
      <Text style={styles.featurePillText}>{label}</Text>
    </View>
  );
}

export default function LandingScreen() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: stores = [] } = useListStores();

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, []);

  // Redirect authenticated users
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      if (user?.isAdmin) {
        router.replace("/(admin)/");
      } else {
        router.replace("/(home)/");
      }
    }
  }, [isLoading, isAuthenticated, user]);

  // Still loading auth
  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
        <Logo size="md" />
      </View>
    );
  }

  // Authenticated users see nothing while redirecting
  if (isAuthenticated) return null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Animated.View style={[styles.root, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + 120 },
        ]}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topPad + 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }]}
        >
          {/* Brand */}
          <View style={styles.heroLogo}>
            <Text style={styles.heroLogoText}>saylora</Text>
            <View style={styles.logoDot} />
          </View>

          {/* Tagline */}
          <Text style={styles.heroTitle}>
            Your digital storefront,{"\n"}powered by WhatsApp
          </Text>
          <Text style={styles.heroSub}>
            Create a beautiful online store, showcase your products, and receive orders directly through WhatsApp — no tech skills needed.
          </Text>

          {/* Feature pills */}
          <View style={styles.featurePills}>
            <FeaturePill icon="zap" label="Instant setup" colors={colors} />
            <FeaturePill icon="message-circle" label="WhatsApp orders" colors={colors} />
            <FeaturePill icon="globe" label="Public store link" colors={colors} />
          </View>

          {/* Stats bar */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{stores.length}</Text>
              <Text style={styles.heroStatLabel}>Live Stores</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>
                {stores.reduce((sum, s) => sum + s.productCount, 0)}
              </Text>
              <Text style={styles.heroStatLabel}>Products Listed</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>Free</Text>
              <Text style={styles.heroStatLabel}>14-day Trial</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Store Listings ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Live Stores
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Browse stores built on Saylora
              </Text>
            </View>
            {stores.length > 0 && (
              <View style={[styles.storeBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.storeBadgeText, { color: colors.primary }]}>
                  {stores.length} online
                </Text>
              </View>
            )}
          </View>

          {stores.length === 0 ? (
            <View style={[styles.emptyStores, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondary, borderRadius: 28 }]}>
                <Feather name="shopping-bag" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Be the first!</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                No stores yet. Create yours in minutes and start selling today.
              </Text>
            </View>
          ) : (
            <View style={styles.storeList}>
              {stores.map((store, i) => (
                <StoreCard key={store.id} store={store} index={i} colors={colors} />
              ))}
            </View>
          )}
        </View>

        {/* ── How it works ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How it works</Text>
          <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
            {[
              { icon: "user-plus", title: "Create your account", desc: "Sign up in seconds — no credit card required." },
              { icon: "package", title: "Add your products", desc: "Upload photos, set prices, write descriptions." },
              { icon: "share-2", title: "Share your store link", desc: "Send it on WhatsApp, Instagram, or anywhere." },
              { icon: "message-circle", title: "Receive orders via WhatsApp", desc: "Customers tap 'Order' and message you directly." },
            ].map((step, i, arr) => (
              <View key={i} style={styles.howStep}>
                <View style={styles.howLeft}>
                  <View style={[styles.howIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name={step.icon as any} size={18} color={colors.primary} />
                  </View>
                  {i < arr.length - 1 && (
                    <View style={[styles.howLine, { backgroundColor: colors.border }]} />
                  )}
                </View>
                <View style={styles.howContent}>
                  <Text style={[styles.howTitle, { color: colors.foreground }]}>{step.title}</Text>
                  <Text style={[styles.howDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed bottom CTA ── */}
      <View
        style={[
          styles.ctaBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 8,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.ctaSecondary,
            {
              borderColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={[styles.ctaSecondaryText, { color: colors.primary }]}>Sign In</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.ctaPrimary,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.ctaPrimaryText}>Get Started Free</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { gap: 0 },

  // Hero
  hero: { paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  heroLogo: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 8 },
  heroLogoText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.5 },
  logoDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.7)", marginBottom: -8 },
  heroTitle: { fontSize: 30, fontFamily: "Inter_700Bold", color: "#fff", lineHeight: 38, letterSpacing: -0.6 },
  heroSub: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.82)", lineHeight: 22 },

  featurePills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featurePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20 },
  featurePillText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },

  heroStats: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, marginTop: 4 },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  heroStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.72)", marginTop: 3 },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  // Section
  section: { padding: 20, gap: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 3 },
  storeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  storeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // Store cards
  storeList: { gap: 10 },
  storeCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  storeAvatar: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  storeLogoImg: { width: 52, height: 52, borderRadius: 12 },
  storeInitials: { fontSize: 18, fontFamily: "Inter_700Bold" },
  storeInfo: { flex: 1, gap: 4 },
  storeName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  storeTagRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  storeTag: { fontSize: 12, fontFamily: "Inter_400Regular" },
  storeRight: { alignItems: "center", gap: 6 },
  productBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignItems: "center" },
  productCount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  productLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },

  // Empty stores
  emptyStores: { padding: 32, alignItems: "center", gap: 12, borderWidth: StyleSheet.hairlineWidth },
  emptyIcon: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  // How it works
  howCard: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden", paddingVertical: 8 },
  howStep: { flexDirection: "row", gap: 14, paddingHorizontal: 16 },
  howLeft: { alignItems: "center", width: 44 },
  howIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  howLine: { width: 2, flex: 1, minHeight: 16, marginVertical: 4 },
  howContent: { flex: 1, paddingBottom: 20, paddingTop: 10 },
  howTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  howDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  // Bottom CTA
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderWidth: 1.5,
  },
  ctaSecondaryText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ctaPrimary: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  ctaPrimaryText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

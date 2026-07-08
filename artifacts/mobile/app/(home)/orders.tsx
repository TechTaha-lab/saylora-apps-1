import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const SUPPORT_NUMBER = "96171735478";

function Step({
  num,
  icon,
  title,
  desc,
  iconColor,
  iconBg,
  last,
  colors,
}: {
  num: number;
  icon: string;
  title: string;
  desc: string;
  iconColor: string;
  iconBg: string;
  last?: boolean;
  colors: any;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepIcon, { backgroundColor: iconBg }]}>
          <Feather name={icon as any} size={20} color={iconColor} />
        </View>
        {!last && <View style={[styles.stepLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{desc}</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  async function openWhatsApp() {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const storeUrl = user?.businessSlug ? `https://${domain}/store/${user.businessSlug}` : "";
    const message = `Hi! I'd like to place an order from ${user?.businessName ?? "your store"}. ${storeUrl}`;
    const wa = `whatsapp://send?phone=${SUPPORT_NUMBER}&text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(wa);
    } catch {
      await Linking.openURL(`https://wa.me/${SUPPORT_NUMBER}`);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }]}
      >
        {/* Header section */}
        <View style={styles.topSection}>
          <View style={[styles.iconRing, { backgroundColor: "#25D36618", borderColor: "#25D36630" }]}>
            <Feather name="message-circle" size={38} color="#25D366" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>WhatsApp Orders</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Customers discover your store and place orders directly through WhatsApp — no checkout needed.
          </Text>
        </View>

        {/* How it works */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>

          <Step
            num={1}
            icon="share-2"
            title="Share your store link"
            desc="Post it on WhatsApp, Instagram, or wherever your customers are."
            iconColor={colors.primary}
            iconBg={colors.secondary}
            colors={colors}
          />
          <Step
            num={2}
            icon="smartphone"
            title="Customer browses your store"
            desc="They see your products with photos, descriptions and prices."
            iconColor="#0284C7"
            iconBg="#0284C715"
            colors={colors}
          />
          <Step
            num={3}
            icon="message-circle"
            title="Tap 'Order via WhatsApp'"
            desc="Each product has a button that opens a pre-filled WhatsApp message to you."
            iconColor="#25D366"
            iconBg="#25D36615"
            colors={colors}
          />
          <Step
            num={4}
            icon="check-circle"
            title="Confirm and fulfill"
            desc="Chat with the customer directly to confirm details and arrange delivery."
            iconColor={colors.success}
            iconBg={colors.success + "18"}
            last
            colors={colors}
          />
        </View>

        {/* Store link card */}
        {user?.businessSlug ? (
          <View style={[styles.linkCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30", borderRadius: colors.radius + 4 }]}>
            <Feather name="link" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>Your store link</Text>
              <Text style={[styles.linkValue, { color: colors.primary }]} numberOfLines={1}>
                /store/{user.businessSlug}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Tips */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>TIPS FOR MORE ORDERS</Text>
          <TipItem icon="image" text="Add clear photos for every product — it boosts click-through." colors={colors} />
          <TipItem icon="tag" text="Keep prices updated and mark sold-out items unavailable." colors={colors} />
          <TipItem icon="zap" text="Reply fast on WhatsApp — speed builds trust." colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

function TipItem({ icon, text, colors }: { icon: string; text: string; colors: any }) {
  return (
    <View style={styles.tipItem}>
      <Feather name={icon as any} size={16} color={colors.primary} />
      <Text style={[styles.tipText, { color: colors.foreground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },

  topSection: { alignItems: "center", gap: 12, paddingVertical: 8 },
  iconRing: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },

  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  cardTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },

  stepRow: { flexDirection: "row", paddingHorizontal: 16, gap: 14 },
  stepLeft: { alignItems: "center", width: 44 },
  stepIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  stepLine: { width: 2, flex: 1, minHeight: 16, marginVertical: 4 },
  stepContent: { flex: 1, paddingBottom: 16 },
  stepTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2, marginTop: 10 },
  stepDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  linkCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderWidth: 1 },
  linkLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  linkValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  tipItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  tipText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});

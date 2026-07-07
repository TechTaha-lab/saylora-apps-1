import React from "react";
import { View, Text, StyleSheet, Pressable, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const SUPPORT_NUMBER = "96171735478";

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Orders</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconBox, { backgroundColor: colors.secondary, borderRadius: 32 }]}>
          <Feather name="shopping-bag" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Orders via WhatsApp</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Customers order directly through WhatsApp. Share your store link and receive orders instantly.
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
              <Feather name="share-2" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Share your store link</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Send it to customers on WhatsApp, Instagram, or any channel</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: "#25D36622", borderRadius: 10 }]}>
              <Feather name="message-circle" size={18} color="#25D366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Customers tap "Order via WhatsApp"</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Each product in your store has a direct WhatsApp order button</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: "#10B98122", borderRadius: 10 }]}>
              <Feather name="check-circle" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>Confirm and fulfill</Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>Manage all communication directly in WhatsApp</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={openWhatsApp}
          style={[styles.waBtn, { borderRadius: colors.radius }]}
        >
          <Feather name="message-circle" size={20} color="#fff" />
          <Text style={styles.waBtnText}>Open WhatsApp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 20 },
  iconBox: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  infoCard: { width: "100%", padding: 16, borderWidth: 1, gap: 0 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  infoIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  infoDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  divider: { height: StyleSheet.hairlineWidth },
  waBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#25D366", paddingHorizontal: 28, paddingVertical: 14 },
  waBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

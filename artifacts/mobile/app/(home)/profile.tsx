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
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@workspace/api-client-react";

const SUPPORT_WA = "96171735478";

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  danger,
  chevron = true,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        { borderBottomColor: colors.border, opacity: pressed ? 0.6 : 1 },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIconWrap,
          { backgroundColor: danger ? "#EF444420" : colors.secondary },
        ]}
      >
        <Feather
          name={icon as any}
          size={17}
          color={danger ? colors.destructive : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.actionLabel,
          { color: danger ? colors.destructive : colors.foreground },
        ]}
      >
        {label}
      </Text>
      {chevron && (
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, refreshToken, logout } = useAuth();
  const logoutMutation = useLogout();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure?", [
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

  function openSupport() {
    Linking.openURL(`whatsapp://send?phone=${SUPPORT_WA}&text=Hi Saylora support,`)
      .catch(() => Linking.openURL(`https://wa.me/${SUPPORT_WA}`));
  }

  function openStore() {
    if (user?.businessSlug) {
      router.push(`/(store)/${user.businessSlug}` as never);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name ?? "—"}
          </Text>
          {user?.isAdmin && (
            <View style={[styles.adminBadge, { backgroundColor: "#7C3AED20" }]}>
              <Feather name="shield" size={12} color={colors.primary} />
              <Text style={[styles.adminBadgeText, { color: colors.primary }]}>Admin</Text>
            </View>
          )}
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
            {user?.email}
          </Text>
        </View>

        {/* Store info */}
        {user?.businessName ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>STORE</Text>
            <InfoRow icon="briefcase" label="Store name" value={user.businessName} />
            {user.businessSlug ? (
              <InfoRow icon="link" label="Store link" value={`/store/${user.businessSlug}`} />
            ) : null}
            {user.whatsapp ? (
              <InfoRow icon="phone" label="WhatsApp" value={user.whatsapp} />
            ) : null}
          </View>
        ) : null}

        {/* Account info */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACCOUNT</Text>
          <InfoRow icon="mail" label="Email" value={user?.email ?? "—"} />
          {user?.language ? (
            <InfoRow
              icon="globe"
              label="Language"
              value={user.language === "ar" ? "Arabic" : "English"}
            />
          ) : null}
        </View>

        {/* Actions */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
          {user?.businessSlug ? (
            <ActionRow icon="eye" label="View My Store" onPress={openStore} />
          ) : null}
          {user?.isAdmin ? (
            <ActionRow
              icon="users"
              label="Admin Panel"
              onPress={() => router.push("/(admin)/" as never)}
            />
          ) : null}
          <ActionRow icon="headphones" label="Contact Support" onPress={openSupport} />
        </View>

        {/* Logout */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActionRow
            icon="log-out"
            label="Sign Out"
            onPress={handleLogout}
            danger
            chevron={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  avatarSection: { alignItems: "center", gap: 8, paddingBottom: 8 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
});

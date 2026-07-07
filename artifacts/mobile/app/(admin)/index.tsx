import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import {
  useAdminListUsers,
  useAdminActivateUser,
  useAdminDeactivateUser,
  useAdminSetSubscription,
  useLogout,
  type AdminUser,
} from "@workspace/api-client-react";

function SubBadge({ type }: { type: string | null | undefined }) {
  const colors = useColors();
  const color =
    type === "trial" ? "#F59E0B" :
    type === "monthly" ? "#7C3AED" :
    type === "yearly" ? "#059669" :
    colors.mutedForeground;
  return (
    <View style={[styles.badge, { backgroundColor: color + "22", borderRadius: 6 }]}>
      <Text style={[styles.badgeText, { color }]}>{type ?? "—"}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout, refreshToken } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showActions, setShowActions] = useState(false);

  const { data: users = [], isLoading, refetch } = useAdminListUsers();
  const activateMutation = useAdminActivateUser();
  const deactivateMutation = useAdminDeactivateUser();
  const subscriptionMutation = useAdminSetSubscription();
  const logoutMutation = useLogout();

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            if (refreshToken) await logoutMutation.mutateAsync({ data: { refreshToken } });
          } catch {}
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  function openActions(user: AdminUser) {
    setSelectedUser(user);
    setShowActions(true);
  }

  async function handleActivate() {
    if (!selectedUser) return;
    try {
      await activateMutation.mutateAsync({ id: selectedUser.id });
      setShowActions(false);
      refetch();
    } catch {
      Alert.alert("Error", "Failed to activate user.");
    }
  }

  async function handleDeactivate() {
    if (!selectedUser) return;
    Alert.alert("Deactivate", `Deactivate ${selectedUser.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          try {
            await deactivateMutation.mutateAsync({ id: selectedUser.id });
            setShowActions(false);
            refetch();
          } catch {
            Alert.alert("Error", "Failed to deactivate user.");
          }
        },
      },
    ]);
  }

  async function handleSetSubscription(type: "monthly" | "yearly") {
    if (!selectedUser) return;
    try {
      await subscriptionMutation.mutateAsync({ id: selectedUser.id, data: { type } });
      setShowActions(false);
      refetch();
    } catch {
      Alert.alert("Error", "Failed to update subscription.");
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Logo size="sm" />
        <View style={[styles.adminBadge, { backgroundColor: colors.primary + "22", borderRadius: 8 }]}>
          <Feather name="shield" size={12} color={colors.primary} />
          <Text style={[styles.adminBadgeText, { color: colors.primary }]}>Admin</Text>
        </View>
        <Pressable onPress={handleLogout} style={{ padding: 8 }}>
          <Feather name="log-out" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={[styles.statsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{users.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Users</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: "#10B981" }]}>{users.filter((u) => u.businessIsActive).length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: "#EF4444" }]}>{users.filter((u) => !u.businessIsActive).length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Inactive</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="users" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No users yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openActions(item)}
              style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}
            >
              <View style={[styles.userAvatar, { backgroundColor: colors.primary + "22", borderRadius: 24 }]}>
                <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.activeDot, { backgroundColor: item.businessIsActive ? "#10B981" : "#EF4444" }]} />
                </View>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>{item.email}</Text>
                {item.businessName && (
                  <Text style={[styles.userBusiness, { color: colors.mutedForeground }]} numberOfLines={1}>
                    <Feather name="briefcase" size={11} /> {item.businessName}
                  </Text>
                )}
              </View>
              <View style={styles.userMeta}>
                <SubBadge type={item.subscriptionType} />
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={showActions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowActions(false)} />
          {selectedUser && (
            <View style={[styles.actionSheet, { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.sheetName, { color: colors.foreground }]}>{selectedUser.name}</Text>
              <Text style={[styles.sheetEmail, { color: colors.mutedForeground }]}>{selectedUser.email}</Text>

              <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />

              <Text style={[styles.sheetSection, { color: colors.mutedForeground }]}>SUBSCRIPTION</Text>
              <View style={styles.subRow}>
                <Pressable onPress={() => handleSetSubscription("monthly")} style={[styles.subBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
                  <Text style={styles.subBtnText}>Set Monthly</Text>
                </Pressable>
                <Pressable onPress={() => handleSetSubscription("yearly")} style={[styles.subBtn, { backgroundColor: "#059669", borderRadius: colors.radius }]}>
                  <Text style={styles.subBtnText}>Set Yearly</Text>
                </Pressable>
              </View>

              <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />

              <Text style={[styles.sheetSection, { color: colors.mutedForeground }]}>ACCOUNT STATUS</Text>
              {!selectedUser.businessIsActive ? (
                <Pressable onPress={handleActivate} style={[styles.actionBtn, { backgroundColor: "#10B981", borderRadius: colors.radius }]}>
                  <Feather name="user-check" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Activate Account</Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleDeactivate} style={[styles.actionBtn, { backgroundColor: colors.destructive, borderRadius: colors.radius }]}>
                  <Feather name="user-x" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Deactivate Account</Text>
                </Pressable>
              )}

              <Pressable onPress={() => setShowActions(false)} style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: colors.radius }]}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  adminBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statsBar: { flexDirection: "row", paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  list: { padding: 16 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1 },
  userAvatar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userBusiness: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userMeta: { alignItems: "center", gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  actionSheet: { padding: 24, paddingBottom: 40, gap: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetName: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  sheetEmail: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  sheetDivider: { height: StyleSheet.hairlineWidth },
  sheetSection: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  subRow: { flexDirection: "row", gap: 12 },
  subBtn: { flex: 1, alignItems: "center", paddingVertical: 12 },
  subBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  cancelBtn: { alignItems: "center", paddingVertical: 14, borderWidth: 1 },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});

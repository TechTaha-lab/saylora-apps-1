import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  Modal,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  useListMyProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
} from "@workspace/api-client-react";

interface FormState {
  name: string;
  description: string;
  price: string;
  image: string;
  available: boolean;
}

const EMPTY_FORM: FormState = { name: "", description: "", price: "", image: "", available: true };

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const { data: products = [], isLoading, refetch } = useListMyProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  function openAdd() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({ name: p.name, description: p.description ?? "", price: p.price, image: p.image ?? "", available: p.available });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e["name"] = "Name is required";
    if (!form.price.trim()) e["price"] = "Price is required";
    else if (isNaN(Number(form.price)) || Number(form.price) < 0) e["price"] = "Enter a valid price";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access to upload product images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem("@saylora_access_token");
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const apiBase = domain ? `https://${domain}/api` : "/api";
      const formData = new FormData();
      formData.append("file", { uri: asset.uri, name: "photo.jpg", type: asset.mimeType ?? "image/jpeg" } as unknown as Blob);
      const response = await fetch(`${apiBase}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = (await response.json()) as { url: string };
      const absoluteUrl = domain ? `https://${domain}${data.url}` : data.url;
      setForm((f) => ({ ...f, image: absoluteUrl }));
    } catch {
      Alert.alert("Upload failed", "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({ id: editingProduct.id, data: { name: form.name.trim(), description: form.description.trim() || undefined, price: form.price, image: form.image.trim() || undefined, available: form.available } });
      } else {
        await createMutation.mutateAsync({ data: { name: form.name.trim(), description: form.description.trim() || undefined, price: form.price, image: form.image.trim() || undefined, available: form.available } });
      }
      setShowModal(false);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to save product.";
      Alert.alert("Error", msg);
    }
  }

  async function handleDelete(p: Product) {
    Alert.alert("Delete Product", `Delete "${p.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await deleteMutation.mutateAsync({ id: p.id });
          refetch();
        } catch {
          Alert.alert("Error", "Failed to delete product.");
        }
      }},
    ]);
  }

  async function handleToggle(p: Product) {
    try {
      await updateMutation.mutateAsync({ id: p.id, data: { available: !p.available } });
      refetch();
    } catch {}
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Products</Text>
        <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap "Add" to create your first product</Text>
          <Pressable onPress={openAdd} style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
            <Text style={styles.emptyBtnText}>Add Product</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
              <View style={styles.productTop}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={[styles.productThumb, { borderRadius: 10 }]} resizeMode="cover" />
                ) : (
                  <View style={[styles.productIcon, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                    <Feather name="package" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                  {item.description ? (
                    <Text style={[styles.productDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <Text style={[styles.productPrice, { color: colors.primary }]}>${parseFloat(item.price).toFixed(2)}</Text>
                </View>
                <Switch
                  value={item.available}
                  onValueChange={() => handleToggle(item)}
                  trackColor={{ false: colors.border, true: colors.primary + "66" }}
                  thumbColor={item.available ? colors.primary : colors.mutedForeground}
                />
              </View>
              <View style={[styles.productActions, { borderTopColor: colors.border }]}>
                <Pressable onPress={() => openEdit(item)} style={styles.actionBtn}>
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                  <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{editingProduct ? "Edit Product" : "New Product"}</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16, paddingBottom: 32 }}>
                <Input label="Product Name *" placeholder="e.g. Cheese Burger" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} error={errors["name"]} />
                <Input label="Description" placeholder="Short description (optional)" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
                <Input label="Price *" placeholder="0.00" value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: v }))} keyboardType="decimal-pad" leftIcon="dollar-sign" error={errors["price"]} />

                <View style={{ gap: 8 }}>
                  <Text style={[styles.imageLabel, { color: colors.foreground }]}>Product Image</Text>
                  <Pressable onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}>
                    {uploading ? (
                      <View style={styles.imagePickerEmpty}>
                        <ActivityIndicator color={colors.primary} />
                        <Text style={[styles.imagePickerHint, { color: colors.mutedForeground }]}>Uploading…</Text>
                      </View>
                    ) : form.image ? (
                      <View style={{ width: "100%", height: "100%" }}>
                        <Image source={{ uri: form.image }} style={styles.imagePreview} resizeMode="cover" />
                        <View style={styles.imageChangeOverlay}>
                          <Feather name="camera" size={14} color="#fff" />
                          <Text style={styles.imageChangeText}>Change photo</Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.imagePickerEmpty}>
                        <View style={[styles.imagePickerIcon, { backgroundColor: colors.primary + "22", borderRadius: 28 }]}>
                          <Feather name="camera" size={22} color={colors.primary} />
                        </View>
                        <Text style={[styles.imagePickerTitle, { color: colors.foreground }]}>Upload photo</Text>
                        <Text style={[styles.imagePickerHint, { color: colors.mutedForeground }]}>Tap to choose from gallery</Text>
                      </View>
                    )}
                  </Pressable>
                </View>

                <View style={styles.availableRow}>
                  <View>
                    <Text style={[styles.availableLabel, { color: colors.foreground }]}>Available</Text>
                    <Text style={[styles.availableSub, { color: colors.mutedForeground }]}>Show this product in your store</Text>
                  </View>
                  <Switch
                    value={form.available}
                    onValueChange={(v) => setForm((f) => ({ ...f, available: v }))}
                    trackColor={{ false: colors.border, true: colors.primary + "66" }}
                    thumbColor={form.available ? colors.primary : colors.mutedForeground}
                  />
                </View>

                <Button title={editingProduct ? "Save Changes" : "Add Product"} onPress={handleSave} loading={isSaving} size="lg" />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  list: { padding: 16 },
  productCard: { borderWidth: 1, overflow: "hidden" },
  productTop: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  productThumb: { width: 52, height: 52 },
  productIcon: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  productDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  productActions: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  actionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  imageLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  imagePicker: { height: 140, borderWidth: 1, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  imagePickerEmpty: { alignItems: "center", gap: 8 },
  imagePickerIcon: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  imagePickerTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  imagePickerHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  imagePreview: { width: "100%", height: "100%", ...StyleSheet.absoluteFillObject },
  imageChangeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", gap: 4 },
  imageChangeText: { fontSize: 12, color: "#fff", fontFamily: "Inter_500Medium" },
  availableRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  availableLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  availableSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

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

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  image: "",
  available: true,
};

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

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
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: p.price,
      image: p.image ?? "",
      available: p.available,
    });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e["name"] = "Name is required";
    if (!form.price.trim()) e["price"] = "Price is required";
    else if (isNaN(Number(form.price)) || Number(form.price) < 0)
      e["price"] = "Enter a valid price";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pickImage() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload product images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
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
      formData.append("file", {
        uri: asset.uri,
        name: "photo.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as unknown as Blob);
      const response = await fetch(`${apiBase}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = (await response.json()) as { url: string };
      const absoluteUrl = domain
        ? `https://${domain}${data.url}`
        : data.url;
      setForm((f) => ({ ...f, image: absoluteUrl }));
    } catch {
      Alert.alert("Upload failed", "Could not upload the image. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: form.price.trim(),
            image: form.image || undefined,
            available: form.available,
          },
        });
      } else {
        await createMutation.mutateAsync({
          data: {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: form.price.trim(),
            image: form.image || undefined,
            available: form.available,
          },
        });
      }
      setShowModal(false);
      refetch();
    } catch {
      Alert.alert("Error", "Could not save product. Please try again.");
    }
  }

  async function handleDelete(p: Product) {
    Alert.alert(
      "Delete Product",
      `Remove "${p.name}" from your store?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id: p.id });
              refetch();
            } catch {
              Alert.alert("Error", "Could not delete product.");
            }
          },
        },
      ]
    );
  }

  async function handleToggleAvailable(p: Product) {
    try {
      await updateMutation.mutateAsync({
        id: p.id,
        data: { available: !p.available },
      });
      refetch();
    } catch {
      Alert.alert("Error", "Could not update product.");
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Products
        </Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          onPress={openAdd}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary, borderRadius: 40 }]}>
            <Feather name="package" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No products yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Add your first product and it will appear in your store.
          </Text>
          <Pressable
            style={[styles.emptyBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={openAdd}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.emptyBtnText}>Add First Product</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              colors={colors}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
              onToggle={() => handleToggleAvailable(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowModal(false)}
          />
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingProduct ? "Edit Product" : "New Product"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Image picker */}
              <Pressable
                style={[styles.imagePicker, { borderColor: colors.border, borderRadius: colors.radius, marginBottom: 16 }]}
                onPress={pickImage}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : form.image ? (
                  <>
                    <Image source={{ uri: form.image }} style={styles.imagePreview} />
                    <View style={styles.imageChangeOverlay}>
                      <Feather name="camera" size={20} color="#fff" />
                      <Text style={styles.imageChangeText}>Change</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.imagePickerEmpty}>
                    <View style={[styles.imagePickerIcon, { backgroundColor: colors.secondary, borderRadius: 16 }]}>
                      <Feather name="image" size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.imagePickerTitle, { color: colors.foreground }]}>Add Photo</Text>
                    <Text style={[styles.imagePickerHint, { color: colors.mutedForeground }]}>
                      Tap to choose from library
                    </Text>
                  </View>
                )}
              </Pressable>

              <Input
                label="Product name *"
                placeholder="e.g. Classic White T-Shirt"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                error={errors["name"]}
                leftIcon="tag"
              />
              <View style={{ height: 12 }} />
              <Input
                label="Description"
                placeholder="Describe your product..."
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
              />
              <View style={{ height: 12 }} />
              <Input
                label="Price *"
                placeholder="0.00"
                value={form.price}
                onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                error={errors["price"]}
                keyboardType="decimal-pad"
                leftIcon="dollar-sign"
              />
              <View style={{ height: 16 }} />
              <View style={[styles.availableRow, { backgroundColor: colors.background, borderRadius: colors.radius, padding: 14 }]}>
                <View>
                  <Text style={[styles.availableLabel, { color: colors.foreground }]}>
                    Available in store
                  </Text>
                  <Text style={[styles.availableSub, { color: colors.mutedForeground }]}>
                    Customers can see and order this
                  </Text>
                </View>
                <Switch
                  value={form.available}
                  onValueChange={(v) => setForm((f) => ({ ...f, available: v }))}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
              <View style={{ height: 20 }} />
              <Button
                title={isSaving ? "Saving…" : editingProduct ? "Save Changes" : "Add Product"}
                onPress={handleSave}
                disabled={isSaving}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ProductCard({
  product: p,
  colors,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  colors: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
          marginBottom: 12,
        },
      ]}
    >
      <View style={styles.productTop}>
        {p.image ? (
          <Image
            source={{ uri: p.image }}
            style={[styles.productThumb, { borderRadius: colors.radius }]}
          />
        ) : (
          <View
            style={[
              styles.productIcon,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <Feather name="package" size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.foreground }]}>
            {p.name}
          </Text>
          {p.description ? (
            <Text
              style={[styles.productDesc, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {p.description}
            </Text>
          ) : null}
          <View style={styles.productBadgeRow}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              ${p.price}
            </Text>
            <View
              style={[
                styles.availBadge,
                {
                  backgroundColor: p.available
                    ? colors.success + "18"
                    : colors.muted,
                },
              ]}
            >
              <View
                style={[
                  styles.availDot,
                  {
                    backgroundColor: p.available
                      ? colors.success
                      : colors.mutedForeground,
                  },
                ]}
              />
              <Text
                style={[
                  styles.availText,
                  {
                    color: p.available
                      ? colors.success
                      : colors.mutedForeground,
                  },
                ]}
              >
                {p.available ? "Live" : "Hidden"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.productActions, { borderTopColor: colors.border }]}>
        <Pressable
          style={[styles.actionBtn, { borderRightColor: colors.border }]}
          onPress={onToggle}
        >
          <Feather
            name={p.available ? "eye-off" : "eye"}
            size={15}
            color={colors.mutedForeground}
          />
          <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
            {p.available ? "Hide" : "Show"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { borderRightColor: colors.border }]}
          onPress={onEdit}
        >
          <Feather name="edit-2" size={15} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Edit</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 32 },
  emptyIcon: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },

  list: { padding: 16 },

  productCard: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  productTop: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14 },
  productThumb: { width: 60, height: 60 },
  productIcon: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  productInfo: { flex: 1, gap: 4 },
  productName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  productDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  productBadgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  productPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  availBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 11, fontFamily: "Inter_500Medium" },

  productActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  actionText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "92%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },

  imagePicker: {
    height: 150,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerEmpty: { alignItems: "center", gap: 8 },
  imagePickerIcon: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  imagePickerTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  imagePickerHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  imagePreview: { width: "100%", height: "100%", ...StyleSheet.absoluteFillObject },
  imageChangeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  imageChangeText: { fontSize: 12, color: "#fff", fontFamily: "Inter_500Medium" },

  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availableLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  availableSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

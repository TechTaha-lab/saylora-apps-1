import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useGetStore, type Product } from "@workspace/api-client-react";

function ProductCard({ product, whatsapp, storeName }: { product: Product; whatsapp?: string | null; storeName: string }) {
  const colors = useColors();

  async function orderViaWhatsApp() {
    const number = whatsapp?.replace(/\D/g, "") ?? "";
    const message = `Hi! I'd like to order "${product.name}" from ${storeName}. Price: $${parseFloat(product.price).toFixed(2)}`;
    const wa = `whatsapp://send?phone=${number}&text=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(wa);
    } catch {
      await Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
    }
  }

  return (
    <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
      {product.image ? (
        <Image source={{ uri: product.image }} style={[styles.productImage, { borderTopLeftRadius: colors.radius + 4, borderTopRightRadius: colors.radius + 4 }]} resizeMode="cover" />
      ) : (
        <View style={[styles.productImagePlaceholder, { backgroundColor: colors.secondary, borderTopLeftRadius: colors.radius + 4, borderTopRightRadius: colors.radius + 4 }]}>
          <Feather name="package" size={32} color={colors.mutedForeground} />
        </View>
      )}
      <View style={styles.productBody}>
        <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
        {product.description && (
          <Text style={[styles.productDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{product.description}</Text>
        )}
        <View style={styles.productFooter}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>${parseFloat(product.price).toFixed(2)}</Text>
          {whatsapp && (
            <Pressable onPress={orderViaWhatsApp} style={[styles.orderBtn, { borderRadius: colors.radius }]}>
              <Feather name="message-circle" size={14} color="#fff" />
              <Text style={styles.orderBtnText}>Order</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function StoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: store, isLoading, isError } = useGetStore(slug ?? "");

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !store) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>Store not found</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtnLarge, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const availableProducts = store.products.filter((p) => p.available);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={[styles.storeName, { color: colors.foreground }]} numberOfLines={1}>{store.name}</Text>
          {store.category && (
            <Text style={[styles.storeCategory, { color: colors.mutedForeground }]}>{store.category}</Text>
          )}
        </View>
        {store.whatsapp && (
          <Pressable
            onPress={() => Linking.openURL(`whatsapp://send?phone=${store.whatsapp?.replace(/\D/g, "")}`)}
            style={[styles.waIconBtn, { backgroundColor: "#25D36622", borderRadius: 20 }]}
          >
            <Feather name="message-circle" size={20} color="#25D366" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={availableProducts}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          store.city || store.country ? (
            <View style={[styles.locationRow, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
              <Feather name="map-pin" size={14} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                {[store.city, store.country].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No products available</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productCol}>
            <ProductCard product={item} whatsapp={store.whatsapp} storeName={store.name} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  storeName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  storeCategory: { fontSize: 12, fontFamily: "Inter_400Regular" },
  waIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, marginBottom: 4 },
  locationText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  row: { gap: 12 },
  productCol: { flex: 1 },
  productCard: { borderWidth: 1, overflow: "hidden" },
  productImage: { width: "100%", height: 130 },
  productImagePlaceholder: { width: "100%", height: 130, alignItems: "center", justifyContent: "center" },
  productBody: { padding: 12, gap: 6 },
  productName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  productDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  productFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  productPrice: { fontSize: 15, fontFamily: "Inter_700Bold" },
  orderBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#25D366", paddingHorizontal: 10, paddingVertical: 6 },
  orderBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  errorText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  backBtnLarge: { paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", gap: 8, paddingVertical: 48 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});

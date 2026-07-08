import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useListMyProducts } from "@workspace/api-client-react";

type CartItem = { id: number; name: string; price: number; image: string | null; qty: number };

function getBaseUrl() {
  if (typeof process !== "undefined" && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace("/api", "");
  }
  return "";
}

function productImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${getBaseUrl()}${path}`;
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [cart, setCart] = useState<Record<number, CartItem>>({});

  const { data: products = [], isLoading } = useListMyProducts();
  const availableProducts = products.filter((p) => p.available);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : 0;

  const cartItems = useMemo(() => Object.values(cart).filter((i) => i.qty > 0), [cart]);
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.qty, 0),
    [cartItems]
  );
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.qty, 0), [cartItems]);

  function setQty(productId: number, name: string, price: number, image: string | null, delta: number) {
    setCart((prev) => {
      const existing = prev[productId];
      const newQty = Math.max(0, (existing?.qty ?? 0) + delta);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { id: productId, name, price, image, qty: newQty } };
    });
  }

  function clearCart() {
    setCart({});
  }

  async function sendWhatsApp() {
    if (cartItems.length === 0) return;

    const storeName = user?.businessName ?? "Store";
    const lines = cartItems.map(
      (i) => `• ${i.name} x${i.qty}  —  $${(i.price * i.qty).toFixed(2)}`
    );
    const total = `$${cartTotal.toFixed(2)}`;

    const message = [
      `🛒 *New Order — ${storeName}*`,
      "",
      ...lines,
      "",
      `*Total: ${total}*`,
      "",
      "Please confirm this order!",
    ].join("\n");

    // Open WhatsApp share (no phone — store owner picks recipient)
    const phone = user?.whatsapp?.replace(/\D/g, "") ?? "";
    const url = phone
      ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Orders</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Build an order & send via WhatsApp
          </Text>
        </View>
        {cartCount > 0 && (
          <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
            <Feather name="shopping-cart" size={14} color="#fff" />
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad + (cartCount > 0 ? 160 : 100) },
        ]}
      >
        {/* Products */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading products…
            </Text>
          </View>
        ) : availableProducts.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
            <Feather name="package" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Add products in the Products tab to start taking orders.
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              SELECT PRODUCTS
            </Text>
            {availableProducts.map((product) => {
              const price = parseFloat(String(product.price ?? "0"));
              const qty = cart[product.id]?.qty ?? 0;
              const imgUrl = productImageUrl(product.imageUrl);

              return (
                <View
                  key={product.id}
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: qty > 0 ? colors.primary : colors.border,
                      borderRadius: colors.radius + 2,
                      borderWidth: qty > 0 ? 1.5 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  {/* Thumbnail */}
                  <View style={[styles.productThumb, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={styles.productImg} />
                    ) : (
                      <Feather name="shopping-bag" size={22} color={colors.mutedForeground} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={[styles.productPrice, { color: colors.primary }]}>
                      ${price.toFixed(2)}
                    </Text>
                  </View>

                  {/* Qty controls */}
                  <View style={styles.qtyRow}>
                    <Pressable
                      onPress={() => setQty(product.id, product.name, price, imgUrl, -1)}
                      style={[
                        styles.qtyBtn,
                        {
                          backgroundColor: qty > 0 ? colors.primary + "18" : colors.secondary,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <Feather
                        name="minus"
                        size={15}
                        color={qty > 0 ? colors.primary : colors.mutedForeground}
                      />
                    </Pressable>

                    <Text style={[styles.qtyNum, { color: qty > 0 ? colors.primary : colors.foreground }]}>
                      {qty}
                    </Text>

                    <Pressable
                      onPress={() => setQty(product.id, product.name, price, imgUrl, 1)}
                      style={[styles.qtyBtn, { backgroundColor: colors.primary, borderRadius: 20 }]}
                    >
                      <Feather name="plus" size={15} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cart summary */}
        {cartItems.length > 0 && (
          <View style={[styles.cartSummary, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius + 4 }]}>
            <View style={styles.cartSummaryHeader}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ORDER SUMMARY</Text>
              <Pressable onPress={clearCart}>
                <Text style={[styles.clearBtn, { color: colors.destructive }]}>Clear</Text>
              </Pressable>
            </View>

            {cartItems.map((item) => (
              <View key={item.id} style={[styles.cartRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.cartItemName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cartRowRight}>
                  <Text style={[styles.cartItemQty, { color: colors.mutedForeground }]}>
                    x{item.qty}
                  </Text>
                  <Text style={[styles.cartItemPrice, { color: colors.foreground }]}>
                    ${(item.price * item.qty).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[styles.cartTotalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.cartTotalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.cartTotalValue, { color: colors.primary }]}>
                ${cartTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA */}
      {cartCount > 0 ? (
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
          <View style={styles.ctaInfo}>
            <Text style={[styles.ctaCount, { color: colors.mutedForeground }]}>
              {cartCount} item{cartCount !== 1 ? "s" : ""}
            </Text>
            <Text style={[styles.ctaTotal, { color: colors.foreground }]}>
              ${cartTotal.toFixed(2)}
            </Text>
          </View>
          <Pressable
            onPress={sendWhatsApp}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: "#25D366", borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="message-circle" size={18} color="#fff" />
            <Text style={styles.ctaBtnText}>Send via WhatsApp</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={[
            styles.ctaHint,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 8,
            },
          ]}
        >
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.ctaHintText, { color: colors.mutedForeground }]}>
            Tap + on any product to add it to your order
          </Text>
        </View>
      )}
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
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  cartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cartBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  loadingBox: { alignItems: "center", gap: 10, paddingVertical: 48 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  emptyBox: {
    alignItems: "center",
    gap: 10,
    padding: 36,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },

  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },

  productList: { gap: 10 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  productThumb: { width: 52, height: 52, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  productImg: { width: 52, height: 52 },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 22, textAlign: "center" },

  cartSummary: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  cartSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  clearBtn: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cartItemName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  cartRowRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartItemQty: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cartItemPrice: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 60, textAlign: "right" },
  cartTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cartTotalLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cartTotalValue: { fontSize: 20, fontFamily: "Inter_700Bold" },

  // Bottom CTA
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaInfo: { flex: 1, gap: 1 },
  ctaCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaTotal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  ctaBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  ctaBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  ctaHint: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaHintText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../services/api";
import DeliveryLocationSection from "../components/DeliveryLocationSection";
import { payWithRazorpay } from "../lib/payment/razorpayFlow";
import type { ApiCartItem, ApiCartPriceSummary } from "../lib/cartServerApi";
import {
  deleteCartClearServer,
  deleteCartLineServer,
  fetchServerCartBundle,
  parseCartApiError,
  putCartItemQuantityDelta,
} from "../lib/cartServerApi";
import {
  estimateCartWeightKgFromItemCount,
  fetchDeliveryChargeByWeight,
  pickPreferredCharge,
} from "../lib/deliveryChargesApi";
import {
  adjustCartQuantity,
  loadCart,
  resolveProductImage,
  saveCart,
  type PersistedCartLine,
} from "../lib/shopStorage";
import { useLanguage } from "../lib/language";

const DELIVERY_SELECTED_ADDRESS_ID_STORAGE_KEY = "home_selectedDeliveryAddressId_v1";

type ReviewItemSource = "local" | "server";

type ReviewItem = {
  id: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
  stock?: number;
  source: ReviewItemSource;
  serverItemId?: number;
};

function persistedToReviewItem(line: PersistedCartLine): ReviewItem {
  return {
    id: line.id,
    name: line.name,
    image: line.imageUri ? { uri: line.imageUri } : resolveProductImage(line.id),
    price: line.price,
    originalPrice: line.mrp > line.price ? line.mrp : undefined,
    quantity: line.quantity,
    size: line.size,
    color: line.color,
    stock:
      typeof line.stock === "number" && Number.isFinite(line.stock)
        ? Math.max(0, Math.floor(line.stock))
        : 0,
    source: "local",
  };
}

function serverRowToReviewItem(row: ApiCartItem): ReviewItem {
  const uri = String(row.imageUrl ?? "").trim();
  const image = uri ? { uri } : resolveProductImage(String(row.productId));
  const price = row.sellingPrice ?? row.price;
  const mrp = row.mrpPrice ?? row.originalPrice;
  return {
    id: String(row.itemId),
    name: row.name,
    image,
    price,
    originalPrice: mrp > price + 0.009 ? mrp : undefined,
    quantity: Math.max(1, row.quantity),
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    stock: typeof row.stock === "number" ? Math.max(0, row.stock) : 0,
    source: "server",
    serverItemId: row.itemId,
  };
}

export default function ReviewOrdersScreen() {
  const router = useRouter();
  const { buyNowItemId } = useLocalSearchParams<{ buyNowItemId?: string }>();
  const { tr } = useLanguage();
  const [paying, setPaying] = useState(false);
  const [apiWeightDeliveryCharge, setApiWeightDeliveryCharge] = useState<number | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [cartSource, setCartSource] = useState<ReviewItemSource>("local");
  const [serverPriceSummary, setServerPriceSummary] = useState<ApiCartPriceSummary | null>(null);
  const [qtyUpdatingIds, setQtyUpdatingIds] = useState<Set<string>>(new Set());

  const reloadReviewCart = async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    if (token) {
      try {
        const bundle = await fetchServerCartBundle();
        if (bundle) {
          setItems(bundle.items.map(serverRowToReviewItem));
          setCartSource("server");
          setServerPriceSummary(bundle.priceSummary);
          return;
        }
        // Signed-in users should remain server-authoritative.
        setItems([]);
        setCartSource("server");
        setServerPriceSummary(null);
        return;
      } catch {
        // Signed-in users should remain server-authoritative.
        setItems([]);
        setCartSource("server");
        setServerPriceSummary(null);
        return;
      }
    }
    setCartSource("local");
    setServerPriceSummary(null);
    const lines = await loadCart();
    setItems(lines.map(persistedToReviewItem));
  };

  useFocusEffect(
    React.useCallback(() => {
      void reloadReviewCart();
    }, [])
  );

  const visibleItems = useMemo(() => {
    const target = String(buyNowItemId ?? "").trim();
    if (!target) return items;
    return items.filter((item) => item.id === target);
  }, [buyNowItemId, items]);

  const subtotal = useMemo(
    () =>
      visibleItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [visibleItems]
  );
  const productDiscount = useMemo(
    () => {
      return visibleItems.reduce((sum, it) => {
        if (!it.originalPrice) return sum;
        return sum + (it.originalPrice - it.price) * it.quantity;
      }, 0);
    },
    [visibleItems]
  );
  const totalItems = useMemo(
    () => visibleItems.reduce((sum, item) => sum + item.quantity, 0),
    [visibleItems]
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const weightKg = estimateCartWeightKgFromItemCount(totalItems);
        const slab = await fetchDeliveryChargeByWeight(weightKg);
        if (alive) setApiWeightDeliveryCharge(pickPreferredCharge(slab));
      } catch {
        if (alive) setApiWeightDeliveryCharge(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [totalItems]);

  const deliveryCharge = useMemo(() => {
    if (cartSource === "server" && serverPriceSummary) {
      return serverPriceSummary.deliveryCharge;
    }
    if (apiWeightDeliveryCharge != null) return apiWeightDeliveryCharge;
    return 99;
  }, [apiWeightDeliveryCharge, cartSource, serverPriceSummary]);
  const total = useMemo(() => {
    return Math.max(0, subtotal - productDiscount + deliveryCharge);
  }, [deliveryCharge, productDiscount, subtotal]);

  const updateQty = (id: string, delta: number) => {
    void (async () => {
      if (qtyUpdatingIds.has(id)) return;
      const item = items.find((x) => x.id === id);
      if (item?.serverItemId != null) {
        setQtyUpdatingIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        try {
          if (delta < 0 && item.quantity <= 1) {
            await deleteCartLineServer(item.serverItemId);
          } else if (delta !== 0) {
            await putCartItemQuantityDelta(item.serverItemId, delta);
          }
          await reloadReviewCart();
        } catch (e) {
          Alert.alert(tr("Cart"), tr(parseCartApiError(e, "Could not update quantity.")));
        } finally {
          setQtyUpdatingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        return;
      }
      const token = (await AsyncStorage.getItem("token"))?.trim();
      if (token) {
        Alert.alert(
          tr("Cart sync"),
          tr("Please wait while cart syncs with server and try again.")
        );
        await reloadReviewCart();
        return;
      }
      setQtyUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      try {
        await adjustCartQuantity(id, delta);
        await reloadReviewCart();
      } finally {
        setQtyUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  };

  const clearCartAfterSuccessfulOrder = async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    // Always clear local cache to avoid stale cart lines after payment success.
    await saveCart([]);
    if (!token) return;
    try {
      await deleteCartClearServer();
    } catch {
      // If server clear fails, we still keep payment success flow uninterrupted.
    }
  };

  const placeOrderOnServer = async (addressId: number): Promise<number> => {
    const { data } = await api.post<{
      success: boolean;
      message?: string;
      data?: {
        orderId?: number;
      };
    }>("/api/orders/place", {
      addressId,
      paymentMethod: "upi",
    });
    if (!data?.success) {
      throw new Error(data?.message || "Could not place order.");
    }
    const orderId = Number(data?.data?.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      throw new Error("Order placed but no order ID was returned.");
    }
    return Math.floor(orderId);
  };

  const createInvoiceForOrder = async (orderId: number): Promise<void> => {
    const { data } = await api.post<{
      success: boolean;
      message?: string;
    }>("/api/invoices", {
      orderId,
    });
    if (!data?.success) {
      throw new Error(data?.message || "Could not generate invoice.");
    }
  };

  const handlePlaceOrder = async () => {
    if (paying) return;
    if (total <= 0) {
      Alert.alert(tr("Checkout"), tr("Amount must be greater than zero."));
      return;
    }

    setPaying(true);
    try {
      const selectedAddressIdRaw = (
        await AsyncStorage.getItem(DELIVERY_SELECTED_ADDRESS_ID_STORAGE_KEY)
      )?.trim();
      const selectedAddressId = Number(selectedAddressIdRaw);
      if (!selectedAddressIdRaw || !Number.isFinite(selectedAddressId) || selectedAddressId <= 0) {
        Alert.alert(tr("Checkout"), tr("Please select a delivery address."));
        return;
      }

      const orderId = await placeOrderOnServer(Math.floor(selectedAddressId));

      const result = await payWithRazorpay(total);
      if (result.ok === false) {
        if (result.reason === "use_web_checkout") {
          router.push({
            pathname: "/razorpay-web-checkout",
            params: {
              key: result.razorpayKeyId,
              orderId: result.orderId,
              amount: String(result.amountPaise),
              currency: result.currency,
              appOrderId: String(orderId),
            },
          } as any);
          return;
        }
        if (result.reason === "cancelled") {
          return;
        }
        Alert.alert(tr("Payment"), tr(result.message));
        return;
      }
      try {
        await createInvoiceForOrder(orderId);
      } catch {
        // Invoice generation should not block successful payment completion.
      }
      await clearCartAfterSuccessfulOrder();
      Alert.alert(tr("Payment successful"), tr(result.verify.message ?? "Your payment was verified."), [
        { text: tr("OK"), onPress: () => router.replace("/orders" as any) },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      Alert.alert(tr("Payment"), tr(msg));
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr("Review Order")}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.stepperWrap}>
        <View style={[styles.stepChip, styles.stepChipActive]}>
          <Text style={[styles.stepText, styles.stepTextActive]}>1. {tr("Review")}</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepChip}>
          <Text style={styles.stepText}>2. {tr("Payment")}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery location (Home-style picker) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr("Delivery location")}</Text>
          <View style={{ marginTop: 10 }}>
            <DeliveryLocationSection enableFullAddressApi />
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr("Products")} ({visibleItems.length})</Text>

          {visibleItems.length === 0 ? (
            <Text style={styles.itemMeta}>{tr("Your cart is empty.")}</Text>
          ) : null}

          {visibleItems.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={styles.itemImageWrap}>
                <Image source={it.image} style={styles.itemImage} />
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {it.name}
                </Text>
                {!!(it.size || it.color) && (
                  <Text style={styles.itemMeta}>
                    {it.size ? `Size: ${it.size}` : ""}
                    {it.size && it.color ? "  •  " : ""}
                    {it.color ? `Color: ${it.color}` : ""}
                  </Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    ₹{(it.price * it.quantity).toLocaleString()}
                  </Text>
                  {it.originalPrice ? (
                    <Text style={styles.mrp}>
                      ₹{(it.originalPrice * it.quantity).toLocaleString()}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>{tr("Qty")}</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, it.quantity <= 1 && styles.qtyBtnDisabled]}
                      onPress={() => updateQty(it.id, -1)}
                      disabled={qtyUpdatingIds.has(it.id) || it.quantity <= 1}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={it.quantity <= 1 ? "#B9B9B9" : "#1d324e"}
                      />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{it.quantity}</Text>
                    <TouchableOpacity
                      style={[
                        styles.qtyBtn,
                        qtyUpdatingIds.has(it.id) ? styles.qtyBtnDisabled : null,
                      ]}
                      onPress={() => updateQty(it.id, 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color="#1d324e"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price details</Text>

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Subtotal</Text>
            <Text style={styles.lineValue}>₹{subtotal.toLocaleString()}</Text>
          </View>

          {/* <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Product discount</Text>
            <Text style={[styles.lineValue, styles.positive]}>
              -₹{productDiscount.toLocaleString()}
            </Text>
          </View> */}

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>{tr("Shipping charges")}</Text>
            <Text style={styles.lineValue}>
              {deliveryCharge <= 0 ? tr("FREE") : `₹${deliveryCharge.toLocaleString()}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.lineRow}>
            <Text style={styles.totalLabel}>{tr("Total amount")}</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.savingsBanner}>
          <Ionicons name="pricetag-outline" size={16} color="#10893E" />
          <Text style={styles.savingsText}>
            You are saving ₹{productDiscount.toLocaleString()} on this order
          </Text>
        </View>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>{tr("Payable")}</Text>
          <Text style={styles.bottomTotalValue}>₹{total.toLocaleString()}</Text>
          <Text style={styles.bottomItemsText}>{totalItems} item(s)</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, paying && styles.placeOrderBtnDisabled]}
          activeOpacity={0.9}
          onPress={handlePlaceOrder}
          disabled={paying}
        >
          {paying ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>{tr("Place order")}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F0",
  },
  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFF7F0",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29,50,78,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    color: "#1d324e",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#FFF7F0",
  },
  stepChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
  },
  stepChipActive: {
    backgroundColor: "#1d324e",
    borderColor: "#1d324e",
  },
  stepText: {
    fontSize: 11,
    color: "#1d324e",
    fontWeight: "700",
  },
  stepTextActive: {
    color: "#FFFFFF",
  },
  stepConnector: {
    width: 28,
    height: 1,
    backgroundColor: "rgba(29,50,78,0.28)",
    marginHorizontal: 8,
  },
  content: { flex: 1 },
  contentContainer: {
    padding: 14,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    marginBottom: 12,
    shadowColor: "#1d324e",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    color: "#1d324e",
    fontWeight: "800",
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#FFEBD3",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
  },
  changeBtnText: {
    fontSize: 12,
    color: "#ef7b1a",
    fontWeight: "800",
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  addressLeft: { flex: 1, marginRight: 10 },
  addressNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressName: {
    fontSize: 13,
    color: "#79411c",
    fontWeight: "800",
    marginRight: 8,
  },
  addressTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#f6c795",
  },
  addressTypeText: {
    fontSize: 10,
    color: "#1d324e",
    fontWeight: "800",
  },
  addressText: {
    fontSize: 12,
    color: "#333333",
    marginBottom: 2,
  },
  pillRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 10,
  },
  pillText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(29,50,78,0.12)",
  },
  itemImageWrap: {
    width: 88,
    height: 110,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
    marginRight: 12,
  },
  itemImage: { width: "100%", height: "100%", resizeMode: "cover" },
  itemInfo: { flex: 1 },
  itemName: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "800",
  },
  itemMeta: {
    marginTop: 3,
    fontSize: 11,
    color: "#666666",
    fontWeight: "500",
  },
  stockHintText: {
    marginTop: 4,
    fontSize: 11,
    color: "#B45309",
    fontWeight: "800",
  },
  priceRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  price: {
    fontSize: 13,
    color: "#ef7b1a",
    fontWeight: "900",
  },
  mrp: {
    marginLeft: 8,
    fontSize: 11,
    color: "#777777",
    textDecorationLine: "line-through",
    fontWeight: "600",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
  },
  qtyLabel: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "700",
  },
  qtyControls: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.22)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1d324e",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  qtyBtnDisabled: {
    borderColor: "rgba(29,50,78,0.10)",
    backgroundColor: "#F5F6F8",
  },
  qtyValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "900",
    marginHorizontal: 10,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  lineLabel: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "600",
  },
  lineValue: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "800",
  },
  positive: {
    color: "#10893E",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(29,50,78,0.15)",
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "900",
  },
  totalValue: {
    fontSize: 15,
    color: "#1d324e",
    fontWeight: "900",
  },
  savingsBanner: {
    marginTop: 2,
    marginBottom: 8,
    backgroundColor: "#EBFFF0",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(16,137,62,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  savingsText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#10893E",
    fontWeight: "800",
    flex: 1,
  },
  bottomBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(29,50,78,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#1d324e",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 4,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: "#666666",
    fontWeight: "700",
  },
  bottomTotalValue: {
    fontSize: 15,
    color: "#1d324e",
    fontWeight: "900",
    marginTop: 2,
  },
  bottomItemsText: {
    fontSize: 10,
    color: "#666666",
    fontWeight: "700",
    marginTop: 2,
  },
  placeOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef7b1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#ef7b1a",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  placeOrderBtnDisabled: {
    opacity: 0.75,
  },
  placeOrderText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "900",
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 14,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    maxHeight: "85%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 14,
    color: "#1d324e",
    fontWeight: "900",
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 11,
    color: "#79411c",
    fontWeight: "800",
  },
  input: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF7F0",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
    paddingHorizontal: 12,
    color: "#1d324e",
    fontWeight: "700",
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 6,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
    marginRight: 10,
  },
  typeChipActive: {
    backgroundColor: "#FFEBD3",
    borderColor: "rgba(239,123,26,0.40)",
  },
  typeChipText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "800",
  },
  typeChipTextActive: {
    color: "#ef7b1a",
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#1d324e",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "900",
  },
});


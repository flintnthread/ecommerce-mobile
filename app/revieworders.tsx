import React, { useMemo, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import DeliveryLocationSection from "../components/DeliveryLocationSection";

type ReviewItem = {
  id: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
};

export default function ReviewOrdersScreen() {
  const router = useRouter();

  // NOTE: Cart in this project is local-state; until global cart is added,
  // we show realistic dummy items here.
  const [items, setItems] = useState<ReviewItem[]>([
    {
      id: "1",
      name: "Premium Cotton T-Shirt",
      image: require("../assets/images/age5.png"),
      price: 1299,
      originalPrice: 1999,
      quantity: 2,
      size: "M",
      color: "Blue",
    },
    {
      id: "2",
      name: "Designer Denim Jeans",
      image: require("../assets/images/age6.png"),
      price: 2499,
      quantity: 1,
      size: "L",
      color: "Dark Blue",
    },
  ]);

  // Delivery location is handled via the shared `DeliveryLocationSection`
  // (same behaviour as Home/Subcategory screens).

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const nextQty = Math.max(1, it.quantity + delta);
        return { ...it, quantity: nextQty };
      })
    );
  };

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [items]
  );
  const productDiscount = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (!it.originalPrice) return sum;
        return sum + (it.originalPrice - it.price) * it.quantity;
      }, 0),
    [items]
  );
  const deliveryCharge = subtotal > 2000 ? 0 : 99;
  const total = Math.max(0, subtotal - productDiscount + deliveryCharge);
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const handlePlaceOrder = () => {
    router.push("/payment-selection" as any);
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
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.stepperWrap}>
        <View style={[styles.stepChip, styles.stepChipActive]}>
          <Text style={[styles.stepText, styles.stepTextActive]}>1. Review</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepChip}>
          <Text style={styles.stepText}>2. Payment</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery location (Home-style picker) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery location</Text>
          <View style={{ marginTop: 10 }}>
            <DeliveryLocationSection />
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Products ({items.length})</Text>

          {items.map((it) => (
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
                  <Text style={styles.qtyLabel}>Qty</Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, it.quantity <= 1 && styles.qtyBtnDisabled]}
                      onPress={() => updateQty(it.id, -1)}
                      disabled={it.quantity <= 1}
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
                      style={styles.qtyBtn}
                      onPress={() => updateQty(it.id, 1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={16} color="#1d324e" />
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

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Product discount</Text>
            <Text style={[styles.lineValue, styles.positive]}>
              -₹{productDiscount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Delivery</Text>
            <Text style={styles.lineValue}>
              {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.lineRow}>
            <Text style={styles.totalLabel}>Total amount</Text>
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
          <Text style={styles.bottomTotalLabel}>Payable</Text>
          <Text style={styles.bottomTotalValue}>₹{total.toLocaleString()}</Text>
          <Text style={styles.bottomItemsText}>{totalItems} item(s)</Text>
        </View>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          activeOpacity={0.9}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.placeOrderText}>Place order</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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


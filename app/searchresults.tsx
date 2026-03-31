import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ALL_PRODUCTS } from "./productdetail";

export default function SearchResults() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const q = (params.q || "").toString();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((p) => p.name.toLowerCase().includes(s));
  }, [q]);

  const openProductDetail = (id: string) => {
    router.push({ pathname: "/productdetail", params: { id } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {q ? `Results for “${q}”` : "All products"}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionBlock}>
          <Text style={styles.resultSummary}>
            {filtered.length
              ? `${filtered.length} products found`
              : "No matching products. Showing all."}
          </Text>
          <View style={styles.resultNamesRow}>
            {filtered.slice(0, 6).map((item) => (
              <View key={item.id} style={styles.resultNamePill}>
                <Text style={styles.resultNameText} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            All products
          </Text>
          <View style={styles.allProductsGrid}>
            {(filtered.length ? filtered : ALL_PRODUCTS).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.allProductCard}
                activeOpacity={0.85}
                onPress={() => openProductDetail(item.id)}
              >
                <View style={styles.allProductImageWrapper}>
                  <Image source={item.image} style={styles.allProductImage} />
                </View>
                <Text style={styles.allProductName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.allProductPriceRow}>
                  <Text style={styles.allProductPrice}>
                    ₹{item.price.toLocaleString()}
                  </Text>
                  <Text style={styles.allProductMrp}>
                    ₹{item.mrp.toLocaleString()}
                  </Text>
                  <Text style={styles.allProductDiscount}>{item.discount}</Text>
                </View>
                <View style={styles.allProductRatingRow}>
                  <View style={styles.allProductRatingBadge}>
                    <Text style={styles.allProductRatingText}>
                      {item.rating}
                    </Text>
                    <Ionicons
                      name="star"
                      size={9}
                      color="#FFFFFF"
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                  <Text style={styles.allProductRatingCount}>
                    ({item.ratingCount})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  content: {
    paddingBottom: 24,
  },
  sectionBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultSummary: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  resultNamesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  resultNamePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#f2f2f2",
  },
  resultNameText: {
    fontSize: 11,
    color: "#333",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  sectionLabelAccent: {
    color: "#e53935",
  },
  allProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  allProductCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 8,
  },
  allProductImageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  allProductImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  allProductName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  allProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  allProductPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginRight: 6,
  },
  allProductMrp: {
    fontSize: 12,
    color: "#777",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  allProductDiscount: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
  },
  allProductRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  allProductRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allProductRatingText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  allProductRatingCount: {
    marginLeft: 4,
    fontSize: 11,
    color: "#777",
  },
});


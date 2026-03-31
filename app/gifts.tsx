import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type GiftCategory = {
  id: string;
  title: string;
  emoji: string;
  bg: string;
};

type GiftItem = {
  id: string;
  name: string;
  price: string;
  image: any;
};

const GIFT_CATEGORIES: GiftCategory[] = [
  { id: "gc1", title: "Art & Creative Gifts", emoji: "🎨", bg: "#F8E7ED" },
  { id: "gc2", title: "Corporate Gifts", emoji: "🏢", bg: "#EAF1FC" },
  { id: "gc3", title: "Event-Based Gifts", emoji: "🎉", bg: "#F8F1DE" },
  { id: "gc4", title: "Everyday Utility", emoji: "🏠", bg: "#EAF7E8" },
  { id: "gc5", title: "Couple Gifts", emoji: "💞", bg: "#FCEBF1" },
];

const TRENDING_GIFTS: GiftItem[] = [
  {
    id: "tg1",
    name: "Personalized Mug",
    price: "$12",
    image: require("../assets/images/homecate.png"),
  },
  {
    id: "tg2",
    name: "Luxury Watch",
    price: "$45",
    image: require("../assets/images/menscate.png"),
  },
  {
    id: "tg3",
    name: "Flower Bouquet",
    price: "$29",
    image: require("../assets/images/sweetscate.png"),
  },
];

export default function GiftsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Homely Hub</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={20} color="#1d324e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.heroBanner} activeOpacity={0.9}>
          <Image
            source={require("../assets/images/homecate.png")}
            style={styles.heroBannerImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>GIFTING SEASON</Text>
            <Text style={styles.heroTitle}>Make Moments Special</Text>
            <Text style={styles.heroSubTitle}>Curated gifts for every occasion</Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>Shop Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.grid}>
          {GIFT_CATEGORIES.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { backgroundColor: category.bg },
                index === GIFT_CATEGORIES.length - 1 && styles.coupleCard,
              ]}
              activeOpacity={0.85}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Gifts</Text>
          <Ionicons name="arrow-forward" size={18} color="#4b5563" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingRow}
        >
          {TRENDING_GIFTS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.productCard} activeOpacity={0.9}>
              <Image source={item.image} style={styles.productImage} resizeMode="cover" />
              <View style={styles.productMeta}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.offerBanner}>
          <Text style={styles.offerMain}>🎉 Flat 50% OFF</Text>
          <Text style={styles.offerSub}>On Birthday Gifts</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1d324e",
  },
  searchButton: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heroBanner: {
    height: 186,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#D9E1EF",
    shadowColor: "#111827",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 41, 59, 0.35)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  heroEyebrow: {
    color: "#FBCFE8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 3,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  heroSubTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 3,
  },
  heroCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  heroCtaText: {
    color: "#1d324e",
    fontWeight: "700",
    fontSize: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryCard: {
    width: "48%",
    minHeight: 108,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    paddingHorizontal: 10,
  },
  coupleCard: {
    width: "72%",
    marginHorizontal: "14%",
  },
  categoryEmoji: {
    fontSize: 38,
    marginBottom: 6,
  },
  categoryTitle: {
    textAlign: "center",
    fontSize: 20,
    color: "#374151",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#374151",
    marginRight: 4,
  },
  trendingRow: {
    paddingRight: 6,
    paddingBottom: 8,
  },
  productCard: {
    width: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productImage: {
    width: "100%",
    height: 120,
  },
  productMeta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  productPrice: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  offerBanner: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: "#FB7185",
  },
  offerMain: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  offerSub: {
    marginTop: 2,
    color: "#FDF2F8",
    fontSize: 24,
    fontWeight: "600",
  },
});

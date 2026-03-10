import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const TOP_TAGS = ["Birthday Deal", "Price Crash", "Top Brands"];

type BestDressItem = {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  isVideo?: boolean;
};

const BEST_OF_DRESSES: BestDressItem[] = [
  {
    id: "b1",
    title: "Printed midi dress",
    subtitle: "Under ₹1499",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "b2",
    title: "Floral fit & flare",
    subtitle: "New arrivals",
    image: require("../assets/images/look2.png"),
    isVideo: true,
  },
  {
    id: "b3",
    title: "Solid A-line dress",
    subtitle: "Bestseller",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "b4",
    title: "Party sequin dress",
    subtitle: "Trending now",
    image: require("../assets/images/look4.png"),
  },
];

type ProductItem = {
  id: string;
  title: string;
  price: number;
  mrp: number;
  discount: string;
  payLaterText: string;
  benefitText: string;
  rating: string;
  ratingCount: string;
  image: any;
};

const PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    title: "Jivika Voguish Sarees",
    price: 357,
    mrp: 407,
    discount: "12% off",
    payLaterText: "₹344 with Pay Later",
    benefitText: "Free Delivery",
    rating: "4.2",
    ratingCount: "7,672",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "p2",
    title: "Banita Pretty Sarees",
    price: 431,
    mrp: 501,
    discount: "14% off",
    payLaterText: "₹432 with Pay Later",
    benefitText: "Free Delivery",
    rating: "4.2",
    ratingCount: "7,555",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "p3",
    title: "SPOTXY Banita Sarees",
    price: 352,
    mrp: 411,
    discount: "14% off",
    payLaterText: "₹348 with Pay Later",
    benefitText: "Free Delivery",
    rating: "4.0",
    ratingCount: "6,680",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "p4",
    title: "Charvi Poly Silk Sarees",
    price: 242,
    mrp: 269,
    discount: "10% off",
    payLaterText: "₹226 with Pay Later",
    benefitText: "Free Delivery",
    rating: "4.0",
    ratingCount: "32,700",
    image: require("../assets/images/look3.png"),
  },
];

export default function SubcategoriesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>DRESSES</Text>

        <View style={styles.headerRight}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#000"
            style={styles.headerRightIcon}
          />
          <Ionicons
            name="heart-outline"
            size={20}
            color="#000"
            style={styles.headerRightIcon}
          />
          <Ionicons name="bag-outline" size={20} color="#000" />
        </View>
      </View>

      {/* LOCATION BAR */}
      <View style={styles.locationBar}>
        <Ionicons name="location-outline" size={16} color="#FF3E6C" />
        <Text style={styles.locationText} numberOfLines={1}>
          Villa-113 - PRAVEENS PRIDE, Road No. 11, Pat...
        </Text>
        <Ionicons name="chevron-down" size={16} color="#333" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP TAGS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topTagRow}
        >
          {TOP_TAGS.map((tag) => (
            <View key={tag} style={styles.topTag}>
              <Text style={styles.topTagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>

        {/* SORT / CATEGORY / GENDER / FILTERS ROW */}
        <View style={styles.sortTabsRow}>
          <TouchableOpacity style={styles.sortTab}>
            <Text style={styles.sortTabText}>Sort</Text>
            <Ionicons name="chevron-down" size={14} color="#222222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortTab}>
            <Text style={styles.sortTabText}>Category</Text>
            <Ionicons name="chevron-down" size={14} color="#222222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortTab}>
            <Text style={styles.sortTabText}>Gender</Text>
            <Ionicons name="chevron-down" size={14} color="#222222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortTab}>
            <Text style={styles.sortTabText}>Filters</Text>
            <Ionicons name="chevron-down" size={14} color="#222222" />
          </TouchableOpacity>
        </View>

        {/* PROMO STRIP */}
        <View style={styles.promoStrip}>
          <View style={[styles.promoCard, styles.promoLeft]}>
            <Text style={styles.promoHighlight}>40% off</Text>
            <Text style={styles.promoSub}>upto ₹400</Text>
          </View>
          <View style={[styles.promoCard, styles.promoRight]}>
            <Text style={styles.promoHighlight}>EASY</Text>
            <Text style={styles.promoSub}>Returns</Text>
          </View>
        </View>

        {/* COCKTAIL DRESSES BANNER */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>COCKTAIL DRESSES</Text>
        </View>

        <View style={styles.bannerCard}>
          <Image
            source={require("../assets/images/womencate.png")}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.dotsRow}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === 0 && styles.dotActive]}
            />
          ))}
        </View>

        {/* BEST OF DRESSES SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>BEST OF DRESSES</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bestRow}
        >
          {BEST_OF_DRESSES.map((item) => (
            <View key={item.id} style={styles.bestCard}>
              <View style={styles.bestImageWrapper}>
                <Image
                  source={item.image}
                  style={styles.bestImage}
                  resizeMode="cover"
                />
                {item.isVideo && (
                  <View style={styles.playBadge}>
                    <Ionicons name="play" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.bestTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.bestSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* PRODUCT GRID */}
        <View style={styles.productGrid}>
          {PRODUCTS.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImageWrapper}>
                <Image
                  source={product.image}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.wishlistIcon}>
                  <Ionicons name="heart-outline" size={18} color="#444444" />
                </TouchableOpacity>
              </View>

              <Text style={styles.productTitle} numberOfLines={2}>
                {product.title}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceCurrent}>₹{product.price}</Text>
                <Text style={styles.priceMrp}>₹{product.mrp}</Text>
                <Text style={styles.priceDiscount}>{product.discount}</Text>
              </View>

              <Text style={styles.payLaterText} numberOfLines={1}>
                {product.payLaterText}
              </Text>
              <Text style={styles.benefitText} numberOfLines={1}>
                {product.benefitText}
              </Text>

              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{product.rating}</Text>
                  <Ionicons
                    name="star"
                    size={10}
                    color="#FFFFFF"
                    style={{ marginLeft: 2 }}
                  />
                </View>
                <Text style={styles.ratingCount}>({product.ratingCount})</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Text style={[styles.bottomItem, styles.bottomItemActive]}>WOMEN</Text>
        <View style={styles.bottomDivider} />
        <Text style={styles.bottomItem}>SORT</Text>
        <View style={styles.bottomDivider} />
        <Text style={styles.bottomItem}>FILTER</Text>
        <View style={styles.filterDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  headerIconButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    marginLeft: 4,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightIcon: {
    marginRight: 12,
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  locationText: {
    flex: 1,
    marginHorizontal: 6,
    fontSize: 12,
    color: "#555555",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  scrollContent: {
    paddingBottom: 90,
  },
  topTagRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFE8F0",
    marginRight: 8,
  },
  topTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FF3E6C",
  },
  sortTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
  },
  sortTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E0E0E0",
  },
  sortTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#222222",
    marginRight: 4,
  },
  promoStrip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  promoCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  promoLeft: {
    backgroundColor: "#FFE6F0",
    marginRight: 6,
  },
  promoRight: {
    backgroundColor: "#FFEFE0",
    marginLeft: 6,
  },
  promoHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  promoSub: {
    fontSize: 12,
    marginTop: 2,
    color: "#555555",
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bannerCard: {
    marginHorizontal: 12,
    borderRadius: 10,
    overflow: "hidden",
    height: 150,
    backgroundColor: "#E5E5F0",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D0D0D0",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 10,
    borderRadius: 5,
    backgroundColor: "#FF3E6C",
  },
  bestRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bestCard: {
    width: 140,
    marginRight: 12,
  },
  bestImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F0F0F5",
  },
  bestImage: {
    width: "100%",
    height: "100%",
  },
  playBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  bestTitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
  },
  bestSubtitle: {
    fontSize: 11,
    color: "#777777",
    marginTop: 2,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 16,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E4E4E4",
  },
  productImageWrapper: {
    width: "100%",
    height: 180,
    backgroundColor: "#F0F0F5",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  wishlistIcon: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333333",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  priceCurrent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333333",
    marginRight: 6,
  },
  priceMrp: {
    fontSize: 11,
    color: "#777777",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  priceDiscount: {
    fontSize: 11,
    color: "#10893E",
    fontWeight: "600",
  },
  payLaterText: {
    fontSize: 11,
    color: "#333333",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 11,
    color: "#333333",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  ratingCount: {
    fontSize: 10,
    color: "#555555",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  bottomItem: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555555",
  },
  bottomItemActive: {
    color: "#000000",
    fontWeight: "700",
  },
  bottomDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#E0E0E0",
  },
  filterDot: {
    position: "absolute",
    right: 22,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF3E6C",
  },
});
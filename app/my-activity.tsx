import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  type ImageSourcePropType,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import api, {
  recentlyViewedProductsPath,
  searchHistoryPath,
  WISHLIST_REMOVE_PATH,
  WISHLIST_USER_PATH,
} from "../services/api";
import { firstWishlistRowImageUri, normalizeWishlistApiRows, numLike } from "../lib/wishlistApi";
import { loadWishlist, removeWishlistLine, resolveProductImage } from "../lib/shopStorage";
import { addToCartPtbOrLocal } from "../lib/cartServerApi";

type ActivityTab = "recently_viewed" | "search_history" | "wishlist" | "reviews";
const RECENT_VIEW_SESSION_KEY = "ft_recent_view_session_id";

interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: string;
  imageUri: string;
  viewedDate: string;
  category: string;
}

interface SearchHistory {
  id: string;
  query: string;
  date: string;
}

interface WishlistItem {
  id: string;
  name: string;
  price: string;
  originalPrice: string;
  discount: string;
  image: ImageSourcePropType;
  productId: number;
  variantId: number;
  serverBacked: boolean;
  addedDate: string;
  inStock: boolean;
}

interface Review {
  id: string;
  productName: string;
  productImage: any;
  rating: number;
  reviewText: string;
  date: string;
  helpful: number;
}

export default function MyActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; sessionId?: string }>();
  const [activeTab, setActiveTab] = useState<ActivityTab>("recently_viewed");
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const [recentlyViewedLoading, setRecentlyViewedLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const formatRupees = (value: unknown): string => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "₹0";
    return `₹${Math.round(n).toLocaleString("en-IN")}`;
  };

  const parseRupeesText = (value: string): number => {
    const raw = String(value ?? "").replace(/[^\d.]/g, "");
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? Math.round(n) : 0;
  };

  const resolveImageUri = (raw: unknown): string => {
    const value = String(raw ?? "").trim();
    if (!value) return "";
    if (/^https?:\/\//i.test(value)) return value;
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!apiBase) return value;
    if (value.startsWith("/")) return `${apiBase}${value}`;
    if (value.includes("/")) return `${apiBase}/${value.replace(/^\/+/, "")}`;
    return `${apiBase}/uploads/${value}`;
  };

  const formatWishlistDate = (iso?: string | null): string => {
    const s = String(iso ?? "").trim();
    if (!s) return "Recently";
    try {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const resolveActivityIdentity = useCallback(async () => {
    const rawUserId = Number(params.userId);
    const userId =
      Number.isFinite(rawUserId) && rawUserId > 0 ? Math.floor(rawUserId) : undefined;
    const routeSessionId = String(params.sessionId ?? "").trim();
    const storedSessionId =
      (await AsyncStorage.getItem(RECENT_VIEW_SESSION_KEY))?.trim() || "";
    const sessionId = routeSessionId || storedSessionId || undefined;
    return { userId, sessionId };
  }, [params.userId, params.sessionId]);

  const loadRecentlyViewed = useCallback(async () => {
    const { userId, sessionId } = await resolveActivityIdentity();

    if (!userId && !sessionId) {
      setRecentlyViewed([]);
      return;
    }

    setRecentlyViewedLoading(true);
    try {
      const path = recentlyViewedProductsPath({ userId, sessionId });
      const { data } = await api.get<unknown>(path);
      const rows = Array.isArray(data) ? data : [];
      const mapped = rows
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item) => {
          const variants = Array.isArray(item.variants) ? item.variants : [];
          const firstVariant =
            variants.find((v) => v && typeof v === "object") ?? ({} as Record<string, unknown>);
          const images = Array.isArray(item.images) ? item.images : [];
          const firstImage =
            images.find((img) => img && typeof img === "object") ?? ({} as Record<string, unknown>);

          return {
            id: String(item.id ?? ""),
            name: String(item.name ?? "Product"),
            price: formatRupees(
              (firstVariant as Record<string, unknown>).sellingPrice ??
                (firstVariant as Record<string, unknown>).finalPrice ??
                (firstVariant as Record<string, unknown>).mrpPrice
            ),
            imageUri: resolveImageUri(
              (firstImage as Record<string, unknown>).imageUrl ??
                (firstImage as Record<string, unknown>).imagePath
            ),
            viewedDate: "Recently viewed",
            category: `Category ${String(item.categoryId ?? "-")}`,
          } satisfies RecentlyViewedProduct;
        })
        .filter((item) => item.id);
      setRecentlyViewed(mapped);
    } catch {
      setRecentlyViewed([]);
    } finally {
      setRecentlyViewedLoading(false);
    }
  }, [resolveActivityIdentity]);

  const loadSearchHistory = useCallback(async () => {
    const { userId, sessionId } = await resolveActivityIdentity();
    if (!userId && !sessionId) {
      setSearchHistory([]);
      return;
    }

    setSearchHistoryLoading(true);
    try {
      const path = searchHistoryPath({ userId, sessionId });
      const { data } = await api.get<{ data?: unknown }>(path);
      const rows = Array.isArray(data?.data) ? data.data : [];
      const mapped = rows
        .map((item, index) => String(item ?? "").trim())
        .filter(Boolean)
        .map((query, index) => ({
          id: `${index + 1}`,
          query,
          date: index === 0 ? "Most recent" : "Recent",
        }));
      setSearchHistory(mapped);
    } catch {
      setSearchHistory([]);
    } finally {
      setSearchHistoryLoading(false);
    }
  }, [resolveActivityIdentity]);

  const loadWishlistItems = useCallback(async () => {
    setWishlistLoading(true);
    try {
      const token = (await AsyncStorage.getItem("token"))?.trim();
      if (token) {
        try {
          const { data } = await api.get<unknown>(WISHLIST_USER_PATH);
          const rows = normalizeWishlistApiRows(data);
          const mapped = rows
            .map((row): WishlistItem | null => {
              const productId = Math.floor(Number(row.productId));
              const variantId = Math.floor(Number(row.variantId));
              if (!Number.isFinite(productId) || productId <= 0) return null;
              if (!Number.isFinite(variantId) || variantId <= 0) return null;
              const selling = numLike(row.sellingPrice);
              const mrp = numLike(row.mrpPrice);
              const priceNum = Math.round(selling > 0 ? selling : mrp || 0);
              const mrpNum = Math.round(mrp > 0 ? mrp : priceNum);
              const discountPct =
                mrpNum > priceNum && mrpNum > 0
                  ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
                  : 0;
              const imageUri = firstWishlistRowImageUri(row);
              return {
                id: String(row.wishlistId ?? `${productId}-${variantId}`),
                name: String(row.productName ?? "").trim() || `Product ${productId}`,
                price: `₹${priceNum.toLocaleString("en-IN")}`,
                originalPrice: mrpNum > priceNum ? `₹${mrpNum.toLocaleString("en-IN")}` : "",
                discount: discountPct > 0 ? `${discountPct}% OFF` : "",
                image: imageUri
                  ? ({ uri: imageUri } as ImageSourcePropType)
                  : resolveProductImage(String(productId)),
                productId,
                variantId,
                serverBacked: true,
                addedDate: `Added ${formatWishlistDate(row.addedAt)}`,
                inStock: row.inStock !== false,
              };
            })
            .filter((x): x is WishlistItem => x != null);
          setWishlistItems(mapped);
          return;
        } catch {
          // fall back to local list
        }
      }

      const local = await loadWishlist();
      setWishlistItems(
        local.map((line) => {
          const priceNum = Math.round(Number(line.price) || 0);
          const mrpNum = Math.round(Number(line.mrp) || priceNum);
          const discountPct =
            mrpNum > priceNum && mrpNum > 0
              ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
              : 0;
          const productId = Math.floor(Number(line.id));
          return {
            id: line.id,
            name: line.name,
            price: `₹${priceNum.toLocaleString("en-IN")}`,
            originalPrice: mrpNum > priceNum ? `₹${mrpNum.toLocaleString("en-IN")}` : "",
            discount: discountPct > 0 ? `${discountPct}% OFF` : "",
            image: resolveProductImage(line.id),
            productId: Number.isFinite(productId) ? productId : 0,
            variantId: 0,
            serverBacked: false,
            addedDate: "Added Recently",
            inStock: true,
          };
        })
      );
    } finally {
      setWishlistLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRecentlyViewed();
      void loadSearchHistory();
      void loadWishlistItems();
    }, [loadRecentlyViewed, loadSearchHistory, loadWishlistItems])
  );

  const reviews: Review[] = [
    {
      id: "1",
      productName: "Classic White T-Shirt",
      productImage: require("../assets/images/age5.png"),
      rating: 5,
      reviewText: "Great quality fabric and perfect fit. Highly recommended!",
      date: "15 Jan 2024",
      helpful: 12,
    },
    {
      id: "2",
      productName: "Denim Jacket",
      productImage: require("../assets/images/age6.png"),
      rating: 4,
      reviewText: "Good jacket but sizing runs a bit small. Overall satisfied.",
      date: "10 Jan 2024",
      helpful: 8,
    },
    {
      id: "3",
      productName: "Slim Fit Jeans",
      productImage: require("../assets/images/age5.png"),
      rating: 5,
      reviewText: "Perfect fit and comfortable. Great value for money.",
      date: "05 Jan 2024",
      helpful: 15,
    },
  ];

  const tabs: { key: ActivityTab; label: string; icon: string }[] = [
    { key: "recently_viewed", label: "Recently Viewed", icon: "eye" },
    { key: "search_history", label: "Search History", icon: "search" },
    { key: "wishlist", label: "Wishlist", icon: "heart" },
    { key: "reviews", label: "Reviews", icon: "star" },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color="#FFD700"
      />
    ));
  };

  const handleClearSearchHistory = () => {
    Alert.alert(
      "Clear Search History",
      "Are you sure you want to clear all search history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const { userId, sessionId } = await resolveActivityIdentity();
            if (!userId && !sessionId) {
              Alert.alert("Unable to clear", "No user or session context found.");
              return;
            }
            try {
              const path = searchHistoryPath({ userId, sessionId });
              await api.delete(path);
              setSearchHistory([]);
              Alert.alert("Cleared", "Search history has been cleared.");
            } catch {
              Alert.alert("Failed", "Could not clear search history. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleRemoveFromWishlist = (item: WishlistItem) => {
    Alert.alert(
      "Remove from Wishlist",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (item.serverBacked && item.productId > 0 && item.variantId > 0) {
              try {
                await api.delete(WISHLIST_REMOVE_PATH, {
                  params: {
                    productId: item.productId,
                    variantId: item.variantId,
                  },
                });
              } catch {
                Alert.alert("Wishlist", "Could not remove this item. Please try again.");
                return;
              }
              await removeWishlistLine(String(item.productId));
            } else {
              await removeWishlistLine(item.id);
            }
            setWishlistItems((prev) => prev.filter((x) => x.id !== item.id));
            Alert.alert("Removed", "Item removed from wishlist.");
          },
        },
      ]
    );
  };

  const handleDeleteReview = (id: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Deleted", "Review has been deleted.");
          },
        },
      ]
    );
  };

  const handleWishlistBuyNow = useCallback(
    async (item: WishlistItem) => {
      const addResult = await addToCartPtbOrLocal({
        productId: item.productId,
        variantId: item.variantId > 0 ? item.variantId : undefined,
        quantity: 1,
        localLine: {
          id: item.productId > 0 ? String(item.productId) : item.id,
          name: item.name,
          price: parseRupeesText(item.price),
          mrp: Math.max(parseRupeesText(item.originalPrice), parseRupeesText(item.price)),
        },
      });
      if (addResult.ok === false) {
        Alert.alert("Cart", addResult.message);
        return;
      }
      Alert.alert("Added to cart", `${item.name} added to your cart.`, [
        { text: "Continue", style: "cancel" },
        { text: "Go to cart", onPress: () => router.push("/cart") },
      ]);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Close Button - Absolute Positioned */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close-circle" size={32} color="#666" />
        </TouchableOpacity>

        {/* Centered Title Section */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Activity</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "recently_viewed" && `${recentlyViewed.length} products viewed`}
            {activeTab === "search_history" && `${searchHistory.length} searches`}
            {activeTab === "wishlist" && `${wishlistItems.length} items saved`}
            {activeTab === "reviews" && `${reviews.length} reviews written`}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#FFFFFF" : "#666"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View style={styles.tabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Recently Viewed Tab */}
        {activeTab === "recently_viewed" && (
          <View style={styles.recentlyViewedContainer}>
            {recentlyViewedLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="hourglass-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyText}>Loading activity...</Text>
              </View>
            ) : recentlyViewed.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="eye-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No recently viewed products</Text>
                <Text style={styles.emptySubtext}>
                  Products you view will appear here
                </Text>
              </View>
            ) : (
              recentlyViewed.map((product, index) => (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    index === recentlyViewed.length - 1 && styles.productCardLast,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/productdetail",
                      params: { id: product.id },
                    } as any)
                  }
                  activeOpacity={0.7}
                >
                  {product.imageUri ? (
                    <Image source={{ uri: product.imageUri }} style={styles.productImage} />
                  ) : (
                    <View style={[styles.productImage, styles.productImagePlaceholder]}>
                      <Ionicons name="image-outline" size={30} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>{product.price}</Text>
                      <Text style={styles.viewedDate}>{product.viewedDate}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.productActionBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/productdetail",
                        params: { id: product.id },
                      } as any)
                    }
                  >
                    <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Search History Tab */}
        {activeTab === "search_history" && (
          <View style={styles.searchHistoryContainer}>
            {searchHistoryLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="hourglass-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyText}>Loading history...</Text>
              </View>
            ) : searchHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No search history</Text>
                <Text style={styles.emptySubtext}>
                  Your recent searches will appear here
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.searchHistoryHeader}>
                  <Text style={styles.sectionSubtitle}>
                    Your recent searches
                  </Text>
                  <TouchableOpacity
                    onPress={handleClearSearchHistory}
                    style={styles.clearBtn}
                  >
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </TouchableOpacity>
                </View>
                {searchHistory.map((search, index) => (
                  <TouchableOpacity
                    key={search.id}
                    style={[
                      styles.searchItem,
                      index === searchHistory.length - 1 && styles.searchItemLast,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchItemLeft}>
                      <View style={styles.searchIcon}>
                        <Ionicons name="search" size={18} color="#666" />
                      </View>
                      <View style={styles.searchInfo}>
                        <Text style={styles.searchQuery}>{search.query}</Text>
                        <Text style={styles.searchMeta}>
                          {search.date}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.searchActionBtn}>
                      <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <View style={styles.wishlistContainer}>
            {wishlistLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="hourglass-outline" size={64} color="#E0E0E0" />
                <Text style={styles.emptyText}>Loading wishlist...</Text>
              </View>
            ) : wishlistItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="heart-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>Your wishlist is empty</Text>
                <Text style={styles.emptySubtext}>
                  Add items to your wishlist to save them for later
                </Text>
              </View>
            ) : (
              wishlistItems.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.wishlistCard,
                    index === wishlistItems.length - 1 && styles.wishlistCardLast,
                  ]}
                >
                  <View style={styles.wishlistCardLeft}>
                    <Image
                      source={item.image}
                      style={styles.wishlistImage}
                    />
                    {!item.inStock && (
                      <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                      </View>
                    )}
                    <View style={styles.wishlistInfo}>
                      <Text style={styles.wishlistName}>{item.name}</Text>
                      <View style={styles.wishlistPriceRow}>
                        <Text style={styles.wishlistPrice}>{item.price}</Text>
                        {item.originalPrice ? (
                          <Text style={styles.wishlistOriginalPrice}>
                            {item.originalPrice}
                          </Text>
                        ) : null}
                        {item.discount ? (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.discount}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.wishlistDate}>{item.addedDate}</Text>
                    </View>
                  </View>
                  <View style={styles.wishlistCardRight}>
                    <TouchableOpacity
                      style={styles.wishlistRemoveBtn}
                      onPress={() => void handleRemoveFromWishlist(item)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                    {item.inStock && (
                      <TouchableOpacity
                        style={styles.wishlistBuyBtn}
                        onPress={() => void handleWishlistBuyNow(item)}
                      >
                        <Text style={styles.wishlistBuyBtnText}>Buy Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Reviews & Ratings Tab */}
        {activeTab === "reviews" && (
          <View style={styles.reviewsContainer}>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>
                  Your product reviews will appear here
                </Text>
              </View>
            ) : (
              reviews.map((review, index) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewCard,
                    index === reviews.length - 1 && styles.reviewCardLast,
                  ]}
                >
                  <View style={styles.reviewCardHeader}>
                    <Image
                      source={review.productImage}
                      style={styles.reviewProductImage}
                    />
                    <View style={styles.reviewProductInfo}>
                      <Text style={styles.reviewProductName}>
                        {review.productName}
                      </Text>
                      <View style={styles.reviewRating}>
                        {renderStars(review.rating)}
                      </View>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.reviewText}</Text>
                  <View style={styles.reviewFooter}>
                    <View style={styles.reviewHelpful}>
                      <Ionicons name="thumbs-up-outline" size={16} color="#666" />
                      <Text style={styles.reviewHelpfulText}>
                        {review.helpful} helpful
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reviewDeleteBtn}
                      onPress={() => handleDeleteReview(review.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F44336" />
                      <Text style={styles.reviewDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    position: "relative",
  },
  headerTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 4,
    zIndex: 10,
  },
  tabsContainer: {
    backgroundColor: "transparent",
    marginBottom: 0,
    paddingBottom: 0,
  },
  tabsContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -12,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E97A1F",
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  // Recently Viewed Styles
  recentlyViewedContainer: {
    flex: 1,
  },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productCardLast: {
    marginBottom: 0,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 14,
  },
  productImagePlaceholder: {
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productCategory: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E97A1F",
  },
  viewedDate: {
    fontSize: 12,
    color: "#999",
  },
  productActionBtn: {
    padding: 8,
  },
  // Search History Styles
  searchHistoryContainer: {
    flex: 1,
  },
  searchHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F44336",
  },
  searchItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchItemLast: {
    marginBottom: 0,
  },
  searchItemLeft: {
    flexDirection: "row",
    flex: 1,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchInfo: {
    flex: 1,
  },
  searchQuery: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  searchMeta: {
    fontSize: 12,
    color: "#999",
  },
  searchActionBtn: {
    padding: 8,
  },
  // Wishlist Styles
  wishlistContainer: {
    flex: 1,
  },
  wishlistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  wishlistCardLast: {
    marginBottom: 0,
  },
  wishlistCardLeft: {
    flexDirection: "row",
    marginBottom: 12,
  },
  wishlistImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 14,
  },
  outOfStockBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#F44336",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  wishlistInfo: {
    flex: 1,
  },
  wishlistName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  wishlistPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  wishlistPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
    marginRight: 8,
  },
  wishlistOriginalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  wishlistDate: {
    fontSize: 12,
    color: "#999",
  },
  wishlistCardRight: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  wishlistRemoveBtn: {
    padding: 8,
  },
  wishlistBuyBtn: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  wishlistBuyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Reviews Styles
  reviewsContainer: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewCardLast: {
    marginBottom: 0,
  },
  reviewCardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewProductInfo: {
    flex: 1,
  },
  reviewProductName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  reviewRating: {
    flexDirection: "row",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  reviewText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  reviewHelpful: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewHelpfulText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  reviewDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewDeleteText: {
    fontSize: 12,
    color: "#F44336",
    marginLeft: 4,
    fontWeight: "600",
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});


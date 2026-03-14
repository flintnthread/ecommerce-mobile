import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ActivityTab = "recently_viewed" | "search_history" | "wishlist" | "reviews";

interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: string;
  image: any;
  viewedDate: string;
  category: string;
}

interface SearchHistory {
  id: string;
  query: string;
  date: string;
  resultsCount: number;
}

interface WishlistItem {
  id: string;
  name: string;
  price: string;
  originalPrice: string;
  discount: string;
  image: any;
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
  const [activeTab, setActiveTab] = useState<ActivityTab>("recently_viewed");

  // Sample data
  const recentlyViewed: RecentlyViewedProduct[] = [
    {
      id: "1",
      name: "Classic White T-Shirt",
      price: "₹599",
      image: require("../assets/images/age5.png"),
      viewedDate: "2 hours ago",
      category: "T-Shirts",
    },
    {
      id: "2",
      name: "Denim Jacket",
      price: "₹2,499",
      image: require("../assets/images/age6.png"),
      viewedDate: "1 day ago",
      category: "Jackets",
    },
    {
      id: "3",
      name: "Slim Fit Jeans",
      price: "₹1,299",
      image: require("../assets/images/age5.png"),
      viewedDate: "2 days ago",
      category: "Jeans",
    },
    {
      id: "4",
      name: "Casual Sneakers",
      price: "₹3,999",
      image: require("../assets/images/age6.png"),
      viewedDate: "3 days ago",
      category: "Footwear",
    },
  ];

  const searchHistory: SearchHistory[] = [
    {
      id: "1",
      query: "men's t-shirts",
      date: "Today, 10:30 AM",
      resultsCount: 245,
    },
    {
      id: "2",
      query: "denim jackets",
      date: "Yesterday, 3:45 PM",
      resultsCount: 89,
    },
    {
      id: "3",
      query: "sneakers",
      date: "2 days ago",
      resultsCount: 156,
    },
    {
      id: "4",
      query: "winter wear",
      date: "3 days ago",
      resultsCount: 312,
    },
    {
      id: "5",
      query: "formal shirts",
      date: "5 days ago",
      resultsCount: 178,
    },
  ];

  const wishlistItems: WishlistItem[] = [
    {
      id: "1",
      name: "Premium Leather Jacket",
      price: "₹4,999",
      originalPrice: "₹7,999",
      discount: "37% OFF",
      image: require("../assets/images/age5.png"),
      addedDate: "Added 2 days ago",
      inStock: true,
    },
    {
      id: "2",
      name: "Designer Sunglasses",
      price: "₹1,799",
      originalPrice: "₹2,499",
      discount: "28% OFF",
      image: require("../assets/images/age6.png"),
      addedDate: "Added 5 days ago",
      inStock: true,
    },
    {
      id: "3",
      name: "Sports Running Shoes",
      price: "₹3,499",
      originalPrice: "₹4,999",
      discount: "30% OFF",
      image: require("../assets/images/age5.png"),
      addedDate: "Added 1 week ago",
      inStock: false,
    },
  ];

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
          onPress: () => {
            Alert.alert("Cleared", "Search history has been cleared.");
          },
        },
      ]
    );
  };

  const handleRemoveFromWishlist = (id: string) => {
    Alert.alert(
      "Remove from Wishlist",
      "Are you sure you want to remove this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
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
            {recentlyViewed.length === 0 ? (
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
                  activeOpacity={0.7}
                >
                  <Image
                    source={product.image}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>{product.price}</Text>
                      <Text style={styles.viewedDate}>{product.viewedDate}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.productActionBtn}>
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
            {searchHistory.length === 0 ? (
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
                          {search.resultsCount} results • {search.date}
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
            {wishlistItems.length === 0 ? (
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
                        <Text style={styles.wishlistOriginalPrice}>
                          {item.originalPrice}
                        </Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{item.discount}</Text>
                        </View>
                      </View>
                      <Text style={styles.wishlistDate}>{item.addedDate}</Text>
                    </View>
                  </View>
                  <View style={styles.wishlistCardRight}>
                    <TouchableOpacity
                      style={styles.wishlistRemoveBtn}
                      onPress={() => handleRemoveFromWishlist(item.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                    </TouchableOpacity>
                    {item.inStock && (
                      <TouchableOpacity style={styles.wishlistBuyBtn}>
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


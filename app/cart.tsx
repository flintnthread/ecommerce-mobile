import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

interface CartItem {
  id: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface SimilarProduct {
  id: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([
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
    {
      id: "3",
      name: "Casual Sneakers",
      image: require("../assets/images/age5.png"),
      price: 3499,
      originalPrice: 4999,
      quantity: 1,
      size: "42",
      color: "White",
    },
  ]);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Similar Products Data
  const similarProducts: SimilarProduct[] = [
    {
      id: "sim1",
      name: "Classic White Shirt",
      image: require("../assets/images/age5.png"),
      price: 999,
      originalPrice: 1499,
      rating: 4.5,
      reviews: 128,
    },
    {
      id: "sim2",
      name: "Slim Fit Chinos",
      image: require("../assets/images/age6.png"),
      price: 1899,
      originalPrice: 2499,
      rating: 4.3,
      reviews: 89,
    },
    {
      id: "sim3",
      name: "Casual Polo T-Shirt",
      image: require("../assets/images/age5.png"),
      price: 799,
      originalPrice: 1199,
      rating: 4.7,
      reviews: 256,
    },
    {
      id: "sim4",
      name: "Formal Dress Pants",
      image: require("../assets/images/age6.png"),
      price: 2199,
      originalPrice: 2999,
      rating: 4.4,
      reviews: 142,
    },
    {
      id: "sim5",
      name: "Cotton Hoodie",
      image: require("../assets/images/age5.png"),
      price: 1599,
      originalPrice: 2199,
      rating: 4.6,
      reviews: 203,
    },
    {
      id: "sim6",
      name: "Sports T-Shirt",
      image: require("../assets/images/age6.png"),
      price: 699,
      originalPrice: 999,
      rating: 4.2,
      reviews: 167,
    },
  ];

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = cartItems.reduce(
    (sum, item) =>
      sum + (item.originalPrice ? item.originalPrice - item.price : 0) * item.quantity,
    0
  );
  const totalDiscount = discount + couponDiscount;
  const deliveryCharge = subtotal > 2000 ? 0 : 99;
  const total = subtotal - totalDiscount + deliveryCharge;

  // Update quantity
  const updateQuantity = (id: string, change: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Remove product
  const removeProduct = (id: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setCartItems((prev) => prev.filter((item) => item.id !== id));
            Alert.alert("Removed", "Item has been removed from your cart.");
          },
        },
      ]
    );
  };

  // Apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Alert.alert("Invalid Coupon", "Please enter a coupon code.");
      return;
    }

    const validCoupons: Record<string, number> = {
      SAVE10: 10,
      SAVE20: 20,
      WELCOME50: 50,
      FLAT100: 100,
    };

    const coupon = couponCode.toUpperCase().trim();
    if (validCoupons[coupon]) {
      const discountAmount = Math.min(validCoupons[coupon], subtotal * 0.1);
      setAppliedCoupon(coupon);
      setCouponDiscount(discountAmount);
      Alert.alert("Success", `Coupon "${coupon}" applied successfully!`);
    } else {
      Alert.alert("Invalid Coupon", "The coupon code you entered is invalid.");
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    Alert.alert("Coupon Removed", "Coupon has been removed.");
  };

  // Add similar product to cart
  const addSimilarProductToCart = (product: SimilarProduct) => {
    const existingItem = cartItems.find((item) => item.id === product.id);
    
    if (existingItem) {
      // If product already in cart, increase quantity
      updateQuantity(product.id, 1);
      Alert.alert("Added", `${product.name} quantity increased in cart!`);
    } else {
      // Add new product to cart
      const newCartItem: CartItem = {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: 1,
      };
      setCartItems((prev) => [...prev, newCartItem]);
      Alert.alert("Added to Cart", `${product.name} has been added to your cart!`);
    }
  };

  // Proceed to checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some items first!");
      return;
    }
    router.push("/revieworders");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Text style={styles.headerSubtitle}>
              {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="close-circle" size={32} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={80} color="#E0E0E0" />
            </View>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>
              Add some items to get started!
            </Text>
            <TouchableOpacity
              style={styles.shopNowButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.shopNowButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cart Items</Text>
              {cartItems.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.cartItemCard,
                    index === cartItems.length - 1 && styles.cartItemCardLast,
                  ]}
                >
                  <Image source={item.image} style={styles.cartItemImage} />
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    {item.size && (
                      <Text style={styles.cartItemMeta}>
                        Size: {item.size} {item.color && `• Color: ${item.color}`}
                      </Text>
                    )}
                    <View style={styles.cartItemPriceRow}>
                      <View>
                        <Text style={styles.cartItemPrice}>
                          ₹{item.price.toLocaleString()}
                        </Text>
                        {item.originalPrice && (
                          <Text style={styles.cartItemOriginalPrice}>
                            ₹{item.originalPrice.toLocaleString()}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Quantity Controls */}
                    <View style={styles.quantityContainer}>
                      <Text style={styles.quantityLabel}>Quantity:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Ionicons
                            name="remove"
                            size={18}
                            color={item.quantity <= 1 ? "#CCC" : "#E97A1F"}
                          />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <Ionicons name="add" size={18} color="#E97A1F" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Remove Button */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeProduct(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F44336" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Apply Coupon Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Apply Coupon</Text>
              <View style={styles.couponContainer}>
                {appliedCoupon ? (
                  <View style={styles.appliedCouponCard}>
                    <View style={styles.appliedCouponInfo}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.appliedCouponText}>
                        {appliedCoupon} applied
                      </Text>
                      <Text style={styles.appliedCouponDiscount}>
                        -₹{couponDiscount.toLocaleString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeCouponButton}
                      onPress={handleRemoveCoupon}
                    >
                      <Ionicons name="close-circle" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.couponInputContainer}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChangeText={setCouponCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyCouponButton}
                      onPress={handleApplyCoupon}
                    >
                      <Text style={styles.applyCouponButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Price Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Summary</Text>
              <View style={styles.priceSummaryCard}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Subtotal</Text>
                  <Text style={styles.priceValue}>
                    ₹{subtotal.toLocaleString()}
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Product Discount</Text>
                    <Text style={[styles.priceValue, styles.discountText]}>
                      -₹{discount.toLocaleString()}
                    </Text>
                  </View>
                )}
                {couponDiscount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Coupon Discount</Text>
                    <Text style={[styles.priceValue, styles.discountText]}>
                      -₹{couponDiscount.toLocaleString()}
                    </Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Charge</Text>
                  <Text style={styles.priceValue}>
                    {deliveryCharge === 0 ? (
                      <Text style={styles.freeText}>FREE</Text>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Similar Products Section */}
            <View style={styles.section}>
              <View style={styles.similarProductsHeader}>
                <Text style={styles.sectionTitle}>You May Also Like</Text>
                <Text style={styles.similarProductsSubtitle}>
                  Similar products you might enjoy
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarProductsScroll}
                style={styles.similarProductsContainer}
              >
                {similarProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.similarProductCard}
                    onPress={() => addSimilarProductToCart(product)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={product.image}
                      style={styles.similarProductImage}
                    />
                    {product.originalPrice && (
                      <View style={styles.similarProductBadge}>
                        <Text style={styles.similarProductBadgeText}>
                          {Math.round(
                            ((product.originalPrice - product.price) /
                              product.originalPrice) *
                              100
                          )}
                          % OFF
                        </Text>
                      </View>
                    )}
                    <View style={styles.similarProductInfo}>
                      <Text style={styles.similarProductName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      {product.rating && (
                        <View style={styles.similarProductRating}>
                          <Ionicons name="star" size={12} color="#FFB800" />
                          <Text style={styles.similarProductRatingText}>
                            {product.rating}
                          </Text>
                          {product.reviews && (
                            <Text style={styles.similarProductReviewsText}>
                              ({product.reviews})
                            </Text>
                          )}
                        </View>
                      )}
                      <View style={styles.similarProductPriceRow}>
                        <Text style={styles.similarProductPrice}>
                          ₹{product.price.toLocaleString()}
                        </Text>
                        {product.originalPrice && (
                          <Text style={styles.similarProductOriginalPrice}>
                            ₹{product.originalPrice.toLocaleString()}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.similarProductAddButton}
                        onPress={() => addSimilarProductToCart(product)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                        <Text style={styles.similarProductAddButtonText}>
                          Add to Cart
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>

      {/* Proceed to Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>Total:</Text>
            <Text style={styles.footerTotalValue}>₹{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexShrink: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 10,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  shopNowButton: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shopNowButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  cartItemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cartItemCardLast: {
    marginBottom: 0,
  },
  cartItemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  cartItemMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  cartItemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cartItemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
  },
  cartItemOriginalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 12,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  quantityButton: {
    padding: 8,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    paddingHorizontal: 16,
    minWidth: 40,
    textAlign: "center",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 6,
    marginTop: 4,
  },
  removeButtonText: {
    fontSize: 13,
    color: "#F44336",
    marginLeft: 6,
    fontWeight: "500",
  },
  couponContainer: {
    marginTop: 8,
  },
  couponInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  applyCouponButton: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  applyCouponButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  appliedCouponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedCouponText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
    marginLeft: 8,
    marginRight: 12,
  },
  appliedCouponDiscount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4CAF50",
  },
  removeCouponButton: {
    padding: 4,
  },
  priceSummaryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: "#666",
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  discountText: {
    color: "#4CAF50",
  },
  freeText: {
    color: "#4CAF50",
    fontWeight: "700",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E97A1F",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E97A1F",
  },
  checkoutButton: {
    backgroundColor: "#E97A1F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  similarProductsHeader: {
    marginBottom: 16,
  },
  similarProductsSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  similarProductsContainer: {
    marginHorizontal: -20,
  },
  similarProductsScroll: {
    paddingHorizontal: 20,
    paddingRight: 20,
  },
  similarProductCard: {
    width: width * 0.45,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
  },
  similarProductImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#F5F5F5",
    resizeMode: "cover",
  },
  similarProductBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#E97A1F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  similarProductBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  similarProductInfo: {
    padding: 12,
  },
  similarProductName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
    minHeight: 36,
  },
  similarProductRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  similarProductRatingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginLeft: 4,
  },
  similarProductReviewsText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  similarProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  similarProductPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E97A1F",
  },
  similarProductOriginalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  similarProductAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E97A1F",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  similarProductAddButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});


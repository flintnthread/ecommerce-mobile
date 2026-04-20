import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  Animated,
  Easing,
  type LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  addProductToCart,
  adjustCartQuantity,
  loadCart,
  removeCartLine,
  resolveProductImage,
  type PersistedCartLine,
} from "../lib/shopStorage";
import type { ApiCartItem, ApiCartPriceSummary } from "../lib/cartServerApi";
import {
  deleteCartClearServer,
  deleteCartLineServer,
  fetchServerCartBundle,
  parseCartApiError,
  putCartItemQuantityDelta,
} from "../lib/cartServerApi";

const { width, height } = Dimensions.get("window");
const runnerBoyCartImg = require("../assets/images/runner-boy-cart.png");
const RUNNER_W = 170;
const RUNNER_H = 64;

type CartItemSource = "local" | "server";

interface CartItem {
  id: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
  source: CartItemSource;
  serverItemId?: number;
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

function persistedToCartItem(line: PersistedCartLine): CartItem {
  return {
    id: line.id,
    name: line.name,
    image: resolveProductImage(line.id),
    price: line.price,
    originalPrice: line.mrp > line.price ? line.mrp : undefined,
    quantity: line.quantity,
    source: "local",
  };
}

function serverRowToCartItem(row: ApiCartItem): CartItem {
  const uri = String(row.imageUrl ?? "").trim();
  const image =
    uri && /^https?:\/\//i.test(uri)
      ? { uri }
      : resolveProductImage(String(row.productId));
  const price = row.sellingPrice ?? row.price;
  const mrp = row.mrpPrice ?? row.originalPrice;
  const orig = mrp > price + 0.009 ? mrp : undefined;
  return {
    id: String(row.itemId),
    name: row.name,
    image,
    price,
    originalPrice: orig,
    quantity: Math.max(1, row.quantity),
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    source: "server",
    serverItemId: row.itemId,
  };
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSource, setCartSource] = useState<CartItemSource>("local");
  const [serverPriceSummary, setServerPriceSummary] = useState<ApiCartPriceSummary | null>(
    null
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [logoLayout, setLogoLayout] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const [searchLayout, setSearchLayout] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const [headerLayout, setHeaderLayout] = useState<{ w: number; h: number } | null>(null);

  const animProgress = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;
  const walkBob = useRef(new Animated.Value(0)).current;

  const animationRange = useMemo(() => {
    if (!logoLayout || !searchLayout || !headerLayout) return null;
    // Start at the logo itself (not from the middle of header).
    const startX = Math.max(0, logoLayout.x + Math.max(0, logoLayout.w - 2));
    // Stop with the cart trolley snug beside the search icon.
    const endX = Math.max(startX + 24, searchLayout.x - RUNNER_W + 10);
    const y = Math.max(2, headerLayout.h / 2 - RUNNER_H / 2);
    return { startX, endX, y };
  }, [logoLayout, searchLayout, headerLayout]);

  useEffect(() => {
    walkBob.setValue(0);

    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(walkBob, {
          toValue: 1,
          duration: 260,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(walkBob, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    bobLoop.start();
    return () => {
      bobLoop.stop();
    };
  }, [walkBob]);

  useEffect(() => {
    if (!animationRange) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(animProgress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(animProgress, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 1,
            duration: 2400,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(250),
      ])
    );

    loop.start();
    return () => {
      loop.stop();
    };
  }, [animationRange, animOpacity, animProgress]);

  const onHeaderLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setHeaderLayout({ w, h });
  };

  const onLogoLayout = (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    setLogoLayout({ x, y, w, h });
  };

  const onSearchIconLayout = (e: LayoutChangeEvent) => {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    setSearchLayout({ x, y, w, h });
  };

  const reloadCartFromStorage = useCallback(async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    if (token) {
      try {
        const bundle = await fetchServerCartBundle();
        if (bundle) {
          setServerPriceSummary(bundle.priceSummary);
          setCartItems(bundle.items.map(serverRowToCartItem));
          setCartSource("server");
          return;
        }
      } catch {
        /* fall back to local */
      }
    }
    setCartSource("local");
    setServerPriceSummary(null);
    const lines = await loadCart();
    setCartItems(lines.map(persistedToCartItem));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadCartFromStorage();
    }, [reloadCartFromStorage])
  );

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

  // Calculate totals (server cart uses API priceSummary when available)
  const subtotal = useMemo(() => {
    if (cartSource === "server" && serverPriceSummary) {
      return serverPriceSummary.subtotal;
    }
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartSource, serverPriceSummary, cartItems]);

  const discount = useMemo(() => {
    if (cartSource === "server" && serverPriceSummary) {
      return serverPriceSummary.discount;
    }
    return cartItems.reduce(
      (sum, item) =>
        sum + (item.originalPrice ? item.originalPrice - item.price : 0) * item.quantity,
      0
    );
  }, [cartSource, serverPriceSummary, cartItems]);

  const totalDiscount = discount + couponDiscount;

  const deliveryCharge = useMemo(() => {
    if (cartSource === "server" && serverPriceSummary) {
      return serverPriceSummary.deliveryCharge;
    }
    return subtotal > 2000 ? 0 : 99;
  }, [cartSource, serverPriceSummary, subtotal]);

  const orderTotal = useMemo(() => {
    if (cartSource === "server" && serverPriceSummary) {
      return serverPriceSummary.finalTotal;
    }
    return subtotal - totalDiscount + deliveryCharge;
  }, [
    cartSource,
    serverPriceSummary,
    subtotal,
    totalDiscount,
    deliveryCharge,
  ]);

  // Update quantity
  const updateQuantity = (id: string, change: number) => {
    void (async () => {
      const item = cartItems.find((x) => x.id === id);
      if (item?.serverItemId != null) {
        try {
          if (change < 0 && item.quantity <= 1) {
            await deleteCartLineServer(item.serverItemId);
          } else if (change !== 0) {
            await putCartItemQuantityDelta(item.serverItemId, change);
          }
          await reloadCartFromStorage();
        } catch (e) {
          Alert.alert("Cart", parseCartApiError(e, "Could not update quantity."));
        }
        return;
      }
      await adjustCartQuantity(id, change);
      await reloadCartFromStorage();
    })();
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
            void (async () => {
              const item = cartItems.find((x) => x.id === id);
              try {
                if (item?.serverItemId != null) {
                  await deleteCartLineServer(item.serverItemId);
                } else {
                  await removeCartLine(id);
                }
                await reloadCartFromStorage();
                Alert.alert("Removed", "Item has been removed from your cart.");
              } catch (e) {
                Alert.alert("Cart", parseCartApiError(e, "Could not remove item."));
              }
            })();
          },
        },
      ]
    );
  };

  const handleClearServerCart = () => {
    Alert.alert(
      "Clear cart",
      "Remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteCartClearServer();
                await reloadCartFromStorage();
              } catch (e) {
                Alert.alert("Cart", parseCartApiError(e, "Could not clear cart."));
              }
            })();
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
    void (async () => {
      await addProductToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.originalPrice ?? product.price,
      });
      await reloadCartFromStorage();
      Alert.alert("Added to Cart", `${product.name} has been added to your cart!`);
    })();
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
      <View style={styles.header} onLayout={onHeaderLayout}>
        <View onLayout={onLogoLayout}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Image
              source={require("../assets/MainCatImages/images/fntfav.png")}
              style={styles.headerFavicon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {animationRange ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.headerRunner,
                {
                  top: animationRange.y,
                  opacity: animOpacity,
                  transform: [
                    {
                      translateX: animProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [animationRange.startX, animationRange.endX],
                      }),
                    },
                    {
                      translateY: walkBob.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -2.5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image source={runnerBoyCartImg} style={styles.runnerImage} resizeMode="contain" />
            </Animated.View>
          </>
        ) : null}

        {isSearchVisible ? (
          <View style={styles.headerSearchWrapper}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#69798c"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search cart"
              placeholderTextColor="#69798c"
              value={headerSearchQuery}
              onChangeText={setHeaderSearchQuery}
              style={styles.searchInputHeader}
              autoFocus
            />
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setIsSearchVisible((prev) => !prev)}
            style={styles.headerIcon}
            accessibilityRole="button"
            accessibilityLabel="Toggle search"
            onLayout={onSearchIconLayout}
          >
            <Ionicons name="search-outline" size={20} color="#ef7b1a" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/wishlist")}
            style={styles.headerIcon}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Ionicons name="heart" size={20} color="red" />
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
              <View style={styles.cartSectionTitleRow}>
                <Text style={styles.sectionTitle}>Cart Items</Text>
                {cartSource === "server" && cartItems.length > 0 ? (
                  <TouchableOpacity onPress={handleClearServerCart} hitSlop={12}>
                    <Text style={styles.clearCartText}>Clear all</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
                    {(item.size || item.color) && (
                      <Text style={styles.cartItemMeta}>
                        {item.size ? `Size: ${item.size}` : ""}
                        {item.size && item.color ? " • " : ""}
                        {item.color ? `Color: ${item.color}` : ""}
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
                          disabled={
                            item.source === "local" && item.quantity <= 1
                          }
                        >
                          <Ionicons
                            name="remove"
                            size={18}
                            color={
                              item.source === "local" && item.quantity <= 1
                                ? "#CCC"
                                : "#E97A1F"
                            }
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

            {/* Apply Coupon — local cart only (server totals from checkout API) */}
            {cartSource === "local" ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Apply Coupon</Text>
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
            ) : null}

            {/* Price Summary */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Price Summary</Text>
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
                {cartSource === "local" && couponDiscount > 0 ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Coupon Discount</Text>
                    <Text style={[styles.priceValue, styles.discountText]}>
                      -₹{couponDiscount.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
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
                  <Text style={styles.totalValue}>₹{orderTotal.toLocaleString()}</Text>
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
            <Text style={styles.footerTotalValue}>₹{orderTotal.toLocaleString()}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
    zIndex: 10,
    elevation: 10,
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerFavicon: {
    width: 36,
    height: 36,
  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInputHeader: {
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 14,
  },
  headerRunner: {
    position: "absolute",
    left: 0,
    zIndex: 31,
    elevation: 31,
  },
  runnerImage: {
    width: RUNNER_W,
    height: RUNNER_H,
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
    marginBottom: 0,
  },
  cartSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  clearCartText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E97A1F",
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


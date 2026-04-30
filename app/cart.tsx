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
  Animated,
  Easing,
  type LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
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
import { useLanguage } from "../lib/language";

const runnerBoyCartImg = require("../assets/images/runner-boy-cart.png");
const RUNNER_W = 170;
const RUNNER_H = 64;

type CartItemSource = "local" | "server";

interface CartItem {
  id: string;
  /** Product id to open in product detail (server: productId, local: line id). */
  productDetailId: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
  stock?: number;
  source: CartItemSource;
  serverItemId?: number;
}

function persistedToCartItem(line: PersistedCartLine): CartItem {
  return {
    id: line.id,
    productDetailId: line.id,
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

function serverRowToCartItem(row: ApiCartItem): CartItem {
  const uri = String(row.imageUrl ?? "").trim();
  const image = uri ? { uri } : resolveProductImage(String(row.productId));
  const price = row.sellingPrice ?? row.price;
  const mrp = row.mrpPrice ?? row.originalPrice;
  const orig = mrp > price + 0.009 ? mrp : undefined;
  return {
    id: String(row.itemId),
    productDetailId: String(row.productId),
    name: row.name,
    image,
    price,
    originalPrice: orig,
    quantity: Math.max(1, row.quantity),
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    stock: typeof row.stock === "number" ? Math.max(0, row.stock) : 0,
    source: "server",
    serverItemId: row.itemId,
  };
}

export default function CartScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
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
        // Signed-in users should remain server-authoritative.
        setServerPriceSummary(null);
        setCartItems([]);
        setCartSource("server");
        return;
      } catch {
        // Signed-in users should remain server-authoritative.
        setServerPriceSummary(null);
        setCartItems([]);
        setCartSource("server");
        return;
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
  const [apiWeightDeliveryCharge, setApiWeightDeliveryCharge] = useState<number | null>(null);
  const [qtyUpdatingIds, setQtyUpdatingIds] = useState<Set<string>>(new Set());
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
    return 0;
  }, [cartSource, serverPriceSummary]);

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
      if (qtyUpdatingIds.has(id)) return;
      const item = cartItems.find((x) => x.id === id);
      if (
        change > 0 &&
        item &&
        typeof item.stock === "number" &&
        item.stock >= 0 &&
        item.quantity >= item.stock
      ) {
        Alert.alert(
          tr("Stock not available"),
          tr("No more stock available for this variant.")
        );
        return;
      }
      if (item?.serverItemId != null) {
        setQtyUpdatingIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        try {
          if (change < 0 && item.quantity <= 1) {
            await deleteCartLineServer(item.serverItemId);
          } else if (change !== 0) {
            await putCartItemQuantityDelta(item.serverItemId, change);
          }
          await reloadCartFromStorage();
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
        await reloadCartFromStorage();
        return;
      }
      setQtyUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      try {
        await adjustCartQuantity(id, change);
        await reloadCartFromStorage();
      } finally {
        setQtyUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  };

  // Remove product
  const removeProduct = (id: string) => {
    Alert.alert(
      tr("Remove Item"),
      tr("Are you sure you want to remove this item from your cart?"),
      [
        { text: tr("Cancel"), style: "cancel" },
        {
          text: tr("Remove"),
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
                Alert.alert(tr("Removed"), tr("Item has been removed from your cart."));
              } catch (e) {
                Alert.alert(tr("Cart"), tr(parseCartApiError(e, "Could not remove item.")));
              }
            })();
          },
        },
      ]
    );
  };

  const handleClearServerCart = () => {
    Alert.alert(
      tr("Clear cart"),
      tr("Remove all items from your cart?"),
      [
        { text: tr("Cancel"), style: "cancel" },
        {
          text: tr("Clear all"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteCartClearServer();
                await reloadCartFromStorage();
              } catch (e) {
                Alert.alert(tr("Cart"), tr(parseCartApiError(e, "Could not clear cart.")));
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
      Alert.alert(tr("Invalid Coupon"), tr("Please enter a coupon code."));
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
      Alert.alert(tr("Success"), tr(`Coupon "${coupon}" applied successfully!`));
    } else {
      Alert.alert(tr("Invalid Coupon"), tr("The coupon code you entered is invalid."));
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    Alert.alert(tr("Coupon Removed"), tr("Coupon has been removed."));
  };

  // Proceed to checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(tr("Empty Cart"), tr("Your cart is empty. Add some items first!"));
      return;
    }
    const outOfStockLine = cartItems.find(
      (item) =>
        item.source === "server" &&
        typeof item.stock === "number" &&
        item.stock >= 0 &&
        item.quantity > item.stock
    );
    if (outOfStockLine) {
      Alert.alert(
        tr("Stock not available"),
        tr("Requested quantity is not available in stock. Please reduce quantity.")
      );
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
            accessibilityLabel={tr("Go back")}
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
              placeholder={tr("Search cart")}
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
            accessibilityLabel={tr("Toggle search")}
            onLayout={onSearchIconLayout}
          >
            <Ionicons name="search-outline" size={20} color="#ef7b1a" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/wishlist")}
            style={styles.headerIcon}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tr("Wishlist")}
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
            <Text style={styles.emptyText}>{tr("Your cart is empty")}</Text>
            <Text style={styles.emptySubtext}>
              {tr("Add some items to get started!")}
            </Text>
            <TouchableOpacity
              style={styles.shopNowButton}
              onPress={() => router.push("/home")}
            >
              <Text style={styles.shopNowButtonText}>{tr("Shop Now")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.section}>
              <View style={styles.cartSectionTitleRow}>
                <Text style={styles.sectionTitle}>{tr("Cart Items")}</Text>
                {cartSource === "server" && cartItems.length > 0 ? (
                  <TouchableOpacity onPress={handleClearServerCart} hitSlop={12}>
                    <Text style={styles.clearCartText}>{tr("Clear all")}</Text>
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
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/productdetail",
                        params: { id: item.productDetailId },
                      } as any)
                    }
                  >
                    <Image source={item.image} style={styles.cartItemImage} />
                  </TouchableOpacity>
                  <View style={styles.cartItemInfo}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: "/productdetail",
                          params: { id: item.productDetailId },
                        } as any)
                      }
                    >
                      <Text
                        style={styles.cartItemName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                    {(item.size || item.color) && (
                      <Text style={styles.cartItemMeta}>
                        {item.size ? `${tr("Size")}: ${item.size}` : ""}
                        {item.size && item.color ? " • " : ""}
                        {item.color ? `${tr("Color")}: ${item.color}` : ""}
                      </Text>
                    )}
                    {typeof item.stock === "number" && item.stock >= 0 ? (
                      <Text style={styles.stockHintText}>
                        {item.stock > 0
                          ? `Only ${item.stock} left`
                          : tr("Out of stock")}
                      </Text>
                    ) : null}
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
                      <Text style={styles.quantityLabel}>{tr("Quantity")}:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, -1)}
                          disabled={
                            qtyUpdatingIds.has(item.id) ||
                            (item.source === "local" && item.quantity <= 1)
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
                          disabled={qtyUpdatingIds.has(item.id)}
                        >
                          <Ionicons
                            name="add"
                            size={18}
                            color={
                              item.source === "server" &&
                              typeof item.stock === "number" &&
                              item.stock >= 0 &&
                              item.quantity >= item.stock
                                ? "#CCC"
                                : "#E97A1F"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Remove Button */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeProduct(item.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F44336" />
                      <Text style={styles.removeButtonText}>{tr("Remove")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Apply Coupon — local cart only (server totals from checkout API) */}
            {cartSource === "local" ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{tr("Apply Coupon")}</Text>
                <View style={styles.couponContainer}>
                  {appliedCoupon ? (
                    <View style={styles.appliedCouponCard}>
                      <View style={styles.appliedCouponInfo}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.appliedCouponText}>
                          {tr(`${appliedCoupon} applied`)}
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
                        placeholder={tr("Enter coupon code")}
                        value={couponCode}
                        onChangeText={setCouponCode}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={styles.applyCouponButton}
                        onPress={handleApplyCoupon}
                      >
                        <Text style={styles.applyCouponButtonText}>{tr("Apply")}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ) : null}

            {/* Price Summary */}
            <View style={[styles.section, styles.priceSummarySection]}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>{tr("Price Summary")}</Text>
              <View style={styles.priceSummaryCard}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{tr("Subtotal")}</Text>
                  <Text style={styles.priceValue}>
                    ₹{subtotal.toLocaleString()}
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{tr("Product Discount")}</Text>
                    <Text style={[styles.priceValue, styles.discountText]}>
                      -₹{discount.toLocaleString()}
                    </Text>
                  </View>
                )}
                {cartSource === "local" && couponDiscount > 0 ? (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{tr("Coupon Discount")}</Text>
                    <Text style={[styles.priceValue, styles.discountText]}>
                      -₹{couponDiscount.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{tr("Shipping charges")}</Text>
                  <Text style={styles.priceValue}>
                    {deliveryCharge <= 0 ? tr("Free") : `₹${deliveryCharge.toLocaleString()}`}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>{tr("Total")}</Text>
                  <Text style={styles.totalValue}>₹{orderTotal.toLocaleString()}</Text>
                </View>
              </View>
            </View>

          </>
        )}
      </ScrollView>

      {/* Proceed to Checkout Button */}
      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerTotal}>
            <Text style={styles.footerTotalLabel}>{tr("Total")}:</Text>
            <Text style={styles.footerTotalValue}>₹{orderTotal.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>{tr("Proceed to Checkout")}</Text>
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
    paddingBottom: 180,
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
  stockHintText: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "700",
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
  priceSummarySection: {
    marginBottom: 36,
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
});


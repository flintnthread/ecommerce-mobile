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
  Modal,
  type LayoutChangeEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  adjustCartQuantity,
  loadCart,
  loadWishlist,
  saveCart,
  removeCartLine,
  toggleWishlistProduct,
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
import api, { productByIdPath } from "../services/api";
import { useLanguage } from "../lib/language";
import AwesomeAlert from "react-native-awesome-alerts";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

const runnerBoyCartImg = require("../assets/images/runner-boy-cart.png");
const RUNNER_W = 170;
const RUNNER_H = 64;
const BOTTOM_TAB_RESERVED_HEIGHT = 92;

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

type VariantOptions = {
  sizes: string[];
  colors: string[];
};

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
        : undefined,
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
    stock: typeof row.availableStock === "number"
      ? Math.max(0, row.availableStock)
      : typeof row.stock === "number"
        ? Math.max(0, row.stock)
        : undefined,
    source: "server",
    serverItemId: row.itemId,
  };
}

export default function CartScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);
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
  const [footerHeight, setFooterHeight] = useState(0);

  const animProgress = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(1)).current;
  const walkBob = useRef(new Animated.Value(0)).current;
  const loadingLogoScale = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
  if (isSearchVisible) {
    animOpacity.setValue(0);
  } else {
    animOpacity.setValue(1);
  }
}, [isSearchVisible]);

  useEffect(() => {
    if (!isCartLoading) {
      loadingLogoScale.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingLogoScale, {
          toValue: 1.12,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(loadingLogoScale, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [isCartLoading, loadingLogoScale]);
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
    setIsCartLoading(true);
    try {
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
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  const reloadWishlistBadge = useCallback(async () => {
    const list = await loadWishlist();
    setWishlistCount(list.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadCartFromStorage();
      void reloadWishlistBadge();
    }, [reloadCartFromStorage, reloadWishlistBadge])
  );

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [apiWeightDeliveryCharge, setApiWeightDeliveryCharge] = useState<number | null>(null);
  const [qtyUpdatingIds, setQtyUpdatingIds] = useState<Set<string>>(new Set());
  const [isVariantModalVisible, setIsVariantModalVisible] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState(1);
  const [variantOptions, setVariantOptions] = useState<VariantOptions>({ sizes: [], colors: [] });
const [editingImage, setEditingImage] = useState<any>(null);
const [editingApiProduct, setEditingApiProduct] = useState<any | null>(null);

useEffect(() => {
  if (!editingApiProduct) return;

  const productData =
    editingApiProduct?.data ||
    editingApiProduct;

  const variants = Array.isArray(
    productData?.variants
  )
    ? productData.variants
    : [];

  let matchedVariant: any = null;

  matchedVariant = variants.find(
    (v: any) =>
      String(
        v.color ??
          v.colorName ??
          ""
      ).trim() ===
        String(
          editingColor ?? ""
        ).trim() &&
      String(
        v.size ?? ""
      ).trim() ===
        String(
          editingSize ?? ""
        ).trim()
  );

  if (!matchedVariant) {
    matchedVariant =
      variants.find(
        (v: any) =>
          String(
            v.color ??
              v.colorName ??
              ""
          ).trim() ===
          String(
            editingColor ?? ""
          ).trim()
      );
  }

  if (
    matchedVariant?.imageUrl
  ) {
    setEditingImage({
      uri: matchedVariant.imageUrl,
    });
  } else if (
    matchedVariant?.imagePath
  ) {
    setEditingImage({
      uri:
        matchedVariant.imagePath,
    });
  }
}, [
  editingColor,
  editingSize,
  editingApiProduct,
]);


const [alertVisible, setAlertVisible] = useState(false);
const [alertTitle, setAlertTitle] = useState("");
const [alertMessage, setAlertMessage] = useState("");
const [alertAction, setAlertAction] = useState<(() => void) | null>(null);
const showSweetAlert = (
  title: string,
  message: string,
  action?: () => void
) => {
  setAlertTitle(title);
  setAlertMessage(message);
  setAlertAction(() => action || null);
  setAlertVisible(true);
};


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
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

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
      if (qtyUpdatingIds.has(id)) {
        console.log("[Cart] Quantity update blocked - already updating", id);
        return;
      }
      const item = cartItems.find((x) => x.id === id);
      console.log("[Cart] Updating quantity:", { id, change, currentQty: item?.quantity, stock: item?.stock });

      // Check stock limit before increasing quantity
      if (change > 0 && item && typeof item.stock === "number" && item.stock >= 0) {
        if (item.quantity >= item.stock) {
          Alert.alert(
            tr("Stock Unavailable"),
            tr(`Only ${item.stock} items available in stock. You cannot add more.`)
          );
          return;
        }
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
          // Check if error is stock-related
          const errorMsg = parseCartApiError(e, "Could not update quantity.");
          if (/stock|inventory|unavailable|limit/i.test(errorMsg)) {
            // Refresh cart to get updated stock values from backend
            await reloadCartFromStorage();
            Alert.alert(tr("Stock Unavailable"), tr(errorMsg));
          } else {
            Alert.alert(tr("Cart"), tr(errorMsg));
          }
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
        const prevQuantity = item?.quantity ?? 0;
        console.log("[Cart] Calling adjustCartQuantity:", { id, change, stock: item?.stock });
        const updatedLines = await adjustCartQuantity(id, change, item?.stock);
        console.log("[Cart] adjustCartQuantity returned:", updatedLines.find(x => x.id === id)?.quantity);
        await reloadCartFromStorage();
        console.log("[Cart] reloadCartFromStorage completed");

        // Check if stock limit prevented full increase - use fresh data from storage
        if (change > 0 && item?.stock != null) {
          const freshCart = await loadCart();
          const freshItem = freshCart.find((x) => x.id === id);
          if (freshItem && freshItem.quantity < prevQuantity + change) {
            Alert.alert(
              tr("Stock Limit Reached"),
              tr(`Only ${item.stock} items available in stock. Quantity set to maximum available.`),
              [{ text: tr("OK") }]
            );
          }
        }
      } finally {
        setQtyUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    })();
  };

  const performRemoveProduct = async (
  id: string
) => {
  const item = cartItems.find(
    (x) => x.id === id
  );

  try {
    if (item?.serverItemId != null) {
      await deleteCartLineServer(
        item.serverItemId
      );
    } else {
      await removeCartLine(id);
    }

    await reloadCartFromStorage();
  } catch (e) {
    console.log(e);
  }
};
  
  // Remove product
 const removeProduct = (
  id: string
) => {
  showSweetAlert(
    tr("Remove Item"),
    tr(
      "Are you sure you want to remove this item from your cart?"
    ),
    () => {
      void performRemoveProduct(id);
    }
  );
};

const handleClearServerCart =
  () => {
    showSweetAlert(
      tr("Clear cart"),
      tr(
        "Remove all items from your cart?"
      ),
      () => {
        void (async () => {
          try {
            if (
              cartSource ===
              "server"
            ) {
              await deleteCartClearServer();
            } else {
              await saveCart([]);
            }

            await reloadCartFromStorage();
          } catch (e) {
            console.log(e);
          }
        })();
      }
    );
  };


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

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    Alert.alert(tr("Coupon Removed"), tr("Coupon has been removed."));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert(tr("Empty Cart"), tr("Your cart is empty. Add some items first!"));
      return;
    }
    router.push("/revieworders");
  };

  const handleBuyNow = (item: CartItem) => {
    router.push({
      pathname: "/revieworders",
      params: { buyNowItemId: item.id },
    } as any);
  };

  const deriveVariantOptions = (payload: unknown, fallbackItem: CartItem): VariantOptions => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    const root = payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
    const data = root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
    const variants = Array.isArray(data?.variants) ? data.variants : [];
    for (const row of variants) {
      if (!row || typeof row !== "object") continue;
      const v = row as Record<string, unknown>;
      const size = String(v.size ?? "").trim();
      const color = String(v.color ?? v.colorName ?? "").trim();
      if (size) sizes.add(size);
      if (color) colors.add(color);
    }
    if (fallbackItem.size) sizes.add(fallbackItem.size);
    if (fallbackItem.color) colors.add(fallbackItem.color);
    return {
      sizes: [...sizes],
      colors: [...colors],
    };
  };

  const handleOpenVariantEditor = (item: CartItem) => {
  void (async () => {
    setVariantLoading(true);

    setEditingItemId(item.id);

    setEditingQty(item.quantity);

    setEditingSize(item.size ?? null);

    setEditingColor(item.color ?? null);

    setIsVariantModalVisible(true);

    let options: VariantOptions = {
      sizes: item.size ? [item.size] : [],
      colors: item.color ? [item.color] : [],
    };

    const numericProductId = Math.floor(
      Number(item.productDetailId)
    );

    if (
      Number.isFinite(numericProductId) &&
      numericProductId > 0
    ) {
      try {
        const { data } = await api.get(
          productByIdPath(numericProductId)
        );

        setEditingApiProduct(data);

        options = deriveVariantOptions(
          data,
          item
        );

        const variants = Array.isArray(
          data?.variants
        )
          ? data.variants
          : [];

        const gallery = Array.isArray(
          data?.images
        )
          ? data.images.map((img: any) => ({
              uri:
                img.imageUrl ||
                img.imagePath,
            }))
          : [];

        let matchedVariant: any = null;

        matchedVariant = variants.find(
          (v: any) =>
            String(
              v.color ??
              v.colorName ??
              ""
            ).trim() ===
              String(
                item.color ?? ""
              ).trim() &&
            String(
              v.size ?? ""
            ).trim() ===
              String(
                item.size ?? ""
              ).trim()
        );

        if (!matchedVariant) {
          matchedVariant =
            variants[0];
        }

        if (
          matchedVariant?.imageUrl
        ) {
          setEditingImage({
            uri: matchedVariant.imageUrl,
          });
        } else if (
          matchedVariant?.imagePath
        ) {
          setEditingImage({
            uri:
              matchedVariant.imagePath,
          });
        } else if (
          gallery.length > 0
        ) {
          setEditingImage(
            gallery[0]
          );
        }
      } catch (e) {
        console.log(e);
      }
    }

    setVariantOptions(options);

    setVariantLoading(false);
  })();
};

  const handleSaveVariantSelection =
  () => {
    void (async () => {
      const itemId =
        editingItemId;

      if (!itemId) return;

      const cartItem =
        cartItems.find(
          (x) => x.id === itemId
        );

      if (!cartItem) return;

      if (
  cartItem.source ===
  "server"
) {
  const updatedCartItems =
    cartItems.map((line) =>
      line.id === itemId
        ? {
            ...line,
            quantity: Math.max(
              1,
              editingQty
            ),
            size:
              editingSize ??
              undefined,
            color:
              editingColor ??
              undefined,
            image:
              editingImage ??
              line.image,
          }
        : line
    );

  setCartItems(updatedCartItems);

  setIsVariantModalVisible(
    false
  );

  return;
}

      const lines =
        await loadCart();

      const nextLines =
        lines.map((line) =>
          line.id === itemId
            ? {
                ...line,
                quantity:
                  Math.max(
                    1,
                    editingQty
                  ),
                size:
                  editingSize ??
                  undefined,
                color:
                  editingColor ??
                  undefined,
                imageUri:
                  editingImage?.uri ??
                  line.imageUri,
              }
            : line
        );

      await saveCart(nextLines);

      await reloadCartFromStorage();

      setIsVariantModalVisible(
        false
      );
    })();
  };

  const handleAddToWishlist = (item: CartItem) => {
    void (async () => {
      try {
        const nowWishlisted = await toggleWishlistProduct({
          id: item.productDetailId,
          name: item.name,
          price: item.price,
          mrp: item.originalPrice ?? item.price,
        });
        if (nowWishlisted) {
          await performRemoveProduct(item.id);
          Alert.alert(
            tr("Wishlist"),
            tr("Item added to wishlist and removed from cart.")
          );
        }
        await reloadWishlistBadge();
      } catch {
        Alert.alert(tr("Wishlist"), tr("Could not update wishlist right now."));
      }
    })();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header} onLayout={onHeaderLayout}>
        <View onLayout={onLogoLayout}>
          <TouchableOpacity
            onPress={() => router.push("/")}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tr("Go to home")}
          >
            <Image
              source={require("../assets/MainCatImages/images/fntfav.png")}
              style={styles.headerFavicon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {animationRange && !isSearchVisible ? (
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
        {!isSearchVisible ? (
  <TouchableOpacity
    onPress={() => setIsSearchVisible(true)}
    style={styles.headerIcon}
    accessibilityRole="button"
    accessibilityLabel={tr("Toggle search")}
    onLayout={onSearchIconLayout}
  >
    <Ionicons
      name="search-outline"
      size={20}
      color="#ef7b1a"
    />
  </TouchableOpacity>
) : (
  <TouchableOpacity
    onPress={() => {
      setIsSearchVisible(false);
      setHeaderSearchQuery("");
    }}
    style={styles.headerIcon}
  >
    <Ionicons
      name="close-outline"
      size={22}
      color="#ef7b1a"
    />
  </TouchableOpacity>
)}

        {/* Wishlist Icon */}
        <TouchableOpacity
          onPress={() => router.push("/wishlist")}
          style={styles.headerIconHit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={tr("Wishlist")}
        >
          <Ionicons name="heart-outline" size={24} color="#0F172A" />
          {wishlistCount > 0 ? (
            <View style={styles.headerWishlistBadge}>
              <Text style={styles.headerWishlistBadgeText}>
                {wishlistCount > 99 ? "99+" : String(wishlistCount)}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          cartItems.length > 0
            ? { paddingBottom: Math.max(24, footerHeight + BOTTOM_TAB_RESERVED_HEIGHT + 24) }
            : { paddingBottom: BOTTOM_TAB_RESERVED_HEIGHT + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {isCartLoading && cartItems.length === 0 ? (
          <View style={styles.cartLoadingContainer}>
            <Animated.Image
              source={require("../assets/MainCatImages/images/fntfav.png")}
              style={[
                styles.cartLoadingFavicon,
                {
                  transform: [{ scale: loadingLogoScale }],
                },
              ]}
              resizeMode="contain"
            />
            <Text style={styles.cartLoadingText}>{tr("Loading your cart...")}</Text>
          </View>
        ) : cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>

          <Image
  source={runnerBoyCartImg}
  style={{
    width: 220,
    height: 120,
    opacity: 0.12,
    position: "absolute",
    top: 90,
  }}
  resizeMode="contain"
/>
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
<Text style={styles.shopNowButtonText}>{tr("Start")}</Text>
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
                  <View style={styles.cartItemTopRow}>
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
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleOpenVariantEditor(item)}
                        >
                          <Text style={styles.cartItemMeta}>
                            {item.size ? <Text style={styles.cartItemMetaLabel}>{tr("Size")}:</Text> : null}
                            {item.size ? ` ${item.size}` : ""}
                            {item.size && item.color ? " • " : ""}
                            {item.color ? <Text style={styles.cartItemMetaLabel}>{tr("Color")}:</Text> : null}
                            {item.color ? ` ${item.color}` : ""}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {typeof item.stock === "number" && item.stock > 0 && (
                        <Text
                          style={[
                            styles.stockHintText,
                            item.stock > 0 && item.stock <= 5 && styles.stockLowText,
                          ]}
                        >
                          {item.stock <= 5
                            ? tr(`Only ${item.stock} left`)
                            : tr(`${item.stock} in stock`)}
                        </Text>
                      )}
                      <View style={styles.cartItemPriceRow}>
                        <Text style={styles.cartItemPrice}>
                          ₹{item.price.toLocaleString()}
                        </Text>
                        {item.originalPrice && (
                          <Text style={styles.cartItemOriginalPrice}>
                            ₹{item.originalPrice.toLocaleString()}
                          </Text>
                        )}
                      </View>

                      {/* Quantity Controls - Flipkart/Meesho Style */}
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleOpenVariantEditor(item)}
                        style={styles.quantityRow}
                      >
                        <View style={styles.quantityStepper}>
                          <TouchableOpacity
                            style={[styles.stepperButton, styles.stepperButtonLeft]}
                            onPress={() => updateQuantity(item.id, -1)}
                            disabled={
                              qtyUpdatingIds.has(item.id) ||
                              (item.source === "local" && item.quantity <= 1)
                            }
                          >
                            <Ionicons
                              name="remove"
                              size={16}
                              color={
                                item.source === "local" && item.quantity <= 1
                                  ? "#CCC"
                                  : "#333"
                              }
                            />
                          </TouchableOpacity>
                          <View style={styles.quantityDisplay}>
                            <Text style={styles.quantityNumber}>{item.quantity}</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.stepperButton, styles.stepperButtonRight]}
                            onPress={() => updateQuantity(item.id, 1)}
                            disabled={
                              qtyUpdatingIds.has(item.id) ||
                              (typeof item.stock === "number" && item.quantity >= item.stock)
                            }
                          >
                            <Ionicons
                              name="add"
                              size={16}
                              color={
                                typeof item.stock === "number" && item.quantity >= item.stock
                                  ? "#CCC"
                                  : "#333"
                              }
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.qtyLabel}>{tr("Qty")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeProduct(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#F44336" />
                        <Text style={styles.removeButtonText}>{tr("Remove")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.actionButtonRow}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAddToWishlist(item)}
                    >
                      <Ionicons name="heart-outline" size={14} color="#374151" />
                      <Text style={styles.actionButtonText}>{tr("Add to Wishlist")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.buyNowButton]}
                      onPress={() => handleBuyNow(item)}
                    >
                      <Text style={styles.buyNowButtonText}>{tr("Buy Now")}</Text>
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
                <View style={styles.itemsSummaryHeader}>
                  <Text style={styles.itemsSummaryTitle}>{tr("Items in your cart")}</Text>
                  <Text style={styles.itemsSummaryCount}>
                    {totalItems} {totalItems === 1 ? tr("item") : tr("items")}
                  </Text>
                </View>
                <View style={styles.itemsSummaryList}>
                  {cartItems.map((item) => (
                    <View key={`summary-${item.id}`} style={styles.itemSummaryRow}>
                      <View style={styles.itemSummaryLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.itemSummaryName}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemSummaryQty}>
                          {tr("Unit Price")}: ₹{item.price.toLocaleString()}
                        </Text>
                        <Text style={styles.itemSummaryQty}>
                          {tr("Qty")}: {item.quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemSummaryAmount}>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.priceDivider} />
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
        <View style={styles.footer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
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

      <HomeBottomTabBar cartBadgeCount={totalItems} />

      <Modal
        visible={isVariantModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVariantModalVisible(false)}
      >
        <View style={styles.variantModalOverlay}>
          <View style={styles.variantModalCard}>
            <TouchableOpacity
              style={styles.variantModalClose}
              onPress={() => setIsVariantModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
      {editingItemId ? (
        <>
          <View
            style={{
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <Image
              source={
                editingImage ||
                require("../assets/images/look1.png")
              }
              style={{
                width: 140,
                height: 140,
                borderRadius: 14,
                backgroundColor: "#F3F4F6",
              }}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.variantTitle}>
            {tr("Select Size")}
          </Text>

          <View style={styles.variantOptionsRow}>
            {(
              variantOptions.sizes.length
                ? variantOptions.sizes
                : [editingSize ?? "M"]
            ).map((size) => (
              <TouchableOpacity
                key={`size-${size}`}
                style={[
                  styles.variantChip,
                  editingSize === size &&
                    styles.variantChipActive,
                ]}
                onPress={() =>
                  setEditingSize(size)
                }
              >
                <Text
                  style={[
                    styles.variantChipText,
                    editingSize === size &&
                      styles.variantChipTextActive,
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.variantTitle}>
            {tr("Select Color")}
          </Text>

          <View style={styles.variantOptionsRow}>
            {(
              variantOptions.colors.length
                ? variantOptions.colors
                : [editingColor ?? "Default"]
            ).map((color) => (
              <TouchableOpacity
                key={`color-${color}`}
                style={[
                  styles.variantChip,
                  editingColor === color &&
                    styles.variantChipActive,
                ]}
                onPress={() =>
                  setEditingColor(color)
                }
              >
                <Text
                  style={[
                    styles.variantChipText,
                    editingColor === color &&
                      styles.variantChipTextActive,
                  ]}
                >
                  {color}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.variantTitle}>
            {tr("Qty")}
          </Text>

          <View style={styles.variantQtyRow}>
            <TouchableOpacity
              style={styles.variantQtyBtn}
              onPress={() =>
                setEditingQty((prev) =>
                  Math.max(1, prev - 1)
                )
              }
            >
              <Ionicons
                name="remove"
                size={16}
                color="#111827"
              />
            </TouchableOpacity>

            <Text style={styles.variantQtyValue}>
              {editingQty}
            </Text>

            <TouchableOpacity
              style={styles.variantQtyBtn}
              onPress={() =>
                setEditingQty(
                  (prev) => prev + 1
                )
              }
            >
              <Ionicons
                name="add"
                size={16}
                color="#111827"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.variantSaveButton}
            onPress={
              handleSaveVariantSelection
            }
            disabled={variantLoading}
          >
            <Text
              style={
                styles.variantSaveButtonText
              }
            >
              {variantLoading
                ? tr("Loading...")
                : tr("Done")}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}


      <AwesomeAlert
  show={alertVisible}
  showProgress={false}
  title={alertTitle}
  message={alertMessage}
  closeOnTouchOutside={false}
  closeOnHardwareBackPress={false}
  showCancelButton={true}
  showConfirmButton={true}
  cancelText="Cancel"
  confirmText="OK"
  confirmButtonColor="#E97A1F"
  onCancelPressed={() => {
    setAlertVisible(false);
  }}
  onConfirmPressed={() => {
    setAlertVisible(false);

    if (alertAction) {
      alertAction();
    }
  }}
/>
    </View>
  </View>
</Modal>
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
  headerIconHit: {
    padding: 6,
    position: "relative",
  },
  headerWishlistBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerWishlistBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
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
    paddingBottom: 24,
  },
  cartLoadingContainer: {
    minHeight: 320,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    overflow: "hidden",
  },
  cartLoadingFavicon: {
    width: 62,
    height: 62,
    marginBottom: 16,
  },
  cartLoadingText: {
    fontSize: 14,
    color: "#69798c",
    fontWeight: "500",
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
    flexDirection: "column",
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
  cartItemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  cartItemMetaLabel: {
    fontWeight: "700",
    color: "#111827",
  },
  stockHintText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginBottom: 8,
  },
  stockOutText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  stockLowText: {
    color: "#EA580C",
    fontWeight: "700",
  },
  cartItemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C4C4C4",
    borderRadius: 4,
    backgroundColor: "#FFF",
    height: 32,
  },
  stepperButton: {
    width: 32,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
  },
  stepperButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: "#C4C4C4",
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  stepperButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: "#C4C4C4",
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  quantityDisplay: {
    minWidth: 44,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 4,
  },
  quantityNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  qtyLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  buyNowButton: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  buyNowButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
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
  itemsSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsSummaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  itemsSummaryCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  itemsSummaryList: {
    gap: 10,
  },
  itemSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemSummaryLeft: {
    flex: 1,
  },
  itemSummaryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 2,
  },
  itemSummaryQty: {
    fontSize: 12,
    color: "#64748B",
  },
  itemSummaryAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
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
    bottom: BOTTOM_TAB_RESERVED_HEIGHT,
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
  variantModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  variantModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  variantModalClose: {
    alignSelf: "flex-end",
    padding: 4,
  },
  variantTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 10,
  },
  variantOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  variantChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  variantChipActive: {
    borderColor: "#D946EF",
    backgroundColor: "#FDF4FF",
  },
  variantChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  variantChipTextActive: {
    color: "#A21CAF",
  },
  variantQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 14,
  },
  variantQtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  variantQtyValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    minWidth: 30,
    textAlign: "center",
  },
  variantSaveButton: {
    marginTop: 8,
    backgroundColor: "#E97A1F",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  variantSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
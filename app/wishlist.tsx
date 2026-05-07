import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Animated,
  ActivityIndicator,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api, { WISHLIST_REMOVE_PATH, WISHLIST_USER_PATH } from "../services/api";
import {
  getCartUnitCount,
  parseCartApiError,
  postCartAdd,
} from "../lib/cartServerApi";
import {
  addProductToCart,
  loadWishlist,
  removeWishlistLine,
  resolveProductImage,
  type PersistedWishlistLine,
} from "../lib/shopStorage";
import { useLanguage } from "../lib/language";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

const { width, height } = Dimensions.get("window");

interface WishlistItem {
  /** Row key: server `wishlistId`, or local storage line id. */
  id: string;
  productId: number;
  variantId: number;
  /** When true, row came from API and can be removed with DELETE `/api/wishlist/remove`. */
  serverBacked: boolean;
  name: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
  addedDate: string;
  inStock: boolean;
  size?: string;
  color?: string;
}

type SuggestionItem = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: number;
  mrp: number;
  size: string;
  color: string;
};

const EMPTY_WISHLIST_SUGGESTIONS: SuggestionItem[] = [
  {
    id: "101",
    name: "Trendy Everyday Sneakers",
    image: resolveProductImage("101"),
    price: 899,
    mrp: 1299,
    size: "9",
    color: "Orange",
  },
  {
    id: "102",
    name: "Classic Casual T-Shirt",
    image: resolveProductImage("102"),
    price: 499,
    mrp: 799,
    size: "M",
    color: "Blue",
  },
  {
    id: "103",
    name: "Blue Denim Jeans",
    image: resolveProductImage("103"),
    price: 1199,
    mrp: 1699,
    size: "32",
    color: "Navy",
  },
  {
    id: "104",
    name: "Stylish Analog Watch",
    image: resolveProductImage("104"),
    price: 1399,
    mrp: 1999,
    size: "Free",
    color: "Black",
  },
];

type ApiWishlistImage = {
  imageUrl?: string | null;
  imagePath?: string | null;
};

type ApiWishlistRow = {
  wishlistId?: number | string | null;
  productId?: number | string | null;
  variantId?: number | string | null;
  productName?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  images?: ApiWishlistImage[] | null;
  sellingPrice?: number | string | null;
  mrpPrice?: number | string | null;
  addedAt?: string | null;
  inStock?: boolean | null;
  size?: string | null;
  color?: string | null;
};

function numLike(v: unknown): number {
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Spring returns a JSON array; some gateways wrap the body. */
function normalizeWishlistApiRows(payload: unknown): ApiWishlistRow[] {
  if (Array.isArray(payload)) return payload as ApiWishlistRow[];
  if (payload == null || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  for (const key of ["data", "items", "content", "wishlist", "wishlistItems"] as const) {
    const v = o[key];
    if (Array.isArray(v)) return v as ApiWishlistRow[];
  }
  const inner = o.data;
  if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
    return normalizeWishlistApiRows(inner);
  }
  return [];
}

function firstWishlistRowImageUri(row: ApiWishlistRow): string {
  const imgs = Array.isArray(row.images) ? row.images : [];
  for (const im of imgs) {
    if (!im || typeof im !== "object") continue;
    const u = String(im.imageUrl ?? im.imagePath ?? "").trim();
    if (u) return u;
  }
  return String(row.imageUrl ?? row.image ?? "").trim();
}

function formatWishlistDate(iso?: string | null): string {
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
}

function apiRowToWishlistItem(row: ApiWishlistRow): WishlistItem | null {
  const productId = Math.floor(Number(row.productId));
  const variantId = Math.floor(Number(row.variantId));
  const wishlistId = Math.floor(Number(row.wishlistId));
  if (!Number.isFinite(productId) || productId <= 0) return null;
  if (!Number.isFinite(variantId) || variantId <= 0) return null;

  const uri = firstWishlistRowImageUri(row);
  const selling = numLike(row.sellingPrice);
  const mrp = numLike(row.mrpPrice);
  const price = selling > 0 ? Math.round(selling) : Math.round(mrp) || 0;
  const mrpRounded = mrp > 0 ? Math.round(mrp) : price;

  const name =
    String(row.productName ?? "").trim() || `Product ${productId}`;

  return {
    id: String(Number.isFinite(wishlistId) && wishlistId > 0 ? wishlistId : `${productId}-${variantId}`),
    productId,
    variantId,
    serverBacked: true,
    name,
    image: uri ? { uri } : resolveProductImage(String(productId)),
    price,
    originalPrice: mrpRounded > price ? mrpRounded : undefined,
    addedDate: formatWishlistDate(row.addedAt),
    inStock: row.inStock !== false,
    size: row.size ? String(row.size) : undefined,
    color: row.color ? String(row.color) : undefined,
  };
}

function persistedToWishlistItem(line: PersistedWishlistLine): WishlistItem {
  const pid = Math.floor(Number(line.id));
  const numericId = Number.isFinite(pid) && pid > 0;
  return {
    id: line.id,
    productId: numericId ? pid : 0,
    variantId: 0,
    serverBacked: false,
    name: line.name,
    image: resolveProductImage(line.id),
    price: line.price,
    originalPrice: line.mrp > line.price ? line.mrp : undefined,
    addedDate: "Recently",
    inStock: true,
  };
}

export default function WishlistScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const heartsAnimRef = useRef<Animated.Value[]>([]);
  const emptyHeartPulse = useRef(new Animated.Value(0)).current;

  // Toast states
  const [showCartAlert, setShowCartAlert] = useState(false);
  const [addedItemName, setAddedItemName] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletedItemName, setDeletedItemName] = useState("");
  const alertScale = useRef(new Animated.Value(0)).current;
  const alertOpacity = useRef(new Animated.Value(0)).current;

  const openProductDetail = useCallback(
    (item: WishlistItem) => {
      const id =
        Number.isFinite(item.productId) && item.productId > 0
          ? String(item.productId)
          : String(item.id);
      router.push({ pathname: "/productdetail", params: { id } } as any);
    },
    [router]
  );

  const fallingHearts = useMemo(() => {
    const count = 16;
    const out = Array.from({ length: count }, (_, i) => {
      const x = Math.max(0, Math.min(width - 28, Math.random() * (width - 28)));
      const size = 12 + Math.round(Math.random() * 12);
      const delay = Math.round(Math.random() * 900);
      const duration = 2800 + Math.round(Math.random() * 1400);
      const opacity = 0.22 + Math.random() * 0.35;
      const drift = -14 + Math.random() * 28;
      return { id: `heart-${i}`, x, size, delay, duration, opacity, drift };
    });
    heartsAnimRef.current = out.map(() => new Animated.Value(-60));
    return out;
  }, []);

  const reloadWishlistFromStorage = useCallback(async () => {
    const lines = await loadWishlist();
    setWishlistItems(lines.map(persistedToWishlistItem));
  }, []);

  const reloadCartCount = useCallback(async () => {
    setCartCount(await getCartUnitCount());
  }, []);

  const loadWishlistScreen = useCallback(async () => {
    await reloadCartCount();
    const token = (await AsyncStorage.getItem("token"))?.trim();
    if (!token) {
      await reloadWishlistFromStorage();
      setWishlistLoading(false);
      return;
    }

    setWishlistLoading(true);
    try {
      const { data } = await api.get<unknown>(WISHLIST_USER_PATH);
      const rows = normalizeWishlistApiRows(data);
      const apiItems = rows
        .map((r) => apiRowToWishlistItem(r))
        .filter((x): x is WishlistItem => x != null);
      setWishlistItems(apiItems);
    } catch {
      await reloadWishlistFromStorage();
    } finally {
      setWishlistLoading(false);
    }
  }, [reloadWishlistFromStorage, reloadCartCount]);

  useFocusEffect(
    useCallback(() => {
      void loadWishlistScreen();
    }, [loadWishlistScreen])
  );

  useEffect(() => {
    const anims = fallingHearts.map((h, idx) => {
      const v = heartsAnimRef.current[idx]!;
      v.setValue(-60 - Math.random() * 220);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(h.delay),
          Animated.timing(v, {
            toValue: height + 80,
            duration: h.duration,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: -60 - Math.random() * 220,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });
    anims.forEach((a) => a.start());
    return () => {
      anims.forEach((a) => a.stop());
    };
  }, [fallingHearts]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(emptyHeartPulse, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(emptyHeartPulse, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [emptyHeartPulse]);

  const displayedWishlistItems = useMemo(() => {
    const q = headerSearchQuery.trim().toLowerCase();
    if (!q) return wishlistItems;
    return wishlistItems.filter((x) => x.name.toLowerCase().includes(q));
  }, [wishlistItems, headerSearchQuery]);

  const wishlistRows = useMemo(() => {
    const rows: WishlistItem[][] = [];
    for (let i = 0; i < displayedWishlistItems.length; i += 2) {
      rows.push(displayedWishlistItems.slice(i, i + 2));
    }
    return rows;
  }, [displayedWishlistItems]);

  // Cart sweet alert animation function
  const showCartSweetAlert = useCallback((itemName: string) => {
    setAddedItemName(itemName);
    setShowCartAlert(true);
    
    // Reset animation values
    alertScale.setValue(0);
    alertOpacity.setValue(0);
    
    // Animate in with scale
    Animated.parallel([
      Animated.timing(alertScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Auto hide after 2 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(alertScale, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(alertOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowCartAlert(false);
        });
      }, 2000);
    });
  }, []);

  // Delete sweet alert animation function
  const showDeleteSweetAlert = useCallback((itemName: string) => {
    setDeletedItemName(itemName);
    setShowDeleteAlert(true);
    
    // Reset animation values
    alertScale.setValue(0);
    alertOpacity.setValue(0);
    
    // Animate in with scale
    Animated.parallel([
      Animated.timing(alertScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(alertOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Auto hide after 2 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(alertScale, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(alertOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowDeleteAlert(false);
        });
      }, 2000);
    });
  }, []);

  const handleMoveToCart = (item: WishlistItem) => {
    void (async () => {
      const cartProductId =
        item.serverBacked && item.productId > 0
          ? String(item.productId)
          : item.id;
      const token = (await AsyncStorage.getItem("token"))?.trim();
      if (
        token &&
        item.serverBacked &&
        item.productId > 0 &&
        item.variantId > 0
      ) {
        try {
          await postCartAdd(item.productId, item.variantId, 1);
        } catch (e: unknown) {
          Alert.alert(
            "Cart",
            parseCartApiError(e, "Could not add to cart. Please try again.")
          );
          return;
        }
      } else {
        await addProductToCart({
          id: cartProductId,
          name: item.name,
          price: item.price,
          mrp: item.originalPrice ?? item.price,
        });
      }
      if (item.serverBacked && item.productId > 0 && item.variantId > 0) {
        try {
          await api.delete(WISHLIST_REMOVE_PATH, {
            params: {
              productId: item.productId,
              variantId: item.variantId,
            },
          });
        } catch {
          /* wishlist refresh on next focus */
        }
      }
      await removeWishlistLine(cartProductId);
      setWishlistItems((prev) => prev.filter((x) => x.id !== item.id));
      setCartCount(await getCartUnitCount());
      
      // Show sweet alert
      showCartSweetAlert(item.name);
    })();
  };

  const handleRemoveItem = (item: WishlistItem) => {
    Alert.alert("Remove Item", `Remove "${item.name}" from your wishlist?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            if (item.serverBacked && item.productId > 0 && item.variantId > 0) {
              try {
                await api.delete(WISHLIST_REMOVE_PATH, {
                  params: {
                    productId: item.productId,
                    variantId: item.variantId,
                  },
                });
              } catch (e: unknown) {
                const ax = e as { response?: { data?: unknown } };
                let msg = "Could not remove this item.";
                const d = ax.response?.data;
                if (typeof d === "string" && d.trim()) msg = d.trim();
                else if (d && typeof d === "object") {
                  const m = (d as { message?: unknown }).message;
                  if (typeof m === "string" && m.trim()) msg = m.trim();
                }
                Alert.alert("Wishlist", msg);
                return;
              }
              await removeWishlistLine(String(item.productId));
            } else {
              await removeWishlistLine(item.id);
            }
            setWishlistItems((prev) => prev.filter((x) => x.id !== item.id));
            // Show delete sweet alert
            showDeleteSweetAlert(item.name);
          })();
        },
      },
    ]);
  };

  const handleAddSuggestionToCart = useCallback(async (item: SuggestionItem) => {
    await addProductToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
    });
    setCartCount(await getCartUnitCount());
    Alert.alert("Cart", `${item.name} added to cart.`);
  }, []);

  return (
    <View style={styles.container}>
      {/* Falling hearts background */}
      <View style={styles.fallingHeartsLayer} pointerEvents="none">
        {fallingHearts.map((h, idx) => (
          <Animated.View
            key={h.id}
            style={{
              position: "absolute",
              left: h.x,
              transform: [
                { translateY: heartsAnimRef.current[idx]! },
                { translateX: h.drift },
              ],
              opacity: h.opacity,
            }}
          >
            <View style={{ width: h.size + 6, height: h.size + 6 }}>
              <Ionicons
                name="heart"
                size={h.size + 5}
                color="#ef7b1a"
                style={{ position: "absolute", left: 0, top: 0, opacity: 0.95 }}
              />
              <Ionicons
                name="heart"
                size={h.size}
                color="#ef7b1a"
                style={{ position: "absolute", left: 2, top: 2, opacity: 1 }}
              />
            </View>
          </Animated.View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
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

        {isSearchVisible ? (
          <View style={styles.headerSearchWrapper}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#69798c"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search wishlist"
              placeholderTextColor="#69798c"
              value={headerSearchQuery}
              onChangeText={setHeaderSearchQuery}
              style={styles.searchInputHeader}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>{tr("WISHLIST")}</Text>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Wishlist Product List */}
        <View style={styles.section}>
          {wishlistLoading ? (
            <View style={styles.loadingWrap}>
              <Animated.Image
                source={require("../assets/MainCatImages/images/fntfav.png")}
                style={[
                  styles.loadingFavicon,
                  {
                    transform: [{ scale: emptyHeartPulse }],
                  },
                ]}
                resizeMode="contain"
              />
              <Text style={styles.loadingText}>Loading your wishlist…</Text>
            </View>
          ) : displayedWishlistItems.length === 0 ? (
            <View>
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale: emptyHeartPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.16],
                          }),
                        },
                      ],
                      opacity: emptyHeartPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.72, 1],
                      }),
                    }}
                  >
                    <Ionicons name="heart" size={80} color="#ef4444" />
                  </Animated.View>
                </View>
                <Text style={styles.emptyText}>{tr("Your wishlist is empty")}</Text>
                <Text style={styles.emptySubtext}>
                  Add items you love to your wishlist!
                </Text>
              </View>

              <Text style={styles.suggestionsTitle}>{tr("Suggestions for you")}</Text>
              <View style={styles.suggestionsGrid}>
                {EMPTY_WISHLIST_SUGGESTIONS.map((item) => (
                  <View key={item.id} style={styles.suggestionCard}>
                    <Image source={item.image} style={styles.suggestionImage} />
                    <Text style={styles.suggestionName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.suggestionMeta} numberOfLines={1}>
                      {`Size ${item.size} • ${item.color}`}
                    </Text>
                    <View style={styles.suggestionPriceRow}>
                      <Text style={styles.suggestionPrice}>₹{item.price.toLocaleString()}</Text>
                      <Text style={styles.suggestionMrp}>₹{item.mrp.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.suggestionCartBtn}
                      onPress={() => void handleAddSuggestionToCart(item)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.suggestionCartBtnText}>{tr("Add to cart")}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            wishlistRows.map((row, rowIndex) => (
              <View
                key={`wishlist-row-${rowIndex}`}
                style={[
                  styles.wishlistRow,
                  rowIndex === wishlistRows.length - 1 && styles.wishlistRowLast,
                ]}
              >
                {row.map((item) => {
                  const discountPercent =
                    item.originalPrice && item.originalPrice > item.price
                      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                      : null;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.wishlistCard}
                      activeOpacity={0.92}
                      onPress={() =>
                        router.push({
                          pathname: "/productdetail",
                          params: {
                            id: String(item.productId > 0 ? item.productId : item.id),
                          },
                        } as any)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, open product details`}
                    >
                      {/* Product Image Section */}
                      <View style={styles.wishlistImageSection}>
                        <TouchableOpacity
                          style={styles.wishlistImageArea}
                          activeOpacity={0.9}
                          onPress={() => openProductDetail(item)}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${item.name}`}
                        >
                          <Image source={item.image} style={styles.wishlistHeroImage} />
                          <View style={styles.wishlistImageShade} />

                          {discountPercent != null ? (
                            <View style={styles.wishlistDiscountPill}>
                              <Text style={styles.wishlistDiscountText}>{discountPercent}% OFF</Text>
                            </View>
                          ) : null}

                          <TouchableOpacity
                            onPress={() => handleRemoveItem(item)}
                            style={styles.wishlistRemoveFab}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.name}`}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="trash-outline" size={18} color="#fff" />
                          </TouchableOpacity>

                          {!item.inStock ? (
                            <View style={styles.wishlistStockPill}>
                              <Ionicons name="alert-circle" size={14} color="#fff" />
                              <Text style={styles.wishlistStockText}>Out of stock</Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      </View>

                      {/* Product Details Section */}
                      <View style={styles.wishlistDetailsSection}>
                        <Text style={styles.wishlistName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.size || item.color ? (
                          <Text style={styles.wishlistMeta} numberOfLines={1}>
                            {item.size ? `Size ${item.size}` : ""}
                            {item.size && item.color ? " • " : ""}
                            {item.color ? item.color : ""}
                          </Text>
                        ) : null}
                      </View>

                      {/* Price Section */}
                      <View style={styles.wishlistPriceSection}>
                        <View style={styles.wishlistPriceRow}>
                          <Text style={styles.wishlistPrice}>₹{item.price.toLocaleString()}</Text>
                          {item.originalPrice ? (
                            <Text style={styles.wishlistOriginalPrice}>
                              ₹{item.originalPrice.toLocaleString()}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Button Section */}
                      <View style={styles.wishlistButtonSection}>
                        <TouchableOpacity
                          style={[
                            styles.wishlistPrimaryBtn,
                            !item.inStock && styles.wishlistPrimaryBtnDisabled,
                          ]}
                          onPress={() => handleMoveToCart(item)}
                          disabled={!item.inStock}
                          activeOpacity={0.9}
                          accessibilityRole="button"
                          accessibilityLabel={`Move ${item.name} to cart`}
                        >
                          <Ionicons
                            name="cart-outline"
                            size={16}
                            color={item.inStock ? "#fff" : "#9ca3af"}
                          />
                          <Text
                            style={[
                              styles.wishlistPrimaryBtnText,
                              !item.inStock && styles.wishlistPrimaryBtnTextDisabled,
                            ]}
                          >
                            Move to cart
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {row.length === 1 ? <View style={styles.wishlistCardSpacer} /> : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <HomeBottomTabBar cartBadgeCount={cartCount} />
      
      {/* Cart Sweet Alert Modal */}
      {showCartAlert && (
        <View style={styles.sweetAlertOverlay}>
          <Animated.View
            style={[
              styles.sweetAlertContainer,
              {
                transform: [{ scale: alertScale }],
                opacity: alertOpacity,
              },
            ]}
          >
            <View style={styles.sweetAlertIcon}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
            <Text style={styles.sweetAlertTitle}>Added to Cart!</Text>
            <Text style={styles.sweetAlertMessage} numberOfLines={2}>
              {addedItemName}
            </Text>
            <Text style={styles.sweetAlertSubtext}>Item moved from wishlist</Text>
          </Animated.View>
        </View>
      )}

      {/* Delete Sweet Alert Modal */}
      {showDeleteAlert && (
        <View style={styles.sweetAlertOverlay}>
          <Animated.View
            style={[
              styles.sweetAlertContainer,
              {
                transform: [{ scale: alertScale }],
                opacity: alertOpacity,
              },
            ]}
          >
            <View style={styles.sweetAlertIcon}>
              <Ionicons name="trash-outline" size={32} color="#ef4444" />
            </View>
            <Text style={styles.sweetAlertTitle}>Removed from Wishlist!</Text>
            <Text style={styles.sweetAlertMessage} numberOfLines={2}>
              {deletedItemName}
            </Text>
            <Text style={styles.sweetAlertSubtext}>Item has been removed</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  fallingHeartsLayer: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    textAlign: "left",
    marginLeft: 4,
    color: "#1d324e",
    letterSpacing: 1,
    textTransform: "uppercase",
    textShadowColor: "rgba(239,123,26,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
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
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
  },
  content: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 118,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#ef7b1a",
    fontWeight: "500",
  },
  loadingFavicon: {
    width: 62,
    height: 62,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
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
  },
  suggestionsTitle: {
    marginTop: 10,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  suggestionCard: {
    width: "48.5%",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  suggestionImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#f1f5f9",
  },
  suggestionName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    minHeight: 34,
  },
  suggestionMeta: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  suggestionPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ea580c",
  },
  suggestionMrp: {
    marginLeft: 6,
    fontSize: 11,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  suggestionCartBtn: {
    marginTop: 8,
    backgroundColor: "#1d324e",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  suggestionCartBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  wishlistRow: {
    flexDirection: "row",
    columnGap: 10,
    marginBottom: 14,
  },
  wishlistRowLast: {
    marginBottom: 0,
  },
  wishlistCard: {
    flexDirection: "column",
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  wishlistImageSection: {
    position: "relative",
  },
  wishlistDetailsSection: {
    padding: 12,
    paddingBottom: 8,
  },
  wishlistPriceSection: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  wishlistButtonSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  wishlistCardSpacer: {
    flex: 1,
  },
  wishlistImageArea: {
    position: "relative",
    width: "100%",
    height: 174,
    backgroundColor: "#F8FAFC",
  },
  wishlistHeroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  wishlistImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  wishlistDiscountPill: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(234,88,12,0.95)",
  },
  wishlistDiscountText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.4,
  },
  wishlistRemoveFab: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
  },
  wishlistStockPill: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.84)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  wishlistStockText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  wishlistHeroText: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  wishlistName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
    lineHeight: 18,
  },
  wishlistMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 2,
  },
  wishlistBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  wishlistPriceCol: {
    flex: 1,
    minWidth: 0,
  },
  wishlistPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
  },
  wishlistPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ea580c",
  },
  wishlistOriginalPrice: {
    fontSize: 12,
    color: "#94a3b8",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  wishlistDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },
  wishlistPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#0f172a",
  },
  wishlistPrimaryBtnDisabled: {
    backgroundColor: "#f1f5f9",
  },
  wishlistPrimaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  wishlistPrimaryBtnTextDisabled: {
    color: "#9ca3af",
  },
  sweetAlertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
  },
  sweetAlertContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  sweetAlertIcon: {
    marginBottom: 12,
  },
  sweetAlertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  sweetAlertMessage: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 4,
    textAlign: "center",
    maxWidth: 200,
  },
  sweetAlertSubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});

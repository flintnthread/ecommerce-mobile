import React, { useCallback, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  type ImageSourcePropType,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getWishlistIds, loadWishlist } from "../lib/shopStorage";
import {
  categoryPtbRowWishlisted,
  fetchWishlistServerKeySet,
  togglePtbWishlistWithServer,
} from "../lib/wishlistServerApi";
import api from "../services/api";
import { useLanguage } from "../lib/language";

type SellerProduct = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  price: string;
  mrp?: string;
  off?: string;
  sellerId?: number;
  variantId?: number;
};

const P1 = require("../assets/images/latest1.png");
const P2 = require("../assets/images/latest2.png");
const P3 = require("../assets/images/latest3.png");
const P4 = require("../assets/images/latest4.png");
const SELLER_PROFILE_IMG = require("../assets/images/image1.png");

const SELLER_PRODUCTS: SellerProduct[] = [
  { id: "p1", title: "Banita Attractive Women Dupatta", image: P1, price: "₹1,323", mrp: "₹1,398", off: "5% off" },
  { id: "p2", title: "Charvi Attractive Women Dupatta", image: P2, price: "₹1,318", mrp: "₹1,384", off: "5% off" },
  { id: "p3", title: "Ethnic Kurta Set", image: P3, price: "₹899", mrp: "₹1,599", off: "44% off" },
  { id: "p4", title: "Lace Detail Dress", image: P4, price: "₹1,199", mrp: "₹1,999", off: "40% off" },
];

const FALLBACK_SELLER_PRODUCT_IMAGE = P1;

export default function SellerStoreScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const sellerIdRaw = Array.isArray(params.sellerId) ? params.sellerId[0] : params.sellerId;
  const sellerId = useMemo(() => {
    const n = Number(String(sellerIdRaw ?? "").trim());
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }, [sellerIdRaw]);
  const sellerName = String(params.name ?? "@ SHIV CREATION");
  const rating = String(params.rating ?? "4.1");
  const sellerBusinessName = String(params.businessName ?? "").trim();
  const sellerBranchName = String(params.branchName ?? "").trim();
  const sellerAddress = String(params.address ?? "").trim();
  const [following, setFollowing] = useState(false);

  const [sellerProductsApi, setSellerProductsApi] = useState<SellerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const data = useMemo(
    () => (sellerProductsApi.length ? sellerProductsApi : SELLER_PRODUCTS),
    [sellerProductsApi]
  );
  const productsCountLabel = useMemo(() => {
    if (productsLoading) return "...";
    return String(data.length);
  }, [data.length, productsLoading]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [serverWishlistKeys, setServerWishlistKeys] = useState<Set<string>>(
    new Set()
  );
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const shareMessage = useMemo(
    () => `${tr("Check out this shop on our app")} - ${sellerName}`,
    [sellerName, tr]
  );

  useEffect(() => {
    if (!sellerId) {
      setSellerProductsApi([]);
      setProductsError(null);
      return;
    }

    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    (async () => {
      try {
        const { data } = await api.get("/api/products/search/filter", {
          params: { sellerId, page: 0, size: 100, sortBy: "createdAt", sortDirection: "desc" },
        });
        if (cancelled) return;
        const rows = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];

        const mapped: SellerProduct[] = rows.map((p: any) => {
          const variants = Array.isArray(p?.variants) ? p.variants : [];
          const preferredVariant =
            variants.find((v: any) => {
              const rawId = v?.id ?? v?.variantId;
              const idNum =
                typeof rawId === "string" ? Number.parseInt(rawId, 10) : Number(rawId);
              const inStock = v?.inStock === true || Number(v?.stock ?? 0) > 0;
              return Number.isFinite(idNum) && idNum > 0 && inStock;
            }) ??
            variants.find((v: any) => {
              const rawId = v?.id ?? v?.variantId;
              const idNum =
                typeof rawId === "string" ? Number.parseInt(rawId, 10) : Number(rawId);
              return Number.isFinite(idNum) && idNum > 0;
            }) ??
            variants[0] ??
            {};
          const rawVariantId = preferredVariant?.id ?? preferredVariant?.variantId;
          const parsedVariantId =
            typeof rawVariantId === "string"
              ? Number.parseInt(rawVariantId, 10)
              : Number(rawVariantId);
          const variantId =
            Number.isFinite(parsedVariantId) && parsedVariantId > 0
              ? Math.floor(parsedVariantId)
              : undefined;
          const selling = Number(preferredVariant?.sellingPrice ?? preferredVariant?.finalPrice ?? 0);
          const mrpRaw = Number(preferredVariant?.mrpPrice ?? 0);
          const discountPct = Number(preferredVariant?.discountPercentage ?? 0);

          const imageUrlRaw =
            p?.images?.find?.((img: any) => img?.isPrimary)?.imageUrl ??
            p?.images?.[0]?.imageUrl ??
            p?.images?.[0]?.imagePath ??
            "";
          const imageUrl = String(imageUrlRaw ?? "").trim();
          const resolvedImage =
            imageUrl && /^https?:\/\//i.test(imageUrl)
              ? { uri: imageUrl }
              : imageUrl
              ? { uri: `${String(api.defaults.baseURL ?? "").replace(/\/$/, "")}/${imageUrl.replace(/^\/+/, "")}` }
              : FALLBACK_SELLER_PRODUCT_IMAGE;

          return {
            id: String(p?.id ?? ""),
            title: String(p?.name ?? "Product"),
            image: resolvedImage,
            price: `₹${Math.max(0, Math.round(selling || 0)).toLocaleString()}`,
            mrp: mrpRaw > 0 ? `₹${Math.round(mrpRaw).toLocaleString()}` : undefined,
            off: discountPct > 0 ? `${discountPct.toFixed(1).replace(/\.0$/, "")}% off` : undefined,
            sellerId: Number.isFinite(Number(p?.sellerId)) ? Math.floor(Number(p.sellerId)) : undefined,
            ...(variantId != null ? { variantId } : {}),
          };
        }).filter((it) => it.id);

        setSellerProductsApi(mapped);
      } catch {
        if (!cancelled) {
          setSellerProductsApi([]);
          setProductsError("Could not load seller products");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const reloadWishlist = useCallback(async () => {
    const [token, ids, list, serverKeys] = await Promise.all([
      AsyncStorage.getItem("token"),
      getWishlistIds(),
      loadWishlist(),
      fetchWishlistServerKeySet(),
    ]);
    setHasAuthToken(Boolean(token?.trim()));
    setWishlistIds(ids);
    setServerWishlistKeys(serverKeys);
    setWishlistCount(list.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadWishlist();
    }, [reloadWishlist])
  );

  const parseRupee = (value?: string) => {
    const raw = String(value ?? "").replace(/[^\d.]/g, "");
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const handleToggleWishlist = useCallback(
    async (p: SellerProduct) => {
      const result = await togglePtbWishlistWithServer(
        {
          id: p.id,
          name: p.title,
          sellingNum: parseRupee(p.price),
          mrpNum: Math.max(parseRupee(p.mrp), parseRupee(p.price)),
          ...(p.variantId != null ? { variantId: p.variantId } : {}),
        },
        reloadWishlist
      );
      if (!result.ok) {
        Alert.alert(tr("WISHLIST"), result.message);
        return;
      }
      Alert.alert(tr("WISHLIST"), tr(result.title));
    },
    [parseRupee, reloadWishlist, tr]
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, 10) + 10, paddingBottom: 10 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {sellerName}
        </Text>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.topIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/search")}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/wishlist")}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Ionicons name="heart-outline" size={22} color="#0F172A" />
            {wishlistCount > 0 ? (
              <View style={styles.wishlistBadge}>
                <Text style={styles.wishlistBadgeText}>
                  {wishlistCount > 99 ? "99+" : String(wishlistCount)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/cart")}
            accessibilityRole="button"
            accessibilityLabel="Cart"
          >
            <Ionicons name="cart-outline" size={22} color="#0F172A" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>6</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          <View style={styles.heroNewBase} />
          <View style={styles.heroNewRibbon} />
          <View style={styles.heroNewWave} />
          <View style={styles.heroNewBadge}>
            <Ionicons name="sparkles" size={14} color="#7C2D12" />
            <Text style={styles.heroNewBadgeText}>TOP SELLER</Text>
          </View>
          <TouchableOpacity
            style={styles.shareFab}
            activeOpacity={0.85}
            onPress={() => Share.share({ message: shareMessage })}
            accessibilityRole="button"
            accessibilityLabel="Share store"
          >
            <Ionicons name="share-outline" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatarSolo}>
            <Image source={SELLER_PROFILE_IMG} style={styles.profileAvatarSoloImage} />
          </View>
          <Text style={styles.profileName}>{sellerName}</Text>
          {!!sellerBusinessName && sellerBusinessName !== sellerName && (
            <Text style={styles.profileSubLine}>{sellerBusinessName}</Text>
          )}
          {!!sellerBranchName && <Text style={styles.profileSubLine}>{sellerBranchName}</Text>}
          {!!sellerAddress && <Text style={styles.profileSubLine} numberOfLines={2}>{sellerAddress}</Text>}

          <View style={styles.profileRatingRow}>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{rating}</Text>
              <Ionicons name="star" size={13} color="#0F766E" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.profileRatingSub}>2,435 ratings</Text>
          </View>

          <View style={styles.profileStatsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statNum}>214</Text>
              <Text style={styles.statSub}>Followers</Text>
            </View>

            <View style={styles.statBlock}>
              <Text style={styles.statNum}>{productsCountLabel}</Text>
              <Text style={styles.statSub}>Products</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.followBtn,
                following ? styles.followBtnOn : styles.followBtnOff,
              ]}
              activeOpacity={0.9}
              onPress={() => setFollowing((v) => !v)}
            >
              <Text style={[styles.followText, following ? styles.followTextOn : null]}>
                {following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {productsLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#ef7b1a" />
            <Text style={styles.loaderText}>Loading products...</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it) => it.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            ListEmptyComponent={
              <Text style={styles.loaderText}>
                {productsError ?? "No products found for this seller"}
              </Text>
            }
            renderItem={({ item, index }) => {
            const col = index % 2;
            return (
              <View style={styles.gridCell}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    col === 0 ? styles.cardDividerRight : null,
                    styles.cardDividerBottom,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: "/productdetail", params: { id: item.id } })}
                >
                  <View style={styles.cardImageWrap}>
                    <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.wishBtn}
                      activeOpacity={0.85}
                      onPress={() => void handleToggleWishlist(item)}
                      accessibilityRole="button"
                      accessibilityLabel="Add to wishlist"
                    >
                      <Ionicons
                        name={
                          categoryPtbRowWishlisted(
                            item,
                            hasAuthToken && item.variantId != null,
                            serverWishlistKeys,
                            wishlistIds
                          )
                            ? "heart"
                            : "heart-outline"
                        }
                        size={18}
                        color={
                          categoryPtbRowWishlisted(
                            item,
                            hasAuthToken && item.variantId != null,
                            serverWishlistKeys,
                            wishlistIds
                          )
                            ? "#E11D48"
                            : "#0F172A"
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{item.price}</Text>
                      {item.mrp ? <Text style={styles.mrp}>{item.mrp}</Text> : null}
                      {item.off ? <Text style={styles.off}>{item.off}</Text> : null}
                    </View>
                    <Text style={styles.payLater} numberOfLines={1}>
                      ₹1,385 with Pay Later
                    </Text>
                    <View style={styles.shopRow}>
                      <Text style={styles.shopLabel}>shop</Text>
                      <View style={styles.shopRatingPill}>
                        <Text style={styles.shopRatingText}>{rating}</Text>
                        <Ionicons name="star" size={12} color="#0F766E" style={{ marginLeft: 3 }} />
                      </View>
                      <Text style={styles.shopCount}>(2,435)</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
            }}
          />
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { paddingBottom: 18 },

  topBar: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  topBarTitle: { flex: 1, marginLeft: 8, fontSize: 16, fontWeight: "900", color: "#0F172A" },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  topIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  cartBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  wishlistBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },

  heroWrap: { height: 150, backgroundColor: "#FFFFFF", overflow: "hidden" },
  heroNewBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF7ED",
  },
  heroNewRibbon: {
    position: "absolute",
    left: -40,
    top: 22,
    width: 240,
    height: 110,
    borderRadius: 28,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FED7AA",
    transform: [{ rotate: "-6deg" }],
  },
  heroNewWave: {
    position: "absolute",
    right: -60,
    bottom: -70,
    width: 260,
    height: 200,
    borderRadius: 120,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    transform: [{ rotate: "8deg" }],
  },
  heroNewBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroNewBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7C2D12",
    letterSpacing: 0.8,
  },
  shareFab: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  profileCard: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: "center",
  },

  profileAvatarSolo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    overflow: "hidden",
    marginTop: -34,
  },
  profileAvatarSoloImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  profileName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#0F172A" },
  profileSubLine: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },

  profileRatingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileRatingSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },
  profileStatsRow: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statBlock: { alignItems: "center", flexShrink: 0 },
  statNum: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  statSub: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FFFFFF",
  },
  ratingPillText: { fontSize: 13, fontWeight: "900", color: "#0F766E" },
  followBtn: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  followBtnOff: { backgroundColor: "#2563EB" },
  followBtnOn: { backgroundColor: "#E5E7EB" },
  followText: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  followTextOn: { color: "#111827" },

  loaderWrap: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },

  grid: { paddingBottom: 6 },
  gridRow: { gap: 0 },
  gridCell: { flex: 1 },
  card: { backgroundColor: "#FFFFFF" },
  cardDividerRight: { borderRightWidth: 2, borderRightColor: "#E5E7EB" },
  cardDividerBottom: { borderBottomWidth: 2, borderBottomColor: "#E5E7EB" },
  cardImageWrap: { height: 190, backgroundColor: "#F1F5F9" },
  cardImage: { width: "100%", height: "100%" },
  wishBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12, gap: 6 },
  cardTitle: { fontSize: 12, fontWeight: "700", color: "#334155" },
  priceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 },
  price: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  mrp: { fontSize: 12, fontWeight: "800", color: "#94A3B8", textDecorationLine: "line-through" },
  off: { fontSize: 12, fontWeight: "900", color: "#10B981" },
  payLater: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  shopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shopLabel: { fontSize: 12, fontWeight: "800", color: "#94A3B8" },
  shopRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  shopRatingText: { fontSize: 12, fontWeight: "900", color: "#0F766E" },
  shopCount: { fontSize: 12, fontWeight: "800", color: "#94A3B8" },
});


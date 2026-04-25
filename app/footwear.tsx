import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
  ImageSourcePropType,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import api, {
  mapSearchResultsToUi,
  productsByMainCategoryPath,
  searchProductsPath,
  searchSuggestionsPath,
  subcategoriesByCategoryPath,
} from "../services/api";
import { pickProductImageUriFromApi } from "../lib/pickProductImageUri";
import { addToCartPtbOrLocal, getCartUnitCount } from "../lib/cartServerApi";
import { getWishlistIds } from "../lib/shopStorage";
import {
  categoryPtbRowWishlisted,
  fetchWishlistServerKeySet,
  togglePtbWishlistWithServer,
} from "../lib/wishlistServerApi";

const { width } = Dimensions.get("window");
const DESK_INNER_WIDTH = width - 20; // deskSection marginHorizontal: 10 × 2
/** Horizontal padding inside the desk block; increase for narrower banners */
const HERO_SIDE_INSET = 20;
const HERO_SLIDE_WIDTH = DESK_INNER_WIDTH - HERO_SIDE_INSET * 2;

const FW1 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM.jpeg");
const FW2 = require("../assets/footwearimages/hub-men-footwear.png");
const FW3 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM (2).jpeg");
const FW4 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM.jpeg");
const FW5 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM (1).jpeg");
const FW6 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.33 AM.jpeg");
const FW7 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.21.01 AM.jpeg");
const BOTTOM3_MAIN_BANNER = require("../assets/footwearimages/Footwearbanner.png");
const HEADER_FAVICON = require("../assets/footwearimages/Fav Icon.png");

/**
 * Sticky top menu bar — one asset per tab. Change only the string inside each require().
 *
 * | Tab key           | Constant              | Suggested file (assets/footwearimages/) |
 * |------------------|-----------------------|----------------------------------------|
 * | footwear         | TOP_MENU_ICON_FOOTWEAR | menu-footwear.png (or your name)       |
 * | womens-footwear  | TOP_MENU_ICON_WOMENS   | menu-womens.png                        |
 * | mens-footwear    | TOP_MENU_ICON_MENS     | menu-mens.png                          |
 * | kids-footwear    | TOP_MENU_ICON_KIDS     | menu-kids.png                          |
 * | trendnow         | TOP_MENU_ICON_TRENDNOW | menu-trendnow.png                      |
 */
const TOP_MENU_ICON_FOOTWEAR = require("../assets/footwearimages/Kids.png");
const TOP_MENU_ICON_WOMENS = require("../assets/footwearimages/Women.png");
const TOP_MENU_ICON_MENS = require("../assets/footwearimages/Men.png");
const TOP_MENU_ICON_KIDS = require("../assets/footwearimages/Kids.png");
const TOP_MENU_ICON_TRENDNOW = require("../assets/footwearimages/trendnow.png");

const BANNER_IMAGES = [
  require("../assets/footwearimages/WomensFootwear.png"),
  require("../assets/footwearimages/KidsFootwear.png"),
  require("../assets/footwearimages/Mensfootwear.png"),
];

const CATEGORY_TILES = [
  { id: "all", label: "Footwear", image: require("../assets/footwearimages/Kids.png") },
  { id: "women", label: "Womens-Footwear", image: require("../assets/footwearimages/Women.png") },
  { id: "kids", label: "Kids-Footwear", image: require("../assets/footwearimages/Kids.png") },
  { id: "men", label: "Mens-Footwear", image: require("../assets/footwearimages/Men.png") },
  { id: "brands", label: "Top Brands", image: require("../assets/footwearimages/trendnow.png") },
];

/** “Top-tier Kicks” section only — swap PNGs in assets/footwearimages/ if you replace art */
const TOP_TIER_KICKS_CARDS = [
  {
    id: "sandals",
    image: require("../assets/footwearimages/top-tier-sandals.png"),
    discount: 20,
    discountMax: 29.99,
  },
  {
    id: "wedges",
    image: require("../assets/footwearimages/top-tier-wedges.png"),
    discount: 30,
    discountMax: 39.99,
  },
  {
    id: "sneakers",
    image: require("../assets/footwearimages/top-tier-sneakers.png"),
    discount: 40,
    discountMax: 49.99,
  },
  {
    id: "boots",
    image: require("../assets/footwearimages/top-tier-boots.png"),
    discount: 50,
    discountMax: 59.99,
  },
];

/** “Move With Your Mood” — Active & Sporty / Travel & Explore */
const MOOD_IMAGE_ACTIVE_SPORTY = require("../assets/footwearimages/mood-active-sporty.png");
const MOOD_IMAGE_TRAVEL_EXPLORE = require("../assets/footwearimages/mood-travel-explore.png");

/** Static women’s subcategory tiles (no API). */
const WOMENS_SUBCATEGORIES_FALLBACK: { id: string; label: string; image: any }[] = [
  { id: "w1", label: "Heels", image: FW2 },
  { id: "w2", label: "Flats", image: FW5 },
  { id: "w3", label: "Casual Shoes", image: FW1 },
  { id: "w4", label: "Boots", image: FW4 },
  { id: "w5", label: "Ballet Flats", image: FW5 },
  { id: "w6", label: "Wedges", image: FW7 },
];

/** Static men’s subcategory tiles (no API). */
const MENS_SUBCATEGORIES_FALLBACK: { id: string; label: string; image: any }[] = [
  { id: "m1", label: "Sneakers", image: FW1 },
  { id: "m2", label: "Formal Shoes", image: FW4 },
  { id: "m3", label: "Loafers", image: FW6 },
  { id: "m4", label: "Boots", image: FW5 },
  { id: "m5", label: "Sports Shoes", image: FW3 },
  { id: "m6", label: "Sandals", image: FW2 },
];

/** Static kids’ subcategory tiles (no API). */
const KIDS_SUBCATEGORIES_FALLBACK: { id: string; label: string; image: any }[] = [
  { id: "k1", label: "School Shoes", image: FW3 },
  { id: "k2", label: "Sandals", image: FW5 },
  { id: "k3", label: "Flip Flops", image: FW2 },
  { id: "k4", label: "Booties", image: FW7 },
  { id: "k5", label: "Socks", image: FW6 },
  { id: "k6", label: "Casual Shoes", image: FW1 },
];

type GenderCategoryId = "women" | "kids" | "men";

type FootwearApiSubcategory = {
  id: number;
  categoryName: string;
  mobileImage?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  parentId?: number | null;
  status?: number;
  createdAt?: string;
  gstPercentage?: number;
  hsnCode?: string;
  sellerId?: number | null;
};

const FOOTWEAR_MENS_SUBCATEGORIES_TABLE_URL =
  "/api/categories/44/subcategories-table";

const FOOTWEAR_WOMENS_SUBCATEGORIES_TABLE_URL =
  "/api/categories/45/subcategories-table";

const FOOTWEAR_KIDS_SUBCATEGORIES_TABLE_URL =
  "/api/categories/46/subcategories-table";

type FootwearSubcategoryTableSub = {
  id: number;
  name: string;
  image: string;
};

type FootwearSubcategoryTableRow = {
  categoryName: string;
  subcategories: FootwearSubcategoryTableSub[];
};

type MainCategoryApiRow = {
  id: number;
  categoryName: string;
  status?: number;
};

/** Banner above Womens-Footwear subcategories (`Image` at ~589) */
const WOMEN_FOOTWEAR_SUBCATEGORIES_BANNER = require("../assets/footwearimages/women-footwear-subcategories-banner.png");
const MEN_FOOTWEAR_SUBCATEGORIES_BANNER = require("../assets/footwearimages/MenFootwear.png");
const KIDS_FOOTWEAR_SUBCATEGORIES_BANNER = require("../assets/footwearimages/KidFootwear.png");

const GENDER_SECTION_BANNER: Record<GenderCategoryId, number> = {
  women: WOMEN_FOOTWEAR_SUBCATEGORIES_BANNER,
  men: MEN_FOOTWEAR_SUBCATEGORIES_BANNER,
  kids: KIDS_FOOTWEAR_SUBCATEGORIES_BANNER,
};

/** “Footwear Categories” hub grid only — Womens / Mens / Kids hero tiles */
const HUB_CATEGORY_IMAGE: Record<GenderCategoryId, number> = {
  women: require("../assets/footwearimages/hub-women-footwear.png"),
  men: require("../assets/footwearimages/hub-men-footwear.png"),
  kids: require("../assets/footwearimages/hub-kids-footwear.png"),
};

const RELATED_FOOTWEAR_PRODUCTS = [
  { id: "p1", name: "Urban Lace Sneakers", category: "Women", price: 1299, rating: 4.4, image: FW1 },
  { id: "p2", name: "Classic Block Heels", category: "Women", price: 1499, rating: 4.3, image: FW2 },
  { id: "p3", name: "Comfy Travel Slip-ons", category: "Women", price: 999, rating: 4.2, image: FW5 },
  { id: "p4", name: "Formal Derby Shoes", category: "Men", price: 1799, rating: 4.5, image: FW4 },
  { id: "p5", name: "Daily Run Sneakers", category: "Men", price: 1599, rating: 4.1, image: FW6 },
  { id: "p6", name: "Weekend Loafers", category: "Men", price: 1399, rating: 4.2, image: FW7 },
  { id: "p7", name: "Kids School Comfort", category: "Kids", price: 899, rating: 4.6, image: FW3 },
  { id: "p8", name: "Kids Sport Runner", category: "Kids", price: 1099, rating: 4.4, image: FW6 },
  { id: "p9", name: "Party Spark Sandals", category: "Kids", price: 949, rating: 4.3, image: FW2 },
  { id: "p10", name: "Trail Boots", category: "Unisex", price: 1899, rating: 4.2, image: FW4 },
];

export default function FootwearScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    mainCategoryId?: string | string[];
  }>();
  const rawMainCategoryId = Array.isArray(params.id)
    ? params.id[0]
    : params.id ?? Array.isArray(params.mainCategoryId)
    ? params.mainCategoryId[0]
    : params.mainCategoryId;
  const parsedMainCategoryId = Number.parseInt(String(rawMainCategoryId ?? ""), 10);
  const routeFootwearMainCategoryId =
    Number.isFinite(parsedMainCategoryId) && parsedMainCategoryId > 0
      ? parsedMainCategoryId
      : null;
  const [resolvedFootwearMainCategoryId, setResolvedFootwearMainCategoryId] = useState<
    number | null
  >(null);
  const footwearMainCategoryId =
    routeFootwearMainCategoryId ?? resolvedFootwearMainCategoryId;
  const mainScrollRef = useRef<ScrollView>(null);
  const heroScrollRef = useRef<ScrollView>(null);
  const categoriesListYRef = useRef(0);
  const womenSectionYRef = useRef(0);
  const menSectionYRef = useRef(0);
  const kidsSectionYRef = useRef(0);
  const trendNowSectionYRef = useRef(0);
  const animatedBlockYRef = useRef(0);
  const womenBannerAnim = useRef(new Animated.Value(0)).current;
  const menBannerAnim = useRef(new Animated.Value(0)).current;
  const kidsBannerAnim = useRef(new Animated.Value(0)).current;
  const activeBannerRef = useRef<GenderCategoryId | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const MENU_BAR_HEIGHT = 86;
  const [headerHeight, setHeaderHeight] = useState(96);
  type TopMenuKey = "footwear" | "womens-footwear" | "mens-footwear" | "kids-footwear" | "trendnow";
  const [activeTopMenu, setActiveTopMenu] = useState<TopMenuKey>("footwear");
  const [womensSubcategoriesApi, setWomensSubcategoriesApi] = useState<
    { id: string; label: string; image: ImageSourcePropType }[]
  >([]);
  const womensSubcategories =
    womensSubcategoriesApi.length > 0 ? womensSubcategoriesApi : WOMENS_SUBCATEGORIES_FALLBACK;
  const [mensSubcategoriesApi, setMensSubcategoriesApi] = useState<
    { id: string; label: string; image: ImageSourcePropType }[]
  >([]);
  const mensSubcategories =
    mensSubcategoriesApi.length > 0 ? mensSubcategoriesApi : MENS_SUBCATEGORIES_FALLBACK;
  const [kidsSubcategoriesApi, setKidsSubcategoriesApi] = useState<
    { id: string; label: string; image: ImageSourcePropType }[]
  >([]);
  const kidsSubcategories =
    kidsSubcategoriesApi.length > 0 ? kidsSubcategoriesApi : KIDS_SUBCATEGORIES_FALLBACK;

  type RelatedMensProductRow = {
    id: number;
    name: string;
    imageUri: string;
    categoryName: string;
    sellingPrice: number | null;
    mrpPrice: number | null;
    discountPercentage: number | null;
    rating: number | null;
    variantId?: number;
  };

  const [relatedMensProducts, setRelatedMensProducts] = useState<RelatedMensProductRow[]>([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const [resolvingMainCategoryId, setResolvingMainCategoryId] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistServerKeys, setWishlistServerKeys] = useState<Set<string>>(new Set());
  const [wishlistHasAuth, setWishlistHasAuth] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [apiFootwearCategoriesByGender, setApiFootwearCategoriesByGender] = useState<
    Partial<Record<GenderCategoryId, FootwearApiSubcategory>>
  >({});

  const getAbsoluteY = (y: number, insideAnimated = false) =>
    insideAnimated ? animatedBlockYRef.current + y : y;

  const normalizeCategoryName = (name: string): string =>
    name
      .replace(/\u0019/g, "'")
      .replace(/[’`]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const safeText = (value: string): string => value.replace(/\u0019/g, "'").trim();

  // Search functionality
  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await api.get(searchProductsPath(trimmed));
      const mappedResults = mapSearchResultsToUi(data).slice(0, 10);
      setSearchResults(mappedResults);
      setShowSearchResults(true);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const getMobileImageUriFromApi = (item: any): string => {
    const candidate =
      item?.mobileImage ??
      item?.mobileimage ??
      item?.mobile_image ??
      item?.mobileImg ??
      "";
    return String(candidate ?? "").trim();
  };

  function getUploadsImageUriFromFilename(filename: string): string {
    // Prefer configured API baseURL when available; otherwise fall back to the endpoint origin.
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    let base = apiBase;
    if (!base) base = "";
    if (!filename?.trim()) return base ? `${base}/uploads/` : "";
    if (/^https?:\/\//i.test(filename)) return filename;
    return base ? `${base}/uploads/${filename}` : filename;
  }

  function getAssetUriFromApiPath(pathOrUrl: string): string {
    const raw = String(pathOrUrl ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!apiBase) return raw;
    return `${apiBase}/${raw.replace(/^\/+/, "")}`;
  }

  const pickRelatedProductImageUri = (p: any): string | null =>
    pickProductImageUriFromApi(p, getAssetUriFromApiPath);

  const pickVariantPricing = (
    p: any
  ): {
    sellingPrice: number | null;
    mrpPrice: number | null;
    discountPercentage: number | null;
    variantId?: number;
  } => {
    const variants = Array.isArray(p?.variants) ? p.variants : [];
    const v =
      variants.find(
        (x) =>
          x &&
          (typeof x.sellingPrice === "number" ||
            typeof x.mrpPrice === "number" ||
            typeof x.sellingPrice === "string" ||
            typeof x.mrpPrice === "string")
      ) ?? null;
    if (!v) return { sellingPrice: null, mrpPrice: null, discountPercentage: null };
    const num = (x: unknown): number | null => {
      if (typeof x === "number" && Number.isFinite(x)) return x;
      if (typeof x === "string") {
        const n = parseFloat(x);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };
    const rawVid = v.id ?? v.variantId;
    const vidNum =
      typeof rawVid === "string" ? Number.parseInt(rawVid, 10) : Number(rawVid);
    const variantId =
      Number.isFinite(vidNum) && vidNum > 0 ? Math.floor(vidNum) : undefined;
    return {
      sellingPrice: num(v.sellingPrice),
      mrpPrice: num(v.mrpPrice),
      discountPercentage: num(v.discountPercentage),
      ...(variantId != null ? { variantId } : {}),
    };
  };

  const pickProductRating = (p: any): number | null => {
    const r =
      p?.rating ?? p?.averageRating ?? p?.average_rating ?? p?.reviewRating ?? p?.review_rating;
    if (typeof r === "number" && Number.isFinite(r)) return r;
    if (typeof r === "string") {
      const n = parseFloat(r);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const reloadWishlistIds = useCallback(async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    setWishlistHasAuth(!!token);
    const [ids, keys] = await Promise.all([
      getWishlistIds(),
      fetchWishlistServerKeySet(),
    ]);
    setWishlistIds(ids);
    setWishlistServerKeys(keys);
  }, []);

  const reloadCartCount = useCallback(async () => {
    setCartCount(await getCartUnitCount());
  }, []);

  useEffect(() => {
    void reloadWishlistIds();
    void reloadCartCount();
  }, [reloadWishlistIds, reloadCartCount]);

  useFocusEffect(
    useCallback(() => {
      void reloadWishlistIds();
      void reloadCartCount();
    }, [reloadWishlistIds, reloadCartCount])
  );

  const handleToggleWishlist = useCallback(
    async (product: {
      id: string;
      name: string;
      sellingPriceNum: number;
      mrpPriceNum: number;
      variantId?: number;
    }) => {
      const r = await togglePtbWishlistWithServer(
        {
          id: product.id,
          name: product.name,
          sellingNum: product.sellingPriceNum,
          mrpNum: product.mrpPriceNum,
          variantId: product.variantId,
        },
        reloadWishlistIds
      );
      if (r.ok === false) Alert.alert("Wishlist", r.message);
      else Alert.alert(r.title, r.body);
    },
    [reloadWishlistIds]
  );

  const handleAddToCart = useCallback(
    async (product: {
      id: string;
      name: string;
      sellingPriceNum: number;
      mrpPriceNum: number;
      variantId?: number;
    }) => {
      const pid = Math.floor(Number(product.id));
      const r = await addToCartPtbOrLocal({
        productId: pid,
        variantId: product.variantId,
        quantity: 1,
        localLine: {
          id: product.id,
          name: product.name,
          price: product.sellingPriceNum,
          mrp: product.mrpPriceNum,
        },
      });
      if (r.ok === false) {
        Alert.alert("Cart", r.message);
        return;
      }
      setCartCount(await getCartUnitCount());
      Alert.alert("Added to cart", product.name);
    },
    []
  );

  useEffect(() => {
    if (routeFootwearMainCategoryId != null) {
      setResolvedFootwearMainCategoryId(null);
      setResolvingMainCategoryId(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setResolvingMainCategoryId(true);
      try {
        const { data } = await api.get("/api/categories/main");
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as MainCategoryApiRow[]) : [];
        const footwearRow = rows.find((row) => {
          if (!row || typeof row.id !== "number") return false;
          if (typeof row.status === "number" && row.status !== 1) return false;
          const name = String(row.categoryName ?? "").trim().toLowerCase();
          return name === "footwear";
        });
        setResolvedFootwearMainCategoryId(
          footwearRow && Number.isFinite(footwearRow.id) && footwearRow.id > 0
            ? footwearRow.id
            : null
        );
      } catch {
        if (!cancelled) setResolvedFootwearMainCategoryId(null);
      } finally {
        if (!cancelled) setResolvingMainCategoryId(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeFootwearMainCategoryId]);

  useEffect(() => {
    if (footwearMainCategoryId == null) {
      setApiFootwearCategoriesByGender({});
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api.get(
          subcategoriesByCategoryPath(footwearMainCategoryId),
          { signal: controller.signal }
        );
        if (!Array.isArray(data)) return;

        const next: Partial<Record<GenderCategoryId, FootwearApiSubcategory>> = {};
        for (const item of data as FootwearApiSubcategory[]) {
          if (!item || typeof item !== "object") continue;
          if (typeof item.categoryName !== "string") continue;
          const key = normalizeCategoryName(item.categoryName);
          if (key.includes("women")) next.women = item;
          else if (key.includes("men")) next.men = item;
          else if (key.includes("kids")) next.kids = item;
        }

        setApiFootwearCategoriesByGender(next);
      } catch {
        // ignore network errors; fall back to local assets
      }
    })();

    return () => controller.abort();
  }, [footwearMainCategoryId]);

  useEffect(() => {
    if (footwearMainCategoryId == null) {
      setRelatedMensProducts([]);
      setRelatedProductsLoading(false);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setRelatedProductsLoading(true);
      try {
        const { data } = await api.get(productsByMainCategoryPath(footwearMainCategoryId), {
          signal: controller.signal,
        });
        if (!Array.isArray(data)) {
          setRelatedMensProducts([]);
          return;
        }

        const mapped = (data as any[])
          .filter((p) => p && typeof p.id === "number" && typeof p.name === "string")
          .map((p) => {
            const imageUri = pickRelatedProductImageUri(p);
            if (!imageUri) return null;
            const { sellingPrice, mrpPrice, discountPercentage, variantId } =
              pickVariantPricing(p);
            const categoryName = safeText(String(p.categoryName ?? p.subcategoryName ?? "Footwear"));
            return {
              id: p.id as number,
              name: safeText(String(p.name ?? "")),
              imageUri,
              categoryName: categoryName || "Footwear",
              sellingPrice,
              mrpPrice,
              discountPercentage,
              rating: pickProductRating(p),
              ...(variantId != null ? { variantId } : {}),
            } satisfies RelatedMensProductRow;
          })
          .filter(Boolean) as RelatedMensProductRow[];

        setRelatedMensProducts(mapped);
      } catch {
        // ignore network errors
      } finally {
        setRelatedProductsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [footwearMainCategoryId]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api.get(FOOTWEAR_MENS_SUBCATEGORIES_TABLE_URL, {
          signal: controller.signal,
        });
        if (!Array.isArray(data) || data.length === 0) return;

        const first = data[0] as FootwearSubcategoryTableRow;
        const subs = Array.isArray(first?.subcategories) ? first.subcategories : [];
        const mapped = subs
          .filter((s) => s && typeof s.id === "number" && typeof s.name === "string")
          .map((s) => ({
            id: String(s.id),
            label: safeText(s.name),
            // Keep layout same (still render <Image>), but use ONLY `mobileImage` from API.
            image: { uri: getMobileImageUriFromApi(s) },
          }));

        if (mapped.length > 0) setMensSubcategoriesApi(mapped);
      } catch {
        // ignore network errors; fall back to local assets
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api.get(FOOTWEAR_WOMENS_SUBCATEGORIES_TABLE_URL, {
          signal: controller.signal,
        });
        if (!Array.isArray(data) || data.length === 0) return;

        const first = data[0] as FootwearSubcategoryTableRow;
        const subs = Array.isArray(first?.subcategories) ? first.subcategories : [];
        const mapped = subs
          .filter((s) => s && typeof s.id === "number" && typeof s.name === "string")
          .map((s) => ({
            id: String(s.id),
            label: safeText(s.name),
            image: { uri: getMobileImageUriFromApi(s) },
          }));

        if (mapped.length > 0) setWomensSubcategoriesApi(mapped);
      } catch {
        // ignore network errors; fall back to local assets
      }
    })();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const { data } = await api.get(FOOTWEAR_KIDS_SUBCATEGORIES_TABLE_URL, {
          signal: controller.signal,
        });
        if (!Array.isArray(data) || data.length === 0) return;

        const first = data[0] as FootwearSubcategoryTableRow;
        const subs = Array.isArray(first?.subcategories) ? first.subcategories : [];
        const mapped = subs
          .filter((s) => s && typeof s.id === "number" && typeof s.name === "string")
          .map((s) => ({
            id: String(s.id),
            label: safeText(s.name),
            image: { uri: getMobileImageUriFromApi(s) },
          }));

        if (mapped.length > 0) setKidsSubcategoriesApi(mapped);
      } catch {
        // ignore network errors; fall back to local assets
      }
    })();

    return () => controller.abort();
  }, []);

  // Temporary tall video banner until you provide final asset.
  const tallBannerPlayer = useVideoPlayer(
    require("../assets/footwearimages/videofootwear.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % BANNER_IMAGES.length;
        heroScrollRef.current?.scrollTo({
          x: next * HERO_SLIDE_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const handleCategoryTilePress = (id: string) => {
    // Scroll within the same page (no navigation).
    if (id === "all") {
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, categoriesListYRef.current),
        animated: true,
      });
      return;
    }

    if (id === "women" || id === "kids" || id === "men") {
      const ref =
        id === "women"
          ? getAbsoluteY(womenSectionYRef.current, true)
          : id === "kids"
          ? kidsSectionYRef.current
          : menSectionYRef.current;
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, ref),
        animated: true,
      });
      return;
    }

    if (id === "brands") {
      // Keep simple: go back to the top of the screen.
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleFootwearSubcategoryPress = (
    section: GenderCategoryId,
    sub: { id: string; label: string; image: any }
  ) => {
    const mainBySection: Record<GenderCategoryId, string> = {
      women: "womenswear",
      men: "menswear",
      kids: "kidswear",
    };
    const numericSubcategoryId = Number.parseInt(String(sub.id), 10);

    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: mainBySection[section],
        subCategory: sub.label,
        subcategoryId:
          Number.isFinite(numericSubcategoryId) && numericSubcategoryId > 0
            ? String(numericSubcategoryId)
            : undefined,
      },
    });
  };

  const animateGenderBanner = (gender: GenderCategoryId | null) => {
    Animated.parallel([
      Animated.timing(womenBannerAnim, {
        toValue: gender === "women" ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(menBannerAnim, {
        toValue: gender === "men" ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(kidsBannerAnim, {
        toValue: gender === "kids" ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMainScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const threshold = 160;

    const currentY = y + threshold;

    // Banner animation (Women/Men/Kids)
    let candidate: GenderCategoryId | null = null;
    const womenSectionY = getAbsoluteY(womenSectionYRef.current, true);
    const menSectionY = menSectionYRef.current;
    const kidsSectionY = kidsSectionYRef.current;
    const categoriesY = categoriesListYRef.current;
    const trendNowY = trendNowSectionYRef.current;

    if (!(womenSectionY <= 0 && menSectionY <= 0)) {
      if (
        kidsSectionY > 0 &&
        currentY >= kidsSectionY
      ) {
        candidate = "kids";
      } else if (
        menSectionY > 0 &&
        currentY >= menSectionY
      ) {
        candidate = "men";
      } else if (currentY >= womenSectionY) {
        candidate = "women";
      }
    }

    if (candidate !== activeBannerRef.current) {
      activeBannerRef.current = candidate;
      animateGenderBanner(candidate);
    }

    // Sticky top menu active tab
    let nextMenu: TopMenuKey = "footwear";
    const beforeCategories = categoriesY <= 0 || currentY < categoriesY;

    if (
      beforeCategories &&
      trendNowY > 0 &&
      currentY >= trendNowY
    ) {
      nextMenu = "trendnow";
    }

    if (womenSectionY > 0 && currentY >= womenSectionY) {
      nextMenu = "womens-footwear";
    }
    if (menSectionY > 0 && currentY >= menSectionY) {
      nextMenu = "mens-footwear";
    }
    if (kidsSectionY > 0 && currentY >= kidsSectionY) {
      nextMenu = "kids-footwear";
    }

    if (nextMenu !== activeTopMenu) {
      setActiveTopMenu(nextMenu);
    }
  };

  const scrollToY = (y: number) => {
    mainScrollRef.current?.scrollTo({
      y: Math.max(0, y),
      animated: true,
    });
  };

  const handleTopMenuPress = (key: TopMenuKey) => {
    if (key === "footwear") {
      scrollToY(categoriesListYRef.current);
      return;
    }
    if (key === "womens-footwear") {
      scrollToY(getAbsoluteY(womenSectionYRef.current, true));
      return;
    }
    if (key === "mens-footwear") {
      scrollToY(menSectionYRef.current);
      return;
    }
    if (key === "kids-footwear") {
      scrollToY(kidsSectionYRef.current);
      return;
    }
    if (key === "trendnow") {
      scrollToY(trendNowSectionYRef.current);
      return;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View
        style={styles.headerRow}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          style={styles.headerLeading}
          onPress={() => mainScrollRef.current?.scrollTo({ y: 0, animated: true })}
          activeOpacity={0.8}
        >
          <Image source={HEADER_FAVICON} style={styles.faviconImage} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#1d324e" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search.."
            placeholderTextColor="#8D97AA"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (query.trim()) {
                router.push({ pathname: "/searchresults", params: { q: query } });
              }
            }}
          />
          <Ionicons name="camera-outline" size={18} color="#72809A" />
        </View>

        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => router.push("/wishlist")}>
          <Ionicons name="heart-outline" size={24} color="#1D2430" />
          {(wishlistHasAuth ? wishlistServerKeys.size : wishlistIds.size) > 0 ? (
            <View style={styles.headerIconBadge}>
              <Text style={styles.headerIconBadgeText}>
                {(wishlistHasAuth ? wishlistServerKeys.size : wishlistIds.size) > 99
                  ? "99+"
                  : String(
                      wishlistHasAuth ? wishlistServerKeys.size : wishlistIds.size
                    )}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => router.push("/cart")}>
          <Ionicons name="bag-outline" size={24} color="#1D2430" />
          {cartCount > 0 ? (
            <View style={styles.headerIconBadge}>
              <Text style={styles.headerIconBadgeText}>
                {cartCount > 99 ? "99+" : String(cartCount)}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Sticky top menu bar */}
      <View
        style={[
          styles.topMenuBar,
          { top: headerHeight, height: MENU_BAR_HEIGHT },
        ]}
      >
        {(
          [
            { key: "footwear", label: "Footwear", image: TOP_MENU_ICON_FOOTWEAR },
            { key: "womens-footwear", label: "Womens", image: TOP_MENU_ICON_WOMENS },
            { key: "mens-footwear", label: "Mens", image: TOP_MENU_ICON_MENS },
            { key: "kids-footwear", label: "Kids", image: TOP_MENU_ICON_KIDS },
            { key: "trendnow", label: "TrendNow", image: TOP_MENU_ICON_TRENDNOW },
          ] as { key: TopMenuKey; label: string; image?: number }[]
        ).map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.topMenuTab}
            activeOpacity={0.85}
            onPress={() => handleTopMenuPress(item.key)}
          >
            {typeof item.image === "number" && (
              <Image
                source={item.image}
                style={styles.topMenuTabIcon}
              />
            )}
            <Text
              style={[
                styles.topMenuTabText,
                activeTopMenu === item.key && styles.topMenuTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...styles.contentContainer,
          paddingTop: headerHeight + MENU_BAR_HEIGHT + 2,
          paddingBottom: 108,
        }}
        onScroll={handleMainScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.dualBannerCard}>
          <Image source={BOTTOM3_MAIN_BANNER} style={styles.dualBannerTopImage} />
          <View style={styles.dualBannerDivider} />
          
        </View>

        <Animated.View
          onLayout={(event) => {
            animatedBlockYRef.current = event.nativeEvent.layout.y;
          }}
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          
          <View style={styles.topTierSection}>
            <Text style={styles.sectionTitle}>Top-tier Kicks</Text>
            <View style={styles.grid2}>
              {TOP_TIER_KICKS_CARDS.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.promoCard}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: {
                        mainCat: "footwear",
                        subCategory: `Top-tier Kicks ${card.discount}% OFF`,
                        mainCategoryId: "29",
                        discountMin: String(card.discount),
                        discountMax: String(card.discountMax),
                      },
                    })
                  }
                >
                  <Image source={card.image} style={styles.promoImage} />
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>Min {card.discount}% OFF*</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
 {/* Categories list + per-category subcategory sections */}
 <View
          style={styles.categoriesListSection}
          onLayout={(event) => {
            categoriesListYRef.current =
              animatedBlockYRef.current + event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.hubScreenTitle}>Footwear Categories</Text>
          <Text style={styles.hubScreenSub}>
            Choose Womens, Mens, or Kids footwear.
          </Text>

          <View style={styles.hubGrid}>
            {(["women", "men", "kids"] as GenderCategoryId[]).map((id) => (
              <TouchableOpacity
                key={id}
                style={styles.hubCard}
                activeOpacity={0.9}
                onPress={() => handleCategoryTilePress(id)}
              >
                {(() => {
                  const apiCat = apiFootwearCategoriesByGender[id];
                  const img: ImageSourcePropType =
                    apiCat?.mobileImage ? { uri: apiCat.mobileImage } : HUB_CATEGORY_IMAGE[id];
                  const label =
                    apiCat?.categoryName && typeof apiCat.categoryName === "string"
                      ? apiCat.categoryName.replace(/\u0019/g, "'").trim()
                      : id === "women"
                        ? "Womens Footwear"
                        : id === "men"
                          ? "Mens Footwear"
                          : "Kids Footwear";

                  return (
                    <>
                      <Image source={img} style={styles.hubCardImage} />
                      <Text style={styles.hubCardLabel}>{label}</Text>
                    </>
                  );
                })()}
              </TouchableOpacity>
            ))}
          </View>
        </View>

          <View style={styles.moodSection}>
            <Text style={styles.sectionTitles}>Move With Your Mood</Text>
            <View style={styles.moodRow}>
              <TouchableOpacity style={styles.moodCard} activeOpacity={0.9}>
                <Image source={MOOD_IMAGE_ACTIVE_SPORTY} style={styles.moodImage} />
                <Text style={styles.moodText}>Active & Sporty</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moodCard} activeOpacity={0.9}>
                <Image source={MOOD_IMAGE_TRAVEL_EXPLORE} style={styles.moodImage} />
                <Text style={styles.moodText}>Travel & Explore</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.deskSection}>
            {/* New section from shared reference style */}
            <View style={styles.deskHeaderStrip}>
              <Text style={styles.deskHeaderTitle}>From Desk to Dazzle</Text>
              <Text style={styles.deskHeaderSub}>
                Style that moves with your day and lights up your night
              </Text>
            </View>

            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.heroCarousel}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / HERO_SLIDE_WIDTH
                );
                setBannerIndex(idx);
              }}
            >
              {BANNER_IMAGES.map((img, idx) => (
                <View key={`hero-${idx}`} style={styles.heroWrap}>
                  <Image source={img} style={styles.heroImage} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.dotRow}>
              {BANNER_IMAGES.map((_, idx) => (
                <View key={`dot-${idx}`} style={[styles.dot, bannerIndex === idx && styles.dotActive]} />
              ))}
            </View>
          </View>
          
        <View
          style={styles.genderSection}
          onLayout={(event) => {
            womenSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text
            style={[
              styles.subSectionTitle,
              styles.womenSubSectionTitle,
              styles.genderStandaloneTitle,
            ]}
          >
            Womens-Footwear Subcategories
          </Text>
          <View
            style={[styles.genderBannerWrap, styles.womenGenderBannerWrap]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerOverlay,
                styles.womenBannerOverlay,
                { opacity: womenBannerAnim },
              ]}
            />

            <Animated.View
              style={[
                styles.genderBannerImageAnimWrap,
                {
                  transform: [
                    {
                      translateY: womenBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                    {
                      scale: womenBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={GENDER_SECTION_BANNER.women}
                style={styles.genderBannerImage}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerBadgeAnimWrap,
                {
                  opacity: womenBannerAnim,
                  transform: [
                    {
                      translateY: womenBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.genderBannerBadge, styles.womenBannerBadge]}>
                <Ionicons name="heart" size={16} color="#7A1E49" />
                <Text style={[styles.genderBannerBadgeText, styles.womenBadgeText]}>
                  For Her
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={[styles.genderSubWrap, styles.womenGenderSubWrap]}>
            <View style={styles.subGrid}>
              {womensSubcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subCard, styles.womenSubCard]}
                  activeOpacity={0.9}
                  onPress={() => handleFootwearSubcategoryPress("women", sub)}
                >
                  <Image source={sub.image} style={styles.subCardImage} />
                  <Text
                    style={[styles.subCardLabel, styles.womenSubCardLabel]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

          <View
            style={styles.perfectPairSection}
            onLayout={(event) => {
              trendNowSectionYRef.current =
                animatedBlockYRef.current + event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.perfectPairHeader}>
              <Text style={styles.perfectPairTitle}>Pick Your Perfect Pair</Text>
            </View>

            <View style={styles.perfectPairBody}>
              <View style={styles.perfectGrid}>
                {["Sneakers", "Casuals", "Travel", "Sporty", "Flats", "Loafers"].map(
                  (label, idx) => (
                    <View key={label} style={styles.perfectItem}>
                      <Image
                        source={CATEGORY_TILES[idx % CATEGORY_TILES.length].image}
                        style={styles.perfectCircleImage}
                      />
                      <Text style={styles.perfectItemLabel}>{label}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
          {/* Tall portrait video banner */}
 <View
              style={styles.tallVideoSection}
            >
            <Text style={styles.tallVideoTitle}>Style Reel</Text>
            <View style={styles.tallVideoWrap}>
              <VideoView
                player={tallBannerPlayer}
                style={styles.tallVideo}
                contentFit="cover"
                nativeControls={false}
              />
            </View>
            <Text style={styles.tallVideoHint}>
              Replace this with your final vertical video later.
            </Text>
          </View>

        </Animated.View>
       
        <View
          style={styles.genderSection}
          onLayout={(event) => {
            menSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text
            style={[
              styles.subSectionTitle,
              styles.menSubSectionTitle,
              styles.genderStandaloneTitle,
            ]}
          >
            Mens-Footwear Subcategories
          </Text>
          <View
            style={[styles.genderBannerWrap, styles.menGenderBannerWrap]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerOverlay,
                styles.menBannerOverlay,
                { opacity: menBannerAnim },
              ]}
            />

            <Animated.View
              style={[
                styles.genderBannerImageAnimWrap,
                {
                  transform: [
                    {
                      translateY: menBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                    {
                      scale: menBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={GENDER_SECTION_BANNER.men}
                style={styles.genderBannerImage}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerBadgeAnimWrap,
                {
                  opacity: menBannerAnim,
                  transform: [
                    {
                      translateY: menBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.genderBannerBadge, styles.menBannerBadge]}>
                <Ionicons name="person" size={16} color="#0B3A91" />
                <Text style={[styles.genderBannerBadgeText, styles.menBadgeText]}>
                  For Him
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={[styles.genderSubWrap, styles.menGenderSubWrap]}>
            <View style={styles.subGrid}>
              {mensSubcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subCard, styles.menSubCard]}
                  activeOpacity={0.9}
                  onPress={() => handleFootwearSubcategoryPress("men", sub)}
                >
                  <Image source={sub.image} style={styles.subCardImage} />
                  <Text
                    style={[styles.subCardLabel, styles.menSubCardLabel]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.goldShowcaseSection}>
          <View style={styles.goldHeroCard}>
            <View style={styles.goldHeroTextWrap}>
              <Text style={styles.goldHeroKicker}>QUICKLY BUY HERE</Text>
              <Text style={styles.goldHeroTitle}>Best Prices{"\n"}With Us.</Text>
              <Text style={styles.goldHeroSub}>
              Premium quality products at the best prices, with reliable service and fast delivery.
              </Text>
              <TouchableOpacity style={styles.goldHeroCta} activeOpacity={0.9}>
                <Text style={styles.goldHeroCtaText}>Shop Here</Text>
              </TouchableOpacity>
            </View>
            <Image source={FW2} style={styles.goldHeroImage} />
          </View>

         

          
        </View>

        <View
          style={styles.genderSection}
          onLayout={(event) => {
            kidsSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text
            style={[
              styles.subSectionTitle,
              styles.kidsSubSectionTitle,
              styles.genderStandaloneTitle,
            ]}
          >
            Kids-Footwear Subcategories
          </Text>
          <View
            style={[styles.genderBannerWrap, styles.kidsGenderBannerWrap]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerOverlay,
                styles.kidsBannerOverlay,
                { opacity: kidsBannerAnim },
              ]}
            />

            <Animated.View
              style={[
                styles.genderBannerImageAnimWrap,
                {
                  transform: [
                    {
                      translateY: kidsBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                    {
                      scale: kidsBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={GENDER_SECTION_BANNER.kids}
                style={styles.genderBannerImage}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerBadgeAnimWrap,
                {
                  opacity: kidsBannerAnim,
                  transform: [
                    {
                      translateY: kidsBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.genderBannerBadge, styles.kidsBannerBadge]}>
                <Ionicons name="star" size={16} color="#7A5200" />
                <Text style={[styles.genderBannerBadgeText, styles.kidsBadgeText]}>
                  Mini Stars
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={[styles.genderSubWrap, styles.kidsGenderSubWrap]}>
            <View style={styles.subGrid}>
              {kidsSubcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subCard, styles.kidsSubCard]}
                  activeOpacity={0.9}
                  onPress={() => handleFootwearSubcategoryPress("kids", sub)}
                >
                  <Image source={sub.image} style={styles.subCardImage} />
                  <Text
                    style={[styles.subCardLabel, styles.kidsSubCardLabel]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.relatedProductsSection}>
          {(() => {
            const uniqueProducts = Array.from(
              new Map(relatedMensProducts.map((p) => [String(p.id), p])).values()
            );
            const fmtRs = (n: number | null) =>
              n != null && Number.isFinite(n) ? `Rs ${Math.round(n)}` : "";
            const related = uniqueProducts.map((p) => {
              const showMrp =
                p.mrpPrice != null &&
                p.sellingPrice != null &&
                p.mrpPrice > p.sellingPrice + 0.009;
              return {
                id: String(p.id),
                name: safeText(p.name),
                image: { uri: p.imageUri } as ImageSourcePropType,
                sellingPriceNum:
                  p.sellingPrice != null && Number.isFinite(p.sellingPrice)
                    ? Number(p.sellingPrice)
                    : 0,
                mrpPriceNum:
                  p.mrpPrice != null && Number.isFinite(p.mrpPrice)
                    ? Number(p.mrpPrice)
                    : p.sellingPrice != null && Number.isFinite(p.sellingPrice)
                    ? Number(p.sellingPrice)
                    : 0,
                sellingLabel: fmtRs(p.sellingPrice),
                mrpLabel: showMrp ? fmtRs(p.mrpPrice) : "",
                discountLabel:
                  p.discountPercentage != null && Number.isFinite(p.discountPercentage)
                    ? `${Number(p.discountPercentage).toFixed(1).replace(/\.0$/, "")}% off`
                    : "",
                ratingLabel:
                  p.rating != null && Number.isFinite(p.rating)
                    ? Number(p.rating).toFixed(1)
                    : "—",
                ...(p.variantId != null ? { variantId: p.variantId } : {}),
              };
            });

            return (
              <>
          <View style={styles.relatedProductsHeaderRow}>
            <Text style={styles.relatedProductsTitle}>All Related Footwear Products</Text>
            <Text style={styles.relatedProductsCount}>
                    {related.length} items
            </Text>
          </View>

          <View style={styles.relatedProductsGrid}>
                  {related.length === 0 ? (
                    <Text style={styles.relatedProductsEmptyText}>
                      {footwearMainCategoryId == null
                        ? resolvingMainCategoryId
                          ? "Resolving footwear category..."
                          : "Footwear category id not found."
                        : relatedProductsLoading
                        ? "Loading products..."
                        : "No related products found."}
                    </Text>
                  ) : null}
                  {related.map((product: any) => {
                    const wishlisted = categoryPtbRowWishlisted(
                      product,
                      wishlistHasAuth,
                      wishlistServerKeys,
                      wishlistIds
                    );
                    return (
              <TouchableOpacity
                key={product.id}
                style={styles.relatedProductCard}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/productdetail",
                            params: { id: String(product.id) },
                  } as any)
                }
                accessibilityRole="button"
                accessibilityLabel={`${product.name}, view details`}
              >
                <View style={styles.relatedProductInner}>
                  <Image
                    source={product.image}
                    style={styles.relatedProductImage}
                  />
                  <View style={styles.relatedProductMeta}>
                    <Text style={styles.relatedProductName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <View style={styles.relatedProductCategory}>
                      <View style={styles.relatedProductRatingPill}>
                        <Ionicons name="star" size={12} color="#ef7b1a" />
                        <Text style={styles.relatedProductRatingText}>
                          {product.ratingLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.relatedProductPriceRow}>
                      {product.sellingLabel ? (
                        <Text style={styles.relatedProductPrice}>{product.sellingLabel}</Text>
                      ) : null}
                      {product.mrpLabel ? (
                        <Text style={styles.relatedProductMrp}>{product.mrpLabel}</Text>
                      ) : null}
                      {product.discountLabel ? (
                        <View style={styles.relatedProductDiscountPill}>
                          <Text style={styles.relatedProductDiscountText}>
                            {product.discountLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.relatedProductBottomRow}>
                      <View style={styles.relatedProductActionsRow}>
                        <TouchableOpacity
                          style={styles.relatedProductWishlistBtn}
                          activeOpacity={0.85}
                          onPress={() => void handleToggleWishlist(product)}
                          accessibilityRole="button"
                          accessibilityLabel={`${
                            wishlisted ? "Remove from" : "Add to"
                          } wishlist: ${product.name}`}
                        >
                          <Ionicons
                            name={wishlisted ? "heart" : "heart-outline"}
                            size={16}
                            color={wishlisted ? "#E11D48" : "#1d324e"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.relatedProductCartBtn}
                          activeOpacity={0.85}
                          onPress={() => void handleAddToCart(product)}
                          accessibilityRole="button"
                          accessibilityLabel={`Add to cart: ${product.name}`}
                        >
                          <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.relatedProductCartBtnText}>
                            Add to Cart
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
                    );
                  })}
          </View>
              </>
            );
          })()}
        </View>
      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F0",
  },
  contentContainer: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#FFF7F0",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFF7F0",
    shadowColor: "#1d324e",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerLeading: {
    width: 32,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  topMenuBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 25,
    backgroundColor: "#FFF7F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFF7F0",
  },
  topMenuTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  topMenuTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5a6578",
  },
  topMenuTabTextActive: {
    color: "#1d324e",
  },
  topMenuTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
    resizeMode: "cover",
  },
  faviconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#CFD7E6",
  },
  faviconImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    resizeMode: "cover",
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 7,
    fontSize: 13,
    color: "#1D324E",
  },
  iconBtn: {
    marginLeft: 12,
    position: "relative",
  },
  headerIconBadge: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
  },
  headerIconBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
  },
  dualBannerCard: {
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#202020",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(3, 4, 5, 0.25)",
    shadowColor: "#1d324e",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dualBannerTopImage: {
    width: "118%",
    height: 280,
    resizeMode: "cover",
  },
  dualBannerDivider: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dualBannerBottomImage: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  tileRow: {
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  tileCard: {
    width: 86,
    marginHorizontal: 4,
    backgroundColor: "#FFFDF9",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    padding: 6,
    alignItems: "center",
    shadowColor: "#ef7b1a",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tileCardActive: {
    borderColor: "#ef7b1a",
    borderWidth: 1,
  },
  tileImage: {
    width: 72,
    height: 44,
    borderRadius: 6,
    resizeMode: "cover",
  },
  tileLabel: {
    marginTop: 5,
    fontSize: 11,
    color: "#1E2330",
    fontWeight: "700",
  },
  heroCarousel: {
    width: HERO_SLIDE_WIDTH,
    alignSelf: "center",
  },
  heroWrap: {
    width: HERO_SLIDE_WIDTH,
    height: 310,
    backgroundColor: "#f6c795",
    borderRadius: 14,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dotRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  dot: {
    width: 20,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#D8D8D8",
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: "#1d324e",
  },
  hubScreenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1d324e",
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  hubScreenSub: {
    fontSize: 14,
    color: "#5a6578",
    paddingHorizontal: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  hubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  hubCard: {
    width: "48.5%",
    backgroundColor: "#FFFDF9",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,118,110,0.25)",
    shadowColor: "#1d324e",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  hubCardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  hubCardLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A6B5C",
    paddingHorizontal: 10,
    paddingVertical: 12,
    textAlign: "center",
  },
  categoriesListSection: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 18,
    backgroundColor: "#E0FFF4",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,118,110,0.25)",
    padding: 10,
  },
  genderSection: {
    marginTop: 6,
  },
  genderBannerWrap: {
    marginHorizontal: 10,
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EAF2FF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  genderBannerImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  genderBannerImageAnimWrap: {
    width: "100%",
    height: 200,
  },
  genderSubWrap: {
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    padding: 10,
  },
  genderBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  womenBannerOverlay: {
    backgroundColor: "rgba(255,224,236,0.55)",
  },
  menBannerOverlay: {
    backgroundColor: "rgba(221,235,255,0.55)",
  },
  kidsBannerOverlay: {
    backgroundColor: "rgba(255,247,219,0.65)",
  },
  genderBannerBadgeAnimWrap: {
    position: "absolute",
    top: 14,
    left: 14,
  },
  genderBannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
  },
  genderBannerBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },
  womenBannerBadge: {
    borderColor: "rgba(122,30,73,0.25)",
  },
  womenBadgeText: {
    color: "#7A1E49",
  },
  menBannerBadge: {
    borderColor: "rgba(11,58,145,0.18)",
  },
  menBadgeText: {
    color: "#0B3A91",
  },
  kidsBannerBadge: {
    borderColor: "rgba(122,82,0,0.20)",
  },
  kidsBadgeText: {
    color: "#7A5200",
  },
  womenGenderBannerWrap: {
    backgroundColor: "#FFE0EC",
    borderColor: "rgba(239,123,26,0.25)",
  },
  womenGenderSubWrap: {
    backgroundColor: "#FFEAF7",
    borderColor: "rgba(239,123,26,0.25)",
  },
  menGenderBannerWrap: {
    backgroundColor: "#DDEBFF",
    borderColor: "rgba(29,50,78,0.18)",
  },
  menGenderSubWrap: {
    backgroundColor: "#EAF2FF",
    borderColor: "rgba(29,50,78,0.20)",
  },
  kidsGenderBannerWrap: {
    backgroundColor: "#FFF7DB",
    borderColor: "rgba(239,123,26,0.22)",
  },
  kidsGenderSubWrap: {
    backgroundColor: "#FFFBEA",
    borderColor: "rgba(239,123,26,0.22)",
  },
  womenSubSectionTitle: {
    color: "#7A1E49",
  },
  womenSubCard: {
    backgroundColor: "#FFF1FA",
    borderColor: "rgba(122,30,73,0.20)",
  },
  womenSubCardLabel: {
    color: "#7A1E49",
  },
  menSubSectionTitle: {
    color: "#0B3A91",
  },
  menSubCard: {
    backgroundColor: "#EEF5FF",
    borderColor: "rgba(11,58,145,0.18)",
  },
  menSubCardLabel: {
    color: "#0B3A91",
  },
  kidsSubSectionTitle: {
    color: "#7A5200",
  },
  kidsSubCard: {
    backgroundColor: "#FFF7D6",
    borderColor: "rgba(239,123,26,0.22)",
  },
  kidsSubCardLabel: {
    color: "#7A5200",
  },
  subSectionWrap: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: "#FFF3E9",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
    padding: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1d324e",
    marginBottom: 10,
  },
  genderStandaloneTitle: {
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  subCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.30)",
  },
  subCardImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  subCardLabel: {
    fontSize: 12,
    color: "#1D2430",
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F4F6FA",
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitles: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1d324e",
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  topTierSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#504f56",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1d324e",
    paddingBottom: 8,
  },
  moodSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f6c795",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f6c795",
    paddingBottom: 10,
  },
  deskSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#69798c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,160,185,0.35)",
    overflow: "hidden",
  },
  perfectPairSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f6c795",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.40)",
    overflow: "hidden",
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  promoCard: {
    width: "48.5%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#FFDDBA",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
  },
  promoImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
  },
  promoBadge: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    backgroundColor: "#1b98e066",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
    
  },
  promoBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  moodCard: {
    width: "48.5%",
    borderRadius: 12,
    backgroundColor: "#FFF1C2",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
    overflow: "hidden",
    marginBottom: 8,
  },
  moodImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  moodText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D2430",
    padding: 8,
    textAlign: "center",
  },
  deskHeaderStrip: {
    marginTop: 10,
    marginHorizontal: 10,
    backgroundColor: "#69798c",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  deskHeaderTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  deskHeaderSub: {
    marginTop: 3,
    fontSize: 10,
    color: "#FFF7E8",
    fontWeight: "600",
  },
  weekendCard: {
    marginTop: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FFE8D5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,160,185,0.35)",
    overflow: "hidden",
    paddingBottom: 10,
  },
  weekendTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1f252f",
    paddingHorizontal: 12,
    paddingTop: 10,
    marginBottom: 8,
  },
  weekendImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  weekendDotRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  weekendDot: {
    width: 20,
    height: 4,
    borderRadius: 5,
    marginHorizontal: 4,
    backgroundColor: "#D7D7D7",
  },
  weekendDotActive: {
    backgroundColor: "#ef7b1a",
  },
  perfectPairHeader: {
    marginTop: 12,
    marginHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#ef7b1a",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  perfectPairTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  perfectPairBody: {
    marginHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#Ef7b1a",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  perfectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  perfectItem: {
    width: "31%",
    alignItems: "center",
    marginBottom: 12,
  },
  perfectCircleImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: "#1D324E",
  },
  perfectItemLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  tallVideoSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#504f56",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,160,185,0.35)",
    padding: 10,
  },
  tallVideoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
  },
  tallVideoWrap: {
    width: "100%",
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f6c795",
  },
  tallVideo: {
    width: "100%",
    height: "100%",
  },
  tallVideoHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#79411c",
    fontWeight: "600",
  },
  relatedProductsSection: {
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 28,
    paddingHorizontal: 2,
  },
  relatedProductsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  relatedProductsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1d324e",
    flex: 1,
    paddingRight: 8,
  },
  relatedProductsCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5a6578",
  },
  relatedProductsEmptyText: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    color: "#5a6578",
    fontWeight: "700",
  },
  relatedProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingBottom: 40,
  },
  relatedProductCard: {
    width: "49%",
    borderRadius: 12,
    
    backgroundColor: "#ef7b1a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 1,
    marginBottom: 18,
    overflow:"visible",
  },
  relatedProductInner: {
    flex: 1,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFDF9",
    margin:1,
  },
  relatedProductImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
    backgroundColor: "#FFFFFF",
  },
  relatedProductMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  relatedProductName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D2430",
    minHeight: 30,
  },
  relatedProductCategory: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  relatedProductPriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 6,
  },
  relatedProductDiscountPill: {
    backgroundColor: "rgba(239,123,26,0.14)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  relatedProductDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#b45309",
  },
  relatedProductMrp: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  relatedProductBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  relatedProductActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 4,
  },
  relatedProductWishlistBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.25)",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  relatedProductCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#1d324e",
  },
  relatedProductCartBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  relatedProductPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1d324e",
  },
  relatedProductRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  relatedProductRatingText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A4E17",
  },
  goldShowcaseSection: {
    marginHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.16)",
    padding: 10,
  },
  goldHeroCard: {
    backgroundColor: "#17314f",
    borderRadius: 18,
    padding: 14,
    overflow: "hidden",
  },
  goldHeroTextWrap: {
    width: "58%",
    zIndex: 2,
  },
  goldHeroKicker: {
    fontSize: 9,
    fontWeight: "800",
    color: "#f5c24c",
    marginBottom: 6,
  },
  goldHeroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: "#ffffff",
  },
  goldHeroSub: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.75)",
  },
  goldHeroCta: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#f2ba3d",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  goldHeroCtaText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1f2d3e",
  },
  goldHeroImage: {
    position: "absolute",
    right: -12,
    bottom: 10,
    borderRadius:290,
    width: 200,
    height: 170,
    resizeMode: "contain",
  },
  goldArrivalHeader: {
    marginTop: 14,
    alignItems: "center",
  },
  goldArrivalTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: "#1d2430",
  },
  goldArrivalSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#8b93a2",
  },
  goldArrivalViewAll: {
    position: "absolute",
    right: 0,
    top: 14,
    fontSize: 12,
    fontWeight: "700",
    color: "#5a6578",
  },
  goldArrivalGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  goldArrivalCard: {
    width: "48.5%",
    marginBottom: 12,
  },
  goldArrivalImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#f4f5f6",
  },
  goldArrivalName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#1d2430",
  },
  goldArrivalPrice: {
    marginTop: 2,
    fontSize: 11,
    color: "#202938",
    fontWeight: "700",
  },
  goldArrivalStars: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "#e6b63f",
  },
});


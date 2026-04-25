import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import api, { productsByMainCategoryPath, searchProductsPath, searchSuggestionsPath } from "../services/api";
import {
  MainCategoryApiRowPtb,
  normalizeMainCategoryName,
  pickPtbProductImageUri,
  pickPtbProductRating,
  pickPtbVariantPricing,
  safePtbText,
} from "../lib/mainCategoryPtbHelpers";
import { addToCartPtbOrLocal, getCartUnitCount } from "../lib/cartServerApi";
import { getWishlistIds } from "../lib/shopStorage";
import {
  categoryPtbRowWishlisted,
  fetchWishlistServerKeySet,
  togglePtbWishlistWithServer,
} from "../lib/wishlistServerApi";

const HEADER_FT_LOGO = require("../assets/men/categories/fntfav.png");

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return `rgba(29, 50, 78, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Route params for Homely Hub gift subcategory PLP; `subcategoryId` only when id is a real API numeric id. */
function homelyHubSubcatNavigatorParams(subCategory: string, itemId?: string | number) {
  const sub = String(subCategory ?? "").trim();
  const raw = itemId === undefined || itemId === null ? "" : String(itemId);
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  const idOk = Number.isFinite(n) && n > 0;
  return {
    mainCat: "homelyHub",
    subCategory: sub,
    ...(idOk ? { subcategoryId: String(n) } : {}),
  };
}

type GiftCategory = {
  id: string;
  title: string;
  emoji: string;
  bg: string;
  /** When set, shown inside the category circle instead of the emoji */
  circleImage?: any;
};

type GiftSubcategoryApiRow = {
  bannerImage: string | null;
  categoryName: string;
  createdAt: string;
  gstPercentage: number;
  hsnCode: string;
  id: number;
  image: string | null;
  mobileImage: string | null;
  parentId: number | null;
  sellerId: number | null;
  status: number;
};

type SubcategoriesTableSubRow = {
  id: number;
  name: string;
  image: string | null;
  mobileImage: string | null;
};

type SubcategoriesTableRow = {
  categoryName: string;
  mobileImage: string | null;
  subcategories: SubcategoriesTableSubRow[];
};

type GiftItem = {
  id: string;
  name: string;
  price: string;
  image: any;
};

type TrendingProduct = {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  badge?: string;
  image: any;
};

type ArtSubCategory = {
  id: string;
  title: string;
  image: any;
  /** When true, no scrim / label on card (art is in the image) */
  hideTitle?: boolean;
  /** Large title centered right; topLeft = compact heading top-left on image */
  titleLayout?: "default" | "topLeft";
  /** Small caps line above title when titleLayout is topLeft */
  topLeftEyebrow?: string;
};

type CorporateSubCategory = {
  id: string;
  title: string;
  image: any;
};

type EventSubCategory = {
  id: string;
  title: string;
  emoji: string;
  bg: string;
  /** Optional photo inside the occasion circle */
  image?: any;
};

type UtilitySubCategory = {
  id: string;
  title: string;
  icon: string;
  bg: string;
};

type CoupleSubCategory = {
  id: string;
  title: string;
  emoji: string;
  bg: string;
};

const GIFT_CATEGORIES: GiftCategory[] = [
  {
    id: "gc1",
    title: "Art & Creative Gifts",
    emoji: "🎨",
    bg: "#F8E7ED",
    circleImage: require("../assets/homelyhub/ArtCreativeGifts.png"),
  },
  {
    id: "gc2",
    title: "Corporate Gifts",
    emoji: "🏢",
    bg: "#E0E7FF",
    circleImage: require("../assets/homelyhub/CorporatePromotionalGifts.png"),
  },
  {
    id: "gc3",
    title: "Event-Based Gifts",
    emoji: "🎉",
    bg: "#FFE4E6",
    circleImage: require("../assets/homelyhub/EventBasedGifts.png"),
  },
  {
    id: "gc4",
    title: "Everyday Utility",
    emoji: "🏠",
    bg: "#EAF7E8",
    circleImage: require("../assets/homelyhub/EverydayUtility.png"),
  },
  {
    id: "gc5",
    title: "Couple Gifts",
    emoji: "💞",
    bg: "#FCEBF1",
    circleImage: require("../assets/homelyhub/GiftsforCouples.png"),
  },
  {
    id: "gc6",
    title: "Home Decor Gifts",
    emoji: "🛋️",
    bg: "#F0F4FF",
    circleImage: require("../assets/homelyhub/HomeDecorGifits.png"),
  },
  {
    id: "gc7",
    title: "Kids & Baby Gifts",
    emoji: "👶",
    bg: "#FEF3C7",
    circleImage: require("../assets/homelyhub/KidsBabyGifts.png"),
  },
  {
    id: "gc8",
    title: "Spiritual & Festival Gifts",
    emoji: "🪔",
    bg: "#FEE2E2",
    circleImage: require("../assets/homelyhub/Spiritual&FestivalGifts.png"),
  },
  {
    id: "gc9",
    title: "Wearable & Personal Gifts",
    emoji: "🎀",
    bg: "#EDE9FE",
    circleImage: require("../assets/homelyhub/Wearable&PersonalGifts.png"),
  },
];

type CategoryHeroBanner = {
  image: any;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: readonly [string, string];
  /** Optional — default top-left → bottom-right diagonal */
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
};

const DEFAULT_GIFT_HERO: CategoryHeroBanner = {
  image: require("../assets/homelyhub/HomelyHubBanner.png"),
  eyebrow: "GIFTING SEASON",
  title: "Make Moments Special",
  subtitle: "Curated gifts for every occasion",
  cta: "Shop Now",
  gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
  gradientStart: { x: 0.5, y: 0.15 },
  gradientEnd: { x: 0.5, y: 1 },
};

/** Top banner content switches when user picks a category circle */
const GIFT_CATEGORY_HERO: Record<string, CategoryHeroBanner> = {
  gc1: {
    image: require("../assets/homelyhub/ArtCreativeGifts.png"),
    eyebrow: "ART & CREATIVE",
    title: "Handmade & One‑of‑a‑Kind",
    subtitle: "Line art, prints & personalized creative gifts",
    cta: "Browse Art",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc2: {
    image: require("../assets/homelyhub/CorporatePromotionalGifts.png"),
    eyebrow: "CORPORATE & B2B",
    title: "Branded Gifts That Impress",
    subtitle: "Diaries, trophies & welcome kits for teams",
    cta: "See Business Picks",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc3: {
    image: require("../assets/homelyhub/EventBasedGifts.png"),
    eyebrow: "EVENTS & CELEBRATIONS",
    title: "Gifts for Every Occasion",
    subtitle: "Birthdays, weddings, anniversaries & hampers",
    cta: "Shop Occasions",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc4: {
    image: require("../assets/homelyhub/EverydayUtility.png"),
    eyebrow: "EVERYDAY UTILITY",
    title: "Useful & Personalized",
    subtitle: "Mugs, cushions, name plates & home essentials",
    cta: "View Utilities",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc5: {
    image: require("../assets/homelyhub/GiftsforCouples.png"),
    eyebrow: "COUPLE GIFTS",
    title: "Made for Two",
    subtitle: "Romantic boxes, keepsakes & surprise ideas",
    cta: "For Couples",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc6: {
    image: require("../assets/homelyhub/HomeDecorGifits.png"),
    eyebrow: "HOMELY HUB",
    title: "Home Decor Gifts",
    subtitle: "Frames, accents & cozy touches for every room",
    cta: "Explore decor",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc7: {
    image: require("../assets/homelyhub/KidsBabyGifts.png"),
    eyebrow: "HOMELY HUB",
    title: "Kids & Baby Gifts",
    subtitle: "Toys, hampers & essentials for little ones",
    cta: "Shop kids",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc8: {
    image: require("../assets/homelyhub/Spiritual&FestivalGifts.png"),
    eyebrow: "HOMELY HUB",
    title: "Spiritual & Festival Gifts",
    subtitle: "Festive hampers, rituals & celebration picks",
    cta: "View festival",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
  gc9: {
    image: require("../assets/homelyhub/Wearable&PersonalGifts.png"),
    eyebrow: "HOMELY HUB",
    title: "Wearable & Personal Gifts",
    subtitle: "Scarves, jewelry & personalized keepsakes",
    cta: "See wearable",
    gradient: ["rgba(0,0,0,0)", "rgba(15,23,42,0.78)"],
    gradientStart: { x: 0.5, y: 0.15 },
    gradientEnd: { x: 0.5, y: 1 },
  },
};

const TRENDING_GIFTS: GiftItem[] = [
  {
    id: "tg1",
    name: "Personalized Mug",
    price: "$12",
    image: require("../assets/images/homecate.png"),
  },
  {
    id: "tg2",
    name: "Luxury Watch",
    price: "$45",
    image: require("../assets/images/menscate.png"),
  },
  {
    id: "tg3",
    name: "Flower Bouquet",
    price: "$29",
    image: require("../assets/images/sweetscate.png"),
  },
];

const ART_SUB_CATEGORIES: ArtSubCategory[] = [
  {
    id: "a1",
    title: "Minimalist Line Art",
    image: require("../assets/images/minimalist_138.png"),
    titleLayout: "topLeft",
    topLeftEyebrow: "MINIMAL ART",
  },
  {
    id: "a2",
    title: "Canvas Painting Prints",
    image: require("../assets/images/canvaPaint.jpg"),
    titleLayout: "topLeft",
    topLeftEyebrow: "CANVAS & PRINT",
  },
  {
    id: "a3",
    title: "Pencil Sketches",
    image: require("../assets/images/Pencilscketch.jpg"),
    titleLayout: "topLeft",
    topLeftEyebrow: "HAND DRAWN",
  },
];

const CORPORATE_SUB_CATEGORIES: CorporateSubCategory[] = [
  {
    id: "c1",
    title: "Company Logo Frames",
    image: require("../assets/images/logoFrames.jpg"),
  },
  {
    id: "c2",
    title: "Diaries",
    image: require("../assets/images/Diaries.jpg"),
  },
  {
    id: "c3",
    title: "Medal",
    image: require("../assets/images/medals.jpg"),
  },
  {
    id: "c4",
    title: "Pens",
    image: require("../assets/images/Pen.jpg"),
  },
  {
    id: "c5",
    title: "Trophies",
    image: require("../assets/images/trophies.jpg"),
  },
  {
    id: "c6",
    title: "Welcome Combo Kits",
    image: require("../assets/images/wel.jpg"),
  },
];

const EVENT_SUB_CATEGORIES: EventSubCategory[] = [
  {
    id: "e1",
    title: "Birthday Combo Hampers",
    emoji: "🎂",
    bg: "#FEE2E2",
    image: require("../assets/images/hamper.jpg"),
  },
  {
    id: "e2",
    title: "Anniversary Gifts",
    emoji: "💑",
    bg: "#FECACA",
    image: require("../assets/images/annvier.jpg"),
  },
  {
    id: "e3",
    title: "Wedding Gifts",
    emoji: "💒",
    bg: "#FED7AA",
    image: require("../assets/images/wedding.webp"),
  },
  {
    id: "e4",
    title: "Engagement Gifts",
    emoji: "💍",
    bg: "#E9D5FF",
    image: require("../assets/images/engement.jpg"),
  },
  {
    id: "e5",
    title: "Baby Shower Gifts",
    emoji: "👶",
    bg: "#DBEAFE",
    image: require("../assets/images/baby.jpg"),
  },
  {
    id: "e6",
    title: "Gifts Hampers",
    emoji: "🎁",
    bg: "#DBEAFE",
    image: require("../assets/images/gifts.jpg"),
  },
];

const UTILITY_SUB_CATEGORIES: UtilitySubCategory[] = [
  { id: "u1", title: "Cushion Covers", icon: "🛋️", bg: "#DCFCE7" },
  { id: "u2", title: "Customized Mugs", icon: "☕", bg: "#FFEDD5" },
  { id: "u3", title: "Desk Name Plates", icon: "🪪", bg: "#E0E7FF" },
  { id: "u4", title: "Keychains", icon: "🔑", bg: "#FCE7F3" },
  { id: "u5", title: "Printed Cushions", icon: "🧸", bg: "#EDE9FE" },
  { id: "u6", title: "Water Bottle", icon: "🚰", bg: "#DBEAFE" },
];

/** Homely Hub — extra gift circles (gc6–gc9) */
const HOMELY_HUB_GIFT_SUBS: Record<string, UtilitySubCategory[]> = {
  gc6: [
    { id: "hd1", title: "Wall & Table Decor", icon: "🖼️", bg: "#E8EEF9" },
    { id: "hd2", title: "Cushions & Throws", icon: "🛋️", bg: "#FCE7F3" },
    { id: "hd3", title: "Vases & Centerpieces", icon: "🏺", bg: "#ECFDF5" },
    { id: "hd4", title: "Lighting & Accents", icon: "💡", bg: "#FFF7ED" },
  ],
  gc7: [
    { id: "kb1", title: "Toys & Games", icon: "🧸", bg: "#FEF9C3" },
    { id: "kb2", title: "Kids Clothing Sets", icon: "👕", bg: "#DBEAFE" },
    { id: "kb3", title: "Baby Hampers", icon: "🎁", bg: "#FCE7F3" },
    { id: "kb4", title: "Nursery & Essentials", icon: "🍼", bg: "#E0E7FF" },
  ],
  gc8: [
    { id: "sf1", title: "Idols & Diyas", icon: "🪔", bg: "#FFEDD5" },
    { id: "sf2", title: "Puja Essentials", icon: "🙏", bg: "#FEE2E2" },
    { id: "sf3", title: "Festive Hampers", icon: "🎊", bg: "#FEF3C7" },
    { id: "sf4", title: "Seasonal Decor", icon: "✨", bg: "#EDE9FE" },
  ],
  gc9: [
    { id: "wp1", title: "Jewelry & Watches", icon: "⌚", bg: "#FDF4FF" },
    { id: "wp2", title: "Scarves & Wraps", icon: "🧣", bg: "#E0F2FE" },
    { id: "wp3", title: "Personalized Apparel", icon: "👔", bg: "#F1F5F9" },
    { id: "wp4", title: "Gift Sets & Bundles", icon: "🎀", bg: "#FFF1F2" },
  ],
};

const COUPLE_SUB_CATEGORIES: CoupleSubCategory[] = [
  {
    id: "cp1",
    title: "Explosion Gift Boxes",
    emoji: "🎁",
    bg: "#FCE7F3",
  },
  {
    id: "cp2",
    title: "Gift Items Novelties",
    emoji: "✨",
    bg: "#E0E7FF",
  },
  {
    id: "cp3",
    title: "Love Scrapbooks",
    emoji: "📖",
    bg: "#FDF4FF",
  },
];

const TRENDING_PRODUCTS: TrendingProduct[] = [
  {
    id: "tp1",
    name: "Personalized Photo Frame",
    price: "$18",
    mrp: "$30",
    badge: "40% OFF",
    image: require("../assets/images/homecate.png"),
  },
  {
    id: "tp2",
    name: "Customized Name Plate",
    price: "$22",
    mrp: "$35",
    badge: "HOT",
    image: require("../assets/images/menscate.png"),
  },
  {
    id: "tp3",
    name: "Luxury Gift Hamper",
    price: "$49",
    mrp: "$70",
    badge: "DEAL",
    image: require("../assets/images/sweetscate.png"),
  },
  {
    id: "tp4",
    name: "Couple LED Lamp",
    price: "$25",
    mrp: "$40",
    badge: "BEST",
    image: require("../assets/images/womencate.png"),
  },
];

const TRENDING_GIFTS_AS_PRODUCTS: TrendingProduct[] = TRENDING_GIFTS.map((g, i) => ({
  id: `tg-row-${g.id}`,
  name: g.name,
  price: g.price,
  mrp: i === 1 ? "$58" : undefined,
  badge: i === 0 ? "Hot" : i === 2 ? "New" : undefined,
  image: g.image,
}));

const RECOMMENDED_FOR_YOU_PRODUCTS: TrendingProduct[] = [
  { ...TRENDING_PRODUCTS[2], id: "rfy-1", badge: "Editors' pick" },
  { ...TRENDING_PRODUCTS[3], id: "rfy-2", badge: "Popular" },
  { ...TRENDING_PRODUCTS[0], id: "rfy-3", badge: "Deal" },
  { ...TRENDING_PRODUCTS[1], id: "rfy-4", badge: "Staff pick" },
];

const RECENTLY_VIEWED_PRODUCTS: TrendingProduct[] = [
  { ...TRENDING_PRODUCTS[1], id: "rv-1", badge: undefined },
  { ...TRENDING_PRODUCTS[0], id: "rv-2", badge: undefined },
  { ...TRENDING_PRODUCTS[3], id: "rv-3", badge: undefined },
  { ...TRENDING_PRODUCTS[2], id: "rv-4", badge: undefined },
];

const BEST_SELLER_PRODUCTS: TrendingProduct[] = [
  { ...TRENDING_PRODUCTS[0], id: "bs-1", badge: "#1 Seller" },
  { ...TRENDING_PRODUCTS[1], id: "bs-2", badge: "#2 Seller" },
  { ...TRENDING_PRODUCTS[2], id: "bs-3", badge: "Best rated" },
  { ...TRENDING_PRODUCTS[3], id: "bs-4", badge: "Top gift" },
];

const GIFTS_PTB_GRID_GAP = 12;

export default function GiftsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: giftWinW } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(
    null
  );

  // Search functionality
  const handleSearch = React.useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await api.get(searchProductsPath(trimmed));
      // Map API response to simple format for gifts
      const mappedResults = Array.isArray(data) ? data.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        name: item.name || item.productName || item.title || `Product ${item.id}`,
        imageUri: item.images?.[0]?.imagePath || "",
        sellingPrice: item.sellingPrice || item.price || 0,
        mrpPrice: item.mrpPrice || item.maxRetailPrice || 0,
        discountPercentage: item.discountPercentage || 0,
        rating: item.rating || 0,
      })) : [];
      setSearchResults(mappedResults);
      setShowSearchResults(true);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const SUBCATEGORIES_PARENT_ID = 89;
  const [giftApiSubcategories, setGiftApiSubcategories] = React.useState<
    GiftSubcategoryApiRow[]
  >([]);
  const [giftApiLoading, setGiftApiLoading] = React.useState<boolean>(true);
  const [giftApiError, setGiftApiError] = React.useState<string | null>(null);

  const getUploadsImageUriFromFilename = React.useCallback((filename?: string | null): string => {
    const raw = String(filename ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!base) return raw;
    return `${base}/uploads/${raw.replace(/^\/+/, "")}`;
  }, []);

  const normalizeGiftName = React.useCallback((name: string) => {
    return String(name ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, []);

  const giftNameToStaticId = React.useMemo(() => {
    // Map API names -> existing hardcoded ids so the rest of the screen
    // (hero banners + sections) keeps working without a full rewrite.
    return new Map<string, string>([
      ["art & creative gifts", "gc1"],
      ["corporate & promotional gifts", "gc2"],
      ["corporate gifts", "gc2"],
      ["event-based gifts", "gc3"],
      ["everyday utility", "gc4"],
      ["everyday utility", "gc4"],
      ["everyday utility", "gc4"],
      ["gifts for couples", "gc5"],
      ["couple gifts", "gc5"],
      ["home decor gifits", "gc6"],
      ["home decor gifts", "gc6"],
      ["kids & baby gifts", "gc7"],
      ["spiritual & festival gifts", "gc8"],
      ["wearable & personal gifts", "gc9"],
    ]);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setGiftApiLoading(true);
        setGiftApiError(null);
        const { data: rows } = await api.get(
          `/api/categories/${SUBCATEGORIES_PARENT_ID}/subcategories`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as GiftSubcategoryApiRow[]) : [];
        if (cancelled) return;
        setGiftApiSubcategories(list);
      } catch (e: any) {
        if (cancelled) return;
        setGiftApiSubcategories([]);
        setGiftApiError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load gift categories"
        );
      } finally {
        if (cancelled) return;
        setGiftApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const giftCategoriesForUi: GiftCategory[] = React.useMemo(() => {
    const fallback = GIFT_CATEGORIES;
    const apiActive = giftApiSubcategories.filter((r) =>
      typeof r.status === "number" ? r.status === 1 : true
    );
    if (!apiActive.length) return fallback;

    return apiActive.map((row) => {
      const name = String(row.categoryName ?? "").trim() || "Gifts";
      const mappedId =
        giftNameToStaticId.get(normalizeGiftName(name)) ?? `api-${row.id}`;
      return {
        id: mappedId,
        title: name,
        emoji: "🎁",
        bg: "#FFEFDC",
        circleImage: row.mobileImage ? ({ uri: row.mobileImage } as any) : undefined,
      };
    });
  }, [giftApiSubcategories, giftNameToStaticId, normalizeGiftName]);

  const ART_CREATIVE_CATEGORY_ID = 101;
  const [artTable, setArtTable] = React.useState<SubcategoriesTableRow | null>(null);
  const [artTableLoading, setArtTableLoading] = React.useState<boolean>(false);
  const [artTableError, setArtTableError] = React.useState<string | null>(null);

  const WEARABLE_PERSONAL_CATEGORY_ID = 94;
  const [wearableTable, setWearableTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [wearableTableLoading, setWearableTableLoading] = React.useState<boolean>(false);
  const [wearableTableError, setWearableTableError] = React.useState<string | null>(
    null
  );

  const SPIRITUAL_FESTIVAL_CATEGORY_ID = 97;
  const [spiritualTable, setSpiritualTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [spiritualTableLoading, setSpiritualTableLoading] = React.useState<boolean>(false);
  const [spiritualTableError, setSpiritualTableError] = React.useState<string | null>(
    null
  );

  const KIDS_BABY_CATEGORY_ID = 95;
  const [kidsBabyTable, setKidsBabyTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [kidsBabyTableLoading, setKidsBabyTableLoading] = React.useState<boolean>(false);
  const [kidsBabyTableError, setKidsBabyTableError] = React.useState<string | null>(null);

  const HOME_DECOR_CATEGORY_ID = 92;
  const [homeDecorTable, setHomeDecorTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [homeDecorTableLoading, setHomeDecorTableLoading] = React.useState<boolean>(false);
  const [homeDecorTableError, setHomeDecorTableError] = React.useState<string | null>(
    null
  );

  const COUPLES_CATEGORY_ID = 96;
  const [couplesTable, setCouplesTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [couplesTableLoading, setCouplesTableLoading] = React.useState<boolean>(false);
  const [couplesTableError, setCouplesTableError] = React.useState<string | null>(null);

  const EVERYDAY_UTILITY_CATEGORY_ID = 93;
  const [utilityTable, setUtilityTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [utilityTableLoading, setUtilityTableLoading] = React.useState<boolean>(false);
  const [utilityTableError, setUtilityTableError] = React.useState<string | null>(null);

  const EVENT_CATEGORY_ID = 100;
  const [eventTable, setEventTable] = React.useState<SubcategoriesTableRow | null>(null);
  const [eventTableLoading, setEventTableLoading] = React.useState<boolean>(false);
  const [eventTableError, setEventTableError] = React.useState<string | null>(null);

  const CORPORATE_CATEGORY_ID = 99;
  const [corporateTable, setCorporateTable] = React.useState<SubcategoriesTableRow | null>(
    null
  );
  const [corporateTableLoading, setCorporateTableLoading] = React.useState<boolean>(false);
  const [corporateTableError, setCorporateTableError] = React.useState<string | null>(null);

  const isArtCreativeView = selectedCategoryId === "gc1";
  const isCorporateView = selectedCategoryId === "gc2";
  const isEventBasedView = selectedCategoryId === "gc3";
  const isUtilityView = selectedCategoryId === "gc4";
  const isCoupleView = selectedCategoryId === "gc5";
  const isHomelyHubExtendedView =
    selectedCategoryId === "gc6" ||
    selectedCategoryId === "gc7" ||
    selectedCategoryId === "gc8" ||
    selectedCategoryId === "gc9";

  React.useEffect(() => {
    let cancelled = false;
    if (!isArtCreativeView) return;

    (async () => {
      try {
        setArtTableLoading(true);
        setArtTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${ART_CREATIVE_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setArtTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setArtTable(null);
        setArtTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Art & Creative subcategories"
        );
      } finally {
        if (cancelled) return;
        setArtTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isArtCreativeView]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isEventBasedView) return;

    (async () => {
      try {
        setEventTableLoading(true);
        setEventTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${EVENT_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setEventTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setEventTable(null);
        setEventTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Event subcategories"
        );
      } finally {
        if (cancelled) return;
        setEventTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEventBasedView]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isCorporateView) return;

    (async () => {
      try {
        setCorporateTableLoading(true);
        setCorporateTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${CORPORATE_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setCorporateTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setCorporateTable(null);
        setCorporateTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Corporate subcategories"
        );
      } finally {
        if (cancelled) return;
        setCorporateTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCorporateView]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isCoupleView) return;

    (async () => {
      try {
        setCouplesTableLoading(true);
        setCouplesTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${COUPLES_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setCouplesTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setCouplesTable(null);
        setCouplesTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Couple subcategories"
        );
      } finally {
        if (cancelled) return;
        setCouplesTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCoupleView]);

  React.useEffect(() => {
    let cancelled = false;
    if (!isUtilityView) return;

    (async () => {
      try {
        setUtilityTableLoading(true);
        setUtilityTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${EVERYDAY_UTILITY_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setUtilityTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setUtilityTable(null);
        setUtilityTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Everyday Utility subcategories"
        );
      } finally {
        if (cancelled) return;
        setUtilityTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isUtilityView]);

  React.useEffect(() => {
    let cancelled = false;
    if (selectedCategoryId !== "gc9") return;

    (async () => {
      try {
        setWearableTableLoading(true);
        setWearableTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${WEARABLE_PERSONAL_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setWearableTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setWearableTable(null);
        setWearableTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Wearable & Personal subcategories"
        );
      } finally {
        if (cancelled) return;
        setWearableTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  React.useEffect(() => {
    let cancelled = false;
    if (selectedCategoryId !== "gc8") return;

    (async () => {
      try {
        setSpiritualTableLoading(true);
        setSpiritualTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${SPIRITUAL_FESTIVAL_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setSpiritualTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setSpiritualTable(null);
        setSpiritualTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Spiritual & Festival subcategories"
        );
      } finally {
        if (cancelled) return;
        setSpiritualTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  React.useEffect(() => {
    let cancelled = false;
    if (selectedCategoryId !== "gc7") return;

    (async () => {
      try {
        setKidsBabyTableLoading(true);
        setKidsBabyTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${KIDS_BABY_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setKidsBabyTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setKidsBabyTable(null);
        setKidsBabyTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Kids & Baby subcategories"
        );
      } finally {
        if (cancelled) return;
        setKidsBabyTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  React.useEffect(() => {
    let cancelled = false;
    if (selectedCategoryId !== "gc6") return;

    (async () => {
      try {
        setHomeDecorTableLoading(true);
        setHomeDecorTableError(null);

        const { data: rows } = await api.get(
          `/api/categories/${HOME_DECOR_CATEGORY_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as SubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;

        if (cancelled) return;
        setHomeDecorTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setHomeDecorTable(null);
        setHomeDecorTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Home Decor subcategories"
        );
      } finally {
        if (cancelled) return;
        setHomeDecorTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  const params = useLocalSearchParams<{
    id?: string | string[];
    mainCategoryId?: string | string[];
  }>();
  const rawGiftsMainCat = Array.isArray(params.id)
    ? params.id[0]
    : params.id ?? Array.isArray(params.mainCategoryId)
    ? params.mainCategoryId[0]
    : params.mainCategoryId;
  const parsedRouteGiftsMainCat = Number.parseInt(String(rawGiftsMainCat ?? ""), 10);
  const routeGiftsMainCategoryId =
    Number.isFinite(parsedRouteGiftsMainCat) && parsedRouteGiftsMainCat > 0
      ? parsedRouteGiftsMainCat
      : null;
  const [resolvedGiftsMainCategoryId, setResolvedGiftsMainCategoryId] = React.useState<
    number | null
  >(null);
  const [resolvingGiftsMainCategoryId, setResolvingGiftsMainCategoryId] = React.useState(false);
  const giftsMainCategoryIdForPtb =
    routeGiftsMainCategoryId ?? resolvedGiftsMainCategoryId ?? SUBCATEGORIES_PARENT_ID;

  type GiftsPtbApiRow = {
    id: number;
    name: string;
    imageUri: string;
    sellingPrice: number | null;
    mrpPrice: number | null;
    discountPercentage: number | null;
    rating: number | null;
    variantId?: number;
  };
  const [giftsPtbApi, setGiftsPtbApi] = React.useState<GiftsPtbApiRow[]>([]);
  const [giftsPtbLoading, setGiftsPtbLoading] = React.useState(false);
  const [recommendedForYouApiProducts, setRecommendedForYouApiProducts] = React.useState<
    TrendingProduct[]
  >([]);
  const [giftsWishlistIds, setGiftsWishlistIds] = React.useState<Set<string>>(new Set());
  const [giftsWishlistServerKeys, setGiftsWishlistServerKeys] = React.useState<Set<string>>(
    new Set()
  );
  const [giftsWishlistHasAuth, setGiftsWishlistHasAuth] = React.useState(false);
  const [giftsCartCount, setGiftsCartCount] = React.useState(0);

  const reloadGiftsWishlistIds = React.useCallback(async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    setGiftsWishlistHasAuth(!!token);
    const [ids, keys] = await Promise.all([
      getWishlistIds(),
      fetchWishlistServerKeySet(),
    ]);
    setGiftsWishlistIds(ids);
    setGiftsWishlistServerKeys(keys);
  }, []);

  const reloadGiftsCartCount = React.useCallback(async () => {
    setGiftsCartCount(await getCartUnitCount());
  }, []);

  React.useEffect(() => {
    void reloadGiftsWishlistIds();
    void reloadGiftsCartCount();
  }, [reloadGiftsWishlistIds, reloadGiftsCartCount]);

  useFocusEffect(
    React.useCallback(() => {
      void reloadGiftsWishlistIds();
      void reloadGiftsCartCount();
    }, [reloadGiftsWishlistIds, reloadGiftsCartCount])
  );

  React.useEffect(() => {
    if (routeGiftsMainCategoryId != null) {
      setResolvedGiftsMainCategoryId(null);
      setResolvingGiftsMainCategoryId(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setResolvingGiftsMainCategoryId(true);
      try {
        const { data } = await api.get("/api/categories/main");
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as MainCategoryApiRowPtb[]) : [];
        const row = rows.find((r) => {
          if (!r || typeof r.id !== "number") return false;
          if (typeof r.status === "number" && r.status !== 1) return false;
          const n = normalizeMainCategoryName(String(r.categoryName ?? ""));
          return (
            n.includes("gift") ||
            n.includes("homely") ||
            n.includes("gifting") ||
            n === "presents"
          );
        });
        setResolvedGiftsMainCategoryId(
          row && Number.isFinite(row.id) && row.id > 0 ? row.id : null
        );
      } catch {
        if (!cancelled) setResolvedGiftsMainCategoryId(null);
      } finally {
        if (!cancelled) setResolvingGiftsMainCategoryId(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeGiftsMainCategoryId]);

  React.useEffect(() => {
    const c = new AbortController();
    (async () => {
      setGiftsPtbLoading(true);
      try {
        const { data } = await api.get(productsByMainCategoryPath(giftsMainCategoryIdForPtb), {
          signal: c.signal,
        });
        if (!Array.isArray(data)) {
          setGiftsPtbApi([]);
          return;
        }
        const mapped = (data as unknown[])
          .filter((p) => p && typeof (p as any).id === "number" && typeof (p as any).name === "string")
          .map((p) => {
            const imageUri = pickPtbProductImageUri(p);
            if (!imageUri) return null;
            const { sellingPrice, mrpPrice, discountPercentage, variantId } =
              pickPtbVariantPricing(p);
            const ratingCandidate = pickPtbProductRating(p);
            const ratingNum =
              typeof ratingCandidate === "number"
                ? ratingCandidate
                : Number.parseFloat(String(ratingCandidate));
            return {
              id: (p as any).id as number,
              name: safePtbText(String((p as any).name ?? "")),
              imageUri,
              sellingPrice,
              mrpPrice,
              discountPercentage,
              rating: Number.isFinite(ratingNum) ? ratingNum : null,
              ...(variantId != null ? { variantId } : {}),
            } satisfies GiftsPtbApiRow;
          })
          .filter((row): row is GiftsPtbApiRow => row != null);
        setGiftsPtbApi(mapped);
      } catch {
        setGiftsPtbApi([]);
      } finally {
        setGiftsPtbLoading(false);
      }
    })();
    return () => c.abort();
  }, [giftsMainCategoryIdForPtb]);

  React.useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        const { data } = await api.get("/api/products/main-category/89/recommended", {
          signal: c.signal,
        });
        const rows = Array.isArray(data) ? data : data ? [data] : [];
        const mapped = rows
          .filter((p) => p && typeof (p as any).id === "number" && typeof (p as any).name === "string")
          .map((p) => {
            const imageUri = pickPtbProductImageUri(p);
            if (!imageUri) return null;
            const { sellingPrice, mrpPrice, discountPercentage } = pickPtbVariantPricing(p);
            const showMrp =
              mrpPrice != null &&
              sellingPrice != null &&
              Number.isFinite(mrpPrice) &&
              Number.isFinite(sellingPrice) &&
              mrpPrice > sellingPrice + 0.009;
            return {
              id: String((p as any).id),
              name: safePtbText(String((p as any).name ?? "")),
              price:
                sellingPrice != null && Number.isFinite(sellingPrice)
                  ? `Rs ${Math.round(sellingPrice)}`
                  : mrpPrice != null && Number.isFinite(mrpPrice)
                  ? `Rs ${Math.round(mrpPrice)}`
                  : "View product",
              ...(showMrp ? { mrp: `Rs ${Math.round(mrpPrice as number)}` } : {}),
              ...(discountPercentage != null && Number.isFinite(discountPercentage)
                ? {
                    badge: `${Number(discountPercentage)
                      .toFixed(1)
                      .replace(/\.0$/, "")}% OFF`,
                  }
                : {}),
              image: { uri: imageUri },
            } satisfies TrendingProduct;
          })
          .filter((row): row is TrendingProduct => row != null)
          .slice(0, 4);
        setRecommendedForYouApiProducts(mapped);
      } catch {
        setRecommendedForYouApiProducts([]);
      }
    })();
    return () => c.abort();
  }, []);

  const handleToggleGiftsPtbWishlist = React.useCallback(
    async (product: {
      id: string;
      name: string;
      sellingNum: number;
      mrpNum: number;
      variantId?: number;
    }) => {
      const r = await togglePtbWishlistWithServer(product, reloadGiftsWishlistIds);
      if (!r.ok) Alert.alert("Wishlist", "message" in r ? r.message : "Could not update wishlist.");
      else Alert.alert(r.title, r.body);
    },
    [reloadGiftsWishlistIds]
  );

  const handleAddGiftsPtbCart = React.useCallback(
    async (product: {
      id: string;
      name: string;
      sellingNum: number;
      mrpNum: number;
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
          price: product.sellingNum,
          mrp: product.mrpNum,
        },
      });
      if (!r.ok) {
        Alert.alert("Cart", "message" in r ? r.message : "Could not add to cart.");
        return;
      }
      setGiftsCartCount(await getCartUnitCount());
      Alert.alert("Added to cart", product.name);
    },
    []
  );

  const goGiftsPtbShop = React.useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        subCategory: "Products to buy",
        mainCategoryId: String(giftsMainCategoryIdForPtb),
      },
    } as any);
  }, [giftsMainCategoryIdForPtb, router]);

  const goRecommendedForYouShop = React.useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "gifts",
        subCategory: "Recommended For You",
        mainCategoryId: "89",
        mainCategoryFeed: "recommended",
        mainCategoryPath: "/api/products/main-category/89/recommended",
      },
    } as any);
  }, [router]);

  const giftsPtbUiRows = React.useMemo(() => {
    const fmtRs = (n: number | null) =>
      n != null && Number.isFinite(n) ? `Rs ${Math.round(n)}` : "";
    if (giftsPtbApi.length === 0) {
      return [] as {
        id: string;
        name: string;
        imageSource: ImageSourcePropType;
        sellingLabel: string;
        mrpLabel: string;
        showMrp: boolean;
        discountLabel: string;
        ratingLabel: string;
        sellingNum: number;
        mrpNum: number;
        variantId?: number;
      }[];
    }
    return giftsPtbApi.map((p) => {
      const showMrp =
        p.mrpPrice != null &&
        p.sellingPrice != null &&
        p.mrpPrice > p.sellingPrice + 0.009;
      return {
        id: String(p.id),
        name: p.name,
        imageSource: { uri: p.imageUri } as ImageSourcePropType,
        sellingLabel: fmtRs(p.sellingPrice),
        mrpLabel: showMrp ? fmtRs(p.mrpPrice) : "",
        showMrp,
        discountLabel:
          p.discountPercentage != null && Number.isFinite(p.discountPercentage)
            ? `${Number(p.discountPercentage).toFixed(1).replace(/\.0$/, "")}% off`
            : "",
        ratingLabel:
          p.rating != null && Number.isFinite(p.rating) ? Number(p.rating).toFixed(1) : "—",
        sellingNum:
          p.sellingPrice != null && Number.isFinite(p.sellingPrice) ? Number(p.sellingPrice) : 0,
        mrpNum:
          p.mrpPrice != null && Number.isFinite(p.mrpPrice)
            ? Number(p.mrpPrice)
            : p.sellingPrice != null && Number.isFinite(p.sellingPrice)
            ? Number(p.sellingPrice)
            : 0,
        ...(p.variantId != null ? { variantId: p.variantId } : {}),
      };
    });
  }, [giftsPtbApi]);

  const giftsPtbUiRowPairs = React.useMemo(() => {
    const rows: Array<
      [
        (typeof giftsPtbUiRows)[number],
        ((typeof giftsPtbUiRows)[number] | undefined)
      ]
    > = [];
    for (let i = 0; i < giftsPtbUiRows.length; i += 2) {
      rows.push([giftsPtbUiRows[i], giftsPtbUiRows[i + 1]]);
    }
    return rows;
  }, [giftsPtbUiRows]);

  const recommendedForYouRowProducts = React.useMemo(() => {
    if (recommendedForYouApiProducts.length > 0) return recommendedForYouApiProducts;
    return RECOMMENDED_FOR_YOU_PRODUCTS.slice(0, 4);
  }, [recommendedForYouApiProducts]);

  const activeHero = React.useMemo(() => {
    if (selectedCategoryId && GIFT_CATEGORY_HERO[selectedCategoryId]) {
      return GIFT_CATEGORY_HERO[selectedCategoryId];
    }
    return DEFAULT_GIFT_HERO;
  }, [selectedCategoryId]);

  const atGiftsRoot = selectedCategoryId === null;

  const renderTrendingProductRow = (sectionTitle: string, products: TrendingProduct[]) => {
    const normalizedSectionTitle = sectionTitle.trim().toLowerCase();
    const isTrendingGiftsSection = normalizedSectionTitle === "trending gifts";
    const isRecentlyViewedSection = normalizedSectionTitle === "recently viewed";
    const isRecommendedSection = normalizedSectionTitle === "recommended for you";
    const openRowListing = isTrendingGiftsSection || isRecentlyViewedSection
      ? goGiftsPtbShop
      : isRecommendedSection
      ? goRecommendedForYouShop
      : () =>
          router.push({
            pathname: "/subcatProducts",
            params: homelyHubSubcatNavigatorParams(sectionTitle, sectionTitle),
          } as any);
    return (
    <View style={styles.homeProductRowBlock}>
      <View style={styles.homeRowHeader}>
        <View style={styles.homeRowTitleWrap}>
          <Text style={styles.homeRowTitle}>{sectionTitle}</Text>
          <View style={styles.homeRowAccentDot} />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={10}
          style={styles.homeRowSeeAllBtn}
          onPress={openRowListing}
        >
          <Text style={styles.homeRowSeeAll}>See all</Text>
          <Ionicons name="chevron-forward" size={16} color="#ea580c" />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingRow}
      >
        {products.map((item) => {
          const rating = (4.2 + (item.id.length % 8) / 10).toFixed(1);
          const reviews = 320 + (item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9800);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.trendingProductCard}
              activeOpacity={0.9}
              onPress={
                isTrendingGiftsSection || isRecentlyViewedSection
                  ? goGiftsPtbShop
                  : isRecommendedSection
                  ? () => {
                      const pid = Number.parseInt(String(item.id), 10);
                      if (!Number.isFinite(pid) || pid <= 0) return;
                      router.push({
                        pathname: "/productdetail",
                        params: { id: String(pid) },
                      } as any);
                    }
                  : () =>
                      router.push({
                        pathname: "/subcatProducts",
                        params: homelyHubSubcatNavigatorParams(item.name, item.id),
                      } as any)
              }
            >
              <View style={styles.trendingProductImageWrap}>
                <Image source={item.image} style={styles.trendingProductImage} resizeMode="cover" />
                {item.badge ? (
                  <View style={styles.trendingProductBadge}>
                    <Text style={styles.trendingProductBadgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <TouchableOpacity style={styles.productWishlistHit} activeOpacity={0.85}>
                  <View style={styles.productWishlistBubble}>
                    <Ionicons name="heart-outline" size={17} color="#b91c1c" />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.trendingProductMeta}>
                <Text style={styles.trendingProductName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.trendingProductPriceRow}>
                  <Text style={styles.trendingProductPrice}>{item.price}</Text>
                  {item.mrp ? <Text style={styles.trendingProductMrp}>{item.mrp}</Text> : null}
                </View>
                <View style={styles.productRatingRow}>
                  <Ionicons name="star" size={13} color="#f59e0b" />
                  <Text style={styles.productRatingValue}>{rating}</Text>
                  <Text style={styles.productRatingCount}>({reviews >= 1000 ? `${(reviews / 1000).toFixed(1)}k` : reviews})</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={
          isCorporateView
            ? (["#F4F6FC", "#E8EDF8", "#DDE5F5", "#F1F4FB"] as const)
            : isEventBasedView
              ? (["#FFFCFA", "#FFF5F3", "#FFEBEE", "#FFF7EF"] as const)
              : (["#FFFBF7", "#FFF2E6", "#FFE8D4", "#FFF0E5"] as const)
        }
        locations={[0, 0.38, 0.7, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={styles.screenBgGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["#fffefb", "#faf7f3", "#f5f1eb"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.giftsStickyHeader, { paddingTop: insets.top + 8 }]}
      >
        <LinearGradient
          colors={["transparent", hexToRgba("#ef7b1a", 0.07), "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.giftsHeaderAccentWash}
          pointerEvents="none"
        />
        <View style={styles.giftsHeaderRow}>
          {atGiftsRoot ? (
            <TouchableOpacity
              style={styles.giftsLogoHit}
              onPress={() => router.replace("/home")}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Home"
            >
              <View style={styles.giftsLogoTile}>
                <Image
                  source={HEADER_FT_LOGO}
                  style={styles.giftsLogoImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.giftsLogoHit}
              onPress={() => {
                if (
                  isArtCreativeView ||
                  isCorporateView ||
                  isEventBasedView ||
                  isUtilityView ||
                  isCoupleView ||
                  isHomelyHubExtendedView
                ) {
                  setSelectedCategoryId(null);
                  return;
                }
                router.back();
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <View style={styles.giftsLogoTile}>
                <Image
                  source={HEADER_FT_LOGO}
                  style={styles.giftsLogoImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.giftsSearchPill}>
            <TouchableOpacity
              style={styles.giftsSearchMain}
              onPress={() => {
                if (searchQuery.trim()) {
                  router.push({ pathname: "/searchresults", params: { q: searchQuery } });
                }
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={19} color="#64748b" />
              <Text style={styles.giftsSearchPlaceholder}>Search..</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/camerasearch")}
              style={styles.giftsSearchCameraBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Search by photo"
            >
              <Ionicons name="camera-outline" size={22} color="#64748b" />
            </TouchableOpacity>
            {showSearchResults && (
              <View style={styles.searchResultsOverlay}>
                <View style={styles.searchResultsContainer}>
                  {searchLoading ? (
                    <Text style={styles.searchLoadingText}>Loading...</Text>
                  ) : (
                    <>
                      {searchResults.slice(0, 3).map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.searchResultItem}
                          onPress={() => router.push({ pathname: "/searchresults", params: { q: item.name } })}
                        >
                          <Text style={styles.searchResultText}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.searchCloseButton}
                  onPress={() => setShowSearchResults(false)}
                >
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.giftsHeaderIconGroup}>
            <TouchableOpacity
              style={styles.giftsHeaderIconHit}
              onPress={() => router.push("/wishlist")}
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
            >
              <View style={styles.giftsHeaderIconBadgeWrap}>
                <Ionicons name="heart-outline" size={24} color="#c2410c" />
                {(giftsWishlistHasAuth ? giftsWishlistServerKeys.size : giftsWishlistIds.size) >
                0 ? (
                  <View style={styles.giftsHeaderIconBadge}>
                    <Text style={styles.giftsHeaderIconBadgeText}>
                      {(giftsWishlistHasAuth ? giftsWishlistServerKeys.size : giftsWishlistIds.size) >
                      99
                        ? "99+"
                        : String(
                            giftsWishlistHasAuth
                              ? giftsWishlistServerKeys.size
                              : giftsWishlistIds.size
                          )}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.giftsHeaderIconHit}
              onPress={() => router.push("/cart")}
              accessibilityRole="button"
              accessibilityLabel="Cart"
            >
              <View style={styles.giftsHeaderIconBadgeWrap}>
                <Ionicons name="cart-outline" size={24} color="#c2410c" />
                {giftsCartCount > 0 ? (
                  <View style={styles.giftsHeaderIconBadge}>
                    <Text style={styles.giftsHeaderIconBadgeText}>
                      {giftsCartCount > 99 ? "99+" : String(giftsCartCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.giftsHeaderIconHit}
              onPress={() => router.push("/notifications")}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={24} color="#c2410c" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main categories — warm card (cool indigo when Corporate is active) */}
        <View
          style={[
            styles.shopByCategorySection,
            isCorporateView && styles.shopByCategorySectionCorporate,
            isEventBasedView && styles.shopByCategorySectionEvent,
          ]}
        >
          <LinearGradient
            colors={
              isCorporateView
                ? (["#FFFFFF", "#E8EDFC"] as const)
                : isEventBasedView
                  ? (["#FFFFFF", "#FFE8EC"] as const)
                  : (["#FFFFFF", "#FFEFDC"] as const)
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.shopByCategoryBanner,
              isCorporateView && styles.shopByCategoryBannerCorporate,
              isEventBasedView && styles.shopByCategoryBannerEvent,
            ]}
          >
            <View style={styles.shopByCategoryBannerRow}>
              <View
                style={[
                  styles.shopByCategoryIconWrap,
                  isCorporateView && styles.shopByCategoryIconWrapCorporate,
                  isEventBasedView && styles.shopByCategoryIconWrapEvent,
                ]}
              >
                <Ionicons
                  name={
                    isCorporateView
                      ? "briefcase-outline"
                      : isEventBasedView
                        ? "sparkles"
                        : "gift"
                  }
                  size={22}
                  color={
                    isCorporateView ? "#4338ca" : isEventBasedView ? "#be123c" : "#c2410c"
                  }
                />
              </View>
              <View style={styles.shopByCategoryBannerText}>
                <Text
                  style={[
                    styles.shopByCategoryEyebrow,
                    isCorporateView && styles.shopByCategoryEyebrowCorporate,
                    isEventBasedView && styles.shopByCategoryEyebrowEvent,
                  ]}
                >
                  {isCorporateView
                    ? "B2B & TEAMS"
                    : isEventBasedView
                      ? "CELEBRATIONS"
                      : "FIND YOUR PERFECT GIFT"}
                </Text>
                <Text style={styles.shopByCategoryTitle}>Shop by Category</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCircleRow}
          >
            {giftApiLoading ? (
              <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                <ActivityIndicator size="small" color="#ef7b1a" />
              </View>
            ) : null}

            {!giftApiLoading && giftApiError ? (
              <View style={{ paddingHorizontal: 10, paddingVertical: 8, maxWidth: 260 }}>
                <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }} numberOfLines={2}>
                  {giftApiError}
                </Text>
              </View>
            ) : null}

            {giftCategoriesForUi.map((category) => {
              const isSelected = selectedCategoryId === category.id;
              const circleColors: readonly [string, string] =
                isCorporateView && category.id === "gc2"
                  ? ["#C7D2FE", "#FFFFFF"]
                  : isEventBasedView && category.id === "gc3"
                    ? ["#FECDD3", "#FFFBFB"]
                    : [category.bg, "#FFFFFF"];
              return (
                <TouchableOpacity
                  key={`circle-${category.id}`}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCategoryId(category.id)}
                  style={styles.categoryCircleItem}
                >
                  <LinearGradient
                    colors={circleColors as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.categoryCircle,
                      isSelected &&
                        (isCorporateView
                          ? styles.categoryCircleSelectedCorporate
                          : isEventBasedView
                            ? styles.categoryCircleSelectedEvent
                            : styles.categoryCircleSelected),
                    ]}
                  >
                    {category.circleImage ? (
                      <Image
                        source={category.circleImage}
                        style={styles.categoryCircleImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.categoryCircleEmoji}>{category.emoji}</Text>
                    )}
                  </LinearGradient>
                  <Text
                    style={[
                      styles.categoryCircleLabel,
                      isSelected &&
                        (isCorporateView
                          ? styles.categoryCircleLabelSelectedCorporate
                          : isEventBasedView
                            ? styles.categoryCircleLabelSelectedEvent
                            : styles.categoryCircleLabelSelected),
                    ]}
                    numberOfLines={2}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Hero below categories — full-width spotlight */}
        <TouchableOpacity activeOpacity={0.92} style={styles.heroBannerOuter}>
          <ImageBackground
            key={`hero-bg-${selectedCategoryId ?? "default"}`}
            source={activeHero.image}
            style={styles.heroBanner}
            imageStyle={styles.heroBannerImageBg}
            resizeMode="cover"
          />
          {selectedCategoryId ? (
            <LinearGradient
              colors={["transparent", "rgba(15,23,42,0.82)"]}
              start={{ x: 0.5, y: 0.35 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.heroCategoryTagGradient}
              pointerEvents="none"
            >
              <Text style={styles.heroCategoryTagEyebrow}>CATEGORY SPOTLIGHT</Text>
              <Text style={styles.heroCategoryTagTitle} numberOfLines={2}>
                {giftCategoriesForUi.find((c) => c.id === selectedCategoryId)?.title ?? "Gifts"}
              </Text>
            </LinearGradient>
          ) : null}
        </TouchableOpacity>

        {selectedCategoryId ? (
          <View style={styles.bannerToCollectionsBridge}>
            <View
              style={[
                styles.bannerToCollectionsLine,
                isCorporateView && styles.bannerToCollectionsLineCorporate,
                isEventBasedView && styles.bannerToCollectionsLineEvent,
              ]}
            />
            <View
              style={[
                styles.bannerToCollectionsPill,
                isCorporateView && styles.bannerToCollectionsPillCorporate,
                isEventBasedView && styles.bannerToCollectionsPillEvent,
              ]}
            >
              <Ionicons
                name="albums-outline"
                size={15}
                color={
                  isCorporateView ? "#4338ca" : isEventBasedView ? "#be123c" : "#c2410c"
                }
              />
              <Text
                style={[
                  styles.bannerToCollectionsText,
                  isCorporateView && styles.bannerToCollectionsTextCorporate,
                  isEventBasedView && styles.bannerToCollectionsTextEvent,
                ]}
              >
                SHOP COLLECTIONS
              </Text>
            </View>
            <View
              style={[
                styles.bannerToCollectionsLine,
                isCorporateView && styles.bannerToCollectionsLineCorporate,
                isEventBasedView && styles.bannerToCollectionsLineEvent,
              ]}
            />
          </View>
        ) : null}

        {isArtCreativeView ? (
          <View style={[styles.subCategorySection, styles.subCategoryShelfArt]}>
            <View style={styles.subCategorySectionHeader}>
              <LinearGradient
                colors={["#1d324e", "#2d4a6f"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.subCategorySectionAccent}
              />
              <View style={styles.subCategorySectionHeaderText}>
                <View style={styles.artHeadTopRow}>
                  <Text style={styles.subCategorySectionEyebrow}>ART & CREATIVE</Text>
                  <View style={styles.artHeadPill}>
                    <Ionicons name="sparkles" size={12} color="#0f172a" />
                    <Text style={styles.artHeadPillText}>
                      {artTable?.subcategories?.length
                        ? `${artTable.subcategories.length} styles`
                        : "Curated"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.artHeadTitle}>Pick a style to personalize</Text>
                <Text style={styles.artHeadSub}>
                  Full-image previews · Tap a tile to browse products
                </Text>
              </View>
            </View>

            {artTableLoading ? (
              <View style={{ paddingVertical: 14, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#ef7b1a" />
              </View>
            ) : null}

            {!artTableLoading && artTableError ? (
              <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12, marginBottom: 8 }}>
                {artTableError}
              </Text>
            ) : null}

            <View style={styles.artList}>
              {(artTable?.subcategories?.length
                ? artTable.subcategories.map((s) => ({
                    id: String(s.id),
                    title: s.name,
                    imageUri: s.mobileImage
                      ? s.mobileImage
                      : s.image
                        ? getUploadsImageUriFromFilename(s.image)
                        : null,
                  }))
                : ART_SUB_CATEGORIES.map((s: any) => ({
                    id: String(s.id),
                    title: s.title,
                    imageUri: null,
                  }))
              ).map((item: any, idx: number) => {
                const reversed = idx % 2 === 1;
                return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.artRowCard, reversed && styles.artRowCardReverse]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title, item.id),
                    })
                  }
                >
                  <View style={[styles.artRowLeft, reversed && styles.artRowLeftReverse]}>
                    <Text
                      style={[styles.artRowTitle, reversed && styles.artRowTitleReverse]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.artRowSub, reversed && styles.artRowSubReverse]}
                    >
                      Tap to explore
                    </Text>
                    <View style={[styles.artRowAction, reversed && styles.artRowActionReverse]}>
                      <Ionicons name="chevron-down" size={18} color="#111827" />
                    </View>
                  </View>

                  <View
                    style={[styles.artRowSlash, reversed && styles.artRowSlashReverse]}
                    pointerEvents="none"
                  />

                  <View style={styles.artRowRight}>
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.artRowImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.artRowImageFallback}>
                        <Ionicons name="color-palette-outline" size={22} color="#64748b" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
              })}
            </View>

          </View>
        ) : isCorporateView ? (
          <View style={[styles.subCategorySection, styles.subCategoryShelfCorporate]}>
            <View style={styles.subCategorySectionHeader}>
              <LinearGradient
                colors={["#312e81", "#6366f1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.subCategorySectionAccent}
              />
              <View style={styles.subCategorySectionHeaderText}>
                <Text style={styles.subCategorySectionEyebrow}>CORPORATE & B2B</Text>
                <Text style={styles.subCategorySectionTitle}>Shop by collection</Text>
                <Text style={styles.subCategorySectionHint}>
                  Hero above shows your category · Here = product-style tiles for teams & clients
                </Text>
              </View>
            </View>

            <View style={styles.corpGrid}>
              {corporateTableLoading ? (
                <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                  <ActivityIndicator size="small" color="#4f46e5" />
                </View>
              ) : null}

              {!corporateTableLoading && corporateTableError ? (
                <Text
                  style={{
                    color: "#b91c1c",
                    fontWeight: "700",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {corporateTableError}
                </Text>
              ) : null}

              {(corporateTable?.subcategories?.length
                ? corporateTable.subcategories.map((s) => ({
                    id: String(s.id),
                    title: s.name,
                    image: s.mobileImage
                      ? ({ uri: s.mobileImage } as any)
                      : s.image
                        ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
                        : undefined,
                  }))
                : CORPORATE_SUB_CATEGORIES
              ).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.corpCard, styles.corpCardShelf]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title, item.id),
                    } as any)
                  }
                >
                  <View style={styles.corpImageWrap}>
                    {item.image ? (
                      <Image source={item.image} style={styles.corpImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.corpImage, { backgroundColor: "#E2E8F0" }]} />
                    )}
                    <View style={styles.corpImageScrim} />
                  </View>
                  <View style={styles.corpLabelRow}>
                    <Text style={styles.corpLabel} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        ) : isEventBasedView ? (
          <View style={[styles.subCategorySection, styles.subCategoryShelfEvent]}>
            <View style={styles.subCategorySectionHeader}>
              <LinearGradient
                colors={["#991b1b", "#dc2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.subCategorySectionAccent}
              />
              <View style={styles.subCategorySectionHeaderText}>
                <Text style={styles.subCategorySectionEyebrow}>EVENTS & MILESTONES</Text>
                <Text style={styles.subCategorySectionTitle}>Occasions & offers</Text>
                <Text style={styles.subCategorySectionHint}>
                  Promos + circles below are collections · Hero above sets the mood
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.eventBanner} activeOpacity={0.9}>
              <Image
                source={require("../assets/homelyhub/EventBasedGifts.png")}
                style={styles.eventBannerImage}
                resizeMode="cover"
              />
              <View style={styles.eventBannerOverlay} />
              <View style={styles.eventBannerContent}>
                <Text style={styles.eventBannerEyebrow}>EVENTS & CELEBRATIONS</Text>
                <Text style={styles.eventBannerTitle}>Gifts for Every Occasion</Text>
                <Text style={styles.eventBannerSubTitle}>
                  Birthdays, weddings, anniversaries & hampers
                </Text>
                <View style={styles.eventBannerCta}>
                  <Text style={styles.eventBannerCtaText}>Shop Now</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.eventBanner2} activeOpacity={0.9}>
              <Image
                source={require("../assets/homelyhub/EventBasedGifts.png")}
                style={styles.eventBanner2Image}
                resizeMode="cover"
              />
              <View style={styles.eventBanner2Overlay} />
              <View style={styles.eventBanner2Content}>
                <Text style={styles.eventBanner2Eyebrow}>LIMITED TIME OFFER</Text>
                <Text style={styles.eventBanner2Title}>50% Off Selected Items</Text>
                <Text style={styles.eventBanner2SubTitle}>Don{"'"}t miss out on amazing deals</Text>
                <View style={styles.eventBanner2Cta}>
                  <Text style={styles.eventBanner2CtaText}>Shop Now</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.eventCircleContainer}>
              {eventTableLoading ? (
                <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                  <ActivityIndicator size="small" color="#dc2626" />
                </View>
              ) : null}

              {!eventTableLoading && eventTableError ? (
                <Text
                  style={{
                    color: "#b91c1c",
                    fontWeight: "700",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {eventTableError}
                </Text>
              ) : null}

              {(eventTable?.subcategories?.length
                ? eventTable.subcategories.map((s) => ({
                    id: String(s.id),
                    title: s.name,
                    emoji: "🎁",
                    bg: "#FFE4E6",
                    image: s.mobileImage
                      ? ({ uri: s.mobileImage } as any)
                      : s.image
                        ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
                        : undefined,
                  }))
                : EVENT_SUB_CATEGORIES
              ).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.eventCircle,
                    styles.eventCircleShelf,
                    !item.image && { backgroundColor: item.bg },
                    item.image && styles.eventCircleWithImage,
                  ]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title, item.id),
                    } as any)
                  }
                >
                  {item.image ? (
                    <ImageBackground
                      source={item.image}
                      style={styles.eventCircleImageBg}
                      imageStyle={styles.eventCircleImageRadius}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={["transparent", "rgba(15,23,42,0.2)", "rgba(15,23,42,0.78)"]}
                        locations={[0, 0.45, 1]}
                        style={styles.eventCircleImageGradient}
                        pointerEvents="none"
                      />
                      <Text style={styles.eventCircleEmojiBadge}>{item.emoji}</Text>
                      <View style={styles.eventCircleImageFooter}>
                        <Text style={styles.eventCircleTitleOnImage} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>
                    </ImageBackground>
                  ) : (
                    <>
                      <Text style={styles.eventEmoji}>{item.emoji}</Text>
                      <Text style={styles.eventCircleTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

          </View>
        ) : isUtilityView ? (
          <View style={[styles.subCategorySection, styles.subCategoryShelfUtility]}>
            <View style={styles.subCategorySectionHeader}>
              <LinearGradient
                colors={["#047857", "#10b981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.subCategorySectionAccent}
              />
              <View style={styles.subCategorySectionHeaderText}>
                <Text style={styles.subCategorySectionEyebrow}>EVERYDAY UTILITY</Text>
                <Text style={styles.subCategorySectionTitle}>Useful gifts grid</Text>
                <Text style={styles.subCategorySectionHint}>
                  Bold cards = quick SKUs · Use banner for seasonal story
                </Text>
              </View>
            </View>

            <View style={styles.utilityGrid}>
              {utilityTableLoading ? (
                <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              ) : null}

              {!utilityTableLoading && utilityTableError ? (
                <Text
                  style={{
                    color: "#b91c1c",
                    fontWeight: "700",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {utilityTableError}
                </Text>
              ) : null}

              {(utilityTable?.subcategories?.length
                ? utilityTable.subcategories.map((s) => ({
                    id: String(s.id),
                    title: s.name,
                    imageUri: s.mobileImage
                      ? s.mobileImage
                      : s.image
                        ? getUploadsImageUriFromFilename(s.image)
                        : null,
                    bg: "#ECFDF5",
                    icon: "🎁",
                  }))
                : UTILITY_SUB_CATEGORIES
              ).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.utilityCard,
                    styles.utilityCardShelf,
                    styles.utilityEverydayCard,
                    { backgroundColor: item.bg ?? "#FFFFFF" },
                  ]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title, item.id),
                    } as any)
                  }
                >
                  <View style={styles.utilityEverydayCardInner}>
                    <View style={styles.utilityEverydayImageBlock}>
                      {item.imageUri ? (
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.utilityEverydayImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.utilityEverydayImagePlaceholder}>
                          <Text style={styles.utilityEverydayEmoji}>{item.icon}</Text>
                        </View>
                      )}
                    </View>
                    <LinearGradient
                      colors={["#064e3b", "#059669", "#34d399"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.utilityEverydayFooter}
                    >
                      <Text style={styles.utilityEverydayTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.utilityEverydayFooterRow}>
                        <Text style={styles.utilityEverydaySub}>Browse picks</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={15}
                          color="rgba(255,255,255,0.92)"
                        />
                      </View>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        ) : isCoupleView ? (
          <View style={[styles.subCategorySection, styles.subCategoryShelfCouple]}>
            <View style={styles.subCategorySectionHeader}>
              <LinearGradient
                colors={["#9d174d", "#ec4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.subCategorySectionAccent}
              />
              <View style={styles.subCategorySectionHeaderText}>
                <Text style={styles.subCategorySectionEyebrow}>COUPLE & ROMANCE</Text>
                <Text style={styles.subCategorySectionTitle}>Moments for two</Text>
                <Text style={styles.subCategorySectionHint}>
                  In-hero story + shelf cards · Same pattern as other categories
                </Text>
              </View>
            </View>

            <View style={styles.coupleContainer}>
              {couplesTableLoading ? (
                <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                  <ActivityIndicator size="small" color="#ec4899" />
                </View>
              ) : null}

              {!couplesTableLoading && couplesTableError ? (
                <Text
                  style={{
                    color: "#b91c1c",
                    fontWeight: "700",
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  {couplesTableError}
                </Text>
              ) : null}

              {(couplesTable?.subcategories?.length
                ? couplesTable.subcategories.map((s) => ({
                    id: String(s.id),
                    title: s.name,
                    imageUri: s.mobileImage
                      ? s.mobileImage
                      : s.image
                        ? getUploadsImageUriFromFilename(s.image)
                        : null,
                  }))
                : COUPLE_SUB_CATEGORIES.map((it) => ({
                    id: it.id,
                    title: it.title,
                    imageUri: null,
                    emoji: it.emoji,
                    bg: it.bg,
                  }))
              ).map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.coupleCard,
                    styles.coupleCardShelf,
                    styles.coupleRomanceCard,
                    { backgroundColor: item.bg ?? "#FCE7F3" },
                  ]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title, item.id),
                    } as any)
                  }
                >
                  <View style={styles.coupleRomanceCardInner}>
                    <View style={styles.coupleRomanceImageBlock}>
                      {item.imageUri ? (
                        <Image
                          source={{ uri: item.imageUri }}
                          style={styles.coupleRomanceImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.coupleRomanceImagePlaceholder}>
                          <Text style={styles.coupleRomanceEmoji}>{item.emoji ?? "💞"}</Text>
                        </View>
                      )}
                    </View>
                    <LinearGradient
                      colors={["#831843", "#be185d", "#ec4899"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.coupleRomanceFooter}
                    >
                      <Text style={styles.coupleRomanceTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.coupleRomanceFooterRow}>
                        <Text style={styles.coupleRomanceSub}>For two</Text>
                        <Ionicons
                          name="heart"
                          size={14}
                          color="rgba(255,255,255,0.92)"
                        />
                      </View>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Occasion Ideas</Text>
            </View>

            <View style={styles.occasionGrid}>
              {[
                { id: "oc1", title: "Anniversary", icon: "💍", bg: "#FDF2F8" },
                { id: "oc2", title: "Birthday", icon: "🎂", bg: "#FFF7ED" },
                { id: "oc3", title: "Date Night", icon: "🌙", bg: "#EEF2FF" },
                { id: "oc4", title: "Surprise", icon: "🎁", bg: "#ECFDF5" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.occasionCard, { backgroundColor: item.bg }]}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title),
                    } as any)
                  }
                >
                  <View style={styles.occasionIconWrap}>
                    <Text style={styles.occasionIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.occasionTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Picks</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPicksRow}
            >
              {[
                { id: "qp1", title: "Under $20", icon: "💸" },
                { id: "qp2", title: "Same Day", icon: "⚡" },
                { id: "qp3", title: "Handmade", icon: "🧵" },
                { id: "qp4", title: "Personalized", icon: "🖊️" },
                { id: "qp5", title: "Luxury", icon: "👑" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickPickChip}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: homelyHubSubcatNavigatorParams(item.title),
                    } as any)
                  }
                >
                  <Text style={styles.quickPickIcon}>{item.icon}</Text>
                  <Text style={styles.quickPickText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : isHomelyHubExtendedView ? (
          <View style={[styles.subCategorySection, styles.subCategoryShelfUtility]}>
            <View style={styles.subCategorySectionHeader}>
              <LinearGradient
                colors={["#b45309", "#d97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.subCategorySectionAccent}
              />
              <View style={styles.subCategorySectionHeaderText}>
                <Text style={styles.subCategorySectionEyebrow}>HOMELY HUB</Text>
                <Text style={styles.subCategorySectionTitle}>
                  {GIFT_CATEGORIES.find((c) => c.id === selectedCategoryId)?.title ?? "Gifts"}
                </Text>
                <Text style={styles.subCategorySectionHint}>
                  Tap a collection below — curated picks for this theme
                </Text>
              </View>
            </View>

            <View style={styles.utilityGrid}>
              {selectedCategoryId === "gc6" ? (
                <>
                  {homeDecorTableLoading ? (
                    <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                      <ActivityIndicator size="small" color="#b45309" />
                    </View>
                  ) : null}

                  {!homeDecorTableLoading && homeDecorTableError ? (
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontWeight: "700",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      {homeDecorTableError}
                    </Text>
                  ) : null}

                  {(homeDecorTable?.subcategories?.length
                    ? homeDecorTable.subcategories.map((s) => ({
                        id: String(s.id),
                        title: s.name,
                        imageUri: s.mobileImage
                          ? s.mobileImage
                          : s.image
                            ? getUploadsImageUriFromFilename(s.image)
                            : null,
                      }))
                    : (HOMELY_HUB_GIFT_SUBS[selectedCategoryId] ?? []).map((it) => ({
                        id: it.id,
                        title: it.title,
                        imageUri: null,
                        icon: it.icon,
                        bg: it.bg,
                      }))
                  ).map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.utilityCard,
                        styles.utilityCardShelf,
                        styles.homeDecorGiftCard,
                        styles.homeDecorGiftCardShelf,
                        { backgroundColor: item.bg ?? "#FFFFFF" },
                      ]}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/subcatProducts",
                          params: homelyHubSubcatNavigatorParams(item.title, item.id),
                        } as any)
                      }
                    >
                      <View style={styles.homeDecorGiftCardInner}>
                        <View style={styles.homeDecorGiftImageBlock}>
                          {item.imageUri ? (
                            <Image
                              source={{ uri: item.imageUri }}
                              style={styles.homeDecorGiftImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.homeDecorGiftImagePlaceholder}>
                              <Text style={styles.homeDecorGiftEmoji}>
                                {item.icon ?? "🛋️"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <LinearGradient
                          colors={["#713f12", "#b45309", "#f59e0b"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.homeDecorGiftFooter}
                        >
                          <Text style={styles.homeDecorGiftTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={styles.homeDecorGiftFooterRow}>
                            <Text style={styles.homeDecorGiftSub}>Décor picks</Text>
                            <Ionicons
                              name="home-outline"
                              size={15}
                              color="rgba(255,255,255,0.92)"
                            />
                          </View>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : selectedCategoryId === "gc7" ? (
                <>
                  {kidsBabyTableLoading ? (
                    <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                      <ActivityIndicator size="small" color="#b45309" />
                    </View>
                  ) : null}

                  {!kidsBabyTableLoading && kidsBabyTableError ? (
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontWeight: "700",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      {kidsBabyTableError}
                    </Text>
                  ) : null}

                  {(kidsBabyTable?.subcategories?.length
                    ? kidsBabyTable.subcategories.map((s) => ({
                        id: String(s.id),
                        title: s.name,
                        imageUri: s.mobileImage
                          ? s.mobileImage
                          : s.image
                            ? getUploadsImageUriFromFilename(s.image)
                            : null,
                      }))
                    : (HOMELY_HUB_GIFT_SUBS[selectedCategoryId] ?? []).map((it) => ({
                        id: it.id,
                        title: it.title,
                        imageUri: null,
                        icon: it.icon,
                        bg: it.bg,
                      }))
                  ).map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.utilityCard,
                        styles.utilityCardShelf,
                        styles.kidsBabyGiftCard,
                        styles.kidsBabyGiftCardShelf,
                        { backgroundColor: item.bg ?? "#FFFFFF" },
                      ]}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/subcatProducts",
                          params: homelyHubSubcatNavigatorParams(item.title, item.id),
                        } as any)
                      }
                    >
                      <View style={styles.kidsBabyGiftCardInner}>
                        <View style={styles.kidsBabyGiftImageBlock}>
                          {item.imageUri ? (
                            <Image
                              source={{ uri: item.imageUri }}
                              style={styles.kidsBabyGiftImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.kidsBabyGiftImagePlaceholder}>
                              <Text style={styles.kidsBabyGiftEmoji}>
                                {item.icon ?? "👶"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <LinearGradient
                          colors={["#5b21b6", "#7c3aed", "#ec4899"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.kidsBabyGiftFooter}
                        >
                          <Text style={styles.kidsBabyGiftTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={styles.kidsBabyGiftFooterRow}>
                            <Text style={styles.kidsBabyGiftSub}>Little gifts</Text>
                            <Ionicons
                              name="balloon-outline"
                              size={15}
                              color="rgba(255,255,255,0.92)"
                            />
                          </View>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : selectedCategoryId === "gc8" ? (
                <>
                  {spiritualTableLoading ? (
                    <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                      <ActivityIndicator size="small" color="#b45309" />
                    </View>
                  ) : null}

                  {!spiritualTableLoading && spiritualTableError ? (
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontWeight: "700",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      {spiritualTableError}
                    </Text>
                  ) : null}

                  {(spiritualTable?.subcategories?.length
                    ? spiritualTable.subcategories.map((s) => ({
                        id: String(s.id),
                        title: s.name,
                        imageUri: s.mobileImage
                          ? s.mobileImage
                          : s.image
                            ? getUploadsImageUriFromFilename(s.image)
                            : null,
                      }))
                    : (HOMELY_HUB_GIFT_SUBS[selectedCategoryId] ?? []).map((it) => ({
                        id: it.id,
                        title: it.title,
                        imageUri: null,
                        icon: it.icon,
                        bg: it.bg,
                      }))
                  ).map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.utilityCard,
                        styles.utilityCardShelf,
                        styles.spiritualFestivalGiftCard,
                        styles.spiritualFestivalGiftCardShelf,
                        { backgroundColor: item.bg ?? "#FFFFFF" },
                      ]}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/subcatProducts",
                          params: homelyHubSubcatNavigatorParams(item.title, item.id),
                        } as any)
                      }
                    >
                      <View style={styles.spiritualFestivalGiftCardInner}>
                        <View style={styles.spiritualFestivalGiftImageBlock}>
                          {item.imageUri ? (
                            <Image
                              source={{ uri: item.imageUri }}
                              style={styles.spiritualFestivalGiftImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.spiritualFestivalGiftImagePlaceholder}>
                              <Text style={styles.spiritualFestivalGiftEmoji}>
                                {item.icon ?? "🪔"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <LinearGradient
                          colors={["#7c2d12", "#c2410c", "#f59e0b"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.spiritualFestivalGiftFooter}
                        >
                          <Text style={styles.spiritualFestivalGiftTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={styles.spiritualFestivalGiftFooterRow}>
                            <Text style={styles.spiritualFestivalGiftSub}>Blessed picks</Text>
                            <Ionicons
                              name="flame-outline"
                              size={15}
                              color="rgba(255,255,255,0.92)"
                            />
                          </View>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : selectedCategoryId === "gc9" ? (
                <>
                  {wearableTableLoading ? (
                    <View style={{ paddingVertical: 14, alignItems: "center", width: "100%" }}>
                      <ActivityIndicator size="small" color="#b45309" />
                    </View>
                  ) : null}

                  {!wearableTableLoading && wearableTableError ? (
                    <Text
                      style={{
                        color: "#b91c1c",
                        fontWeight: "700",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      {wearableTableError}
                    </Text>
                  ) : null}

                  {(wearableTable?.subcategories?.length
                    ? wearableTable.subcategories.map((s) => ({
                        id: String(s.id),
                        title: s.name,
                        imageUri: s.mobileImage
                          ? s.mobileImage
                          : s.image
                            ? getUploadsImageUriFromFilename(s.image)
                            : null,
                      }))
                    : (HOMELY_HUB_GIFT_SUBS[selectedCategoryId] ?? []).map((it) => ({
                        id: it.id,
                        title: it.title,
                        imageUri: null,
                        icon: it.icon,
                        bg: it.bg,
                      }))
                  ).map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.utilityCard,
                        styles.utilityCardShelf,
                        styles.wearablePersonalGiftCard,
                        styles.wearablePersonalGiftCardShelf,
                        { backgroundColor: item.bg ?? "#FFFFFF" },
                      ]}
                      activeOpacity={0.9}
                      onPress={() =>
                        router.push({
                          pathname: "/subcatProducts",
                          params: homelyHubSubcatNavigatorParams(item.title, item.id),
                        } as any)
                      }
                    >
                      <View style={styles.wearablePersonalGiftCardInner}>
                        <View style={styles.wearablePersonalGiftImageBlock}>
                          {item.imageUri ? (
                            <Image
                              source={{ uri: item.imageUri }}
                              style={styles.wearablePersonalGiftImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.wearablePersonalGiftImagePlaceholder}>
                              <Text style={styles.wearablePersonalGiftEmoji}>
                                {item.icon ?? "🎀"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <LinearGradient
                          colors={["#312e81", "#4f46e5", "#db2777"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.wearablePersonalGiftFooter}
                        >
                          <Text style={styles.wearablePersonalGiftTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <View style={styles.wearablePersonalGiftFooterRow}>
                            <Text style={styles.wearablePersonalGiftSub}>Style picks</Text>
                            <Ionicons
                              name="shirt-outline"
                              size={15}
                              color="rgba(255,255,255,0.92)"
                            />
                          </View>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                (selectedCategoryId
                  ? HOMELY_HUB_GIFT_SUBS[selectedCategoryId] ?? []
                  : []
                ).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.utilityCard,
                      styles.utilityCardShelf,
                      { backgroundColor: item.bg },
                    ]}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/subcatProducts",
                        params: homelyHubSubcatNavigatorParams(item.title, item.id),
                      } as any)
                    }
                  >
                    <View style={styles.utilityIconWrap}>
                      <Text style={styles.utilityIcon}>{item.icon}</Text>
                    </View>
                    <Text style={styles.utilityCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

          </View>
        ) : null}

        <View style={styles.giftDiscoverySection}>
          <View style={styles.giftDiscoveryHeader}>
            <Ionicons name="sparkles" size={18} color="#c2410c" />
            <Text style={styles.giftDiscoveryHeaderTitle}>More to explore</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.92}
            style={styles.middlePromoOuter}
            onPress={goGiftsPtbShop}
          >
            <View style={styles.middlePromoFlashRibbon}>
              <Ionicons name="flash" size={13} color="#FFFFFF" />
              <Text style={styles.middlePromoFlashRibbonText}>FLASH DEAL</Text>
            </View>
            <LinearGradient
              colors={["#fb923c", "#f97316", "#ea580c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.middlePromoGradient}
            >
              <View style={styles.middlePromoTextCol}>
                <Text style={styles.middlePromoEyebrow}>MID-SEASON SALE</Text>
                <Text style={styles.middlePromoTitle}>Up to 40% off gift hampers</Text>
                <Text style={styles.middlePromoSub}>Use code GIFTJOY at checkout · Ends soon</Text>
                <View style={styles.middlePromoCta}>
                  <Text style={styles.middlePromoCtaText}>Shop the sale</Text>
                  <Ionicons name="arrow-forward" size={16} color="#c2410c" />
                </View>
              </View>
              <Text style={styles.middlePromoEmoji}>🎁</Text>
            </LinearGradient>
          </TouchableOpacity>

          {renderTrendingProductRow("Trending gifts", TRENDING_GIFTS_AS_PRODUCTS.slice(0, 4))}
          {renderTrendingProductRow("Recommended For You", recommendedForYouRowProducts)}
          {renderTrendingProductRow("Recently Viewed", RECENTLY_VIEWED_PRODUCTS.slice(0, 4))}
        </View>

        <View style={styles.giftsPtbWrap}>
          <View style={styles.giftsPtbHeaderRow}>
            <Text style={styles.giftsPtbHeading}>Products to buy</Text>
            <TouchableOpacity onPress={goGiftsPtbShop} activeOpacity={0.85}>
              <Text style={styles.giftsPtbSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {routeGiftsMainCategoryId == null && resolvingGiftsMainCategoryId ? (
            <Text style={styles.giftsPtbStatus}>Matching store category…</Text>
          ) : null}
          {giftsPtbLoading && giftsPtbApi.length === 0 ? (
            <Text style={styles.giftsPtbStatus}>Loading products...</Text>
          ) : giftsPtbUiRows.length === 0 ? (
            <Text style={styles.giftsPtbStatus}>No products found.</Text>
          ) : (
            <View style={styles.giftsPtbGrid}>
              {giftsPtbUiRowPairs.map(([left, right], rowIdx) => (
                <View
                  key={`gifts-ptb-row-${rowIdx}-${left.id}`}
                  style={styles.giftsPtbGridRow}
                >
                  {[left, right].map((product, colIdx) => {
                    if (!product) {
                      return (
                        <View
                          key={`gifts-ptb-empty-${rowIdx}-${colIdx}`}
                          style={[styles.giftsPtbCard, styles.giftsPtbCardHalf]}
                        />
                      );
                    }
                    const wishlisted = categoryPtbRowWishlisted(
                      product,
                      giftsWishlistHasAuth,
                      giftsWishlistServerKeys,
                      giftsWishlistIds
                    );
                    return (
                      <View
                        key={product.id}
                        style={[styles.giftsPtbCard, styles.giftsPtbCardHalf]}
                      >
                        <TouchableOpacity
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
                          <View style={styles.giftsPtbCardInner}>
                            <Image
                              source={product.imageSource}
                              style={styles.giftsPtbImage}
                              resizeMode="cover"
                            />
                            <View style={styles.giftsPtbMeta}>
                              <Text style={styles.giftsPtbName} numberOfLines={2}>
                                {product.name}
                              </Text>
                              <View style={styles.giftsPtbRatingRow}>
                                <View style={styles.giftsPtbRatingPill}>
                                  <Ionicons name="star" size={12} color="#ef7b1a" />
                                  <Text style={styles.giftsPtbRatingText}>{product.ratingLabel}</Text>
                                </View>
                              </View>
                              <View style={styles.giftsPtbPriceRow}>
                                {product.sellingLabel ? (
                                  <Text style={styles.giftsPtbPrice}>{product.sellingLabel}</Text>
                                ) : null}
                                {product.showMrp && product.mrpLabel ? (
                                  <Text style={styles.giftsPtbMrp}>{product.mrpLabel}</Text>
                                ) : null}
                                {product.discountLabel ? (
                                  <View style={styles.giftsPtbDiscountPill}>
                                    <Text style={styles.giftsPtbDiscountText}>{product.discountLabel}</Text>
                                  </View>
                                ) : null}
                              </View>
                              <View style={styles.giftsPtbBottomRow}>
                                <View style={styles.giftsPtbActionsRow}>
                                  <TouchableOpacity
                                    style={styles.giftsPtbWishBtn}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                      void handleToggleGiftsPtbWishlist({
                                        id: product.id,
                                        name: product.name,
                                        sellingNum: product.sellingNum,
                                        mrpNum: product.mrpNum,
                                        variantId: product.variantId,
                                      })
                                    }
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
                                    style={styles.giftsPtbCartBtn}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                      void handleAddGiftsPtbCart({
                                        id: product.id,
                                        name: product.name,
                                        sellingNum: product.sellingNum,
                                        mrpNum: product.mrpNum,
                                        variantId: product.variantId,
                                      })
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={`Add to cart: ${product.name}`}
                                  >
                                    <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                                    <Text style={styles.giftsPtbCartBtnText}>Add to Cart</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF0E5",
  },
  screenBgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  giftsStickyHeader: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.05)",
  },
  giftsHeaderAccentWash: {
    ...StyleSheet.absoluteFillObject,
  },
  giftsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  giftsLogoHit: {
    borderRadius: 18,
  },
  giftsLogoTile: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  giftsLogoImage: {
    width: 40,
    height: 40,
  },
  giftsSearchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 5,
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  giftsSearchMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    minWidth: 0,
  },
  giftsSearchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#94a3b8",
  },
  giftsSearchCameraBtn: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(239, 123, 26, 0.1)",
  },
  giftsHeaderIconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  giftsHeaderIconHit: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.06)",
  },
  giftsHeaderIconBadgeWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  giftsHeaderIconBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
  },
  giftsHeaderIconBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  giftsPtbWrap: {
    marginTop: 18,
    paddingBottom: 24,
  },
  giftsPtbHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  giftsPtbHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  giftsPtbSeeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ea580c",
  },
  giftsPtbStatus: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  giftsPtbGrid: {
    paddingHorizontal: 12,
    gap: 8,
  },
  giftsPtbGridRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 8,
  },
  giftsPtbCard: {
    borderRadius: 12,
    backgroundColor: "#ef7b1a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 1,
    marginBottom: 12,
    overflow: "visible",
  },
  giftsPtbCardHalf: {
    flex: 1,
    minWidth: 0,
  },
  giftsPtbCardInner: {
    flex: 1,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFDF9",
    margin: 1,
  },
  giftsPtbImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
    backgroundColor: "#FFFFFF",
  },
  giftsPtbMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  giftsPtbName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D2430",
    minHeight: 30,
  },
  giftsPtbRatingRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  giftsPtbRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftsPtbRatingText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A4E17",
  },
  giftsPtbPriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 6,
  },
  giftsPtbPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1d324e",
  },
  giftsPtbMrp: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  giftsPtbDiscountPill: {
    backgroundColor: "rgba(239,123,26,0.14)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftsPtbDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#b45309",
  },
  giftsPtbBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  giftsPtbActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "space-between",
  },
  giftsPtbWishBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.25)",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  giftsPtbCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#1d324e",
    flex: 1,
  },
  giftsPtbCartBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 90,
  },
  giftDiscoverySection: {
    marginTop: 8,
    paddingTop: 22,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(194, 65, 12, 0.22)",
  },
  giftDiscoveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  giftDiscoveryHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.25,
  },
  middlePromoOuter: {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 22,
    shadowColor: "#c2410c",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  middlePromoFlashRibbon: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#dc2626",
    borderBottomRightRadius: 12,
    gap: 5,
  },
  middlePromoFlashRibbonText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  middlePromoGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    paddingRight: 12,
  },
  middlePromoTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  middlePromoEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  middlePromoTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 25,
    letterSpacing: 0.2,
  },
  middlePromoSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    lineHeight: 16,
  },
  middlePromoCta: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  middlePromoCtaText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#c2410c",
  },
  middlePromoEmoji: {
    fontSize: 44,
    marginLeft: 4,
  },
  homeProductRowBlock: {
    marginBottom: 22,
  },
  homeRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingRight: 2,
  },
  homeRowTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeRowTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.2,
  },
  homeRowAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f97316",
    marginLeft: 8,
  },
  homeRowSeeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  homeRowSeeAll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ea580c",
  },
  shopByCategorySection: {
    borderRadius: 22,
    padding: 12,
    marginBottom: 18,
    backgroundColor: "rgba(255, 250, 245, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.38)",
    shadowColor: "#c2410c",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  shopByCategorySectionCorporate: {
    backgroundColor: "rgba(248, 250, 252, 0.97)",
    borderColor: "rgba(99, 102, 241, 0.4)",
    shadowColor: "#4338ca",
    shadowOpacity: 0.11,
  },
  shopByCategorySectionEvent: {
    backgroundColor: "rgba(255, 251, 250, 0.97)",
    borderColor: "rgba(225, 29, 72, 0.35)",
    shadowColor: "#be123c",
    shadowOpacity: 0.1,
  },
  shopByCategoryBanner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239, 123, 26, 0.35)",
    shadowColor: "#b45309",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shopByCategoryBannerCorporate: {
    borderColor: "rgba(99, 102, 241, 0.34)",
    shadowColor: "#6366f1",
    shadowOpacity: 0.1,
  },
  shopByCategoryBannerEvent: {
    borderColor: "rgba(244, 63, 94, 0.32)",
    shadowColor: "#e11d48",
    shadowOpacity: 0.1,
  },
  shopByCategoryBannerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopByCategoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(194, 65, 12, 0.2)",
  },
  shopByCategoryIconWrapCorporate: {
    borderColor: "rgba(79, 70, 229, 0.32)",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
  },
  shopByCategoryIconWrapEvent: {
    borderColor: "rgba(225, 29, 72, 0.32)",
    backgroundColor: "rgba(255, 255, 255, 0.99)",
  },
  shopByCategoryBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  shopByCategoryEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9a3412",
    letterSpacing: 1,
    marginBottom: 4,
  },
  shopByCategoryEyebrowCorporate: {
    color: "#4338ca",
    letterSpacing: 1.1,
  },
  shopByCategoryEyebrowEvent: {
    color: "#be123c",
    letterSpacing: 1.15,
  },
  shopByCategoryTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.2,
  },
  categoryCircleRow: {
    paddingRight: 10,
    paddingLeft: 2,
    paddingBottom: 4,
  },
  subCategorySection: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(29, 50, 78, 0.12)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  subCategoryShelfArt: {
    backgroundColor: "rgba(255, 253, 250, 0.9)",
    borderColor: "rgba(29, 50, 78, 0.14)",
  },
  subCategoryShelfCorporate: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(79, 70, 229, 0.32)",
    shadowColor: "#3730a3",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  subCategoryShelfEvent: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(190, 18, 60, 0.28)",
    shadowColor: "#9f1239",
    shadowOpacity: 0.11,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  subCategoryShelfUtility: {
    backgroundColor: "rgba(236, 253, 245, 0.9)",
    borderColor: "rgba(5, 150, 105, 0.25)",
  },
  subCategoryShelfCouple: {
    backgroundColor: "rgba(253, 242, 248, 0.92)",
    borderColor: "rgba(236, 72, 153, 0.28)",
  },
  subCategorySectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingRight: 4,
  },
  subCategorySectionAccent: {
    width: 4,
    minHeight: 56,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
  },
  subCategorySectionHeaderText: {
    flex: 1,
  },
  subCategorySectionEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  subCategorySectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.2,
  },
  subCategorySectionHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    lineHeight: 15,
  },

  artHeadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  artHeadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(239, 123, 26, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 123, 26, 0.22)",
  },
  artHeadPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0f172a",
  },
  artHeadTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 0.2,
  },
  artHeadSub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 16,
  },

  artList: {
    gap: 12,
  },
  artRowCard: {
    width: "100%",
    height: 192,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
  },
  artRowCardReverse: {
    flexDirection: "row-reverse",
  },
  artRowLeft: {
    width: "40%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  artRowLeftReverse: {
    alignItems: "flex-end",
  },
  artRowTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
    letterSpacing: 0.2,
  },
  artRowTitleReverse: {
    textAlign: "right",
  },
  artRowSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(248,250,252,0.72)",
  },
  artRowSubReverse: {
    textAlign: "right",
  },
  artRowAction: {
    marginTop: 8,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  artRowActionReverse: {
    alignSelf: "flex-end",
  },
  artRowSlash: {
    position: "absolute",
    left: "58%",
    top: -24,
    width: 52,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.07)",
    transform: [{ rotate: "-16deg" }],
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.06)",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.22)",
  },
  artRowSlashReverse: {
    left: "32%",
    transform: [{ rotate: "16deg" }],
  },
  artRowRight: {
    width: "60%",
    backgroundColor: "#0B1220",
  },
  artRowImage: {
    width: "100%",
    height: "100%",
  },
  artRowImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1220",
  },
  categoryCircleItem: {
    width: 86,
    marginRight: 12,
    alignItems: "center",
  },
  categoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    backgroundColor: "#fff",
  },
  categoryCircleSelected: {
    borderWidth: 2,
    borderColor: "#ef7b1a",
    shadowOpacity: 0.12,
    elevation: 6,
  },
  categoryCircleSelectedCorporate: {
    borderWidth: 2,
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  categoryCircleLabelSelectedCorporate: {
    color: "#312e81",
    fontWeight: "900",
  },
  categoryCircleSelectedEvent: {
    borderWidth: 2,
    borderColor: "#e11d48",
    shadowColor: "#f43f5e",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  categoryCircleLabelSelectedEvent: {
    color: "#881337",
    fontWeight: "900",
  },
  categoryCircleEmoji: {
    fontSize: 28,
  },
  categoryCircleImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  categoryCircleLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
  categoryCircleLabelSelected: {
    color: "#0F172A",
  },
  heroBannerOuter: {
    position: "relative",
    width: "100%",
    marginBottom: 14,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#111827",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  heroCategoryTagGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 28,
    paddingBottom: 12,
  },
  heroCategoryTagEyebrow: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  heroCategoryTagTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bannerToCollectionsBridge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  bannerToCollectionsLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(194, 65, 12, 0.35)",
  },
  bannerToCollectionsPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.35)",
    shadowColor: "#c2410c",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 6,
  },
  bannerToCollectionsText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#c2410c",
    letterSpacing: 0.9,
  },
  bannerToCollectionsLineCorporate: {
    backgroundColor: "rgba(79, 70, 229, 0.35)",
  },
  bannerToCollectionsPillCorporate: {
    borderColor: "rgba(99, 102, 241, 0.42)",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    shadowColor: "#4338ca",
    shadowOpacity: 0.12,
  },
  bannerToCollectionsTextCorporate: {
    color: "#3730a3",
    letterSpacing: 1,
  },
  bannerToCollectionsLineEvent: {
    backgroundColor: "rgba(190, 18, 60, 0.38)",
  },
  bannerToCollectionsPillEvent: {
    borderColor: "rgba(244, 63, 94, 0.45)",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    shadowColor: "#be123c",
    shadowOpacity: 0.11,
  },
  bannerToCollectionsTextEvent: {
    color: "#9f1239",
    letterSpacing: 1,
  },
  heroBanner: {
    width: "100%",
    height: 240,
    backgroundColor: "#111827",
  },
  heroBannerImageBg: {
    borderRadius: 18,
  },
  subCard: {
    width: "100%",
    height: 172,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#D6D3D1",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  subCardExplore: {
    borderWidth: 1,
    borderColor: "rgba(29, 50, 78, 0.12)",
    shadowColor: "#1d324e",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  subCardMainTap: {
    flex: 1,
    width: "100%",
  },
  subCardImageBgFill: {
    width: "100%",
    height: "100%",
    minHeight: 172,
    justifyContent: "center",
  },
  subCardImageStyleRounded: {
    borderRadius: 18,
  },
  subCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  subCardTextWrap: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 170,
    paddingRight: 56,
  },
  subCardTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: "#374151",
  },
  subCardTopLeftScrim: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "62%",
  },
  subCardTitleTopLeftBox: {
    position: "absolute",
    left: 12,
    top: 12,
    maxWidth: "58%",
    zIndex: 1,
    paddingRight: 8,
  },
  subCardTitleTopLeftEyebrow: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  subCardTitleTopLeft: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 25,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  arrowWrap: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,23,42,0.12)",
  },
  corpTitleWrap: {
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#DDE3FF",
    overflow: "hidden",
    position: "relative",
  },
  corpGlowOne: {
    position: "absolute",
    top: -26,
    right: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(129, 140, 248, 0.20)",
  },
  corpGlowTwo: {
    position: "absolute",
    bottom: -30,
    left: -26,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(125, 211, 252, 0.18)",
  },
  corpTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  corpIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#D5DBFF",
  },
  corpTitleTextWrap: {
    flex: 1,
  },
  corpBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#6366F1",
    marginBottom: 6,
  },
  corpBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  corpTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#312E81",
    lineHeight: 28,
  },
  corpSubTitle: {
    marginTop: 3,
    fontSize: 14,
    color: "#4C4F6B",
    fontWeight: "600",
  },
  corpGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  corpCard: {
    width: "48.5%",
    backgroundColor: "#EEF2FF",
    borderRadius: 18,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDE4FF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  corpCardShelf: {
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.28)",
    shadowColor: "#6366F1",
    shadowOpacity: 0.09,
  },
  corpImageWrap: {
    width: "100%",
    aspectRatio: 1.08,
    backgroundColor: "#D9E1EF",
    position: "relative",
  },
  corpImage: {
    width: "100%",
    height: "100%",
  },
  corpImageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  corpLabelRow: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  corpLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    paddingRight: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#374151",
    marginRight: 4,
  },
  trendingRow: {
    paddingRight: 6,
    paddingBottom: 8,
  },
  productCard: {
    width: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productImage: {
    width: "100%",
    height: 120,
  },
  productMeta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  productPrice: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  offerBanner: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: "#FB7185",
  },
  offerMain: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
  },
  offerSub: {
    marginTop: 2,
    color: "#FDF2F8",
    fontSize: 24,
    fontWeight: "600",
  },
  offerBannerAlt: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#111827",
    overflow: "hidden",
  },
  offerAltGlowOne: {
    position: "absolute",
    top: -28,
    right: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(99, 102, 241, 0.28)",
  },
  offerAltGlowTwo: {
    position: "absolute",
    bottom: -30,
    left: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(236, 72, 153, 0.22)",
  },
  offerAltEyebrow: {
    color: "#A5B4FC",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  offerAltTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  offerAltSub: {
    marginTop: 4,
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  offerAltCta: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  offerAltCtaText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  trendingProductCard: {
    width: 178,
    height: 242,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.22)",
    shadowColor: "#c2410c",
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  trendingProductImageWrap: {
    width: "100%",
    flex: 18,
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  productWishlistHit: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  productWishlistBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(185, 28, 28, 0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  trendingProductImage: {
    width: "100%",
    height: "100%",
  },
  trendingProductBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  trendingProductBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  trendingProductMeta: {
    flex: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: "space-between",
  },
  trendingProductName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 17,
    minHeight: 32,
  },
  trendingProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendingProductPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginRight: 8,
  },
  trendingProductMrp: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  productRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  productRatingValue: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  productRatingCount: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  occasionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 4,
    marginBottom: 6,
  },
  occasionCard: {
    width: "48.5%",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  occasionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  occasionIcon: {
    fontSize: 22,
  },
  occasionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  quickPicksRow: {
    paddingRight: 6,
    paddingBottom: 6,
  },
  quickPickChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quickPickIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  quickPickText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  eventTitleWrap: {
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    overflow: "hidden",
    position: "relative",
  },
  eventGlowOne: {
    position: "absolute",
    top: -26,
    right: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(252, 165, 165, 0.20)",
  },
  eventGlowTwo: {
    position: "absolute",
    bottom: -30,
    left: -26,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(254, 240, 138, 0.18)",
  },
  eventTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  eventTitleTextWrap: {
    flex: 1,
  },
  eventBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DC2626",
    marginBottom: 6,
  },
  eventBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#991B1B",
    lineHeight: 28,
  },
  eventSubTitle: {
    marginTop: 3,
    fontSize: 14,
    color: "#7F1D1D",
    fontWeight: "600",
  },
  eventCircleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    rowGap: 14,
  },
  eventCircle: {
    width: "48.5%",
    aspectRatio: 1.06,
    /** Event subcategory grid: slightly taller than aspect-only (~+50px vs baseline on typical widths) */
    minHeight: 220,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#1f2937",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    position: "relative",
    marginBottom: 0,
  },
  eventCircleShelf: {
    marginBottom: 0,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.98)",
    shadowColor: "#B91C1C",
    shadowOpacity: 0.1,
  },
  eventCircleWithImage: {
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  eventCircleImageBg: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  eventCircleImageRadius: {
    borderRadius: 18,
  },
  eventCircleImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  eventCircleEmojiBadge: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 30,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  eventCircleImageFooter: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 8,
  },
  eventCircleTitleOnImage: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.15,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  eventEmoji: {
    fontSize: 38,
    marginBottom: 6,
    marginTop: 4,
  },
  eventCircleTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
    textAlign: "center",
    paddingHorizontal: 10,
    paddingBottom: 8,
    lineHeight: 20,
    marginBottom: 0,
  },
  eventArrowCircle: {
    position: "absolute",
    bottom: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  utilityTitleWrap: {
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    overflow: "hidden",
    position: "relative",
  },
  utilityGlowOne: {
    position: "absolute",
    top: -26,
    right: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  utilityGlowTwo: {
    position: "absolute",
    bottom: -30,
    left: -26,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(251, 146, 60, 0.12)",
  },
  utilityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  utilityIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  utilityTitleTextWrap: {
    flex: 1,
  },
  utilityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#059669",
    marginBottom: 6,
  },
  utilityBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  utilityTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#064E3B",
    lineHeight: 28,
  },
  utilitySubTitle: {
    marginTop: 3,
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
  utilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  utilityCard: {
    width: "48.5%",
    minHeight: 158,
    borderRadius: 18,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  utilityCardShelf: {
    marginBottom: 12,
    borderColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#059669",
    shadowOpacity: 0.08,
  },
  utilityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  utilityIcon: {
    fontSize: 24,
  },
  utilityCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 6,
  },
  /** Everyday Utility shelf: image ~80% height, gradient title band ~20% */
  utilityEverydayCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 176,
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  utilityEverydayCardInner: {
    height: 174,
    flexDirection: "column",
    width: "100%",
  },
  utilityEverydayImageBlock: {
    flex: 4,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  utilityEverydayImage: {
    width: "100%",
    height: "100%",
  },
  utilityEverydayImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(236, 253, 245, 0.95)",
  },
  utilityEverydayEmoji: {
    fontSize: 40,
  },
  utilityEverydayFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  utilityEverydayTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  utilityEverydaySub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.88)",
  },
  utilityEverydayFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  /** Home Decor Gifts (gc6): image ~80%, warm amber gradient ~20% */
  homeDecorGiftCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 176,
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  homeDecorGiftCardShelf: {
    shadowColor: "#b45309",
    shadowOpacity: 0.12,
    borderColor: "rgba(255, 251, 235, 0.98)",
  },
  homeDecorGiftCardInner: {
    height: 174,
    flexDirection: "column",
    width: "100%",
  },
  homeDecorGiftImageBlock: {
    flex: 4,
    width: "100%",
    backgroundColor: "rgba(255, 251, 235, 0.85)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  homeDecorGiftImage: {
    width: "100%",
    height: "100%",
  },
  homeDecorGiftImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254, 243, 199, 0.55)",
  },
  homeDecorGiftEmoji: {
    fontSize: 40,
  },
  homeDecorGiftFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  homeDecorGiftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  homeDecorGiftSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  homeDecorGiftFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  /** Kids & Baby Gifts (gc7): image ~80%, playful violet–pink gradient ~20% */
  kidsBabyGiftCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 176,
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  kidsBabyGiftCardShelf: {
    shadowColor: "#7c3aed",
    shadowOpacity: 0.12,
    borderColor: "rgba(255, 255, 255, 0.96)",
  },
  kidsBabyGiftCardInner: {
    height: 174,
    flexDirection: "column",
    width: "100%",
  },
  kidsBabyGiftImageBlock: {
    flex: 4,
    width: "100%",
    backgroundColor: "rgba(237, 233, 254, 0.75)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  kidsBabyGiftImage: {
    width: "100%",
    height: "100%",
  },
  kidsBabyGiftImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(252, 231, 243, 0.65)",
  },
  kidsBabyGiftEmoji: {
    fontSize: 40,
  },
  kidsBabyGiftFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kidsBabyGiftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  kidsBabyGiftSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  kidsBabyGiftFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  /** Spiritual & Festival Gifts (gc8): image ~80%, saffron–amber gradient ~20% */
  spiritualFestivalGiftCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 176,
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  spiritualFestivalGiftCardShelf: {
    shadowColor: "#c2410c",
    shadowOpacity: 0.12,
    borderColor: "rgba(255, 251, 235, 0.96)",
  },
  spiritualFestivalGiftCardInner: {
    height: 174,
    flexDirection: "column",
    width: "100%",
  },
  spiritualFestivalGiftImageBlock: {
    flex: 4,
    width: "100%",
    backgroundColor: "rgba(255, 247, 237, 0.85)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  spiritualFestivalGiftImage: {
    width: "100%",
    height: "100%",
  },
  spiritualFestivalGiftImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(254, 243, 199, 0.55)",
  },
  spiritualFestivalGiftEmoji: {
    fontSize: 40,
  },
  spiritualFestivalGiftFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  spiritualFestivalGiftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  spiritualFestivalGiftSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  spiritualFestivalGiftFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  /** Wearable & Personal Gifts (gc9): image ~80%, indigo–rose gradient ~20% */
  wearablePersonalGiftCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 176,
    alignItems: "stretch",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  wearablePersonalGiftCardShelf: {
    shadowColor: "#4f46e5",
    shadowOpacity: 0.12,
    borderColor: "rgba(255, 255, 255, 0.96)",
  },
  wearablePersonalGiftCardInner: {
    height: 174,
    flexDirection: "column",
    width: "100%",
  },
  wearablePersonalGiftImageBlock: {
    flex: 4,
    width: "100%",
    backgroundColor: "rgba(238, 242, 255, 0.9)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  wearablePersonalGiftImage: {
    width: "100%",
    height: "100%",
  },
  wearablePersonalGiftImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(224, 231, 255, 0.65)",
  },
  wearablePersonalGiftEmoji: {
    fontSize: 40,
  },
  wearablePersonalGiftFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wearablePersonalGiftTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  wearablePersonalGiftSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  wearablePersonalGiftFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  coupleTitleWrap: {
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    overflow: "hidden",
    position: "relative",
  },
  coupleGlowOne: {
    position: "absolute",
    top: -26,
    right: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
  },
  coupleGlowTwo: {
    position: "absolute",
    bottom: -30,
    left: -26,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(244, 114, 182, 0.12)",
  },
  coupleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coupleIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F9A8D4",
  },
  coupleTitleTextWrap: {
    flex: 1,
  },
  coupleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EC4899",
    marginBottom: 6,
  },
  coupleBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  coupleTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#831843",
    lineHeight: 28,
  },
  coupleSubTitle: {
    marginTop: 3,
    fontSize: 14,
    color: "#9F1239",
    fontWeight: "600",
  },
  coupleTopBanner: {
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 4,
    marginBottom: 14,
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  coupleTopBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  coupleTopBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.40)",
  },
  coupleTopBannerContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  coupleTopBannerEyebrow: {
    color: "#FBCFE8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  coupleTopBannerTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
  },
  coupleTopBannerSubTitle: {
    marginTop: 4,
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
  },
  coupleTopBannerCta: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  coupleTopBannerCtaText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "900",
  },
  coupleContainer: {
    paddingHorizontal: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  coupleCard: {
    minHeight: 108,
    width: "100%",
    borderRadius: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  coupleCardShelf: {
    marginBottom: 12,
    borderColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#EC4899",
    shadowOpacity: 0.09,
  },
  coupleHeartContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  coupleEmoji: {
    fontSize: 28,
  },
  coupleCardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  /** Couples shelf: large image ~80%, rose gradient band ~20% */
  coupleRomanceCard: {
    width: "48.5%",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 176,
    overflow: "hidden",
  },
  coupleRomanceCardInner: {
    height: 174,
    flexDirection: "column",
    width: "100%",
  },
  coupleRomanceImageBlock: {
    flex: 4,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  coupleRomanceImage: {
    width: "100%",
    height: "100%",
  },
  coupleRomanceImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(252, 231, 243, 0.98)",
  },
  coupleRomanceEmoji: {
    fontSize: 40,
  },
  coupleRomanceFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  coupleRomanceTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  coupleRomanceSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  coupleRomanceFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  eventBanner: {
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#FEE2E2",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  eventBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  eventBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(220, 38, 38, 0.2)",
  },
  eventBannerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  eventBannerEyebrow: {
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  eventBannerTitle: {
    color: "#7F1D1D",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  eventBannerSubTitle: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  eventBannerCta: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#DC2626",
  },
  eventBannerCtaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  eventBanner2: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#FEF3C7",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  eventBanner2Image: {
    ...StyleSheet.absoluteFillObject,
  },
  eventBanner2Overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  eventBanner2Content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  eventBanner2Eyebrow: {
    color: "#92400E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  eventBanner2Title: {
    color: "#78350F",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 3,
  },
  eventBanner2SubTitle: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
  },
  eventBanner2Cta: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F59E0B",
  },
  eventBanner2CtaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  searchResultsOverlay: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  searchLoadingText: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#64748B",
    fontSize: 13,
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  searchResultText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "500",
  },
  searchCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Dimensions,
  type ImageSourcePropType,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  Polygon,
} from "react-native-svg";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import api, {
  mapSearchResultsToUi,
  productsByMainCategoryFeedPath,
  productsByMainCategoryPath,
  productsBySubcategoryPath,
  searchProductsPath,
  searchSuggestionsPath,
} from "../services/api";
import { pickProductImageUriFromApi } from "../lib/pickProductImageUri";
import { addToCartPtbOrLocal, getCartUnitCount } from "../lib/cartServerApi";
import { getWishlistIds } from "../lib/shopStorage";
import {
  categoryPtbRowWishlisted,
  fetchWishlistServerKeySet,
  togglePtbWishlistWithServer,
} from "../lib/wishlistServerApi";
import { useLanguage } from "../lib/language";

/** Flat-top regular hexagon: compact width, moderate height (√3/2 × width). */
const HEX_W = 82;
const HEX_H = Math.round((HEX_W * Math.sqrt(3)) / 2);
const HEX_STROKE_COLOR = "#1d324e";
const HEX_SELECTED_LABEL = "#ef7b1a";

function flatTopHexPoints(w: number, h: number) {
  const yMid = h / 2;
  return `${w * 0.25},0 ${w * 0.75},0 ${w},${yMid} ${w * 0.75},${h} ${w * 0.25},${h} 0,${yMid}`;
}

function HexagonShopBadge({
  source,
  clipId,
  selected,
}: {
  source: ImageSourcePropType;
  clipId: string;
  selected: boolean;
}) {
  // Handle both React Native and React Native Web
  const resolved = Image.resolveAssetSource ? Image.resolveAssetSource(source) : null;
  const href = resolved?.uri ? { uri: resolved.uri } : undefined;
  const pts = flatTopHexPoints(HEX_W, HEX_H);
  const strokeW = selected ? 3.4 : 2;

  if (!href) {
    return (
      <View style={[styles.hexFallback, { width: HEX_W, height: HEX_H }]}>
        <View style={[styles.hexFallbackInner, { borderColor: HEX_STROKE_COLOR }]} />
      </View>
    );
  }

  return (
    <Svg width={HEX_W} height={HEX_H}>
      <Defs>
        <ClipPath id={clipId}>
          <Polygon points={pts} />
        </ClipPath>
      </Defs>
      <Polygon points={pts} fill="#e8eaed" />
      <SvgImage
        href={href}
        width={HEX_W}
        height={HEX_H}
        preserveAspectRatio="xMidYMid meet"
        clipPath={`url(#${clipId})`}
      />
      <Polygon points={pts} fill="none" stroke={HEX_STROKE_COLOR} strokeWidth={strokeW} />
    </Svg>
  );
}

const MEN_HERO_BANNER_IMAGE = require("../assets/men/categories/MensWear.png");
const MEN_STYLE_LAB_STRIP_IMAGE = require("../assets/men/categories/TopWear.png");
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

/** Gradient card wrapper for storefront sections (visual anchor on the feed). */
function MenStoreSection({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={["#ffffff", "#f5f7fb"]}
      locations={[0, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.storeSectionShell}
    >
      {children}
    </LinearGradient>
  );
}

function MenSectionHead({
  accent,
  title,
  sub,
  icon,
  iconColor,
}: {
  accent: string;
  title: string;
  sub: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}) {
  const ic = iconColor ?? accent;
  return (
    <View style={styles.fcHead}>
      <View style={[styles.fcHeadAccentBar, { backgroundColor: accent }]} />
      <View style={styles.fcHeadText}>
        <Text style={styles.fcHeadTitle}>{title}</Text>
        <Text style={styles.fcHeadSub}>{sub}</Text>
      </View>
      {icon ? (
        <View style={[styles.fcHeadIconBubble, { backgroundColor: hexToRgba(accent, 0.14) }]}>
          <Ionicons name={icon} size={20} color={ic} />
        </View>
      ) : null}
    </View>
  );
}

type SubLabel = {
  id: string;
  label: string;
  /** Subcategory tile photo; falls back to department `shopImage` if omitted. */
  image?: ImageSourcePropType;
  /** API subcategory id when tile comes from `subcategories-table` (for product listing). */
  subcategoryId?: number;
};

type MenCategoryBlock = {
  key: string;
  title: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Thumbnail for Shop by category row — change `require(...)` paths when you add category art. */
  shopImage: ImageSourcePropType;
  railFrom: string;
  railTo: string;
  subs: SubLabel[];
};

type MenSubcategoryApiRow = {
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

type MenSubcategoriesTableSubRow = {
  id: number;
  name: string;
  image: string | null;
  mobileImage: string | null;
};

type MenSubcategoriesTableRow = {
  categoryName: string;
  mobileImage: string | null;
  subcategories: MenSubcategoriesTableSubRow[];
};

/** Men's Ethnic — Kurta & Pajama (`GET` path from `productsBySubcategoryPath` in `services/api.tsx`). */
const MEN_KURTA_PAJAMA_SUBCATEGORY_ID = 146;

/** When ethnic `subcategories-table` is unavailable, still wire Kurta tiles to PLP id 146. */
function menEthnicFallbackSubcategoryIdForLabel(label: string): number | undefined {
  const t = String(label ?? "").trim().toLowerCase();
  if (!t) return undefined;
  if (t.includes("kurta") && t.includes("pajama")) return MEN_KURTA_PAJAMA_SUBCATEGORY_ID;
  if (t === "kurtas" || t.startsWith("kurta")) return MEN_KURTA_PAJAMA_SUBCATEGORY_ID;
  return undefined;
}

type MenKurtaPajamaSpotlightRow = {
  id: string;
  name: string;
  imageUri: string;
  sellingPrice: number;
  mrpPrice: number;
  discountLabel: string;
  ratingLabel: string;
};

function menProductAssetUriFromApiPath(pathOrUrl: string): string {
  const raw = String(pathOrUrl ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  if (!base) return raw;
  const normalized = raw.replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (normalized.startsWith("/")) return `${base}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${base}/${normalized}`;
  return `${base}/uploads/${normalized}`;
}

function menSafeProductName(v: string): string {
  return String(v ?? "")
    .replace(/\u0019/g, "'")
    .replace(/\u0018/g, "'")
    .trim();
}

function menPickProductImageUri(p: any): string | null {
  return pickProductImageUriFromApi(p, menProductAssetUriFromApiPath);
}

function menPickVariantNumbers(p: any): {
  selling: number;
  mrp: number;
  discountPct: number | null;
} {
  const num = (x: unknown): number | null => {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string") {
      const n = parseFloat(x);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  const v =
    variants.find(
      (x) =>
        x &&
        (typeof x.sellingPrice === "number" ||
          typeof x.mrpPrice === "number" ||
          typeof x.sellingPrice === "string" ||
          typeof x.mrpPrice === "string")
    ) ?? variants[0];
  const selling = num(v?.sellingPrice) ?? 0;
  const mrpRaw = num(v?.mrpPrice);
  const mrp = mrpRaw != null && mrpRaw > 0 ? mrpRaw : selling;
  const discountPct = num(v?.discountPercentage);
  return {
    selling: Math.max(0, Math.round(selling)),
    mrp: Math.max(Math.round(selling), Math.round(mrp)),
    discountPct,
  };
}

function menPickRatingLabel(p: any): string {
  const r =
    p?.rating ?? p?.averageRating ?? p?.average_rating ?? p?.reviewRating ?? p?.review_rating;
  if (typeof r === "number" && Number.isFinite(r)) return r.toFixed(1);
  if (typeof r === "string") {
    const n = parseFloat(r);
    return Number.isFinite(n) ? n.toFixed(1) : "—";
  }
  return "—";
}

function mapMenApiProductToKurtaPajamaSpotlight(p: any): MenKurtaPajamaSpotlightRow | null {
  if (!p || typeof p.id !== "number" || typeof p.name !== "string") return null;
  const st = String(p.status ?? "").trim().toLowerCase();
  if (st && st !== "active") return null;
  const imageUri = menPickProductImageUri(p);
  if (!imageUri) return null;
  const { selling, mrp, discountPct } = menPickVariantNumbers(p);
  const discountLabel =
    discountPct != null && Number.isFinite(discountPct)
      ? `${Number(discountPct).toFixed(1).replace(/\.0$/, "")}% off`
      : "Deal";
  return {
    id: String(p.id),
    name: menSafeProductName(p.name),
    imageUri,
    sellingPrice: selling,
    mrpPrice: mrp,
    discountLabel,
    ratingLabel: menPickRatingLabel(p),
  };
}

/** Model B: light storefront + horizontal rails (no navigation). */
const MEN_CATEGORIES: MenCategoryBlock[] = [
  {
    key: "bottom",
    title: "Bottom Wear",
    tag: "Denim & bottoms",
    icon: "resize-outline",
    shopImage: require("../assets/men/categories/MenBottomWear.png"),
    railFrom: "#1b4332",
    railTo: "#2d6a4f",
    subs: [
      {
        id: "b1",
        label: "Cargo Pants",
        image: require("../assets/men/categories/MenBottomWear.png"),
      },
      {
        id: "b2",
        label: "Casual Trousers",
        image: require("../assets/men/categories/BottomWear.png"),
      },
      {
        id: "b3",
        label: "Jeans",
        image: require("../assets/men/categories/MenBottomWear.png"),
      },
      {
        id: "b4",
        label: "Joggers",
        image: require("../assets/men/categories/BottomWear.png"),
      },
      {
        id: "b5",
        label: "Shorts / Bermudas",
        image: require("../assets/men/categories/MenBottomWear.png"),
      },
      {
        id: "b6",
        label: "Track Pants / Lower Wear",
        image: require("../assets/men/categories/BottomWear.png"),
      },
      {
        id: "b7",
        label: "Trousers (Formal / Regular)",
        image: require("../assets/men/categories/MenBottomWear.png"),
      },
    ],
  },
  {
    key: "ethnic",
    title: "Ethnic Wear",
    tag: "Festive",
    icon: "sparkles-outline",
    shopImage: require("../assets/men/categories/EthnicWear.png"),
    railFrom: "#7c2d12",
    railTo: "#c2410c",
    subs: [
      {
        id: "e1",
        label: "Kurtas",
        image: require("../assets/men/categories/EthnicWear.png"),
      },
      {
        id: "e2",
        label: "Sherwanis",
        image: require("../assets/men/categories/EthnicWear.png"),
      },
      {
        id: "e3",
        label: "Nehru jackets",
        image: require("../assets/men/categories/EthnicWear.png"),
      },
      {
        id: "e4",
        label: "Ethnic sets",
        image: require("../assets/men/categories/EthnicWear.png"),
      },
      {
        id: "e5",
        label: "Dhotis",
        image: require("../assets/men/categories/EthnicWear.png"),
      },
    ],
  },
  {
    key: "formal",
    title: "Formal Wear",
    tag: "Work & events",
    icon: "briefcase-outline",
    shopImage: require("../assets/men/categories/FormalWear.png"),
    railFrom: "#0f172a",
    railTo: "#334155",
    subs: [
      {
        id: "f1",
        label: "Formal shirts",
        image: require("../assets/men/categories/FormalWear.png"),
      },
      {
        id: "f2",
        label: "Blazers",
        image: require("../assets/men/categories/FormalWear.png"),
      },
      {
        id: "f3",
        label: "Suits",
        image: require("../assets/men/categories/FormalWear.png"),
      },
      {
        id: "f4",
        label: "Ties",
        image: require("../assets/men/categories/FormalWear.png"),
      },
      {
        id: "f5",
        label: "Dress shoes",
        image: require("../assets/men/categories/FormalWear.png"),
      },
    ],
  },
  {
    key: "inner",
    title: "Innerwear & Nightwear",
    tag: "Comfort",
    icon: "moon-outline",
    shopImage: require("../assets/men/categories/Innerwear.png"),
    railFrom: "#4c1d4a",
    railTo: "#7c3a76",
    subs: [
      {
        id: "i1",
        label: "Briefs",
        image: require("../assets/men/categories/Innerwear.png"),
      },
      {
        id: "i2",
        label: "Vests",
        image: require("../assets/men/categories/Innerwear.png"),
      },
      {
        id: "i3",
        label: "Pyjamas",
        image: require("../assets/men/categories/Innerwear.png"),
      },
      {
        id: "i4",
        label: "Robes",
        image: require("../assets/men/categories/Innerwear.png"),
      },
      {
        id: "i5",
        label: "Loungewear",
        image: require("../assets/men/categories/Innerwear.png"),
      },
    ],
  },
  {
    key: "top",
    title: "Top Wear",
    tag: "Everyday tops",
    icon: "shirt-outline",
    shopImage: require("../assets/men/categories/TopWear.png"),
    railFrom: "#0c4a6e",
    railTo: "#0369a1",
    subs: [
      {
        id: "t1",
        label: "T-shirts",
        image: require("../assets/men/categories/TopWear.png"),
      },
      {
        id: "t2",
        label: "Casual shirts",
        image: require("../assets/men/categories/TopWear.png"),
      },
      {
        id: "t3",
        label: "Polos",
        image: require("../assets/men/categories/TopWear.png"),
      },
      {
        id: "t4",
        label: "Sweatshirts",
        image: require("../assets/men/categories/TopWear.png"),
      },
      {
        id: "t5",
        label: "Jackets",
        image: require("../assets/men/categories/TopWear.png"),
      },
    ],
  },
];

/** Wider cards so long bottom-wear labels fit on two lines. */
const RAIL_CARD_W = 136;
const RAIL_CARD_H = 192;

const FC_TRENDING: {
  key: string;
  title: string;
  price: string;
  image: ImageSourcePropType;
  tag: string;
}[] = [
  {
    key: "tr1",
    title: "Slim taper denim",
    price: "₹1,499",
    image: require("../assets/men/categories/MenBottomWear.png"),
    tag: "Trending",
  },
  {
    key: "tr2",
    title: "Oxford shirt",
    price: "₹1,199",
    image: require("../assets/men/categories/FormalWear.png"),
    tag: "Top rated",
  },
  {
    key: "tr3",
    title: "Essential tee pack",
    price: "₹899",
    image: require("../assets/men/categories/TopWear.png"),
    tag: "Fast moving",
  },
  {
    key: "tr4",
    title: "Linen kurta",
    price: "₹1,699",
    image: require("../assets/men/categories/EthnicWear.png"),
    tag: "New",
  },
  {
    key: "tr5",
    title: "Loungewear set",
    price: "₹1,299",
    image: require("../assets/men/categories/Innerwear.png"),
    tag: "Comfort",
  },
];

const FC_UNIQUE: {
  key: string;
  title: string;
  sub: string;
  image: ImageSourcePropType;
}[] = [
  {
    key: "u1",
    title: "Limited dye run",
    sub: "Small batch colours",
    image: require("../assets/men/categories/TopWear.png"),
  },
  {
    key: "u2",
    title: "Heritage weave",
    sub: "Artisan fabrics",
    image: require("../assets/men/categories/EthnicWear.png"),
  },
  {
    key: "u3",
    title: "Studio exclusive",
    sub: "Not on web yet",
    image: require("../assets/men/categories/FormalWear.png"),
  },
  {
    key: "u4",
    title: "Collab drop",
    sub: "Designer capsule",
    image: require("../assets/men/categories/BottomWear.png"),
  },
];

const FC_BANNERS: {
  key: string;
  line1: string;
  line2: string;
  cta: string;
  from: string;
  to: string;
  badge: string;
}[] = [
  {
    key: "bn1",
    line1: "Wardrobe refresh",
    line2: "Up to 40% off edits — members save more",
    cta: "Shop sale",
    from: "#0f172a",
    to: "#334155",
    badge: "MEGA SALE",
  },
  {
    key: "bn2",
    line1: "Premium denim",
    line2: "New fits & washes · limited drops",
    cta: "Explore",
    from: "#14532d",
    to: "#15803d",
    badge: "DENIM LAB",
  },
  {
    key: "bn3",
    line1: "Festive ready",
    line2: "Ethnic & fusion edits for the season",
    cta: "View",
    from: "#7c2d12",
    to: "#ea580c",
    badge: "FESTIVE",
  },
];

const FC_COLLECTIONS: {
  key: string;
  title: string;
  count: string;
  image: ImageSourcePropType;
}[] = [
  {
    key: "col1",
    title: "Workweek",
    count: "120+ styles",
    image: require("../assets/men/categories/FormalWear.png"),
  },
  {
    key: "col2",
    title: "Weekend easy",
    count: "90+ styles",
    image: require("../assets/men/categories/TopWear.png"),
  },
  {
    key: "col3",
    title: "Street clean",
    count: "75+ styles",
    image: require("../assets/men/categories/MenBottomWear.png"),
  },
  {
    key: "col4",
    title: "Celebration",
    count: "60+ styles",
    image: require("../assets/men/categories/EthnicWear.png"),
  },
];

/** Horizontal padding inside banner carousel row. */
const FC_BANNER_SIDE_PAD = 16;
/** MenStoreSection margin (12) + horizontal padding (12) per side — keeps paging math aligned. */
const MEN_SECTION_SCREEN_INSET = 48;
const FC_BANNER_AUTO_MS = 4200;

/** Shop all sub categories — list carousel step (card + gap). */
const SHOP_ALL_LIST_CARD_W = 172;
const SHOP_ALL_LIST_GAP = 16;
const SHOP_ALL_LIST_STEP = SHOP_ALL_LIST_CARD_W + SHOP_ALL_LIST_GAP;
const SHOP_ALL_AUTO_MS = 1000;

/** Style lab — circular ring diameter (e‑com “story” sizing). */
const FC_LAB_RING = 100;
const FC_LAB_RING_BORDER = 4;
const FC_LAB_GLOW = FC_LAB_RING + 36;


const FC_REPURCHASE: {
  key: string;
  title: string;
  price: string;
  buyers: string;
  image: ImageSourcePropType;
}[] = [
  {
    key: "rp1",
    title: "Best-selling chino",
    price: "₹1,399",
    buyers: "2.4k+ bought again",
    image: require("../assets/men/categories/BottomWear.png"),
  },
  {
    key: "rp2",
    title: "Crew neck 3-pack",
    price: "₹1,049",
    buyers: "1.8k+ repeat",
    image: require("../assets/men/categories/TopWear.png"),
  },
  {
    key: "rp3",
    title: "Formal shirt classic",
    price: "₹1,299",
    buyers: "3.1k+ reorders",
    image: require("../assets/men/categories/FormalWear.png"),
  },
  {
    key: "rp4",
    title: "Everyday briefs",
    price: "₹599",
    buyers: "5k+ stocked up",
    image: require("../assets/men/categories/Innerwear.png"),
  },
];

const FC_LIKED: {
  key: string;
  title: string;
  likes: string;
  /** Social line under title (reference: “Spent $200k”). */
  subline: string;
  shopLabel: string;
  image: ImageSourcePropType;
}[] = [
  {
    key: "lk1",
    title: "Relaxed polo",
    likes: "18.2k",
    subline: "Saved in 18.2k closets",
    shopLabel: "Polos",
    image: require("../assets/men/categories/TopWear.png"),
  },
  {
    key: "lk2",
    title: "Taper jogger",
    likes: "14.6k",
    subline: "Wishlist favourite · 14.6k",
    shopLabel: "Joggers",
    image: require("../assets/men/categories/MenBottomWear.png"),
  },
  {
    key: "lk3",
    title: "Slim blazer",
    likes: "11.3k",
    subline: "Repeat buys · 11.3k hearts",
    shopLabel: "Blazers",
    image: require("../assets/men/categories/FormalWear.png"),
  },
  {
    key: "lk4",
    title: "Silk blend kurta",
    likes: "22.1k",
    subline: "Top rated · 22.1k",
    shopLabel: "Kurtas",
    image: require("../assets/men/categories/EthnicWear.png"),
  },
];

const LOVE_MASONRY_GAP = 10;
const LOVE_MASONRY_TALL = 216;
const LOVE_MASONRY_SHORT = 168;

/** Products to buy — gap between cells (see `menPtbGrid`). */
const MEN_PTB_GRID_GAP = 12;

// Get window dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = screenWidth >= 768;
const isDesktop = screenWidth >= 1024;
const isMobile = screenWidth < 768;

type MainCategoryApiRowMen = {
  id: number;
  categoryName: string;
  status?: number;
};

function safeTextMen(value: string): string {
  return value.replace(/\u0019/g, "'").trim();
}

function getAssetUriFromApiPathMen(pathOrUrl: string): string {
  const raw = String(pathOrUrl ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  if (!apiBase) return raw;
  return `${apiBase}/${raw.replace(/^\/+/, "")}`;
}

function pickMenPtbProductImageUri(p: any): string | null {
  return pickProductImageUriFromApi(p, getAssetUriFromApiPathMen);
}

function pickMenPtbVariantPricing(p: any): {
  sellingPrice: number | null;
  mrpPrice: number | null;
  discountPercentage: number | null;
  variantId?: number;
} {
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  const v =
    variants.find(
      (x: any) =>
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
}

function pickMenPtbProductRating(p: any): number | null {
  const r =
    p?.rating ?? p?.averageRating ?? p?.average_rating ?? p?.reviewRating ?? p?.review_rating;
  if (typeof r === "number" && Number.isFinite(r)) return r;
  if (typeof r === "string") {
    const n = parseFloat(r);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export default function MenScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const mainScrollRef = useRef<ScrollView>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  /** Scroll target: card top (scroll coords) + rail block offset inside card. */
  const shopSubsCardLayoutY = useRef(0);
  const railBlockLayoutY = useRef(0);
  const [selectedKey, setSelectedKey] = useState<string>(MEN_CATEGORIES[0].key);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [shopAllLayout, setShopAllLayout] = useState<"list" | "grid">("list");
  const shopAllScrollRef = useRef<ScrollView>(null);
  const shopAllScrollIndexRef = useRef(0);
  /** +1 = scroll toward next tile (LTR feel), -1 = toward previous. Ping‑pongs at ends. */
  const shopAllScrollDirRef = useRef(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
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
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const MEN_PARENT_ID = 51;

  const params = useLocalSearchParams<{
    id?: string | string[];
    mainCategoryId?: string | string[];
  }>();
  const rawMenMainCategoryId = Array.isArray(params.id)
    ? params.id[0]
    : params.id ?? Array.isArray(params.mainCategoryId)
    ? params.mainCategoryId[0]
    : params.mainCategoryId;
  const parsedRouteMenMainCategoryId = Number.parseInt(String(rawMenMainCategoryId ?? ""), 10);
  const routeMenMainCategoryId =
    Number.isFinite(parsedRouteMenMainCategoryId) && parsedRouteMenMainCategoryId > 0
      ? parsedRouteMenMainCategoryId
      : null;
  const [resolvedMenMainCategoryId, setResolvedMenMainCategoryId] = useState<number | null>(null);
  const [resolvingMenMainCategoryId, setResolvingMenMainCategoryId] = useState(false);
  const menMainCategoryIdForPtb =
    routeMenMainCategoryId ?? resolvedMenMainCategoryId ?? MEN_PARENT_ID;

  type MenProductsToBuyApiRow = {
    id: number;
    name: string;
    imageUri: string;
    sellingPrice: number | null;
    mrpPrice: number | null;
    discountPercentage: number | null;
    rating: number | null;
    variantId?: number;
  };

  const [menProductsToBuyApi, setMenProductsToBuyApi] = useState<MenProductsToBuyApiRow[]>([]);
  const [menProductsToBuyLoading, setMenProductsToBuyLoading] = useState(false);
  const [menUniqueApi, setMenUniqueApi] = useState<MenProductsToBuyApiRow[]>([]);
  const [menUniqueLoading, setMenUniqueLoading] = useState(false);
  const [menTopCollectionsApi, setMenTopCollectionsApi] = useState<MenProductsToBuyApiRow[]>([]);
  const [menTopCollectionsLoading, setMenTopCollectionsLoading] = useState(false);
  const [menLatestApi, setMenLatestApi] = useState<MenProductsToBuyApiRow[]>([]);
  const [menLatestLoading, setMenLatestLoading] = useState(false);
  const [menMostLovedApi, setMenMostLovedApi] = useState<MenProductsToBuyApiRow[]>([]);
  const [menMostLovedLoading, setMenMostLovedLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistServerKeys, setWishlistServerKeys] = useState<Set<string>>(new Set());
  const [wishlistHasAuth, setWishlistHasAuth] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const menPtbColW = useMemo(
    () => Math.floor((windowWidth - 32 - MEN_PTB_GRID_GAP) / 2),
    [windowWidth]
  );

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

  const mapMenMainCategoryRows = useCallback((rows: unknown[]): MenProductsToBuyApiRow[] => {
    return rows
      .filter((p) => p && typeof (p as any).id === "number" && typeof (p as any).name === "string")
      .map((p) => {
        const imageUri = pickMenPtbProductImageUri(p);
        if (!imageUri) return null;
        const { sellingPrice, mrpPrice, discountPercentage, variantId } = pickMenPtbVariantPricing(p);
        return {
          id: (p as any).id as number,
          name: safeTextMen(String((p as any).name ?? "")),
          imageUri,
          sellingPrice,
          mrpPrice,
          discountPercentage,
          rating: pickMenPtbProductRating(p),
          ...(variantId != null ? { variantId } : {}),
        } satisfies MenProductsToBuyApiRow;
      })
      .filter(Boolean) as MenProductsToBuyApiRow[];
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

  useEffect(() => {
    if (routeMenMainCategoryId != null) {
      setResolvedMenMainCategoryId(null);
      setResolvingMenMainCategoryId(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setResolvingMenMainCategoryId(true);
      try {
        const { data } = await api.get("/api/categories/main");
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as MainCategoryApiRowMen[]) : [];
        const menRow = rows.find((row) => {
          if (!row || typeof row.id !== "number") return false;
          if (typeof row.status === "number" && row.status !== 1) return false;
          const name = String(row.categoryName ?? "")
            .trim()
            .toLowerCase()
            .replace(/['’]/g, "")
            .replace(/\s+/g, " ");
          return (
            name === "men" ||
            name === "mens" ||
            name === "menswear" ||
            name === "mens wear" ||
            name === "men wear"
          );
        });
        setResolvedMenMainCategoryId(
          menRow && Number.isFinite(menRow.id) && menRow.id > 0 ? menRow.id : null
        );
      } catch {
        if (!cancelled) setResolvedMenMainCategoryId(null);
      } finally {
        if (!cancelled) setResolvingMenMainCategoryId(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeMenMainCategoryId]);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setMenProductsToBuyLoading(true);
      try {
        const { data } = await api.get(productsByMainCategoryPath(menMainCategoryIdForPtb), {
          signal: controller.signal,
        });
        if (!Array.isArray(data)) {
          setMenProductsToBuyApi([]);
          return;
        }

        const mapped = mapMenMainCategoryRows(data as unknown[]);

        setMenProductsToBuyApi(mapped);
      } catch {
        setMenProductsToBuyApi([]);
      } finally {
        setMenProductsToBuyLoading(false);
      }
    })();

    return () => controller.abort();
  }, [menMainCategoryIdForPtb, mapMenMainCategoryRows]);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setMenUniqueLoading(true);
      try {
        const { data } = await api.get(
          productsByMainCategoryFeedPath(menMainCategoryIdForPtb, "unique"),
          { signal: c.signal }
        );
        if (!Array.isArray(data)) {
          setMenUniqueApi([]);
          return;
        }
        setMenUniqueApi(mapMenMainCategoryRows(data as unknown[]));
      } catch {
        setMenUniqueApi([]);
      } finally {
        setMenUniqueLoading(false);
      }
    })();
    return () => c.abort();
  }, [menMainCategoryIdForPtb, mapMenMainCategoryRows]);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setMenTopCollectionsLoading(true);
      try {
        const { data } = await api.get(
          productsByMainCategoryFeedPath(menMainCategoryIdForPtb, "top-collections"),
          { signal: c.signal }
        );
        if (!Array.isArray(data)) {
          setMenTopCollectionsApi([]);
          return;
        }
        setMenTopCollectionsApi(mapMenMainCategoryRows(data as unknown[]));
      } catch {
        setMenTopCollectionsApi([]);
      } finally {
        setMenTopCollectionsLoading(false);
      }
    })();
    return () => c.abort();
  }, [menMainCategoryIdForPtb, mapMenMainCategoryRows]);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setMenLatestLoading(true);
      try {
        const { data } = await api.get(
          productsByMainCategoryFeedPath(menMainCategoryIdForPtb, "latest"),
          { signal: c.signal }
        );
        if (!Array.isArray(data)) {
          setMenLatestApi([]);
          return;
        }
        setMenLatestApi(mapMenMainCategoryRows(data as unknown[]));
      } catch {
        setMenLatestApi([]);
      } finally {
        setMenLatestLoading(false);
      }
    })();
    return () => c.abort();
  }, [menMainCategoryIdForPtb, mapMenMainCategoryRows]);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setMenMostLovedLoading(true);
      try {
        const { data } = await api.get(
          productsByMainCategoryFeedPath(menMainCategoryIdForPtb, "recommended"),
          { signal: c.signal }
        );
        if (!Array.isArray(data)) {
          setMenMostLovedApi([]);
          return;
        }
        setMenMostLovedApi(mapMenMainCategoryRows(data as unknown[]));
      } catch {
        setMenMostLovedApi([]);
      } finally {
        setMenMostLovedLoading(false);
      }
    })();
    return () => c.abort();
  }, [menMainCategoryIdForPtb, mapMenMainCategoryRows]);

  const handleToggleWishlistMenPtb = useCallback(
    async (product: {
      id: string;
      name: string;
      sellingNum: number;
      mrpNum: number;
      variantId?: number;
    }) => {
      const r = await togglePtbWishlistWithServer(product, reloadWishlistIds);
      if (r.ok === false) Alert.alert("Wishlist", r.message);
      else Alert.alert(r.title, r.body);
    },
    [reloadWishlistIds]
  );

  const handleAddToCartMenPtb = useCallback(
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
      if (r.ok === false) {
        Alert.alert("Cart", r.message);
        return;
      }
      setCartCount(await getCartUnitCount());
      Alert.alert("Added to cart", product.name);
    },
    []
  );

  const goMenPtbShop = useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "menswear",
        subCategory: "All products",
        mainCategoryId: String(menMainCategoryIdForPtb),
      },
    });
  }, [router, menMainCategoryIdForPtb]);

  const menProductsToBuyUiRows = useMemo(() => {
    const fmtRs = (n: number | null) =>
      n != null && Number.isFinite(n) ? `Rs ${Math.round(n)}` : "";

    if (menProductsToBuyApi.length === 0) {
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

    return menProductsToBuyApi.map((p) => {
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
  }, [menProductsToBuyApi]);
  const menTrendingPreviewRows = useMemo(
    () => menProductsToBuyUiRows.slice(0, 5),
    [menProductsToBuyUiRows]
  );
  const menUniquePreviewRows = useMemo(() => {
    const fmtRs = (n: number | null) =>
      n != null && Number.isFinite(n) ? `Rs ${Math.round(n)}` : "";
    return menUniqueApi.slice(0, 5).map((p) => {
      const showMrp =
        p.mrpPrice != null &&
        p.sellingPrice != null &&
        p.mrpPrice > p.sellingPrice + 0.009;
      const sellingLabel = fmtRs(p.sellingPrice);
      const mrpLabel = showMrp ? fmtRs(p.mrpPrice) : "";
      return {
        id: String(p.id),
        name: p.name,
        imageSource: { uri: p.imageUri } as ImageSourcePropType,
        priceLabel: sellingLabel || mrpLabel,
        subLabel:
          p.discountPercentage != null && Number.isFinite(p.discountPercentage)
            ? `${Number(p.discountPercentage).toFixed(1).replace(/\.0$/, "")}% off`
            : "Rare find",
      };
    });
  }, [menUniqueApi]);
  const menTopCollectionRows = useMemo(() => {
    const top4 = menTopCollectionsApi.slice(0, 4).map((p) => {
      const showMrp =
        p.mrpPrice != null &&
        p.sellingPrice != null &&
        p.mrpPrice > p.sellingPrice + 0.009;
      const discountText =
        p.discountPercentage != null && Number.isFinite(p.discountPercentage)
          ? `${Number(p.discountPercentage).toFixed(1).replace(/\.0$/, "")}% off`
          : "";
      const priceText =
        p.sellingPrice != null && Number.isFinite(p.sellingPrice)
          ? `Rs ${Math.round(p.sellingPrice)}`
          : p.mrpPrice != null && Number.isFinite(p.mrpPrice)
          ? `Rs ${Math.round(p.mrpPrice)}`
          : "";
      return {
        id: String(p.id),
        title: p.name,
        imageSource: { uri: p.imageUri } as ImageSourcePropType,
        count: discountText || (showMrp ? "Featured collection" : priceText || "Featured collection"),
      };
    });
    const rows: typeof top4[] = [];
    for (let i = 0; i < top4.length; i += 2) rows.push(top4.slice(i, i + 2));
    return rows;
  }, [menTopCollectionsApi]);
  const menLatestPreviewRows = useMemo(() => {
    return menLatestApi.slice(0, 4).map((p) => {
      const priceLabel =
        p.sellingPrice != null && Number.isFinite(p.sellingPrice)
          ? `Rs ${Math.round(p.sellingPrice)}`
          : p.mrpPrice != null && Number.isFinite(p.mrpPrice)
          ? `Rs ${Math.round(p.mrpPrice)}`
          : "Rs 0";
      const buyersText =
        p.discountPercentage != null && Number.isFinite(p.discountPercentage)
          ? `${Number(p.discountPercentage).toFixed(1).replace(/\.0$/, "")}% off`
          : "Just arrived";
      return {
        id: String(p.id),
        title: p.name,
        imageSource: { uri: p.imageUri } as ImageSourcePropType,
        priceLabel,
        buyersText,
      };
    });
  }, [menLatestApi]);
  const menMostLovedPreviewRows = useMemo(() => {
    const top4 = menMostLovedApi.slice(0, 4).map((p) => {
      const showMrp =
        p.mrpPrice != null &&
        p.sellingPrice != null &&
        p.mrpPrice > p.sellingPrice + 0.009;
      const subline =
        p.discountPercentage != null && Number.isFinite(p.discountPercentage)
          ? `${Number(p.discountPercentage).toFixed(1).replace(/\.0$/, "")}% off`
          : showMrp
          ? "Loved pick"
          : p.sellingPrice != null && Number.isFinite(p.sellingPrice)
          ? `Rs ${Math.round(p.sellingPrice)}`
          : "Loved pick";
      return {
        id: String(p.id),
        title: p.name,
        imageSource: { uri: p.imageUri } as ImageSourcePropType,
        subline,
      };
    });
    return {
      left: top4.filter((_, i) => i % 2 === 0),
      right: top4.filter((_, i) => i % 2 === 1),
    };
  }, [menMostLovedApi]);

  const [menApiCats, setMenApiCats] = useState<MenSubcategoryApiRow[]>([]);
  const [menApiLoading, setMenApiLoading] = useState<boolean>(true);
  const [menApiError, setMenApiError] = useState<string | null>(null);

  const getUploadsImageUriFromFilename = useCallback((filename?: string | null): string => {
    const raw = String(filename ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!base) return raw;
    return `${base}/uploads/${raw.replace(/^\/+/, "")}`;
  }, []);

  const MEN_BOTTOM_WEAR_TABLE_ID = 54;
  const [bottomWearTable, setBottomWearTable] = useState<MenSubcategoriesTableRow | null>(
    null
  );
  const [bottomWearTableLoading, setBottomWearTableLoading] = useState<boolean>(false);
  const [bottomWearTableError, setBottomWearTableError] = useState<string | null>(null);

  const MEN_ETHNIC_WEAR_TABLE_ID = 57;
  const [ethnicWearTable, setEthnicWearTable] = useState<MenSubcategoriesTableRow | null>(
    null
  );
  const [ethnicWearTableLoading, setEthnicWearTableLoading] = useState<boolean>(false);
  const [ethnicWearTableError, setEthnicWearTableError] = useState<string | null>(null);
  const [menEthnicKurtaSpotlight, setMenEthnicKurtaSpotlight] = useState<MenKurtaPajamaSpotlightRow[]>(
    []
  );
  const [menEthnicKurtaSpotlightLoading, setMenEthnicKurtaSpotlightLoading] = useState(false);

  const MEN_FORMAL_WEAR_TABLE_ID = 58;
  const [formalWearTable, setFormalWearTable] = useState<MenSubcategoriesTableRow | null>(
    null
  );
  const [formalWearTableLoading, setFormalWearTableLoading] = useState<boolean>(false);
  const [formalWearTableError, setFormalWearTableError] = useState<string | null>(null);

  const MEN_INNERWEAR_NIGHTWEAR_TABLE_ID = 59;
  const [innerWearTable, setInnerWearTable] = useState<MenSubcategoriesTableRow | null>(
    null
  );
  const [innerWearTableLoading, setInnerWearTableLoading] = useState<boolean>(false);
  const [innerWearTableError, setInnerWearTableError] = useState<string | null>(null);

  const MEN_TOP_WEAR_TABLE_ID = 52;
  const [topWearTable, setTopWearTable] = useState<MenSubcategoriesTableRow | null>(null);
  const [topWearTableLoading, setTopWearTableLoading] = useState<boolean>(false);
  const [topWearTableError, setTopWearTableError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMenApiLoading(true);
        setMenApiError(null);
        const { data: rows } = await api.get(
          `/api/categories/${MEN_PARENT_ID}/subcategories`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as MenSubcategoryApiRow[]) : [];
        if (cancelled) return;
        setMenApiCats(list);
      } catch (e: any) {
        if (cancelled) return;
        setMenApiCats([]);
        setMenApiError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load men categories"
        );
      } finally {
        if (cancelled) return;
        setMenApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setBottomWearTableLoading(true);
        setBottomWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${MEN_BOTTOM_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as MenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setBottomWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setBottomWearTable(null);
        setBottomWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Bottom Wear subcategories"
        );
      } finally {
        if (cancelled) return;
        setBottomWearTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setEthnicWearTableLoading(true);
        setEthnicWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${MEN_ETHNIC_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as MenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setEthnicWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setEthnicWearTable(null);
        setEthnicWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Ethnic Wear subcategories"
        );
      } finally {
        if (cancelled) return;
        setEthnicWearTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setFormalWearTableLoading(true);
        setFormalWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${MEN_FORMAL_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as MenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setFormalWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setFormalWearTable(null);
        setFormalWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Formal Wear subcategories"
        );
      } finally {
        if (cancelled) return;
        setFormalWearTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setInnerWearTableLoading(true);
        setInnerWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${MEN_INNERWEAR_NIGHTWEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as MenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setInnerWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setInnerWearTable(null);
        setInnerWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Innerwear & Nightwear subcategories"
        );
      } finally {
        if (cancelled) return;
        setInnerWearTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setTopWearTableLoading(true);
        setTopWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${MEN_TOP_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as MenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setTopWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setTopWearTable(null);
        setTopWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Top Wear subcategories"
        );
      } finally {
        if (cancelled) return;
        setTopWearTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const menCategoriesForUi = useMemo(() => {
    const apiActive = menApiCats.filter((r) =>
      typeof r.status === "number" ? r.status === 1 : true
    );
    if (!apiActive.length) return MEN_CATEGORIES;

    const byName = new Map(
      apiActive.map((r) => [String(r.categoryName ?? "").trim().toLowerCase(), r])
    );

    // Keep existing structure (subs/tags/colors) but update title + image from API when available.
    return MEN_CATEGORIES.map((block) => {
      const row = byName.get(String(block.title).trim().toLowerCase());
      if (!row) return block;
      const title = String(row.categoryName ?? block.title).trim() || block.title;
      const shopImage = row.mobileImage
        ? ({ uri: row.mobileImage } as any)
        : row.image
          ? ({ uri: getUploadsImageUriFromFilename(row.image) } as any)
          : block.shopImage;
      return { ...block, title, shopImage };
    });
  }, [getUploadsImageUriFromFilename, menApiCats]);

  // If a category key becomes invalid (future changes), keep selection safe.
  useEffect(() => {
    if (menCategoriesForUi.some((c) => c.key === selectedKey)) return;
    setSelectedKey(menCategoriesForUi[0]?.key ?? MEN_CATEGORIES[0].key);
  }, [menCategoriesForUi, selectedKey]);

  const bannerSlideWidth =
    windowWidth - MEN_SECTION_SCREEN_INSET - FC_BANNER_SIDE_PAD * 2;

  const activeBlock = useMemo(
    () =>
      menCategoriesForUi.find((c) => c.key === selectedKey) ?? menCategoriesForUi[0],
    [menCategoriesForUi, selectedKey]
  );

  const bottomBlock = useMemo(
    () => menCategoriesForUi.find((c) => c.key === "bottom") ?? MEN_CATEGORIES[0],
    [menCategoriesForUi]
  );

  const bottomRailSubs = useMemo((): SubLabel[] => {
    if (bottomWearTable?.subcategories?.length) {
      return bottomWearTable.subcategories.map((s) => ({
        id: `api-bottom-${s.id}`,
        label: s.name,
        subcategoryId: s.id,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
      }));
    }
    return bottomBlock.subs;
  }, [bottomBlock.subs, bottomWearTable, getUploadsImageUriFromFilename]);

  const ethnicBlock = useMemo(
    () =>
      menCategoriesForUi.find((c) => c.key === "ethnic") ??
      MEN_CATEGORIES.find((c) => c.key === "ethnic") ??
      MEN_CATEGORIES[0],
    [menCategoriesForUi]
  );

  const ethnicRailSubs = useMemo((): SubLabel[] => {
    if (ethnicWearTable?.subcategories?.length) {
      return ethnicWearTable.subcategories.map((s) => ({
        id: `api-ethnic-${s.id}`,
        label: s.name,
        subcategoryId: s.id,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
      }));
    }
    return ethnicBlock.subs.map((s) => {
      const sid = menEthnicFallbackSubcategoryIdForLabel(s.label);
      return sid != null ? { ...s, subcategoryId: sid } : s;
    });
  }, [ethnicBlock.subs, ethnicWearTable, getUploadsImageUriFromFilename]);

  const formalBlock = useMemo(
    () =>
      menCategoriesForUi.find((c) => c.key === "formal") ??
      MEN_CATEGORIES.find((c) => c.key === "formal") ??
      MEN_CATEGORIES[0],
    [menCategoriesForUi]
  );

  const formalRailSubs = useMemo((): SubLabel[] => {
    if (formalWearTable?.subcategories?.length) {
      return formalWearTable.subcategories.map((s) => ({
        id: `api-formal-${s.id}`,
        label: s.name,
        subcategoryId: s.id,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
      }));
    }
    return formalBlock.subs;
  }, [formalBlock.subs, formalWearTable, getUploadsImageUriFromFilename]);

  const innerBlock = useMemo(
    () =>
      menCategoriesForUi.find((c) => c.key === "inner") ??
      MEN_CATEGORIES.find((c) => c.key === "inner") ??
      MEN_CATEGORIES[0],
    [menCategoriesForUi]
  );

  const innerRailSubs = useMemo((): SubLabel[] => {
    if (innerWearTable?.subcategories?.length) {
      return innerWearTable.subcategories.map((s) => ({
        id: `api-inner-${s.id}`,
        label: s.name,
        subcategoryId: s.id,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
      }));
    }
    return innerBlock.subs;
  }, [getUploadsImageUriFromFilename, innerBlock.subs, innerWearTable]);

  const topBlock = useMemo(
    () =>
      menCategoriesForUi.find((c) => c.key === "top") ??
      MEN_CATEGORIES.find((c) => c.key === "top") ??
      MEN_CATEGORIES[0],
    [menCategoriesForUi]
  );

  const topRailSubs = useMemo((): SubLabel[] => {
    if (topWearTable?.subcategories?.length) {
      return topWearTable.subcategories.map((s) => ({
        id: `api-top-${s.id}`,
        label: s.name,
        subcategoryId: s.id,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
      }));
    }
    return topBlock.subs;
  }, [getUploadsImageUriFromFilename, topBlock.subs, topWearTable]);

  const activeRailSubs = useMemo((): SubLabel[] => {
    if (activeBlock.key === "bottom") return bottomRailSubs;
    if (activeBlock.key === "ethnic") return ethnicRailSubs;
    if (activeBlock.key === "formal") return formalRailSubs;
    if (activeBlock.key === "inner") return innerRailSubs;
    if (activeBlock.key === "top") return topRailSubs;
    return activeBlock.subs;
  }, [
    activeBlock.key,
    activeBlock.subs,
    bottomRailSubs,
    ethnicRailSubs,
    formalRailSubs,
    innerRailSubs,
    topRailSubs,
  ]);

  const allMenSubItems = useMemo(
    () =>
      menCategoriesForUi.flatMap((cat) => {
        const subs =
          cat.key === "bottom"
            ? bottomRailSubs
            : cat.key === "ethnic"
              ? ethnicRailSubs
              : cat.key === "formal"
                ? formalRailSubs
                : cat.key === "inner"
                  ? innerRailSubs
                  : cat.key === "top"
                    ? topRailSubs
                    : cat.subs;
        return subs.map((s) => ({
          flatId: `${cat.key}-${s.id}`,
          label: s.label,
          image: (s.image ?? cat.shopImage) as ImageSourcePropType,
          deptKey: cat.key,
          deptTitle: cat.title,
          deptColor: cat.railTo,
        }));
      }),
    [bottomRailSubs, ethnicRailSubs, formalRailSubs, innerRailSubs, topRailSubs, menCategoriesForUi]
  );

  /** First paint for table-backed departments: wait for subcategories-table before showing rail tiles. */
  const menDeptRailAwaitingTable = useMemo(() => {
    if (activeBlock.key === "bottom") return bottomWearTableLoading && !bottomWearTable;
    if (activeBlock.key === "ethnic") return ethnicWearTableLoading && !ethnicWearTable;
    if (activeBlock.key === "formal") return formalWearTableLoading && !formalWearTable;
    if (activeBlock.key === "inner") return innerWearTableLoading && !innerWearTable;
    if (activeBlock.key === "top") return topWearTableLoading && !topWearTable;
    return false;
  }, [
    activeBlock.key,
    bottomWearTable,
    bottomWearTableLoading,
    ethnicWearTable,
    ethnicWearTableLoading,
    formalWearTable,
    formalWearTableLoading,
    innerWearTable,
    innerWearTableLoading,
    topWearTable,
    topWearTableLoading,
  ]);

  const menDeptRailTableErrorText = useMemo(() => {
    if (activeBlock.key === "bottom")
      return !bottomWearTableLoading ? bottomWearTableError : null;
    if (activeBlock.key === "ethnic")
      return !ethnicWearTableLoading ? ethnicWearTableError : null;
    if (activeBlock.key === "formal")
      return !formalWearTableLoading ? formalWearTableError : null;
    if (activeBlock.key === "inner")
      return !innerWearTableLoading ? innerWearTableError : null;
    if (activeBlock.key === "top")
      return !topWearTableLoading ? topWearTableError : null;
    return null;
  }, [
    activeBlock.key,
    bottomWearTableLoading,
    bottomWearTableError,
    ethnicWearTableLoading,
    ethnicWearTableError,
    formalWearTableLoading,
    formalWearTableError,
    innerWearTableLoading,
    innerWearTableError,
    topWearTableLoading,
    topWearTableError,
  ]);

  /** Grid: exactly two products per row. */
  const shopAllGridRows = useMemo(() => {
    const rows: (typeof allMenSubItems)[] = [];
    for (let i = 0; i < allMenSubItems.length; i += 2) {
      rows.push(allMenSubItems.slice(i, i + 2));
    }
    return rows;
  }, [allMenSubItems]);

  const scrollToRails = useCallback(() => {
    const y = shopSubsCardLayoutY.current + railBlockLayoutY.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        mainScrollRef.current?.scrollTo({
          y: Math.max(0, y - 6),
          animated: true,
        });
      });
    });
  }, []);

  const onSelectShopCategory = useCallback(
    (key: string) => {
      setSelectedKey(key);
      scrollToRails();
    },
    [scrollToRails]
  );

  const kurtaPajamaListingLabel = useMemo(() => {
    const hit = ethnicWearTable?.subcategories?.find(
      (s) => s.id === MEN_KURTA_PAJAMA_SUBCATEGORY_ID
    );
    return (hit?.name ?? "").trim() || "Kurta & Pajama";
  }, [ethnicWearTable]);

  useEffect(() => {
    if (selectedKey !== "ethnic") return;
    let cancelled = false;
    (async () => {
      try {
        setMenEthnicKurtaSpotlightLoading(true);
        const { data } = await api.get(productsBySubcategoryPath(MEN_KURTA_PAJAMA_SUBCATEGORY_ID), {
          timeout: 15000,
        });
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setMenEthnicKurtaSpotlight([]);
          return;
        }
        const byId = new Map<string, MenKurtaPajamaSpotlightRow>();
        for (const row of data as unknown[]) {
          const mapped = mapMenApiProductToKurtaPajamaSpotlight(row);
          if (mapped && !byId.has(mapped.id)) byId.set(mapped.id, mapped);
        }
        setMenEthnicKurtaSpotlight([...byId.values()]);
      } catch {
        if (!cancelled) setMenEthnicKurtaSpotlight([]);
      } finally {
        if (!cancelled) setMenEthnicKurtaSpotlightLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedKey]);

  const openMenSubcategoryProducts = useCallback(
    (subCategoryLabel: string, subcategoryId?: number | null) => {
      const trimmed = String(subCategoryLabel ?? "").trim();
      if (!trimmed) return;
      router.push({
        pathname: "/subcatProducts",
        params: {
          mainCat: "menswear",
          subCategory: trimmed,
          ...(subcategoryId != null && Number.isFinite(subcategoryId) && subcategoryId > 0
            ? { subcategoryId: String(subcategoryId) }
            : {}),
        },
      } as any);
    },
    [router]
  );

  const goMenSpotlightShop = useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "menswear",
        subCategory: "Men spotlight",
        mainCategoryId: String(menMainCategoryIdForPtb),
        mainCategoryFeed: "spotlight",
      },
    });
  }, [router, menMainCategoryIdForPtb]);

  const goMenUniqueShop = useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "menswear",
        subCategory: "Unique picks",
        mainCategoryId: String(menMainCategoryIdForPtb),
        mainCategoryFeed: "unique",
      },
    });
  }, [router, menMainCategoryIdForPtb]);

  const goMenTopCollectionsShop = useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "menswear",
        subCategory: "Top collections",
        mainCategoryId: String(menMainCategoryIdForPtb),
        mainCategoryFeed: "top-collections",
      },
    });
  }, [router, menMainCategoryIdForPtb]);

  const goMenLatestShop = useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "menswear",
        subCategory: "Bought again & again",
        mainCategoryId: String(menMainCategoryIdForPtb),
        mainCategoryFeed: "latest",
      },
    });
  }, [router, menMainCategoryIdForPtb]);

  const goMenMostLovedShop = useCallback(() => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "menswear",
        subCategory: "Most loved",
        mainCategoryId: String(menMainCategoryIdForPtb),
        mainCategoryFeed: "recommended",
      },
    });
  }, [router, menMainCategoryIdForPtb]);

  const onBannerScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / Math.max(1, bannerSlideWidth));
      const clamped = Math.max(0, Math.min(i, FC_BANNERS.length - 1));
      setBannerIndex(clamped);
    },
    [bannerSlideWidth]
  );

  useEffect(() => {
    if (FC_BANNERS.length <= 1 || bannerSlideWidth < 40) return;
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % FC_BANNERS.length;
        bannerScrollRef.current?.scrollTo({
          x: next * bannerSlideWidth,
          animated: true,
        });
        return next;
      });
    }, FC_BANNER_AUTO_MS);
    return () => clearInterval(id);
  }, [bannerSlideWidth]);

  /** List mode: auto-scroll one tile each second, ping‑pong (L→R then R→L). */
  useEffect(() => {
    if (shopAllLayout !== "list") return;
    const n = allMenSubItems.length;
    if (n <= 1) return;
    const id = setInterval(() => {
      const cur = shopAllScrollIndexRef.current;
      let next = cur + shopAllScrollDirRef.current;
      if (next >= n) {
        shopAllScrollDirRef.current = -1;
        next = Math.max(0, n - 2);
      } else if (next < 0) {
        shopAllScrollDirRef.current = 1;
        next = Math.min(n - 1, 1);
      }
      shopAllScrollIndexRef.current = next;
      shopAllScrollRef.current?.scrollTo({
        x: next * SHOP_ALL_LIST_STEP,
        animated: true,
      });
    }, SHOP_ALL_AUTO_MS);
    return () => clearInterval(id);
  }, [shopAllLayout, allMenSubItems.length]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#fffefb", "#faf7f3", "#f5f1eb"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.menStickyHeader, { paddingTop: insets.top + 8 }]}
      >
        <LinearGradient
          colors={["transparent", hexToRgba("#ef7b1a", 0.07), "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.menHeaderAccentWash}
          pointerEvents="none"
        />
        <View style={styles.menHeaderRow}>
          <TouchableOpacity
            style={styles.menLogoHit}
            onPress={() => router.replace("/home")}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <View style={styles.menLogoTile}>
              <Image
                source={HEADER_FT_LOGO}
                style={styles.menLogoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.menSearchPill}>
            <TouchableOpacity
              style={styles.menSearchMain}
              onPress={() => router.push("/searchresults")}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={19} color="#64748b" />
              <Text style={styles.menSearchPlaceholder}>Search..</Text>
            </TouchableOpacity>
                      </View>

          <View style={styles.menHeaderIconGroup}>
            <TouchableOpacity
              style={styles.menHeaderIconHit}
              onPress={() => router.push("/wishlist")}
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
            >
              <View style={styles.menHeaderIconBadgeWrap}>
                <Ionicons name="heart-outline" size={24} color="#c2410c" />
                {(wishlistHasAuth ? wishlistServerKeys.size : wishlistIds.size) > 0 ? (
                  <View style={styles.menHeaderIconBadge}>
                    <Text style={styles.menHeaderIconBadgeText}>
                      {(wishlistHasAuth ? wishlistServerKeys.size : wishlistIds.size) > 99
                        ? "99+"
                        : String(
                            wishlistHasAuth ? wishlistServerKeys.size : wishlistIds.size
                          )}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
                      </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.heroWrap}>
          <Image source={MEN_HERO_BANNER_IMAGE} style={styles.heroImage} resizeMode="cover" />
        </View>

        <LinearGradient
          key={activeBlock.key}
          colors={["#e8edf4", "#f3f6fa", "#faf7f4"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shopSubsUnifiedCard}
          onLayout={(e) => {
            shopSubsCardLayoutY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.shopSubsCardInner}>
            <View style={styles.shopCategoryHead}>
              <View style={styles.shopCategoryHeadAccent} />
              <View style={styles.shopCategoryHeadText}>
                <Text style={styles.sectionLabel}>Shop by category</Text>
                <Text style={styles.sectionLabelHint}>
                  Tap to filter · one department at a time
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickStrip}
              nestedScrollEnabled
            >
              {menApiLoading ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                  <ActivityIndicator size="small" color="#ef7b1a" />
                </View>
              ) : null}
              {!menApiLoading && menApiError ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, maxWidth: 260 }}>
                  <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }} numberOfLines={2}>
                    {menApiError}
                  </Text>
                </View>
              ) : null}

              {menCategoriesForUi.map((c) => {
                const selected = c.key === selectedKey;
                const clipId = `menHex-${c.key}`;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={styles.quickItem}
                    activeOpacity={0.85}
                    onPress={() => onSelectShopCategory(c.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Show only ${c.title} subcategories`}
                    accessibilityState={{ selected }}
                  >
                    <View
                      style={[
                        styles.quickHexShadow,
                        selected && styles.quickHexShadowSelected,
                      ]}
                    >
                      <HexagonShopBadge
                        source={c.shopImage}
                        clipId={clipId}
                        selected={selected}
                      />
                    </View>
                    <Text
                      style={[styles.quickHexLabel, selected && styles.quickHexLabelSelected]}
                      numberOfLines={2}
                    >
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.shopSubsDividerWrap}>
              <View style={styles.shopSubsDividerLine} />
              <Text style={styles.shopSubsDividerLabel}>Sub-styles</Text>
              <View style={styles.shopSubsDividerLine} />
            </View>

            <View
              style={styles.railSectionInner}
              onLayout={(e) => {
                railBlockLayoutY.current = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.railSectionHead}>
                <View style={styles.railHeadLead}>
                  <View style={[styles.railAccentBar, { backgroundColor: activeBlock.railTo }]} />
                  <View style={styles.railHeadTextCol}>
                    <Text style={styles.railKicker}>Browse types</Text>
                    <Text style={styles.railTitle}>{activeBlock.title}</Text>
                    <Text style={styles.railTag}>{activeBlock.tag}</Text>
                  </View>
                </View>
                <View style={[styles.railDot, { backgroundColor: activeBlock.railTo }]} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.railScroll}
                nestedScrollEnabled
              >
                {menDeptRailAwaitingTable ? (
                  <View style={{ paddingVertical: 18, paddingHorizontal: 8, justifyContent: "center" }}>
                    <ActivityIndicator size="small" color={activeBlock.railTo} />
                  </View>
                ) : null}
                {menDeptRailTableErrorText ? (
                  <View style={{ paddingVertical: 10, paddingHorizontal: 8, maxWidth: 280 }}>
                    <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }} numberOfLines={3}>
                      {menDeptRailTableErrorText}
                    </Text>
                  </View>
                ) : null}
                {(menDeptRailAwaitingTable ? [] : activeRailSubs).map((s) => {
                  const tileImage = s.image ?? activeBlock.shopImage;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.railCard}
                      activeOpacity={0.88}
                      onPress={() => openMenSubcategoryProducts(s.label, s.subcategoryId)}
                      accessibilityRole="button"
                      accessibilityLabel={`${tr("Shop")} ${tr(s.label)}`}
                    >
                      <View style={styles.railCardArt}>
                        <Image
                          source={tileImage}
                          style={styles.railCardImage}
                          resizeMode="cover"
                          accessibilityIgnoresInvertColors
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(15,23,42,0.55)"]}
                          locations={[0.4, 1]}
                          style={styles.railCardImageFade}
                        />
                        <View
                          style={[
                            styles.railCardTintBar,
                            { backgroundColor: activeBlock.railTo },
                          ]}
                        />
                      </View>
                      <View style={styles.railCardBody}>
                        <Text style={styles.railCardLabel} numberOfLines={2}>
                          {tr(s.label)}
                        </Text>
                        <Text style={styles.railCardHint}>Tap to shop</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedKey === "ethnic" ? (
                <View style={styles.menEthnicKurtaSpotlightSection}>
                  <View style={styles.menEthnicKurtaSpotlightHeaderRow}>
                    <Text style={styles.menEthnicKurtaSpotlightTitle}>Kurta & Pajama — shop picks</Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() =>
                        openMenSubcategoryProducts(
                          kurtaPajamaListingLabel,
                          MEN_KURTA_PAJAMA_SUBCATEGORY_ID
                        )
                      }
                    >
                      <Text style={styles.menEthnicKurtaSpotlightViewAll}>View all</Text>
                    </TouchableOpacity>
                  </View>
                  {menEthnicKurtaSpotlightLoading ? (
                    <Text style={styles.menEthnicKurtaSpotlightLoadingHint}>Loading picks…</Text>
                  ) : null}
                  <View style={styles.menEthnicKurtaSpotlightGrid}>
                    {menEthnicKurtaSpotlight.map((product) => {
                      const showMrp = product.mrpPrice > product.sellingPrice + 0.009;
                      return (
                        <TouchableOpacity
                          key={product.id}
                          style={styles.menEthnicKurtaSpotlightCard}
                          activeOpacity={0.9}
                          onPress={() =>
                            router.push({
                              pathname: "/productdetail",
                              params: { id: product.id },
                            } as any)
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`${tr(product.name)}, ${tr("view details")}`}
                        >
                          <View style={styles.menEthnicKurtaSpotlightInner}>
                            <Image
                              source={{ uri: product.imageUri }}
                              style={styles.menEthnicKurtaSpotlightImage}
                            />
                            <View style={styles.menEthnicKurtaSpotlightMeta}>
                              <Text style={styles.menEthnicKurtaSpotlightName} numberOfLines={2}>
                                {tr(product.name)}
                              </Text>
                              <View style={styles.menEthnicKurtaSpotlightPriceRow}>
                                <Text style={styles.menEthnicKurtaSpotlightPrice}>
                                  Rs {product.sellingPrice}
                                </Text>
                                {product.discountLabel ? (
                                  <View style={styles.menEthnicKurtaSpotlightDiscountPill}>
                                    <Text style={styles.menEthnicKurtaSpotlightDiscountText}>
                                      {product.discountLabel}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              {showMrp ? (
                                <Text style={styles.menEthnicKurtaSpotlightMrp}>
                                  MRP Rs {product.mrpPrice}
                                </Text>
                              ) : null}
                              <View style={styles.menEthnicKurtaSpotlightBottomRow}>
                                <View style={{ flex: 1 }} />
                                <View style={styles.menEthnicKurtaSpotlightRatingPill}>
                                  <Ionicons name="star" size={12} color="#c2410c" />
                                  <Text style={styles.menEthnicKurtaSpotlightRatingText}>
                                    {product.ratingLabel}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {!menEthnicKurtaSpotlightLoading && menEthnicKurtaSpotlight.length === 0 ? (
                    <Text style={styles.menEthnicKurtaSpotlightEmpty}>No kurta & pajama picks yet.</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.fcWrap}>
          {/* 1 — Trending picks */}
          <MenStoreSection>
            <View style={styles.menPtbHeaderRow}>
              <MenSectionHead
                accent={activeBlock.railTo}
                title="Trending picks"
                sub="What everyone is adding to bag"
                
              />
              <TouchableOpacity onPress={goMenPtbShop} activeOpacity={0.85}>
                <Text style={styles.menPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {menProductsToBuyLoading && menTrendingPreviewRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>Loading products...</Text>
            ) : menTrendingPreviewRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>No products found.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fcRow}
                nestedScrollEnabled
              >
              {menTrendingPreviewRows.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.fcTrendOuter}
                  activeOpacity={0.94}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}`}
                  onPress={() =>
                    router.push({
                      pathname: "/productdetail",
                      params: { id: String(p.id) },
                    } as any)
                  }
                >
                  <View style={styles.fcTrendStack}>
                    <LinearGradient
                      colors={["#ffffff", "#f1f5f9"]}
                      style={styles.fcTrendPhotoShell}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    >
                      <View
                        style={[
                          styles.fcTrendImageArch,
                          idx % 2 === 0 ? styles.fcTrendArchVariantA : styles.fcTrendArchVariantB,
                        ]}
                      >
                        <Image source={p.imageSource} style={styles.fcTrendImg} resizeMode="cover" />
                        <LinearGradient
                          colors={["transparent", "rgba(15,23,42,0.08)", "rgba(15,23,42,0.55)"]}
                          locations={[0, 0.55, 1]}
                          style={styles.fcTrendFade}
                          pointerEvents="none"
                        />
                        <View style={[styles.fcTrendTag, { backgroundColor: activeBlock.railTo }]}>
                          <Text style={styles.fcTrendTagText}>Trending</Text>
                        </View>
                      </View>
                    </LinearGradient>
                    <View
                      style={[
                        styles.fcTrendBodySheet,
                        { borderColor: hexToRgba(activeBlock.railTo, 0.18) },
                      ]}
                    >
                      <View style={[styles.fcTrendBodyAccent, { backgroundColor: activeBlock.railTo }]} />
                      <Text style={styles.fcTrendTitle} numberOfLines={2}>
                        {p.name}
                      </Text>
                      <Text style={[styles.fcTrendPrice, { color: activeBlock.railTo }]}>
                        {p.sellingLabel || p.mrpLabel}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            )}
          </MenStoreSection>

          {/* 2 — Men spotlight */}
          <MenStoreSection>
            <MenSectionHead
              accent="#f59e0b"
              title="Men spotlight"
              sub="Hero edit · refreshed weekly"
              icon="star"
              iconColor="#f59e0b"
            />
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={goMenSpotlightShop}
              accessibilityRole="button"
              accessibilityLabel="Open men spotlight products"
            >
            <View style={[styles.fcSpotlight, { borderColor: hexToRgba(activeBlock.railTo, 0.35) }]}>
              <Image source={MEN_HERO_BANNER_IMAGE} style={styles.fcSpotlightImg} resizeMode="cover" />
              <LinearGradient
                colors={["rgba(15,23,42,0.08)", "rgba(15,23,42,0.45)", "rgba(15,23,42,0.92)"]}
                locations={[0, 0.45, 1]}
                style={styles.fcSpotlightFade}
              />
              <View style={styles.fcSpotlightTopBadge} pointerEvents="none">
                <Ionicons name="sparkles" size={15} color="#44403c" />
                <Text style={styles.fcSpotlightTopBadgeText}>Editor&apos;s picks</Text>
              </View>
              <View style={styles.fcSpotlightStars} pointerEvents="none">
                <Text style={[styles.fcSpotlightStar, { fontSize: 14 }]}>★</Text>
                <Text style={[styles.fcSpotlightStar, { fontSize: 20, marginTop: -6 }]}>★</Text>
                <Text style={[styles.fcSpotlightStar, { fontSize: 11 }]}>★</Text>
              </View>
              <View style={styles.fcSpotlightCopy}>
                <View style={styles.fcSpotlightGuidePill}>
                  <Text style={styles.fcSpotlightGuideText}>MEN&apos;S STYLE GUIDE</Text>
                </View>
                <Text style={styles.fcSpotlightHead}>The season&apos;s standout edit</Text>
                <Text style={styles.fcSpotlightSub}>
                  Tailoring meets everyday ease — build your look in one place.
                </Text>
                <TouchableOpacity
                  style={styles.fcSpotlightCta}
                  onPress={goMenSpotlightShop}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Shop the men spotlight edit"
                >
                  <Text style={styles.fcSpotlightCtaText}>Shop the edit</Text>
                </TouchableOpacity>
              </View>
            </View>
            </TouchableOpacity>
          </MenStoreSection>

          {/* 3 — Unique picks */}
          <MenStoreSection>
            <View style={styles.menPtbHeaderRow}>
              <MenSectionHead
                accent="#8b5cf6"
                title="Unique picks"
                sub="Rare finds & small runs"
               
              />
              <TouchableOpacity onPress={goMenUniqueShop} activeOpacity={0.85}>
                <Text style={styles.menPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {menUniqueLoading && menUniquePreviewRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>Loading products...</Text>
            ) : menUniquePreviewRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>No products found.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fcUniqueRow}
                nestedScrollEnabled
              >
              {menUniquePreviewRows.map((u, idx) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.fcUniqueOuter}
                  activeOpacity={0.93}
                  accessibilityRole="button"
                  accessibilityLabel={`${u.name}. ${u.subLabel}`}
                  onPress={() =>
                    router.push({
                      pathname: "/productdetail",
                      params: { id: String(u.id) },
                    } as any)
                  }
                >
                  <View
                    style={[
                      styles.fcUniqueMagazine,
                      idx % 2 === 0 ? styles.fcUniqueShapeA : styles.fcUniqueShapeB,
                    ]}
                  >
                    <Image source={u.imageSource} style={styles.fcUniquePhoto} resizeMode="cover" />
                    <LinearGradient
                      colors={["rgba(15,23,42,0)", "rgba(15,23,42,0.18)", "rgba(15,23,42,0.5)"]}
                      locations={[0, 0.45, 1]}
                      style={styles.fcUniqueVignette}
                      pointerEvents="none"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(76,29,149,0.75)", "rgba(30,27,75,0.96)"]}
                      locations={[0.25, 0.65, 1]}
                      style={styles.fcUniqueReadBand}
                      pointerEvents="none"
                    />
                    <View style={styles.fcUniqueChip}>
                      <Ionicons name="diamond-outline" size={13} color="#6d28d9" />
                      <Text style={styles.fcUniqueChipText}>Rare find</Text>
                    </View>
                    <View style={styles.fcUniqueCopy}>
                      <Text style={styles.fcUniqueTitleMag} numberOfLines={2}>
                        {u.name}
                      </Text>
                      <Text style={styles.fcUniqueSubMag} numberOfLines={2}>
                        {u.subLabel || u.priceLabel}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            )}
          </MenStoreSection>

          {/* 4 — Banners (auto-advancing carousel) */}
          <MenStoreSection>
            <MenSectionHead
              accent="#ef4444"
              title="Offers & banners"
              sub="Campaigns & deals · auto scroll"
            />
            <View
              style={[styles.fcBannerCarousel, { paddingHorizontal: FC_BANNER_SIDE_PAD }]}
            >
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              decelerationRate="fast"
              onMomentumScrollEnd={onBannerScrollEnd}
              onScrollEndDrag={onBannerScrollEnd}
              scrollEventThrottle={16}
            >
              {FC_BANNERS.map((b) => (
                <View
                  key={b.key}
                  style={[styles.fcBannerPage, { width: bannerSlideWidth }]}
                >
                  <TouchableOpacity
                    style={[styles.fcBannerShell, { width: bannerSlideWidth - 20 }]}
                    activeOpacity={0.94}
                    onPress={() => router.push("/categories")}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.line1}. ${b.line2}. ${b.cta}`}
                  >
                    <LinearGradient
                      colors={[b.from, b.to]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.fcBannerFace}
                    >
                      <View style={[styles.fcBannerGlowOrb, styles.fcBannerGlowOrbTop]} pointerEvents="none" />
                      <View style={[styles.fcBannerGlowOrb, styles.fcBannerGlowOrbBottom]} pointerEvents="none" />
                      <LinearGradient
                        colors={["rgba(255,255,255,0.28)", "transparent", "rgba(0,0,0,0.08)"]}
                        locations={[0, 0.35, 1]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={styles.fcBannerSurfaceSheen}
                        pointerEvents="none"
                      />
                      <View style={styles.fcBannerTopStrip}>
                        <View style={styles.fcBannerDealPill}>
                          <Ionicons name="pricetag" size={13} color="rgba(255,255,255,0.95)" />
                          <Text style={styles.fcBannerDealPillText}>{b.badge}</Text>
                        </View>
                        <View style={styles.fcBannerSparkRow} pointerEvents="none">
                          <Ionicons name="flash" size={16} color="rgba(254,240,138,0.95)" />
                        </View>
                      </View>
                      <View style={styles.fcBannerCopyBlock}>
                        <Text style={styles.fcBannerLine1}>{b.line1}</Text>
                        <Text style={styles.fcBannerLine2}>{b.line2}</Text>
                        <View style={styles.fcBannerCtaSolid}>
                          <Text style={[styles.fcBannerCtaSolidText, { color: b.from }]}>
                            {b.cta}
                          </Text>
                          <Ionicons name="arrow-forward-circle" size={22} color={b.from} />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <View style={styles.fcBannerDots}>
              {FC_BANNERS.map((b, i) => (
                <View
                  key={b.key}
                  style={[
                    styles.fcBannerDot,
                    i === bannerIndex && styles.fcBannerDotActiveWrap,
                  ]}
                >
                  {i === bannerIndex ? (
                    <LinearGradient
                      colors={[activeBlock.railTo, hexToRgba(activeBlock.railTo, 0.65)]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.fcBannerDotActiveFill}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
          </MenStoreSection>

          {/* 5 — Top collections (2 per row) */}
          <MenStoreSection>
            <View style={styles.menPtbHeaderRow}>
              <MenSectionHead
                accent={activeBlock.railTo}
                title="Top collections"
                sub="Curated rails by occasion"
                
              />
              <TouchableOpacity onPress={goMenTopCollectionsShop} activeOpacity={0.85}>
                <Text style={styles.menPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {menTopCollectionsLoading && menTopCollectionRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>Loading products...</Text>
            ) : menTopCollectionRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>No products found.</Text>
            ) : (
            <View style={styles.fcCollGrid}>
            {menTopCollectionRows.map((row, ri) => (
              <View key={`coll-row-${ri}`} style={styles.fcCollRow}>
                {row.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/productdetail",
                        params: { id: String(c.id) },
                      } as any)
                    }
                    style={[
                      styles.fcCollCard,
                      { borderColor: hexToRgba(activeBlock.railTo, 0.22) },
                    ]}
                  >
                    <View style={styles.fcCollImgBox}>
                      <Image source={c.imageSource} style={styles.fcCollImg} resizeMode="cover" />
                      <LinearGradient
                        colors={["transparent", "rgba(15,23,42,0.75)"]}
                        style={styles.fcCollFade}
                      />
                      <Text style={styles.fcCollTitle}>{c.title}</Text>
                      <Text style={styles.fcCollCount}>{c.count}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          )}
          </MenStoreSection>

          {/* 6 — Shop all men sub categories (grid / list + auto-scroll list) */}
          <MenStoreSection>
            <LinearGradient
              colors={["#fafafa", "#f4f4f5", "#f1f5f9"]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shopAllHeroStrip}
            >
              <View style={styles.shopAllSectionHead}>
                <View style={styles.shopAllHeadLead}>
                  <View style={styles.shopAllIconBadge}>
                    <Ionicons name="storefront-outline" size={22} color="#ea580c" />
                  </View>
                  <View style={styles.fcHeadText}>
                    <View style={styles.shopAllTitleRow}>
                      <Text style={styles.shopAllTitle}>Browse all types</Text>
                      <View style={styles.shopAllLivePill}>
                        <View style={styles.shopAllLiveDot} />
                        <Text style={styles.shopAllLiveText}>Live</Text>
                      </View>
                    </View>
                    <Text style={styles.shopAllSubtitle}>
                      {shopAllLayout === "list"
                        ? "Curated carousel · auto-scroll each second"
                        : "Shop two products per row · tap any tile"}
                    </Text>
                  </View>
                </View>
                <View style={styles.shopAllViewToggle}>
                  <TouchableOpacity
                    style={[
                      styles.shopAllToggleBtn,
                      shopAllLayout === "grid" && styles.shopAllToggleBtnOn,
                    ]}
                    onPress={() => {
                      setShopAllLayout("grid");
                      shopAllScrollIndexRef.current = 0;
                      shopAllScrollDirRef.current = 1;
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Grid view"
                  >
                    <Ionicons
                      name="grid-outline"
                      size={20}
                      color={shopAllLayout === "grid" ? "#ffffff" : "#64748b"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.shopAllToggleBtn,
                      shopAllLayout === "list" && styles.shopAllToggleBtnOn,
                    ]}
                    onPress={() => {
                      setShopAllLayout("list");
                      shopAllScrollIndexRef.current = 0;
                      shopAllScrollDirRef.current = 1;
                      shopAllScrollRef.current?.scrollTo({ x: 0, animated: false });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="List carousel view"
                  >
                    <Ionicons
                      name="list-outline"
                      size={20}
                      color={shopAllLayout === "list" ? "#ffffff" : "#64748b"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {shopAllLayout === "list" ? (
              <ScrollView
                ref={shopAllScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shopAllListRow}
                nestedScrollEnabled
                decelerationRate="fast"
                snapToInterval={SHOP_ALL_LIST_STEP}
                snapToAlignment="start"
                disableIntervalMomentum
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const n = allMenSubItems.length;
                  const idx = Math.round(x / Math.max(1, SHOP_ALL_LIST_STEP));
                  const clamped = Math.max(0, Math.min(idx, Math.max(0, n - 1)));
                  shopAllScrollIndexRef.current = clamped;
                  if (n > 1) {
                    if (clamped <= 0) shopAllScrollDirRef.current = 1;
                    else if (clamped >= n - 1) shopAllScrollDirRef.current = -1;
                  }
                }}
              >
                {allMenSubItems.map((item) => (
                  <TouchableOpacity
                    key={item.flatId}
                    style={styles.fcShopAllCardList}
                    activeOpacity={0.92}
                    onPress={() => openMenSubcategoryProducts(item.label)}
                    accessibilityRole="button"
                    accessibilityLabel={`${tr("Shop")} ${tr(item.label)}`}
                  >
                    <LinearGradient
                      colors={[item.deptColor, hexToRgba(item.deptColor, 0.75)]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.fcShopAllCardListRing}
                    >
                      <View style={styles.fcShopAllCardListInner}>
                        <LinearGradient
                          colors={["#ffffff", "#f8fafc"]}
                          style={styles.fcShopAllCardListFace}
                        >
                          <View style={styles.fcShopAllImgWrapList}>
                            <Image
                              source={item.image}
                              style={styles.fcShopAllImg}
                              resizeMode="cover"
                            />
                            <LinearGradient
                              colors={["transparent", "rgba(15,23,42,0.18)"]}
                              style={styles.fcShopAllImgShade}
                              pointerEvents="none"
                            />
                            <View style={styles.fcShopAllImgChip}>
                              <Ionicons name="bag-handle-outline" size={12} color="#fff" />
                              <Text style={styles.fcShopAllImgChipText}>Shop</Text>
                            </View>
                          </View>
                          <View style={styles.fcShopAllListBottom}>
                            <View
                              style={[
                                styles.fcShopAllDeptSwatch,
                                { backgroundColor: hexToRgba(item.deptColor, 0.12) },
                              ]}
                            >
                              <Text
                                style={[styles.fcShopAllDeptList, { color: item.deptColor }]}
                                numberOfLines={1}
                              >
                                {item.deptTitle}
                              </Text>
                            </View>
                            <View style={styles.fcShopAllListMeta}>
                              <View style={styles.fcShopAllListTextCol}>
                                <Text style={styles.fcShopAllLabelList} numberOfLines={2}>
                                  {tr(item.label)}
                                </Text>
                                <Text style={styles.fcShopAllHint}>Tap to see products</Text>
                              </View>
                              <View
                                style={[
                                  styles.fcShopAllChevronBubble,
                                  { backgroundColor: hexToRgba(item.deptColor, 0.12) },
                                ]}
                              >
                                <Ionicons
                                  name="chevron-forward"
                                  size={22}
                                  color={item.deptColor}
                                />
                              </View>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.shopAllGridWrap}>
                {shopAllGridRows.map((pair, rowIdx) => (
                  <View key={`shop-all-row-${rowIdx}`} style={styles.shopAllGridRow}>
                    {pair.map((item) => (
                      <TouchableOpacity
                        key={item.flatId}
                        style={styles.shopAllGridCardOuter}
                        activeOpacity={0.93}
                        onPress={() => openMenSubcategoryProducts(item.label)}
                        accessibilityRole="button"
                        accessibilityLabel={`${tr("Shop")} ${tr(item.label)}`}
                      >
                        <LinearGradient
                          colors={[item.deptColor, hexToRgba(item.deptColor, 0.7)]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.shopAllGridGlowFrame,
                            { shadowColor: item.deptColor },
                          ]}
                        >
                          <View style={styles.shopAllGridCard}>
                            <View style={styles.shopAllGridImgBox}>
                              <Image
                                source={item.image}
                                style={styles.shopAllGridImg}
                                resizeMode="cover"
                              />
                              <LinearGradient
                                colors={["transparent", "rgba(15,23,42,0.35)"]}
                                style={styles.shopAllGridFade}
                                pointerEvents="none"
                              />
                              <View
                                style={[
                                  styles.shopAllGridDeptPill,
                                  { borderColor: hexToRgba(item.deptColor, 0.45) },
                                ]}
                              >
                                <Text
                                  style={[styles.shopAllGridDeptPillText, { color: item.deptColor }]}
                                  numberOfLines={1}
                                >
                                  {item.deptTitle}
                                </Text>
                              </View>
                              <View style={styles.shopAllGridFab}>
                                <Ionicons
                                  name="arrow-forward"
                                  size={18}
                                  color="#ffffff"
                                />
                              </View>
                            </View>
                            <LinearGradient
                              colors={["#ffffff", "#f8fafc"]}
                              style={styles.shopAllGridBody}
                            >
                              <Text style={styles.shopAllGridLabel} numberOfLines={2}>
                                {tr(item.label)}
                              </Text>
                              <View style={styles.shopAllGridCtaRow}>
                                <Text style={styles.shopAllGridCta}>View range</Text>
                                <Ionicons name="chevron-forward" size={14} color="#64748b" />
                              </View>
                            </LinearGradient>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                    {pair.length === 1 ? <View style={styles.shopAllGridCardSpacer} /> : null}
                  </View>
                ))}
              </View>
            )}
          </MenStoreSection>


          {/* Middle banner */}
          <MenStoreSection>
            <TouchableOpacity
              style={styles.menLabFollowBanner}
              activeOpacity={0.94}
              onPress={() => openMenSubcategoryProducts("Casual shirts")}
              accessibilityRole="button"
              accessibilityLabel="Shop men’s style edit — casual shirts"
            >
              <Image
                source={MEN_STYLE_LAB_STRIP_IMAGE}
                style={styles.menLabFollowBannerImg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(29,50,78,0.15)", "rgba(15,23,42,0.88)"]}
                start={{ x: 0, y: 0.45 }}
                end={{ x: 1, y: 0.55 }}
                style={styles.menLabFollowBannerTint}
              />
              <View style={styles.menLabFollowBannerAccent} pointerEvents="none" />
              <View style={styles.menLabFollowBannerContent}>
                <View style={styles.menLabFollowBannerPill}>
                  <Ionicons name="shirt-outline" size={13} color="#1d324e" />
                  <Text style={styles.menLabFollowBannerPillText}>Men’s picks</Text>
                </View>
                <Text style={styles.menLabFollowBannerTitle} numberOfLines={2}>
                  From curated picks to your wardrobe
                </Text>
                <Text style={styles.menLabFollowBannerSub} numberOfLines={2}>
                  Full-width edit · Fresh fits · Tap to explore casual shirts
                </Text>
                <View style={styles.menLabFollowBannerCtaRow}>
                  <Text style={styles.menLabFollowBannerCta}>Shop the edit</Text>
                  <Ionicons name="arrow-forward-circle" size={22} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
          </MenStoreSection>

          {/* 9 — More purchase products */}
          <MenStoreSection>
            <View style={styles.menPtbHeaderRow}>
              <MenSectionHead
                accent="#ea580c"
                title="Bought again & again"
                sub="Trusted repeat buys from real shoppers"
                
              />
              <TouchableOpacity onPress={goMenLatestShop} activeOpacity={0.85}>
                <Text style={styles.menPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {menLatestLoading && menLatestPreviewRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>Loading products...</Text>
            ) : menLatestPreviewRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>No products found.</Text>
            ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {menLatestPreviewRows.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/productdetail",
                      params: { id: String(r.id) },
                    } as any)
                  }
                  style={[
                    styles.fcBuyCard,
                    { borderColor: hexToRgba(activeBlock.railTo, 0.18) },
                  ]}
                >
                  <View style={styles.fcBuyImgWrap}>
                    <Image source={r.imageSource} style={styles.fcBuyImg} resizeMode="cover" />
                  </View>
                  <Text style={styles.fcBuyTitle} numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text style={[styles.fcBuyPrice, { color: activeBlock.railTo }]}>{r.priceLabel}</Text>
                  <View style={styles.fcBuyRow}>
                    <Ionicons name="repeat-outline" size={14} color="#64748b" />
                    <Text style={styles.fcBuyMeta}>{r.buyersText}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            )}
          </MenStoreSection>

          {/* 10 — Most loved (dark staggered masonry, reference-style) */}
          <MenStoreSection>
            <View style={styles.menPtbHeaderRow}>
              <MenSectionHead
                accent="#ec4899"
                title="Most loved"
                sub="Staggered spotlight grid — tap to shop"
                
              />
              <TouchableOpacity onPress={goMenMostLovedShop} activeOpacity={0.85}>
                <Text style={styles.menPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {menMostLovedLoading &&
            menMostLovedPreviewRows.left.length + menMostLovedPreviewRows.right.length === 0 ? (
              <Text style={styles.menPtbStatus}>Loading products...</Text>
            ) : menMostLovedPreviewRows.left.length + menMostLovedPreviewRows.right.length === 0 ? (
              <Text style={styles.menPtbStatus}>No products found.</Text>
            ) : (
            <View style={styles.loveMasonryDarkShell}>
              <View style={[styles.loveMasonryRow, { gap: LOVE_MASONRY_GAP }]}>
                <View style={styles.loveMasonryCol}>
                  {menMostLovedPreviewRows.left.map((l, j, arr) => (
                    <TouchableOpacity
                      key={l.id}
                      activeOpacity={0.94}
                      style={[
                        styles.loveMasonryCard,
                        {
                          height: j % 2 === 0 ? LOVE_MASONRY_TALL : LOVE_MASONRY_SHORT,
                          marginBottom: j < arr.length - 1 ? LOVE_MASONRY_GAP : 0,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/productdetail",
                          params: { id: String(l.id) },
                        } as any)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${l.title}. ${l.subline}`}
                    >
                      <Image source={l.imageSource} style={styles.loveMasonryImg} resizeMode="cover" />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.78)"]}
                        locations={[0.35, 1]}
                        style={styles.loveMasonryFade}
                      />
                      <View style={styles.loveMasonryCopy}>
                        <Text style={styles.loveMasonryTitle} numberOfLines={2}>
                          {l.title}
                        </Text>
                        <Text style={styles.loveMasonrySub} numberOfLines={2}>
                          {l.subline}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.loveMasonryCol}>
                  {menMostLovedPreviewRows.right.map((l, j, arr) => (
                    <TouchableOpacity
                      key={l.id}
                      activeOpacity={0.94}
                      style={[
                        styles.loveMasonryCard,
                        {
                          height: j % 2 === 0 ? LOVE_MASONRY_SHORT : LOVE_MASONRY_TALL,
                          marginBottom: j < arr.length - 1 ? LOVE_MASONRY_GAP : 0,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/productdetail",
                          params: { id: String(l.id) },
                        } as any)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${l.title}. ${l.subline}`}
                    >
                      <Image source={l.imageSource} style={styles.loveMasonryImg} resizeMode="cover" />
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.78)"]}
                        locations={[0.35, 1]}
                        style={styles.loveMasonryFade}
                      />
                      <View style={styles.loveMasonryCopy}>
                        <Text style={styles.loveMasonryTitle} numberOfLines={2}>
                          {l.title}
                        </Text>
                        <Text style={styles.loveMasonrySub} numberOfLines={2}>
                          {l.subline}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            )}
          </MenStoreSection>

          {/* Products to buy — full-width strip (no store card shell) */}
          <View style={styles.menPtbSectionWrap}>
            <View style={styles.menPtbHeaderRow}>
              <Text style={styles.menPtbHeading}>Products to buy</Text>
              <TouchableOpacity onPress={goMenPtbShop} activeOpacity={0.85}>
                <Text style={styles.menPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {routeMenMainCategoryId == null && resolvingMenMainCategoryId ? (
              <Text style={[styles.menPtbStatus, { marginTop: -6 }]}>
                Matching store category…
              </Text>
            ) : null}
            {menProductsToBuyLoading && menProductsToBuyApi.length === 0 ? (
              <Text style={styles.menPtbStatus}>Loading products...</Text>
            ) : menProductsToBuyUiRows.length === 0 ? (
              <Text style={styles.menPtbStatus}>No products found.</Text>
            ) : (
              <View style={styles.menPtbGrid}>
                  {menProductsToBuyUiRows.map((product) => (
                    <View
                      key={product.id}
                      style={[styles.menPtbCard, { width: menPtbColW }]}
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
                        accessibilityLabel={`${tr(product.name)}, ${tr("view details")}`}
                      >
                        <View style={styles.menPtbCardInner}>
                          <Image
                            source={product.imageSource}
                            style={styles.menPtbImage}
                            resizeMode="cover"
                          />
                          <View style={styles.menPtbMeta}>
                            <Text style={styles.menPtbName} numberOfLines={2}>
                              {tr(product.name)}
                            </Text>
                            <View style={styles.menPtbCategoryRow}>
                              <View style={styles.menPtbRatingPill}>
                                <Ionicons name="star" size={12} color="#ef7b1a" />
                                <Text style={styles.menPtbRatingText}>{product.ratingLabel}</Text>
                              </View>
                            </View>
                            <View style={styles.menPtbPriceRow}>
                              {product.sellingLabel ? (
                                <Text style={styles.menPtbPrice}>{product.sellingLabel}</Text>
                              ) : null}
                              {product.showMrp && product.mrpLabel ? (
                                <Text style={styles.menPtbMrp}>{product.mrpLabel}</Text>
                              ) : null}
                              {product.discountLabel ? (
                                <View style={styles.menPtbDiscountPill}>
                                  <Text style={styles.menPtbDiscountText}>
                                    {product.discountLabel}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <View style={styles.menPtbBottomRow}>
                              <View style={styles.menPtbActionsRow}>
                                <TouchableOpacity
                                  style={styles.menPtbWishlistBtn}
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    void handleToggleWishlistMenPtb({
                                      id: product.id,
                                      name: product.name,
                                      sellingNum: product.sellingNum,
                                      mrpNum: product.mrpNum,
                                      variantId: product.variantId,
                                    })
                                  }
                                  accessibilityRole="button"
                                  accessibilityLabel={`${
                                    categoryPtbRowWishlisted(
                                      product,
                                      wishlistHasAuth,
                                      wishlistServerKeys,
                                      wishlistIds
                                    )
                                      ? "Remove from"
                                      : "Add to"
                                  } ${tr("wishlist")}: ${tr(product.name)}`}
                                >
                                  <Ionicons
                                    name={
                                      categoryPtbRowWishlisted(
                                        product,
                                        wishlistHasAuth,
                                        wishlistServerKeys,
                                        wishlistIds
                                      )
                                        ? "heart"
                                        : "heart-outline"
                                    }
                                    size={16}
                                    color={
                                      categoryPtbRowWishlisted(
                                        product,
                                        wishlistHasAuth,
                                        wishlistServerKeys,
                                        wishlistIds
                                      )
                                        ? "#E11D48"
                                        : "#1d324e"
                                    }
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.menPtbCartBtn}
                                  activeOpacity={0.85}
                                  onPress={() =>
                                    void handleAddToCartMenPtb({
                                      id: product.id,
                                      name: product.name,
                                      sellingNum: product.sellingNum,
                                      mrpNum: product.mrpNum,
                                      variantId: product.variantId,
                                    })
                                  }
                                  accessibilityRole="button"
                                  accessibilityLabel={`${tr("Add to cart")}: ${tr(product.name)}`}
                                >
                                  <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                                  <Text style={styles.menPtbCartBtnText}>Add to Cart</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e8ecf2",
  },
  menStickyHeader: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.05)",
  },
  menHeaderAccentWash: {
    ...StyleSheet.absoluteFillObject,
  },
  menHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  menLogoHit: {
    borderRadius: 18,
  },
  menLogoTile: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  menLogoImage: {
    width: 40,
    height: 40,
  },
  menSearchPill: {
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
  menSearchMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    minWidth: 0,
  },
  menSearchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#94a3b8",
  },
  menSearchCameraBtn: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(239, 123, 26, 0.1)",
  },
  menHeaderIconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  menHeaderIconHit: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.06)",
  },
  menHeaderIconBadgeWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  menHeaderIconBadge: {
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
  menHeaderIconBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  menPtbSectionWrap: {
    marginTop: 18,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  menPtbHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menPtbHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  menPtbSeeAll: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ea580c",
    left:-20,
    top:-8,
  },
  menPtbStatus: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  menPtbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: MEN_PTB_GRID_GAP,
  },
  menPtbCard: {
    borderRadius: 12,
    backgroundColor: "#ef7b1a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 1,
    marginBottom: 12,
    overflow: "visible",
  },
  menPtbCardInner: {
    flex: 1,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFDF9",
    margin: 1,
  },
  menPtbImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
    backgroundColor: "#FFFFFF",
  },
  menPtbMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  menPtbName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D2430",
    minHeight: 30,
  },
  menPtbCategoryRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  menPtbPriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 6,
  },
  menPtbPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1d324e",
  },
  menPtbMrp: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  menPtbDiscountPill: {
    backgroundColor: "rgba(239,123,26,0.14)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menPtbDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#b45309",
  },
  menPtbBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  menPtbActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 4,
  },
  menPtbWishlistBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.25)",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  menPtbCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#1d324e",
  },
  menPtbCartBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  menPtbRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menPtbRatingText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A4E17",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#e8ecf2",
  },
  scrollInner: {
    paddingTop: 10,
    paddingBottom: 108,
  },
  heroWrap: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 228,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#1d324e",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  shopSubsUnifiedCard: {
    marginHorizontal: 14,
    marginTop: 20,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(29, 50, 78, 0.16)",
    backgroundColor: "#f3f6fa",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    overflow: "hidden",
  },
  shopSubsCardInner: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(29, 50, 78, 0.08)",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  shopSubsDividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 6,
    gap: 10,
  },
  shopSubsDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: "rgba(29, 50, 78, 0.12)",
    borderRadius: 1,
  },
  shopSubsDividerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  shopCategoryHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  shopCategoryHeadAccent: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: HEX_SELECTED_LABEL,
  },
  shopCategoryHeadText: {
    flex: 1,
    minWidth: 0,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d324e",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionLabelHint: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 4,
    letterSpacing: 0.2,
  },
  quickStrip: {
    paddingHorizontal: 10,
    paddingBottom: 4,
    gap: 4,
    alignItems: "flex-start",
  },
  quickItem: {
    width: 80,
    alignItems: "center",
  },
  quickHexShadow: {
    backgroundColor: "transparent",
  },
  quickHexShadowSelected: {
    shadowColor: HEX_SELECTED_LABEL,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  quickHexLabel: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  quickHexLabelSelected: {
    color: HEX_SELECTED_LABEL,
    fontWeight: "800",
  },
  hexFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8eaed",
  },
  hexFallbackInner: {
    width: HEX_W * 0.55,
    height: HEX_H * 0.55,
    borderRadius: 4,
    borderWidth: 2,
  },
  storeSectionShell: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.07)",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
    overflow: "hidden",
  },
  railSectionInner: {
    paddingBottom: 2,
    paddingTop: 2,
  },
  railSectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  railHeadLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  railAccentBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  railHeadTextCol: {
    flex: 1,
    minWidth: 0,
  },
  railKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ef7b1a",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  railTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1d324e",
    letterSpacing: 0.2,
  },
  railTag: {
    fontSize: 12,
    color: "#69798c",
    marginTop: 3,
    fontWeight: "500",
  },
  railDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  railScroll: {
    paddingHorizontal: 2,
    gap: 12,
    paddingBottom: 2,
  },
  menEthnicKurtaSpotlightSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(29, 50, 78, 0.1)",
  },
  menEthnicKurtaSpotlightHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  menEthnicKurtaSpotlightTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1d324e",
    flex: 1,
    paddingRight: 8,
  },
  menEthnicKurtaSpotlightViewAll: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ef7b1a",
  },
  menEthnicKurtaSpotlightLoadingHint: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#5a6578",
  },
  menEthnicKurtaSpotlightEmpty: {
    paddingHorizontal: 4,
    paddingTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#5a6578",
  },
  menEthnicKurtaSpotlightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  menEthnicKurtaSpotlightCard: {
    width: "49%",
    borderRadius: 12,
    backgroundColor: "#c2410c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 1,
    marginBottom: 12,
    overflow: "visible",
  },
  menEthnicKurtaSpotlightInner: {
    flex: 1,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFDF9",
    margin: 1,
  },
  menEthnicKurtaSpotlightImage: {
    width: "100%",
    height: 118,
    resizeMode: "cover",
    backgroundColor: "#FFFFFF",
  },
  menEthnicKurtaSpotlightMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  menEthnicKurtaSpotlightName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D2430",
    minHeight: 28,
  },
  menEthnicKurtaSpotlightPriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  menEthnicKurtaSpotlightDiscountPill: {
    backgroundColor: "rgba(194,65,12,0.12)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menEthnicKurtaSpotlightDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9a3412",
  },
  menEthnicKurtaSpotlightMrp: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  menEthnicKurtaSpotlightBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  menEthnicKurtaSpotlightPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1d324e",
  },
  menEthnicKurtaSpotlightRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  menEthnicKurtaSpotlightRatingText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A4E17",
  },
  railCard: {
    width: RAIL_CARD_W,
    height: RAIL_CARD_H,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.08)",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  railCardArt: {
    height: Math.round(RAIL_CARD_H * 0.75),
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  railCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  railCardImageFade: {
    ...StyleSheet.absoluteFillObject,
  },
  railCardTintBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    opacity: 0.9,
  },
  railCardBody: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: "center",
    minHeight: Math.round(RAIL_CARD_H * 0.25),
  },
  railCardLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d324e",
    lineHeight: 17,
  },
  railCardHint: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  fcWrap: {
    marginTop: 4,
    paddingBottom: 16,
  },
  fcHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    marginBottom: 12,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.07)",
  },
  fcHeadAccentBar: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  fcHeadIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.06)",
  },
  fcHeadText: {
    flex: 1,
    minWidth: 0,
  },
  fcHeadTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1d324e",
    letterSpacing: 0.15,
  },
  fcHeadSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
    lineHeight: 16,
  },
  fcRow: {
    paddingHorizontal: 0,
    gap: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  /** Soft shadow shell — shape reads “pill + arch”, not a flat rectangle. */
  fcTrendOuter: {
    width: 182,
    borderRadius: 36,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  fcTrendStack: {
    borderRadius: 36,
    overflow: "visible",
  },
  fcTrendPhotoShell: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    padding: 3,
    overflow: "hidden",
  },
  /** Tall photo panel with deep rounded “arch”; variants add slight asymmetry for variety. */
  fcTrendImageArch: {
    height: 276,
    width: "100%",
    backgroundColor: "#e2e8f0",
    position: "relative",
    overflow: "hidden",
  },
  fcTrendArchVariantA: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 28,
  },
  fcTrendArchVariantB: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 36,
  },
  fcTrendImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fcTrendFade: {
    ...StyleSheet.absoluteFillObject,
  },
  fcTrendTag: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  fcTrendTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.35,
  },
  /** Overlapping bottom sheet — separates from photo with curve, not a straight box. */
  fcTrendBodySheet: {
    marginTop: -20,
    marginHorizontal: 8,
    marginBottom: 4,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  fcTrendBodyAccent: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    marginBottom: 10,
    opacity: 0.85,
  },
  fcTrendTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d324e",
    lineHeight: 18,
    textAlign: "center",
  },
  fcTrendPrice: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  fcSpotlight: {
    marginHorizontal: 0,
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    backgroundColor: "#0f172a",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  fcSpotlightImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fcSpotlightFade: {
    ...StyleSheet.absoluteFillObject,
  },
  fcSpotlightTopBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(254, 243, 199, 0.95)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(120, 113, 108, 0.2)",
  },
  fcSpotlightTopBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#292524",
    letterSpacing: 0.2,
  },
  fcSpotlightStars: {
    position: "absolute",
    top: 12,
    right: 14,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
  fcSpotlightStar: {
    color: "#fbbf24",
    fontWeight: "900",
    textShadowColor: "rgba(120, 53, 15, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fcSpotlightCopy: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    zIndex: 2,
    alignItems: "stretch",
  },
  fcSpotlightGuidePill: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  fcSpotlightGuideText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: "#f8fafc",
    textTransform: "uppercase",
    textAlign: "center",
  },
  fcSpotlightHead: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 30,
    textAlign: "center",
  },
  fcSpotlightSub: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    marginTop: 10,
    lineHeight: 21,
    textAlign: "center",
  },
  fcSpotlightCta: {
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: "#ea580c",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  fcSpotlightCtaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  /** Unique picks: own row spacing (slightly wider cards than Trending). */
  fcUniqueRow: {
    paddingHorizontal: 0,
    gap: 14,
    paddingBottom: 8,
    paddingTop: 4,
  },
  /** Magazine tile — full-bleed photo + type on gradient (not Trending’s arch + overlap sheet). */
  fcUniqueOuter: {
    width: 198,
    shadowColor: "#1e1b4b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  fcUniqueMagazine: {
    height: 278,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#1e1b4b",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255,255,255,0.22)",
  },
  /** Soft “cut corner” silhouette — alternates so the row doesn’t mirror Trending arch A/B. */
  fcUniqueShapeA: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 26,
    borderBottomLeftRadius: 10,
  },
  fcUniqueShapeB: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 26,
  },
  fcUniquePhoto: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fcUniqueVignette: {
    ...StyleSheet.absoluteFillObject,
  },
  fcUniqueReadBand: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "52%",
  },
  fcUniqueChip: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(109,40,217,0.25)",
  },
  fcUniqueChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5b21b6",
    letterSpacing: 0.2,
  },
  fcUniqueCopy: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,
  },
  fcUniqueTitleMag: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fafafa",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  fcUniqueSubMag: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(237,233,254,0.92)",
    marginTop: 6,
    lineHeight: 16,
  },
  fcBannerCarousel: {
    marginBottom: 6,
  },
  fcBannerPage: {
    alignItems: "center",
    justifyContent: "center",
  },
  /** Framed promo tile — reads like a native commerce hero offer. */
  fcBannerShell: {
    borderRadius: 26,
    padding: 4,
    backgroundColor: "#ffffff",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  fcBannerFace: {
    width: "100%",
    minHeight: 168,
    borderRadius: 22,
    overflow: "hidden",
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  fcBannerGlowOrb: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  fcBannerGlowOrbTop: {
    top: -36,
    right: -28,
  },
  fcBannerGlowOrbBottom: {
    bottom: -52,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  fcBannerSurfaceSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  fcBannerTopStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fcBannerDealPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  fcBannerDealPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1,
  },
  fcBannerSparkRow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(254,240,138,0.45)",
  },
  fcBannerCopyBlock: {
    marginTop: 8,
  },
  fcBannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 7,
  },
  fcBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
    overflow: "hidden",
  },
  fcBannerDotActiveWrap: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e2e8f0",
  },
  fcBannerDotActiveFill: {
    width: "100%",
    height: "100%",
    borderRadius: 5,
  },
  fcBannerLine1: {
    fontSize: 23,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
    lineHeight: 28,
    maxWidth: "92%",
  },
  fcBannerLine2: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: "100%",
  },
  fcBannerCtaSolid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fcBannerCtaSolidText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  fcCollGrid: {
    paddingHorizontal: 0,
    paddingBottom: 2,
  },
  fcCollRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  fcCollCard: {
    flex: 1,
    minWidth: 0,
    height: 200,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    overflow: "hidden",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  fcCollImgBox: {
    flex: 1,
    position: "relative",
    backgroundColor: "#e2e8f0",
    justifyContent: "flex-end",
    padding: 14,
  },
  fcCollImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fcCollFade: {
    ...StyleSheet.absoluteFillObject,
  },
  fcCollTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    zIndex: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  fcCollCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    zIndex: 1,
  },
  shopAllHeroStrip: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,163,184,0.2)",
  },
  shopAllSectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  shopAllHeadLead: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    minWidth: 0,
    gap: 10,
  },
  shopAllIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(234,88,12,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,88,12,0.22)",
  },
  shopAllTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  shopAllTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  shopAllSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
    lineHeight: 16,
  },
  shopAllLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(34,197,94,0.28)",
  },
  shopAllLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  shopAllLiveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803d",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  shopAllViewToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,163,184,0.35)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  shopAllToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shopAllToggleBtnOn: {
    backgroundColor: "#ea580c",
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  shopAllListRow: {
    paddingRight: 8,
    gap: SHOP_ALL_LIST_GAP,
    paddingVertical: 6,
  },
  fcShopAllCardList: {
    width: SHOP_ALL_LIST_CARD_W,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
  },
  fcShopAllCardListRing: {
    borderRadius: 24,
    padding: 3,
  },
  fcShopAllCardListInner: {
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  fcShopAllCardListFace: {
    borderRadius: 21,
    overflow: "hidden",
  },
  fcShopAllImgWrapList: {
    height: 152,
    width: "100%",
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  fcShopAllImgShade: {
    ...StyleSheet.absoluteFillObject,
  },
  fcShopAllImgChip: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  fcShopAllImgChipText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  fcShopAllImg: {
    width: "100%",
    height: "100%",
  },
  fcShopAllListBottom: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  fcShopAllDeptSwatch: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  fcShopAllListMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fcShopAllListTextCol: {
    flex: 1,
    minWidth: 0,
  },
  fcShopAllDeptList: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  fcShopAllLabelList: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  fcShopAllHint: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 5,
  },
  fcShopAllChevronBubble: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  shopAllGridWrap: {
    flexDirection: "column",
    paddingBottom: 8,
    paddingTop: 2,
  },
  shopAllGridRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 14,
  },
  shopAllGridCardOuter: {
    flex: 1,
    minWidth: 0,
  },
  shopAllGridGlowFrame: {
    borderRadius: 22,
    padding: 2.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  shopAllGridCard: {
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  shopAllGridCardSpacer: {
    flex: 1,
    minWidth: 0,
  },
  shopAllGridImgBox: {
    height: 128,
    width: "100%",
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  shopAllGridImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  shopAllGridFade: {
    ...StyleSheet.absoluteFillObject,
  },
  shopAllGridDeptPill: {
    position: "absolute",
    top: 9,
    left: 9,
    maxWidth: "78%",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: StyleSheet.hairlineWidth,
  },
  shopAllGridDeptPillText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  shopAllGridFab: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  shopAllGridBody: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(226,232,240,0.9)",
  },
  shopAllGridLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 17,
    letterSpacing: -0.15,
  },
  shopAllGridCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  shopAllGridCta: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fcLabRow: {
    paddingHorizontal: 4,
    gap: 14,
    paddingBottom: 10,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  fcLabItem: {
    width: 124,
  },
  fcLabTileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,23,42,0.06)",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  fcLabRingWrap: {
    width: FC_LAB_RING,
    height: FC_LAB_RING,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fcLabGlow: {
    position: "absolute",
    alignSelf: "center",
  },
  fcLabRingOuter: {
    width: FC_LAB_RING,
    height: FC_LAB_RING,
    borderRadius: FC_LAB_RING / 2,
    padding: FC_LAB_RING_BORDER,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 7,
  },
  fcLabRingCutout: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  fcLabIconDisk: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fcLabStepBadge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  fcLabStepBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  fcLabCircleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: 0.15,
    lineHeight: 17,
  },
  fcLabCircleSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  fcLabTapCue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.04)",
  },
  fcLabTapCueText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  menLabFollowBanner: {
    marginHorizontal: -12,
    marginTop: 12,
    height: 118,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    backgroundColor: "#1d324e",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  menLabFollowBannerImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  menLabFollowBannerTint: {
    ...StyleSheet.absoluteFillObject,
  },
  menLabFollowBannerAccent: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#ef7b1a",
  },
  menLabFollowBannerContent: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14,
  },
  menLabFollowBannerPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    marginBottom: 10,
  },
  menLabFollowBannerPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  menLabFollowBannerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  menLabFollowBannerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    lineHeight: 17,
    maxWidth: "92%",
  },
  menLabFollowBannerCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  menLabFollowBannerCta: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  styleLabModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  styleLabModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  styleLabModalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "88%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  styleLabModalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15,23,42,0.12)",
    marginTop: 10,
    marginBottom: 4,
  },
  styleLabModalHero: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 22,
  },
  styleLabModalHeroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  styleLabModalHeroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  styleLabModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  styleLabModalKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  styleLabModalTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 8,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  styleLabModalSub: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginTop: 8,
    lineHeight: 20,
  },
  styleLabModalBodyScroll: {
    maxHeight: 280,
  },
  styleLabModalBodyContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 8,
  },
  styleLabModalDetail: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
    lineHeight: 23,
  },
  styleLabModalTipsTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  styleLabTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  styleLabTipDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  styleLabTipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 21,
  },
  styleLabModalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15,23,42,0.08)",
  },
  styleLabBtnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.05)",
  },
  styleLabBtnGhostText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#475569",
  },
  styleLabBtnPrimary: {
    flex: 1.35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  styleLabBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  fcSeasonPlayingRow: {
    paddingHorizontal: 2,
    gap: 14,
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: "flex-start",
  },
  seasonPlayingCard: {
    width: 150,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  seasonPlayingCardOuter: {
    borderRadius: 18,
    padding: 5,
  },
  seasonPlayingCardRim: {
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: "#fffcf7",
    overflow: "hidden",
  },
  seasonPlayingCardFace: {
    backgroundColor: "#fffefb",
    borderRadius: 13,
    minHeight: 232,
    paddingBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  seasonPlayingCornerTL: {
    position: "absolute",
    left: 8,
    top: 8,
    zIndex: 2,
    alignItems: "center",
    gap: 2,
  },
  seasonPlayingCornerBR: {
    position: "absolute",
    right: 8,
    bottom: 76,
    zIndex: 2,
  },
  seasonPlayingCornerRotated: {
    alignItems: "center",
    gap: 2,
    transform: [{ rotate: "180deg" }],
  },
  seasonPlayingRank: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  seasonPlayingArtWrap: {
    alignItems: "center",
    marginTop: 36,
    paddingHorizontal: 10,
  },
  seasonPlayingArtRing: {
    width: 112,
    height: 118,
    borderRadius: 56,
    borderWidth: 3,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  seasonPlayingArtImg: {
    width: "100%",
    height: "100%",
  },
  seasonPlayingSeasonPill: {
    marginTop: -12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  seasonPlayingSeasonPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  seasonPlayingFooter: {
    marginTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(29,50,78,0.1)",
    paddingTop: 10,
  },
  seasonPlayingTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d324e",
    lineHeight: 16,
    textAlign: "center",
  },
  seasonPlayingPrice: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 6,
    textAlign: "center",
  },
  seasonAceWordmark: {
    position: "absolute",
    right: -6,
    top: "38%",
    opacity: 0.06,
    transform: [{ rotate: "-90deg" }],
  },
  seasonAceWordmarkText: {
    fontSize: 44,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 4,
  },
  fcBuyCard: {
    width: 150,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    overflow: "hidden",
    paddingBottom: 12,
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  fcBuyImgWrap: {
    height: 132,
    width: "100%",
    backgroundColor: "#e2e8f0",
  },
  fcBuyImg: {
    width: "100%",
    height: "100%",
  },
  fcBuyTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d324e",
    marginTop: 10,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  fcBuyPrice: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 6,
    paddingHorizontal: 10,
  },
  fcBuyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  fcBuyMeta: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
    flex: 1,
  },
  loveMasonryDarkShell: {
    backgroundColor: "#101010",
    borderRadius: 24,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  loveMasonryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  loveMasonryCol: {
    flex: 1,
  },
  loveMasonryCard: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  loveMasonryImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  loveMasonryFade: {
    ...StyleSheet.absoluteFillObject,
  },
  loveMasonryCopy: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 28,
  },
  loveMasonryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  loveMasonrySub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
    marginTop: 6,
    lineHeight: 17,
  },
});

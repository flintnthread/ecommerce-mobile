import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  Modal,
  Alert,
  Platform,
  FlatList,
  Animated,
  ActivityIndicator,
  type ImageSourcePropType,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import DeliveryLocationSection from "../components/DeliveryLocationSection";
import api, {
  productsByMainCategoryPath,
  productsBySubcategoryPath,
  searchProductsPath,
  searchSuggestionsPath,
  WISHLIST_USER_PATH,
} from "../services/api";
import { addToCartPtbOrLocal, getCartUnitCount } from "../lib/cartServerApi";
import { parseWishlistApiError, postWishlistAdd } from "../lib/wishlistServerApi";
import {
  addWishlistProductIfAbsent,
  getWishlistIds,
  loadWishlist,
  resolveProductImage,
  type PersistedWishlistLine,
} from "../lib/shopStorage";
import {
  RATE_PURCHASE_CARDS,
  RATE_STAR_LABELS,
  type RatePurchaseCard,
} from "../lib/ratePurchaseCatalog";
import { requestForegroundLocation } from "../lib/requestForegroundLocation";
import {
  pickPrimaryProductImage,
  resolveProductPrimaryImageUri,
} from "../lib/productImage";
import { normalizeWishlistApiRows } from "../lib/wishlistApi";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../lib/language";
import { SHOW_POST_LOGIN_PROMO_KEY } from "./otpsection";
import {
  fetchUnreadNotificationCount,
  getCurrentUserIdFromToken,
} from "../services/pushNotifications";

const { width, height } = Dimensions.get("window");
const HIDE_TOP_BAR_H = 66;
const CARD_WIDTH = width * 0.6;
const USER_PICK_CARD_WIDTH = Math.min(Math.round(width * 0.38), 148);
const USER_PICK_ITEM_GAP = 12;
/** Min height for Top Picks horizontal `ScrollView` (avoids 0-height nested scroll). */
const USER_PICK_TOP_SCROLL_MIN_H = 200;
const HOME_API_BASE_URL = "http://flintnthread.com/api";

function homeApiGet<T = unknown>(path: string, config?: AxiosRequestConfig) {
  return api.get<T>(path, {
    ...(config ?? {}),
    baseURL: HOME_API_BASE_URL,
  });
}

/** Suggested for you — gap between the two columns in each row */
const SUGGESTED_CARD_GAP = 12;

/** Category strip: fixed chip width for horizontal scroll. */
const CATEGORY_CHIP_WIDTH = 72;
/** Rounded image box behind each category icon */
const CATEGORY_IMAGE_CARD_SIZE = 64;
/** Inset inside the box so the full image fits with `contain` (not clipped). */
const CATEGORY_IMAGE_INNER_INSET = 5;
const CATEGORY_ICON_INNER =
  CATEGORY_IMAGE_CARD_SIZE - CATEGORY_IMAGE_INNER_INSET * 2;

const FOCUS_CARD_WIDTH = Math.round(Math.min(width * 0.78, 336));
const FOCUS_CARD_GAP = 16;
const FOCUS_CARD_HEIGHT = 232;

/** First hero carousel: Amazon-style tall cards + matching sticky header tint */
const HERO_PROMO_CARD_WIDTH = Math.round(Math.min(width * 0.90, 400));
const HERO_PROMO_CARD_HEIGHT = Math.round(
  Math.max(280, Math.min(height * 0.5, 420))
);
const HERO_PROMO_CARD_GAP = 14;
const HERO_PROMO_SNAP_STRIDE = HERO_PROMO_CARD_WIDTH + HERO_PROMO_CARD_GAP;
const HERO_PROMO_SIDE_PADDING = (width - HERO_PROMO_CARD_WIDTH) / 2;

type HeroPromoCard = {
  id: string;
  /** Saturated gradient for sticky header + browse (categories / filters) — matches banner */
  chromeGradient: readonly [string, string, string];
  cardGradient: readonly [string, string];
  titleColor: string;
  subtitleColor: string;
  title: string;
  subtitle: string;
  tag: string;
  footer: string;
  image: ImageSourcePropType;
  targetUrl?: string;
};

type HeroBannerApi = {
  id?: number | string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  textContent?: string | null;
  desktopImage?: string | null;
  mobileImage?: string | null;
  image?: string | null;
  targetUrl?: string | null;
  buttonText?: string | null;
  textAlign?: string | null;
  bannerType?: string | null;
  status?: number | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type HomeWishlistCandidate = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: string;
  oldPrice?: string;
  /** From API variant `id` — required for POST `/api/wishlist/add`. */
  variantId?: number;
};

/** “More picks” grid row — API-mapped or fallback */
type MorePicksGridItem = {
  id: string;
  cartId?: string;
  name: string;
  image: ImageSourcePropType;
  rating: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  /** Backend `ProductVariantDTO.id` for wishlist add. */
  variantId?: number;
  /** Stock flag from API variant (best-effort). */
  inStock?: boolean;
  /** Remaining units when backend sends quantity/stock (best-effort). */
  stockQty?: number;
};

type MorePicksApiImage = {
  imagePath?: string | null;
  imageUrl?: string | null;
  isPrimary?: boolean | null;
  sortOrder?: number | null;
};

type MorePicksApiVariant = {
  id?: number | string | null;
  variantId?: number | string | null;
  sellingPrice?: number | string | null;
  mrpPrice?: number | string | null;
  finalPrice?: number | string | null;
  discountPercentage?: number | null;
  inStock?: boolean | null;
  /** Some APIs send `quantity` / `stock` / `availableQuantity` for on-hand units. */
  quantity?: number | string | null;
  stock?: number | string | boolean | null;
  availableQuantity?: number | string | null;
  available?: boolean | null;
};

type MorePicksApiProduct = {
  id?: number | string | null;
  productId?: number | string | null;
  name?: string | null;
  productName?: string | null;
  title?: string | null;
  displayName?: string | null;
  /** String (`active`) or numeric (`1` = active) depending on backend. */
  status?: string | number | null;
  salePrice?: number | null;
  sellingPrice?: number | null;
  price?: number | null;
  mrp?: number | null;
  maxRetailPrice?: number | null;
  discountPercentage?: number | null;
  images?: MorePicksApiImage[] | null;
  variants?: MorePicksApiVariant[] | null;
};

type MorePicksPageResponse = {
  content?: MorePicksApiProduct[] | null;
  last?: boolean;
  number?: number;
  totalPages?: number;
  size?: number;
  totalElements?: number;
};

/** Paginated products for “More picks” — base URL comes from `services/api.tsx` */
const MORE_PICKS_PRODUCTS_PATH = "/api/products";
/** Spring `page` size for `/api/products` while loading all rows for Home once. */
const MORE_PICKS_PAGE_SIZE = 50;
const MORE_PICKS_MAX_BOOTSTRAP_PAGES = 200;

/** Two-column grid without `FlatList` (nested virtualized lists often do not extend parent scroll). */
function chunkMorePicksRows<T>(items: T[]): [T, T | undefined][] {
  const out: [T, T | undefined][] = [];
  for (let i = 0; i < items.length; i += 2) {
    out.push([items[i]!, items[i + 1]]);
  }
  return out;
}

/** “Fresh finds” — `GET` returns a JSON array of products (base URL in `services/api.tsx`) */
const FRESH_FINDS_RECENT_PATH = "/api/products/recent";

/** “Top picks for you” — popular products (base URL in `services/api.tsx`) */
const TOP_PICKS_POPULAR_PATH = "/api/products/popular";
/** Preview strip vs expanded list (Spring `page` / `size` when supported). */
const TOP_PICKS_PREVIEW_SIZE = 5;

type ApiWishlistImage = {
  imagePath?: string | null;
  url?: string | null;
  imageUrl?: string | null;
};

type ApiWishlistProduct = {
  id?: number | string | null;
  productId?: number | string | null;
  name?: string | null;
  productName?: string | null;
  title?: string | null;
  displayName?: string | null;
  sellingPrice?: number | string | null;
  salePrice?: number | string | null;
  price?: number | string | null;
  mrp?: number | string | null;
  maxRetailPrice?: number | string | null;
  finalPrice?: number | string | null;
  image?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  images?: ApiWishlistImage[] | null;
};

type ApiWishlistRow = {
  id?: number | string | null;
  wishlistId?: number | string | null;
  productId?: number | string | null;
  product?: ApiWishlistProduct | null;
  createdAt?: string | null;
} & ApiWishlistProduct;

/** Keys that often hold the wishlist line array (Spring / custom wrappers). */
const WISHLIST_ROW_ARRAY_KEYS = [
  "data",
  "items",
  "content",
  "rows",
  "records",
  "list",
  "results",
  "products",
  "wishlistItems",
  "wishList",
  "wishlist",
  "userWishlist",
] as const;

function wishlistResponseIsExplicitFailure(payload: unknown): boolean {
  if (payload == null || typeof payload !== "object") return false;
  const s = (payload as { success?: unknown }).success;
  return s === false || s === "false" || s === 0 || s === "0";
}

function extractWishlistRowArray(payload: unknown, depth = 0): unknown[] {
  if (depth > 8 || payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;

  for (const key of WISHLIST_ROW_ARRAY_KEYS) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }

  const dataVal = o.data;
  if (dataVal != null && typeof dataVal === "object" && !Array.isArray(dataVal)) {
    return extractWishlistRowArray(dataVal, depth + 1);
  }

  return [];
}

function normalizeWishlistRows(payload: unknown): ApiWishlistRow[] {
  return extractWishlistRowArray(payload) as ApiWishlistRow[];
}

type SuggestedForYouGridItem = {
  cartId: string;
  name: string;
  image: ImageSourcePropType;
  oldPrice: string;
  price: string;
  rating: string;
  priceNum: number;
  mrpNum: number;
  /** API variant id for POST `/api/cart/add` when signed in. */
  variantId?: number;
};

const SUGGESTED_FOR_YOU_FALLBACK: SuggestedForYouGridItem[] = [
  {
    cartId: "sg1",
    name: "Women floral cotton dress",
    image: require("../assets/images/look1.png"),
    oldPrice: "₹499",
    price: "₹299",
    rating: "4.5",
    priceNum: 299,
    mrpNum: 499,
  },
  {
    cartId: "sg2",
    name: "Casual summer A-line look",
    image: require("../assets/images/look2.png"),
    oldPrice: "₹899",
    price: "₹449",
    rating: "4.2",
    priceNum: 449,
    mrpNum: 899,
  },
  {
    cartId: "sg3",
    name: "Printed kurta & dupatta set",
    image: require("../assets/images/look3.png"),
    oldPrice: "₹1,299",
    price: "₹599",
    rating: "4.8",
    priceNum: 599,
    mrpNum: 1299,
  },
  {
    cartId: "sg4",
    name: "Gym quick-dry training tee",
    image: require("../assets/images/sports2.png"),
    oldPrice: "₹699",
    price: "₹399",
    rating: "4.3",
    priceNum: 399,
    mrpNum: 699,
  },
];

function resolveMediaUri(pathOrUrl: string, apiBase: string): string {
  const s = String(pathOrUrl ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const root = apiBase.replace(/\/+$/, "");
  if (!root) return "";
  return s.startsWith("/") ? `${root}${s}` : `${root}/${s}`;
}

function pickProductFromRow(row: ApiWishlistRow): ApiWishlistProduct {
  const p = row.product;
  if (p && typeof p === "object") return p;
  return row;
}

function numLike(v: unknown): number {
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function formatSuggestedInr(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function firstWishlistImagePath(p: ApiWishlistProduct, apiBase: string): string {
  const imgs = Array.isArray(p.images) ? p.images : [];
  for (const im of imgs) {
    if (!im || typeof im !== "object") continue;
    const cand =
      String((im as ApiWishlistImage).imageUrl ?? "").trim() ||
      String((im as ApiWishlistImage).imagePath ?? "").trim() ||
      String((im as ApiWishlistImage).url ?? "").trim();
    if (cand) return resolveMediaUri(cand, apiBase);
  }
  const direct = [
    p.image,
    p.imageUrl,
    p.thumbnail,
    p.thumbnailUrl,
  ]
    .map((x) => String(x ?? "").trim())
    .find((s) => s.length > 0);
  return direct ? resolveMediaUri(direct, apiBase) : "";
}

function apiRowToSuggestedForYouItem(
  row: ApiWishlistRow,
  apiBase: string
): SuggestedForYouGridItem | null {
  const nested = row.product;
  const p = pickProductFromRow(row);
  /** Prefer product identifiers; bare `row.id` is often the wishlist line id, not the product. */
  const productIdRaw =
    nested?.id ??
    nested?.productId ??
    row.productId ??
    p.productId ??
    p.id ??
    row.wishlistId ??
    row.id;
  const productId = Math.round(numLike(productIdRaw));
  if (!Number.isFinite(productId) || productId <= 0) return null;

  const uri = firstWishlistImagePath(p, apiBase);

  const name =
    String(
      p.name ?? p.productName ?? p.title ?? p.displayName ?? ""
    ).trim() || `Product ${productId}`;

  const sale = numLike(
    p.finalPrice ?? p.sellingPrice ?? p.salePrice ?? p.price
  );
  const mrpRaw = numLike(p.mrp ?? p.maxRetailPrice);
  const mrp = Number.isFinite(mrpRaw) && mrpRaw > 0 ? mrpRaw : sale;
  const priceNum =
    Number.isFinite(sale) && sale > 0 ? Math.round(sale) : Math.round(mrp);
  const mrpNum = mrp > priceNum ? Math.round(mrp) : priceNum;

  return {
    cartId: String(productId),
    name,
    image: uri ? ({ uri } as ImageSourcePropType) : resolveProductImage(String(productId)),
    oldPrice: formatSuggestedInr(mrpNum),
    price: formatSuggestedInr(priceNum || mrpNum),
    rating: "4.5",
    priceNum: priceNum || mrpNum,
    mrpNum,
  };
}

/** Suggested for you — subcategory id; listing path via `productsBySubcategoryPath` in `services/api.tsx`. */
const SUGGESTED_FOR_YOU_SUBCATEGORY_ID = 164;

function subcategoryApiProductToSuggestedForYouItem(
  row: MorePicksApiProduct,
  apiBase: string
): SuggestedForYouGridItem | null {
  if (!apiProductRowCountsAsActive(row.status)) return null;
  const rawPid = row.id ?? row.productId;
  const productId =
    typeof rawPid === "string" ? Number.parseInt(rawPid, 10) : Number(rawPid);
  if (!Number.isFinite(productId) || productId <= 0) return null;

  const uri = firstWishlistImagePath(row as unknown as ApiWishlistProduct, apiBase);
  const name =
    String(row.name ?? row.productName ?? row.title ?? row.displayName ?? "").trim() ||
    `Product ${productId}`;

  const variants = Array.isArray(row.variants) ? row.variants : [];
  const v = variants.find((x) => x && x.inStock === true) ?? variants[0];
  const sale = numLike(
    v?.sellingPrice ?? v?.finalPrice ?? row.salePrice ?? row.sellingPrice ?? row.price
  );
  const mrpRaw = numLike(v?.mrpPrice ?? row.mrp ?? row.maxRetailPrice);
  const mrp = Number.isFinite(mrpRaw) && mrpRaw > 0 ? mrpRaw : sale;
  const priceNum =
    Number.isFinite(sale) && sale > 0 ? Math.round(sale) : Math.round(mrp);
  const mrpNum = mrp > priceNum ? Math.round(mrp) : priceNum;

  const rawVid = v?.id ?? v?.variantId;
  const vidNum =
    typeof rawVid === "string" ? Number.parseInt(rawVid, 10) : Number(rawVid);
  const variantId =
    Number.isFinite(vidNum) && vidNum > 0 ? Math.floor(vidNum) : undefined;

  return {
    cartId: String(productId),
    name,
    image: uri ? ({ uri } as ImageSourcePropType) : resolveProductImage(String(productId)),
    oldPrice: formatSuggestedInr(mrpNum),
    price: formatSuggestedInr(priceNum || mrpNum),
    rating: "4.5",
    priceNum: priceNum || mrpNum,
    mrpNum,
    ...(variantId != null ? { variantId } : {}),
  };
}

/** Mega Discounts strip + “see all” list — base URL in `services/api.tsx` */
const DISCOUNT_TOP_PRODUCTS_PATH = "/api/products/discount/top";

/** Home featured-picks rail — main category id; path via `productsByMainCategoryPath`. */
const STORE_SPOTLIGHT_MAIN_CATEGORY_ID = 28;
/** Route `subCategory` label for the full listing on `subcatProducts`. */
const STORE_SPOTLIGHT_LIST_TITLE = "Featured picks";

/** Premium finds — top selling by price (base URL in `services/api.tsx`) */
const TOP_SELLING_PRICE_PRODUCTS_PATH = "/api/products/top-selling-price";

type MegaDiscountHomeCard = {
  id: string;
  name: string;
  subtitle: string;
  image: ImageSourcePropType;
};

const STORE_SPOTLIGHT_HOME_FALLBACK: MegaDiscountHomeCard[] = [
  {
    id: "ss-fb-1",
    name: "Fashion Hub",
    subtitle: "Curated picks",
    image: require("../assets/images/image1.png"),
  },
  {
    id: "ss-fb-2",
    name: "Style Store",
    subtitle: "Curated picks",
    image: require("../assets/images/image2.png"),
  },
  {
    id: "ss-fb-3",
    name: "Trend Zone",
    subtitle: "Curated picks",
    image: require("../assets/images/image3.png"),
  },
  {
    id: "ss-fb-4",
    name: "Premium Shop",
    subtitle: "Curated picks",
    image: require("../assets/images/image4.png"),
  },
];

const MEGA_DISCOUNT_HOME_FALLBACK: MegaDiscountHomeCard[] = [
  {
    id: "1",
    name: "Women wear",
    subtitle: "Up to 60% off",
    image: require("../assets/images/megadis1.png"),
  },
  {
    id: "2",
    name: "New brand",
    subtitle: "Best deals",
    image: require("../assets/images/megadis2.png"),
  },
  {
    id: "3",
    name: "Performance",
    subtitle: "Flat 50% off",
    image: require("../assets/images/megadis3.png"),
  },
  {
    id: "4",
    name: "Stylish",
    subtitle: "Trending deals",
    image: require("../assets/images/megadis4.png"),
  },
];

type PremiumFindsHomeCard = {
  id: string;
  name: string;
  subtitle: string;
  image: ImageSourcePropType;
};

const PREMIUM_FINDS_HOME_FALLBACK: PremiumFindsHomeCard[] = [
  {
    id: "1",
    name: "Induction Cooktops",
    subtitle: "Selling from ₹399",
    image: require("../assets/images/premium1.png"),
  },
  {
    id: "2",
    name: "New",
    subtitle: "New collection",
    image: require("../assets/images/premium2.png"),
  },
  {
    id: "3",
    name: "Shirt",
    subtitle: "Trending now",
    image: require("../assets/images/premium3.png"),
  },
  {
    id: "4",
    name: "Mens wear",
    subtitle: "Best seller",
    image: require("../assets/images/premium4.png"),
  },
];

type FreshFindCard = {
  id: string;
  image: ImageSourcePropType;
};

const FRESH_FINDS_FALLBACK: FreshFindCard[] = [
  { id: "1", image: require("../assets/images/product1.png") },
  { id: "2", image: require("../assets/images/product2.png") },
  { id: "3", image: require("../assets/images/premium1.png") },
  { id: "4", image: require("../assets/images/premium2.png") },
];

function chunkFreshFindPairs(cards: FreshFindCard[]): FreshFindCard[][] {
  const pairs: FreshFindCard[][] = [];
  for (let i = 0; i < cards.length; i += 2) {
    pairs.push(cards.slice(i, i + 2));
  }
  return pairs;
}

type TopPickCard = {
  id: string;
  name: string;
  image: ImageSourcePropType;
};

const TOP_PICKS_FALLBACK: TopPickCard[] = [
  { id: "1", name: "Bangles ", image: require("../assets/images/look1.png") },
  { id: "2", name: "Clock", image: require("../assets/images/look2.png") },
  { id: "3", name: "accessories", image: require("../assets/images/look3.png") },
  { id: "4", name: "Women's wear  ", image: require("../assets/images/look4.png") },
];

const TOP_PICKS_FALLBACK_IDS = new Set(TOP_PICKS_FALLBACK.map((c) => c.id));

function looksLikeApiTopPicks(items: TopPickCard[]): boolean {
  return items.some((x) => !TOP_PICKS_FALLBACK_IDS.has(x.id));
}

function isAbortLikeError(e: unknown): boolean {
  const o = e as { code?: string; name?: string; message?: string };
  const msg = String(o?.message ?? "").toLowerCase();
  return (
    o?.code === "ERR_CANCELED" ||
    o?.name === "CanceledError" ||
    o?.name === "AbortError" ||
    msg.includes("canceled") ||
    msg.includes("cancelled") ||
    msg.includes("aborted")
  );
}

function formatInrAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function pickMorePicksVariant(p: MorePicksApiProduct): MorePicksApiVariant | undefined {
  const vs = Array.isArray(p.variants) ? p.variants : [];
  if (vs.length === 0) return undefined;
  const inStock = vs.find((v) => v && v.inStock === true);
  return inStock ?? vs[0];
}

function readVariantStockQty(v?: MorePicksApiVariant | null): number | null {
  if (!v) return null;
  const candidates = [v.quantity, v.availableQuantity, v.stock];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return Math.max(0, Math.floor(c));
    if (typeof c === "string" && c.trim()) {
      const n = Number(c);
      if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
    }
  }
  return null;
}

function readVariantInStock(v?: MorePicksApiVariant | null): boolean {
  if (!v) return true;
  const qty = readVariantStockQty(v);
  if (qty != null) return qty > 0;
  if (typeof v.inStock === "boolean") return v.inStock;
  if (typeof v.available === "boolean") return v.available;
  if (typeof v.stock === "boolean") return v.stock;
  return true;
}

function stockUiLabel(input: { inStock?: boolean; stockQty?: number } | null): {
  text: string;
  tone: "ok" | "low" | "out";
} {
  const inStock = input?.inStock !== false;
  const qty = typeof input?.stockQty === "number" ? input.stockQty : null;
  if (!inStock || qty === 0) return { text: "Out of stock", tone: "out" };
  if (qty != null && qty > 0 && qty <= 5) return { text: `Only ${qty} left`, tone: "low" };
  return { text: "In stock", tone: "ok" };
}

/** Backend may send `status: 1` / `"active"` / `"ACTIVE"`; treat unknown or empty as visible. */
function apiProductRowCountsAsActive(status: unknown): boolean {
  if (status === null || status === undefined) return true;
  if (typeof status === "number") return status === 1;
  const s = String(status).trim().toLowerCase();
  if (!s) return true;
  return (
    s === "active" ||
    s === "1" ||
    s === "true" ||
    s === "published" ||
    s === "enabled"
  );
}

/** Keys that often hold a product array (Spring Page, envelopes, storefront DTOs). */
const PRODUCT_LIST_ARRAY_KEYS = [
  "content",
  "data",
  "products",
  "items",
  "records",
  "results",
  "rows",
] as const;

/** Normalize list endpoints: raw array, Spring `content`, or `{ data: [...] | { content } }`. */
function normalizeProductListPayload(data: unknown, depth = 0): MorePicksApiProduct[] {
  if (depth > 6) return [];
  if (Array.isArray(data)) return data as MorePicksApiProduct[];
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;

  for (const key of PRODUCT_LIST_ARRAY_KEYS) {
    const v = o[key];
    if (Array.isArray(v)) return v as MorePicksApiProduct[];
  }

  const inner = o.data;
  if (inner != null && typeof inner === "object") {
    if (Array.isArray(inner)) return inner as MorePicksApiProduct[];
    return normalizeProductListPayload(inner, depth + 1);
  }

  return [];
}

/** Spring Data `Page` metadata when the popular endpoint returns a page object. */
function readSpringPageMeta(data: unknown): {
  last?: boolean;
  totalElements?: number;
} {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const o = data as Record<string, unknown>;
  const last = typeof o.last === "boolean" ? o.last : undefined;
  const totalElements =
    typeof o.totalElements === "number" ? o.totalElements : undefined;
  return { last, totalElements };
}

function mapMorePicksApiToGrid(
  rows: MorePicksApiProduct[],
  apiBase: string,
  placeholderImage: ImageSourcePropType,
  options?: { requireProductActive?: boolean }
): MorePicksGridItem[] {
  const root = apiBase.replace(/\/$/, "");
  const resolvePath = (p: string) => {
    const s = String(p ?? "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    // Only join relative paths when `services/api.tsx` defines `baseURL` — never hardcode a host here.
    if (!root) return "";
    return s.startsWith("/") ? `${root}${s}` : `${root}/${s}`;
  };

  const out: MorePicksGridItem[] = [];

  for (const p of rows) {
    if (options?.requireProductActive !== false) {
      if (!apiProductRowCountsAsActive(p.status)) continue;
    }

    const rawPid = p.id ?? p.productId;
    const idNum =
      typeof rawPid === "string"
        ? Number.parseInt(rawPid, 10)
        : Number(rawPid);
    if (!Number.isFinite(idNum) || idNum <= 0) continue;

    const primary = pickPrimaryProductImage(p.images);
    const uri = resolveProductPrimaryImageUri(primary, resolvePath);

    const name =
      String(
        p.name ?? p.productName ?? p.title ?? p.displayName ?? ""
      ).trim() || `Product ${idNum}`;

    const v = pickMorePicksVariant(p);
    const sale = Number(
      v?.sellingPrice ?? p.salePrice ?? p.sellingPrice ?? p.price ?? 0
    );
    const mrp = Number(
      v?.mrpPrice ?? p.mrp ?? p.maxRetailPrice ?? 0
    );

    let oldPrice: string | undefined;
    let discount: string | undefined;

    if (mrp > 0 && sale > 0 && mrp > sale) {
      oldPrice = formatInrAmount(mrp);
      discount = `${Math.round(((mrp - sale) / mrp) * 100)}%`;
    } else if (
      typeof v?.discountPercentage === "number" &&
      v.discountPercentage > 0
    ) {
      discount = `${Math.round(v.discountPercentage)}%`;
    } else if (
      typeof p.discountPercentage === "number" &&
      p.discountPercentage > 0
    ) {
      discount = `${Math.round(p.discountPercentage)}%`;
    }

    const rawVariantId = v?.id ?? v?.variantId;
    const variantIdNum =
      typeof rawVariantId === "string"
        ? Number.parseInt(rawVariantId, 10)
        : Number(rawVariantId);
    const variantId =
      Number.isFinite(variantIdNum) && variantIdNum > 0
        ? Math.floor(variantIdNum)
        : undefined;

    const stockQty = readVariantStockQty(v);
    const inStock = readVariantInStock(v);

    out.push({
      id: String(idNum),
      cartId: String(idNum),
      name,
      image: uri ? ({ uri } as const) : placeholderImage,
      rating: "0.0 (0)",
      price: sale > 0 ? formatInrAmount(sale) : "—",
      oldPrice,
      discount,
      variantId,
      inStock,
      stockQty: stockQty ?? undefined,
    });
  }

  return out;
}

const LATEST_PRODUCTS_FALLBACK: MorePicksGridItem[] = [
  {
    id: "1",
    cartId: "1",
    name: "Golden Bangles Set",
    image: require("../assets/images/latest1.png"),
    rating: "0.0 (0)",
    price: "₹1,446",
  },
  {
    id: "2",
    cartId: "2",
    name: "Traditional Meenakari P...",
    image: require("../assets/images/latest2.png"),
    rating: "0.0 (0)",
    price: "₹2,394",
    oldPrice: "₹3,999",
    discount: "50%",
  },
  {
    id: "3",
    cartId: "3",
    name: "Bridal Bangles Set",
    image: require("../assets/images/latest3.png"),
    rating: "0.0 (0)",
    price: "₹1,899",
  },
  {
    id: "4",
    cartId: "4",
    name: "Red Designer Bangles",
    image: require("../assets/images/latest4.png"),
    rating: "0.0 (0)",
    price: "₹1,599",
  },
];

type MainCategoryApi = {
  id: number;
  categoryName: string;
  image: string | null;
  mobileImage?: string | null;
  bannerImage?: string | null;
  status?: number;
};

/** Main category strip + Shop by Store — base URL from `services/api.tsx` */
const MAIN_CATEGORIES_PATH = "/api/categories/main";
const MAIN_CATEGORIES_CACHE_KEY = "@main_categories_cache_v2";

const MAIN_CATEGORY_PLACEHOLDER = require("../assets/MainCatImages/images/Kids.png") as ImageSourcePropType;

function normalizeMainCategoriesPayload(data: unknown): MainCategoryApi[] {
  if (Array.isArray(data)) return data as MainCategoryApi[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as MainCategoryApi[];
    if (Array.isArray(o.content)) return o.content as MainCategoryApi[];
    if (Array.isArray(o.products)) return o.products as MainCategoryApi[];
  }
  return [];
}

/** Resolve category image URL: absolute URLs unchanged; relative paths use current API origin. */
function resolveCategoryMediaUri(pathOrUrl: string, apiOrigin: string): string {
  const s = String(pathOrUrl ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const root = apiOrigin.replace(/\/+$/, "");
  if (!root) return s;
  if (s.startsWith("/")) return `${root}${s}`;
  if (/^(uploads\/)/i.test(s)) return `${root}/${s}`;
  return `${root}/uploads/${s}`;
}

function mainCategoryDisplayUri(row: MainCategoryApi, apiOrigin: string): string {
  const mobile = String(row.mobileImage ?? "").trim();
  if (mobile) return resolveCategoryMediaUri(mobile, apiOrigin);
  const banner = String(row.bannerImage ?? "").trim();
  if (banner) return resolveCategoryMediaUri(banner, apiOrigin);
  return resolveCategoryMediaUri(String(row.image ?? "").trim(), apiOrigin);
}

/**
 * Hero carousel assets — swap `image` per slide (image fills the card; `chromeGradient` tints browse strip).
 */
const HERO_BANNER_ASSETS = {
  banner1: require("../assets/images/accessarieshomebanner.png"),
  banner2: require("../assets/images/Clothinghomebanner.png"),
  banner3: require("../assets/images/Footwearhomebanner.png"),
  banner5: require("../assets/images/Homlyhubhomebanner.png"),
  banner6: require("../assets/images/Sportswearhomebanner.png"),
  banner7: require("../assets/images/Sweetsbannerhome.png"),
} as const;

const HERO_PROMO_CARDS: HeroPromoCard[] = [
  {
    id: "h1",
    /** Stadium / floodlight blues - matches `accessarieshomebanner.png` */
    chromeGradient: ["#1E3A8A", "#2563EB", "#0F172A"],
    cardGradient: ["#3B82F6", "#172554"],
    titleColor: "#FFFFFF",
    subtitleColor: "rgba(255,255,255,0.92)",
    title: "Up to 75% off",
    subtitle: "Limited-time deals storewide*",
    tag: "MEGA TECH DAYS",
    footer: "Up to 10% instant discount*",
    image: HERO_BANNER_ASSETS.banner1,
  },
  {
    id: "h2",
    /** Teal / cyan pitch lights - pairs with `Clothinghomebanner.png` */
    chromeGradient: ["#0E7490", "#0891B2", "#134E4A"],
    cardGradient: ["#22D3EE", "#0F766E"],
    titleColor: "#FFFFFF",
    subtitleColor: "rgba(255,255,255,0.92)",
    title: "Up to 50 back*",
    subtitle: "Pay safe, shop fast",
    tag: "PAY OFFERS",
    footer: "On eligible orders, T&C apply*",
    image: HERO_BANNER_ASSETS.banner2,
  },
  {
    id: "h3",
    /** Style / fashion - jewel greens - matches `Footwearhomebanner.png` */
    chromeGradient: ["#34D399", "#059669", "#064E3B"],
    cardGradient: ["#10B981", "#14532D"],
    titleColor: "#FFFFFF",
    subtitleColor: "rgba(255,255,255,0.92)",
    title: "Style fest",
    subtitle: "Fashion & footwear",
    tag: "STYLE EDIT",
    footer: "Extra savings on top brands*",
    image: HERO_BANNER_ASSETS.banner3,
  },
  {
    id: "h4",
    /** Warm market / essentials - matches `Homlyhubhomebanner.png` */
    chromeGradient: ["#FDBA74", "#EA580C", "#7C2D12"],
    cardGradient: ["#FB923C", "#9A3412"],
    titleColor: "#FFFFFF",
    subtitleColor: "rgba(255,255,255,0.94)",
    title: "Fresh deals",
    subtitle: "Daily essentials",
    tag: "FRESH PICKS",
    footer: "Free delivery on select orders*",
    image: HERO_BANNER_ASSETS.banner5,
  },
  {
    id: "h5",
    /** Sport / active - matches `Sportswearhomebanner.png` */
    chromeGradient: ["#F87171", "#DC2626", "#991B1B"],
    cardGradient: ["#EF4444", "#B91C1C"],
    titleColor: "#FFFFFF",
    subtitleColor: "rgba(255,255,255,0.94)",
    title: "Sports zone",
    subtitle: "Active wear & gear",
    tag: "SPORTS FEST",
    footer: "Up to 60% off on sports*",
    image: HERO_BANNER_ASSETS.banner6,
  },
  {
    id: "h6",
    /** Sweet treats - matches `Sweetsbannerhome.png` */
    chromeGradient: ["#FBBF24", "#F59E0B", "#92400E"],
    cardGradient: ["#FCD34D", "#B45309"],
    titleColor: "#FFFFFF",
    subtitleColor: "rgba(255,255,255,0.94)",
    title: "Sweet treats",
    subtitle: "Delicious sweets & snacks",
    tag: "SWEET CORNER",
    footer: "Special offers on sweets*",
    image: HERO_BANNER_ASSETS.banner7,
  },
];

function heroBannerByIdPath(id: number): string {
  const n = Math.floor(Number(id));
  if (!Number.isFinite(n) || n <= 0) return "/api/banners/0";
  return `/api/banners/${n}`;
}

const HERO_BANNERS_PATH = "/api/banners";
const HERO_BANNERS_ACTIVE_PATH = "/api/banners/active";
/** Home hero banners by explicit backend ids (`GET /api/banners/{id}`). */
const HOME_HERO_BANNER_IDS = [81, 82, 83, 84, 85, 86];

function normalizeHeroBannerRows(payload: unknown): HeroBannerApi[] {
  if (Array.isArray(payload)) return payload as HeroBannerApi[];
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as HeroBannerApi[];
    if (Array.isArray(o.content)) return o.content as HeroBannerApi[];
    if (Array.isArray(o.items)) return o.items as HeroBannerApi[];
    if (Array.isArray(o.results)) return o.results as HeroBannerApi[];
  }
  return [];
}

function extractSingleHeroBanner(payload: unknown): HeroBannerApi | null {
  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) return null;
    try {
      return extractSingleHeroBanner(JSON.parse(text));
    } catch {
      return null;
    }
  }
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;

  // Common API wrapper: { success, message, data: { ...banner } }
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return o.data as HeroBannerApi;
  }
  if (o.result && typeof o.result === "object" && !Array.isArray(o.result)) {
    return o.result as HeroBannerApi;
  }
  if (o.banner && typeof o.banner === "object" && !Array.isArray(o.banner)) {
    return o.banner as HeroBannerApi;
  }

  // Raw banner object response
  if (
    typeof o.id !== "undefined" ||
    typeof o.desktopImage !== "undefined" ||
    typeof o.mobileImage !== "undefined"
  ) {
    return o as HeroBannerApi;
  }
  return null;
}

function heroBannerStatusIsActive(status: unknown): boolean {
  if (status == null) return true;
  if (typeof status === "number") return status === 1;
  const s = String(status).trim().toLowerCase();
  return s === "1" || s === "true" || s === "active";
}

function mapHeroBannersFromApi(
  rows: HeroBannerApi[],
  apiOrigin: string,
  options?: { requireActive?: boolean }
): HeroPromoCard[] {
  const requireActive = options?.requireActive ?? true;
  const root = String(apiOrigin ?? "").trim().replace(/\/+$/, "");
  const resolveMedia = (pathOrUrl: unknown): string => {
    const s = String(pathOrUrl ?? "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (!root) return s;
    if (s.startsWith("/")) return `${root}${s}`;
    if (/^(uploads\/)/i.test(s)) return `${root}/${s}`;
    return `${root}/uploads/${s}`;
  };

  const out: HeroPromoCard[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (requireActive && !heroBannerStatusIsActive(row.status)) continue;
    const sourcePath = String(row.mobileImage ?? "").trim();
    const uri = resolveMedia(sourcePath);
    if (!uri) continue;
    const theme = HERO_PROMO_CARDS[i % HERO_PROMO_CARDS.length] ?? HERO_PROMO_CARDS[0]!;
    const name = String(row.name ?? row.title ?? "").trim();
    const desc = String(row.description ?? row.textContent ?? "").trim();
    out.push({
      ...theme,
      id: String(row.id ?? `api-hero-${i}`),
      title: name || theme.title,
      subtitle: desc || theme.subtitle,
      image: { uri },
      targetUrl: String(row.targetUrl ?? "").trim() || undefined,
    });
  }
  return out;
}

/** Below header: page + scroll base (clean white) */
const HOME_PAGE_BG = "#FFFFFF";

/**
 * Section surfaces — keep all sections pure white for a clean, consistent look.
 */
const PANEL_BROWSE = "#FFFFFF";
const PANEL_MEDIA = "#FFFFFF";
const PANEL_SUGGESTED = "#FFFFFF";
const PANEL_VIDEO = "#FFFFFF";
const PANEL_FRESH = "#FFFFFF";
const PANEL_BANNER2 = "#FFFFFF";
const PANEL_SHOP = "#FFFFFF";
const PANEL_FOCUS = "#FFFFFF";
const PANEL_LATEST = "#FFFFFF";
const PANEL_SELLER = "#FFFFFF";

const BORDER_BROWSE = "#B8C9DC";
const BORDER_MEDIA = "#E5D5CC";
const BORDER_SUGGESTED = "#CDC0E8";
const BORDER_VIDEO = "#A5D8F7";
const BORDER_FRESH = "#B8C9DC";
const BORDER_BANNER2 = "#A8BEE0";
const BORDER_SHOP = "#9FD9C4";
const BORDER_FOCUS = "#F5D0A8";
const BORDER_LATEST = "#CBD5E1";
const BORDER_SELLER = "#D8C4F0";

/**
 * Full feed background: keep it near-white so section spacing stays clean.
 */
const HOME_SCROLL_MESH_COLORS = [
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#FFFFFF",
  "#FAFAFA",
  "#F8FAFC",
  "#FFFFFF",
  "#F1F5F9",
  "#F8FAFC",
  "#FFFFFF",
] as const;

const HOME_SCROLL_MESH_LOCATIONS = [
  0, 0.1, 0.22, 0.34, 0.46, 0.55, 0.64, 0.73, 0.86, 1,
] as const;

/** Top header: clean "paper" gradient (professional + brand-safe) */
const HEADER_MESH_COLORS = [
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#FFFFFF",
  "#FFFBF7",
  "#FFF1E6",
  "#FFFFFF",
  "#FAFAFA",
  "#FFFFFF",
] as const;
const HEADER_MESH_LOCATIONS = [
  0, 0.12, 0.24, 0.36, 0.48, 0.58, 0.7, 0.85, 1,
] as const;

/** Greeting chip: white with soft orange wash */
const GREETING_CHIP_COLORS = [
  "#FFFFFF",
  "#FFFBF7",
  "#FFF1E6",
  "#FFEDD5",
  "#FFFFFF",
] as const;
const GREETING_CHIP_LOCS = [0, 0.22, 0.48, 0.72, 1] as const;

/** Logo ring: orange tones + white highlight */
const LOGO_RING_COLORS = [
  "#FB923C",
  "#FDBA74",
  "#FFFFFF",
  "#F97316",
  "#FED7AA",
  "#EA580C",
  "#FFF7ED",
  "#FFFFFF",
] as const;
const LOGO_RING_LOCATIONS = [0, 0.14, 0.28, 0.42, 0.55, 0.68, 0.82, 1] as const;

/** Search bar: white + peach-orange mix */
const SEARCH_BAR_MESH_COLORS = [
  "#FFFFFF",
  "#FFFEFC",
  "#FFF7ED",
  "#FFFFFF",
  "#FFEDD5",
  "#FFF8F3",
  "#FFFFFF",
] as const;
const SEARCH_BAR_MESH_LOCS = [0, 0.15, 0.32, 0.48, 0.62, 0.8, 1] as const;

/** Location pill: white → soft orange */
const LOCATION_MESH_COLORS = [
  "#FFFFFF",
  "#FFF7ED",
  "#FFEDD5",
  "#FDBA74",
  "#FFE4CC",
  "#FFFFFF",
] as const;
const LOCATION_MESH_LOCS = [0, 0.18, 0.38, 0.55, 0.72, 1] as const;

/** Greeting-chip promo sheet: saturated gold + magenta CTA */
const PROMO_MODAL_GRADIENT = [
  "#FBBF24",
  "#F59E0B",
  "#EAB308",
  "#CA8A04",
  "#FCD34D",
  "#F59E0B",
] as const;
const PROMO_MODAL_GRADIENT_LOCS = [0, 0.18, 0.38, 0.52, 0.68, 1] as const;

const PROMO_BOKEH = [
  { top: "6%", left: "4%", size: 64, opacity: 0.28 },
  { top: "14%", left: "78%", size: 48, opacity: 0.22 },
  { top: "28%", left: "12%", size: 40, opacity: 0.2 },
  { top: "40%", left: "88%", size: 56, opacity: 0.18 },
  { top: "52%", left: "6%", size: 36, opacity: 0.25 },
  { top: "68%", left: "72%", size: 44, opacity: 0.2 },
  { top: "22%", left: "42%", size: 72, opacity: 0.12 },
] as const;

const PROMO_HERO_IMAGE = require("../assets/images/middle.png");
const PROMO_CHAR_LEFT = require("../assets/images/left.png");
const PROMO_CHAR_RIGHT = require("../assets/images/left.png");
const PROMO_MODAL_STARS = [
  { top: "8%", left: "10%", size: 12, color: "#FFFFFF", dx: -4, dy: -5 },
  { top: "10%", left: "34%", size: 10, color: "#FFF7AE", dx: 3, dy: -4 },
  { top: "12%", left: "62%", size: 14, color: "#FFFFFF", dx: 4, dy: -6 },
  { top: "9%", left: "84%", size: 11, color: "#FDE68A", dx: -3, dy: -5 },
  { top: "24%", left: "18%", size: 13, color: "#FFF7AE", dx: -5, dy: 4 },
  { top: "28%", left: "46%", size: 12, color: "#FFFFFF", dx: 4, dy: 3 },
  { top: "30%", left: "76%", size: 10, color: "#FDE68A", dx: 5, dy: 4 },
  { top: "46%", left: "8%", size: 12, color: "#FFFFFF", dx: -4, dy: 5 },
  { top: "48%", left: "88%", size: 11, color: "#FFF7AE", dx: 5, dy: 4 },
  { top: "62%", left: "20%", size: 12, color: "#FDE68A", dx: -4, dy: 6 },
  { top: "66%", left: "50%", size: 14, color: "#FFFFFF", dx: 4, dy: 5 },
  { top: "70%", left: "80%", size: 12, color: "#FFF7AE", dx: 3, dy: 6 },
] as const;
const PROMO_STAR_BURST = [
  { x: -58, y: -42, size: 14, color: "#FFF7AE" },
  { x: 0, y: -64, size: 16, color: "#FFFFFF" },
  { x: 58, y: -38, size: 13, color: "#FDE68A" },
  { x: -72, y: 6, size: 12, color: "#FFFFFF" },
  { x: 74, y: 8, size: 12, color: "#FFF7AE" },
  { x: -42, y: 56, size: 13, color: "#FDE68A" },
  { x: 44, y: 58, size: 14, color: "#FFFFFF" },
] as const;

interface FilterItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  tint: { bubble: string; border: string; icon: string };
}

interface SavedDeliveryAddress {
  id: string;
  name: string;
  line: string;
  phone?: string;
}

const DELIVERY_ADDRESSES_STORAGE_KEY = "home_savedDeliveryAddresses_v1";

const DEFAULT_SAVED_DELIVERY_ADDRESSES: SavedDeliveryAddress[] = [
  {
    id: "1",
    name: "Sai Ramya",
    line: "Kphb colony, road no 3, phase 1, near shivalaya temple",
  },
  {
    id: "2",
    name: "Sai Ramya",
    line: "Brundhavan gardens 3/2rd line, Maduri girls hostel",
  },
];

export default function Home() {
 const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const { tr } = useLanguage();
  const insets = useSafeAreaInsets();
  const openSearchResults = useCallback(
    (rawQuery?: string) => {
      const q = String(rawQuery ?? "").trim();
      if (q) {
        router.push({ pathname: "/searchresults", params: { q } });
        return;
      }
      router.push({ pathname: "/searchresults" });
    },
    [router]
  );
  const openSubcatProducts = useCallback(
    (
      subCategory: string,
      extra?: {
        subcategoryId?: string;
        mainCategoryId?: string;
        productsSearchQ?: string;
        productsSearchCategoryId?: string;
        productsSearchSort?: string;
        productsSearchGender?: string;
      }
    ) => {
      router.push({
        pathname: "/subcatProducts",
        params: { subCategory, ...extra },
      } as any);
    },
    [router]
  );

  const homeBannerVideoPlayer = useVideoPlayer(
    require("../assets/images/homevideobanner.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  /** Explicit height so `VideoView` gets a non-zero layout (avoids black box with aspectRatio + absoluteFill). */
  const homeVideoBannerInnerW = width - 40;
  const homeVideoBannerHeight = Math.min(
    220,
    Math.max(160, Math.round((homeVideoBannerInnerW * 9) / 16))
  );

  const placeholderTexts = [
    " Shoes",
    " Womens Wear",
    " Fashion",
    " Sportswear",
  ];
  
  const [userDisplayName, setUserDisplayName] = useState("Ramya");

  const [deliveryAddressModalVisible, setDeliveryAddressModalVisible] =
    useState(false);
  const [promoSpotlightModalVisible, setPromoSpotlightModalVisible] =
    useState(false);
  const promoCtaPulseAnim = useRef(new Animated.Value(1)).current;
  const promoMascotFloatAnim = useRef(new Animated.Value(0)).current;
  const promoBlastAnim = useRef(new Animated.Value(0)).current;
  const [deliveryAddressSearchQuery, setDeliveryAddressSearchQuery] =
    useState("");
  const [_displayDeliveryLine, setDisplayDeliveryLine] = useState(
    "Kphb colony ,road no 3 ,phase 1,near shi..."
  );
  const [savedDeliveryAddresses, setSavedDeliveryAddresses] = useState<
    SavedDeliveryAddress[]
  >(DEFAULT_SAVED_DELIVERY_ADDRESSES);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] =
    useState("1");
  const [deliveryAddMode, setDeliveryAddMode] = useState<"list" | "add">(
    "list"
  );
  const [newAddressName, setNewAddressName] = useState("");
  const [newAddressPhone, setNewAddressPhone] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");

  const loadUserDisplayName = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("userDisplayName");
      if (stored?.trim()) {
        setUserDisplayName(stored.trim());
      }
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUserDisplayName();
      void (async () => {
        try {
          const showPromo = await AsyncStorage.getItem(SHOW_POST_LOGIN_PROMO_KEY);
          if (showPromo === "1") {
            await AsyncStorage.removeItem(SHOW_POST_LOGIN_PROMO_KEY);
            setPromoSpotlightModalVisible(true);
          }
        } catch {
          /* ignore */
        }
      })();
    }, [loadUserDisplayName])
  );

  useEffect(() => {
    if (!promoSpotlightModalVisible) {
      promoCtaPulseAnim.stopAnimation();
      promoMascotFloatAnim.stopAnimation();
      promoBlastAnim.stopAnimation();
      promoCtaPulseAnim.setValue(1);
      promoMascotFloatAnim.setValue(0);
      promoBlastAnim.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(promoCtaPulseAnim, {
          toValue: 1.06,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(promoCtaPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(promoMascotFloatAnim, {
          toValue: -8,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(promoMascotFloatAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    const blastLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(promoBlastAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(promoBlastAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    blastLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      blastLoop.stop();
    };
  }, [
    promoBlastAnim,
    promoCtaPulseAnim,
    promoMascotFloatAnim,
    promoSpotlightModalVisible,
  ]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(DELIVERY_ADDRESSES_STORAGE_KEY);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as SavedDeliveryAddress[];
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (a) =>
              a &&
              typeof a.id === "string" &&
              typeof a.name === "string" &&
              typeof a.line === "string"
          )
        ) {
          setSavedDeliveryAddresses(parsed);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSavedDeliveryAddresses = useCallback(
    async (next: SavedDeliveryAddress[]) => {
      setSavedDeliveryAddresses(next);
      try {
        await AsyncStorage.setItem(
          DELIVERY_ADDRESSES_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        /* ignore */
      }
    },
    []
  );

  const closeDeliveryModal = useCallback(() => {
    setDeliveryAddressModalVisible(false);
    setDeliveryAddressSearchQuery("");
    setDeliveryAddMode("list");
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddressLine("");
  }, []);

  const openAddNewAddressForm = useCallback(() => {
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddressLine("");
    setDeliveryAddMode("add");
  }, []);

  const goBackAddAddressForm = useCallback(() => {
    setDeliveryAddMode("list");
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddressLine("");
  }, []);

  const filteredDeliveryAddresses = useMemo(() => {
    const q = deliveryAddressSearchQuery.trim().toLowerCase();
    if (!q) return savedDeliveryAddresses;
    return savedDeliveryAddresses.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.line.toLowerCase().includes(q) ||
        (a.phone?.toLowerCase().includes(q) ?? false)
    );
  }, [savedDeliveryAddresses, deliveryAddressSearchQuery]);

  const selectDeliveryAddress = useCallback(
    (addr: SavedDeliveryAddress) => {
      setSelectedDeliveryAddressId(addr.id);
      setDisplayDeliveryLine(addr.line);
      closeDeliveryModal();
    },
    [closeDeliveryModal]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const result = await requestForegroundLocation();
    if (result.ok) {
      setDisplayDeliveryLine(result.addressLine);
      closeDeliveryModal();
    }
  }, [closeDeliveryModal]);

  const handleSaveNewAddress = useCallback(() => {
    const name = newAddressName.trim();
    const line = newAddressLine.trim();
    const phone = newAddressPhone.trim();
    if (!name || !line) {
      Alert.alert(
        "Missing details",
        "Please enter the recipient name and full address."
      );
      return;
    }
    const newAddr: SavedDeliveryAddress = {
      id: `addr-${Date.now()}`,
      name,
      line,
      ...(phone ? { phone } : {}),
    };
    void (async () => {
      const next = [...savedDeliveryAddresses, newAddr];
      await persistSavedDeliveryAddresses(next);
      setDeliveryAddMode("list");
      setNewAddressName("");
      setNewAddressPhone("");
      setNewAddressLine("");
      selectDeliveryAddress(newAddr);
    })();
  }, [
    newAddressName,
    newAddressLine,
    newAddressPhone,
    savedDeliveryAddresses,
    persistSavedDeliveryAddresses,
    selectDeliveryAddress,
  ]);

  const launchGoogleVoiceInput = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Voice search",
        "Google voice input is available on Android. On iPhone, type your search in the bar."
      );
      return;
    }
    try {
      const result = await IntentLauncher.startActivityAsync(
        "android.speech.action.RECOGNIZE_SPEECH",
        {
          extra: {
            "android.speech.extra.LANGUAGE_MODEL": "free_form",
            "android.speech.extra.PROMPT": "What do you want to search for?",
            "android.speech.extra.LANGUAGE": "en-US",
          },
        }
      );
      if (
        result.resultCode === IntentLauncher.ResultCode.Success &&
        result.extra
      ) {
        const e = result.extra as Record<string, unknown>;
        const raw =
          e["android.speech.extra.RESULTS"] ?? e.results;
        if (Array.isArray(raw) && raw.length > 0) {
          const spoken = String(raw[0]).trim();
          if (spoken) {

            router.push({ pathname: "/searchresults", params: { q: spoken } });
            openSearchResults(spoken);

          }
          return;
        }
      }
    } catch {
      Alert.alert(
        "Voice search",
        "Could not open speech recognition. Check Google / speech services on your device."
      );
    }
  };

  const startVoiceSearch = () => {
    Alert.alert(
      "Microphone access",
      "Allow microphone access to use voice search?",
      [
        { text: "Don't allow", style: "cancel" },
        { text: "Allow", onPress: () => void launchGoogleVoiceInput() },
      ]
    );
  };

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const topBarAnim = useRef(new Animated.Value(1)).current;
  const [topBarMounted, setTopBarMounted] = useState(true);
  const lastMainScrollY = useRef(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerIndex2, setBannerIndex2] = useState(0);
  const bannerCarouselRef = useRef<FlatList<HeroPromoCard> | null>(null);
  const bannerCarousel2Ref = useRef<FlatList<ImageSourcePropType> | null>(null);
  const rateCarouselRef = useRef<ScrollView>(null);
  const [rateIndex, setRateIndex] = useState(0);
  const [rateSelectionByCard, setRateSelectionByCard] = useState<
    Record<string, number>
  >({});

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedFilterSection, setSelectedFilterSection] = useState("Category");
  const [searchCategoryText, setSearchCategoryText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  /** Main category id from the home category strip API — sent as `categoryId` to `/api/products/search`. */
  const [selectedBrowseMainCategoryId, setSelectedBrowseMainCategoryId] = useState<
    string | null
  >(null);

  const applyHomeBrowseFilters = useCallback(() => {
    const genderLabel = selectedGender.trim();
    const parts: string[] = [];
    if (genderLabel) {
      const g = genderLabel.toLowerCase();
      if (g === "men") parts.push("men");
      else if (g === "women") parts.push("women");
      else if (g === "girls") parts.push("girls");
      else if (g === "boys") parts.push("boys");
      else parts.push(genderLabel);
    }
    for (const c of selectedCategory) {
      const t = c.trim();
      if (t) parts.push(t);
    }
    for (const vals of Object.values(selectedFilters)) {
      for (const v of vals) {
        const t = v.trim();
        if (t) parts.push(t);
      }
    }
    const q = parts.join(" ").replace(/\s+/g, " ").trim();

    let categoryIdNum = NaN;
    if (selectedBrowseMainCategoryId) {
      const n = Number.parseInt(String(selectedBrowseMainCategoryId), 10);
      if (Number.isFinite(n) && n > 0) categoryIdNum = n;
    }

    if (!q && !Number.isFinite(categoryIdNum)) {
      Alert.alert(
        "Choose filters",
        "Pick a department and/or gender, category, or filter options, then try again."
      );
      return;
    }

    router.push({
      pathname: "/subcatProducts",
      params: {
        subCategory: "Browse",
        ...(q ? { productsSearchQ: q } : {}),
        ...(Number.isFinite(categoryIdNum)
          ? { productsSearchCategoryId: String(categoryIdNum) }
          : {}),
        ...(selectedSort !== "Relevance" ? { productsSearchSort: selectedSort } : {}),
      },
    } as any);
  }, [
    router,
    selectedGender,
    selectedCategory,
    selectedFilters,
    selectedBrowseMainCategoryId,
    selectedSort,
  ]);

  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [cartBadgeCount, setCartBadgeCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [saveToWishlistVisible, setSaveToWishlistVisible] = useState(false);
  const [saveToWishlistChecked, setSaveToWishlistChecked] = useState(true);
  const [createCollectionVisible, setCreateCollectionVisible] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionPrivacy, setCollectionPrivacy] = useState<
    "private" | "shared" | "public"
  >("private");
  const [pendingWishlist, setPendingWishlist] =
    useState<HomeWishlistCandidate | null>(null);
  const [mainCategories, setMainCategories] = useState<
    { id: string; title: string; image: ImageSourcePropType; href: Href }[]
  >([]);

  const [morePicksItems, setMorePicksItems] =
    useState<MorePicksGridItem[]>(LATEST_PRODUCTS_FALLBACK);
  const [morePicksPage, setMorePicksPage] = useState(0);
  const [morePicksHasMore, setMorePicksHasMore] = useState(false);
  const [morePicksLoadingMore, setMorePicksLoadingMore] = useState(false);
  const morePicksLoadInFlightRef = useRef(false);

  const [megaDiscountCards, setMegaDiscountCards] = useState<MegaDiscountHomeCard[]>(
    MEGA_DISCOUNT_HOME_FALLBACK
  );

  const [storeSpotlightCards, setStoreSpotlightCards] = useState<MegaDiscountHomeCard[]>(
    STORE_SPOTLIGHT_HOME_FALLBACK
  );

  const [premiumFindsCards, setPremiumFindsCards] = useState<PremiumFindsHomeCard[]>(
    PREMIUM_FINDS_HOME_FALLBACK
  );

  const [freshFindsCards, setFreshFindsCards] =
    useState<FreshFindCard[]>(FRESH_FINDS_FALLBACK);

  const freshPairs = useMemo(
    () => chunkFreshFindPairs(freshFindsCards),
    [freshFindsCards]
  );

  const [topPicksItems, setTopPicksItems] = useState<TopPickCard[]>(TOP_PICKS_FALLBACK);
  /** After preview fetch: more pages / larger total on server (arrow opens full list on subcat). */
  const [topPicksHasMoreOnServer, setTopPicksHasMoreOnServer] = useState(false);
  const topPicksRequestIdRef = useRef(0);

  const topPicksVisible = useMemo(
    () => topPicksItems.slice(0, TOP_PICKS_PREVIEW_SIZE),
    [topPicksItems]
  );

  const topPicksShowArrow = useMemo(
    () => topPicksItems.length > 0 || topPicksHasMoreOnServer,
    [topPicksItems.length, topPicksHasMoreOnServer]
  );

  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedForYouGridItem[]>(
    SUGGESTED_FOR_YOU_FALLBACK
  );
  const [heroPromoCards, setHeroPromoCards] = useState<HeroPromoCard[]>([]);

  const categoryNameToHref = useCallback((name: string): Href => {
    const normalized = String(name ?? "").trim().toLowerCase();
    if (normalized === "kids") return "/kids";
    if (normalized === "men") return "/men";
    if (normalized === "women") return "/women";
    if (normalized === "sportswear") return "/sportswear";
    if (normalized === "footwear") return "/footwear";
    if (normalized === "accessories") return "/accessories";
    if (normalized === "sweets") return "/sweets";
    if (normalized === "homely hub") return "/gifts";
    if (normalized === "indoor play") return "/indoorplay" as Href;
    if (normalized === "beauty & personal care")
      return "/beauty-personal-care" as Href;
    // Default: open the full categories screen
    return "/categories";
  }, []);

  const parseRupee = useCallback((value?: string) => {
    const raw = String(value ?? "").replace(/[^\d.]/g, "");
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const reloadWishlistBadge = useCallback(async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    if (token) {
      try {
        const { data } = await homeApiGet<unknown>(WISHLIST_USER_PATH);
        const rows = normalizeWishlistApiRows(data);
        const ids = new Set<string>();
        for (const row of rows) {
          const pid = Math.floor(Number(row.productId));
          if (Number.isFinite(pid) && pid > 0) {
            ids.add(String(pid));
          }
        }
        setWishlistCount(rows.length);
        setWishlistIds(ids);
        return;
      } catch {
        // Fall back to local state when API fails.
      }
    }
    const list = await loadWishlist();
    const ids = await getWishlistIds();
    setWishlistCount(list.length);
    setWishlistIds(ids);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadWishlistBadge();
    }, [reloadWishlistBadge])
  );

  const reloadNotificationBadge = useCallback(async () => {
    try {
      const userId = await getCurrentUserIdFromToken();
      const count = await fetchUnreadNotificationCount(userId);
      setNotificationCount(count);
    } catch {
      // Keep existing value on API failure.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadNotificationBadge();
    }, [reloadNotificationBadge])
  );

  const reloadCartBadge = useCallback(async () => {
    setCartBadgeCount(await getCartUnitCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadCartBadge();
    }, [reloadCartBadge])
  );

  const bumpCartBadgeAfterAdd = useCallback(() => {
    setCartBadgeCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mapRows = (rows: MainCategoryApi[]) => {
        const apiOrigin = String(
          (api.defaults.baseURL as string | undefined) ?? ""
        ).trim();
        return rows
          .filter((x) => (typeof x.status === "number" ? x.status === 1 : true))
          .map((x) => {
            const uri = mainCategoryDisplayUri(x, apiOrigin);
            return {
              id: String(x.id),
              title: x.categoryName,
              image: uri ? ({ uri } as ImageSourcePropType) : MAIN_CATEGORY_PLACEHOLDER,
              href: categoryNameToHref(x.categoryName),
            };
          });
      };

      try {
        const { data } = await homeApiGet<unknown>(MAIN_CATEGORIES_PATH);
        if (cancelled) return;
        const rows = normalizeMainCategoriesPayload(data);
        setMainCategories(mapRows(rows));
        await AsyncStorage.setItem(MAIN_CATEGORIES_CACHE_KEY, JSON.stringify(rows));
      } catch {
        if (cancelled) return;
        try {
          const cached = await AsyncStorage.getItem(MAIN_CATEGORIES_CACHE_KEY);
          const parsed = cached ? (JSON.parse(cached) as unknown) : [];
          const rows = normalizeMainCategoriesPayload(parsed);
          setMainCategories(mapRows(rows));
        } catch {
          setMainCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryNameToHref]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const apiOrigin = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const targetIds = HOME_HERO_BANNER_IDS.map((id) => String(id));
        const rowsByIdMap = new Map<string, HeroBannerApi>();
        const backendOrderIds: string[] = [];

        // Primary source: full banners list from `/api/banners`, then pick configured IDs.
        try {
          const { data: bannersData } = await homeApiGet<unknown>(HERO_BANNERS_PATH);
          if (cancelled) return;
          const rows = normalizeHeroBannerRows(bannersData);
          for (const row of rows) {
            const key = String(row.id ?? "").trim();
            if (!key || !targetIds.includes(key) || rowsByIdMap.has(key)) continue;
            rowsByIdMap.set(key, row);
            backendOrderIds.push(key);
          }
        } catch {
          // We'll try `/api/banners/active` + direct id endpoints below.
        }

        // Secondary source: active list (handles deployments where `/api/banners` differs).
        if (rowsByIdMap.size < targetIds.length) {
          try {
            const { data: activeData } = await homeApiGet<unknown>(HERO_BANNERS_ACTIVE_PATH);
            if (cancelled) return;
            const activeRows = normalizeHeroBannerRows(activeData);
            for (const row of activeRows) {
              const key = String(row.id ?? "").trim();
              if (!key || !targetIds.includes(key) || rowsByIdMap.has(key)) continue;
              rowsByIdMap.set(key, row);
              backendOrderIds.push(key);
            }
          } catch {
            // We'll try direct id endpoints below.
          }
        }

        // Fallback source: direct /api/banners/{id} for any missing IDs.
        const missingIds = targetIds.filter((id) => !rowsByIdMap.has(id));
        if (missingIds.length > 0) {
          const idResults = await Promise.allSettled(
            missingIds.map((id) => homeApiGet<unknown>(heroBannerByIdPath(Number(id))))
          );
          if (cancelled) return;
          for (const r of idResults) {
            if (r.status !== "fulfilled") continue;
            const payload = r.value.data;
            if (Array.isArray(payload)) {
              for (const row of payload as HeroBannerApi[]) {
                const key = String(row.id ?? "").trim();
                if (!key || !targetIds.includes(key) || rowsByIdMap.has(key)) continue;
                rowsByIdMap.set(key, row);
                backendOrderIds.push(key);
              }
            } else {
              const one = extractSingleHeroBanner(payload);
              const key = String(one?.id ?? "").trim();
              if (one && key && targetIds.includes(key) && !rowsByIdMap.has(key)) {
                rowsByIdMap.set(key, one);
                backendOrderIds.push(key);
              }
            }
          }
        }

        const idsInRenderOrder =
          backendOrderIds.length > 0
            ? backendOrderIds
            : targetIds;

        const orderedRows: HeroBannerApi[] = idsInRenderOrder
          .map((id) => rowsByIdMap.get(id))
          .filter((x): x is HeroBannerApi => x != null);

        const mappedById = mapHeroBannersFromApi(orderedRows, apiOrigin, {
          requireActive: false,
        });
        if (mappedById.length > 0) {
          setHeroPromoCards(mappedById);
          return;
        }
        setHeroPromoCards(HERO_PROMO_CARDS);
      } catch {
        if (!cancelled) setHeroPromoCards(HERO_PROMO_CARDS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const allRows: MorePicksApiProduct[] = [];
        let page = 0;
        let hasNext = true;

        while (hasNext && page < MORE_PICKS_MAX_BOOTSTRAP_PAGES) {
          const { data } = await homeApiGet<MorePicksPageResponse>(MORE_PICKS_PRODUCTS_PATH, {
            params: { page, size: MORE_PICKS_PAGE_SIZE, sort: "createdAt,desc" },
          });
          if (cancelled) return;
          const rows = normalizeProductListPayload(data);
          const meta = readSpringPageMeta(data);
          if (rows.length > 0) {
            allRows.push(...rows);
          }
          const last =
            meta.last === true ||
            rows.length === 0 ||
            rows.length < MORE_PICKS_PAGE_SIZE;
          hasNext = !last;
          page += 1;
        }

        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          allRows,
          base,
          LATEST_PRODUCTS_FALLBACK[0].image,
          { requireProductActive: false }
        );
        if (mapped.length > 0) {
          setMorePicksItems(mapped);
          setMorePicksPage(0);
          setMorePicksHasMore(false); // We already loaded all products once during initial bootstrap.
        }
      } catch {
        /* keep LATEST_PRODUCTS_FALLBACK */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMoreMorePicks = useCallback(async () => {
    if (!morePicksHasMore || morePicksLoadingMore || morePicksLoadInFlightRef.current) {
      return;
    }
    morePicksLoadInFlightRef.current = true;
    setMorePicksLoadingMore(true);
    const nextPage = morePicksPage + 1;
    try {
      const { data } = await homeApiGet<MorePicksPageResponse>(MORE_PICKS_PRODUCTS_PATH, {
        params: { page: nextPage, size: MORE_PICKS_PAGE_SIZE, sort: "createdAt,desc" },
      });
      const rows = normalizeProductListPayload(data);
      const meta = readSpringPageMeta(data);
      const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
      const mapped = mapMorePicksApiToGrid(
        rows,
        base,
        LATEST_PRODUCTS_FALLBACK[0].image,
        { requireProductActive: false }
      );
      if (mapped.length > 0) {
        setMorePicksItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const extra = mapped.filter((m) => !seen.has(m.id));
          return [...prev, ...extra];
        });
      }
      setMorePicksPage(nextPage);
      const last =
        meta.last === true ||
        rows.length === 0 ||
        rows.length < MORE_PICKS_PAGE_SIZE;
      setMorePicksHasMore(!last);
    } catch {
      setMorePicksHasMore(false);
    } finally {
      setMorePicksLoadingMore(false);
      morePicksLoadInFlightRef.current = false;
    }
  }, [morePicksHasMore, morePicksLoadingMore, morePicksPage]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await homeApiGet<unknown>(DISCOUNT_TOP_PRODUCTS_PATH);
        if (cancelled) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          MEGA_DISCOUNT_HOME_FALLBACK[0].image,
          { requireProductActive: false }
        );
        const cards: MegaDiscountHomeCard[] = mapped.slice(0, 8).map((m) => ({
          id: m.id,
          name: m.name,
          subtitle:
            m.discount && String(m.discount).trim() && m.discount !== "—"
              ? `${m.discount} off`
              : m.oldPrice
                ? `From ${m.price}`
                : "Limited deal",
          image: m.image,
        }));
        if (cards.length > 0) setMegaDiscountCards(cards);
      } catch {
        /* keep MEGA_DISCOUNT_HOME_FALLBACK */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await homeApiGet<unknown>(
          productsByMainCategoryPath(STORE_SPOTLIGHT_MAIN_CATEGORY_ID)
        );
        if (cancelled) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          STORE_SPOTLIGHT_HOME_FALLBACK[0].image,
          { requireProductActive: false }
        );
        const cards: MegaDiscountHomeCard[] = mapped.slice(0, 4).map((m) => ({
          id: m.id,
          name: m.name,
          subtitle:
            m.discount && String(m.discount).trim() && m.discount !== "—"
              ? `${m.discount} off`
              : m.price && String(m.price).trim() && m.price !== "—"
                ? `From ${m.price}`
                : "Featured pick",
          image: m.image,
        }));
        if (cards.length > 0) setStoreSpotlightCards(cards);
      } catch {
        /* keep STORE_SPOTLIGHT_HOME_FALLBACK */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await homeApiGet<unknown>(TOP_SELLING_PRICE_PRODUCTS_PATH);
        if (cancelled) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          PREMIUM_FINDS_HOME_FALLBACK[0].image,
          { requireProductActive: false }
        );
        const cards: PremiumFindsHomeCard[] = mapped.slice(0, 8).map((m) => ({
          id: m.id,
          name: m.name,
          subtitle:
            m.price && String(m.price).trim() && m.price !== "—"
              ? `Selling ${m.price}`
              : "Top value",
          image: m.image,
        }));
        if (cards.length > 0) setPremiumFindsCards(cards);
      } catch {
        /* keep PREMIUM_FINDS_HOME_FALLBACK */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await homeApiGet<unknown>(FRESH_FINDS_RECENT_PATH);
        if (cancelled) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          LATEST_PRODUCTS_FALLBACK[0].image,
          { requireProductActive: false }
        );
        const cards: FreshFindCard[] = mapped.map((m) => ({
          id: m.id,
          image: m.image,
        }));
        if (cards.length > 0) setFreshFindsCards(cards);
      } catch {
        /* keep FRESH_FINDS_FALLBACK */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const max = Math.max(0, freshPairs.length - 1);
    setActiveIndex((i) => Math.min(Math.max(0, i), max));
  }, [freshPairs.length]);

  const onTopPicksArrowPress = useCallback(() => {
    openSubcatProducts("Top picks for you");
  }, [openSubcatProducts]);

  useFocusEffect(
    useCallback(() => {
      const myRequestId = ++topPicksRequestIdRef.current;
      const ac = new AbortController();
      setTopPicksHasMoreOnServer(false);
      void (async () => {
        try {
          const { data } = await homeApiGet<unknown>(TOP_PICKS_POPULAR_PATH, {
            params: {
              page: 0,
              size: TOP_PICKS_PREVIEW_SIZE,
              sort: "createdAt,desc",
            },
            signal: ac.signal,
          });
          if (myRequestId !== topPicksRequestIdRef.current) return;
          const rows = normalizeProductListPayload(data);
          const meta = readSpringPageMeta(data);
          const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
          const mapped = mapMorePicksApiToGrid(
            rows,
            base,
            TOP_PICKS_FALLBACK[0].image,
            { requireProductActive: false }
          );
          const cards: TopPickCard[] = mapped.map((m) => ({
            id: m.id,
            name: m.name,
            image: m.image,
          }));
          if (myRequestId !== topPicksRequestIdRef.current) return;

          const hasMoreOnServer =
            meta.last === false ||
            (typeof meta.totalElements === "number" &&
              meta.totalElements > cards.length);

          if (cards.length > 0) {
            setTopPicksItems(cards);
            setTopPicksHasMoreOnServer(hasMoreOnServer);
            return;
          }
          setTopPicksHasMoreOnServer(false);
          setTopPicksItems((prev) =>
            looksLikeApiTopPicks(prev) ? prev : TOP_PICKS_FALLBACK
          );
        } catch (e) {
          if (myRequestId !== topPicksRequestIdRef.current) return;
          if (isAbortLikeError(e)) return;
          setTopPicksHasMoreOnServer(false);
          setTopPicksItems((prev) =>
            looksLikeApiTopPicks(prev) ? prev : TOP_PICKS_FALLBACK
          );
        }
      })();
      return () => {
        ac.abort();
      };
    }, [])
  );

  const loadSuggestedForYouFromSubcategoryApi = useCallback(async () => {
    try {
      const { data } = await homeApiGet<unknown>(
        productsBySubcategoryPath(SUGGESTED_FOR_YOU_SUBCATEGORY_ID)
      );
      const apiBase = String((api.defaults.baseURL as string | undefined) ?? "").trim();
      const rows = normalizeProductListPayload(data);
      const mapped = rows
        .map((r) => subcategoryApiProductToSuggestedForYouItem(r, apiBase))
        .filter((x): x is SuggestedForYouGridItem => x != null);
      if (mapped.length > 0) {
        setSuggestedProducts(mapped.slice(0, 8));
      } else {
        setSuggestedProducts(SUGGESTED_FOR_YOU_FALLBACK);
      }
    } catch {
      setSuggestedProducts(SUGGESTED_FOR_YOU_FALLBACK);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSuggestedForYouFromSubcategoryApi();
    }, [loadSuggestedForYouFromSubcategoryApi])
  );

  const openSaveToWishlistSheet = useCallback((p: HomeWishlistCandidate) => {
    setPendingWishlist(p);
    setSaveToWishlistChecked(true);
    setSaveToWishlistVisible(true);
  }, []);

  const renderMorePickCell = useCallback(
    (item: MorePicksGridItem, index: number) => {
      const ratingValue = Number.parseFloat(String(item.rating).split(" ")[0]) || 0;
      const col = index % 2;
      const stock = stockUiLabel(item);
      const addDisabled = stock.tone === "out";
      return (
        <View style={styles.latestGridCell} key={`mp-${item.id}-${index}`}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.latestGridCard,
              col === 0 ? styles.latestGridCardDividerRight : null,
              styles.latestGridCardDividerBottom,
            ]}
            onPress={() =>
              router.push({ pathname: "/productdetail", params: { id: item.id } })
            }
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, open product`}
          >
            <View style={styles.latestGridImageWrap}>
              <Image source={item.image} style={styles.latestGridImage} resizeMode="cover" />

              <TouchableOpacity
                style={styles.latestGridWishBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name} to wishlist`}
                onPress={() =>
                  openSaveToWishlistSheet({
                    id: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    oldPrice: item.oldPrice,
                    variantId: item.variantId,
                  })
                }
              >
                <Ionicons
                  name={wishlistIds.has(item.id) ? "heart" : "heart-outline"}
                  size={18}
                  color={wishlistIds.has(item.id) ? "#E11D48" : "#111827"}
                />
              </TouchableOpacity>

              {item.discount ? (
                <View style={styles.latestGridDiscountPill}>
                  <Text style={styles.latestGridDiscountPillText}>{item.discount} off</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.latestGridBody}>
              <Text style={styles.latestGridTitle} numberOfLines={2}>
                {item.name}
              </Text>

              <View style={styles.latestGridPriceRow}>
                <View style={styles.latestGridPriceCol}>
                  <Text style={styles.latestGridPriceCaption}>Selling</Text>
                  <Text style={styles.latestGridPrice}>{item.price}</Text>
                </View>
                {item.oldPrice ? (
                  <View style={styles.latestGridPriceCol}>
                    <Text style={styles.latestGridPriceCaption}>MRP</Text>
                    <Text style={styles.latestGridOldPrice}>{item.oldPrice}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.latestGridMetaRow}>
                <View style={styles.latestGridRatingPill}>
                  <Ionicons name="star" size={14} color="#FFFFFF" />
                  <Text style={styles.latestGridRatingText}>{ratingValue.toFixed(1)}</Text>
                </View>
                <View
                  style={[
                    styles.latestGridStockPill,
                    stock.tone === "ok"
                      ? styles.latestGridStockPillOk
                      : stock.tone === "low"
                        ? styles.latestGridStockPillLow
                        : styles.latestGridStockPillOut,
                  ]}
                  accessibilityRole="text"
                  accessibilityLabel={`Stock: ${stock.text}`}
                >
                  <Text
                    style={[
                      styles.latestGridStockText,
                      stock.tone === "out" ? styles.latestGridStockTextOut : null,
                    ]}
                    numberOfLines={1}
                  >
                    {stock.text}
                  </Text>
                </View>
              </View>

              <View style={styles.latestGridAddCartRow}>
                <TouchableOpacity
                  style={[
                    styles.latestGridAddCartButton,
                    addDisabled ? styles.latestGridAddCartButtonDisabled : null,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (addDisabled) {
                      Alert.alert("Out of stock", `${item.name} is currently unavailable.`);
                      return;
                    }
                    void (async () => {
                      const pid = Math.floor(Number(item.cartId ?? item.id));
                      const r = await addToCartPtbOrLocal({
                        productId: pid,
                        variantId: item.variantId,
                        quantity: 1,
                        localLine: {
                          id: item.cartId ?? item.id,
                          name: item.name,
                          price: parseRupee(item.price),
                          mrp: parseRupee(item.oldPrice ?? item.price),
                        },
                      });
                      if (r.ok === false) {
                        Alert.alert("Cart", r.message);
                        return;
                      }
                      bumpCartBadgeAfterAdd();
                      setTimeout(() => {
                        Alert.alert(
                          "Added to cart",
                          `${item.name} is in your cart.`
                        );
                      }, 0);
                    })();
                  }}
                  disabled={addDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={
                    addDisabled ? `${item.name} is out of stock` : `Add ${item.name} to cart`
                  }
                >
                  <Text style={styles.latestGridAddCartButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [bumpCartBadgeAfterAdd, openSaveToWishlistSheet, parseRupee, router, wishlistIds]

























































































    
  );

  const handleConfirmSaveToWishlist = useCallback(async () => {
    if (!pendingWishlist) {
      setSaveToWishlistVisible(false);
      return;
    }

    if (!saveToWishlistChecked) {
      setSaveToWishlistVisible(false);
      setPendingWishlist(null);
      return;
    }

    const token = (await AsyncStorage.getItem("token"))?.trim();
    if (!token) {
      Alert.alert(
        "Sign in required",
        "Please log in to save items to your wishlist."
      );
      return;
    }

    const productId = Math.floor(Number(pendingWishlist.id));
    if (!Number.isFinite(productId) || productId <= 0) {
      Alert.alert("Cannot add", "Invalid product.");
      return;
    }

    const variantId = pendingWishlist.variantId;
    if (
      variantId == null ||
      !Number.isFinite(variantId) ||
      Math.floor(variantId) <= 0
    ) {
      Alert.alert(
        "Cannot add to wishlist",
        "This listing does not include a variant id. Open the product page, choose size or color, then add to wishlist."
      );
      return;
    }

    const line: PersistedWishlistLine = {
      id: pendingWishlist.id,
      name: pendingWishlist.name,
      price: parseRupee(pendingWishlist.price),
      mrp: Math.max(
        parseRupee(pendingWishlist.oldPrice),
        parseRupee(pendingWishlist.price)
      ),
    };

    try {
      const { productName: nameFromServer } = await postWishlistAdd(
        productId,
        Math.floor(variantId)
      );

      await addWishlistProductIfAbsent(line);
      await reloadWishlistBadge();
      setSaveToWishlistVisible(false);
      setPendingWishlist(null);

      Alert.alert(
        "Added to wishlist",
        (nameFromServer && nameFromServer.trim()) || line.name
      );
    } catch (e: unknown) {
      Alert.alert(
        "Wishlist",
        parseWishlistApiError(
          e,
          "We could not add this item to your wishlist. Please try again."
        )
      );
    }
  }, [
    parseRupee,
    pendingWishlist,
    reloadWishlistBadge,
    saveToWishlistChecked,
  ]);

const banners2 = [
  require("../assets/images/banner6.png"),
  require("../assets/images/banner7.png"),
  require("../assets/images/banner8.png"),
   require("../assets/images/banner9.png"),
];

  const rateCards = RATE_PURCHASE_CARDS;

  const openShareExperience = useCallback(
    (card: RatePurchaseCard, rating: number) => {
      const r = Math.min(5, Math.max(1, Math.round(rating)));
      setRateSelectionByCard((prev) => ({ ...prev, [card.id]: r }));
      router.push({
        pathname: "/share-experience",
        params: {
          productId: card.id,
          rating: String(r),
        },
      } as Href);
    },
    [router]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) =>
        prev === placeholderTexts.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const n = heroPromoCards.length;
    if (n <= 1) return undefined;
    const interval = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % n;
        bannerCarouselRef.current?.scrollToOffset({
          offset: next * HERO_PROMO_SNAP_STRIDE,
          animated: true,
        });
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [heroPromoCards.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex2((prev) => {
        const next = (prev + 1) % banners2.length;
        bannerCarousel2Ref.current?.scrollToIndex({
          index: next,
          animated: true,
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [banners2.length]);

  useEffect(() => {
    const n = rateCards.length;
    if (n <= 1) return undefined;
    const interval = setInterval(() => {
      setRateIndex((prev) => {
        const next = (prev + 1) % n;
        rateCarouselRef.current?.scrollTo({
          x: next * width,
          y: 0,
          animated: true,
        });
        return next;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [rateCards.length]);

useEffect(() => {
  const interval = setInterval(() => {
    setMegaBannerIndex((prev) =>
      prev === megaBanners.length - 1 ? 0 : prev + 1
    );
  }, 3000);


  




  return () => clearInterval(interval);
}, []);



  const categories: {
    name: string;
    image: ReturnType<typeof require>;
    href: Href;
  }[] = [
    {
      name: "Kids Wear",
      image: require("../assets/MainCatImages/images/Kids.png"),
      href: "/kids",
    },
    {
      name: "Mens Wear",
      image: require("../assets/MainCatImages/images/Men.png"),
      href: "/men",
    },
    {
      name: "Womens Wear",
      image: require("../assets/MainCatImages/images/Women.png"),
      href: "/women",
    },
    {
      name: "Play",
      image: require("../assets/MainCatImages/images/IndoorPlayEquipments.png"),
      href: "/indoorplay" as Href,
    },
    {
      name: "Gargi",
      image: require("../assets/MainCatImages/images/Gaargi.png"),
      href: "/subcate",
    },
    {
      name: "Sweets",
      image: require("../assets/MainCatImages/images/Sweets.png"),
      href: "/sweets",
    },
    {
      name: "Foot Wear",
      image: require("../assets/MainCatImages/images/Footwear.png"),
      href: "/footwear",
    },
    {
      name: "Sports Wear",
      image: require("../assets/MainCatImages/images/Sportswear.png"),
      href: "/sportswear",
    },
    {
      name: "Accessories",
      image: require("../assets/MainCatImages/images/Accessories.png"),
      href: "/accessories",
    },
    {
      name: "Homelyhub",
      image: require("../assets/MainCatImages/images/HomelyHub.png"),
      href: "/gifts",
    },
    {
      name: "Skin and Beauty",
      image: require("../assets/MainCatImages/images/Beauty&PersonalCare.png"),
      href: "/beauty-personal-care" as Href,
    },
  ];

  const sortOptions = [
    "Relevance",
    "New Arrivals",
    "Price (High to Low)",
    "Price (Low to High)",
    "Ratings",
    "Discount",
  ];

  const genderOptions = [
    {
      label: "Women",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    },
    {
      label: "Men",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    },
    {
      label: "Girls",
      image:
        "https://www.jiomart.com/images/product/original/rvqld2qupj/trilok-fab-girls-woven-design-art-silk-dress-product-images-rvqld2qupj-3-202409231515.jpg?im=Resize=(500,630)",
    },
    {
      label: "Boys",
      image:
        "https://images.unsplash.com/photo-1627639679638-8485316a4b21?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3V0ZSUyMGtpZHxlbnwwfHwwfHx8MA%3D%3D",
    },
  ];

  const categoryOptions = [
    "Women Bra",
    "Hair Accessories",
    "Women T-shirts",
    "Women Tops And Tunics",
    "Women Bangles & Bracelets",
    "Kids Toys",
    "Men Shirts",
    "Men T-shirts",
    "Women Dupatta Sets",
    "Women Kurta Sets",
    "Women Kurtis",
    "Dupatta Sets",
    "Analog Watches",
    "Bakeware",
    "Bedsheets",
    "Bike Covers",
    "Blouses",
    "Bluetooth Headphones",
  ];

  const filterSections = [
    "Category",
    "Gender",
    "Color",
    "Fabric",
    "Dial Shape",
    "Size",
    "Price",
    "Rating",
    "Occassion",
    "combo of",
    "Kurta Fabric",
    "Dupatta Color",
  ];

  const filterOptions: Record<string, string[]> = {
    Category: categoryOptions,
    Identity: ["Women", "Men", "Girls", "Boys"],
    Color: ["Black", "Blue", "Pink", "Red", "White", "Green"],
    Fabric: ["Cotton", "Rayon", "Silk", "Polyester", "Linen"],
    "Dial Shape": ["Round", "Square", "Oval", "Rectangle"],
    Size: ["XS", "S", "M", "L", "XL", "XXL"],
    Price: ["Below ₹299", "₹300 - ₹499", "₹500 - ₹999", "Above ₹1000"],
    Rating: ["4★ & above", "3★ & above", "2★ & above"],
    Occassion: ["Casual", "Party", "Festive", "Wedding"],
    "combo of": ["Pack of 1", "Pack of 2", "Pack of 3", "Pack of 5"],
    "Kurta Fabric": ["Cotton", "Silk", "Rayon", "Georgette"],
    "Dupatta Color": ["Pink", "Red", "Yellow", "Blue", "White"],
  };

  const handleFilterPress = (label: string) => {
    if (label === "Sort") setSortModalVisible(true);
    if (label === "Category") setCategoryModalVisible(true);
    if (label === "Gender") setGenderModalVisible(true);
    if (label === "Filter") setFilterModalVisible(true);
  };

  const toggleCategory = (item: string) => {
    if (selectedCategory.includes(item)) {
      setSelectedCategory(selectedCategory.filter((cat) => cat !== item));
    } else {
      setSelectedCategory([...selectedCategory, item]);
    }
  };

  const toggleFilterOption = (section: string, item: string) => {
    const existingValues = selectedFilters[section] || [];

    if (existingValues.includes(item)) {
      setSelectedFilters({
        ...selectedFilters,
        [section]: existingValues.filter((value) => value !== item),
      });
    } else {
      setSelectedFilters({
        ...selectedFilters,
        [section]: [...existingValues, item],
      });
    }
  };

  const clearCategoryModalSelections = () => {
    setSelectedCategory([]);
    setSelectedBrowseMainCategoryId(null);
    setSelectedFilters((prev) => {
      const next = { ...prev };
      delete next.Category;
      return next;
    });
  };

  const clearGenderModalSelection = () => {
    setSelectedGender("");
    setSelectedFilters((prev) => {
      const next = { ...prev };
      delete next.Gender;
      return next;
    });
  };

  const clearFilterModalSelections = () => {
    setSelectedFilters({});
    setSelectedCategory([]);
    setSelectedGender("");
    setSelectedBrowseMainCategoryId(null);
  };

  const displayedCategories = categoryOptions.filter((item) =>
    item.toLowerCase().includes(searchCategoryText.toLowerCase())
  );

  const displayedFilterOptions =
    selectedFilterSection === "Category"
      ? (filterOptions[selectedFilterSection] || []).filter((item) =>
          item.toLowerCase().includes(searchCategoryText.toLowerCase())
        )
      : filterOptions[selectedFilterSection] || [];

  const productGrid = [
    {
      id: 1,
      name: "Pahirava Women..",
      image: require("../assets/images/product1.png"),
      oldPrice: "₹2,199",
      price: "₹361",
      buyPrice: "₹311",
    },
    {
      id: 2,
      name: "Niharika Creatio...",
      image: require("../assets/images/product2.png"),
      oldPrice: "₹999",
      price: "₹265",
      buyPrice: "₹215",
    },
    {
      id: 3,
      name: "MABRI Women F...",
      image: require("../assets/images/product3.png"),
      oldPrice: "₹1,499",
      price: "₹316",
      buyPrice: "₹266",
    },
    {
      id: 4,
      name: "Premokar Creati...",
      image: require("../assets/images/product4.png"),
      oldPrice: "₹1,999",
      price: "₹241",
      buyPrice: "₹191",
    },
    {
      id: 5,
      name: "Aayesha Textile ...",
      image: require("../assets/images/product5.png"),
      oldPrice: "₹999",
      price: "₹242",
      buyPrice: "₹192",
      rating: "4.4 ★",
    },
    {
      id: 6,
      name: "premokar fashio...",
      image: require("../assets/images/product6.png"),
      oldPrice: "₹1,999",
      price: "₹237",
      buyPrice: "₹187",
    },
  ];

// megabanners
const megaBanners = [
  { id: '1', image: require('../assets/images/mega1.png') },
  { id: '2', image: require('../assets/images/mega2.png') },
  { id: '3', image: require('../assets/images/mega3.png') },
];
const [megaBannerIndex, setMegaBannerIndex] = useState(0);



// focus in
const focusBanners = [
  {
    id: '1',
    image: require('../assets/images/focus1.png'),
  },
  {
    id: '2',
    image: require('../assets/images/focus2.png'),
  },
];
  const openCamera = () => {
    Alert.alert("Choose image source", "Search products using a photo.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Camera",
        onPress: () => router.push({ pathname: "/camerasearch", params: { source: "camera" } }),
      },
      {
        text: "Gallery",
        onPress: () => router.push({ pathname: "/camerasearch", params: { source: "gallery" } }),
      },
    ]);
  };


// latest products (see LATEST_PRODUCTS_FALLBACK at module scope — loaded from API in Home)

// scrolling brand
const brands = [
  {
    id: "1",
    name: "men",
    image: require("../assets/images/visky.png"),
  },
  {
    id: "2",
    name: "accessaries",
    image: require("../assets/images/shanthoshi.png"),
  },
  {
    id: "3",
    name: "shoes",
    image: require("../assets/images/aman.png"),
  },
  {
    id: "4",
    name: "bangles",
    image: require("../assets/images/satyasai.png"),
  },
  {
    id: "5",
    name: "saree",
    image: require("../assets/images/sasia.png"),
  },
];

const FRESH_ROW_PADDING = 16;
const FRESH_INNER = width - FRESH_ROW_PADDING * 2;
const FRESH_IMG_60 = FRESH_INNER * 0.6;
const FRESH_IMG_30 = FRESH_INNER * 0.3;
const FRESH_IMG_GAP = FRESH_INNER * 0.1;

// categariy data

/** Fallback when main categories API is empty — image-only tiles (wide banner art). */
const categoryData = [
  {
    id: "sb1",
    title: "Featured",
    image: require("../assets/images/accessarieshomebanner.png"),
  },
  {
    id: "sb2",
    title: "Featured",
    image: require("../assets/images/Footwearhomebanner.png"),
  },
  {
    id: "sb3",
    title: "Featured",
    image: require("../assets/images/Homlyhubhomebanner.png"),
  },
  {
    id: "sb4",
    title: "Featured",
    image: require("../assets/images/Clothinghomebanner.png"),

  },
  {
    id: "sb5",
    title: "Featured",
    image: require("../assets/images/Sweetsbannerhome.png"),
  },
  {
    id: "sb6",
    title: "Featured",
    image: require("../assets/images/Sportswearhomebanner.png"),
  },
];


// megabanners

  const activeHeroHeader =
    heroPromoCards[Math.min(Math.max(0, bannerIndex), Math.max(0, heroPromoCards.length - 1))] ??
    heroPromoCards[0] ??
    HERO_PROMO_CARDS[0]!;

  return (
    <View style={styles.container}>
      <View style={styles.headerSticky}>
        <LinearGradient
          // Header (logo + search + camera/mic + location) should stay white.
          colors={["#FFFFFF", "#FFFFFF"]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerMeshGradient, { paddingTop: insets.top }]}
        >
        {/* Top: greeting + wishlist / notifications (hide on scroll down) */}
        {topBarMounted ? (
          <Animated.View
            style={[
              styles.greetingBar,
              {
                opacity: topBarAnim,
                transform: [
                  {
                    translateY: topBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-HIDE_TOP_BAR_H, 0],
                    }),
                  },
                ],
              },
            ]}
          >
          <View style={styles.topRow}>
            <View style={styles.greetingCol}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => setPromoSpotlightModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={tr("Open promotional offer")}
              >
                <LinearGradient
                  colors={[...GREETING_CHIP_COLORS]}
                  locations={[...GREETING_CHIP_LOCS]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.greetingTextChip}
                >
                  <Text style={styles.helloLine} numberOfLines={1}>
                    <Text style={styles.helloName}>{tr("Welcome")}</Text>
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() => router.push("/wishlist")}
                style={styles.headerIconHit}
                accessibilityLabel="Wishlist"
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
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={styles.headerIconHit}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={24} color="#0F172A" />
                {notificationCount > 0 ? (
                  <View style={styles.headerWishlistBadge}>
                    <Text style={styles.headerWishlistBadgeText}>
                      {notificationCount > 99 ? "99+" : String(notificationCount)}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
        ) : null}

        {/* Below: logo + search, then location */}
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={styles.logoCol}>
              <View style={styles.logoRingPlain}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.searchFieldColumn}>
              <LinearGradient
                colors={[...SEARCH_BAR_MESH_COLORS]}
                locations={[...SEARCH_BAR_MESH_LOCS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchContainer}
              >
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <Pressable
                  style={{ flex: 1, minWidth: 0 }}
                  onPress={() => openSearchResults()}
                  accessibilityRole="button"
                  accessibilityLabel="Search products"
                >
                  <TextInput
                    placeholder={placeholderTexts[placeholderIndex]}
                    placeholderTextColor="#64748B"
                    style={styles.searchInput}
                    value=""
                    editable={false}
                    pointerEvents="none"
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </Pressable>
                <TouchableOpacity onPress={openCamera} style={styles.searchBarIconBtn}>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color="#64748B"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={startVoiceSearch}
                  style={styles.searchBarIconBtn}
                >
                  <Ionicons name="mic-outline" size={24} color="#64748B" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>

          <DeliveryLocationSection enableFullAddressApi />
        </View>
        </LinearGradient>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: HOME_PAGE_BG }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.homeScrollContent}
        nestedScrollEnabled
        scrollEventThrottle={16}
        onScroll={(e) => {
          const viewportHeight = e.nativeEvent.layoutMeasurement.height ?? 0;
          const contentHeight = e.nativeEvent.contentSize.height ?? 0;
          const offsetY = e.nativeEvent.contentOffset.y ?? 0;
          const distanceToBottom = contentHeight - (offsetY + viewportHeight);
          if (distanceToBottom <= 460 && morePicksHasMore && !morePicksLoadingMore) {
            void loadMoreMorePicks();
          }

          const y = e.nativeEvent.contentOffset.y ?? 0;
          const prev = lastMainScrollY.current;
          lastMainScrollY.current = y;
          const dy = y - prev;
          if (Math.abs(dy) < 8) return;

          // Hide on scroll down. Show ONLY when back near top (categories start).
          const REVEAL_NEAR_TOP_Y = 24;
          const HIDE_AFTER_Y = 40;

          if (dy > 0 && y > HIDE_AFTER_Y && topBarMounted) {
            Animated.timing(topBarAnim, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) setTopBarMounted(false);
            });
            return;
          }
          if (dy < 0 && y <= REVEAL_NEAR_TOP_Y && !topBarMounted) {
            setTopBarMounted(true);
            topBarAnim.setValue(0);
            Animated.timing(topBarAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }}
      >
        <LinearGradient
          colors={[...HOME_SCROLL_MESH_COLORS]}
          locations={[...HOME_SCROLL_MESH_LOCATIONS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.homeScrollMesh}
        >
        {/* Browse: categories + filters — same bold gradient as active hero banner */}
        <LinearGradient
          colors={[...activeHeroHeader.chromeGradient]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.homeBrowsePanelChrome}
        >
          <View style={styles.categorySection}>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {(mainCategories.length
                ? mainCategories
                : categories.map((cat) => ({
                    id: String(cat.name),
                    title: cat.name,
                    image: cat.image as unknown as ImageSourcePropType,
                    href: cat.href,
                  }))
              ).map((cat, index, arr) => (
                <TouchableOpacity
                  key={`${cat.id}-${String(cat.href)}`}
                  style={[
                    styles.categoryChip,
                    index < arr.length - 1 && styles.categoryChipSpacing,
                  ]}
                  activeOpacity={0.82}
                  onPress={() => router.push(cat.href)}
                  accessibilityRole="button"
                  accessibilityLabel={cat.title}
                >
                  <View style={styles.categoryImageCard}>
                    <Image
                      source={cat.image as any}
                      style={styles.categoryImageInner}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.categoryChipLabelChrome} numberOfLines={2}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* FILTER ROW — color-coded chips */}
          <View style={[styles.filterRow, styles.homeFilterRowInset]}>
          <FilterItem
            icon="swap-vert"
            label="Sort"
            onPress={() => handleFilterPress("Sort")}
            tint={{
              bubble: "#EEF2FF",
              border: "#A5B4FC",
              icon: "#4338CA",
            }}
          />
          <FilterItem
            icon="grid-view"
            label="Category"
            onPress={() => handleFilterPress("Category")}
            tint={{
              bubble: "#ECFDF5",
              border: "#6EE7B7",
              icon: "#047857",
            }}
          />
          <FilterItem
            icon="person-outline"
            label="Gender"
            onPress={() => handleFilterPress("Gender")}
            tint={{
              bubble: "#FDF2F8",
              border: "#F9A8D4",
              icon: "#BE185D",
            }}
          />
          <FilterItem
            icon="filter-list"
            label="Filter"
            onPress={() => handleFilterPress("Filter")}
            tint={{
              bubble: "#FFF7ED",
              border: "#FDBA74",
              icon: "#C2410C",
            }}
          />
          </View>

          <TouchableOpacity
            style={styles.homeBrowseApplyBtn}
            onPress={() => void applyHomeBrowseFilters()}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="View product results for your filters"
          >
            <Text style={styles.homeBrowseApplyText}>View results</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Hero promo cards — snap carousel; header tint follows active card */}
        <View style={styles.homeMediaPanel}>
          <FlatList
            ref={bannerCarouselRef}
            data={heroPromoCards}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            disableIntervalMomentum
            snapToInterval={HERO_PROMO_SNAP_STRIDE}
            snapToAlignment="start"
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.heroPromoListContent}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / HERO_PROMO_SNAP_STRIDE
              );
              const clamped = Math.min(
                Math.max(0, idx),
                Math.max(0, heroPromoCards.length - 1)
              );
              setBannerIndex(clamped);
            }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.heroPromoItemWrap,
                  { width: HERO_PROMO_SNAP_STRIDE },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.92}
                  style={[
                    styles.heroPromoCard,
                    {
                      width: HERO_PROMO_CARD_WIDTH,
                      height: HERO_PROMO_CARD_HEIGHT,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.subtitle}`}
                >
                  <Image
                    source={item.image}
                    style={styles.heroPromoImageFill}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                </TouchableOpacity>
              </View>
            )}
            style={styles.bannerCarousel}
          />

          <View style={styles.bannerDotsRow}>
            {heroPromoCards.map((_, index) => (
              <View
                key={`banner-dot-${index}`}
                style={[
                  styles.bannerDot,
                  bannerIndex === index ? styles.bannerDotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Top Picks for You — preview 5 from API; arrow opens full list on subcatProducts */}
        <LinearGradient
          colors={["#DBEAFE", "#E0E7FF", "#EDE9FE"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userSuggestionCard}
        >
          <View style={styles.userSuggestionHeaderRow}>
            <Text style={styles.userSuggestionTitle}>{tr("Top Picks for You")}</Text>
            {topPicksShowArrow ? (
              <TouchableOpacity
                style={styles.userSuggestionArrow}
                onPress={() => onTopPicksArrowPress()}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={tr("View all top picks")}
              >
                <Ionicons name="arrow-forward" size={20} color="#1E40AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.userSuggestionScroll}
            contentContainerStyle={styles.userSuggestionListContent}
          >
            {topPicksVisible.map((item, index) => (
              <TouchableOpacity
                key={`top-pick-${item.id}-${index}`}
                style={[
                  styles.userSuggestionItem,
                  { width: USER_PICK_CARD_WIDTH },
                  index < topPicksVisible.length - 1
                    ? { marginRight: USER_PICK_ITEM_GAP }
                    : undefined,
                ]}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/productdetail",
                    params: { id: item.id },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Top pick: ${item.name}, open product`}
              >
                <Image
                  source={item.image}
                  style={styles.userSuggestionImageBox}
                  resizeMode="cover"
                />
                <Text style={styles.userSuggestionText} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>

{/* cards section */}



      
    <View style={styles.freshSection}>
        <View style={styles.freshHeader}>
          <View style={styles.freshTitleBlock}>
            <View style={styles.freshTitleAccentBar} />
            <View style={styles.freshTitleTextCol}>
              <Text style={styles.freshTitle}>
                <Text style={styles.freshTitleWord}>Fresh </Text>
                <Text style={styles.freshTitleHighlight}>Finds</Text>
              </Text>
              <View style={styles.freshTitleUnderline} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.freshArrow}
            onPress={() => openSubcatProducts("Fresh finds")}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Horizontal ScrollView: nested FlatList often blocks horizontal swipe inside vertical ScrollView */}
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          decelerationRate="fast"
          contentContainerStyle={styles.freshFlatListContent}
          style={styles.freshHorizontalScroll}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(
              Math.min(
                Math.max(0, index),
                Math.max(0, freshPairs.length - 1)
              )
            );
          }}
        >
          {freshPairs.map((pair, index) => {
            const isActive = index === activeIndex;
            const [left, right] = [pair[0], pair[1]];
            return (
              <View
                key={`fresh-pair-${index}`}
                style={{ width, paddingHorizontal: FRESH_ROW_PADDING }}
              >
                <View
                  style={[
                    styles.freshPairRow,
                    {
                      gap: FRESH_IMG_GAP,
                      opacity: isActive ? 1 : 0.88,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{ width: FRESH_IMG_60 }}
                    onPress={() =>
                      router.push({
                        pathname: "/productdetail",
                        params: { id: left.id },
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Fresh find, open product"
                  >
                    <Image
                      source={left.image}
                      style={styles.freshCardImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  {right ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={{ width: FRESH_IMG_30 }}
                      onPress={() =>
                        router.push({
                          pathname: "/productdetail",
                          params: { id: right.id },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Fresh find, open product"
                    >
                      <Image
                        source={right.image}
                        style={styles.freshCardImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: FRESH_IMG_30 }} />
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
    </View>
{/* second banner section — horizontal scroll */}
<View style={styles.secondBannerAfterFresh}>
  <FlatList
    ref={bannerCarousel2Ref}
    data={banners2}
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    decelerationRate="fast"
    keyExtractor={(_, index) => `home-banner2-${index}`}
    getItemLayout={(_, index) => ({
      length: width,
      offset: width * index,
      index,
    })}
    onMomentumScrollEnd={(e) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      const clamped = Math.min(Math.max(0, idx), banners2.length - 1);
      setBannerIndex2(clamped);
    }}
    onScrollToIndexFailed={(info) => {
      setTimeout(() => {
        bannerCarousel2Ref.current?.scrollToIndex({
          index: info.index,
          animated: false,
        });
      }, 350);
    }}
    renderItem={({ item }) => (
      <View style={{ width, height: 200 }}>
        <View style={[styles.banner, styles.bannerSlideInner]}>
          <Image
            source={item}
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </View>
      </View>
    )}
    style={styles.bannerCarousel}
  />

  <View style={styles.bannerDotsRow}>
    {banners2.map((_, index) => (
      <View
        key={`banner2-dot-${index}`}
        style={[
          styles.bannerDot,
          bannerIndex2 === index ? styles.bannerDotActive : null,
        ]}
      />
    ))}
  </View>
</View>
{/* suggested list */}
<View style={styles.homeSuggestedPanel}>
  <View style={styles.productSectionHeader}>
    <View style={styles.suggestedTitleWrap}>
      <View style={styles.suggestedTitleBadge}>
        <Ionicons name="sparkles" size={18} color="#FDE047" />
        <Text style={styles.suggestedTitleBadgeText}>{tr("Suggested For You")}</Text>
      </View>
      <Text style={styles.suggestedTitleTagline}>{tr("Handpicked just for you")}</Text>
    </View>
    <TouchableOpacity
      style={styles.productArrowButton}
      onPress={() =>
        openSubcatProducts("Suggested For You", {
          subcategoryId: String(SUGGESTED_FOR_YOU_SUBCATEGORY_ID),
        })
      }
    >
      <Ionicons name="arrow-forward" size={22} color="#fff" />
    </TouchableOpacity>
  </View>

  <View style={styles.suggestedGridOuter}>
    {Array.from(
      { length: Math.ceil(suggestedProducts.length / 2) },
      (_, rowIdx) => {
        const pair = suggestedProducts.slice(rowIdx * 2, rowIdx * 2 + 2);
        return (
          <View key={`sug-row-${rowIdx}`} style={styles.suggestedTwoColRow}>
            {pair.map((item) => (
              <TouchableOpacity
                key={item.cartId}
                style={[styles.productCard, styles.suggestedCardHalf]}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/productdetail",
                    params: { id: item.cartId },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Suggested: ${item.name}, open product`}
              >
                <View style={styles.productImageWrap}>
                  <Image
                    source={item.image}
                    style={styles.productCardImage}
                    resizeMode="cover"
                  />
                  {item.rating ? (
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.oldPrice}>{item.oldPrice}</Text>
                  <Text style={styles.newPrice}> {item.price}</Text>
                </View>

                <View style={styles.addCartContainer}>
                  <TouchableOpacity
                    style={styles.addCartButton}
                    onPress={() => {
                      void (async () => {
                        const pid = Math.floor(Number(item.cartId));
                        const r = await addToCartPtbOrLocal({
                          productId: pid,
                          variantId: item.variantId,
                          quantity: 1,
                          localLine: {
                            id: item.cartId,
                            name: item.name,
                            price: item.priceNum,
                            mrp: item.mrpNum,
                          },
                        });
                        if (r.ok === false) {
                          Alert.alert("Cart", r.message);
                          return;
                        }
                        bumpCartBadgeAfterAdd();
                        setTimeout(() => {
                          Alert.alert(
                            "Added to cart",
                            `${item.name} is in your cart.`
                          );
                        }, 0);
                      })();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item.name} to cart`}
                  >
                    <Text style={styles.addCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      }
    )}
  </View>
</View>

{/* Home banner video — above Premium finds */}
<View style={styles.homeVideoShell}>
  <View
    style={[styles.videoBannerContainer, { height: homeVideoBannerHeight }]}
    collapsable={false}
  >
    <VideoView
      player={homeBannerVideoPlayer}
      style={styles.videoBanner}
      contentFit="cover"
      nativeControls={false}
    />
  </View>
</View>






{/* Premium Finds Section — sapphire gradient + luxe title */}
<View style={styles.premiumSection}>
  <LinearGradient
    colors={["#0F172A", "#1E3A8A", "#1D4ED8"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.premiumGradient}
  >
    <View style={styles.premiumHeader}>
      <View style={styles.premiumTitleCluster}>
        <View style={styles.premiumIconTile}>
          <MaterialIcons name="workspace-premium" size={26} color="#FDE68A" />
        </View>
        <View style={styles.premiumTitleCol}>
          <Text style={styles.premiumTitleLine}>
            <Text style={styles.premiumTitleW}>Premium </Text>
            <Text style={styles.premiumTitleG}>finds</Text>
          </Text>
          <Text style={styles.premiumTitleForYou}>for you</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.premiumArrowButton}
        onPress={() => openSubcatProducts("Premium finds")}
        activeOpacity={0.88}
      >
        <Ionicons name="arrow-forward" size={22} color="#1E40AF" />
      </TouchableOpacity>
    </View>

    <View style={styles.premiumGrid}>
      {premiumFindsCards.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.premiumCard}
          activeOpacity={0.88}
          onPress={() =>
            router.push({ pathname: "/productdetail", params: { id: item.id } })
          }
          accessibilityRole="button"
          accessibilityLabel={`Premium: ${item.name}, open product`}
        >
          <View style={styles.premiumImageWrap}>
            <Image
              source={item.image}
              style={styles.premiumImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.premiumName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.premiumSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </LinearGradient>
</View>

{/* Rate your recent purchase — auto-scrolling card */}
<View style={styles.rateSection}>
  <Text style={styles.rateSectionTitle}>{tr("Rate Your Recent Purchase")}</Text>

  <ScrollView
    ref={rateCarouselRef}
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    decelerationRate="fast"
    onMomentumScrollEnd={(e) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / width);
      const max = rateCards.length - 1;
      setRateIndex(Math.max(0, Math.min(page, max)));
    }}
  >
    {rateCards.map((card) => (
      <View key={card.id} style={{ width }}>
        <View style={styles.rateCard}>
          <Image source={card.image} style={styles.rateCardImage} resizeMode="cover" />
          <View style={styles.rateCardRight}>
            <Text style={styles.rateCardBrand} numberOfLines={1}>
              {card.brand}
            </Text>
            <Text style={styles.rateCardTitle} numberOfLines={2}>
              {card.title}
            </Text>
            <View style={styles.rateStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const selected = rateSelectionByCard[card.id] ?? 0;
                const filled = selected >= star;
                return (
                  <TouchableOpacity
                    key={`${card.id}-star-${star}`}
                    style={styles.rateStarColumn}
                    onPress={() => openShareExperience(card, star)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`${RATE_STAR_LABELS[star - 1]}, ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Ionicons
                      name={filled ? "star" : "star-outline"}
                      size={28}
                      color={filled ? "#EAB308" : "#94A3B8"}
                    />
                    <Text style={styles.rateStarLabel}>
                      {RATE_STAR_LABELS[star - 1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.rateCardHint} numberOfLines={2}>
              Tap on the stars to rate the product
            </Text>
          </View>
        </View>
      </View>
    ))}
  </ScrollView>

  <View style={styles.rateDotsRow}>
    {rateCards.map((_, i) => (
      <View
        key={`rate-dot-${i}`}
        style={[styles.rateDot, i === rateIndex ? styles.rateDotActive : null]}
      />
    ))}
  </View>
</View>


{/* Shop by Store */}
<View style={styles.shopByStoreSection}>
  <View style={styles.shopByStoreHeader}>
    <View style={styles.shopByStoreTitleRow}>
      <View style={styles.shopByStoreIconRing}>
        <MaterialIcons name="store-mall-directory" size={28} color="#0F766E" />
      </View>
      <View style={styles.shopByStoreTitleCol}>
        <Text style={styles.shopByStoreTitleMain}>
          <Text style={styles.shopByStoreTitleLight}>Shop by </Text>
          <Text style={styles.shopByStoreTitleEmphasis}>Store</Text>
        </Text>
      </View>
    </View>
    <View style={styles.shopByStoreRule} />
  </View>

  <FlatList
    data={mainCategories.length ? mainCategories : categoryData}
    horizontal
    showsHorizontalScrollIndicator={false}
    keyExtractor={(item) => item.id}
    contentContainerStyle={styles.storeList}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={styles.storeItem}
        activeOpacity={0.88}
        onPress={() => {
          if (mainCategories.length > 0) {
            const m = item as (typeof mainCategories)[number];
            router.push(m.href);
            return;
          }
          openSubcatProducts(item.title);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Shop by store: ${item.title}, open products`}
      >
        <View style={styles.shopStoreImageShell}>
          <Image source={item.image} style={styles.shopStoreImage} />
        </View>
      </TouchableOpacity>
    )}
  />
</View>


{/* IN FOCUS — horizontal spotlight carousel (distinct from sage/stack sections) */}
<View style={styles.focusSection}>
  <View style={styles.focusTopBar}>
    <View style={styles.focusTopBarLeft}>
      <LinearGradient
        colors={["#9e2f72", "#e950b8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.focusAccentBar}
      />
      <View style={styles.focusTitleCluster}>
        <Text style={styles.focusEyebrow}>Spotlight</Text>
        <Text style={styles.focusHeadline}>
          <Text style={styles.focusHeadlineThin}>In </Text>
          <Text style={styles.focusHeadlineBold}>Focus</Text>
        </Text>
      </View>
    </View>
  </View>

  <ScrollView
    horizontal
    nestedScrollEnabled
    showsHorizontalScrollIndicator={false}
    decelerationRate="fast"
    snapToInterval={FOCUS_CARD_WIDTH + FOCUS_CARD_GAP}
    snapToAlignment="start"
    contentContainerStyle={styles.focusCarouselContent}
  >
    {focusBanners.map((item, index) => (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.92}
        onPress={() => openSubcatProducts("In Focus")}
        style={[
          styles.focusCarouselCard,
          { width: FOCUS_CARD_WIDTH },
          index < focusBanners.length - 1 && { marginRight: FOCUS_CARD_GAP },
        ]}
      >
        <Image
          source={item.image}
          style={styles.focusCarouselImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(30,27,75,0.82)"]}
          style={styles.focusCarouselFade}
        />
        <View style={styles.focusCarouselTag}>
          <MaterialIcons name="auto-awesome" size={14} color="#FDE68A" />
          <Text style={styles.focusCarouselTagText}>Featured</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>




{/* premium list */}
{/* Mega Discounts Section */}
<View style={styles.megaSection}>
  <LinearGradient
    colors={["#831843", "#BE123C", "#E11D48"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.megaGradient}
  >
    <View style={styles.megaHeader}>
      <View style={styles.megaTitleCluster}>
        <View style={styles.megaTitleIconWrap}>
          <MaterialIcons name="local-offer" size={28} color="#FACC15" />
        </View>
        <View style={styles.megaTitleTextCol}>
          <Text style={styles.megaTitleLine}>
            <Text style={styles.megaTitleA}>Mega </Text>
            <Text style={styles.megaTitleB}>Discounts</Text>
          </Text>
          <Text style={styles.megaTitleHint}>Limited-time deals</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.megaArrowButton}
        onPress={() => openSubcatProducts("Mega Discounts")}
        activeOpacity={0.88}
      >
        <Ionicons name="arrow-forward" size={22} color="#BE123C" />
      </TouchableOpacity>
    </View>

    <View style={styles.megaGrid}>
      {megaDiscountCards.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.megaCard}
          activeOpacity={0.88}
          onPress={() =>
            router.push({ pathname: "/productdetail", params: { id: item.id } })
          }
          accessibilityRole="button"
          accessibilityLabel={`Mega discount: ${item.name}, open product`}
        >
          <View style={styles.megaImageWrap}>
            <Image
              source={item.image}
              style={styles.megaImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.megaName}>{item.name}</Text>

          <Text style={styles.megaSubtitle}>{item.subtitle}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </LinearGradient>
</View>

{/* seller gallery — card header + pill CTA */}
<View style={styles.sellerSectionContainer}>
  <View style={styles.sellerGalleryHeaderCard}>
    <View style={styles.sellerGalleryHeaderRow}>
      <View style={styles.sellerGalleryTitleArea}>
        <View
          style={styles.sellerGalleryTitleBadge}
          accessible
          accessibilityRole="text"
          accessibilityLabel="Featured picks"
        >
          <Feather name="package" size={14} color="#6D28D9" />
        </View>
        <Text style={styles.sellerGalleryTitleLine}>
          <Text style={styles.sellerGalleryTitleItalic}>Featured </Text>
          <Text style={styles.sellerGalleryTitleBold}>picks</Text>
        </Text>
      </View>
      <TouchableOpacity
        style={styles.sellerGallerySeeAllBtn}
        onPress={() =>
          router.push({
            pathname: "/subcatProducts",
            params: {
              subCategory: STORE_SPOTLIGHT_LIST_TITLE,
              mainCategoryId: String(STORE_SPOTLIGHT_MAIN_CATEGORY_ID),
            },
          } as any)
        }
        activeOpacity={0.88}
      >
        <Text style={styles.sellerGallerySeeAllText}>View all</Text>
        <Feather name="arrow-right" size={17} color="#5B21B6" />
      </TouchableOpacity>
    </View>
  </View>

  <View style={styles.sellerGrid}>
    {storeSpotlightCards.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.sellerCard}
        activeOpacity={0.88}
        onPress={() =>
          router.push({ pathname: "/productdetail", params: { id: item.id } })
        }
        accessibilityRole="button"
        accessibilityLabel={`Featured picks: ${item.name}, open product`}
      >
        <View style={styles.imageArea}>
          <Image source={item.image} style={styles.sellerImage} resizeMode="cover" />
        </View>

        <View style={styles.nameBar}>
          <Text style={styles.businessName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.subtitle ? (
            <Text style={styles.storeSpotlightCardSub} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    ))}
  </View>
</View>

{/* More products for you — vertical list rows (thumbnail + details + action) */}
<View style={styles.latestSection}>
  <View style={styles.latestHeaderCard}>
    <View style={styles.latestHeaderLeft}>
      <View style={styles.latestHeaderIconTile}>
        <MaterialIcons name="local-offer" size={22} color="#C2410C" />
      </View>
      <View style={styles.latestHeaderTextCol}>
        <Text style={styles.latestHeaderEyebrow}>{tr("Recommended for you")}</Text>
        <Text style={styles.latestHeaderTitle}>{tr("More picks")}</Text>
        <Text style={styles.latestHeaderSub} numberOfLines={1}>
          {tr("Deals and essentials picked today")}
        </Text>
      </View>
    </View>

    <TouchableOpacity
      style={styles.latestHeaderCtaBtn}
      activeOpacity={0.9}
      onPress={() => openSubcatProducts("More picks")}
      accessibilityRole="button"
      accessibilityLabel={tr("See all recommended products")}
    >
      <Ionicons name="arrow-forward" size={20} color="#7C2D12" />
    </TouchableOpacity>
  </View>

  <View style={styles.latestGrid}>
    {chunkMorePicksRows(morePicksItems).map(([left, right], rowIdx) => (
      <View key={`mp-row-${rowIdx}-${left.id}`} style={styles.latestGridRow}>
        {renderMorePickCell(left, rowIdx * 2)}
        {right ? (
          renderMorePickCell(right, rowIdx * 2 + 1)
        ) : (
          <View style={styles.latestGridCell} />
        )}
      </View>
    ))}
    {morePicksLoadingMore ? (
      <View style={styles.latestLoadMoreBtn} accessibilityLabel={tr("Loading more products")}>
        <ActivityIndicator color="#C2410C" />
      </View>
    ) : null}
  </View>
</View>

        </LinearGradient>
      </Animated.ScrollView>

      {/* Save to wishlist — bottom sheet (like native “Save item to…”) */}
      <Modal
        visible={saveToWishlistVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSaveToWishlistVisible(false)}
      >
        <View style={styles.saveSheetOverlay}>
          <Pressable
            style={styles.saveSheetBackdrop}
            onPress={() => setSaveToWishlistVisible(false)}
          />
          <View style={[styles.saveSheetCard, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.saveSheetHeader}>
              <TouchableOpacity
                onPress={() => setSaveToWishlistVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={26} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.saveSheetTitle}>Save item to...</Text>
              <View style={{ width: 26 }} />
            </View>

            <TouchableOpacity
              style={styles.saveSheetRow}
              activeOpacity={0.85}
              onPress={() => {
                setSaveToWishlistVisible(false);
                setCreateCollectionVisible(true);
              }}
            >
              <View style={styles.saveSheetCreateIcon}>
                <Ionicons name="add" size={26} color="#2563EB" />
              </View>
              <Text style={styles.saveSheetCreateText}>Create a new collection</Text>
            </TouchableOpacity>

            <View style={styles.saveSheetDivider} />

            <TouchableOpacity
              style={styles.saveSheetRow}
              activeOpacity={0.85}
              onPress={() => setSaveToWishlistChecked((v) => !v)}
            >
              <View style={styles.saveSheetWishlistIcon}>
                <Ionicons name="heart" size={22} color="#E11D48" />
              </View>
              <View style={styles.saveSheetWishlistTextCol}>
                <Text style={styles.saveSheetWishlistTitle}>My Wishlist</Text>
                <Text style={styles.saveSheetWishlistSub}>
                  Private • {wishlistCount} items
                </Text>
              </View>
              <View
                style={[
                  styles.saveSheetCheckBox,
                  !saveToWishlistChecked ? styles.saveSheetCheckBoxOff : null,
                ]}
              >
                {saveToWishlistChecked ? (
                  <Ionicons name="checkmark" size={20} color="#2563EB" />
                ) : null}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveSheetDoneBtn}
              activeOpacity={0.9}
              onPress={() => void handleConfirmSaveToWishlist()}
            >
              <Text style={styles.saveSheetDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create a new collection — modal */}
      <Modal
        visible={createCollectionVisible}
        animationType="slide"
        onRequestClose={() => setCreateCollectionVisible(false)}
      >
        <View style={styles.collectionRoot}>
          <View style={[styles.collectionTopBar, { paddingTop: insets.top }]}>
            <TouchableOpacity
              onPress={() => setCreateCollectionVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.collectionTopTitle}>Create a new collection</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView contentContainerStyle={styles.collectionScroll} showsVerticalScrollIndicator={false}>
            {pendingWishlist ? (
              <View style={styles.collectionPreviewWrap}>
                <Image source={pendingWishlist.image} style={styles.collectionPreviewImage} />
              </View>
            ) : null}

            <Text style={styles.collectionLabel}>Collection name*</Text>
            <View style={styles.collectionInputRow}>
              <TextInput
                value={collectionName}
                onChangeText={setCollectionName}
                placeholder="Enter collection name"
                placeholderTextColor="#9CA3AF"
                style={styles.collectionInput}
              />
              {collectionName ? (
                <TouchableOpacity onPress={() => setCollectionName("")}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.collectionRequired}>*Required</Text>

            <Text style={styles.collectionSectionTitle}>Suggestions</Text>
            <View style={styles.collectionChipsRow}>
              {["My Birthday Wishlist", "Clothing Must Haves"].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={styles.collectionChip}
                  activeOpacity={0.85}
                  onPress={() => setCollectionName(chip)}
                >
                  <Text style={styles.collectionChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.collectionSectionTitle}>Share settings</Text>
            {[
              { id: "private", title: "Private", sub: "Only you can view" },
              { id: "shared", title: "Shared", sub: "Only people with link can view" },
              { id: "public", title: "Public", sub: "Anyone can search for and view" },
            ].map((o) => {
              const selected = collectionPrivacy === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={styles.collectionRadioRow}
                  activeOpacity={0.85}
                  onPress={() => setCollectionPrivacy(o.id as any)}
                >
                  <View style={styles.collectionRadioLeft}>
                    <Ionicons
                      name={
                        o.id === "private"
                          ? "lock-closed-outline"
                          : o.id === "shared"
                          ? "people-outline"
                          : "globe-outline"
                      }
                      size={20}
                      color="#64748B"
                    />
                    <View style={styles.collectionRadioTextCol}>
                      <Text style={styles.collectionRadioTitle}>{o.title}</Text>
                      <Text style={styles.collectionRadioSub}>{o.sub}</Text>
                    </View>
                  </View>
                  <View style={[styles.collectionRadioOuter, selected ? styles.collectionRadioOuterOn : null]}>
                    {selected ? <View style={styles.collectionRadioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.collectionFooter, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              style={styles.collectionCreateBtn}
              activeOpacity={0.9}
              onPress={() => {
                // UI only for now: close and return to save sheet
                setCreateCollectionVisible(false);
                setSaveToWishlistVisible(true);
              }}
            >
              <Text style={styles.collectionCreateBtnText}>Create collection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Select delivery address — bottom sheet */}
      <Modal
        visible={deliveryAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDeliveryModal}
      >
        <View style={styles.deliveryModalRoot}>
          <Pressable style={styles.deliveryModalBackdrop} onPress={closeDeliveryModal} />
          <View
            style={[
              styles.deliveryAddressSheet,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.deliverySheetHandle} />

            {deliveryAddMode === "list" ? (
              <>
                <View style={styles.deliverySheetHeader}>
                  <Text style={styles.deliverySheetTitle}>
                    Select delivery address
                  </Text>
                  <TouchableOpacity
                    onPress={closeDeliveryModal}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={26} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.deliverySheetScroll}
                >
                  <View style={styles.deliverySearchBox}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                      placeholder={tr("Search by area, street name, pin code")}
                      placeholderTextColor="#999"
                      style={styles.deliverySearchInput}
                      value={deliveryAddressSearchQuery}
                      onChangeText={setDeliveryAddressSearchQuery}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.deliveryUseCurrentRow}
                    activeOpacity={0.75}
                    onPress={() => void handleUseCurrentLocation()}
                    accessibilityRole="button"
                    accessibilityLabel={tr("Use my current location")}
                  >
                    <View style={styles.deliveryUseCurrentIconWrap}>
                      <Ionicons name="locate" size={22} color="#1976D2" />
                    </View>
                    <View style={styles.deliveryUseCurrentTextCol}>
                      <Text style={styles.deliveryUseCurrentTitle}>
                        {tr("Use my current location")}
                      </Text>
                      <Text style={styles.deliveryUseCurrentSub}>
                        {tr("Allow access to location")}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.deliveryDividerDashed} />

                  <View style={styles.deliverySavedHeaderRow}>
                    <Text style={styles.deliverySavedTitle}>{tr("Saved addresses")}</Text>
                    <TouchableOpacity
                      onPress={openAddNewAddressForm}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deliveryAddNewText}>{tr("+ Add New")}</Text>
                    </TouchableOpacity>
                  </View>

                  {filteredDeliveryAddresses.map((addr) => {
                    const selected = addr.id === selectedDeliveryAddressId;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={styles.deliveryAddressCard}
                        activeOpacity={0.8}
                        onPress={() => selectDeliveryAddress(addr)}
                      >
                        <MaterialIcons name="place" size={22} color="#666" />
                        <View style={styles.deliveryAddressCardBody}>
                          <View style={styles.deliveryAddressNameRow}>
                            <Text
                              style={styles.deliveryAddressName}
                              numberOfLines={1}
                            >
                              {addr.name}
                            </Text>
                            {selected ? (
                              <View style={styles.deliverySelectedBadge}>
                                <Text style={styles.deliverySelectedBadgeText}>
                                  Currently selected
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={styles.deliveryAddressLine}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {addr.line}
                          </Text>
                          {addr.phone ? (
                            <Text style={styles.deliveryAddressPhone} numberOfLines={1}>
                              {addr.phone}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.deliveryAddressMenuBtn}>
                          <Ionicons
                            name="ellipsis-vertical"
                            size={20}
                            color="#666"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.deliveryAddHeaderRow}>
                  <TouchableOpacity
                    onPress={goBackAddAddressForm}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.deliveryAddSheetTitle}>Add new address</Text>
                  <TouchableOpacity
                    onPress={closeDeliveryModal}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={26} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.deliverySheetScroll}
                >
                  <Text style={styles.deliveryFormLabel}>Full name</Text>
                  <TextInput
                    style={styles.deliveryFormInput}
                    placeholder="Recipient name"
                    placeholderTextColor="#999"
                    value={newAddressName}
                    onChangeText={setNewAddressName}
                  />

                  <Text style={styles.deliveryFormLabel}>Mobile number</Text>
                  <TextInput
                    style={styles.deliveryFormInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={newAddressPhone}
                    onChangeText={setNewAddressPhone}
                  />

                  <Text style={styles.deliveryFormLabel}>Address</Text>
                  <TextInput
                    style={[styles.deliveryFormInput, styles.deliveryFormInputMultiline]}
                    placeholder="House / flat no., street, area, landmark, pin code"
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                    value={newAddressLine}
                    onChangeText={setNewAddressLine}
                  />

                  <TouchableOpacity
                    style={styles.deliverySaveNewButton}
                    activeOpacity={0.85}
                    onPress={handleSaveNewAddress}
                  >
                    <Text style={styles.deliverySaveNewButtonText}>Save address</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Greeting chip — promotional spotlight (thick colors, mascots + ad hero) */}
      <Modal
        visible={promoSpotlightModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPromoSpotlightModalVisible(false)}
      >
        <View style={styles.promoModalRoot}>
          <Pressable
            style={styles.promoModalBackdrop}
            onPress={() => setPromoSpotlightModalVisible(false)}
          />
          <View
            style={[
              styles.promoModalSheet,
              { paddingBottom: Math.max(insets.bottom, 14) + 8 },
            ]}
          >
            <LinearGradient
              colors={[...PROMO_MODAL_GRADIENT]}
              locations={[...PROMO_MODAL_GRADIENT_LOCS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={styles.promoBokehLayer}
              pointerEvents="none"
            >
              {PROMO_BOKEH.map((b, i) => (
                <View
                  key={`promo-bokeh-${i}`}
                  style={[
                    styles.promoBokehDot,
                    {
                      top: b.top,
                      left: b.left,
                      width: b.size,
                      height: b.size,
                      borderRadius: b.size / 2,
                      opacity: b.opacity,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.promoStarsLayer} pointerEvents="none">
              {PROMO_MODAL_STARS.map((star, i) => {
                const t0 = (i % 6) * 0.12;
                const t1 = Math.min(1, t0 + 0.2);
                const t2 = Math.min(1, t0 + 0.45);
                return (
                  <Animated.View
                    key={`promo-modal-star-${i}`}
                    style={[
                      styles.promoModalStar,
                      {
                        top: star.top,
                        left: star.left,
                        opacity: promoBlastAnim.interpolate({
                          inputRange: [0, t0, t1, t2, 1],
                          outputRange: [0.2, 0.2, 0.95, 0.2, 0.2],
                        }),
                        transform: [
                          {
                            translateX: promoBlastAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, star.dx, 0],
                            }),
                          },
                          {
                            translateY: promoBlastAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, star.dy, 0],
                            }),
                          },
                          {
                            scale: promoBlastAnim.interpolate({
                              inputRange: [0, t1, t2, 1],
                              outputRange: [0.75, 1.15, 0.85, 0.75],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="star" size={star.size} color={star.color} />
                  </Animated.View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.promoCloseBtn}
              onPress={() => setPromoSpotlightModalVisible(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close promotion"
            >
              <View style={styles.promoCloseBtnInner}>
                <Ionicons name="close" size={26} color="#422006" />
              </View>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.promoScrollContent}
              bounces={false}
            >
              <Text style={styles.promoTitleScript}>
              Spread & Save
              </Text>
              <Text style={styles.promoTitleSub}>
                Extra rewards for you today
              </Text>

              <View style={styles.promoHeroRow}>
                <Animated.View
                  style={[
                    styles.promoCharWrap,
                    { transform: [{ translateY: promoMascotFloatAnim }] },
                  ]}
                >
                  <Image
                    source={PROMO_CHAR_LEFT}
                    style={styles.promoCharImage}
                    resizeMode="contain"
                  />
                </Animated.View>
                <View style={styles.promoAdCard}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.promoBlastRing,
                      {
                        opacity: promoBlastAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.26, 0],
                        }),
                        transform: [
                          {
                            scale: promoBlastAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.88, 1.24],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.promoBlastRingSecondary,
                      {
                        opacity: promoBlastAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 0],
                        }),
                        transform: [
                          {
                            scale: promoBlastAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.72, 1.06],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  {PROMO_STAR_BURST.map((star, i) => (
                    <Animated.View
                      key={`promo-star-blast-${i}`}
                      pointerEvents="none"
                      style={[
                        styles.promoStarBlast,
                        {
                          opacity: promoBlastAnim.interpolate({
                            inputRange: [0, 0.18, 1],
                            outputRange: [0, 1, 0],
                          }),
                          transform: [
                            {
                              translateX: promoBlastAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, star.x],
                              }),
                            },
                            {
                              translateY: promoBlastAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, star.y],
                              }),
                            },
                            {
                              scale: promoBlastAnim.interpolate({
                                inputRange: [0, 0.35, 1],
                                outputRange: [0.2, 1, 1.15],
                              }),
                            },
                            {
                              rotate: promoBlastAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0deg", i % 2 === 0 ? "70deg" : "-70deg"],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Ionicons name="star" size={star.size} color={star.color} />
                    </Animated.View>
                  ))}
                  <LinearGradient
                    colors={["#feda75", "#feda75"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promoAdCardInner}
                  >
                    <View style={styles.promoAdBadge}>
                      <Text style={styles.promoAdBadgeText}>Offer</Text>
                    </View>
                    <Image
                      source={PROMO_HERO_IMAGE}
                      style={styles.promoHeroImage}
                      resizeMode="cover"
                    />
                  </LinearGradient>
                </View>
                <Animated.View
                  style={[
                    styles.promoCharWrap,
                    {
                      transform: [
                        {
                          translateY: promoMascotFloatAnim.interpolate({
                            inputRange: [-8, 0],
                            outputRange: [0, -8],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={PROMO_CHAR_RIGHT}
                    style={styles.promoCharImage}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>

              <Text style={styles.promoBodyBold}>
              Refer 5 friends using your code and get **10% OFF on your first order** 
              </Text>
              <Text style={styles.promoBodyMuted}>
                Invite your friends and enjoy exciting discounts! 
              </Text>

              <Animated.View style={[styles.promoCtaOuter, { transform: [{ scale: promoCtaPulseAnim }] }]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setPromoSpotlightModalVisible(false);
                    router.push("/userrewords" as any);
                  }}
                >
                  <LinearGradient
                    colors={["#1d324e", "#1d324e", "#1d324e"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.promoCtaGradient}
                  >
                    <Text style={styles.promoCtaText}>START NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SORT MODAL */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SORT</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            {sortOptions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sortRow}
                onPress={() => {
                  setSelectedSort(item);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sortText,
                    selectedSort === item && styles.selectedSortText,
                  ]}
                >
                  {item}
                </Text>

                <View
                  style={[
                    styles.radioOuter,
                    selectedSort === item && styles.radioOuterActive,
                  ]}
                >
                  {selectedSort === item && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* CATEGORY MODAL */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fullBottomModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CATEGORY</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            {mainCategories.length > 0 ? (
              <View style={styles.homeBrowseDeptSection}>
                <Text style={styles.homeBrowseDeptTitle}>Department (search)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.homeBrowseDeptChips}
                >
                  {mainCategories.map((cat) => {
                    const selected = selectedBrowseMainCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={`dept-${cat.id}`}
                        style={[
                          styles.homeBrowseDeptChip,
                          selected && styles.homeBrowseDeptChipSelected,
                        ]}
                        onPress={() =>
                          setSelectedBrowseMainCategoryId(selected ? null : cat.id)
                        }
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.homeBrowseDeptChipText,
                            selected && styles.homeBrowseDeptChipTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.categorySearchBox}>
              <Ionicons
                name="search-outline"
                size={22}
                color="#999"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#999"
                value={searchCategoryText}
                onChangeText={setSearchCategoryText}
                style={styles.categorySearchInput}
              />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              {displayedCategories.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.checkRow}
                  onPress={() => toggleCategory(item)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedCategory.includes(item) && styles.checkboxActive,
                    ]}
                  >
                    {selectedCategory.includes(item) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={clearCategoryModalSelections}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Clear category selections"
              >
                <Text style={styles.clearFiltersButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GENDER MODAL */}
      <Modal
        visible={genderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>USER TYPE</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.genderContainer}>
              {genderOptions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.genderItem}
                  onPress={() => setSelectedGender(item.label)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={[
                      styles.genderImage,
                      selectedGender === item.label && styles.activeGenderImage,
                    ]}
                  />
                  <Text style={styles.genderText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={clearGenderModalSelection}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Clear gender selection"
              >
                <Text style={styles.clearFiltersButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setGenderModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTERS</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterContent}>
              <ScrollView
                style={styles.filterLeftPanel}
                showsVerticalScrollIndicator={false}
              >
                {filterSections.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.leftFilterItem,
                      selectedFilterSection === item &&
                        styles.activeLeftFilterItem,
                    ]}
                    onPress={() => setSelectedFilterSection(item)}
                  >
                    <View
                      style={[
                        styles.leftActiveBar,
                        selectedFilterSection === item && {
                          backgroundColor: "#A0208C",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.leftFilterText,
                        selectedFilterSection === item &&
                          styles.activeLeftFilterText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.filterRightPanel}>
                <Text style={styles.rightTitle}>{selectedFilterSection}</Text>

                {selectedFilterSection === "Category" && (
                  <View style={styles.categorySearchBox}>
                    <Ionicons
                      name="search-outline"
                      size={22}
                      color="#999"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      placeholder="Search"
                      placeholderTextColor="#999"
                      value={searchCategoryText}
                      onChangeText={setSearchCategoryText}
                      style={styles.categorySearchInput}
                    />
                  </View>
                )}

                <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                  {displayedFilterOptions.map((item, index) => {
                    const isSelected =
                      selectedFilters[selectedFilterSection]?.includes(item) ||
                      false;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.checkRow}
                        onPress={() =>
                          toggleFilterOption(selectedFilterSection, item)
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <Text style={styles.checkText}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={clearFilterModalSelections}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearFiltersButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>






      

      <HomeBottomTabBar cartBadgeCount={cartBadgeCount} />
    </View>









  );
}

const FilterItem = ({ icon, label, onPress, tint }: FilterItemProps) => (
  <TouchableOpacity
    style={styles.filterChip}
    onPress={onPress}
    activeOpacity={0.88}
  >
    <View
      style={[
        styles.filterIconBubble,
        { backgroundColor: tint.bubble, borderColor: tint.border },
      ]}
    >
      <MaterialIcons name={icon} size={15} color={tint.icon} />
    </View>
    <Text style={styles.filterChipLabel}>{label}</Text>
  </TouchableOpacity>
);





const styles = StyleSheet.create({
  headerWishlistBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  headerWishlistBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  saveSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  saveSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  saveSheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingHorizontal: 18,
  },
  saveSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
  },
  saveSheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  saveSheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  saveSheetCreateIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#93C5FD",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  saveSheetCreateText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2563EB",
  },
  saveSheetDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  saveSheetWishlistIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  saveSheetWishlistTextCol: {
    flex: 1,
    minWidth: 0,
  },
  saveSheetWishlistTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  saveSheetWishlistSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  saveSheetCheckBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  saveSheetCheckBoxOff: {
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  saveSheetDoneBtn: {
    marginTop: 14,
    marginBottom: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  saveSheetDoneText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  collectionRoot: { flex: 1, backgroundColor: "#F3F4F6" },
  collectionTopBar: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#BFDBFE",
  },
  collectionTopTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  collectionScroll: { padding: 16, paddingBottom: 18 },
  collectionPreviewWrap: {
    height: 120,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  collectionPreviewImage: { width: 80, height: 80, resizeMode: "contain" },
  collectionLabel: { fontSize: 13, fontWeight: "800", color: "#64748B", marginBottom: 8 },
  collectionInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  collectionInput: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0F172A" },
  collectionRequired: { marginTop: 8, fontSize: 12, fontWeight: "700", color: "#9CA3AF" },
  collectionSectionTitle: { marginTop: 18, fontSize: 16, fontWeight: "900", color: "#0F172A" },
  collectionChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  collectionChip: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  collectionChipText: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  collectionRadioRow: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  collectionRadioLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  collectionRadioTextCol: { flex: 1, minWidth: 0 },
  collectionRadioTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  collectionRadioSub: { marginTop: 4, fontSize: 12.5, fontWeight: "700", color: "#64748B" },
  collectionRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  collectionRadioOuterOn: { borderColor: "#2563EB" },
  collectionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563EB" },
  collectionFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  collectionCreateBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  collectionCreateBtnText: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  container: { flex: 1, backgroundColor: HOME_PAGE_BG },

  homeScrollContent: {
    paddingBottom: 90,
    flexGrow: 1,
  },

  homeScrollMesh: {
    width: "100%",
    flexGrow: 1,
  },

  homeBrowsePanel: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: PANEL_BROWSE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_BROWSE,
    shadowColor: "#153B59",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },

  homeBrowsePanelChrome: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 4,
    paddingBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },

  homeFilterRowInset: {
    marginHorizontal: 6,
    marginTop: 3,
    marginBottom: 0,
  },

  homeBrowseApplyBtn: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  homeBrowseApplyText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E1B4B",
    letterSpacing: 0.3,
  },

  homeBrowseDeptSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  homeBrowseDeptTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#57534E",
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  homeBrowseDeptChips: {
    flexDirection: "row",
    paddingBottom: 4,
    paddingRight: 8,
  },

  homeBrowseDeptChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: "#F5F5F4",
    borderWidth: 1,
    borderColor: "#E7E5E4",
    maxWidth: 200,
  },

  homeBrowseDeptChipSelected: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },

  homeBrowseDeptChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#44403C",
  },

  homeBrowseDeptChipTextSelected: {
    color: "#312E81",
  },

  homeMediaPanel: {
    marginHorizontal: 10,
    marginBottom: 12,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: PANEL_MEDIA,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#153B59",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },

  homeServiceShell: {
    marginHorizontal: 10,
    marginBottom: 12,
    paddingVertical: 0,
  },

  homeSuggestedPanel: {
    marginHorizontal: 10,
    marginBottom: 12,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 10,
    backgroundColor: PANEL_SUGGESTED,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_SUGGESTED,
    shadowColor: "#1E4976",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

  homeVideoShell: {
    marginHorizontal: 10,
    marginBottom: 14,
    padding: 10,
    backgroundColor: PANEL_VIDEO,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_VIDEO,
    shadowColor: "#153B59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  headerSticky: {
    backgroundColor: "transparent",
    zIndex: 20,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  headerMeshGradient: {
    width: "100%",
  },

  header: {
    backgroundColor: "transparent",
    paddingTop: 2,
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.28)",
  },

  greetingBar: {
    width: "100%",
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.28)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingCol: {
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
    gap: 4,
  },
  headerIconHit: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingTextChip: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.4)",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },

  helloLine: {
    fontSize: 11,
    lineHeight: 14,
  },

  helloMuted: {
    color: "#EA580C",
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  helloName: {
    color: "#7C2D12",
    fontWeight: "800",
    letterSpacing: 0.1,
  },

  shopText: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 13,
    color: "#C2410C",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  searchBarIconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 0,
    marginRight: 0,
    paddingHorizontal: 2,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 0,
    gap: 8,
  },

  /** Search bar + suggestions list stack below the bar (not squeezed in the row). */
  searchFieldColumn: {
    flex: 1,
    minWidth: 0,
    zIndex: 50,
  },

  logoCol: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 52,
  },

  logoRingGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  logoInnerDisc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    // Avoid clipping/edge cutting on the logo artwork.
    overflow: "visible",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: 0,
  },

  logoRingPlain: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },

  locationPillOuter: {
    marginTop: 2,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.45)",
    shadowColor: "#FB923C",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },

  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 5,
  },

  locationPillText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "#0F172A",
    fontWeight: "600",
    minWidth: 0,
  },

  deliveryModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  deliveryModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  deliveryAddressSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "88%",
    paddingTop: 6,
  },
  deliverySheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    marginBottom: 12,
  },
  deliverySheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  deliverySheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  deliverySheetScroll: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  deliverySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  deliverySearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 0,
  },
  deliveryUseCurrentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  deliveryUseCurrentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryUseCurrentTextCol: {
    flex: 1,
    minWidth: 0,
  },
  deliveryUseCurrentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  deliveryUseCurrentSub: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 2,
  },
  deliveryDividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  deliverySavedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deliverySavedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  deliveryAddNewText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976D2",
  },
  deliveryAddHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  deliveryAddSheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginHorizontal: 8,
  },
  deliveryFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 4,
  },
  deliveryFormInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
    marginBottom: 12,
  },
  deliveryFormInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  deliverySaveNewButton: {
    backgroundColor: "#1976D2",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  deliverySaveNewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deliveryAddressPhone: {
    fontSize: 13,
    color: "#1976D2",
    marginTop: 4,
    fontWeight: "500",
  },
  deliveryAddressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEE",
    gap: 10,
  },
  deliveryAddressCardBody: {
    flex: 1,
    minWidth: 0,
  },
  deliveryAddressNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  deliveryAddressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    flexShrink: 1,
  },
  deliverySelectedBadge: {
    backgroundColor: "#D9ECFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliverySelectedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1565C0",
  },
  deliveryAddressLine: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  deliveryAddressMenuBtn: {
    padding: 4,
    marginTop: -2,
  },

  searchContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    paddingHorizontal: 10,
    minHeight: 44,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
  },

  searchDropdown: {
    alignSelf: "stretch",
    width: "100%",
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 4,
    maxHeight: 220,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  searchDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },

  searchDropdownText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },

  categorySection: {
    paddingTop: 2,
    paddingBottom: 0,
  },

  categoryScrollContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 0,
  },

  categoryChip: {
    width: CATEGORY_CHIP_WIDTH,
    alignItems: "center",
  },

  categoryChipSpacing: {
    marginRight: 7,
  },

  categoryImageCard: {
    width: CATEGORY_IMAGE_CARD_SIZE,
    height: CATEGORY_IMAGE_CARD_SIZE,
    borderRadius: 12,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    borderWidth: 0,
    borderColor: "transparent",
    marginBottom: 3,
    overflow: "hidden",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  categoryImageInner: {
    width: "100%",
    height: "100%",
  },

  categoryChipLabel: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    color: "#292524",
    width: "100%",
    lineHeight: 11,
    paddingHorizontal: 1,
  },

  categoryChipLabelChrome: {
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
    color: "#FFFFFF",
    width: "100%",
    lineHeight: 11,
    paddingHorizontal: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    marginHorizontal: 8,
    marginTop: 0,
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    gap: 1,
  },

  filterChip: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
    paddingVertical: 1,
  },

  filterIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginBottom: 2,
  },

  filterChipLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#292524",
    textAlign: "center",
    letterSpacing: 0.15,
  },

 banner: {
  width: '100%',
  height: 200,
  backgroundColor: '#fff',
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginTop: 0,
},

  bannerCarousel: {
    marginTop: 0,
  },

  bannerSlideInner: {
    marginTop: 0,
    flex: 1,
  },

  bannerImage: {
    width: "100%",
    height: "100%",
  },

  bannerDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },

  bannerDot: {
    width: 22,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#D3D3D3",
    marginHorizontal: 4,
  },

  bannerDotActive: {
    width: 34,
    backgroundColor: "#000",
  },

  heroPromoListContent: {
    paddingHorizontal: HERO_PROMO_SIDE_PADDING,
    paddingVertical: 0,
  },
  heroPromoItemWrap: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  heroPromoCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  /** Full-bleed inside rounded card (`overflow: hidden` on parent clips corners). */
  heroPromoImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

// looking card

  lookingCard: {
    marginHorizontal: 16,
    backgroundColor: "#1d324e",
    borderRadius: 26,
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 18,
  },

  lookingTitle: {
    fontSize: 45,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 18,
    marginBottom: 16,
  },

  lookingScrollContent: {
    paddingLeft: 18,
    paddingRight: 8,
  },

  lookingItemCard: {
    width: 300,
    backgroundColor: "#F1F1F1",
    borderRadius: 22,
    padding: 10,
    marginRight: 16,
    alignItems: "center",
  },

  lookingItemImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#e6e7e9",
  },

  lookingItemText: {
    fontSize: 13,
    color: "#050e12",
    textAlign: "center",
    fontWeight: "500",
  },

  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 0,
    marginTop: 0,
    backgroundColor: "rgba(239, 246, 255, 0.82)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.28)",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  serviceItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 2,
  },

  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(21, 101, 192, 0.35)",
  },

  serviceText: {
    fontSize: 9,
    color: "#0F172A",
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 12,
    paddingHorizontal: 2,
  },

  userSuggestionCard: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 18,
    minHeight: 220,
    borderWidth: 2,
    borderColor: "rgba(37, 99, 235, 0.35)",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },

  userSuggestionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },

  userSuggestionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(30, 64, 175, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  userSuggestionScroll: {
    flexGrow: 0,
    // Nested horizontal ScrollView: fixed height avoids 0-height layout on some Android builds.
    height: USER_PICK_TOP_SCROLL_MIN_H,
    minHeight: USER_PICK_TOP_SCROLL_MIN_H,
  },

  userSuggestionListContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 8,
    paddingBottom: 4,
  },

  userSuggestionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: 0.3,
  },

  userSuggestionItem: {
    alignItems: "center",
  },

  userSuggestionImageBox: {
    width: USER_PICK_CARD_WIDTH,
    height: 152,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(30, 64, 175, 0.2)",
  },

  userSuggestionText: {
    fontSize: 13,
    color: "#1E293B",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 18,
  },

  likeHeaderRow: {
    marginTop: 18,
    marginHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  likeHeaderText: {
    fontSize: 24,
    color: "#333",
  },

  likeArrow: {
    fontSize: 22,
    color: "#333",
    fontWeight: "500",
  },

  likeRow: {
    marginTop: 18,
    marginHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  likeItem: {
    width: 46,
    height: 62,
    backgroundColor: "#D3D3D3",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  likeImage: {
    width: "100%",
    height: "100%",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  bottomModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    minHeight: 300,
  },

  fullBottomModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: "82%",
    paddingTop: 10,
  },

  filterModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: "82%",
    paddingTop: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },

  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 24,
  },

  sortText: {
    fontSize: 18,
    color: "#555",
  },

  selectedSortText: {
    color: "#000",
    fontWeight: "600",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },

  radioOuterActive: {
    borderColor: "#2d33b4",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#243384",
  },

  categorySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: "#fff",
  },

  categorySearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#888",
    marginRight: 14,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  checkboxActive: {
    backgroundColor: "#d48933",
    borderColor: "#d78322",
  },

  checkText: {
    fontSize: 16,
    color: "#666",
  },

  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 30,
  },

  genderItem: {
    alignItems: "center",
  },

  genderImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#DDD",
  },

  activeGenderImage: {
    borderWidth: 2,
    borderColor: "#224498",
  },

  genderText: {
    marginTop: 10,
    fontSize: 15,
    color: "#333",
  },

  filterContent: {
    flex: 1,
    flexDirection: "row",
  },

  filterLeftPanel: {
    width: "30%",
    backgroundColor: "#F1F1F7",
  },

  leftFilterItem: {
    minHeight: 62,
    justifyContent: "center",
    paddingLeft: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },

  activeLeftFilterItem: {
    backgroundColor: "#fff",
  },

  leftActiveBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "transparent",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  leftFilterText: {
    fontSize: 14,
    color: "#666",
  },

  activeLeftFilterText: {
    color: "#28449c",
    fontWeight: "600",
  },

  filterRightPanel: {
    width: "70%",
    backgroundColor: "#fff",
    paddingTop: 12,
  },

  rightTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 86,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  productCount: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  clearFiltersButtonText: {
    fontSize: 16,
    color: "#A0208C",
    fontWeight: "700",
  },

  doneButton: {
    backgroundColor: "#205194",
    paddingHorizontal: 34,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  doneButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  productSectionHeader: {
    marginTop: 0,
    marginHorizontal: 0,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  suggestedTitleWrap: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },

  suggestedTitleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
    backgroundColor: "#0F172A",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },

  suggestedTitleBadgeText: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  suggestedTitleTagline: {
    marginTop: 8,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  productArrowButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },

  suggestedGridOuter: {
    paddingHorizontal: 4,
    marginBottom: 0,
  },

  suggestedTwoColRow: {
    flexDirection: "row",
    gap: SUGGESTED_CARD_GAP,
    marginBottom: SUGGESTED_CARD_GAP,
  },

  suggestedCardHalf: {
    flex: 1,
    minWidth: 0,
  },

  productCard: {
    marginBottom: 0,
  },

  productImageWrap: {
    width: "100%",
    height: 210,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
    marginBottom: 10,
    position: "relative",
  },

  productCardImage: {
    width: "100%",
    height: "100%",
  },

  ratingBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },

  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    lineHeight: 18,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  oldPrice: {
    fontSize: 12,
    color: "#888",
    textDecorationLine: "line-through",
  },

  newPrice: {
    fontSize: 15,
    color: "#222",
    fontWeight: "800",
  },

  buyText: {
    fontSize: 11,
    color: "#1E4AA8",
    fontWeight: "700",
  },
addCartContainer: {
  marginTop: 8,
},

addCartButton: {
  backgroundColor: "#FF7A00",
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: "center",
},

addCartText: {
  color: "#fff",
  fontSize: 13,
  fontWeight: "700",
},

videoBannerContainer: {
  width: "100%",
  alignSelf: "stretch",
  marginTop: 0,
  marginBottom: 0,
  borderRadius: 14,
  overflow: "hidden",
  backgroundColor: "#0b0b0c",
},

videoBanner: {
  width: "100%",
  height: "100%",
},
// premium — sapphire gradient (replaces flat orange)
premiumSection: {
  marginHorizontal: 10,
  marginTop: 12,
  marginBottom: 12,
  borderRadius: 26,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "rgba(30, 58, 138, 0.45)",
  shadowColor: "#1E40AF",
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.22,
  shadowRadius: 10,
  elevation: 6,
},

premiumGradient: {
  paddingTop: 20,
  paddingBottom: 20,
  paddingHorizontal: 14,
},

premiumHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
  gap: 12,
},

premiumTitleCluster: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
},

premiumIconTile: {
  width: 50,
  height: 50,
  borderRadius: 14,
  backgroundColor: "rgba(255, 255, 255, 0.12)",
  borderWidth: 1,
  borderColor: "rgba(253, 230, 138, 0.45)",
  justifyContent: "center",
  alignItems: "center",
},

premiumTitleCol: {
  flex: 1,
  minWidth: 0,
},

premiumTitleLine: {
  flexShrink: 1,
},

premiumTitleW: {
  fontSize: 21,
  fontWeight: "700",
  color: "#F8FAFC",
  letterSpacing: 0.2,
},

premiumTitleG: {
  fontSize: 21,
  fontWeight: "900",
  color: "#FDE68A",
  letterSpacing: -0.2,
},

premiumTitleForYou: {
  marginTop: 2,
  fontSize: 13,
  fontWeight: "600",
  color: "rgba(226, 232, 240, 0.92)",
  letterSpacing: 2,
  textTransform: "uppercase",
},

premiumArrowButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "#F8FAFC",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 2,
  borderColor: "rgba(147, 197, 253, 0.8)",
},

premiumGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

premiumCard: {
  width: '48.5%',
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 10,
  marginBottom: 12,
},

premiumImageWrap: {
  width: '100%',
  height: 150,
  borderRadius: 14,
  backgroundColor: '#f3f3f3',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginBottom: 10,
},

premiumImage: {
  width: '100%',
  height: '100%',
},

premiumName: {
  fontSize: 14,
  color: '#222',
  marginBottom: 4,
},

premiumSubtitle: {
  fontSize: 15,
  fontWeight: '800',
  color: '#000',
},

  rateSection: {
    marginHorizontal: 10,
    marginBottom: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rateSectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    paddingHorizontal: 12,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  rateCard: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  rateCardImage: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  rateCardRight: {
    flex: 1,
    minWidth: 0,
  },
  rateCardBrand: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  rateCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    opacity: 0.9,
    marginBottom: 10,
  },
  rateStarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingRight: 4,
  },
  rateStarColumn: {
    alignItems: "center",
    gap: 4,
    flex: 1,
    maxWidth: 56,
  },
  rateStarLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  rateCardHint: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  rateDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  rateDot: {
    width: 44,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  rateDotActive: {
    backgroundColor: "#475569",
  },
// megacolors — rose gradient + offer title (replaces flat navy block)
megaSection: {
  marginHorizontal: 10,
  marginTop: 20,
  marginBottom: 12,
  borderRadius: 26,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "rgba(190, 18, 60, 0.4)",
  shadowColor: "#BE123C",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.28,
  shadowRadius: 12,
  elevation: 8,
},

megaGradient: {
  paddingTop: 20,
  paddingBottom: 20,
  paddingHorizontal: 14,
},

megaHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
  gap: 12,
},

megaTitleCluster: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
},

megaTitleIconWrap: {
  width: 52,
  height: 52,
  borderRadius: 14,
  backgroundColor: "rgba(255, 255, 255, 0.18)",
  borderWidth: 1,
  borderColor: "rgba(253, 224, 71, 0.45)",
  justifyContent: "center",
  alignItems: "center",
},

megaTitleTextCol: {
  flex: 1,
  minWidth: 0,
},

megaTitleLine: {
  flexShrink: 1,
},

megaTitleA: {
  fontSize: 22,
  fontWeight: "700",
  color: "#FFFBEB",
  letterSpacing: 0.2,
},

megaTitleB: {
  fontSize: 22,
  fontWeight: "900",
  color: "#FACC15",
  letterSpacing: -0.3,
},

megaTitleHint: {
  marginTop: 4,
  fontSize: 12,
  fontWeight: "600",
  color: "rgba(255, 255, 255, 0.78)",
  letterSpacing: 0.6,
},

megaArrowButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "#FFFBEB",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 2,
  borderColor: "rgba(250, 204, 21, 0.65)",
},

megaGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

megaCard: {
  width: '48%',
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 10,
  marginBottom: 12,
},

megaImageWrap: {
  width: '100%',
  height: 150,
  borderRadius: 14,
  backgroundColor: '#f3f3f3',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginBottom: 10,
},

megaImage: {
  width: '100%',
  height: '100%',
},

megaName: {
  fontSize: 14,
  color: '#333',
},

megaSubtitle: {
  fontSize: 15,
  fontWeight: '800',
  color: '#000',
},
// IN FOCUS — teal header + horizontal snap carousel
focusSection: {
  marginTop: 8,
  marginHorizontal: 10,
  marginBottom: 12,
  paddingHorizontal: 12,
  paddingTop: 14,
  paddingBottom: 12,
  backgroundColor: PANEL_FOCUS,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: BORDER_FOCUS,
  shadowColor: "#153B59",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
},

  focusTopBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  focusTopBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },

  focusAccentBar: {
    width: 5,
    height: 46,
    borderRadius: 3,
  },

  focusTitleCluster: {
    flexShrink: 1,
  },

  focusEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#96309d",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  focusHeadline: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },

  focusHeadlineThin: {
    fontSize: 26,
    fontWeight: "300",
    color: "#6e2c6f",
    letterSpacing: 0.3,
  },

  focusHeadlineBold: {
    fontSize: 26,
    fontWeight: "900",
    color: "#981b90",
    letterSpacing: -0.5,
  },

  focusCarouselContent: {
    paddingBottom: 6,
    paddingRight: 20,
  },

  focusCarouselCard: {
    height: FOCUS_CARD_HEIGHT,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#EDE9FE",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },

  focusCarouselImage: {
    width: "100%",
    height: "100%",
  },

  focusCarouselFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },

  focusCarouselTag: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.55)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  focusCarouselTagText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FEF3C7",
    letterSpacing: 0.4,
  },

nextSectionTitleWrap: {
  marginTop: 8,
  marginBottom: 12,
  alignItems: 'center',
},

nextSectionTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: '#243b5a',
  letterSpacing: 1,
},

megaBannerSection: {
  paddingHorizontal: 14,
  marginBottom: 30,
},

megaBannerCard: {
  width: '100%',
  height: 400,
  borderRadius: 18,
  overflow: 'hidden',
  marginBottom: 18,
  backgroundColor: '#f3f3f3',
},

megaBannerImage: {
  width: '100%',
  height: 400,
},



// More products for you — vertical list rows

latestSection: {
  marginHorizontal: 10,
  marginTop: 4,
  marginBottom: 12,
  paddingTop: 14,
  paddingBottom: 16,
  backgroundColor: PANEL_LATEST,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: BORDER_LATEST,
  shadowColor: "#153B59",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
},

  latestListHead: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },

  latestListHeadAccent: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: "#EA580C",
  },

  latestListHeadText: {
    flex: 1,
    minWidth: 0,
  },

  latestListHeadBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  latestListHeadBadge: {
    fontSize: 11,
    fontWeight: "900",
    color: "#7C2D12",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FDBA74",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  latestListHeadTitleNew: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.3,
  },

  latestHeaderCard: {
    marginHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  latestHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },

  latestHeaderIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FDBA74",
    justifyContent: "center",
    alignItems: "center",
  },

  latestHeaderTextCol: {
    flex: 1,
    minWidth: 0,
  },

  latestHeaderEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  latestHeaderTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
    marginBottom: 2,
  },

  latestHeaderSub: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  latestHeaderCtaBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  latestListStack: {
    paddingHorizontal: 14,
  },

  latestGrid: {
    paddingHorizontal: 14,
    paddingBottom: 2,
  },

  latestGridRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
  },

  latestLoadMoreBtn: {
    marginTop: 10,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    alignItems: "center",
    justifyContent: "center",
  },

  latestLoadMoreBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9A3412",
  },

  latestGridCell: {
    flex: 1,
  },

  latestGridCard: {
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    margin: 0,
    shadowOpacity: 0,
    elevation: 0,
  },

  latestGridCardDividerRight: {
    borderRightWidth: 2,
    borderRightColor: "#E5E7EB",
  },

  latestGridCardDividerBottom: {
    borderBottomWidth: 2,
    borderBottomColor: "#E5E7EB",
  },

  latestGridImageWrap: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },

  latestGridImage: {
    width: "100%",
    height: "100%",
  },

  latestGridWishBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  latestGridDiscountPill: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(249,115,22,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(254,215,170,0.95)",
  },

  latestGridDiscountPillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  latestGridBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },

  latestGridTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 18,
    minHeight: 36,
  },

  latestGridPriceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
  },

  latestGridPriceCol: {
    minWidth: 0,
  },

  latestGridPriceCaption: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
    letterSpacing: 0.2,
  },

  latestGridPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.2,
  },

  latestGridOldPrice: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  latestGridMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  latestGridRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#16A34A",
  },

  latestGridRatingText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  latestGridStockPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: "52%",
  },
  latestGridStockPillOk: {
    backgroundColor: "#ECFDF5",
    borderColor: "#34D399",
  },
  latestGridStockPillLow: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
  },
  latestGridStockPillOut: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  latestGridStockText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#065F46",
    letterSpacing: 0.1,
  },
  latestGridStockTextOut: {
    color: "#991B1B",
  },
  latestGridAddCartRow: {
    marginTop: 2,
  },
  latestGridAddCartButton: {
    borderRadius: 10,
    backgroundColor: "#F97316",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  latestGridAddCartButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  latestGridAddCartButtonText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  latestRowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  latestRowThumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    position: "relative",
  },

  latestRowThumb: {
    width: "100%",
    height: "100%",
  },

  latestRowDiscountPill: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  latestRowDiscountPillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  latestRowCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
    minWidth: 0,
    justifyContent: "center",
  },

  latestRowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
    marginBottom: 6,
  },

  latestRowMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  latestRowStars: {
    color: "#D1D5DB",
    fontSize: 12,
    letterSpacing: 0.3,
  },

  latestRowRatingText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  latestRowPriceLine: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
  },

  latestRowStrike: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },

  latestRowPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#EA580C",
  },

  latestRowFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FDBA74",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
//  seller gallary


  sellerSectionContainer: {
    marginHorizontal: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: PANEL_SELLER,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_SELLER,
    shadowColor: "#5B21B6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  sellerGalleryHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    borderLeftWidth: 6,
    borderLeftColor: "#7C3AED",
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  sellerGalleryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  sellerGalleryTitleArea: {
    flex: 1,
    minWidth: 0,
  },

  sellerGalleryTitleBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  sellerGalleryTitleLine: {
    flexShrink: 1,
  },

  sellerGalleryTitleItalic: {
    fontSize: 25,
    fontStyle: "italic",
    fontWeight: "600",
    color: "#7C3AED",
  },

  sellerGalleryTitleBold: {
    fontSize: 25,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.5,
  },

  sellerGallerySeeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#F5F3FF",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },

  sellerGallerySeeAllText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#5B21B6",
    letterSpacing: 0.2,
  },

  sellerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  sellerCard: {
    width: "48%",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#E6E3F3",
  },

  imageArea: {
    height: 210,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6E3F3",
  },

  sellerImage: {
    width: "75%",
    height: "75%",
    resizeMode: "contain",
  },

  nameBar: {
    minHeight: 55,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: "#766DCC",
    justifyContent: "center",
    alignItems: "center",
  },

  businessName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  storeSpotlightCardSub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

// cards
freshSection: {
  marginHorizontal: 10,
  marginTop: 4,
  marginBottom: 12,
  paddingTop: 14,
  paddingBottom: 12,
  backgroundColor: PANEL_FRESH,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: BORDER_FRESH,
  shadowColor: "#153B59",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
},

  freshTitleBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    minWidth: 0,
  },

  freshTitleAccentBar: {
    width: 5,
    height: 32,
    borderRadius: 3,
    backgroundColor: "#f28a18",
    marginRight: 12,
  },

  freshTitleTextCol: {
    flexShrink: 1,
  },

  freshTitle: {
    flexShrink: 1,
  },

  freshTitleWord: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.3,
  },

  freshTitleHighlight: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f28a18",
    letterSpacing: 0.5,
  },

  freshTitleUnderline: {
    marginTop: 6,
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#C4812E",
  },

freshCardImage: {
  width: "100%",
  height: 300,
  borderRadius: 14,
},
freshArrow: {
  backgroundColor: "#0A2540", // navy blue (your theme)
  padding: 8,
  borderRadius: 25,
},
freshHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  marginBottom: 12,
},

  freshFlatListContent: {
    marginTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  freshHorizontalScroll: {
    width: "100%",
    minHeight: 308,
  },

  secondBannerAfterFresh: {
    marginHorizontal: 10,
    marginTop: 0,
    marginBottom: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: PANEL_BANNER2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_BANNER2,
    shadowColor: "#1E4976",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

freshPairRow: {
  flexDirection: "row",
  alignItems: "stretch",
},

// Shop by Store

  shopByStoreSection: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: PANEL_SHOP,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER_SHOP,
    shadowColor: "#153B59",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

  shopByStoreHeader: {
    marginHorizontal: 12,
    marginBottom: 14,
  },

  shopByStoreTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  shopByStoreIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#CCFBF1",
    borderWidth: 2,
    borderColor: "#5EEAD4",
    justifyContent: "center",
    alignItems: "center",
  },

  shopByStoreTitleCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  shopByStoreTitleMain: {
    flexShrink: 1,
  },

  shopByStoreTitleLight: {
    fontSize: 26,
    fontWeight: "300",
    color: "#475569",
    letterSpacing: 0.2,
  },

  shopByStoreTitleEmphasis: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0D9488",
    letterSpacing: -0.5,
  },

  shopByStoreRule: {
    marginTop: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#14B8A6",
    opacity: 0.85,
  },

storeList: {
  paddingLeft: 16,
  paddingRight: 8,
  paddingBottom: 4,
},

storeItem: {
  width: 172,
  alignItems: "center",
  marginRight: 20,
},

/** Rounded frame sized for wide banner PNGs (`homebanner1section*.png`). */
shopStoreImageShell: {
  width: 172,
  height: 124,
  borderRadius: 20,
  overflow: "hidden",
  backgroundColor: "#E2E8F0",
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: "rgba(13, 148, 136, 0.25)",
},

shopStoreImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

  promoModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  promoModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  promoModalSheet: {
    width: "100%",
    maxHeight: Math.min(Dimensions.get("window").height * 0.78, 620),
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 3,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "rgba(120, 53, 15, 0.35)",
  },
  promoBokehLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  promoStarsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  promoModalStar: {
    position: "absolute",
    zIndex: 4,
  },
  promoBokehDot: {
    position: "absolute",
    backgroundColor: "#FEF08A",
  },
  promoCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 20,
  },
  promoCloseBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(120, 53, 15, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  promoScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 8,
  },
  promoTitleScript: {
    fontSize: 28,
    fontWeight: "900",
    color: "#422006",
    textAlign: "center",
    letterSpacing: -0.5,
    fontStyle: "italic",
    textShadowColor: "rgba(255, 255, 255, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  promoTitleSub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: "#7C2D12",
    textAlign: "center",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  promoHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    gap: 4,
  },
  promoCharWrap: {
    width: 72,
    height: 100,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  promoCharImage: {
    width: 68,
    height: 96,borderRadius: 10,
  },
  promoAdCard: {
    position: "relative",
    flex: 1,
    maxWidth: width * 0.52,
    borderRadius: 20,
    padding: 4,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#F97316",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  promoAdCardInner: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 168,
  },
  promoBlastRing: {
    position: "absolute",
    left: -10,
    right: -10,
    top: -10,
    bottom: -10,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.75)",
  },
  promoBlastRingSecondary: {
    position: "absolute",
    left: -18,
    right: -18,
    top: -18,
    bottom: -18,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "rgba(255,238,170,0.65)",
  },
  promoStarBlast: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -8,
    marginTop: -8,
    zIndex: 8,
  },
  promoAdBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FEF08A",
  },
  promoAdBadgeText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },
  promoHeroImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },
  promoBodyBold: {
    marginTop: 20,
    fontSize: 17,
    fontWeight: "800",
    color: "#1C1917",
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  promoBodyMuted: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#422006",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.95,
  },
  promoCtaOuter: {
    marginTop: 22,
    borderRadius: 999,
    overflow: "hidden",
    alignSelf: "stretch",
    shadowColor: "#BE185D",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 12,
  },
  promoCtaGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  promoCtaText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
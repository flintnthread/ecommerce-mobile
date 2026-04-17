import "react-native-gesture-handler";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import api from "../services/api";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import {
  GestureHandlerRootView,
  TouchableOpacity as GestureTouchableOpacity,
} from "react-native-gesture-handler";

type BagsSubcategoryApi = {
  id: number;
  name?: string | null;
  image?: string | null;
  mobileImage?: string | null;
  mobileimage?: string | null;
  subcategoryName?: string | null;
  subcategoryImage?: string | null;
};

type BagsSubcategoryTableRow = {
  categoryName: string;
  mobileImage?: string | null;
  mobileimage?: string | null;
  subcategories: BagsSubcategoryApi[];
};

type AccessoriesCategoryApi = {
  id: number;
  categoryName: string;
  image: string | null;
  mobileImage: string | null;
  status?: number;
};

const ACCESSORIES_PARENT_CATEGORY_ID = 28;
const ACCESSORIES_CATEGORIES_ENDPOINT =
  "/api/categories/28/subcategories";
const JEWELLERY_SUBCATEGORIES_TABLE_ENDPOINT =
  "/api/categories/40/subcategories-table";
const OTHER_ACCESSORIES_SUBCATEGORIES_TABLE_ENDPOINT =
  "/api/categories/43/subcategories-table";
const WATCHES_SUBCATEGORIES_TABLE_ENDPOINT =
  "/api/categories/41/subcategories-table";
const ACCESSORIES_API_ORIGIN = String(api.defaults.baseURL || "").replace(/\/$/, "");

/** Backend category id for Bags (GET /api/categories/:id/subcategories-table). */
const BAGS_CATEGORY_ID_FALLBACK = 39;

/**
 * Maps each Bags showcase card to API subcategory ids so chips reflect live data.
 * Covers all subcategories from the Bags response across the four lanes.
 */
const BAGS_CARD_SUBCATEGORY_IDS: Record<string, number[]> = {
  w1: [72, 71, 266],
  w2: [67],
  w3: [69, 68],
  w4: [70],
};

function getSubcategoryTableImageUri(filename: string | null | undefined): string {
  const base = String(ACCESSORIES_API_ORIGIN || api.defaults.baseURL || "").replace(/\/$/, "");
  const raw = filename?.trim();
  if (!raw) return `${base}/uploads/`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;

  const normalized = raw.replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (normalized.startsWith("/")) return `${base}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${base}/${normalized}`;
  return `${base}/uploads/${normalized}`;
}

function getApiImageSourceOrFallback(
  filename: string | null | undefined,
  fallbackSource: any
): any {
  if (!filename?.trim()) return fallbackSource;
  return { uri: getSubcategoryTableImageUri(filename) } as const;
}

function getSubcategoryDisplayName(sub: BagsSubcategoryApi): string {
  return sanitizeApiLabel(sub.name ?? sub.subcategoryName ?? "");
}

function getSubcategoryImageFilename(sub: BagsSubcategoryApi): string | null {
  return sub.mobileImage ?? sub.mobileimage ?? sub.image ?? sub.subcategoryImage ?? null;
}

function getSubcategoryImageSourceOrFallback(sub: BagsSubcategoryApi, fallbackSource: any): any {
  return getApiImageSourceOrFallback(getSubcategoryImageFilename(sub), fallbackSource);
}

function sanitizeApiLabel(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\u0019/g, "'").replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

function getSubcategoriesForBagsCard(
  cardId: string,
  all: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const wanted = BAGS_CARD_SUBCATEGORY_IDS[cardId];
  if (!wanted?.length || !all.length) return [];
  const byId = new Map(all.map((s) => [s.id, s]));
  return wanted.map((id) => byId.get(id)).filter((s): s is BagsSubcategoryApi => Boolean(s));
}

function normalizeSubcategory(item: BagsSubcategoryApi): BagsSubcategoryApi {
  return {
    ...item,
    name: item.name ?? item.subcategoryName ?? null,
    image: item.image ?? item.subcategoryImage ?? null,
    mobileImage: item.mobileImage ?? item.mobileimage ?? null,
    mobileimage: item.mobileimage ?? item.mobileImage ?? null,
  };
}

function getNormalizedRowSubcategories(
  rows: BagsSubcategoryTableRow[] | undefined
): BagsSubcategoryApi[] {
  const first = Array.isArray(rows) ? rows[0] : undefined;
  const list = Array.isArray(first?.subcategories) ? first.subcategories : [];
  return list.map(normalizeSubcategory);
}

/** Backend category id for Belts & Caps (GET /api/categories/:id/subcategories-table). */
const BELTS_CAPS_CATEGORY_ID_FALLBACK = 42;

/**
 * Maps each Belts & Caps showcase card to API subcategory ids.
 * Sample ids: Belts 83, Caps 84, Sunglasses 85, Gloves 87, Goggles 348, Hats 349.
 */
const BELTS_CAPS_CARD_SUBCATEGORY_IDS: Record<string, number[]> = {
  m1: [83],
  m2: [83],
  m3: [84, 85],
  m4: [349, 87, 348],
};

function getSubcategoriesForBeltsCapsCard(
  cardId: string,
  all: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const wanted = BELTS_CAPS_CARD_SUBCATEGORY_IDS[cardId];
  if (!wanted?.length || !all.length) return [];
  const byId = new Map(all.map((s) => [s.id, s]));
  return wanted.map((id) => byId.get(id)).filter((s): s is BagsSubcategoryApi => Boolean(s));
}

/** Backend category id for Jewellery (GET /api/categories/:id/subcategories-table). */
const JEWELLERY_CATEGORY_ID_FALLBACK = 40;

/** Watches category subcategories table (GET /api/categories/:id/subcategories-table). Postman uses 41. */
const WATCHES_SUBCATEGORIES_CATEGORY_ID_FALLBACK = 41;

/**
 * Maps each jewellery carousel card index (0–6, aligned with womanYouAreCardFooters) to API subcategory ids.
 */
const JEWELLERY_CAROUSEL_SUBCATEGORY_IDS: Record<number, number[]> = {
  0: [74, 271, 272, 250, 251, 273],
  1: [73, 78],
  2: [254, 338],
  3: [93, 340],
  4: [75, 275],
  5: [287, 337],
  6: [77],
};

function getSubcategoriesForJewelleryCarouselIndex(
  carouselIndex: number,
  all: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const wanted = JEWELLERY_CAROUSEL_SUBCATEGORY_IDS[carouselIndex];
  if (!wanted?.length || !all.length) return [];
  const byId = new Map(all.map((s) => [s.id, s]));
  return wanted.map((id) => byId.get(id)).filter((s): s is BagsSubcategoryApi => Boolean(s));
}

/** Backend category id for Other Accessories (GET /api/categories/:id/subcategories-table). */
const OTHER_ACCESSORIES_CATEGORY_ID_FALLBACK = 43;

/** Backend category id for Gadgets Accessories (GET /api/categories/:id/subcategories-table). */
const GADGETS_CATEGORY_ID_FALLBACK = 103;

/** Single source of truth for hero card titles = API subcategory names (5 rows). */
const OTHER_ACCESSORIES_DEAL_TITLES: Record<string, string> = {
  ad1: "Hair Accessories",
  ad2: "Brooches",
  ad3: "Cufflinks",
  ad4: "Scarves",
  ad5: "Mufflers",
};

/** Maps each ACCESSORIES hero card to API subcategory ids (related chips only for that card). */
const OTHER_ACCESSORIES_DEAL_SUBCATEGORY_IDS: Record<string, number[]> = {
  ad1: [89],
  ad2: [91],
  ad3: [92],
  ad4: [330],
  ad5: [335],
};

function dedupeOtherAccessoriesSubcategories(
  list: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const seen = new Set<number>();
  const out: BagsSubcategoryApi[] = [];
  for (const s of list) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      out.push(s);
    }
  }
  return out.sort((a, b) => a.id - b.id);
}

function getSubcategoriesForOtherAccessoriesDeal(
  dealId: string,
  all: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const wanted = OTHER_ACCESSORIES_DEAL_SUBCATEGORY_IDS[dealId];
  if (!wanted?.length || !all.length) return [];
  const byId = new Map(all.map((s) => [s.id, s]));
  return wanted.map((id) => byId.get(id)).filter((s): s is BagsSubcategoryApi => Boolean(s));
}

/** Related rows for the selected deal: by id, else match API name to card title. */
function getOtherAccessoriesSubcategoriesForSelectedDeal(
  dealId: string,
  all: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const deduped = dedupeOtherAccessoriesSubcategories(all);
  const byId = getSubcategoriesForOtherAccessoriesDeal(dealId, deduped);
  if (byId.length > 0) return byId;
  const title = OTHER_ACCESSORIES_DEAL_TITLES[dealId]?.trim();
  if (!title || deduped.length === 0) return [];
  const lower = title.toLowerCase();
  const hit = deduped.find((s) => getSubcategoryDisplayName(s).toLowerCase() === lower);
  return hit ? [hit] : [];
}

/**
 * Offline fallback only — same 17 subcategory names as the API, split across 7 carousel slots
 * (6+2+2+2+2+2+1). Avoids 7×4=28 placeholder labels that did not match the real catalogue count.
 */
const jewelleryCarouselFallbackCategories: Record<number, string[]> = {
  0: [
    "Necklaces",
    "Pearl Necklace Set",
    "Bridal Necklace",
    "Chains",
    "Anti Tarnish Chains",
    "Jewellery Set",
  ],
  1: ["Earrings", "Nose Pins"],
  2: ["Bracelet", "Couple Bracelets"],
  3: ["Rings", "Key-lock Couple Sets"],
  4: ["Bangles", "Vaddanam"],
  5: ["Pendants", "Customized Name Pendants"],
  6: ["Anklets"],
};

const jewelleryCarouselFallbackImages: Record<string, any> = {
  Necklaces: require("../assets/images/latest3.png"),
  "Pearl Necklace Set": require("../assets/images/latest1.png"),
  "Bridal Necklace": require("../assets/images/latest2.png"),
  Chains: require("../assets/images/look3.png"),
  "Anti Tarnish Chains": require("../assets/images/look3.png"),
  "Jewellery Set": require("../assets/images/latest1.png"),
  Earrings: require("../assets/images/latest3.png"),
  "Nose Pins": require("../assets/images/latest1.png"),
  Bracelet: require("../assets/images/accessariescate.png"),
  "Couple Bracelets": require("../assets/images/look2.png"),
  Rings: require("../assets/images/look1.png"),
  "Key-lock Couple Sets": require("../assets/images/latest3.png"),
  Bangles: require("../assets/images/latest2.png"),
  Vaddanam: require("../assets/images/latest3.png"),
  Pendants: require("../assets/images/look3.png"),
  "Customized Name Pendants": require("../assets/images/product5.png"),
  Anklets: require("../assets/images/latest4.png"),
};

type TopCategory = {
  id: string;
  label: string;
  image: any;
};

function normalizeCategoryLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TOP_CATEGORY_ID_BY_API_NAME: Record<string, string> = {
  bags: "bags",
  "belts and caps": "belts_caps",
  "gadgets accessories": "gadgets",
  jewellery: "jewellery",
  "other accessories": "other_accessories",
  watches: "watches",
};

function mapApiCategoryNameToTopCategoryId(categoryName: string): string | null {
  return TOP_CATEGORY_ID_BY_API_NAME[normalizeCategoryLabel(categoryName)] ?? null;
}

type CollectionItem = {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: any;
};

type SplitProductItem = {
  id: string;
  title: string;
  /** Selling price in INR */
  price: number;
  /** MRP / original price in INR */
  mrp: number;
  image: any;
  rating: number;
  reviewCount?: number;
};

const topCategoriesFallback: TopCategory[] = [
  { id: "bags", label: "Bags", image: require("../assets/images/handbag.png") },
  { id: "belts_caps", label: "Belts & Caps", image: require("../assets/images/product6.png") },
  { id: "gadgets", label: "Gadgets Accessories", image: require("../assets/images/product2.png") },
  { id: "jewellery", label: "Jewellery", image: require("../assets/images/latest3.png") },
  { id: "other_accessories", label: "Other Accessories", image: require("../assets/images/accessariescate.png") },
  { id: "watches", label: "Watches", image: require("../assets/images/menwatch.png") },
];

const topCollectionItems: CollectionItem[] = [
  {
    id: "c1",
    title: "Everyday Elegance",
    subtitle: "Jewellery & Charms",
    tag: "Top Rated",
    image: require("../assets/images/toprated.png"),
  },
  {
    id: "c2",
    title: "Signature Watches",
    subtitle: "Premium timepieces",
    tag: "New Drop",
    image: require("../assets/images/menwatch.png"),
  },
  {
    id: "c3",
    title: "Festive Handbags",
    subtitle: "Party-ready bags",
    tag: "Limited",
    image: require("../assets/images/handbag.png"),
  },
  {
    id: "c4",
    title: "Beauty Must-haves",
    subtitle: "Glow essentials",
    tag: "Trending",
    image: require("../assets/images/bangles.png"),
  },
];

const womenAccessoriesItems: CollectionItem[] = [
  {
    id: "w1",
    title: "Tote Bags",
    subtitle: "Work, travel & everyday",
    tag: "Bags",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "w2",
    title: "Chic Handbags",
    subtitle: "Party & daily carry",
    tag: "Bags",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "w3",
    title: "Sling & Crossbody",
    subtitle: "Hands-free everyday",
    tag: "Bags",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "w4",
    title: "Clutches & Evening",
    subtitle: "Occasion-ready picks",
    tag: "Bags",
    image: require("../assets/images/product2.png"),
  },
];

/** Fallback chips if the Bags subcategories API is unavailable. */
const bagsRelatedCategoriesFallback: Record<string, string[]> = {
  w1: ["Leather totes", "Canvas totes", "Work totes", "Weekender totes"],
  w2: ["Satchels", "Hobo bags", "Quilted bags", "Shoulder bags"],
  w3: ["Crossbody bags", "Sling bags", "Belt bags", "Mini slings"],
  w4: ["Clutches", "Evening bags", "Envelope bags", "Wristlets"],
};

const bagsRelatedCategoryImagesFallback: Record<string, any> = {
  "Leather totes": require("../assets/images/look3.png"),
  "Canvas totes": require("../assets/images/look4.png"),
  "Work totes": require("../assets/images/product5.png"),
  "Weekender totes": require("../assets/images/kidscate.png"),
  Satchels: require("../assets/images/look3.png"),
  "Hobo bags": require("../assets/images/look4.png"),
  "Quilted bags": require("../assets/images/product2.png"),
  "Shoulder bags": require("../assets/images/product5.png"),
  "Crossbody bags": require("../assets/images/look2.png"),
  "Sling bags": require("../assets/images/look4.png"),
  "Belt bags": require("../assets/images/product6.png"),
  "Mini slings": require("../assets/images/accessariescate.png"),
  Clutches: require("../assets/images/product2.png"),
  "Evening bags": require("../assets/images/latest3.png"),
  "Envelope bags": require("../assets/images/look3.png"),
  Wristlets: require("../assets/images/product4.png"),
};

const styleLabItems: CollectionItem[] = [
  {
    id: "sl1",
    title: "Minimal Gold Set",
    subtitle: "Office-ready picks",
    tag: "Editor Pick",
    image: require("../assets/images/latest3.png"),
  },
  {
    id: "sl2",
    title: "Weekend Sling Edit",
    subtitle: "Light and stylish",
    tag: "New",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "sl3",
    title: "Classic Watch Pairing",
    subtitle: "Match every outfit",
    tag: "Must Have",
    image: require("../assets/images/accessoriescate.png"),
  },
];

const menAccessoriesItems: CollectionItem[] = [
  {
    id: "m1",
    title: "Dress & Leather Belts",
    subtitle: "Formal fits & slim profiles",
    tag: "Belts & Caps",
    image: require("../assets/images/product6.png"),
  },
  {
    id: "m2",
    title: "Premium Casual Belts",
    subtitle: "Canvas, web & everyday",
    tag: "Belts & Caps",
    image: require("../assets/images/product1.png"),
  },
  {
    id: "m3",
    title: "Caps & Snapbacks",
    subtitle: "Street, sport & everyday",
    tag: "Belts & Caps",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "m4",
    title: "Beanies & Bucket Hats",
    subtitle: "Seasonal headwear picks",
    tag: "Belts & Caps",
    image: require("../assets/images/look4.png"),
  },
];

/** Fallback chips if the Belts & Caps subcategories API is unavailable. */
const menRelatedCategoriesFallback: Record<string, string[]> = {
  m1: ["Formal belts", "Leather belts", "Dress belts", "Slim belts"],
  m2: ["Canvas belts", "Web belts", "Reversible belts", "Buckle belts"],
  m3: ["Baseball caps", "Snapbacks", "Trucker caps", "Dad caps"],
  m4: ["Beanies", "Bucket hats", "Winter caps", "Visors"],
};

const menRelatedCategoryImagesFallback: Record<string, any> = {
  "Formal belts": require("../assets/images/product6.png"),
  "Leather belts": require("../assets/images/product4.png"),
  "Dress belts": require("../assets/images/product6.png"),
  "Slim belts": require("../assets/images/look3.png"),
  "Canvas belts": require("../assets/images/look2.png"),
  "Web belts": require("../assets/images/product1.png"),
  "Reversible belts": require("../assets/images/look3.png"),
  "Buckle belts": require("../assets/images/product4.png"),
  "Baseball caps": require("../assets/images/look2.png"),
  Snapbacks: require("../assets/images/look3.png"),
  "Trucker caps": require("../assets/images/look4.png"),
  "Dad caps": require("../assets/images/accessariescate.png"),
  Beanies: require("../assets/images/latest3.png"),
  "Bucket hats": require("../assets/images/look4.png"),
  "Winter caps": require("../assets/images/latest4.png"),
  Visors: require("../assets/images/sportscate.png"),
};

const kidsAccessoriesItems: CollectionItem[] = [
  {
    id: "k1",
    title: "School Backpacks",
    subtitle: "Playful prints & comfort",
    tag: "Kids",
    image: require("../assets/images/kidscate.png"),
  },
  {
    id: "k2",
    title: "Hair Bands & Clips",
    subtitle: "Colourful everyday",
    tag: "Kids",
    image: require("../assets/images/latest1.png"),
  },
  {
    id: "k3",
    title: "Kids' Watches",
    subtitle: "Easy-read dials",
    tag: "Kids",
    image: require("../assets/images/accessariescate.png"),
  },
  {
    id: "k4",
    title: "Caps & Sunglasses",
    subtitle: "Sun-ready style",
    tag: "Kids",
    image: require("../assets/images/look4.png"),
  },
];

const kidsRelatedCategories: Record<string, string[]> = {
  k1: ["Toddler Bags", "School Backpacks", "Lunch Boxes", "Sippers"],
  k2: ["Hair Clips", "Scrunchies", "Headbands", "Bow Sets"],
  k3: ["Analog Kids Watches", "Digital Watches", "Smart Bands", "Strap Packs"],
  k4: ["Baseball Caps", "Bucket Hats", "Kids Sunglasses", "UV Goggles"],
};

const kidsRelatedCategoryImages: Record<string, any> = {
  "Toddler Bags": require("../assets/images/kidscate.png"),
  "School Backpacks": require("../assets/images/latest2.png"),
  "Lunch Boxes": require("../assets/images/product1.png"),
  Sippers: require("../assets/images/product3.png"),
  "Hair Clips": require("../assets/images/latest3.png"),
  Scrunchies: require("../assets/images/latest4.png"),
  Headbands: require("../assets/images/look2.png"),
  "Bow Sets": require("../assets/images/look3.png"),
  "Analog Kids Watches": require("../assets/images/accessoriescate.png"),
  "Digital Watches": require("../assets/images/accessariescate.png"),
  "Smart Bands": require("../assets/images/sportscate.png"),
  "Strap Packs": require("../assets/images/product5.png"),
  "Baseball Caps": require("../assets/images/look2.png"),
  "Bucket Hats": require("../assets/images/look3.png"),
  "Kids Sunglasses": require("../assets/images/look4.png"),
  "UV Goggles": require("../assets/images/sportscate.png"),
};

/** Default lane for horizontal “tear-off” kids ideas (no tile picker UI). */
const KIDS_RELATED_SECTION_ITEM_ID = "k1";

function getDefaultKidsCategoryForLane(laneId: string) {
  return kidsRelatedCategories[laneId]?.[0] ?? null;
}

const splitShowcaseImages = [
  require("../assets/images/accessariescate.png"),
  require("../assets/images/accessoriescate.png"),
  require("../assets/images/latest1.png"),
  require("../assets/images/look3.png"),
];

const splitShowcaseProducts: SplitProductItem[] = [
  {
    id: "sp1",
    title: "SoundWave ANC Headphones",
    price: 24999,
    mrp: 34999,
    image: require("../assets/images/product2.png"),
    rating: 4.8,
    reviewCount: 312,
  },
];

const gadgetsAccessoryQuickLinks = [
  { id: "gq1", label: "Audio accessories", icon: "headset" as const },
  { id: "gq2", label: "Wearable gadgets", icon: "watch-outline" as const },
  { id: "gq3", label: "Charging & power", icon: "battery-charging-outline" as const },
  { id: "gq4", label: "Cases & protection", icon: "phone-portrait-outline" as const },
];

/** Subcategories for each gadgets-accessories quick link (ids gq1–gq4 unchanged). */
const gadgetsQuickLinkSubcategories: Record<string, string[]> = {
  gq1: ["Wireless earbuds", "Bluetooth headphones", "Neckband earphones", "Mini speakers"],
  gq2: ["Smartwatches", "Fitness trackers", "Smart bands", "Smart glasses"],
  gq3: ["Power banks", "USB-C & lightning cables", "Wireless chargers", "GaN wall adapters"],
  gq4: ["Phone cases & covers", "Tablet cases", "Tempered glass", "Skins & lens protectors"],
};

/** API-to-lane map for gadgets quick links (same lane ids gq1–gq4). */
const GADGETS_QUICK_LINK_SUBCATEGORY_IDS: Record<string, number[]> = {
  gq1: [],
  gq2: [357], // Clothing Accessories (from /api/categories/103/subcategories-table)
  gq3: [],
  gq4: [],
};

function getSubcategoriesForGadgetsQuickLink(
  quickLinkId: string,
  all: BagsSubcategoryApi[]
): BagsSubcategoryApi[] {
  const wanted = GADGETS_QUICK_LINK_SUBCATEGORY_IDS[quickLinkId];
  if (!wanted?.length || !all.length) return [];
  const byId = new Map(all.map((s) => [s.id, s]));
  return wanted.map((id) => byId.get(id)).filter((s): s is BagsSubcategoryApi => Boolean(s));
}

const gadgetsSubcategoryImages: Record<string, any> = {
  "Wireless earbuds": require("../assets/images/product2.png"),
  "Bluetooth headphones": require("../assets/images/product2.png"),
  "Neckband earphones": require("../assets/images/accessariescate.png"),
  "Mini speakers": require("../assets/images/product3.png"),
  Smartwatches: require("../assets/images/accessoriescate.png"),
  "Fitness trackers": require("../assets/images/accessariescate.png"),
  "Smart bands": require("../assets/images/latest3.png"),
  "Smart glasses": require("../assets/images/look2.png"),
  "Power banks": require("../assets/images/product1.png"),
  "USB-C & lightning cables": require("../assets/images/product6.png"),
  "Wireless chargers": require("../assets/images/product4.png"),
  "GaN wall adapters": require("../assets/images/product5.png"),
  "Phone cases & covers": require("../assets/images/product2.png"),
  "Tablet cases": require("../assets/images/look3.png"),
  "Tempered glass": require("../assets/images/product3.png"),
  "Skins & lens protectors": require("../assets/images/look4.png"),
};

const gadgetsHighlightTileLabels = [
  "Gadget picks",
  "Tech add-ons",
  "Desk & travel",
  "New tech drops",
];

/** Dummy hero images for the Gadget highlights strip (separate from split-showcase carousel assets). */
const gadgetsHighlightImages = [
  require("../assets/images/product2.png"),
  require("../assets/images/product3.png"),
  require("../assets/images/menwatch.png"),
  require("../assets/images/product1.png"),
];

type SpotlightFooterAdBanner = {
  id: string;
  image: any;
  caption: string;
  title: string;
  subtitle: string;
};

type WomanYouAreCarouselItem = {
  id: string;
  image: any;
};

type KidsAccessoryShowcaseItem = {
  id: string;
  title: string;
  offer: string;
  image: any;
};

type KidsAccessoryShowcaseRow = {
  id: string;
  title: string;
  items: KidsAccessoryShowcaseItem[];
};

type AccessoriesHeroDeal = {
  id: string;
  title: string;
  brand: string;
  subtitle: string;
  offer: string;
  image: any;
};

const JEWELLERY_SECTION_QUOTE =
  "We create pieces that celebrate how you move, imagine, and shine — timeless sparkle for every moment.";

/** Staggered editorial carousel (jewellery on velvet — Sorellé-style layout) */
const womanYouAreCarouselItems: WomanYouAreCarouselItem[] = [
  { id: "j1", image: require("../assets/images/latest3.png") },
  { id: "j2", image: require("../assets/images/latest1.png") },
  { id: "j3", image: require("../assets/images/latest2.png") },
  { id: "j4", image: require("../assets/images/accessoriescate.png") },
  { id: "j5", image: require("../assets/images/accessariescate.png") },
  { id: "j6", image: require("../assets/images/look3.png") },
  { id: "j7", image: require("../assets/images/latest1.png") },
];

const womanYouAreCardFooters = [
  "NECKLACES",
  "EARRINGS",
  "BRACELETS",
  "RINGS",
  "BANGLES",
  "PENDANTS",
  "ANKLETS",
] as const;

const kidsAccessoryShowcaseRows: KidsAccessoryShowcaseRow[] = [
  {
    id: "kr1",
    title: "EVERYTHING FOR EVERYONE",
    items: [
      { id: "kr1-1", title: "Gold & Silver Jewellery", offer: "UP TO 20% OFF", image: require("../assets/images/latest1.png") },
      { id: "kr1-2", title: "Accessories", offer: "UP TO 15% OFF", image: require("../assets/images/latest1.png") },
      { id: "kr1-3", title: "Watches & Sunglasses", offer: "40-50% OFF", image: require("../assets/images/accessoriescate.png") },
      { id: "kr1-4", title: "Handbags & More", offer: "MIN. 40% OFF", image: require("../assets/images/look3.png") },
    ],
  },
  {
    id: "kr2",
    title: "SMART PICKS",
    items: [
      { id: "kr2-1", title: "Belts & Wallets", offer: "UP TO 50% OFF", image: require("../assets/images/product1.png") },
      { id: "kr2-2", title: "Smart Watches", offer: "MIN. 50% OFF", image: require("../assets/images/accessariescate.png") },
      { id: "kr2-3", title: "Fashion Jewellery", offer: "UP TO 30% OFF", image: require("../assets/images/latest3.png") },
      { id: "kr2-4", title: "Audio", offer: "UP TO 70% OFF", image: require("../assets/images/product2.png") },
    ],
  },
  {
    id: "kr3",
    title: "ACCESSORIES TO IMPRESS",
    items: [
      { id: "kr3-1", title: "Tees", offer: "MIN. 55% OFF", image: require("../assets/images/latest4.png") },
      { id: "kr3-2", title: "Shirts", offer: "MIN. 50% OFF", image: require("../assets/images/look2.png") },
      { id: "kr3-3", title: "Jeans", offer: "UNDER 1199", image: require("../assets/images/product4.png") },
      { id: "kr3-4", title: "Jackets", offer: "40-60% OFF", image: require("../assets/images/product6.png") },
    ],
  },
];

const accessoriesHeroDeals: AccessoriesHeroDeal[] = [
  {
    id: "ad1",
    title: OTHER_ACCESSORIES_DEAL_TITLES.ad1,
    brand: "Pins & bands",
    subtitle: "Clips, ties & more",
    offer: "Shop",
    image: require("../assets/images/latest1.png"),
  },
  {
    id: "ad2",
    title: OTHER_ACCESSORIES_DEAL_TITLES.ad2,
    brand: "Statement pins",
    subtitle: "Coats & drapes",
    offer: "Shop",
    image: require("../assets/images/latest3.png"),
  },
  {
    id: "ad3",
    title: OTHER_ACCESSORIES_DEAL_TITLES.ad3,
    brand: "Formal finish",
    subtitle: "Shirts & suits",
    offer: "Shop",
    image: require("../assets/images/product6.png"),
  },
  {
    id: "ad4",
    title: OTHER_ACCESSORIES_DEAL_TITLES.ad4,
    brand: "Soft layers",
    subtitle: "Wraps & stoles",
    offer: "Shop",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "ad5",
    title: OTHER_ACCESSORIES_DEAL_TITLES.ad5,
    brand: "Warm accents",
    subtitle: "Cold-weather",
    offer: "Shop",
    image: require("../assets/images/look4.png"),
  },
];

const accessoriesRelatedCategoryImagesFallback: Record<string, any> = {
  "Hair Accessories": require("../assets/images/latest1.png"),
  Brooches: require("../assets/images/latest3.png"),
  Cufflinks: require("../assets/images/product6.png"),
  Scarves: require("../assets/images/look3.png"),
  Mufflers: require("../assets/images/look4.png"),
};

function womanYouAreCardEnterOpacityTranslate(reveal: Animated.Value, index: number) {
  const start = 0.26 + index * 0.068;
  const end = Math.min(start + 0.24, 0.99);
  return {
    opacity: reveal.interpolate({
      inputRange: [0, start, end, 1],
      outputRange: [0, 0, 1, 1],
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateY: reveal.interpolate({
          inputRange: [0, start, end, 1],
          outputRange: [36, 36, 0, 0],
          extrapolate: "clamp",
        }),
      },
    ],
  };
}

function womanYouAreCardEnterScale(reveal: Animated.Value, index: number) {
  const start = 0.26 + index * 0.068;
  const end = Math.min(start + 0.24, 0.99);
  return {
    transform: [
      {
        scale: reveal.interpolate({
          inputRange: [0, start, end, 1],
          outputRange: [0.92, 0.92, 1, 1],
          extrapolate: "clamp",
        }),
      },
    ],
  };
}

/** Reel-style: scale + opacity follow horizontal scroll (focused card near viewport center). */
const WOMAN_YOU_ARE_CAROUSEL_PAD_LEFT = 0;
const WOMAN_YOU_ARE_CAROUSEL_PAD_RIGHT = 0;

function getWomanYouAreCarouselScrollMetrics(
  viewportW: number,
  cardWidth: number,
  gap: number,
  itemCount: number
) {
  const padL = WOMAN_YOU_ARE_CAROUSEL_PAD_LEFT;
  const padR = WOMAN_YOU_ARE_CAROUSEL_PAD_RIGHT;
  const contentW = padL + itemCount * cardWidth + (itemCount - 1) * gap + padR;
  const maxX = Math.max(0, Math.round(contentW - viewportW));
  const midIdx = (itemCount - 1) / 2;
  const stride = cardWidth + gap;
  const centerX = Math.max(
    0,
    Math.min(Math.round(padL + midIdx * stride + cardWidth / 2 - viewportW / 2), maxX)
  );
  return { contentW, maxX, centerX };
}

/** Ensures lo < peak < hi so Animated interpolation inputRange is strictly increasing. */
function womanYouAreScrollFocusInputRange(
  index: number,
  cardWidth: number,
  gap: number,
  viewportW: number,
  maxScrollX: number
): { lo: number; peak: number; hi: number } | null {
  if (maxScrollX <= 0 || viewportW <= 0) return null;

  const stride = cardWidth + gap;
  const rawPeak =
    WOMAN_YOU_ARE_CAROUSEL_PAD_LEFT + index * stride + cardWidth / 2 - viewportW / 2;
  const peak = Math.max(0, Math.min(Math.round(rawPeak), maxScrollX));
  const spread = Math.max(stride * 0.82, 56);

  let lo = peak - spread;
  let hi = peak + spread;

  if (lo >= peak) lo = peak - Math.max(spread, 48);
  if (hi <= peak) hi = peak + Math.max(spread, 48);

  if (lo >= peak || hi <= peak) return null;

  return { lo, peak, hi };
}

function womanYouAreCardScrollFocusScale(
  scrollX: Animated.Value,
  index: number,
  cardWidth: number,
  gap: number,
  viewportW: number,
  maxScrollX: number
) {
  const range = womanYouAreScrollFocusInputRange(
    index,
    cardWidth,
    gap,
    viewportW,
    maxScrollX
  );
  if (!range) {
    return {
      transform: [
        {
          scale: scrollX.interpolate({
            inputRange: [0, Math.max(maxScrollX, 1)],
            outputRange: [1.07, 1.07],
            extrapolate: "clamp",
          }),
        },
      ],
    };
  }
  const { lo, peak, hi } = range;
  return {
    transform: [
      {
        scale: scrollX.interpolate({
          inputRange: [lo, peak, hi],
          outputRange: [0.9, 1.07, 0.9],
          extrapolate: "clamp",
        }),
      },
    ],
  };
}

function womanYouAreCardScrollFocusOpacity(
  scrollX: Animated.Value,
  index: number,
  cardWidth: number,
  gap: number,
  viewportW: number,
  maxScrollX: number
) {
  const range = womanYouAreScrollFocusInputRange(
    index,
    cardWidth,
    gap,
    viewportW,
    maxScrollX
  );
  if (!range) {
    return {
      opacity: scrollX.interpolate({
        inputRange: [0, Math.max(maxScrollX, 1)],
        outputRange: [1, 1],
        extrapolate: "clamp",
      }),
    };
  }
  const { lo, peak, hi } = range;
  return {
    opacity: scrollX.interpolate({
      inputRange: [lo, peak, hi],
      outputRange: [0.82, 1, 0.82],
      extrapolate: "clamp",
    }),
  };
}

const spotlightFooterAdBanners: SpotlightFooterAdBanner[] = [
  {
    id: "fb1",
    image: require("../assets/images/latest1.png"),
    caption: "Bangles",
    title: "Limited-time accessory picks",
    subtitle: "Tap to explore the collection",
  },
  {
    id: "fb2",
    image: require("../assets/images/accessariescate.png"),
    caption: "Watches",
    title: "Statement timepieces",
    subtitle: "Curated straps & dials",
  },
  {
    id: "fb3",
    image: require("../assets/images/latest3.png"),
    caption: "Jewellery",
    title: "Sparkle for every occasion",
    subtitle: "Necklaces, rings & more",
  },
  {
    id: "fb4",
    image: require("../assets/images/accessoriescate.png"),
    caption: "New in",
    title: "Fresh drops this week",
    subtitle: "Discover accessories you will love",
  },
];

type WatchesShowcaseCard = {
  id: string;
  title: string;
  offer: string;
  brandsLine: string;
  image: any;
};

/**
 * Five distinct watch shopping lanes (wc1–wc5). Each lane has its own subcategory list below when selected.
 */
const watchesShowcaseCards: WatchesShowcaseCard[] = [
  {
    id: "wc1",
    title: "Men's Watches",
    offer: "UP TO 70% OFF",
    brandsLine: "Fastrack · Sonata",
    image: require("../assets/images/accessoriescate.png"),
  },
  {
    id: "wc2",
    title: "Women's Watches",
    offer: "UP TO 60% OFF",
    brandsLine: "Titan · Fossil",
    image: require("../assets/images/latest3.png"),
  },
  {
    id: "wc3",
    title: "Smartwatches",
    offer: "MIN. 50% OFF",
    brandsLine: "Noise · boAt",
    image: require("../assets/images/accessariescate.png"),
  },
  {
    id: "wc4",
    title: "Sports & Chronograph",
    offer: "UP TO 55% OFF",
    brandsLine: "Casio · G-Shock",
    image: require("../assets/images/sportscate.png"),
  },
  {
    id: "wc5",
    title: "Luxury & Dress",
    offer: "MIN. 40% OFF",
    brandsLine: "Premium dials",
    image: require("../assets/images/menwatch.png"),
  },
];

/** Subcategories shown only for the matching lane id (wc1–wc5). */
const watchesCardSubcategories: Record<string, string[]> = {
  wc1: ["Men analog", "Men digital", "Men chronograph", "Men leather strap"],
  wc2: ["Women analog", "Women rose gold", "Women minimal", "Women mesh band"],
  wc3: ["Fitness bands", "Activity tracking", "Heart rate", "Sleep tracking"],
  wc4: ["Sports dive", "Sports chronograph", "Sports rubber strap", "Sports water resist"],
  wc5: ["Luxury dress", "Luxury skeleton", "Luxury gold tone", "Luxury automatic"],
};

const watchesSubcategoryThumbImages: Record<string, any> = {
  "Men analog": require("../assets/images/accessoriescate.png"),
  "Men digital": require("../assets/images/accessariescate.png"),
  "Men chronograph": require("../assets/images/menwatch.png"),
  "Men leather strap": require("../assets/images/product6.png"),
  "Women analog": require("../assets/images/latest3.png"),
  "Women rose gold": require("../assets/images/latest4.png"),
  "Women minimal": require("../assets/images/latest1.png"),
  "Women mesh band": require("../assets/images/latest2.png"),
  "Fitness bands": require("../assets/images/accessariescate.png"),
  "Activity tracking": require("../assets/images/product2.png"),
  "Heart rate": require("../assets/images/menwatch.png"),
  "Sleep tracking": require("../assets/images/sportscate.png"),
  "Sports dive": require("../assets/images/sportscate.png"),
  "Sports chronograph": require("../assets/images/accessoriescate.png"),
  "Sports rubber strap": require("../assets/images/look2.png"),
  "Sports water resist": require("../assets/images/look4.png"),
  "Luxury dress": require("../assets/images/latest3.png"),
  "Luxury skeleton": require("../assets/images/accessoriescate.png"),
  "Luxury gold tone": require("../assets/images/latest4.png"),
  "Luxury automatic": require("../assets/images/menwatch.png"),
};

const finalUniquePicks: CollectionItem[] = [
  {
    id: "fu1",
    title: "Party Clutches",
    subtitle: "Elegant evening essentials",
    tag: "Best Seller",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "fu2",
    title: "Dial & Bracelet",
    subtitle: "Statement watch combos",
    tag: "Editor Pick",
    image: require("../assets/images/accessoriescate.png"),
  },
  {
    id: "fu3",
    title: "Charm Layers",
    subtitle: "Minimal necklace stacks",
    tag: "New",
    image: require("../assets/images/latest4.png"),
  },
];

export default function Accessories() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string | string[] }>();
  const { width: windowWidth } = useWindowDimensions();
  const [topCollectionBannerAspectRatio, setTopCollectionBannerAspectRatio] = useState(16 / 9);
  const [spotlightBannerAspectRatio, setSpotlightBannerAspectRatio] = useState(2.2);
  const kidsAccessoryBoardCardWidth = Math.round(
    Math.min(118, Math.max(86, windowWidth * 0.24))
  );
  const [activeTopCategory, setActiveTopCategory] = useState("other_accessories");
  const [topCategoriesFromApi, setTopCategoriesFromApi] = useState<AccessoriesCategoryApi[]>([]);
  const [womenSectionY, setWomenSectionY] = useState(0);
  const [menSectionY, setMenSectionY] = useState(0);
  const [kidsYouAreSectionY, setKidsYouAreSectionY] = useState(0);
  const [everyoneSectionY, setEveryoneSectionY] = useState(0);
  const [collectionSectionY, setCollectionSectionY] = useState(0);
  const [splitShowcaseSectionY, setSplitShowcaseSectionY] = useState(0);
  const [watchesSectionY, setWatchesSectionY] = useState(0);
  const womenSectionYRef = useRef<number | null>(null);
  const menSectionYRef = useRef<number | null>(null);
  const kidsYouAreSectionYRef = useRef<number | null>(null);
  const everyoneSectionYRef = useRef<number | null>(null);
  const collectionSectionYRef = useRef<number | null>(null);
  const splitShowcaseSectionYRef = useRef<number | null>(null);
  const watchesSectionYRef = useRef<number | null>(null);
  const [selectedWomenItemId, setSelectedWomenItemId] = useState("w1");
  const [bagsSubcategoriesFromApi, setBagsSubcategoriesFromApi] = useState<BagsSubcategoryApi[]>(
    []
  );
  const [beltsCapsSubcategoriesFromApi, setBeltsCapsSubcategoriesFromApi] = useState<
    BagsSubcategoryApi[]
  >([]);
  const [jewellerySubcategoriesFromApi, setJewellerySubcategoriesFromApi] = useState<
    BagsSubcategoryApi[]
  >([]);
  const [otherAccessoriesSubcategoriesFromApi, setOtherAccessoriesSubcategoriesFromApi] = useState<
    BagsSubcategoryApi[]
  >([]);
  const [gadgetsSubcategoriesFromApi, setGadgetsSubcategoriesFromApi] = useState<BagsSubcategoryApi[]>(
    []
  );
  const [gadgetsCategoryNameFromApi, setGadgetsCategoryNameFromApi] = useState<string | null>(null);
  const [watchesSubcategoriesFromApi, setWatchesSubcategoriesFromApi] = useState<BagsSubcategoryApi[]>(
    []
  );
  const [selectedJewelleryCarouselIndex, setSelectedJewelleryCarouselIndex] = useState(0);
  const [selectedMenItemId, setSelectedMenItemId] = useState("m1");
  const [selectedAccessoriesDealId, setSelectedAccessoriesDealId] = useState("ad1");
  const [selectedKidsRelatedItemId, setSelectedKidsRelatedItemId] = useState(
    KIDS_RELATED_SECTION_ITEM_ID
  );
  const [selectedKidsAccessoryCategory, setSelectedKidsAccessoryCategory] = useState<string | null>(
    getDefaultKidsCategoryForLane(KIDS_RELATED_SECTION_ITEM_ID)
  );
  const scrollRef = useRef<ScrollView | null>(null);
  const scrolledToKidsFromParamRef = useRef(false);
  const footerAdScrollRef = useRef<ScrollView | null>(null);
  const footerAdIndexRef = useRef(0);
  const [footerAdIndex, setFooterAdIndex] = useState(0);
  const leftShowcaseScrollRef = useRef<ScrollView | null>(null);
  const leftShowcaseOffsetRef = useRef(0);
  const leftShowcaseContentHeightRef = useRef(0);
  const leftShowcaseViewportHeightRef = useRef(0);
  const [selectedGadgetsQuickLinkId, setSelectedGadgetsQuickLinkId] = useState("gq1");
  const [selectedWatchesShowcaseCardId, setSelectedWatchesShowcaseCardId] = useState("wc1");
  const categoryIdsByTopId = useMemo(() => {
    const resolved = {
      bags: BAGS_CATEGORY_ID_FALLBACK,
      belts_caps: BELTS_CAPS_CATEGORY_ID_FALLBACK,
      gadgets: GADGETS_CATEGORY_ID_FALLBACK,
      jewellery: JEWELLERY_CATEGORY_ID_FALLBACK,
      other_accessories: OTHER_ACCESSORIES_CATEGORY_ID_FALLBACK,
      watches: WATCHES_SUBCATEGORIES_CATEGORY_ID_FALLBACK,
    };

    for (const category of topCategoriesFromApi) {
      const topId = mapApiCategoryNameToTopCategoryId(category.categoryName);
      if (
        topId &&
        Object.prototype.hasOwnProperty.call(resolved, topId) &&
        Number.isFinite(category.id)
      ) {
        (resolved as Record<string, number>)[topId] = category.id;
      }
    }
    return resolved;
  }, [topCategoriesFromApi]);

  const topCategoriesResolved = useMemo<TopCategory[]>(() => {
    if (topCategoriesFromApi.length === 0) return topCategoriesFallback;

    const byTopId = new Map<string, AccessoriesCategoryApi>();
    for (const row of topCategoriesFromApi) {
      const topId = mapApiCategoryNameToTopCategoryId(row.categoryName);
      if (topId && !byTopId.has(topId)) byTopId.set(topId, row);
    }

    return topCategoriesFallback.map((fallback) => {
      const apiCategory = byTopId.get(fallback.id);
      if (!apiCategory) return fallback;

      const source = apiCategory.mobileImage?.trim()
        ? { uri: getSubcategoryTableImageUri(apiCategory.mobileImage.trim()) }
        : fallback.image;

      return {
        id: fallback.id,
        label: apiCategory.categoryName || fallback.label,
        image: source,
      };
    });
  }, [topCategoriesFromApi]);

  const watchesShowcaseCardsResolved = useMemo((): WatchesShowcaseCard[] => {
    if (watchesSubcategoriesFromApi.length > 0) {
      return watchesSubcategoriesFromApi.slice(0, 3).map((s, i) => ({
        id: `wc${i + 1}`,
        title: getSubcategoryDisplayName(s) || `Watch ${i + 1}`,
        offer: "UP TO 60% OFF",
        brandsLine: "Titan · Fossil · Fastrack",
        image: getSubcategoryImageSourceOrFallback(s, watchesShowcaseCards[i]?.image),
      }));
    }
    return watchesShowcaseCards;
  }, [watchesSubcategoriesFromApi]);

  const fetchSubcategoriesTable = useCallback(
    async (categoryId: number) => {
      const path = `/api/categories/${categoryId}/subcategories-table`;
      const { data } = await api.get<BagsSubcategoryTableRow[]>(path);
      return data;
    },
    []
  );

  const gadgetsQuickLinkSubcategoriesResolved = useMemo<Record<string, string[]>>(() => {
    if (gadgetsSubcategoriesFromApi.length === 0) return gadgetsQuickLinkSubcategories;
    return {
      gq1: getSubcategoriesForGadgetsQuickLink("gq1", gadgetsSubcategoriesFromApi)
        .map((s) => getSubcategoryDisplayName(s))
        .filter(Boolean),
      gq2: getSubcategoriesForGadgetsQuickLink("gq2", gadgetsSubcategoriesFromApi)
        .map((s) => getSubcategoryDisplayName(s))
        .filter(Boolean),
      gq3: getSubcategoriesForGadgetsQuickLink("gq3", gadgetsSubcategoriesFromApi)
        .map((s) => getSubcategoryDisplayName(s))
        .filter(Boolean),
      gq4: getSubcategoriesForGadgetsQuickLink("gq4", gadgetsSubcategoriesFromApi)
        .map((s) => getSubcategoryDisplayName(s))
        .filter(Boolean),
    };
  }, [gadgetsSubcategoriesFromApi]);

  const gadgetsSubcategoryImagesResolved = useMemo<Record<string, any>>(() => {
    const resolved = { ...gadgetsSubcategoryImages };
    gadgetsSubcategoriesFromApi.forEach((sub) => {
      const label = getSubcategoryDisplayName(sub);
      const filename = getSubcategoryImageFilename(sub);
      if (label && filename?.trim()) {
        resolved[label] = { uri: getSubcategoryTableImageUri(filename) };
      }
    });
    return resolved;
  }, [gadgetsSubcategoriesFromApi]);

  const selectedGadgetsQuickLinkLabel = useMemo(() => {
    if (selectedGadgetsQuickLinkId === "gq1" && gadgetsCategoryNameFromApi?.trim()) {
      return gadgetsCategoryNameFromApi.trim();
    }
    return (
      gadgetsAccessoryQuickLinks.find((l) => l.id === selectedGadgetsQuickLinkId)?.label ??
      "Gadgets accessories"
    );
  }, [selectedGadgetsQuickLinkId, gadgetsCategoryNameFromApi]);

  const onWatchShowcaseLanePress = useCallback((laneId: string) => {
    setSelectedWatchesShowcaseCardId(laneId);
  }, []);

  const sparkleFloat = useRef(new Animated.Value(0)).current;
  const tintPulse = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const heroStarOp1 = useRef(new Animated.Value(1)).current;
  const heroStarOp2 = useRef(new Animated.Value(1)).current;
  const heroStarOp3 = useRef(new Animated.Value(1)).current;
  const bottomAdPlayer = useVideoPlayer(require("../assets/images/Accessories.mp4"), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const womanYouAreReveal = useRef(new Animated.Value(0)).current;
  const womanYouAreCarouselScrollX = useRef(new Animated.Value(0)).current;
  const womanYouAreCarouselRef = useRef<ScrollView | null>(null);
  const [womanYouAreCarouselVw, setWomanYouAreCarouselVw] = useState(0);
  const womanYouAreCarouselLayoutRef = useRef({
    vw: 0,
    cardW: 0,
    gap: 14,
    n: womanYouAreCarouselItems.length,
  });
  const womanYouAreUserDraggingRef = useRef(false);
  const womanYouAreAutoScrollCancelledRef = useRef(false);
  const womanYouAreAutoScrollTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const womanYouAreResumeAutoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onWomanYouAreCarouselDragStart = useCallback(() => {
    womanYouAreUserDraggingRef.current = true;
    if (womanYouAreResumeAutoTimerRef.current) {
      clearTimeout(womanYouAreResumeAutoTimerRef.current);
      womanYouAreResumeAutoTimerRef.current = null;
    }
  }, []);

  const onWomanYouAreCarouselDragRelease = useCallback(() => {
    if (womanYouAreResumeAutoTimerRef.current) {
      clearTimeout(womanYouAreResumeAutoTimerRef.current);
    }
    womanYouAreResumeAutoTimerRef.current = setTimeout(() => {
      womanYouAreUserDraggingRef.current = false;
      womanYouAreResumeAutoTimerRef.current = null;
    }, 2800);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        scrolledToKidsFromParamRef.current = false;
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      womanYouAreAutoScrollCancelledRef.current = false;
      womanYouAreUserDraggingRef.current = false;
      if (womanYouAreResumeAutoTimerRef.current) {
        clearTimeout(womanYouAreResumeAutoTimerRef.current);
        womanYouAreResumeAutoTimerRef.current = null;
      }

      const clearWomanYouAreAutoScrollTimers = () => {
        womanYouAreAutoScrollTimeoutsRef.current.forEach(clearTimeout);
        womanYouAreAutoScrollTimeoutsRef.current = [];
      };

      const delay = (ms: number) =>
        new Promise<void>((resolve) => {
          const id = setTimeout(() => {
            womanYouAreAutoScrollTimeoutsRef.current =
              womanYouAreAutoScrollTimeoutsRef.current.filter((t) => t !== id);
            resolve();
          }, ms);
          womanYouAreAutoScrollTimeoutsRef.current.push(id);
        });

      womanYouAreReveal.setValue(0);

      const gap0 = 14;
      const n0 = womanYouAreCarouselItems.length;
      const cardW0 = Math.round(Math.min(172, windowWidth * 0.44));
      const vwGuess = Math.max(windowWidth - 60, 240);
      const { centerX: centerGuess, maxX: maxGuess } = getWomanYouAreCarouselScrollMetrics(
        vwGuess,
        cardW0,
        gap0,
        n0
      );
      const startX = maxGuess < 48 ? 0 : centerGuess;
      womanYouAreCarouselScrollX.setValue(startX);
      requestAnimationFrame(() => {
        const node = womanYouAreCarouselRef.current as ScrollView | null;
        node?.scrollTo({ x: startX, animated: false });
      });

      Animated.timing(womanYouAreReveal, {
        toValue: 1,
        duration: 1050,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const scrollAnimWait = 780;
      const dwellMs = 2600;

      const runAutoPan = async () => {
        await delay(1300);
        while (!womanYouAreAutoScrollCancelledRef.current) {
          const lay = womanYouAreCarouselLayoutRef.current;
          const vwU = lay.vw > 80 ? lay.vw : Math.max(windowWidth, 240);
          const cardWU =
            lay.cardW > 0 ? lay.cardW : Math.round(Math.min(172, windowWidth * 0.44));
          const { maxX, centerX } = getWomanYouAreCarouselScrollMetrics(
            vwU,
            cardWU,
            lay.gap,
            lay.n
          );

          if (maxX < 48) {
            await delay(700);
            continue;
          }

          const scrollToClamped = (x: number, animated: boolean) => {
            const xC = Math.max(0, Math.min(Math.round(x), maxX));
            const node = womanYouAreCarouselRef.current as ScrollView | null;
            node?.scrollTo({ x: xC, animated });
          };

          if (womanYouAreUserDraggingRef.current) {
            await delay(320);
            continue;
          }

          scrollToClamped(maxX, true);
          await delay(scrollAnimWait + dwellMs);
          if (womanYouAreAutoScrollCancelledRef.current) break;

          while (womanYouAreUserDraggingRef.current) {
            await delay(180);
          }

          scrollToClamped(centerX, true);
          await delay(scrollAnimWait + dwellMs);
          if (womanYouAreAutoScrollCancelledRef.current) break;

          while (womanYouAreUserDraggingRef.current) {
            await delay(180);
          }

          scrollToClamped(0, true);
          await delay(scrollAnimWait + dwellMs);
          if (womanYouAreAutoScrollCancelledRef.current) break;

          while (womanYouAreUserDraggingRef.current) {
            await delay(180);
          }

          scrollToClamped(centerX, true);
          await delay(scrollAnimWait + dwellMs);
        }
      };

      void runAutoPan();

      return () => {
        womanYouAreAutoScrollCancelledRef.current = true;
        clearWomanYouAreAutoScrollTimers();
        if (womanYouAreResumeAutoTimerRef.current) {
          clearTimeout(womanYouAreResumeAutoTimerRef.current);
          womanYouAreResumeAutoTimerRef.current = null;
        }
      };
    }, [womanYouAreReveal, womanYouAreCarouselScrollX, windowWidth])
  );

  useEffect(() => {
    const raw = params.focus;
    const focus = Array.isArray(raw) ? raw[0] : raw;
    if (focus !== "kids") {
      scrolledToKidsFromParamRef.current = false;
      return;
    }
    setActiveTopCategory("jewellery");
    const y = kidsYouAreSectionYRef.current ?? kidsYouAreSectionY;
    if (y <= 0 || scrolledToKidsFromParamRef.current) return;
    scrolledToKidsFromParamRef.current = true;
    requestAnimationFrame(() => {
      const targetY = kidsYouAreSectionYRef.current ?? kidsYouAreSectionY;
      scrollRef.current?.scrollTo({
        y: Math.max(targetY - 12, 0),
        animated: true,
      });
    });
  }, [params.focus, kidsYouAreSectionY]);

  useEffect(() => {
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleFloat, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const tintLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tintPulse, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(tintPulse, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const ctaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1.04,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    sparkleLoop.start();
    tintLoop.start();
    ctaLoop.start();

    return () => {
      sparkleLoop.stop();
      tintLoop.stop();
      ctaLoop.stop();
    };
  }, [ctaPulse, sparkleFloat, tintPulse]);

  useEffect(() => {
    const blinkLoop = (v: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 0.32,
            duration: 520,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 1,
            duration: 520,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(140),
        ])
      );

    const l1 = blinkLoop(heroStarOp1);
    const l2 = blinkLoop(heroStarOp2);
    const l3 = blinkLoop(heroStarOp3);
    const t1 = setTimeout(() => l1.start(), 0);
    const t2 = setTimeout(() => l2.start(), 280);
    const t3 = setTimeout(() => l3.start(), 560);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [heroStarOp1, heroStarOp2, heroStarOp3]);

  useEffect(() => {
    const timer = setInterval(() => {
      const viewHeight = leftShowcaseViewportHeightRef.current;
      const contentHeight = leftShowcaseContentHeightRef.current;
      const maxScroll = Math.max(contentHeight / 2, 0);

      if (!leftShowcaseScrollRef.current || maxScroll <= 0) return;

      const next = leftShowcaseOffsetRef.current + 0.9;
      leftShowcaseOffsetRef.current = next >= maxScroll ? 0 : next;
      leftShowcaseScrollRef.current.scrollTo({
        y: leftShowcaseOffsetRef.current,
        animated: false,
      });
    }, 30);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const laneCategories = kidsRelatedCategories[selectedKidsRelatedItemId] || [];
    if (laneCategories.length === 0) {
      setSelectedKidsAccessoryCategory(null);
      return;
    }
    if (!selectedKidsAccessoryCategory || !laneCategories.includes(selectedKidsAccessoryCategory)) {
      setSelectedKidsAccessoryCategory(laneCategories[0]);
    }
  }, [selectedKidsRelatedItemId, selectedKidsAccessoryCategory]);

  const spotlightFooterAdPageWidth = Math.max(windowWidth, 1);

  useEffect(() => {
    const n = spotlightFooterAdBanners.length;
    if (n <= 1) return;
    const t = setInterval(() => {
      const next = (footerAdIndexRef.current + 1) % n;
      footerAdIndexRef.current = next;
      setFooterAdIndex(next);
      footerAdScrollRef.current?.scrollTo({
        x: next * spotlightFooterAdPageWidth,
        animated: true,
      });
    }, 5000);
    return () => clearInterval(t);
  }, [spotlightFooterAdPageWidth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<AccessoriesCategoryApi[]>(
          ACCESSORIES_CATEGORIES_ENDPOINT
        );
        if (cancelled) return;
        setTopCategoriesFromApi(Array.isArray(data) ? data : []);
      } catch {
        try {
          const { data } = await api.get<AccessoriesCategoryApi[]>(
            `/api/categories/${ACCESSORIES_PARENT_CATEGORY_ID}/subcategories`
          );
          if (cancelled) return;
          setTopCategoriesFromApi(Array.isArray(data) ? data : []);
        } catch {
          if (!cancelled) setTopCategoriesFromApi([]);
        }
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
        const data = await fetchSubcategoriesTable(categoryIdsByTopId.bags);
        if (cancelled) return;
        setBagsSubcategoriesFromApi(getNormalizedRowSubcategories(data));
      } catch {
        if (!cancelled) setBagsSubcategoriesFromApi([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryIdsByTopId.bags, fetchSubcategoriesTable]);

  const bagsRelatedChips = useMemo(() => {
    const fromApi = getSubcategoriesForBagsCard(selectedWomenItemId, bagsSubcategoriesFromApi);
    if (fromApi.length > 0) {
      return fromApi.map((s) => {
        const label = getSubcategoryDisplayName(s);
        return {
          key: `bag-sub-${s.id}`,
          label,
          source: getSubcategoryImageSourceOrFallback(
            s,
            bagsRelatedCategoryImagesFallback[label] ??
              require("../assets/images/accessoriescate.png")
          ),
        };
      });
    }
    const fallback = bagsRelatedCategoriesFallback[selectedWomenItemId] ?? [];
    return fallback.map((label) => ({
      key: `bag-fb-${label}`,
      label,
      source:
        bagsRelatedCategoryImagesFallback[label] ?? require("../assets/images/accessoriescate.png"),
    }));
  }, [selectedWomenItemId, bagsSubcategoriesFromApi]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSubcategoriesTable(categoryIdsByTopId.belts_caps);
        if (cancelled) return;
        setBeltsCapsSubcategoriesFromApi(getNormalizedRowSubcategories(data));
      } catch {
        if (!cancelled) setBeltsCapsSubcategoriesFromApi([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryIdsByTopId.belts_caps, fetchSubcategoriesTable]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<BagsSubcategoryTableRow[]>(
          JEWELLERY_SUBCATEGORIES_TABLE_ENDPOINT,
          { withCredentials: false }
        );
        if (cancelled) return;
        setJewellerySubcategoriesFromApi(getNormalizedRowSubcategories(data));
      } catch {
        try {
          const data = await fetchSubcategoriesTable(categoryIdsByTopId.jewellery);
          if (cancelled) return;
          setJewellerySubcategoriesFromApi(getNormalizedRowSubcategories(data));
        } catch {
          if (!cancelled) setJewellerySubcategoriesFromApi([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryIdsByTopId.jewellery, fetchSubcategoriesTable]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<BagsSubcategoryTableRow[]>(
          OTHER_ACCESSORIES_SUBCATEGORIES_TABLE_ENDPOINT,
          { withCredentials: false }
        );
        if (cancelled) return;
        setOtherAccessoriesSubcategoriesFromApi(getNormalizedRowSubcategories(data));
      } catch {
        try {
          const data = await fetchSubcategoriesTable(categoryIdsByTopId.other_accessories);
          if (cancelled) return;
          setOtherAccessoriesSubcategoriesFromApi(getNormalizedRowSubcategories(data));
        } catch {
          if (!cancelled) setOtherAccessoriesSubcategoriesFromApi([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryIdsByTopId.other_accessories, fetchSubcategoriesTable]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSubcategoriesTable(categoryIdsByTopId.gadgets);
        if (cancelled) return;
        const first = Array.isArray(data) ? data[0] : undefined;
        setGadgetsCategoryNameFromApi(first?.categoryName ?? null);
        setGadgetsSubcategoriesFromApi(getNormalizedRowSubcategories(data));
      } catch {
        if (!cancelled) {
          setGadgetsCategoryNameFromApi(null);
          setGadgetsSubcategoriesFromApi([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryIdsByTopId.gadgets, fetchSubcategoriesTable]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<BagsSubcategoryTableRow[]>(
          WATCHES_SUBCATEGORIES_TABLE_ENDPOINT,
          { withCredentials: false }
        );
        if (cancelled) return;
        setWatchesSubcategoriesFromApi(getNormalizedRowSubcategories(data));
      } catch {
        try {
          const data = await fetchSubcategoriesTable(categoryIdsByTopId.watches);
          if (cancelled) return;
          setWatchesSubcategoriesFromApi(getNormalizedRowSubcategories(data));
        } catch {
          if (!cancelled) setWatchesSubcategoriesFromApi([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryIdsByTopId.watches, fetchSubcategoriesTable]);

  useEffect(() => {
    if (watchesSubcategoriesFromApi.length === 0) return;
    const n = Math.min(watchesSubcategoriesFromApi.length, 3);
    const valid = new Set(Array.from({ length: n }, (_, i) => `wc${i + 1}`));
    if (!valid.has(selectedWatchesShowcaseCardId)) {
      setSelectedWatchesShowcaseCardId("wc1");
    }
  }, [watchesSubcategoriesFromApi, selectedWatchesShowcaseCardId]);

  const beltsCapsRelatedChips = useMemo(() => {
    const fromApi = getSubcategoriesForBeltsCapsCard(selectedMenItemId, beltsCapsSubcategoriesFromApi);
    if (fromApi.length > 0) {
      return fromApi.map((s) => {
        const label = getSubcategoryDisplayName(s);
        return {
          key: `belts-caps-sub-${s.id}`,
          label,
          source: getSubcategoryImageSourceOrFallback(
            s,
            menRelatedCategoryImagesFallback[label] ??
              require("../assets/images/accessoriescate.png")
          ),
        };
      });
    }
    const fallback = menRelatedCategoriesFallback[selectedMenItemId] ?? [];
    return fallback.map((label) => ({
      key: `belts-caps-fb-${label}`,
      label,
      source:
        menRelatedCategoryImagesFallback[label] ?? require("../assets/images/accessoriescate.png"),
    }));
  }, [selectedMenItemId, beltsCapsSubcategoriesFromApi]);

  const jewelleryRelatedChips = useMemo(() => {
    const fromApi = getSubcategoriesForJewelleryCarouselIndex(
      selectedJewelleryCarouselIndex,
      jewellerySubcategoriesFromApi
    );
    if (fromApi.length > 0) {
      return fromApi.map((s) => {
        const label = getSubcategoryDisplayName(s);
        return {
          key: `jewellery-sub-${s.id}`,
          label,
          source: getSubcategoryImageSourceOrFallback(
            s,
            jewelleryCarouselFallbackImages[label] ?? require("../assets/images/latest3.png")
          ),
        };
      });
    }
    const fallback =
      jewelleryCarouselFallbackCategories[selectedJewelleryCarouselIndex] ?? [];
    return fallback.map((label) => ({
      key: `jewellery-fb-${selectedJewelleryCarouselIndex}-${label}`,
      label,
      source:
        jewelleryCarouselFallbackImages[label] ?? require("../assets/images/latest3.png"),
    }));
  }, [selectedJewelleryCarouselIndex, jewellerySubcategoriesFromApi]);

  const otherAccessoriesRelatedChips = useMemo(() => {
    const fromApi = getOtherAccessoriesSubcategoriesForSelectedDeal(
      selectedAccessoriesDealId,
      otherAccessoriesSubcategoriesFromApi
    );
    if (fromApi.length > 0) {
      return fromApi.map((s) => {
        const label = getSubcategoryDisplayName(s);
        return {
          key: `other-acc-sub-${s.id}`,
          label,
          source: getSubcategoryImageSourceOrFallback(
            s,
            accessoriesRelatedCategoryImagesFallback[label] ??
              require("../assets/images/accessariescate.png")
          ),
        };
      });
    }
    const label = OTHER_ACCESSORIES_DEAL_TITLES[selectedAccessoriesDealId];
    if (!label) return [];
    return [
      {
        key: `other-acc-fb-${selectedAccessoriesDealId}`,
        label,
        source:
          accessoriesRelatedCategoryImagesFallback[label] ??
          require("../assets/images/accessariescate.png"),
      },
    ];
  }, [selectedAccessoriesDealId, otherAccessoriesSubcategoriesFromApi]);

  const handleWomenItemPress = (itemId: string) => {
    setSelectedWomenItemId(itemId);
  };

  const handleMenItemPress = (itemId: string) => {
    setSelectedMenItemId(itemId);
  };

  const handleAccessoriesDealPress = (dealId: string) => {
    setSelectedAccessoriesDealId(dealId);
  };

  const onFooterAdMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / spotlightFooterAdPageWidth);
    const clamped = Math.max(0, Math.min(idx, spotlightFooterAdBanners.length - 1));
    footerAdIndexRef.current = clamped;
    setFooterAdIndex(clamped);
  };

  const womanYouAreCardWidth = Math.round(Math.min(172, windowWidth * 0.44));
  const womanYouAreCardGap = 14;
  const womanYouAreMid = (womanYouAreCarouselItems.length - 1) / 2;
  const womanYouAreMaxCardH = Math.min(300, Math.round(windowWidth * 0.82));
  const womanYouAreMinCardH = Math.round(womanYouAreMaxCardH * 0.64);
  const womanYouAreHeightStep =
    womanYouAreMid > 0
      ? (womanYouAreMaxCardH - womanYouAreMinCardH) / womanYouAreMid
      : 0;
  const getWomanYouAreCardHeight = (index: number) => {
    const dist = Math.abs(index - womanYouAreMid);
    return Math.round(womanYouAreMaxCardH - dist * womanYouAreHeightStep);
  };

  const womanYouAreSectionAnim = {
    opacity: womanYouAreReveal.interpolate({
      inputRange: [0, 0.1, 0.28],
      outputRange: [0, 0.75, 1],
      extrapolate: "clamp",
    }),
  };

  const womanYouAreHeaderAnim = {
    opacity: womanYouAreReveal.interpolate({
      inputRange: [0, 0.16, 0.4],
      outputRange: [0, 0, 1],
      extrapolate: "clamp",
    }),
    transform: [
      {
        translateY: womanYouAreReveal.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  const womanYouAreCarouselViewportW = Math.max(
    womanYouAreCarouselVw > 80 ? womanYouAreCarouselVw : windowWidth,
    200
  );

  womanYouAreCarouselLayoutRef.current = {
    vw: womanYouAreCarouselViewportW,
    cardW: womanYouAreCardWidth,
    gap: womanYouAreCardGap,
    n: womanYouAreCarouselItems.length,
  };

  const womanYouAreCarouselMaxX = getWomanYouAreCarouselScrollMetrics(
    womanYouAreCarouselViewportW,
    womanYouAreCardWidth,
    womanYouAreCardGap,
    womanYouAreCarouselItems.length
  ).maxX;

  const womanYouAreCarouselOnScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: womanYouAreCarouselScrollX } } }],
    { useNativeDriver: true }
  );

  return (
    <View style={styles.container}>
      <View style={styles.topFixedArea}>
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.headerBrandLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#9aa0a6" />
            <TextInput
              placeholder="Search.."
              placeholderTextColor="#b0b5ba"
              style={styles.searchInput}
            />
            <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="camera-outline" size={20} color="#9aa0a6" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="bag-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
          </View>
        </View>

        <ImageBackground
          source={require("../assets/images/latest1.png")}
          style={styles.topStrip}
          imageStyle={styles.topStripBgImage}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topStripContent}
          >
            {topCategoriesResolved.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.topCategoryItem}
                hitSlop={{ top: 8, bottom: 10, left: 8, right: 8 }}
                onPress={() => {
                  setActiveTopCategory(item.id);
                  const scrollToSectionY = (y: number) => {
                    requestAnimationFrame(() => {
                      scrollRef.current?.scrollTo({
                        y: Math.max(y - 12, 0),
                        animated: true,
                      });
                    });
                  };
                  if (item.id === "bags") {
                    scrollToSectionY(womenSectionYRef.current ?? womenSectionY);
                  } else if (item.id === "belts_caps") {
                    scrollToSectionY(menSectionYRef.current ?? menSectionY);
                  } else if (item.id === "gadgets") {
                    scrollToSectionY(
                      splitShowcaseSectionYRef.current ?? splitShowcaseSectionY
                    );
                  } else if (item.id === "jewellery") {
                    scrollToSectionY(
                      kidsYouAreSectionYRef.current ?? kidsYouAreSectionY
                    );
                  } else if (item.id === "other_accessories") {
                    setSelectedKidsRelatedItemId(KIDS_RELATED_SECTION_ITEM_ID);
                    setSelectedKidsAccessoryCategory(
                      getDefaultKidsCategoryForLane(KIDS_RELATED_SECTION_ITEM_ID)
                    );
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        scrollToSectionY(
                          everyoneSectionYRef.current ?? everyoneSectionY
                        );
                      });
                    });
                  } else if (item.id === "watches") {
                    scrollToSectionY(
                      watchesSectionYRef.current ?? watchesSectionY
                    );
                  }
                }}
              >
                <View style={styles.topCategoryColumn}>
                  <View
                    style={[
                      styles.topCategoryMediaFrame,
                      activeTopCategory === item.id && styles.topCategoryMediaFrameActive,
                    ]}
                  >
                    <Image source={item.image} style={styles.topCategoryImage} resizeMode="cover" />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.topCategoryText,
                      activeTopCategory === item.id && styles.topCategoryTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.topCategoryActiveBar,
                      activeTopCategory === item.id && styles.topCategoryActiveBarOn,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ImageBackground>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        removeClippedSubviews={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSection}>
          <Image
            source={require("../assets/images/accessariescates.png")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <Animated.View
            style={[
              styles.heroTint,
              {
                opacity: tintPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.42, 0.2],
                }),
              },
            ]}
          />
          <View style={styles.heroStarCluster} pointerEvents="none">
            <Animated.View
              style={[
                styles.heroStarNode,
                styles.heroStarNodeA,
                {
                  opacity: heroStarOp1,
                  transform: [
                    {
                      scale: heroStarOp1.interpolate({
                        inputRange: [0.32, 1],
                        outputRange: [0.9, 1.12],
                      }),
                    },
                    { rotate: "-16deg" },
                  ],
                },
              ]}
            >
              <Ionicons name="star" size={34} color="#FFD700" />
            </Animated.View>
            <Animated.View
              style={[
                styles.heroStarNode,
                styles.heroStarNodeB,
                {
                  opacity: heroStarOp2,
                  transform: [
                    {
                      scale: heroStarOp2.interpolate({
                        inputRange: [0.32, 1],
                        outputRange: [0.92, 1.08],
                      }),
                    },
                    { rotate: "6deg" },
                  ],
                },
              ]}
            >
              <Ionicons name="star" size={26} color="#FFC82C" />
            </Animated.View>
            <Animated.View
              style={[
                styles.heroStarNode,
                styles.heroStarNodeC,
                {
                  opacity: heroStarOp3,
                  transform: [
                    {
                      scale: heroStarOp3.interpolate({
                        inputRange: [0.32, 1],
                        outputRange: [0.88, 1.06],
                      }),
                    },
                    { rotate: "18deg" },
                  ],
                },
              ]}
            >
              <Ionicons name="star" size={18} color="#FFE566" />
            </Animated.View>
          </View>
          <Animated.View
            style={[
              styles.heroBadgeRow,
              {
                transform: [
                  {
                    translateY: sparkleFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles-outline" size={12} color="#1d324e" />
              <Text style={styles.heroBadgeText}>Festive Picks</Text>
            </View>
           



          </Animated.View>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTopNote}>ACCESSORIES GIFTING GUIDE</Text>
            {/* <Text style={styles.heroTitle}>UNWRAP JOY</Text>
            <Text style={styles.heroTitle}>WITH EVERY GIFT</Text> */}
            <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
              <TouchableOpacity style={styles.heroButton}>
                <Text style={styles.heroButtonText}>Shop Festive</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.glamSection}>
          <View style={styles.glamHeadingRow}>
            <Ionicons name="sparkles" size={14} color="#ef7b1a" />
            <Text style={styles.glamHeadingLabel}>FESTIVE EDIT</Text>
            <Ionicons name="sparkles" size={14} color="#ef7b1a" />
          </View>
          <Text style={styles.glamSubtitle}>
            Festivities, but make it <Text style={styles.glamSubtitleHighlight}>stylish</Text>
          </Text>
        </View>

        <View style={styles.tileSection}>
          <View style={styles.tileRow}>
            <TouchableOpacity style={[styles.tileCard, styles.leftTile]} activeOpacity={0.9}>
              <View style={styles.tileTextContent}>
                <View style={styles.tileBadge}>
                  <Text style={styles.tileBadgeText}>HOME GLOW</Text>
                </View>
                <Text style={styles.tileHeading}>Light up Home</Text>
                <Text style={styles.tileSubHeading}>
                  Warm lamps and festive decor picks
                </Text>
              </View>
              <View style={styles.tileImageWrap}>
                <Image
                  source={require("../assets/images/homecate.png")}
                  style={styles.tileImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tileCard, styles.rightTile]} activeOpacity={0.9}>
              <View style={styles.tileTextContent}>
                <View style={styles.tileBadge}>
                  <Text style={styles.tileBadgeText}>STYLE DROP</Text>
                </View>
                <Text style={styles.tileHeading}>Festive Glam</Text>
                <Text style={styles.tileSubHeading}>
                  Statement accessories for celebrations
                </Text>
              </View>
              <View style={styles.tileImageWrap}>
                <Image
                  source={require("../assets/images/accessoriescate.png")}
                  style={styles.tileImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View
          collapsable={false}
          style={styles.collectionSection}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            collectionSectionYRef.current = y;
            setCollectionSectionY(y);
          }}
        >
          <View style={styles.collectionHeader}>
            <View style={styles.collectionHeaderContent}>
              
              <View style={styles.collectionTitleAccentWrap}>
                
                <View style={styles.collectionTitleRow}>
                  <View style={styles.collectionTitleBar} />
                  <Text style={styles.collectionTitle}>Top Collection</Text>
                </View>
              </View>
              <Text style={styles.collectionSubtitle}>Accessories you will love</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.collectionViewAll}
              onPress={() =>
                router.push({
                  pathname: "/subcatProducts",
                  params: {
                    mainCat: "accessories",
                    subCategory: "Top Collection",
                  },
                })
              }
            >
              <Text style={styles.collectionViewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <Pressable
            style={[styles.collectionFeaturedCard, { aspectRatio: topCollectionBannerAspectRatio }]}
            onPress={() => router.push("/productdetail")}
          >
            {({ hovered, pressed }) => {
              const showOverlay = hovered || pressed;

              return (
                <>
                  <Image
                    source={topCollectionItems[0].image}
                    style={styles.collectionFeaturedImage}
                    resizeMode="contain"
                    onLoad={(e) => {
                      const { width, height } = e.nativeEvent.source;
                      if (
                        typeof width === "number" &&
                        typeof height === "number" &&
                        height > 0
                      ) {
                        setTopCollectionBannerAspectRatio(width / height);
                      }
                    }}
                  />
                  <View style={styles.collectionFeaturedTag}>
                    <Text style={styles.collectionFeaturedTagText}>{topCollectionItems[0].tag}</Text>
                  </View>
                  <View
                    style={[
                      styles.collectionFeaturedOverlay,
                      showOverlay
                        ? styles.collectionFeaturedOverlayVisible
                        : styles.collectionFeaturedOverlayHidden,
                    ]}
                  >
                    <Text style={styles.collectionFeaturedTitle} numberOfLines={1}>
                      {topCollectionItems[0].title}
                    </Text>
                    <Text style={styles.collectionFeaturedSubtitle} numberOfLines={1}>
                      {topCollectionItems[0].subtitle}
                    </Text>
                  </View>
                </>
              );
            }}
          </Pressable>

          <View style={styles.collectionMiniGrid}>
            {topCollectionItems.slice(1).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.collectionMiniCard}
                activeOpacity={0.9}
                onPress={() => router.push("/productdetail")}
              >
                <Image source={item.image} style={styles.collectionMiniImage} resizeMode="cover" />
                <View style={styles.collectionMiniTag}>
                  <Text style={styles.collectionMiniTagText}>{item.tag}</Text>
                </View>
                <View style={styles.collectionMiniOverlay}>
                  <Text style={styles.collectionMiniTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.collectionMiniSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.videoAdSection}>
          <View style={styles.spotlightHeaderCard}>
            <View style={styles.spotlightHeaderTitleRow}>
              <Ionicons name="star" size={16} color="#ef7b1a" />
              <Text style={styles.spotlightHeaderTitle}>Accessories Spotlight</Text>
              <Ionicons name="star" size={16} color="#ef7b1a" />
              {/* <Text style={styles.spotlightHeaderSubtitle}>Exclusive festive ad</Text> */}
            </View>
          </View>
          <Pressable
            style={[
              styles.videoAdCard,
              styles.videoAdCardSpotlight,
              { aspectRatio: spotlightBannerAspectRatio },
            ]}
            onPress={() => router.push("/productdetail")}
          >
            {({ hovered, pressed }) => {
              const showOverlay = hovered || pressed;
              return (
                <>
                  <Image
                    source={require("../assets/images/applicationbanner.png")}
                    style={styles.videoAdPlayer}
                    resizeMode="contain"
                    onLoad={(e) => {
                      const { width, height } = e.nativeEvent.source;
                      if (
                        typeof width === "number" &&
                        typeof height === "number" &&
                        height > 0
                      ) {
                        setSpotlightBannerAspectRatio(width / height);
                      }
                    }}
                  />
                  <View
                    style={[
                      styles.videoAdOverlay,
                      showOverlay
                        ? styles.collectionFeaturedOverlayVisible
                        : styles.collectionFeaturedOverlayHidden,
                    ]}
                  >
                    <Text style={styles.videoAdOverlayTitle}>
                      Style the Season with Accessories
                    </Text>
                    <View style={styles.videoAdButton} accessibilityRole="button">
                      <Text style={styles.videoAdButtonText}>Shop the look</Text>
                    </View>
                  </View>
                </>
              );
            }}
          </Pressable>
        </View>

        <View
          collapsable={false}
          style={styles.womenSection}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            womenSectionYRef.current = y;
            setWomenSectionY(y);
          }}
        >
          <View style={styles.womenHeader}>
            <View style={styles.womenTitleWrap}>
              <View style={styles.womenTitleRow}>
                <Ionicons name="sparkles" size={14} color="#ef7b1a" />
                <Text style={styles.womenTitleWord}>Bags</Text>
              </View>
              <View style={styles.womenTitleUnderline} />
              <Text style={styles.womenSubtitle}>Handbags, totes & everyday style</Text>
            </View>
            <TouchableOpacity
              style={styles.womenViewAll}
              onPress={() => router.push("/productdetail")}
            >
              <Text style={styles.womenViewAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.womenGrid}>
            <TouchableOpacity
              style={styles.womenFeaturedCard}
              activeOpacity={0.9}
              onPress={() => handleWomenItemPress(womenAccessoriesItems[0].id)}
            >
              <Image
                source={womenAccessoriesItems[0].image}
                style={styles.womenCardImage}
                resizeMode="cover"
              />
              <View style={styles.womenCardOverlay}>
                <Text style={styles.womenCardTitle} numberOfLines={1}>
                  {womenAccessoriesItems[0].title}
                </Text>
                <Text style={styles.womenCardSubtitle} numberOfLines={1}>
                  {womenAccessoriesItems[0].subtitle}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.womenSideColumn}>
              <TouchableOpacity
                style={styles.womenSideCard}
                activeOpacity={0.9}
                onPress={() => handleWomenItemPress(womenAccessoriesItems[1].id)}
              >
                <Image
                  source={womenAccessoriesItems[1].image}
                  style={styles.womenCardImage}
                  resizeMode="contain"
                />
                <View style={styles.womenCardOverlay}>
                  <Text style={styles.womenCardTitle} numberOfLines={1}>
                    {womenAccessoriesItems[1].title}
                  </Text>
                  <Text style={styles.womenCardSubtitle} numberOfLines={1}>
                    {womenAccessoriesItems[1].subtitle}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.womenSideCard}
                activeOpacity={0.9}
                onPress={() => handleWomenItemPress(womenAccessoriesItems[2].id)}
              >
                <Image
                  source={womenAccessoriesItems[2].image}
                  style={styles.womenCardImage}
                  resizeMode="contain"
                />
                <View style={styles.womenCardOverlay}>
                  <Text style={styles.womenCardTitle} numberOfLines={1}>
                    {womenAccessoriesItems[2].title}
                  </Text>
                  <Text style={styles.womenCardSubtitle} numberOfLines={1}>
                    {womenAccessoriesItems[2].subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.womenBottomCard}
            activeOpacity={0.9}
            onPress={() => handleWomenItemPress(womenAccessoriesItems[3].id)}
          >
            <Image
              source={womenAccessoriesItems[3].image}
              style={styles.womenCardImage}
              resizeMode="cover"
            />
            <View style={styles.womenCardOverlay}>
              <Text style={styles.womenCardTitle} numberOfLines={1}>
                {womenAccessoriesItems[3].title}
              </Text>
              <Text style={[styles.womenCardSubtitle, styles.womenCardSubtitleRight]} numberOfLines={1}>
                {womenAccessoriesItems[3].subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.womenRelatedSection}>
          <View style={styles.womenRelatedTitleRow}>
            <Ionicons name="sparkles" size={14} color="#ef7b1a" />
            <Text style={styles.womenRelatedTitle}>
              Related categories for{" "}
              {womenAccessoriesItems.find((item) => item.id === selectedWomenItemId)?.title ??
                "Bags"}
            </Text>
          </View>
          <View style={styles.womenRelatedTitleUnderline} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.womenRelatedChips}
          >
            {bagsRelatedChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={styles.womenRelatedChip}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.womenRelatedImageWrap}>
                  <Image
                    source={chip.source}
                    style={styles.womenRelatedImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.womenRelatedChipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.styleLabSection}>
          <View style={styles.styleLabHeader}>
            <View>
              <Text style={styles.styleLabTitle}>Accessory Style Lab</Text>
              <Text style={styles.styleLabSubtitle}>Create your signature look</Text>
            </View>
            <TouchableOpacity
              style={styles.styleLabBtn}
              onPress={() => router.push("/productdetail")}
            >
              <Text style={styles.styleLabBtnText}>Try now</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.styleLabCardsRow}
          >
            {styleLabItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.styleLabFeatureCard}
                activeOpacity={0.9}
                onPress={() => router.push("/productdetail")}
              >
                <Image source={item.image} style={styles.styleLabFeatureImage} resizeMode="cover" />
                <View style={styles.styleLabFeatureOverlay}>
                  <View style={styles.styleLabTag}>
                    <Text style={styles.styleLabTagText}>{item.tag}</Text>
                  </View>
                  <Text style={styles.styleLabCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.styleLabCardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
                <View style={styles.styleLabArrowBadge}>
                  <Ionicons name="arrow-forward" size={14} color="#1d324e" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.videoAdSection}>
          <View style={styles.videoAdHeader}>
            <View style={styles.styleLabAdHeadingCard}>
              <View style={styles.styleLabAdHeadingIconWrap}>
                <Ionicons name="color-wand" size={22} color="#ef7b1a" />
              </View>
              <View style={styles.styleLabAdHeadingTextCol}>
                <View style={styles.styleLabAdHeadingTitleRow}>
                  <Text style={styles.styleLabAdHeadingTitle}>
                    <Text style={styles.styleLabAdHeadingTitleLead}>Style </Text>
                    <Text style={styles.styleLabAdHeadingTitleAccent}>Lab</Text>
                  </Text>
                  <View style={styles.styleLabAdHeadingAdMark}>
                    <Text style={styles.styleLabAdHeadingAdMarkText}>Ad</Text>
                  </View>
                </View>
                <Text style={styles.styleLabAdHeadingSub}>Watch and shop accessories</Text>
              </View>
            </View>
          </View>
          <View style={[styles.videoAdCard, styles.videoAdCardFixedHeight]}>
            <VideoView
              player={bottomAdPlayer}
              style={styles.videoAdPlayer}
              nativeControls={false}
              contentFit="cover"
            />
            <View style={styles.videoAdOverlay}>
              <Text style={styles.videoAdOverlayTitle}>Discover your next signature style</Text>
              <TouchableOpacity
                style={styles.videoAdButton}
                onPress={() => router.push("/productdetail")}
              >
                <Text style={styles.videoAdButtonText}>Shop now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View
          collapsable={false}
          style={styles.menSection}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            menSectionYRef.current = y;
            setMenSectionY(y);
          }}
        >
          <View style={styles.menHeader}>
            <View style={styles.menTitleWrap}>
              <View style={styles.menTitleRow}>
                <Ionicons name="sparkles" size={14} color="#ef7b1a" />
                <Text style={styles.menTitle}>Belts & Caps</Text>
              </View>
              <View style={styles.menTitleUnderline} />
              <Text style={styles.menSubtitle}>Leather belts, buckles & headwear</Text>
            </View>
            <TouchableOpacity
              style={styles.menViewAll}
              onPress={() => router.push("/productdetail")}
            >
              <Text style={styles.menViewAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menCardsRow}
          >
            {menAccessoriesItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menCard}
                activeOpacity={0.9}
                onPress={() => handleMenItemPress(item.id)}
              >
                <Image source={item.image} style={styles.menCardImage} resizeMode="contain" />
                <View style={styles.menCardOverlay}>
                  <Text style={styles.menCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.menCardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menRelatedSection}>
          <View style={styles.menRelatedTitleRow}>
            <Ionicons name="sparkles" size={14} color="#ef7b1a" />
            <Text style={styles.menRelatedTitle}>
              Related categories for{" "}
              {menAccessoriesItems.find((item) => item.id === selectedMenItemId)?.title ??
                "Belts & Caps"}
            </Text>
          </View>
          <View style={styles.menRelatedTitleUnderline} />
          <View style={styles.menRelatedChips}>
            {beltsCapsRelatedChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={styles.menRelatedChip}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.menRelatedImageWrap}>
                  <Image source={chip.source} style={styles.menRelatedImage} resizeMode="cover" />
                </View>
                <Text style={styles.menRelatedChipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ImageBackground
          source={require("../assets/images/latest1.png")}
          style={styles.splitShowcaseSection}
          imageStyle={styles.splitShowcaseBgImage}
        >
          <View style={styles.splitShowcaseTint} />
          <View style={styles.splitShowcaseHeaderRow}>
            <Text style={styles.splitShowcaseTitle}>Accessories Spotlight</Text>
            <View style={styles.splitShowcaseBadge}>
              <Text style={styles.splitShowcaseBadgeText}>HOT PICKS</Text>
            </View>
          </View>
          <View style={styles.splitShowcaseRow}>
            <ScrollView
              ref={leftShowcaseScrollRef}
              style={styles.splitLeftPane}
              contentContainerStyle={styles.splitLeftPaneContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              onLayout={(event) => {
                leftShowcaseViewportHeightRef.current = event.nativeEvent.layout.height;
              }}
              onContentSizeChange={(_, height) => {
                leftShowcaseContentHeightRef.current = height;
              }}
            >
              {[...splitShowcaseImages, ...splitShowcaseImages].map((img, index) => (
                <View key={`showcase-img-${index}`} style={styles.splitLeftCard}>
                  <Image source={img} style={styles.splitLeftImage} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>

            <View style={styles.splitRightPane}>
              {splitShowcaseProducts.map((product) => {
                const discountPct =
                  product.mrp > product.price
                    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                    : 0;
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.splitProductCard}
                    activeOpacity={0.92}
                    onPress={() => router.push("/productdetail")}
                  >
                    <View style={styles.splitProductAccentBar} />
                    <View style={styles.splitProductCardMain}>
                      <View style={styles.splitProductImageStage}>
                        <View style={styles.splitProductImageBackdrop} />
                        <View style={styles.splitProductImagePad}>
                          <Image
                            source={product.image}
                            style={styles.splitProductImage}
                            resizeMode="contain"
                          />
                        </View>
                        {discountPct > 0 ? (
                          <View style={styles.splitProductDiscountRibbon} pointerEvents="none">
                            <Text style={styles.splitProductDiscountText}>{discountPct}% OFF</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.splitProductCopyBlock}>
                        <Text style={styles.splitProductTitle} numberOfLines={2}>
                          {product.title}
                        </Text>

                        <View style={styles.splitProductRatingPill}>
                          <Ionicons name="star" size={11} color="#16a34a" />
                          <Text style={styles.splitProductRatingPillValue}>
                            {product.rating.toFixed(1)}
                          </Text>
                          {product.reviewCount != null ? (
                            <Text style={styles.splitProductRatingPillCount}>
                              ({product.reviewCount})
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.splitProductPriceBlock}>
                          <Text style={styles.splitProductPriceLabel}>Offer price</Text>
                          <View style={styles.splitProductPriceRow}>
                            <Text style={styles.splitProductSalePrice}>
                              ₹{product.price.toLocaleString("en-IN")}
                            </Text>
                            <Text style={styles.splitProductMrp}>
                              MRP ₹{product.mrp.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.splitAddButton}
                        activeOpacity={0.88}
                        onPress={() => router.push("/productdetail")}
                      >
                        <Ionicons name="bag-add-outline" size={17} color="#f7fbf9" />
                        <Text style={styles.splitAddButtonText}>Add to Cart</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ImageBackground>

        <View
          style={styles.gadgetsAccessoriesSection}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            splitShowcaseSectionYRef.current = y;
            setSplitShowcaseSectionY(y);
          }}
        >
          <View style={styles.gadgetsWarmBgDecor} pointerEvents="none">
            <View style={[styles.gadgetsWarmBlob, styles.gadgetsWarmBlobA]} />
            <View style={[styles.gadgetsWarmBlob, styles.gadgetsWarmBlobB]} />
            <View style={[styles.gadgetsWarmBlob, styles.gadgetsWarmBlobC]} />
            <View style={[styles.gadgetsWarmBlob, styles.gadgetsWarmBlobD]} />
          </View>
          <View style={styles.gadgetsAccessoriesContent}>
          <View style={styles.gadgetsAccessoriesHeader}>
            <View style={styles.gadgetsAccessoriesHeaderLeft}>
              <View style={styles.gadgetsAccessoriesIconTile}>
                <Ionicons name="hardware-chip-outline" size={22} color="#C2410C" />
              </View>
              <View style={styles.gadgetsAccessoriesHeaderTitles}>
                <Text style={styles.gadgetsAccessoriesKicker}>GADGETS & ADD-ONS</Text>
                <Text style={styles.gadgetsAccessoriesHeading}>Gadgets Accessories</Text>
                <Text style={styles.gadgetsAccessoriesTagline}>
                  Audio, wearables, charging & protection for your devices
                </Text>
              </View>
            </View>
            <View style={styles.gadgetsAccessoriesHeaderBadge}>
              <Text style={styles.gadgetsAccessoriesHeaderBadgeText}>HOT PICKS</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.gadgetsQuickLinksContent}
          >
            {gadgetsAccessoryQuickLinks.map((link) => {
              const isActive = selectedGadgetsQuickLinkId === link.id;
              return (
                <TouchableOpacity
                  key={link.id}
                  style={[styles.gadgetsQuickLinkChip, isActive && styles.gadgetsQuickLinkChipActive]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedGadgetsQuickLinkId(link.id)}
                >
                  <Ionicons
                    name={link.icon}
                    size={16}
                    color={isActive ? "#7F1D1D" : "#C2410C"}
                  />
                  <Text
                    style={[
                      styles.gadgetsQuickLinkChipText,
                      isActive && styles.gadgetsQuickLinkChipTextActive,
                    ]}
                  >
                    {link.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.gadgetsSubcategoriesShell}>
            <LinearGradient
              colors={["#FF9A8B", "#FFB4A8", "#FECACA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gadgetsSubcategoriesBorderGlow}
            >
              <LinearGradient
                colors={["#FFFFFF", "#FFF8F6", "#FFE8E4", "#FFF5F5"]}
                locations={[0, 0.35, 0.72, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.gadgetsSubcategoriesGradientFill}
              >
                <View style={styles.gadgetsSubcategoriesNoise} pointerEvents="none" />
                <View style={styles.gadgetsSubcategoriesAccentBar} pointerEvents="none" />
                <View style={styles.gadgetsSubcategoriesInner}>
                  <View style={styles.gadgetsSubcategoriesTitleRow}>
                    <LinearGradient
                      colors={["#FFE4E6", "#FECDD3"]}
                      style={styles.gadgetsSubcategoriesIconBadge}
                    >
                      <Ionicons name="layers-outline" size={18} color="#C2410C" />
                    </LinearGradient>
                    <View style={styles.gadgetsSubcategoriesTitleTextCol}>
                      <Text style={styles.gadgetsSubcategoriesEyebrow}>GADGET SUBCATEGORIES</Text>
                      <Text style={styles.gadgetsSubcategoriesTitle} numberOfLines={2}>
                        {selectedGadgetsQuickLinkLabel}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.gadgetsSubcategoriesDivider} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    contentContainerStyle={styles.gadgetsSubcategoriesScroll}
                  >
                    {(gadgetsQuickLinkSubcategoriesResolved[selectedGadgetsQuickLinkId] || []).map((sub) => (
                      <TouchableOpacity
                        key={sub}
                        style={styles.gadgetsSubcategoryCard}
                        activeOpacity={0.88}
                        onPress={() =>
                          router.push({
                            pathname: "/subcatProducts",
                            params: {
                              mainCat: "accessories",
                              subCategory: sub,
                            },
                          })
                        }
                      >
                        <LinearGradient
                          colors={["#FFFFFF", "#FFF0F0", "#FFB6B1"]}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                          style={styles.gadgetsSubcategoryCardGlass}
                        >
                          <View style={styles.gadgetsSubcategoryImageWrap}>
                            <Image
                              source={
                                gadgetsSubcategoryImagesResolved[sub] ??
                                require("../assets/images/accessoriescate.png")
                              }
                              style={styles.gadgetsSubcategoryImage}
                              resizeMode="cover"
                            />
                            <LinearGradient
                              colors={["transparent", "rgba(255,182,177,0.55)"]}
                              style={styles.gadgetsSubcategoryImageShade}
                              pointerEvents="none"
                            />
                          </View>
                          <Text style={styles.gadgetsSubcategoryLabel} numberOfLines={2}>
                            {sub}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </LinearGradient>
            </LinearGradient>
          </View>

          <Text style={styles.gadgetsHighlightStripTitle}>Gadget highlights</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.gadgetsHighlightScrollContent}
          >
            {gadgetsHighlightImages.map((img, index) => (
              <TouchableOpacity
                key={`gadget-highlight-${index}`}
                style={styles.gadgetsHighlightTile}
                activeOpacity={0.9}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.gadgetsHighlightImageWrap} collapsable={false}>
                  <Image source={img} style={styles.gadgetsHighlightImage} resizeMode="cover" />
                </View>
                <View style={styles.gadgetsHighlightGradient} pointerEvents="none" />
                <Text style={styles.gadgetsHighlightLabel}>
                  {gadgetsHighlightTileLabels[index] ?? `Pick ${index + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
        </View>

        <View style={styles.spotlightFooterAdSection}>
          <ScrollView
            ref={footerAdScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            nestedScrollEnabled
            onMomentumScrollEnd={onFooterAdMomentumEnd}
            style={styles.spotlightFooterAdCarousel}
          >
            {spotlightFooterAdBanners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                activeOpacity={0.92}
                style={{ width: spotlightFooterAdPageWidth }}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.spotlightFooterAdInner}>
                  <View style={styles.spotlightFooterAdExampleCol}>
                    <View style={styles.spotlightFooterAdExampleFrame}>
                      <ExpoImage
                        source={banner.image}
                        style={styles.spotlightFooterAdExampleImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={banner.id}
                      />
                      <View style={styles.spotlightFooterAdNameOverlay} pointerEvents="none">
                        <Text style={styles.spotlightFooterAdNameText}>{banner.caption}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.spotlightFooterAdTextCol}>
                    <Text style={styles.spotlightFooterAdTitle}>{banner.title}</Text>
                    <Text style={styles.spotlightFooterAdSubtitle}>{banner.subtitle}</Text>
                    <View style={styles.spotlightFooterAdCtaRow}>
                      <Ionicons name="arrow-forward-circle" size={18} color="#ef7b1a" />
                      <Text style={styles.spotlightFooterAdCtaText}>Shop now</Text>
                    </View>
                  </View>
                  <View style={styles.spotlightFooterAdBadge} pointerEvents="none">
                    <Text style={styles.spotlightFooterAdBadgeText}>Ad</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.spotlightFooterAdDots}>
            {spotlightFooterAdBanners.map((b, i) => (
              <View
                key={b.id}
                style={[
                  styles.spotlightFooterAdDot,
                  i === footerAdIndex && styles.spotlightFooterAdDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <Animated.View
          collapsable={false}
          style={[styles.womanYouAreSection, womanYouAreSectionAnim]}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            kidsYouAreSectionYRef.current = y;
            setKidsYouAreSectionY(y);
          }}
        >
          <View style={styles.womanYouAreBrandTopBar} pointerEvents="none" />
          <View style={styles.womanYouAreBrandDots} pointerEvents="none">
            <View style={[styles.womanYouAreBrandDot, styles.womanYouAreBrandDotOrange]} />
            <View style={[styles.womanYouAreBrandDot, styles.womanYouAreBrandDotNavy]} />
            <View style={[styles.womanYouAreBrandDot, styles.womanYouAreBrandDotGold]} />
          </View>

          <Animated.View style={womanYouAreHeaderAnim}>
            <View style={styles.womanYouAreHeaderRow}>
              <View style={styles.womanYouAreTitleCol}>
                <Text style={styles.womanYouAreForThe}>For the</Text>
                <Text style={styles.womanYouAreMainJewellery}>Jewellery</Text>
              </View>
              <View style={styles.womanYouAreQuoteCol}>
                <View style={styles.womanYouAreQuoteAccent} pointerEvents="none" />
                <Text style={styles.womanYouAreQuote}>{JEWELLERY_SECTION_QUOTE}</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.womanYouAreDivider}>
            <View style={styles.womanYouAreDividerSide} />
            <View style={styles.womanYouAreDividerAccent} />
            <View style={styles.womanYouAreDividerSide} />
          </View>

          <View style={styles.womanYouAreStripWrap}>
            <Animated.ScrollView
              ref={womanYouAreCarouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={womanYouAreCarouselOnScroll}
              onScrollBeginDrag={onWomanYouAreCarouselDragStart}
              onScrollEndDrag={onWomanYouAreCarouselDragRelease}
              onMomentumScrollEnd={onWomanYouAreCarouselDragRelease}
              onLayout={(e) => setWomanYouAreCarouselVw(e.nativeEvent.layout.width)}
              style={styles.womanYouAreCarouselScroll}
              contentContainerStyle={styles.womanYouAreCarouselContent}
            >
              {womanYouAreCarouselItems.map((item, index) => {
                const cardHeight = getWomanYouAreCardHeight(index);
                const isLast = index === womanYouAreCarouselItems.length - 1;
                const r = { tl: 0, tr: 0, bl: 0, br: 0 };
                const innerR = {
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                };
                const footerLabel =
                  womanYouAreCardFooters[index % womanYouAreCardFooters.length];
                return (
                  <Animated.View
                    key={item.id}
                    style={womanYouAreCardEnterOpacityTranslate(womanYouAreReveal, index)}
                  >
                    <Animated.View style={womanYouAreCardEnterScale(womanYouAreReveal, index)}>
                      <Animated.View
                        style={womanYouAreCardScrollFocusOpacity(
                          womanYouAreCarouselScrollX,
                          index,
                          womanYouAreCardWidth,
                          womanYouAreCardGap,
                          womanYouAreCarouselViewportW,
                          womanYouAreCarouselMaxX
                        )}
                      >
                        <Animated.View
                          style={womanYouAreCardScrollFocusScale(
                            womanYouAreCarouselScrollX,
                            index,
                            womanYouAreCardWidth,
                            womanYouAreCardGap,
                            womanYouAreCarouselViewportW,
                            womanYouAreCarouselMaxX
                          )}
                        >
                          <View
                            style={[
                              styles.womanYouAreCardOuter,
                              {
                                width: womanYouAreCardWidth,
                                height: cardHeight,
                                marginRight: isLast ? 0 : womanYouAreCardGap,
                                borderTopLeftRadius: r.tl,
                                borderTopRightRadius: r.tr,
                                borderBottomLeftRadius: r.bl,
                                borderBottomRightRadius: r.br,
                              },
                            ]}
                          >
                            <View style={styles.womanYouAreCardMat}>
                              <View style={styles.womanYouAreCardAccentTop} pointerEvents="none">
                                <View style={styles.womanYouAreCardAccentTopWine} />
                                <View style={styles.womanYouAreCardAccentTopGold} />
                              </View>
                              <View style={styles.womanYouAreCardCornerGem} pointerEvents="none" />
                              <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => {
                                  setSelectedJewelleryCarouselIndex(index);
                                }}
                                style={[styles.womanYouAreCardInner, innerR]}
                              >
                                <View style={styles.womanYouAreCardMedia} collapsable={false}>
                                  <ExpoImage
                                    source={item.image}
                                    style={styles.womanYouAreCardImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                    recyclingKey={item.id}
                                  />
                                  <View
                                    style={[
                                      styles.womanYouAreCardShade,
                                      {
                                        borderBottomLeftRadius: innerR.borderBottomLeftRadius,
                                        borderBottomRightRadius: innerR.borderBottomRightRadius,
                                      },
                                    ]}
                                    pointerEvents="none"
                                  />
                                </View>
                              </TouchableOpacity>
                              <View style={styles.womanYouAreCardFooter}>
                                <Text style={styles.womanYouAreCardFooterMark}>✦</Text>
                                <Text style={styles.womanYouAreCardFooterText} numberOfLines={1}>
                                  {footerLabel}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </Animated.View>
                      </Animated.View>
                    </Animated.View>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          </View>
        </Animated.View>

        <View style={styles.kidsRelatedSection}>
          <View style={[styles.kidsTicketNotch, styles.kidsTicketNotchTop]} pointerEvents="none" />
          <View style={[styles.kidsTicketNotch, styles.kidsTicketNotchBottom]} pointerEvents="none" />
          <View style={styles.kidsRelatedHeaderRow}>
            <View style={styles.kidsRelatedIconBadge}>
              <Ionicons name="pricetags" size={16} color="#1d324e" />
            </View>
            <Text style={styles.kidsRelatedTitle} numberOfLines={3}>
              Jewellery subcategories for{" "}
              {womanYouAreCardFooters[selectedJewelleryCarouselIndex] ?? "Jewellery"}
            </Text>
          </View>
          <View style={styles.kidsRelatedTitleUnderline} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.kidsRelatedScroll}
          >
            {jewelleryRelatedChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={styles.kidsRelatedPill}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: "/subcatProducts",
                    params: {
                      mainCat: "accessories",
                      subCategory: chip.label,
                    },
                  })
                }
              >
                <View style={styles.kidsRelatedPillImageWrap}>
                  <Image source={chip.source} style={styles.kidsRelatedPillImage} resizeMode="cover" />
                </View>
                <Text style={styles.kidsRelatedPillText} numberOfLines={2}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.kidsInterstitialAdSection}
          onPress={() => router.push("/productdetail")}
        >
          <ImageBackground
            source={require("../assets/images/accessoriescate.png")}
            resizeMode="cover"
            style={styles.kidsInterstitialAdCard}
          >
            <View style={styles.kidsInterstitialAdOverlay}>
              {/* <Text style={styles.kidsInterstitialAdTag}>Ad</Text> */}
              <Text style={styles.kidsInterstitialAdTitle}>Accessories Spotlight</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <View
          style={styles.accessoriesReplicaSection}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            everyoneSectionYRef.current = y;
            setEveryoneSectionY(y);
          }}
        >
          <View style={styles.accessoriesReplicaHero}>
                <View style={styles.accessoriesReplicaHeroImage}>
                  <View style={styles.accessoriesReplicaHeroGrid} pointerEvents="none" />
                  <View style={styles.accessoriesReplicaHeroGlowLeft} pointerEvents="none" />
                  <View style={styles.accessoriesReplicaHeroGlowRight} pointerEvents="none" />
                  <View style={styles.accessoriesReplicaHeroGridPattern} pointerEvents="none">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <View
                        key={`h-${i}`}
                        style={[styles.accessoriesReplicaHeroGridLineH, { top: 20 + i * 20 }]}
                      />
                    ))}
                    {Array.from({ length: 11 }).map((_, i) => (
                      <View
                        key={`v-${i}`}
                        style={[styles.accessoriesReplicaHeroGridLineV, { left: 16 + i * 34 }]}
                      />
                    ))}
                  </View>
                  <Text style={styles.accessoriesReplicaHeroTitle}>ACCESSORIES</Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleAccessoriesDealPress("ad1")}
                    style={[styles.accessoriesReplicaHeroPiece, styles.accessoriesReplicaHeroPieceTopLeft]}
                  >
                    <Image
                      source={require("../assets/images/sportsbanner1.png")}
                      style={styles.accessoriesReplicaHeroPieceImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleAccessoriesDealPress("ad2")}
                    style={[styles.accessoriesReplicaHeroPiece, styles.accessoriesReplicaHeroPieceTopRight]}
                  >
                    <Image
                      source={require("../assets/images/sportsbanner2.png")}
                      style={styles.accessoriesReplicaHeroPieceImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleAccessoriesDealPress("ad3")}
                    style={[styles.accessoriesReplicaHeroPiece, styles.accessoriesReplicaHeroPieceBottomLeft]}
                  >
                    <Image
                      source={require("../assets/images/sportsbanner3.png")}
                      style={styles.accessoriesReplicaHeroPieceImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleAccessoriesDealPress("ad4")}
                    style={[styles.accessoriesReplicaHeroPiece, styles.accessoriesReplicaHeroPieceBottomRight]}
                  >
                    <Image
                      source={require("../assets/images/sportsbanner4.png")}
                      style={styles.accessoriesReplicaHeroPieceImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => handleAccessoriesDealPress("ad5")}
                    style={styles.accessoriesReplicaHeroCenterBag}
                  >
                    <Image
                      source={require("../assets/images/latest1.png")}
                      style={styles.accessoriesReplicaHeroCenterBagImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() =>
                      router.push({
                        pathname: "/subcatProducts",
                        params: {
                          mainCat: "accessories",
                          subCategory: "All Accessories",
                        },
                      })
                    }
                    style={styles.accessoriesReplicaHeroCtaWrap}
                  >
                    <Text style={styles.accessoriesReplicaHeroCta}>Shop All</Text>
                  </TouchableOpacity>
                </View>
          </View>

          <View style={styles.accessoriesReplicaRelatedSection}>
            <View style={styles.accessoriesReplicaRelatedTitleRow}>
              <Ionicons name="sparkles" size={14} color="#ef7b1a" />
              <Text style={styles.accessoriesReplicaRelatedTitle}>
                Related categories for{" "}
                {accessoriesHeroDeals.find((deal) => deal.id === selectedAccessoriesDealId)?.title ??
                  "Accessories"}
              </Text>
            </View>
            <View style={styles.accessoriesReplicaRelatedTitleUnderline} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accessoriesReplicaRelatedChips}
            >
              {otherAccessoriesRelatedChips.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={styles.accessoriesReplicaRelatedChip}
                  onPress={() =>
                    router.push({
                      pathname: "/subcatProducts",
                      params: {
                        mainCat: "accessories",
                        subCategory: chip.label,
                      },
                    })
                  }
                >
                  <View style={styles.accessoriesReplicaRelatedImageWrap}>
                    <Image source={chip.source} style={styles.accessoriesReplicaRelatedImage} resizeMode="cover" />
                  </View>
                  <Text style={styles.accessoriesReplicaRelatedChipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accessoriesReplicaDealsRow}
          >
            {accessoriesHeroDeals.map((deal) => (
              <TouchableOpacity
                key={deal.id}
                activeOpacity={0.9}
                style={[
                  styles.accessoriesReplicaDealCard,
                  selectedAccessoriesDealId === deal.id && styles.accessoriesReplicaDealCardActive,
                ]}
                onPress={() => handleAccessoriesDealPress(deal.id)}
              >
                <View style={styles.accessoriesReplicaDealImageWrap}>
                  <Image source={deal.image} style={styles.accessoriesReplicaDealImage} resizeMode="cover" />
                  <View style={styles.accessoriesReplicaDealImageShade} pointerEvents="none" />
                      <View style={styles.accessoriesReplicaDealTextWrap} pointerEvents="none">
                        <Text style={styles.accessoriesReplicaDealTitle} numberOfLines={1}>
                          {deal.title}
                        </Text>
                        <Text style={styles.accessoriesReplicaDealBrand} numberOfLines={1}>
                          {deal.brand}
                        </Text>
                        <Text style={styles.accessoriesReplicaDealSubtitle} numberOfLines={1}>
                          {deal.subtitle}
                        </Text>
                      </View>
                </View>
                <Text style={styles.accessoriesReplicaDealOffer}>{deal.offer}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.kidsAccessoryBoardSection}>
          {kidsAccessoryShowcaseRows.map((row, index) => (
            <View key={row.id} style={styles.kidsAccessoryBoardRowSection}>
              <View style={styles.kidsAccessoryBoardRowTitleWrap}>
                <View style={styles.kidsAccessoryBoardRowTitleLine} />
                <Text style={styles.kidsAccessoryBoardRowTitle}>{row.title}</Text>
                <View style={styles.kidsAccessoryBoardRowTitleLine} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.kidsAccessoryBoardRowScroll}
                contentContainerStyle={styles.kidsAccessoryBoardRowScrollContent}
              >
                {row.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.kidsAccessoryBoardCard,
                      { width: kidsAccessoryBoardCardWidth },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => router.push("/productdetail")}
                  >
                    <View>
                      <ExpoImage
                        source={item.image}
                        style={styles.kidsAccessoryBoardCardImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={item.id}
                      />
                      <View style={styles.kidsAccessoryBoardCardImageShade} pointerEvents="none" />
                    </View>
                    <View style={styles.kidsAccessoryBoardCardFooter}>
                      <Text style={styles.kidsAccessoryBoardCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.kidsAccessoryBoardCardOffer}>{item.offer}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {index < kidsAccessoryShowcaseRows.length - 1 ? (
                <View style={styles.kidsAccessoryBoardRowDivider} />
              ) : null}
            </View>
          ))}
        </View>

        <View
          collapsable={false}
          style={styles.watchesEditorialSection}
          onLayout={(event) => {
            const y = event.nativeEvent.layout.y;
            watchesSectionYRef.current = y;
            setWatchesSectionY(y);
          }}
        >
          <LinearGradient
            colors={["#FFF5F0", "#FCE8E4", "#F5D0C8"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.watchesEditorialGradient}
          >
            <View style={styles.watchesHeroGridPattern} pointerEvents="none">
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={`wgh-${i}`}
                  style={[styles.watchesHeroGridLineH, { top: 8 + i * 26 }]}
                />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={`wgv-${i}`}
                  style={[styles.watchesHeroGridLineV, { left: 6 + i * 48 }]}
                />
              ))}
            </View>

            <Text style={styles.watchesHeroTitle}>WATCHES</Text>

            <View style={styles.watchesHeroStage}>
              <View style={[styles.watchesHeroFloat, styles.watchesHeroFloatTL]}>
                <Image
                  source={require("../assets/images/sportscate.png")}
                  style={styles.watchesHeroFloatImg}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.watchesHeroFloat, styles.watchesHeroFloatTR]}>
                <Image
                  source={require("../assets/images/look2.png")}
                  style={styles.watchesHeroFloatImg}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.watchesHeroFloat, styles.watchesHeroFloatBL]}>
                <Image
                  source={require("../assets/images/product6.png")}
                  style={styles.watchesHeroFloatImg}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.watchesHeroFloat, styles.watchesHeroFloatBR]}>
                <Image
                  source={require("../assets/images/product1.png")}
                  style={styles.watchesHeroFloatImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.watchesHeroCenter}>
                <Image
                  source={require("../assets/images/menwatch.png")}
                  style={styles.watchesHeroCenterImg}
                  resizeMode="contain"
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/subcatProducts",
                  params: {
                    mainCat: "accessories",
                    subCategory: "Watches",
                  },
                })
              }
              style={styles.watchesShopAllBtn}
            >
              <Text style={styles.watchesShopAllText}>Shop All</Text>
              <View style={styles.watchesShopAllUnderline} />
            </TouchableOpacity>
          </LinearGradient>

          <GestureHandlerRootView style={styles.watchesShowcaseGestureRoot}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={styles.watchesShowcaseRowScroll}
              contentContainerStyle={styles.watchesShowcaseRow}
            >
              {watchesShowcaseCardsResolved.map((card) => {
                const isWatchesCardSelected = selectedWatchesShowcaseCardId === card.id;
                return (
              <GestureTouchableOpacity
                key={card.id}
                activeOpacity={0.9}
                style={[
                  styles.watchesShowcaseCardOuter,
                  isWatchesCardSelected && styles.watchesShowcaseCardOuterSelected,
                ]}
                onPress={() => onWatchShowcaseLanePress(card.id)}
              >
                <LinearGradient
                  colors={["#D4AF7A", "#F0E6C8", "#C9A961", "#B8860B"]}
                  locations={[0, 0.4, 0.75, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.watchesShowcaseCardBorder}
                >
                  <LinearGradient
                    colors={[
                      "#FFFFFF",
                      "#F7F7F7",
                      "#E8E8E8",
                      "#B8B8B8",
                      "#6B6B6B",
                      "#3A3A3A",
                      "#1C1C1C",
                      "#0A0A0A",
                      "#000000",
                    ]}
                    locations={[0, 0.1, 0.22, 0.38, 0.52, 0.66, 0.78, 0.9, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.watchesShowcaseCardFace}
                  >
                    <View style={styles.watchesShowcaseCardImageWrap}>
                      <Image
                        source={card.image}
                        style={styles.watchesShowcaseCardProductImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.watchesShowcaseCardTextWrap}>
                      <Text style={styles.watchesShowcaseCardLabel} numberOfLines={2}>
                        {card.title}
                      </Text>
                      <Text style={styles.watchesShowcaseCardBrands} numberOfLines={1}>
                        {card.brandsLine}
                      </Text>
                    </View>
                  </LinearGradient>
                </LinearGradient>
                <Text style={styles.watchesShowcaseCardOffer}>{card.offer}</Text>
              </GestureTouchableOpacity>
                );
              })}
            </ScrollView>
          </GestureHandlerRootView>
        </View>

        <View style={styles.finalUniqueSection}>
          <View style={styles.finalUniqueHeader}>
            <View style={styles.finalUniqueTitleWrap}>
              <View style={styles.finalUniqueTitleRow}>
                <Ionicons name="sparkles" size={15} color="#ef7b1a" />
                <Text style={styles.finalUniqueTitle}>
                  <Text style={styles.finalUniqueTitleLead}>Unique </Text>
                  <Text style={styles.finalUniqueTitleAccent}>Picks</Text>
                </Text>
              </View>
              <View style={styles.finalUniqueTitleUnderline} />
              <Text style={styles.finalUniqueSubtitle}>Fresh accessories to finish your look</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.finalUniqueViewAll}
              onPress={() =>
                router.push({
                  pathname: "/subcatProducts",
                  params: {
                    mainCat: "accessories",
                    subCategory: "Unique Picks",
                  },
                })
              }
            >
              <Text style={styles.finalUniqueViewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#9a3412" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.finalUniqueRow}
          >
            {finalUniquePicks.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.finalUniqueCard}
                activeOpacity={0.9}
                onPress={() => router.push("/productdetail")}
              >
                <Image source={item.image} style={styles.finalUniqueCardImage} resizeMode="cover" />
                <View style={styles.finalUniqueTagPill}>
                  <Text style={styles.finalUniqueTagText}>{item.tag}</Text>
                </View>
                <View style={styles.finalUniqueCardContent}>
                  <Text style={styles.finalUniqueCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.finalUniqueCardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff4fb",
  },
  topFixedArea: {
    backgroundColor: "#fff9f2",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.12)",
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  mainScroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 90,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: "#fff9f2",
    flexDirection: "row",
    alignItems: "center",
  },
  headerBrand: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    width: 30,
    height: 30,
  },
  headerBrandLogo: {
    width: "100%",
    height: "100%",
  },
  searchBox: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e2e6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    color: "#1d324e",
    fontSize: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topStrip: {
    backgroundColor: "transparent",
    paddingBottom: 0,
    paddingTop: 2,
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
  },
  topStripBgImage: {
    opacity: 0,
  },
  topStripHeader: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  topStripTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f5f5f5",
  },
  topStripSubTitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#c7c7cc",
    fontWeight: "500",
  },
  topStripContent: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  /** Fixed width + overflow: long labels must wrap; otherwise each row grows with text and leaves huge gaps between thumbnails. */
  topCategoryItem: {
    width: 78,
    marginRight: 0,
    padding: 0,
    flexShrink: 0,
    overflow: "hidden",
  },
  topCategoryColumn: {
    alignItems: "center",
    width: 78,
    overflow: "hidden",
  },
  topCategoryMediaFrame: {
    width: 78,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#d7e0e8",
    backgroundColor: "#ffffff",
  },
  topCategoryMediaFrameActive: {
    borderColor: "#ef7b1a",
  },
  topCategoryImage: {
    width: "100%",
    height: "100%",
  },
  topCategoryText: {
    marginTop: 8,
    width: 78,
    maxWidth: 78,
    alignSelf: "center",
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    lineHeight: 11,
    color: "#1d324e",
    textAlign: "center",
  },
  topCategoryTextActive: {
    color: "#ef7b1a",
  },
  topCategoryActiveBar: {
    marginTop: 6,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  topCategoryActiveBarOn: {
    backgroundColor: "#ef7b1a",
  },
  heroSection: {
    width: "100%",
    height: 500,
    position: "relative",
    backgroundColor: "#504f56",
    marginTop: -2,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(29,50,78,0.16)",
  },
  heroStarCluster: {
    position: "absolute",
    top: 44,
    right: 8,
    width: 132,
    height: 168,
  },
  heroStarNode: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  heroStarNodeA: {
    top: 2,
    right: 2,
  },
  heroStarNodeB: {
    top: 58,
    right: 44,
  },
  heroStarNodeC: {
    top: 118,
    right: 6,
  },
  heroBadgeRow: {
    position: "absolute",
    top: 20,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(246,199,149,0.92)",
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "700",
    color: "#1d324e",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  heroTopNote: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f6c795",
    letterSpacing: 1,
    marginBottom: 8,
    backgroundColor: "rgba(29,50,78,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: "#f6c795",
    textAlign: "center",
    lineHeight: 42,
    textShadowColor: "rgba(29,50,78,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroButton: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#ef7b1a",
    borderWidth: 1.5,
    borderColor: "#f6c795",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  heroButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  glamSection: {
    backgroundColor: "#ffffff",
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: "center",
  },
  glamHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#fff4e7",
    borderWidth: 1,
    borderColor: "#f6c795",
  },
  glamHeadingLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#79411c",
    letterSpacing: 0.8,
  },
  glamTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1d324e",
    textAlign: "center",
  },
  glamSubtitle: {
    marginTop: 8,
    fontSize: 18,
    color: "#445f73",
    textAlign: "center",
    fontWeight: "700",
  },
  glamSubtitleHighlight: {
    color: "#ef7b1a",
    fontWeight: "900",
  },
  tileSection: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: "#fff4fb",
  },
  tileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tileCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 240,
    borderRadius: 0,
    paddingTop: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  leftTile: {
    backgroundColor: "#ef7b1a",
    borderColor: "#d46200",
  },
  rightTile: {
    backgroundColor: "#79411c",
    borderColor: "#5f3013",
    marginLeft: 8,
  },
  tileBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  tileBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  tileTextContent: {
    width: "100%",
    paddingHorizontal: 10,
    alignItems: "flex-start",
  },
  tileHeading: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    alignSelf: "flex-start",
  },
  tileSubHeading: {
    marginTop: 4,
    color: "#fef3c7",
    fontSize: 11,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  tileImageWrap: {
    width: "100%",
    height: 130,
    alignSelf: "stretch",
    flexShrink: 0,
    borderRadius: 0,
    overflow: "hidden",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  collectionSection: {
    backgroundColor: "#e9edf5",
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 18,
  },
  collectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  collectionHeaderContent: {
    flex: 1,
  },
  collectionEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff6ec",
    borderColor: "#ffd6b0",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  collectionEyebrowText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8b4a1a",
    letterSpacing: 0.4,
  },
  collectionTitleAccentWrap: {
    alignSelf: "flex-start",
  },
  collectionTitleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#1d324e",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 5,
  },
  collectionTitleBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  collectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collectionTitleBar: {
    width: 4,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#ef7b1a",
  },
  collectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.2,
  },
  collectionSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: "#6c8494",
    fontWeight: "600",
  },
  collectionViewAll: {
    borderWidth: 1,
    borderColor: "#ef7b1a",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#fff6ec",
  },
  collectionViewAllText: {
    color: "#ef7b1a",
    fontSize: 12,
    fontWeight: "700",
  },
  collectionFeaturedCard: {
    width: "100%",
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d5dbe7",
    backgroundColor: "#e9edf5",
    marginBottom: 12,
  },
  collectionFeaturedImage: {
    width: "100%",
    height: "100%",
  },
  collectionFeaturedTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#ef7b1a",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  collectionFeaturedTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  collectionFeaturedOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29,50,78,0.72)",
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 11,
    alignItems: "stretch",
  },
  collectionFeaturedOverlayVisible: {
    opacity: 1,
  },
  collectionFeaturedOverlayHidden: {
    opacity: 0,
  },
  collectionFeaturedTitle: {
    color: "#f6c795",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "left",
  },
  collectionFeaturedSubtitle: {
    marginTop: 2,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  collectionMiniGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
  },
  collectionMiniCard: {
    width: "31.6%",
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    position: "relative",
    borderWidth: 1,
    borderColor: "#d9deea",
  },
  collectionMiniImage: {
    width: "100%",
    height: "100%",
  },
  collectionMiniTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#79411c",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  collectionMiniTagText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  collectionMiniOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29,50,78,0.72)",
    paddingHorizontal: 7,
    paddingTop: 6,
    paddingBottom: 7,
  },
  collectionMiniTitle: {
    color: "#f6c795",
    fontSize: 11,
    fontWeight: "800",
  },
  collectionMiniSubtitle: {
    marginTop: 1,
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "600",
  },
  videoAdSection: {
    paddingHorizontal: 0,
    marginBottom: 14,
  },
  videoAdHeader: {
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  spotlightHeaderCard: {
    marginBottom: 10,
    marginHorizontal: 12,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    backgroundColor: "#eef4ff",
    borderWidth: 1,
    borderColor: "#cddcff",
  },
  spotlightHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spotlightHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d324e",
  },
  spotlightHeaderSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a5f78",
    textAlign: "right",
    marginLeft: 10,
  },
  videoAdTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#311b92",
  },
  styleLabAdHeadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 0,
    backgroundColor: "#faf7ff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dfd5f0",
  },
  styleLabAdHeadingIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 123, 26, 0.35)",
  },
  styleLabAdHeadingTextCol: {
    flex: 1,
    minWidth: 0,
  },
  styleLabAdHeadingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  styleLabAdHeadingTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  styleLabAdHeadingTitleLead: {
    color: "#1d324e",
  },
  styleLabAdHeadingTitleAccent: {
    color: "#ef7b1a",
  },
  styleLabAdHeadingAdMark: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(49, 27, 146, 0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49, 27, 146, 0.22)",
  },
  styleLabAdHeadingAdMarkText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#311b92",
    letterSpacing: 0.6,
  },
  styleLabAdHeadingSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#5c4a78",
    letterSpacing: 0.1,
  },
  videoAdCard: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "#504f56",
  },
  videoAdCardFixedHeight: {
    height: 220,
  },
  videoAdCardSpotlight: {
    borderRadius: 0,
  },
  videoAdPlayer: {
    width: "100%",
    height: "100%",
  },
  videoAdOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "rgba(29,50,78,0.58)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  videoAdOverlayTitle: {
    color: "#f6c795",
    fontSize: 16,
    fontWeight: "800",
  },
  videoAdButton: {
    backgroundColor: "#ef7b1a",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#f6c795",
  },
  videoAdButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  womenSection: {
    backgroundColor: "#f8fafc",
    marginHorizontal: 0,
    borderRadius: 22,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d8dee9",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  womenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "#f5f8ff",
    borderWidth: 1,
    borderColor: "#d7e2fb",
  },
  womenTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  womenTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  womenTitleWord: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d324e",
  },
  womenTitleUnderline: {
    marginTop: 4,
    marginBottom: 2,
    marginLeft: 28,
    width: 156,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ef7b1a",
  },
  womenSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#4f657b",
    fontWeight: "600",
  },
  womenViewAll: {
    backgroundColor: "#1d324e",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f6c795",
  },
  womenViewAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  womenList: {
    paddingHorizontal: 0,
  },
  womenListItem: {
    minHeight: 92,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6d3ff",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 10,
  },
  womenListThumb: {
    width: 74,
    height: 74,
    borderRadius: 10,
    backgroundColor: "#eceff5",
  },
  womenListContent: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  womenListTitle: {
    marginTop: 6,
    color: "#1d324e",
    fontSize: 14,
    fontWeight: "800",
  },
  womenListSubtitle: {
    marginTop: 2,
    color: "#6c8494",
    fontSize: 12,
    fontWeight: "600",
  },
  womenGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  womenFeaturedCard: {
    width: "54%",
    height: 260,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#504f56",
    borderWidth: 0,
  },
  womenSideColumn: {
    width: "43%",
    justifyContent: "space-between",
  },
  womenSideCard: {
    height: 124,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#504f56",
    borderWidth: 0,
  },
  womenBottomCard: {
    marginTop: 10,
    marginHorizontal: 0,
    height: 146,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#504f56",
    borderWidth: 0,
  },
  womenCardImage: {
    width: "100%",
    height: "100%",
  },
  womenCardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29,50,78,0.48)",
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  womenCardTitle: {
    color: "#f6c795",
    fontSize: 13,
    fontWeight: "800",
  },
  womenCardSubtitle: {
    marginTop: 1,
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  womenCardSubtitleRight: {
    alignSelf: "flex-end",
    textAlign: "right",
  },
  womenRelatedSection: {
    marginHorizontal: 0,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcd9f5",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  womenRelatedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d324e",
    flexShrink: 1,
  },
  womenRelatedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  womenRelatedTitleUnderline: {
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 58,
    width: 170,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ef7b1a",
  },
  womenRelatedChips: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 8,
  },
  womenRelatedChip: {
    width: 88,
    alignItems: "center",
    marginBottom: 0,
    marginRight: 8,
    paddingHorizontal: 4,
  },
  womenRelatedImageWrap: {
    width: 62,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d6ccff",
    backgroundColor: "#eceff5",
    marginBottom: 6,
  },
  womenRelatedImage: {
    width: "100%",
    height: "100%",
  },
  womenRelatedChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4a148c",
    textAlign: "center",
  },
  kidsRelatedSection: {
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 6,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "#fff9f2",
    borderWidth: 0,
    borderLeftWidth: 6,
    borderLeftColor: "#ef7b1a",
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 4,
    position: "relative",
    overflow: "visible",
  },
  kidsTicketNotch: {
    position: "absolute",
    width: 17,
    height: 17,
    borderRadius: 9,
    left: 6,
    backgroundColor: "#fff4fb",
    borderWidth: 0,
    zIndex: 3,
  },
  kidsTicketNotchTop: {
    top: 56,
  },
  kidsTicketNotchBottom: {
    bottom: 56,
  },
  kidsRelatedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    paddingRight: 8,
  },
  kidsRelatedIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f6c795",
    borderWidth: 2,
    borderColor: "#79411c",
    alignItems: "center",
    justifyContent: "center",
  },
  kidsRelatedTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#1d324e",
    lineHeight: 18,
    fontStyle: "italic",
  },
  kidsRelatedTitleUnderline: {
    marginLeft: 48,
    marginBottom: 12,
    width: 160,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ef7b1a",
  },
  kidsRelatedScroll: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: 12,
    gap: 12,
  },
  kidsRelatedPill: {
    width: 112,
    borderRadius: 10,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#1d324e",
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: "#504f56",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
    elevation: 4,
  },
  kidsRelatedPillImageWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderTopRightRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ef7b1a",
    backgroundColor: "#fff9f2",
    marginBottom: 8,
  },
  kidsRelatedPillImage: {
    width: "100%",
    height: "100%",
  },
  kidsRelatedPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1d324e",
    textAlign: "center",
    lineHeight: 13,
  },
  kidsMidBannerAd: {
    marginHorizontal: 0,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#f6c795",
    backgroundColor: "#1d324e",
    shadowColor: "#1d324e",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 10,
    elevation: 7,
  },
  kidsMidBannerAdImage: {
    height: 144,
    justifyContent: "center",
  },
  kidsMidBannerAdImageStyle: {
    borderRadius: 16,
  },
  kidsMidBannerAdOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 28, 44, 0.58)",
  },
  kidsMidBannerAdContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  kidsMidBannerAdTagRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  kidsMidBannerAdTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(246,199,149,0.97)",
    color: "#1d324e",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  kidsMidBannerAdDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f6c795",
    marginHorizontal: 8,
  },
  kidsMidBannerAdTagMuted: {
    color: "#f6c795",
    fontSize: 11,
    fontWeight: "700",
    opacity: 0.95,
  },
  kidsMidBannerAdTitle: {
    color: "#ffffff",
    marginTop: 10,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 28,
  },
  kidsMidBannerAdSubtitle: {
    marginTop: 6,
    color: "#fef3e6",
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 18,
    maxWidth: "90%",
  },
  kidsMidBannerAdCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f6c795",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  kidsMidBannerAdCtaText: {
    color: "#1d324e",
    fontSize: 11,
    fontWeight: "900",
  },
  kidsInterstitialAdSection: {
    marginHorizontal: 8,
    marginBottom: 10,
  },
  kidsInterstitialAdCard: {
    height: 126,
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6c8494",
    backgroundColor: "#504f56",
    justifyContent: "flex-end",
  },
  kidsInterstitialAdOverlay: {
    backgroundColor: "rgba(29,50,78,0.52)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  kidsInterstitialAdTag: {
    alignSelf: "flex-start",
    backgroundColor: "#f6c795",
    color: "#1d324e",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 6,
  },
  kidsInterstitialAdTitle: {
    color: "#f6c795",
    fontSize: 16,
    fontWeight: "900",
  },
  kidsInterstitialAdSubtitle: {
    marginTop: 2,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  accessoriesReplicaSection: {
    marginHorizontal: 0,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  accessoriesReplicaHero: {
    borderWidth: 1,
    borderColor: "#e7c0ab",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#f7e5d8",
  },
  accessoriesReplicaHeroImage: {
    height: 214,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
    position: "relative",
    backgroundColor: "#f6ece4",
  },
  accessoriesReplicaHeroGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f6ece4",
    opacity: 1,
  },
  accessoriesReplicaHeroGlowLeft: {
    position: "absolute",
    width: 170,
    height: 120,
    borderRadius: 85,
    left: -18,
    top: 86,
    backgroundColor: "rgba(241, 157, 145, 0.26)",
    zIndex: 1,
  },
  accessoriesReplicaHeroGlowRight: {
    position: "absolute",
    width: 170,
    height: 120,
    borderRadius: 85,
    right: -22,
    top: 86,
    backgroundColor: "rgba(241, 157, 145, 0.23)",
    zIndex: 1,
  },
  accessoriesReplicaHeroGridPattern: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    opacity: 0.42,
  },
  accessoriesReplicaHeroGridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#d9cfc6",
  },
  accessoriesReplicaHeroGridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#d9cfc6",
  },
  accessoriesReplicaHeroTitle: {
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 0.9,
    color: "#111111",
    textAlign: "center",
    marginTop: 4,
    zIndex: 2,
  },
  accessoriesReplicaHeroPiece: {
    position: "absolute",
    zIndex: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  accessoriesReplicaHeroPieceImage: {
    width: "100%",
    height: "100%",
  },
  accessoriesReplicaHeroPieceTopLeft: {
    width: 88,
    height: 56,
    left: 8,
    top: 50,
    transform: [{ rotate: "-10deg" }],
  },
  accessoriesReplicaHeroPieceTopRight: {
    width: 92,
    height: 56,
    right: 8,
    top: 50,
    transform: [{ rotate: "-8deg" }],
  },
  accessoriesReplicaHeroPieceBottomLeft: {
    width: 86,
    height: 96,
    left: 4,
    bottom: 10,
    transform: [{ rotate: "-7deg" }],
  },
  accessoriesReplicaHeroPieceBottomRight: {
    width: 86,
    height: 96,
    right: 4,
    bottom: 10,
    transform: [{ rotate: "10deg" }],
  },
  accessoriesReplicaHeroCenterBag: {
    position: "absolute",
    width: 176,
    height: 124,
    top: 72,
    zIndex: 2,
  },
  accessoriesReplicaHeroCenterBagImage: {
    width: "100%",
    height: "100%",
  },
  accessoriesReplicaHeroCtaWrap: {
    zIndex: 6,
    marginBottom: 4,
  },
  accessoriesReplicaHeroCta: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111111",
    textDecorationLine: "underline",
  },
  accessoriesReplicaDealsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
    paddingRight: 6,
  },
  accessoriesReplicaDealCard: {
    width: 122,
  },
  accessoriesReplicaDealCardActive: {
    transform: [{ scale: 1.02 }],
  },
  accessoriesReplicaDealImageWrap: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1b09f",
    backgroundColor: "#ffffff",
    height: 128,
    justifyContent: "flex-end",
  },
  accessoriesReplicaDealImage: {
    ...StyleSheet.absoluteFillObject,
  },
  accessoriesReplicaDealImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.22)",
  },
  accessoriesReplicaDealTextWrap: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  accessoriesReplicaDealTitle: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  accessoriesReplicaDealBrand: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  accessoriesReplicaDealSubtitle: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.8,
    marginTop: 1,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  accessoriesReplicaDealOffer: {
    marginTop: 5,
    textAlign: "center",
    color: "#121212",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,

  },
  accessoriesReplicaRelatedSection: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d6c1b7",
    backgroundColor: "#fffdfb",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  accessoriesReplicaRelatedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  accessoriesReplicaRelatedTitle: {
    color: "#1d324e",
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
  accessoriesReplicaRelatedTitleUnderline: {
    width: 176,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ef7b1a",
    marginBottom: 10,
    marginLeft: 18,
  },
  accessoriesReplicaRelatedChips: {
    flexDirection: "row",
    gap: 10,
    paddingRight: 6,
  },
  accessoriesReplicaRelatedChip: {
    width: 86,
    alignItems: "center",
  },
  accessoriesReplicaRelatedImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d6c1b7",
    backgroundColor: "#f5efea",
    marginBottom: 6,
  },
  accessoriesReplicaRelatedImage: {
    width: "100%",
    height: "100%",
  },
  accessoriesReplicaRelatedChipText: {
    color: "#4a3a33",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  kidsAccessoryBoardSection: {
    marginTop: 8,
    marginBottom: 6,
    paddingTop: 3,
    paddingBottom: 5,
    paddingHorizontal: 3,
    backgroundColor: "#f6c795",
    borderWidth: 1,
    borderColor: "#1d324e",
  },
  kidsAccessoryBoardRowSection: {
    marginBottom: 0,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: "#ffffff",
  },
  kidsAccessoryBoardRowTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  kidsAccessoryBoardRowTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#69798c",
    opacity: 0.7,
  },
  kidsAccessoryBoardRowTitle: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "900",
    color: "#1d324e",
    marginHorizontal: 8,
    letterSpacing: 0.8,
    textShadowColor: "rgba(80,79,86,0.24)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  kidsAccessoryBoardRowScroll: {
    flexGrow: 0,
  },
  kidsAccessoryBoardRowScrollContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 3,
    paddingRight: 12,
    gap: 3,
  },
  kidsAccessoryBoardRowDivider: {
    height: 1,
    marginTop: 7,
    backgroundColor: "#69798c",
    opacity: 0.9,
  },
  kidsAccessoryBoardCard: {
    backgroundColor: "#ffffff",
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#6c8494",
    shadowColor: "#504f56",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  kidsAccessoryBoardCardImage: {
    width: "100%",
    height: 80,
    backgroundColor: "#69798c",
  },
  kidsAccessoryBoardCardImageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 52,
    height: 28,
    backgroundColor: "rgba(29,50,78,0.18)",
  },
  kidsAccessoryBoardCardFooter: {
    backgroundColor: "#1d324e",
    borderTopWidth: 1,
    borderTopColor: "#ef7b1a",
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 2,
    minHeight: 44,
    justifyContent: "space-between",
  },
  kidsAccessoryBoardCardTitle: {
    color: "#f6c795",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 12,
  },
  kidsAccessoryBoardCardOffer: {
    color: "#ef7b1a",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 11,
    marginTop: 1,
  },
  womanYouAreSection: {
    marginHorizontal: 0,
    marginBottom: 22,
    backgroundColor: "#fff9f2",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "#1d324e",
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
    elevation: 6,
    overflow: "hidden",
  },
  womanYouAreBrandTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "#ef7b1a",
  },
  womanYouAreBrandDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    marginTop: 8,
  },
  womanYouAreBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#1d324e",
  },
  womanYouAreBrandDotOrange: {
    backgroundColor: "#ef7b1a",
  },
  womanYouAreBrandDotNavy: {
    backgroundColor: "#1d324e",
  },
  womanYouAreBrandDotGold: {
    backgroundColor: "#f6c795",
  },
  womanYouAreHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  womanYouAreTitleCol: {
    flex: 1,
    minWidth: 168,
    paddingRight: 12,
  },
  womanYouAreQuoteCol: {
    flex: 1,
    minWidth: 168,
    paddingLeft: 14,
    paddingVertical: 2,
    justifyContent: "center",
    position: "relative",
  },
  womanYouAreQuoteAccent: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#ef7b1a",
  },
  womanYouAreForThe: {
    fontSize: 25,
    fontStyle: "italic",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: undefined }),
    color: "#504f56",
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  womanYouAreMainOrange: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ef7b1a",
    letterSpacing: 4,
    lineHeight: 36,
  },
  womanYouAreMainNavy: {
    fontSize: 31,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 5,
    lineHeight: 36,
    marginTop: -2,
  },
  womanYouAreMainJewellery: {
    fontSize: 30,
    fontWeight: "900",
    color: "#ef7b1a",
    letterSpacing: 1.5,
    lineHeight: 34,
  },
  womanYouAreQuote: {
    fontSize: 13,
    lineHeight: 21,
    color: "#1d324e",
    textAlign: "right",
    fontWeight: "500",
    letterSpacing: 0.12,
    opacity: 0.92,
  },
  womanYouAreDivider: {
    flexDirection: "row",
    alignItems: "center",
    height: 3,
    marginTop: 18,
    marginBottom: 14,
  },
  womanYouAreDividerSide: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(29, 50, 78, 0.18)",
    borderRadius: 1,
  },
  womanYouAreDividerAccent: {
    width: 72,
    height: 3,
    marginHorizontal: 10,
    backgroundColor: "#f6c795",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#79411c",
  },
  womanYouAreStripWrap: {
    marginHorizontal: 0,
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: "rgba(239, 123, 26, 0.07)",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(29, 50, 78, 0.12)",
  },
  womanYouAreCarouselScroll: {
    marginHorizontal: 0,
  },
  womanYouAreCarouselContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 6,
    paddingTop: 4,
  },
  womanYouAreCardOuter: {
    backgroundColor: "transparent",
    padding: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0,
    shadowRadius: 14,
    elevation: 0,
  },
  womanYouAreCardMat: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 6,
    borderWidth: 0,
    overflow: "hidden",
  },
  womanYouAreCardAccentTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    flexDirection: "row",
    zIndex: 2,
  },
  womanYouAreCardAccentTopWine: {
    flex: 3,
    height: 3,
    backgroundColor: "#1d324e",
  },
  womanYouAreCardAccentTopGold: {
    flex: 2,
    height: 3,
    backgroundColor: "#f6c795",
  },
  womanYouAreCardCornerGem: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ef7b1a",
    borderWidth: 1.5,
    borderColor: "#fff9f2",
    zIndex: 3,
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  womanYouAreCardInner: {
    flex: 1,
    minHeight: 120,
    overflow: "hidden",
    backgroundColor: "#f4f6f8",
    position: "relative",
  },
  womanYouAreCardMedia: {
    flex: 1,
    width: "100%",
    minHeight: 100,
    overflow: "hidden",
    position: "relative",
  },
  womanYouAreCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  womanYouAreCardShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
    backgroundColor: "rgba(29, 50, 78, 0.18)",
    zIndex: 1,
  },
  womanYouAreCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
    borderTopWidth: 2,
    borderTopColor: "#f6c795",
    marginTop: 6,
    backgroundColor: "rgba(246, 199, 149, 0.2)",
  },
  womanYouAreCardFooterMark: {
    fontSize: 9,
    color: "#ef7b1a",
    opacity: 0.95,
  },
  womanYouAreCardFooterText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.2,
    color: "#1d324e",
  },
  styleLabSection: {
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: "#1f2f4f",
    borderWidth: 1,
    borderColor: "#4e6b99",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  styleLabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  styleLabTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f6c795",
  },
  styleLabSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#c4d8ff",
  },
  styleLabBtn: {
    backgroundColor: "#ef7b1a",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f6c795",
  },
  styleLabBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  styleLabCardsRow: {
    paddingRight: 6,
  },
  styleLabFeatureCard: {
    width: 188,
    height: 196,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 10,
    borderWidth: 0,
    backgroundColor: "#0f1c35",
  },
  styleLabFeatureImage: {
    width: "100%",
    height: "100%",
  },
  styleLabFeatureOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(17,31,58,0.78)",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 9,
  },
  styleLabArrowBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#f6c795",
    alignItems: "center",
    justifyContent: "center",
  },
  styleLabRowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ece1d3",
  },
  styleLabRowCardLast: {
    marginBottom: 0,
  },
  styleLabImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#e9e9e9",
  },
  styleLabContent: {
    flex: 1,
    marginLeft: 10,
  },
  styleLabTag: {
    alignSelf: "flex-start",
    backgroundColor: "#ef7b1a",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 5,
  },
  styleLabTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  styleLabCardTitle: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "800",
    color: "#f6c795",
  },
  styleLabCardSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#dbe8ff",
  },
  menSection: {
    backgroundColor: "#eef2ff",
    marginHorizontal: 0,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d8def5",
  },
  menHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#f5f8ff",
    borderWidth: 1,
    borderColor: "#d7e2fb",
  },
  menTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  menTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d324e",
  },
  menTitleUnderline: {
    marginTop: 4,
    marginBottom: 2,
    marginLeft: 18,
    width: 138,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ef7b1a",
  },
  menSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#4f657b",
    fontWeight: "600",
  },
  menViewAll: {
    backgroundColor: "#1d324e",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f6c795",
  },
  menViewAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  menCardsRow: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  menCard: {
    width: 160,
    height: 214,
    marginRight: 10,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#504f56",
    borderWidth: 0,
  },
  menCardImage: {
    width: "100%",
    height: "100%",
  },
  menCardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29,50,78,0.78)",
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  menCardTitle: {
    color: "#f6c795",
    fontSize: 13,
    fontWeight: "800",
  },
  menCardSubtitle: {
    marginTop: 1,
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  menRelatedSection: {
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4e6dd",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menRelatedTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d324e",
    flexShrink: 1,
  },
  menRelatedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menRelatedTitleUnderline: {
    marginTop: 6,
    marginBottom: 10,
    marginLeft: 18,
    width: 170,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#ef7b1a",
  },
  menRelatedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  menRelatedChip: {
    width: "25%",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menRelatedImageWrap: {
    width: 62,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#c7ddd2",
    backgroundColor: "#edf3ef",
    marginBottom: 6,
  },
  menRelatedImage: {
    width: "100%",
    height: "100%",
  },
  menRelatedChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f766e",
    textAlign: "center",
  },
  gadgetsAccessoriesSection: {
    marginHorizontal: 0,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "#FFF5F5",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(240,128,128,0.35)",
    position: "relative",
    overflow: "hidden",
  },
  gadgetsWarmBgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  gadgetsWarmBlob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.42,
  },
  gadgetsWarmBlobA: {
    width: 200,
    height: 200,
    backgroundColor: "#FFB4A8",
    top: -50,
    right: -40,
  },
  gadgetsWarmBlobB: {
    width: 260,
    height: 260,
    backgroundColor: "#FCA5A5",
    bottom: 40,
    left: -80,
  },
  gadgetsWarmBlobC: {
    width: 160,
    height: 160,
    backgroundColor: "#FECACA",
    top: 100,
    left: 10,
  },
  gadgetsWarmBlobD: {
    width: 120,
    height: 120,
    backgroundColor: "#FDA4AF",
    top: 200,
    right: 30,
  },
  gadgetsAccessoriesContent: {
    position: "relative",
    zIndex: 1,
  },
  gadgetsAccessoriesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  gadgetsAccessoriesHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  gadgetsAccessoriesIconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,228,230,0.95)",
    borderWidth: 1,
    borderColor: "rgba(240,128,128,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  gadgetsAccessoriesHeaderTitles: {
    flex: 1,
    minWidth: 0,
  },
  gadgetsAccessoriesKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#9A3412",
    marginBottom: 4,
  },
  gadgetsAccessoriesHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: "#C2410C",
    letterSpacing: -0.3,
  },
  gadgetsAccessoriesTagline: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#57534E",
    lineHeight: 16,
  },
  gadgetsAccessoriesHeaderBadge: {
    backgroundColor: "rgba(254,215,170,0.85)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(234,88,12,0.35)",
  },
  gadgetsAccessoriesHeaderBadgeText: {
    color: "#C2410C",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  gadgetsQuickLinksContent: {
    paddingBottom: 12,
    gap: 8,
    alignItems: "center",
  },
  gadgetsQuickLinkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(240,128,128,0.55)",
  },
  gadgetsQuickLinkChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C2410C",
  },
  gadgetsQuickLinkChipActive: {
    backgroundColor: "#FECACA",
    borderColor: "#F08080",
  },
  gadgetsQuickLinkChipTextActive: {
    color: "#7F1D1D",
  },
  gadgetsSubcategoriesShell: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: -4,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  gadgetsSubcategoriesBorderGlow: {
    borderRadius: 22,
    padding: 2,
  },
  gadgetsSubcategoriesGradientFill: {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  gadgetsSubcategoriesNoise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.35)",
    opacity: 0.45,
  },
  gadgetsSubcategoriesAccentBar: {
    position: "absolute",
    left: 0,
    top: 24,
    bottom: 24,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "rgba(248,113,113,0.75)",
  },
  gadgetsSubcategoriesInner: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  gadgetsSubcategoriesTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingRight: 4,
  },
  gadgetsSubcategoriesIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(240,128,128,0.5)",
  },
  gadgetsSubcategoriesTitleTextCol: {
    flex: 1,
    minWidth: 0,
  },
  gadgetsSubcategoriesEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "#EA580C",
    marginBottom: 4,
  },
  gadgetsSubcategoriesTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  gadgetsSubcategoriesDivider: {
    marginTop: 12,
    marginBottom: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(240,128,128,0.4)",
  },
  gadgetsSubcategoriesScroll: {
    paddingBottom: 6,
    gap: 12,
    alignItems: "flex-start",
  },
  gadgetsSubcategoryCard: {
    width: 108,
    marginRight: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  gadgetsSubcategoryCardGlass: {
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#F08080",
    alignItems: "center",
  },
  gadgetsSubcategoryImageWrap: {
    width: "100%",
    height: 76,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFF5F5",
  },
  gadgetsSubcategoryImage: {
    width: "100%",
    height: "100%",
  },
  gadgetsSubcategoryImageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  gadgetsSubcategoryLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    lineHeight: 13,
    letterSpacing: 0.2,
  },
  gadgetsHighlightStripTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: "#C2410C",
    marginBottom: 10,
    marginTop: 4,
  },
  gadgetsHighlightScrollContent: {
    paddingBottom: 4,
    gap: 10,
    alignItems: "stretch",
  },
  gadgetsHighlightTile: {
    position: "relative",
    width: 132,
    height: 168,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "#FFE4E6",
    borderWidth: 1,
    borderColor: "rgba(240,128,128,0.55)",
  },
  /** Plain View + width/height 100% Image — absoluteFill on Image inside TouchableOpacity often renders blank on Android. */
  gadgetsHighlightImageWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  gadgetsHighlightImage: {
    width: "100%",
    height: "100%",
  },
  gadgetsHighlightGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,182,177,0.28)",
  },
  gadgetsHighlightLabel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#1f2937",
    letterSpacing: 0.2,
  },
  splitShowcaseSection: {
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 0,
    backgroundColor: "#eef7f3",
    borderWidth: 1,
    borderColor: "#cfe5dc",
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: "hidden",
    position: "relative",
  },
  splitShowcaseBgImage: {
    opacity: 0.12,
  },
  splitShowcaseTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(238,247,243,0.68)",
  },
  splitShowcaseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  splitShowcaseTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1d324e",
  },
  splitShowcaseBadge: {
    backgroundColor: "#d9ebe3",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#bfdccf",
  },
  splitShowcaseBadgeText: {
    color: "#1d324e",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  splitShowcaseRow: {
    flexDirection: "row",
    height: 400,
  },
  splitLeftPane: {
    width: "42%",
    height: "100%",
    borderRadius: 12,
    backgroundColor: "#dcebe5",
    marginRight: 8,
  },
  splitLeftPaneContent: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  splitLeftCard: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#bfdccf",
    backgroundColor: "#edf6f2",
  },
  splitLeftImage: {
    width: "100%",
    height: 110,
  },
  splitRightPane: {
    width: "56%",
    height: "100%",
    justifyContent: "flex-start",
  },
  splitProductCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fbfcfa",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#b8d4c6",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 10,
  },
  splitProductAccentBar: {
    width: 5,
    backgroundColor: "#ef7b1a",
  },
  splitProductCardMain: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 11,
    paddingBottom: 11,
    justifyContent: "flex-start",
  },
  splitProductCopyBlock: {
    flexGrow: 0,
    flexShrink: 0,
  },
  splitProductImageStage: {
    height: 168,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    marginBottom: 7,
  },
  splitProductImageBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#dfece4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c5ddd2",
  },
  splitProductImagePad: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  splitProductImage: {
    width: "100%",
    height: "100%",
  },
  splitProductDiscountRibbon: {
    position: "absolute",
    top: 10,
    right: 0,
    backgroundColor: "#c2410c",
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 12,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "#9a3412",
  },
  splitProductDiscountText: {
    color: "#fff7ed",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  splitProductTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d324e",
    lineHeight: 15,
    letterSpacing: -0.2,
  },
  splitProductRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  splitProductRatingPillValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803d",
  },
  splitProductRatingPillCount: {
    fontSize: 9,
    fontWeight: "600",
    color: "#4ade80",
  },
  splitProductPriceBlock: {
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#c5ddd2",
  },
  splitProductPriceLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  splitProductPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginTop: 3,
    gap: 8,
  },
  splitProductSalePrice: {
    fontSize: 17,
    fontWeight: "900",
    color: "#9a3412",
    letterSpacing: -0.3,
  },
  splitProductMrp: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  splitAddButton: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1d324e",
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  splitAddButtonText: {
    color: "#f7fbf9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  spotlightFooterAdSection: {
    marginHorizontal: 0,
    marginBottom: 16,
  },
  spotlightFooterAdCarousel: {
    width: "100%",
  },
  spotlightFooterAdInner: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
    minHeight: 142,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#3a342f",
    borderWidth: 1,
    borderColor: "#6c8494",
  },
  spotlightFooterAdExampleCol: {
    width: "52%",
    flexDirection: "column",
    padding: 0,
    backgroundColor: "#3a342f",
    borderRightWidth: 1,
    borderRightColor: "#6c8494",
  },
  spotlightFooterAdExampleFrame: {
    width: "100%",
    height: 132,
    overflow: "hidden",
    backgroundColor: "#3a342f",
    position: "relative",
  },
  spotlightFooterAdExampleImage: {
    width: "100%",
    height: "100%",
  },
  spotlightFooterAdNameOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  spotlightFooterAdNameText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.97)",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(45,40,36,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  spotlightFooterAdTextCol: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  spotlightFooterAdCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  spotlightFooterAdCtaText: {
    marginLeft: 6,
    color: "#f6c795",
    fontSize: 12,
    fontWeight: "800",
  },
  spotlightFooterAdBadge: {
    position: "absolute",
    top: 8,
    right: 10,
    backgroundColor: "rgba(58,52,47,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#6c8494",
  },
  spotlightFooterAdBadgeText: {
    color: "#f6c795",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  spotlightFooterAdTitle: {
    color: "#f6c795",
    fontSize: 15,
    fontWeight: "800",
  },
  spotlightFooterAdSubtitle: {
    marginTop: 2,
    color: "rgba(246,199,149,0.9)",
    fontSize: 11,
    fontWeight: "600",
  },
  spotlightFooterAdDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  spotlightFooterAdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    backgroundColor: "#c5cdd6",
  },
  spotlightFooterAdDotActive: {
    backgroundColor: "#ef7b1a",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  watchesEditorialSection: {
    marginHorizontal: 0,
    marginBottom: 12,
    overflow: "visible",
  },
  watchesEditorialGradient: {
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
    position: "relative",
    overflow: "hidden",
  },
  watchesHeroGridPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  watchesHeroGridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#8B4513",
  },
  watchesHeroGridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#8B4513",
  },
  watchesHeroTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 3,
    marginBottom: 10,
    zIndex: 1,
  },
  watchesHeroStage: {
    height: 200,
    marginBottom: 12,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  watchesHeroCenter: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  watchesHeroCenterImg: {
    width: "100%",
    height: "100%",
  },
  watchesHeroFloat: {
    position: "absolute",
    width: 64,
    height: 64,
    zIndex: 2,
  },
  watchesHeroFloatImg: {
    width: "100%",
    height: "100%",
  },
  watchesHeroFloatTL: {
    top: 8,
    left: 4,
  },
  watchesHeroFloatTR: {
    top: 12,
    right: 8,
  },
  watchesHeroFloatBL: {
    bottom: 16,
    left: 12,
  },
  watchesHeroFloatBR: {
    bottom: 12,
    right: 10,
  },
  watchesShopAllBtn: {
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 4,
    zIndex: 1,
  },
  watchesShopAllText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.3,
  },
  watchesShopAllUnderline: {
    marginTop: 2,
    height: 2,
    width: "100%",
    minWidth: 72,
    backgroundColor: "#111827",
    borderRadius: 1,
  },
  watchesShowcaseRowScroll: {
    flexGrow: 0,
  },
  watchesShowcaseGestureRoot: {
    width: "100%",
    flexGrow: 0,
  },
  watchesShowcaseRow: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
    backgroundColor: "#FADADD",
    alignItems: "flex-start",
  },
  watchesShowcaseCardOuter: {
    width: 132,
    marginRight: 10,
  },
  watchesShowcaseCardBorder: {
    borderRadius: 16,
    padding: 2,
  },
  watchesShowcaseCardFace: {
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 182,
  },
  watchesShowcaseCardImageWrap: {
    flexGrow: 1,
    minHeight: 108,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  watchesShowcaseCardProductImg: {
    width: "100%",
    height: 96,
  },
  watchesShowcaseCardTextWrap: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },
  watchesShowcaseCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 14,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  watchesShowcaseCardBrands: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.6,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  watchesShowcaseCardOffer: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "900",
    color: "#000000",
    textAlign: "center",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  watchesShowcaseCardOuterSelected: {
    shadowColor: "#C2410C",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  watchesCardSubcategoriesWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FADADD",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(194,65,12,0.15)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(194,65,12,0.12)",
    flexShrink: 0,
    zIndex: 2,
  },
  /** Nested horizontal ScrollView needs bounded height inside vertical ScrollView (Android). */
  watchesCardSubcategoriesHorizontalScroll: {
    minHeight: 118,
    flexGrow: 0,
  },
  watchesCardSubcategoriesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingRight: 8,
  },
  watchesCardSubcategoriesTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#431407",
    lineHeight: 18,
  },
  watchesCardSubcategoriesScroll: {
    gap: 10,
    alignItems: "flex-start",
    paddingBottom: 4,
    minHeight: 110,
  },
  watchesCardSubcategoryChip: {
    width: 92,
    marginRight: 10,
    alignItems: "center",
  },
  watchesCardSubcategoryThumb: {
    width: "100%",
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "rgba(194,65,12,0.35)",
  },
  watchesCardSubcategoryThumbImg: {
    width: "100%",
    height: "100%",
  },
  watchesCardSubcategoryLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 13,
  },
  finalUniqueSection: {
    marginHorizontal: 0,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d7e0e8",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  finalUniqueHeader: {
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  finalUniqueTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  finalUniqueTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  finalUniqueTitle: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  finalUniqueTitleLead: {
    color: "#1d324e",
  },
  finalUniqueTitleAccent: {
    color: "#ef7b1a",
  },
  finalUniqueTitleUnderline: {
    marginTop: 6,
    marginLeft: 50,
    width: 52,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#ef7b1a",
  },
  finalUniqueSubtitle: {
    marginTop: 8,
    color: "#4a5f78",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.15,
    lineHeight: 16,
  },
  finalUniqueViewAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff9f2",
    borderWidth: 1,
    borderColor: "#e8c4a8",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginTop: 2,
  },
  finalUniqueViewAllText: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  finalUniqueRow: {
    paddingLeft: 12,
    paddingRight: 4,
  },
  finalUniqueCard: {
    width: 156,
    marginRight: 8,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d9d9de",
    backgroundColor: "#fff9f2",
  },
  finalUniqueCardImage: {
    width: "100%",
    height: 112,
    backgroundColor: "#f1f1f5",
  },
  finalUniqueTagPill: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(29,50,78,0.92)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  finalUniqueTagText: {
    color: "#f6c795",
    fontSize: 10,
    fontWeight: "800",
  },
  finalUniqueCardContent: {
    paddingHorizontal: 9,
    paddingTop: 8,
    paddingBottom: 10,
  },
  finalUniqueCardTitle: {
    color: "#1d324e",
    fontSize: 13,
    fontWeight: "800",
  },
  finalUniqueCardSubtitle: {
    marginTop: 3,
    color: "#69798c",
    fontSize: 11,
    fontWeight: "600",
  },
});

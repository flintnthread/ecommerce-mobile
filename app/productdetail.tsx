import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  addProductToCart,
  addWishlistProductIfAbsent,
  loadCart,
  loadWishlist,
  toggleWishlistProduct,
} from "../lib/shopStorage";
import { normalizeWishlistApiRows } from "../lib/wishlistApi";
import {
  getCartUnitCount,
  parseCartApiError,
  postCartAdd,
  serverCartContainsVariant,
} from "../lib/cartServerApi";
import { parseWishlistApiError, postWishlistAdd } from "../lib/wishlistServerApi";
import { buildProductGalleryUris } from "../lib/pickProductImageUri";
import api, {
  productByIdPath,
  relatedProductsPath,
  productsByCategoryPath,
  WISHLIST_USER_PATH,
} from "../services/api";
import {
  fetchAddresses,
  setDefaultAddress,
  deleteAddress,
  createAddress,
  type ApiAddress,
  type CreateAddressPayload,
} from "../services/addresses";

type CatalogProduct = {
  id: string;
  name: string;
  images: any[];
  price: number;
  mrp: number;
  discount: string;
  rating: string;
  ratingCount: string;
  /** From API — unique variant `size` values for chips */
  sizeOptions?: string[];
  /** From API — unique variant `color` values for chips */
  colorOptions?: string[];
  /** From API - stock status (true if in stock, false if out of stock) */
  inStock?: boolean;
  /** From API - short description for quick product overview */
  shortDescription?: string;
  /** From API - product specifications (parsed from JSON or array) */
  specifications?: { [key: string]: string }[];
  /** Plain text (HTML stripped) for description block */
  descriptionPlain?: string;
  /** Parsed from API `features` JSON array */
  highlightBullets?: string[];
  /** e.g. Delivery in 3–7 days */
  deliveryNote?: string;
  sellerId?: number;
};

const L1 = require("../assets/images/look1.png");
const L2 = require("../assets/images/look2.png");
const L3 = require("../assets/images/look3.png");

const DEFAULT_PRODUCT_ID = "main";

/** Gallery for the default (featured) product */
const DEFAULT_PRODUCT_IMAGES = [L1, L2, L3, L1, L2, L3];

const DEFAULT_PRODUCT: CatalogProduct = {
  id: DEFAULT_PRODUCT_ID,
  name: "Floral Printed Cotton Dress",
  images: DEFAULT_PRODUCT_IMAGES,
  price: 1299,
  mrp: 2499,
  discount: "48% off",
  rating: "4.5",
  ratingCount: "2,345",
};

/** “You may also like” — each item opens its own detail when tapped */
const SUGGEST_PRODUCTS: CatalogProduct[] = [
  {
    id: "s1",
    name: "Printed summer dress",
    images: Array(6).fill(L1),
    price: 899,
    mrp: 1799,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "856",
  },
  {
    id: "s2",
    name: "Floral wrap dress",
    images: Array(6).fill(L2),
    price: 999,
    mrp: 1999,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "1,120",
  },
  {
    id: "s3",
    name: "Casual A-line dress",
    images: Array(6).fill(L3),
    price: 849,
    mrp: 1699,
    discount: "50% off",
    rating: "4.0",
    ratingCount: "642",
  },
  {
    id: "s4",
    name: "Weekend maxi dress",
    images: Array(6).fill(L1),
    price: 1199,
    mrp: 2399,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "2,010",
  },
  {
    id: "s5",
    name: "Office chic dress",
    images: Array(6).fill(L2),
    price: 1399,
    mrp: 2599,
    discount: "46% off",
    rating: "4.3",
    ratingCount: "1,445",
  },
  {
    id: "s6",
    name: "Evening mini dress",
    images: Array(6).fill(L3),
    price: 1099,
    mrp: 2199,
    discount: "50% off",
    rating: "4.5",
    ratingCount: "3,200",
  },
];

export const ALL_PRODUCTS = [
  {
    id: "ap1",
    name: "Printed cotton kurti",
    price: 699,
    mrp: 1399,
    discount: "50% off",
    rating: "4.3",
    ratingCount: "1,204",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "ap2",
    name: "Floral fit & flare dress",
    price: 1099,
    mrp: 2199,
    discount: "50% off",
    rating: "4.5",
    ratingCount: "3,580",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "ap3",
    name: "Solid A-line midi dress",
    price: 899,
    mrp: 1799,
    discount: "50% off",
    rating: "4.1",
    ratingCount: "980",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "ap4",
    name: "Party shimmer gown",
    price: 1799,
    mrp: 3499,
    discount: "48% off",
    rating: "4.6",
    ratingCount: "2,145",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "ap5",
    name: "Everyday straight kurta",
    price: 549,
    mrp: 999,
    discount: "45% off",
    rating: "4.0",
    ratingCount: "1,010",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "ap6",
    name: "Checked shirt dress",
    price: 1199,
    mrp: 2499,
    discount: "52% off",
    rating: "4.4",
    ratingCount: "3,012",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "ap7",
    name: "Women sports running t-shirt",
    price: 799,
    mrp: 1599,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "860",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "ap8",
    name: "Women gym leggings",
    price: 999,
    mrp: 1999,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "1,540",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "ap9",
    name: "Women running shoes",
    price: 2499,
    mrp: 4999,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "2,320",
    image: require("../assets/images/sports3.png"),
  },
  // Footwear hub — “All Related Footwear Products” (`footwear.tsx`) uses these ids
  {
    id: "p1",
    name: "Urban Lace Sneakers",
    price: 1299,
    mrp: 2599,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "1,120",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM.jpeg"),
  },
  {
    id: "p2",
    name: "Classic Block Heels",
    price: 1499,
    mrp: 2999,
    discount: "50% off",
    rating: "4.3",
    ratingCount: "2,045",
    image: require("../assets/footwearimages/hub-men-footwear.png"),
  },
  {
    id: "p3",
    name: "Comfy Travel Slip-ons",
    price: 999,
    mrp: 1999,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "876",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM (1).jpeg"),
  },
  {
    id: "p4",
    name: "Formal Derby Shoes",
    price: 1799,
    mrp: 3499,
    discount: "49% off",
    rating: "4.5",
    ratingCount: "1,540",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM.jpeg"),
  },
  {
    id: "p5",
    name: "Daily Run Sneakers",
    price: 1599,
    mrp: 3199,
    discount: "50% off",
    rating: "4.1",
    ratingCount: "990",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.33 AM.jpeg"),
  },
  {
    id: "p6",
    name: "Weekend Loafers",
    price: 1399,
    mrp: 2799,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "1,210",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.21.01 AM.jpeg"),
  },
  {
    id: "p7",
    name: "Kids School Comfort",
    price: 899,
    mrp: 1799,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "2,100",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM (2).jpeg"),
  },
  {
    id: "p8",
    name: "Kids Sport Runner",
    price: 1099,
    mrp: 2199,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "1,430",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.33 AM.jpeg"),
  },
  {
    id: "p9",
    name: "Party Spark Sandals",
    price: 949,
    mrp: 1899,
    discount: "50% off",
    rating: "4.3",
    ratingCount: "760",
    image: require("../assets/footwearimages/hub-men-footwear.png"),
  },
  {
    id: "p10",
    name: "Trail Boots",
    price: 1899,
    mrp: 3799,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "1,890",
    image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM.jpeg"),
  },
  // Sweets hub — “Popular sweet picks” (`sweets.tsx`)
  {
    id: "sw1",
    name: "Festive Gulab Jamun",
    price: 449,
    mrp: 899,
    discount: "50% off",
    rating: "4.7",
    ratingCount: "3,420",
    image: require("../assets/sweetsimages/jamun.jpg"),
  },
  {
    id: "sw2",
    name: "Boondi Laddu Pack",
    price: 399,
    mrp: 799,
    discount: "50% off",
    rating: "4.5",
    ratingCount: "1,890",
    image: require("../assets/sweetsimages/laddu.jpg"),
  },
  {
    id: "sw3",
    name: "Sununda Special",
    price: 329,
    mrp: 659,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "1,120",
    image: require("../assets/sweetsimages/sununda.jpg"),
  },
  {
    id: "sw4",
    name: "Dry Fruit Laddu",
    price: 549,
    mrp: 1099,
    discount: "50% off",
    rating: "4.8",
    ratingCount: "2,010",
    image: require("../assets/sweetsimages/dry fruit laddu.jpg"),
  },
  {
    id: "sw5",
    name: "Milk Kalakand",
    price: 479,
    mrp: 959,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "980",
    image: require("../assets/sweetsimages/48.png"),
  },
  {
    id: "sw6",
    name: "Assorted Mithai Box",
    price: 899,
    mrp: 1599,
    discount: "44% off",
    rating: "4.7",
    ratingCount: "2,560",
    image: require("../assets/sweetsimages/49.png"),
  },
  {
    id: "sw7",
    name: "Signature Asvi Collection",
    price: 649,
    mrp: 1299,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "1,340",
    image: require("../assets/sweetsimages/Asvi.png"),
  },
];

function mapApiRelatedProductToCatalog(p: any): CatalogProduct {
  const uris = buildProductGalleryUris(p, (pathOrUrl: string) => {
    const raw = String(pathOrUrl ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!apiBase) return raw;
    return `${apiBase}/${raw.replace(/^\/+/, "")}`;
  });

  const images = Array.isArray(p?.images) 
    ? p.images.map((img: any) => ({ uri: img.imageUrl || img.imagePath }))
    : [...DEFAULT_PRODUCT_IMAGES];

  // Extract price information
  const selling = Math.round(Number(p.finalPrice) || 0);
  const mrpRaw = Number(p.mrpPrice) || 0;
  const mrp = mrpRaw > 0 ? Math.round(mrpRaw) : Math.max(0, selling);
  const discountPct = Number(p.discountPercentage);
  const discount = discountPct && discountPct > 0
    ? `${discountPct.toFixed(1).replace(/\.0$/, "")}% off`
    : mrp > selling && mrp > 0
      ? `${Math.round(((mrp - selling) / mrp) * 100)}% off`
      : "Deal";

  // Debug logging to check values
  console.log('Related Product Price Debug:', {
    finalPrice: p.finalPrice,
    selling,
    mrpRaw,
    mrp,
    discountPct,
    discount
  });

  return {
    id: String(p.id),
    name: String(p.name ?? "Product").replace(/\u0019/g, "'").replace(/\u0018/g, "'").trim(),
    images,
    price: Math.max(0, selling),
    mrp: Math.max(Math.max(0, selling), mrp),
    discount,
    rating: typeof p.rating === "number" && Number.isFinite(p.rating)
      ? p.rating.toFixed(1)
      : "—",
    ratingCount: typeof p.ratingCount === "number" && Number.isFinite(p.ratingCount)
      ? String(p.ratingCount)
      : "New",
  };
}

function mapApiCategoryProductToCatalog(p: any): CatalogProduct {
  const uris = buildProductGalleryUris(p, (pathOrUrl: string) => {
    const raw = String(pathOrUrl ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!apiBase) return raw;
    return `${apiBase}/${raw.replace(/^\/+/, "")}`;
  });

  const images = Array.isArray(p?.images) 
    ? p.images.map((img: any) => ({ uri: img.imageUrl || img.imagePath }))
    : [...DEFAULT_PRODUCT_IMAGES];

  // Extract price information from variants
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  const v = variants[0];
  const selling = Math.round(Number(v?.sellingPrice) || 0);
  const mrpRaw = Number(v?.mrpPrice) || 0;
  const mrp = mrpRaw > 0 ? Math.round(mrpRaw) : Math.max(0, selling);
  const discountPct = Number(v?.discountPercentage);
  const discount = discountPct && discountPct > 0
    ? `${discountPct.toFixed(1).replace(/\.0$/, "")}% off`
    : mrp > selling && mrp > 0
      ? `${Math.round(((mrp - selling) / mrp) * 100)}% off`
      : "Deal";

  return {
    id: String(p.id),
    name: String(p.name ?? "Product").replace(/\u0019/g, "'").replace(/\u0018/g, "'").trim(),
    images,
    price: Math.max(0, selling),
    mrp: Math.max(Math.max(0, selling), mrp),
    discount,
    rating: typeof p.rating === "number" && Number.isFinite(p.rating)
      ? p.rating.toFixed(1)
      : "—",
    ratingCount: typeof p.ratingCount === "number" && Number.isFinite(p.ratingCount)
      ? String(p.ratingCount)
      : "New",
  };
}

function getCatalogProduct(id?: string | string[] | null): CatalogProduct {
  const raw = Array.isArray(id) ? id[0] : id;
  const pid = typeof raw === "string" ? raw.trim() : "";
  if (!pid || pid === DEFAULT_PRODUCT_ID) {
    return DEFAULT_PRODUCT;
  }
  const fromSuggest = SUGGEST_PRODUCTS.find((p) => p.id === pid);
  if (fromSuggest) return fromSuggest;
  const fromAll = ALL_PRODUCTS.find((p) => p.id === pid);
  if (fromAll) {
    return {
      id: fromAll.id,
      name: fromAll.name,
      images: Array(6).fill(fromAll.image),
      price: fromAll.price,
      mrp: fromAll.mrp,
      discount: fromAll.discount,
      rating: fromAll.rating,
      ratingCount: fromAll.ratingCount,
    };
  }
  return DEFAULT_PRODUCT;
}

function stripHtml(html: string): string {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFeatureBullets(raw: unknown): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    const lines = parsed.map((x) => String(x ?? "").trim()).filter(Boolean);
    return lines.length ? lines : undefined;
  } catch {
    return undefined;
  }
}

function mapApiProductDetailToCatalog(
  p: any,
  resolveAsset: (pathOrUrl: string) => string
): CatalogProduct {
  const uris = buildProductGalleryUris(p, resolveAsset);
  const images =
    uris.length > 0 ? uris.map((u) => ({ uri: u })) : [...DEFAULT_PRODUCT_IMAGES];

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
      (x: any) =>
        x &&
        (typeof x.sellingPrice === "number" ||
          typeof x.mrpPrice === "number" ||
          typeof x.sellingPrice === "string" ||
          typeof x.mrpPrice === "string")
    ) ?? variants[0];
  const selling = Math.round(num(v?.sellingPrice) ?? 0);
  const mrpRaw = num(v?.mrpPrice);
  const mrp = mrpRaw != null && mrpRaw > 0 ? Math.round(mrpRaw) : Math.max(0, selling);
  const discountPct = num(v?.discountPercentage);
  const discount =
    discountPct != null && Number.isFinite(discountPct) && discountPct > 0
      ? `${Number(discountPct).toFixed(1).replace(/\.0$/, "")}% off`
      : mrp > selling && mrp > 0
        ? `${Math.round(((mrp - selling) / mrp) * 100)}% off`
        : "Deal";

  const sizeSet = new Set<string>();
  const colorSet = new Set<string>();
  for (const row of variants) {
    const sz = String((row as any)?.size ?? "").trim();
    if (sz) sizeSet.add(sz);
    const cl = String((row as any)?.color ?? "").trim();
    if (cl) colorSet.add(cl);
  }
  const sizeOptions = [...sizeSet].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  const colorOptions = [...colorSet].sort();

  // Check if any variant is in stock
  const inStock = variants.some((variant: any) => {
    const stock = variant?.stock;
    const quantity = variant?.quantity;
    const available = variant?.available;
    
    // Check various possible stock field names
    if (typeof stock === "number") return stock > 0;
    if (typeof quantity === "number") return quantity > 0;
    if (typeof available === "boolean") return available;
    if (typeof stock === "boolean") return stock;
    
    // Default to true if no stock info is available
    return true;
  });

  const rating =
    typeof p?.rating === "number" && Number.isFinite(p.rating)
      ? p.rating.toFixed(1)
      : typeof p?.averageRating === "number" && Number.isFinite(p.averageRating)
        ? p.averageRating.toFixed(1)
        : "—";
  const ratingCountRaw =
    p?.ratingCount ?? p?.reviewCount ?? p?.reviewsCount ?? p?.rating_count;
  const ratingCount =
    typeof ratingCountRaw === "number" && Number.isFinite(ratingCountRaw)
      ? String(ratingCountRaw)
      : typeof ratingCountRaw === "string" && ratingCountRaw.trim()
        ? ratingCountRaw.trim()
        : "New";

  const descShort = stripHtml(String(p?.shortDescription ?? ""));
  const descLong = stripHtml(String(p?.description ?? ""));
  const descriptionPlain =
    (descLong.length >= descShort.length ? descLong : descShort) || descLong || descShort;

  // Parse specifications from API response
  const specifications = (() => {
    const specs = p?.specifications;
    
    // If specifications is already an array of objects with name-value format
    if (Array.isArray(specs)) {
      return specs.filter(spec => 
        spec && typeof spec === 'object' && spec.name && spec.value
      );
    }
    
    // If specifications is a JSON string
    if (typeof specs === 'string' && specs.trim()) {
      try {
        const parsed = JSON.parse(specs);
        if (Array.isArray(parsed)) {
          return parsed.filter(spec => 
            spec && typeof spec === 'object' && spec.name && spec.value
          );
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
    
    // Extract specifications from other possible fields
    const extractedSpecs: { [key: string]: string }[] = [];
    
    // Check for common specification fields
    const commonSpecs = [
      'material', 'fabric', 'brand', 'model', 'weight', 'dimensions',
      'care', 'washCare', 'origin', 'fit', 'style', 'pattern',
      'sleeve', 'neck', 'length', 'occasion', 'season'
    ];
    
    for (const spec of commonSpecs) {
      const value = p?.[spec];
      if (value && typeof value === 'string' && value.trim()) {
        extractedSpecs.push({ [spec]: value.trim() });
      }
    }
    
    return extractedSpecs.length > 0 ? extractedSpecs : undefined;
  })();

  const deliveryNote =
    typeof p?.deliveryTimeMin === "number" &&
    typeof p?.deliveryTimeMax === "number" &&
    Number.isFinite(p.deliveryTimeMin) &&
    Number.isFinite(p.deliveryTimeMax)
      ? `Delivery in ${p.deliveryTimeMin}–${p.deliveryTimeMax} days`
      : undefined;

  const bullets = parseFeatureBullets(p?.features);

  return {
    id: String(p.id),
    name: String(p.name ?? "Product")
      .replace(/\u0019/g, "'")
      .replace(/\u0018/g, "'")
      .trim(),
    images,
    price: Math.max(0, selling),
    mrp: Math.max(Math.max(0, selling), mrp),
    discount,
    rating,
    ratingCount,
    sizeOptions: sizeOptions.length ? sizeOptions : undefined,
    colorOptions: colorOptions.length ? colorOptions : undefined,
    inStock,
    shortDescription: descShort || undefined,
    specifications,
    descriptionPlain: descriptionPlain || undefined,
    highlightBullets: bullets,
    deliveryNote,
    sellerId: typeof p?.sellerId === "number" && Number.isFinite(p.sellerId) ? p.sellerId : undefined,
  };
}

/** Resolve backend variant id for wishlist add/remove (matches size/color chips). */
function findVariantRowForWishlist(
  api: any,
  size: string | null,
  color: string | null
): { id: number } | null {
  const variants = Array.isArray(api?.variants) ? api.variants : [];
  if (variants.length === 0) return null;
  const trimmedSize = size?.trim() ?? "";
  const trimmedColor = color?.trim() ?? "";
  if (trimmedSize || trimmedColor) {
    const match = variants.find((row: any) => {
      if (!row) return false;
      const sz = String(row.size ?? "").trim();
      const cl = String(row.color ?? "").trim();
      const sizeOk = !trimmedSize || sz === trimmedSize;
      const colorOk = !trimmedColor || cl === trimmedColor;
      return sizeOk && colorOk;
    });
    if (match) {
      const id = Math.floor(Number(match.id ?? match.variantId));
      return Number.isFinite(id) && id > 0 ? { id } : null;
    }
  }
  const fallback =
    variants.find((x: any) => {
      const st = x?.stock;
      if (typeof st === "number") return st > 0;
      return x?.inStock !== false;
    }) ?? variants[0];
  const id = Math.floor(Number(fallback?.id ?? fallback?.variantId));
  return Number.isFinite(id) && id > 0 ? { id } : null;
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProductDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productIdRaw = params.id;
  const productId = Array.isArray(productIdRaw) ? productIdRaw[0] : productIdRaw;

  const numericProductId = useMemo(() => {
    const s = String(productId ?? "").trim();
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [productId]);

  const [apiDetail, setApiDetail] = useState<any | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const getDetailAssetUriFromApiPath = useCallback((pathOrUrl: string): string => {
    const raw = String(pathOrUrl ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!apiBase) return raw;
    return `${apiBase}/${raw.replace(/^\/+/, "")}`;
  }, []);

  useEffect(() => {
    if (!numericProductId) {
      setApiDetail(null);
      setApiError(null);
      setApiLoading(false);
      return;
    }
    let cancelled = false;
    setApiLoading(true);
    setApiError(null);
    setApiDetail(null);
    (async () => {
      try {
        const { data } = await api.get(productByIdPath(numericProductId));
        if (cancelled) return;
        if (data && typeof (data as any).id === "number") setApiDetail(data);
        else setApiError("Invalid product response.");
      } catch {
        if (!cancelled) setApiError("Could not load this product.");
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [numericProductId]);

  // Fetch related products when current product is loaded
  useEffect(() => {
    if (!numericProductId) {
      setRelatedProducts([]);
      return;
    }
    
    let cancelled = false;
    setRelatedLoading(true);
    (async () => {
      try {
        const { data } = await api.get(relatedProductsPath(numericProductId));
        if (cancelled) return;
        if (Array.isArray(data)) {
          setRelatedProducts(data);
        } else {
          setRelatedProducts([]);
        }
      } catch {
        setRelatedProducts([]);
      } finally {
        if (!cancelled) setRelatedLoading(false);
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [numericProductId]);

  // Fetch category products based on current product's category
  useEffect(() => {
    if (!apiDetail || !apiDetail.categoryId) {
      setCategoryProducts([]);
      return;
    }
    
    let cancelled = false;
    setCategoryLoading(true);
    (async () => {
      try {
        const { data } = await api.get(productsByCategoryPath(apiDetail.categoryId));
        if (cancelled) return;
        
        // Handle paginated response with content array
        if (data && data.content && Array.isArray(data.content)) {
          setCategoryProducts(data.content);
        } else if (Array.isArray(data)) {
          setCategoryProducts(data);
        } else {
          setCategoryProducts([]);
        }
      } catch {
        setCategoryProducts([]);
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [apiDetail]);

  const product = useMemo(() => {
    if (apiDetail && typeof apiDetail.id === "number") {
      return mapApiProductDetailToCatalog(apiDetail, getDetailAssetUriFromApiPath);
    }
    return getCatalogProduct(productId);
  }, [apiDetail, productId, getDetailAssetUriFromApiPath]);

  const isApiDetailLoading = Boolean(numericProductId && apiLoading);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [hasAddedToCart, setHasAddedToCart] = useState(false);
  const [hasCountedWishlist, setHasCountedWishlist] = useState(false);
  const [isSizeChartVisible, setIsSizeChartVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddressFormVisible, setIsAddressFormVisible] = useState(false);
  // Delivery addresses state
  const [savedAddresses, setSavedAddresses] = useState<ApiAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  
  // Form state for new address
  const [newAddressName, setNewAddressName] = useState("");
  const [newAddressPhone, setNewAddressPhone] = useState("");
  const [newAddressEmail, setNewAddressEmail] = useState("");
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressState, setNewAddressState] = useState("");
  const [newAddressPincode, setNewAddressPincode] = useState("");
  const [newAddressType, setNewAddressType] = useState<"home" | "work" | "other">("home");
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [reviews, setReviews] = useState<
    { id: string; user: string; rating: number; comment: string; date: string }[]
  >([
    {
      id: "r1",
      user: "Ananya",
      rating: 5,
      comment: "Fabric quality is great and colour is same as shown in images.",
      date: "2 days ago",
    },
    {
      id: "r2",
      user: "Meera",
      rating: 4,
      comment: "Perfect for office wear, fit is slightly loose but comfortable.",
      date: "1 week ago",
    },
    {
      id: "r3",
      user: "Kavya",
      rating: 4,
      comment: "Nice dress for the price. Length is just below the knee.",
      date: "3 weeks ago",
    },
  ]);

  const mainImage = product.images[activeImageIndex] ?? product.images[0];
  const sizeChoices = product.sizeOptions?.length ? product.sizeOptions : AVAILABLE_SIZES;

  const refreshCartAndWishlistState = useCallback(async () => {
    setCartCount(await getCartUnitCount());

    const token = (await AsyncStorage.getItem("token"))?.trim();

    if (
      token &&
      numericProductId != null &&
      apiDetail &&
      typeof apiDetail.id === "number"
    ) {
      const vrow = findVariantRowForWishlist(
        apiDetail,
        selectedSize,
        selectedColor
      );
      const vid = vrow?.id ?? null;
      if (vid != null && vid > 0) {
        setHasAddedToCart(
          await serverCartContainsVariant(numericProductId, vid)
        );
      } else {
        setHasAddedToCart(false);
      }
    } else {
      const cart = await loadCart();
      setHasAddedToCart(cart.some((l) => l.id === product.id));
    }

    const wishlist = await loadWishlist();

    if (
      token &&
      numericProductId != null &&
      apiDetail &&
      typeof apiDetail.id === "number"
    ) {
      try {
        const { data } = await api.get<unknown>(WISHLIST_USER_PATH);
        const rows = normalizeWishlistApiRows(data);
        setWishlistCount(rows.length);
        const vrow = findVariantRowForWishlist(
          apiDetail,
          selectedSize,
          selectedColor
        );
        const vid = vrow?.id ?? null;
        const listed =
          vid != null &&
          rows.some(
            (r) =>
              Math.floor(Number(r.productId)) === numericProductId &&
              Math.floor(Number(r.variantId)) === vid
          );
        setIsWishlisted(listed);
        setHasCountedWishlist(listed);
        return;
      } catch {
        /* fall through to local wishlist */
      }
    }

    setWishlistCount(wishlist.length);
    const wish = wishlist.some((l) => l.id === product.id);
    setIsWishlisted(wish);
    setHasCountedWishlist(wish);
  }, [
    product.id,
    numericProductId,
    apiDetail,
    selectedSize,
    selectedColor,
  ]);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setSearchQuery("");
    void refreshCartAndWishlistState();
  }, [productId, apiDetail?.id]);

  useEffect(() => {
    void refreshCartAndWishlistState();
  }, [selectedSize, selectedColor, refreshCartAndWishlistState]);

  useEffect(() => {
    const n = product.images?.length ?? 0;
    if (n > 0 && activeImageIndex >= n) setActiveImageIndex(0);
  }, [product.images, activeImageIndex]);

  useFocusEffect(
    useCallback(() => {
      void refreshCartAndWishlistState();
    }, [refreshCartAndWishlistState])
  );

  const handleAddToBag = () => {
    if (hasAddedToCart) return;
    void (async () => {
      const token = (await AsyncStorage.getItem("token"))?.trim();
      if (
        token &&
        numericProductId != null &&
        apiDetail &&
        typeof apiDetail.id === "number"
      ) {
        const vrow = findVariantRowForWishlist(
          apiDetail,
          selectedSize,
          selectedColor
        );
        const vid = vrow?.id;
        if (!vid || vid <= 0) {
          Alert.alert(
            "Select size",
            "Please choose a size (and color if shown) before adding to your bag."
          );
          return;
        }
        try {
          await postCartAdd(numericProductId, vid, 1);
          await refreshCartAndWishlistState();
          setHasAddedToCart(true);
          Alert.alert("Added to cart", product.name);
        } catch (e: unknown) {
          Alert.alert(
            "Cart",
            parseCartApiError(e, "Could not add to cart. Please try again.")
          );
        }
        return;
      }
      await addProductToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
      });
      await refreshCartAndWishlistState();
      setHasAddedToCart(true);
      Alert.alert("Added to cart", product.name);
    })();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this product on F&T: ${product.name} for ₹${product.price.toLocaleString()}.`,
      });
    } catch (e) {
      // ignore share errors
    }
  };

  const openProductDetail = (id: string) => {
    router.push({ pathname: "/productdetail", params: { id } } as any);
  };

  // Load saved addresses
  const loadSavedAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      const addresses = await fetchAddresses();
      setSavedAddresses(addresses);
      
      // Set default address if available
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(String(defaultAddress.id));
      } else if (addresses.length > 0) {
        setSelectedAddressId(String(addresses[0].id));
      }
    } catch (error: any) {
      // Some environments may not expose `/api/addresses`; keep UI stable.
      const status = Number(error?.response?.status ?? 0);
      if (status === 404) {
        setSavedAddresses([]);
        setSelectedAddressId("");
      }
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  // Load addresses on component mount
  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Handle address selection
  const handleSelectAddress = useCallback((addressId: string) => {
    setSelectedAddressId(addressId);
  }, []);

  // Handle set default address
  const handleSetDefaultAddress = useCallback(async (addressId: string) => {
    try {
      await setDefaultAddress(Number(addressId));
      await loadSavedAddresses();
    } catch (error) {
      console.error("Failed to set default address:", error);
    }
  }, [loadSavedAddresses]);

  // Handle delete address
  const handleDeleteAddress = useCallback(async (addressId: string) => {
    try {
      await deleteAddress(Number(addressId));
      await loadSavedAddresses();
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  }, [loadSavedAddresses]);

  // Handle save new address
  const handleSaveAddress = useCallback(async () => {
    if (!newAddressName || !newAddressPhone || !newAddressLine1 || !newAddressCity || !newAddressState || !newAddressPincode) {
      return;
    }

    try {
      const payload: CreateAddressPayload = {
        name: newAddressName.trim(),
        email: newAddressEmail.trim(),
        phone: newAddressPhone.trim().replace(/\D/g, "").slice(0, 10),
        addressLine1: newAddressLine1.trim(),
        addressLine2: newAddressLine2.trim(),
        city: newAddressCity.trim(),
        state: newAddressState.trim(),
        country: "India",
        pincode: newAddressPincode.trim(),
        addressType: newAddressType,
        isDefault: savedAddresses.length === 0,
      };

      await createAddress(payload);
      await loadSavedAddresses();
      
      // Reset form
      setNewAddressName("");
      setNewAddressPhone("");
      setNewAddressEmail("");
      setNewAddressLine1("");
      setNewAddressLine2("");
      setNewAddressCity("");
      setNewAddressState("");
      setNewAddressPincode("");
      setNewAddressType("home");
      setIsAddressFormVisible(false);
    } catch (error) {
      console.error("Failed to save address:", error);
    }
  }, [newAddressName, newAddressPhone, newAddressEmail, newAddressLine1, newAddressLine2, newAddressCity, newAddressState, newAddressPincode, newAddressType, savedAddresses.length, loadSavedAddresses]);

  // Get current selected address
  const currentAddress = useMemo(() => {
    if (!selectedAddressId) return null;
    const address = savedAddresses.find(addr => String(addr.id) === selectedAddressId);
    if (!address) return null;
    
    const addressLine = [address.addressLine1, address.addressLine2].filter(Boolean).join(", ");
    return `${address.name} - ${addressLine}, ${address.city} - ${address.pincode}`;
  }, [savedAddresses, selectedAddressId]);


  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>

        <View style={styles.headerSearchWrapper}>
          <TextInput
            placeholder="Search in product"
            placeholderTextColor="#69798c"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInputHeader}
          />
        </View>

        <View style={styles.headerRight}>
          <View style={styles.headerIconWrapper}>
            <TouchableOpacity
              onPress={() => {
                router.push("/wishlist");
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="heart-outline"
                size={22}
                color="#1d324e"
              />
            </TouchableOpacity>
            {wishlistCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{wishlistCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerIconWrapper}>
            <TouchableOpacity
              onPress={() => {
                router.push("/cart");
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-outline" size={22} color="#1d324e" />
            </TouchableOpacity>
            {cartCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {apiError && numericProductId ? (
          <View style={styles.apiErrorBanner}>
            <Text style={styles.apiErrorText}>{apiError}</Text>
          </View>
        ) : null}

        {/* MAIN IMAGE */}
        <View style={styles.mainImageWrapper}>
          {isApiDetailLoading ? (
            <View style={styles.mainImageLoading}>
              <ActivityIndicator size="large" color="#ef7b1a" />
            </View>
          ) : (
            <Image source={mainImage} style={styles.mainImage} />
          )}
        </View>

        {/* THUMBNAILS ROW */}
        {!isApiDetailLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {product.images.map((img, index) => {
              const isActive = index === activeImageIndex;
              return (
                <TouchableOpacity
                  key={`${product.id}-thumb-${index}`}
                  style={[
                    styles.thumbnailWrapper,
                    isActive && styles.thumbnailWrapperActive,
                  ]}
                  onPress={() => setActiveImageIndex(index)}
                  activeOpacity={0.8}
                >
                  <Image source={img} style={styles.thumbnailImage} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {/* TEXT BLOCK */}
        <View style={styles.detailBlock}>
          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrent}>
              ₹{product.price.toLocaleString()}
            </Text>
            <Text style={styles.priceMrp}>₹{product.mrp.toLocaleString()}</Text>
            <Text style={styles.priceDiscount}>{product.discount}</Text>
          </View>

          {/* STOCK STATUS */}
          <View style={styles.stockRow}>
            <Ionicons
              name={product.inStock !== false ? "checkmark-circle" : "close-circle"}
              size={14}
              color={product.inStock !== false ? "#10893E" : "#DC2626"}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.stockText,
              product.inStock !== false ? styles.stockTextInStock : styles.stockTextOutOfStock
            ]}>
              {product.inStock !== false ? "In stock" : "Out of stock"}
            </Text>
          </View>

          {/* SHORT DESCRIPTION */}
          {product.shortDescription && (
            <View style={styles.shortDescriptionContainer}>
              <Text style={styles.shortDescriptionText}>
                {product.shortDescription}
              </Text>
            </View>
          )}

          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Ionicons
                name="star"
                size={10}
                color="#FFFFFF"
                style={{ marginLeft: 2 }}
              />
            </View>
            <Text style={styles.ratingCount}>{product.ratingCount} ratings</Text>
          </View>
        </View>

        {/* DELIVERY ADDRESS & BENEFITS */}
        <View style={styles.sectionBlock}>
          <View style={styles.addressRow}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Deliver to
            </Text>
            <TouchableOpacity
              style={styles.addressChangeButton}
              activeOpacity={0.75}
              onPress={() => setIsAddressFormVisible(true)}
            >
              <Text style={styles.addressChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
          
          {addressesLoading ? (
            <View style={styles.addressLoadingContainer}>
              <ActivityIndicator size="small" color="#ef7b1a" />
              <Text style={styles.addressLoadingText}>Loading addresses...</Text>
            </View>
          ) : savedAddresses.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addressScrollContainer}
            >
              {savedAddresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddressId === String(address.id) && styles.addressCardSelected
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handleSelectAddress(String(address.id))}
                >
                  <View style={styles.addressCardHeader}>
                    <Text style={styles.addressCardName}>{address.name}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressCardLine} numberOfLines={2}>
                    {[address.addressLine1, address.addressLine2].filter(Boolean).join(", ")}
                  </Text>
                  <Text style={styles.addressCardCity}>
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                  <View style={styles.addressCardActions}>
                    {!address.isDefault && (
                      <TouchableOpacity
                        style={styles.setDefaultButton}
                        onPress={() => handleSetDefaultAddress(String(address.id))}
                      >
                        <Text style={styles.setDefaultButtonText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteAddressButton}
                      onPress={() => handleDeleteAddress(String(address.id))}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noAddressContainer}>
              <Text style={styles.noAddressText}>No saved addresses</Text>
              <TouchableOpacity
                style={styles.addFirstAddressButton}
                onPress={() => setIsAddressFormVisible(true)}
              >
                <Text style={styles.addFirstAddressText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {currentAddress && (
            <Text style={styles.addressText} numberOfLines={2}>
              {currentAddress}
            </Text>
          )}
          {product.deliveryNote ? (
            <View style={styles.deliveryEtaRow}>
              <Ionicons name="time-outline" size={14} color="#10893E" style={{ marginRight: 6 }} />
              <Text style={styles.deliveryEtaText}>{product.deliveryNote}</Text>
            </View>
          ) : null}
          <View style={styles.deliveryPillRow}>
            <View style={styles.deliveryPill}>
              <Ionicons
                name="refresh-outline"
                size={12}
                color="#10893E"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.deliveryPillText}>7 days return</Text>
            </View>
            <View style={styles.deliveryPill}>
              <Ionicons
                name="cash-outline"
                size={12}
                color="#10893E"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.deliveryPillText}>Cash on delivery</Text>
            </View>
          </View>
        </View>

        {/* SIZE SELECTOR */}
        <View style={styles.sectionBlock}>
          <View style={styles.sizeHeaderRow}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Select size
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsSizeChartVisible(true)}
            >
              <Text style={styles.sizeChartText}>Size Chart</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sizeRow}>
            {sizeChoices.map((size) => {
              const isActive = selectedSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    isActive && styles.sizeChipActive,
                  ]}
                  onPress={() => setSelectedSize(size)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.sizeChipText,
                      isActive && styles.sizeChipTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sizeActionsRow}>
            <View style={styles.sizeActionButtonsRow}>
              <TouchableOpacity
                style={styles.inlineWishlistButton}
                activeOpacity={0.85}
                onPress={() => {
                  if (isWishlisted) {
                    router.push("/wishlist");
                  } else {
                    void (async () => {
                      if (numericProductId != null) {
                        const token = (await AsyncStorage.getItem("token"))?.trim();
                        if (!token) {
                          Alert.alert(
                            "Sign in required",
                            "Please log in to save items to your wishlist."
                          );
                          return;
                        }
                        if (!apiDetail || typeof apiDetail.id !== "number") {
                          Alert.alert(
                            "Please wait",
                            "Product details are still loading."
                          );
                          return;
                        }
                        const vrow = findVariantRowForWishlist(
                          apiDetail,
                          selectedSize,
                          selectedColor
                        );
                        const vid = vrow?.id;
                        if (!vid || vid <= 0) {
                          Alert.alert(
                            "Select size",
                            "Please choose a size (and color if shown) before adding to your wishlist."
                          );
                          return;
                        }
                        try {
                          await postWishlistAdd(numericProductId, vid);
                          await addWishlistProductIfAbsent({
                            id: String(numericProductId),
                            name: product.name,
                            price: product.price,
                            mrp: product.mrp,
                          });
                          Alert.alert("Added to wishlist", product.name);
                          await refreshCartAndWishlistState();
                        } catch (e: unknown) {
                          Alert.alert(
                            "Wishlist",
                            parseWishlistApiError(
                              e,
                              "Could not add to wishlist. Please try again."
                            )
                          );
                        }
                        return;
                      }
                      await toggleWishlistProduct({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        mrp: product.mrp,
                      });
                      await refreshCartAndWishlistState();
                    })();
                  }
                }}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={18}
                  color={isWishlisted ? "red" : "#1d324e"}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.inlineWishlistText}>
                  {isWishlisted ? "Go to wishlist" : "Wishlist"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineShareButton}
                activeOpacity={0.85}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color="#1d324e"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.inlineShareText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineAddToBagButton}
                activeOpacity={0.9}
                onPress={() => {
                  if (hasAddedToCart) {
                    router.push("/cart");
                  } else {
                    handleAddToBag();
                  }
                }}
              >
                <Ionicons name="bag-outline" size={18} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.inlineAddToBagText}>
                  {hasAddedToCart ? "Go to cart" : "Add to bag"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* COLOR SELECTOR */}
        {product.colorOptions && product.colorOptions.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Select color
            </Text>

            <View style={styles.colorRow}>
              {product.colorOptions.map((color) => {
                const isActive = selectedColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorChip,
                      isActive && styles.colorChipActive,
                    ]}
                    onPress={() => setSelectedColor(color)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.colorChipText,
                        isActive && styles.colorChipTextActive,
                      ]}
                    >
                      {color}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* SOLD BY */}
        <View style={styles.sectionBlock}>
          <TouchableOpacity
            style={styles.soldByCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/sellerstore",
                params: { name: "@ SHIV CREATION", rating: "4.1" },
              } as any)
            }
            accessibilityRole="button"
            accessibilityLabel="Open seller store"
          >
            <View style={styles.soldByLeft}>
              <Text style={styles.soldByLabel}>Sold by</Text>
              <Text style={styles.soldByName} numberOfLines={1}>
                {product.sellerId != null
                  ? `Seller #${product.sellerId}`
                  : "@ SHIV CREATION"}
              </Text>
            </View>

            <View style={styles.soldByRight}>
              <View style={styles.soldByRatingPill}>
                <Text style={styles.soldByRatingText}>4.1</Text>
                <Ionicons name="star" size={14} color="#0F766E" style={{ marginLeft: 4 }} />
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* REVIEWS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            Reviews
          </Text>
          {(reviewsExpanded ? reviews : reviews.slice(0, 2)).map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewUser}>{rev.user}</Text>
                <View style={styles.reviewRatingBadge}>
                  <Text style={styles.reviewRatingText}>{rev.rating}</Text>
                  <Ionicons
                    name="star"
                    size={10}
                    color="#FFFFFF"
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>
              <Text style={styles.reviewDate}>{rev.date}</Text>
              <Text style={styles.reviewComment}>{rev.comment}</Text>
              <View style={styles.reviewImageRow}>
                <View style={styles.reviewImagePlaceholder} />
                <View style={styles.reviewImagePlaceholder} />
              </View>
            </View>
          ))}
          {reviews.length > 2 && (
            <TouchableOpacity
              style={styles.viewAllReviewsButton}
              activeOpacity={0.75}
              onPress={() => setReviewsExpanded((prev) => !prev)}
            >
              <Text style={styles.viewAllReviewsText}>
                {reviewsExpanded ? "See less" : "View all reviews"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PRODUCT HIGHLIGHTS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelSecondary]}>
            Product highlights
          </Text>
          {product.highlightBullets?.length ? (
            product.highlightBullets.map((line, idx) => (
              <View key={`hl-${idx}`} style={styles.highlightRow}>
                <View style={styles.highlightBullet} />
                <Text style={styles.highlightText}>{line}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.highlightRow}>
                <View style={styles.highlightBullet} />
                <Text style={styles.highlightText}>
                  Pure cotton fabric for all‑day comfort
                </Text>
              </View>
              <View style={styles.highlightRow}>
                <View style={styles.highlightBullet} />
                <Text style={styles.highlightText}>
                  A‑line silhouette ideal for casual and work wear
                </Text>
              </View>
              <View style={styles.highlightRow}>
                <View style={styles.highlightBullet} />
                <Text style={styles.highlightText}>
                  Model is 5'6&quot; and wearing size M
                </Text>
              </View>
              <View style={styles.highlightRow}>
                <View style={styles.highlightBullet} />
                <Text style={styles.highlightText}>
                  Machine wash, mild cycle, wash dark colours separately
                </Text>
              </View>
            </>
          )}
          
          {/* SEE MORE INFO BUTTON */}
          {product.descriptionPlain && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              activeOpacity={0.75}
              onPress={() => setDescriptionExpanded(!descriptionExpanded)}
            >
              <Text style={styles.seeMoreButtonText}>
                {descriptionExpanded ? "Show less info" : "See more info about product"}
              </Text>
              <Ionicons 
                name={descriptionExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#ef7b1a" 
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          )}
        </View>
 
        {/* PRODUCT DESCRIPTION (EXPANDABLE) */}
        {descriptionExpanded && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, styles.sectionLabelSecondary]}>
              Product Description
            </Text>
            {product.descriptionPlain && (
              <Text style={styles.descriptionPlainText}>
                {product.descriptionPlain}
              </Text>
            )}
            
            {/* SPECIFICATIONS */}
            {product.specifications && product.specifications.length > 0 && (
              <View style={styles.specificationsContainer}>
                <Text style={[styles.sectionLabel, styles.sectionLabelSecondary]}>
                  Specifications
                </Text>
                <View style={styles.specificationsList}>
                  {product.specifications.map((spec, index) => {
                    const name = spec.name;
                    const value = spec.value;
                    if (!name || !value) return null;
                    
                    return (
                      <View key={`spec-${index}`} style={styles.specificationItem}>
                        <Text style={styles.specificationKey}>
                          {name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Text>
                        <Text style={styles.specificationValue}>{value}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
         
        {/* YOU MAY ALSO LIKE */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            You'll Love These
          </Text>
          {relatedLoading ? (
            <View style={styles.relatedLoadingContainer}>
              <ActivityIndicator size="small" color="#ef7b1a" />
              <Text style={styles.relatedLoadingText}>Loading related products...</Text>
            </View>
          ) : relatedProducts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestRow}
            >
              {relatedProducts.map((item) => {
                const catalogItem = mapApiRelatedProductToCatalog(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.suggestCard}
                    activeOpacity={0.85}
                    onPress={() => openProductDetail(item.id)}
                  >
                    <View style={styles.suggestImageWrapper}>
                      <Image source={catalogItem.images[0]} style={styles.suggestImage} />
                    </View>
                    <Text style={styles.suggestTitle} numberOfLines={1}>
                      {catalogItem.name}
                    </Text>
                    <Text style={styles.suggestPrice}>
                      ₹{catalogItem.price.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.noRelatedText}>No related products found</Text>
          )}
        </View>

        {/* ALL PRODUCTS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            All products
          </Text>
          {categoryLoading ? (
            <View style={styles.relatedLoadingContainer}>
              <ActivityIndicator size="small" color="#ef7b1a" />
              <Text style={styles.relatedLoadingText}>Loading products...</Text>
            </View>
          ) : categoryProducts.length > 0 ? (
            <View style={styles.allProductsGrid}>
              {categoryProducts.map((item) => {
                const catalogItem = mapApiCategoryProductToCatalog(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.allProductCard}
                    activeOpacity={0.85}
                    onPress={() => openProductDetail(item.id)}
                  >
                    <View style={styles.allProductImageWrapper}>
                      <Image source={catalogItem.images[0]} style={styles.allProductImage} />
                    </View>
                    <Text style={styles.allProductName} numberOfLines={2}>
                      {catalogItem.name}
                    </Text>
                    <View style={styles.allProductPriceRow}>
                      <Text style={styles.allProductPrice}>
                        {catalogItem.price.toLocaleString()}
                      </Text>
                      <Text style={styles.allProductMrp}>
                        {catalogItem.mrp.toLocaleString()}
                      </Text>
                      <Text style={styles.allProductDiscount}>{catalogItem.discount}</Text>
                    </View>
                    <View style={styles.allProductRatingRow}>
                      <View style={styles.allProductRatingBadge}>
                        <Text style={styles.allProductRatingText}>{catalogItem.rating}</Text>
                        <Ionicons
                          name="star"
                          size={9}
                          color="#FFFFFF"
                          style={{ marginLeft: 2 }}
                        />
                      </View>
                      <Text style={styles.allProductRatingCount}>
                        ({catalogItem.ratingCount})
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noRelatedText}>No products found</Text>
          )}
        </View>
      </ScrollView>

      

      {/* SIZE CHART MODAL */}
      {isSizeChartVisible && (
        <View style={styles.sizeChartOverlay}>
          <View style={styles.sizeChartModal}>
            <View style={styles.sizeChartHeaderRow}>
              <Text style={styles.sizeChartTitle}>Size Chart</Text>
              <TouchableOpacity onPress={() => setIsSizeChartVisible(false)}>
                <Ionicons name="close" size={22} color="#333333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sizeChartSubTitle}>
              All measurements are in inches.
            </Text>

            <View style={styles.sizeChartTable}>
              <View style={[styles.sizeChartRow, styles.sizeChartRowHeader]}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  Size
                </Text>
                <Text style={styles.sizeChartCell}>Bust</Text>
                <Text style={styles.sizeChartCell}>Waist</Text>
                <Text style={styles.sizeChartCell}>Hip</Text>
              </View>

              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  S
                </Text>
                <Text style={styles.sizeChartCell}>32‑34</Text>
                <Text style={styles.sizeChartCell}>26‑28</Text>
                <Text style={styles.sizeChartCell}>34‑36</Text>
              </View>
              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  M
                </Text>
                <Text style={styles.sizeChartCell}>34‑36</Text>
                <Text style={styles.sizeChartCell}>28‑30</Text>
                <Text style={styles.sizeChartCell}>36‑38</Text>
              </View>
              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  L
                </Text>
                <Text style={styles.sizeChartCell}>36‑38</Text>
                <Text style={styles.sizeChartCell}>30‑32</Text>
                <Text style={styles.sizeChartCell}>38‑40</Text>
              </View>
              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  XL
                </Text>
                <Text style={styles.sizeChartCell}>38‑40</Text>
                <Text style={styles.sizeChartCell}>32‑34</Text>
                <Text style={styles.sizeChartCell}>40‑42</Text>
              </View>
            </View>

            <Text style={styles.sizeChartNote}>
              Tip: If you are in between two sizes, we recommend picking the
              larger size for comfort.
            </Text>
          </View>
        </View>
      )}

      {/* ADDRESS FORM MODAL (bottom sheet with extra top gap) */}
      {isAddressFormVisible && (
        <View style={styles.sizeChartOverlay}>
          <View style={styles.sizeChartModal}>
            <View style={styles.sizeChartHeaderRow}>
              <Text style={styles.sizeChartTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsAddressFormVisible(false)}>
                <Ionicons name="close" size={22} color="#333333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sizeChartSubTitle}>
                Enter your delivery address details
              </Text>

              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#999999"
                value={newAddressName}
                onChangeText={setNewAddressName}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#999999"
                value={newAddressPhone}
                onChangeText={setNewAddressPhone}
                keyboardType="phone-pad"
                style={styles.addressInput}
              />
              <TextInput
                placeholder="Email Address (Optional)"
                placeholderTextColor="#999999"
                value={newAddressEmail}
                onChangeText={setNewAddressEmail}
                keyboardType="email-address"
                style={styles.addressInput}
              />
              <TextInput
                placeholder="Address Line 1"
                placeholderTextColor="#999999"
                value={newAddressLine1}
                onChangeText={setNewAddressLine1}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="Address Line 2 (Optional)"
                placeholderTextColor="#999999"
                value={newAddressLine2}
                onChangeText={setNewAddressLine2}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="City"
                placeholderTextColor="#999999"
                value={newAddressCity}
                onChangeText={setNewAddressCity}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="State"
                placeholderTextColor="#999999"
                value={newAddressState}
                onChangeText={setNewAddressState}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="Pincode"
                placeholderTextColor="#999999"
                value={newAddressPincode}
                onChangeText={setNewAddressPincode}
                keyboardType="number-pad"
                style={styles.addressInput}
              />

              <View style={styles.addressTypeRow}>
                {(["home", "work", "other"] as const).map((type) => {
                  const isActive = newAddressType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.addressTypeChip,
                        isActive && styles.addressTypeChipActive,
                      ]}
                      onPress={() => setNewAddressType(type)}
                    >
                      <Text
                        style={[
                          styles.addressTypeChipText,
                          isActive && styles.addressTypeChipTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.addressSaveButton}
                activeOpacity={0.85}
                onPress={handleSaveAddress}
              >
                <Text style={styles.addressSaveButtonText}>Save Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
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
    backgroundColor: "#FFF7F0",
  },
  headerIconButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#f6c795",
  },
  searchInputHeader: {
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  headerIconWrapper: {
    marginLeft: 12,
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef7b1a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  headerBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  apiErrorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FECACA",
  },
  apiErrorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  mainImageLoading: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryEtaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  deliveryEtaText: {
    flex: 1,
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "600",
  },
  descriptionPlainText: {
    marginTop: 8,
    fontSize: 14,
    color: "#334155",
    lineHeight: 21,
  },
  shortDescriptionContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  shortDescriptionText: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    fontStyle: "italic",
  },
  specificationsContainer: {
    marginTop: 12,
  },
  specificationsList: {
    marginTop: 8,
  },
  specificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  specificationKey: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "600",
    flex: 0.4,
    marginRight: 8,
  },
  specificationValue: {
    fontSize: 13,
    color: "#ef7b1a",
    fontWeight: "500",
    flex: 0.6,
    textAlign: "right",
  },
  mainImageWrapper: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E5F0",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  relatedLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  relatedLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666666",
  },
  noRelatedText: {
    fontSize: 13,
    color: "#666666",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  thumbnailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 12,
  },
  thumbnailWrapper: {
    width: 52,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#E5E5F0",
    marginRight: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  thumbnailWrapperActive: {
    borderColor: "#ef7b1a",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailArrowWrapper: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  detailBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d324e",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceCurrent: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d324e",
    marginRight: 8,
  },
  priceMrp: {
    fontSize: 13,
    color: "#777777",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  priceDiscount: {
    fontSize: 13,
    color: "#10893E",
    fontWeight: "600",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  stockText: {
    fontSize: 13,
    fontWeight: "500",
  },
  stockTextInStock: {
    color: "#10893E",
  },
  stockTextOutOfStock: {
    color: "#DC2626",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  ratingCount: {
    fontSize: 11,
    color: "#555555",
  },
  sectionBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d324e",
    marginBottom: 8,
  },
  sectionLabelAccent: {
    color: "#ef7b1a",
  },
  sectionLabelSecondary: {
    color: "#79411c",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressText: {
    fontSize: 12,
    color: "#333333",
    marginTop: 4,
  },
  addressChangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ef7b1a",
  },
  addressChangeText: {
    fontSize: 11,
    color: "#ef7b1a",
    fontWeight: "600",
  },
  deliveryPillRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#E8F6EC",
    marginRight: 8,
  },
  deliveryPillText: {
    fontSize: 11,
    color: "#10893E",
    fontWeight: "600",
  },
  sizeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  sizeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sizeChip: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#CCCCCC",
    marginRight: 10,
    alignItems: "center",
  },
  sizeChipActive: {
    borderColor: "#ef7b1a",
    backgroundColor: "#FFEBD3",
  },
  sizeChipText: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
  },
  sizeChipTextActive: {
    color: "#1d324e",
  },
  colorRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  colorChip: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
    alignItems: "center",
  },
  colorChipActive: {
    borderColor: "#ef7b1a",
    backgroundColor: "#FFEBD3",
  },
  colorChipText: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
  },
  colorChipTextActive: {
    color: "#1d324e",
  },
  sizeChartText: {
    fontSize: 12,
    color: "#ef7b1a",
    fontWeight: "600",
  },
  sizeActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sizeChartTouch: {
    paddingVertical: 4,
  },
  sizeActionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineWishlistButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    marginRight: 8,
  },
  inlineWishlistText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  inlineShareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    marginRight: 8,
  },
  inlineShareText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  inlineAddToBagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#ef7b1a",
  },
  inlineAddToBagText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sellerName: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "600",
  },
  sellerInfo: {
    fontSize: 11,
    color: "#555555",
    marginTop: 2,
  },

  soldByCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  soldByLeft: {
    flex: 1,
    minWidth: 0,
  },

  soldByLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },

  soldByName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2,
  },

  soldByRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 12,
    flexShrink: 0,
  },

  soldByRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#10B981",
  },

  soldByRatingText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F766E",
  },
  reviewsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  writeReviewButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#ef7b1a",
    marginRight: 12,
  },
  writeReviewText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  viewAllReviewsButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  viewAllReviewsText: {
    fontSize: 12,
    color: "#ef7b1a",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ef7b1a",
    backgroundColor: "#FFF7F0",
  },
  seeMoreButtonText: {
    fontSize: 13,
    color: "#ef7b1a",
    fontWeight: "600",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
  },
  shareButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  highlightBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ef7b1a",
    marginTop: 6,
    marginRight: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  searchChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFF0E0",
    marginRight: 8,
    marginBottom: 8,
  },
  searchChipText: {
    fontSize: 11,
    color: "#79411c",
    fontWeight: "500",
  },
  suggestRow: {
    paddingTop: 10,
    paddingRight: 10,
  },
  suggestCard: {
    width: 120,
    marginRight: 12,
  },
  suggestImageWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
    marginBottom: 6,
  },
  suggestImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  suggestTitle: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "500",
    marginBottom: 2,
  },
  suggestPrice: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "700",
  },
  allProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  allProductCard: {
    width: "48%",
    marginBottom: 16,
  },
  allProductImageWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
    marginBottom: 6,
  },
  allProductImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  allProductName: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
    marginBottom: 2,
  },
  allProductPrice: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "700",
  },
  allProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  allProductMrp: {
    fontSize: 11,
    color: "#777777",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  allProductDiscount: {
    fontSize: 11,
    color: "#10893E",
    fontWeight: "600",
    marginLeft: 4,
  },
  allProductRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  allProductRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  allProductRatingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  allProductRatingCount: {
    fontSize: 10,
    color: "#555555",
    marginLeft: 4,
  },
  reviewCard: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewUser: {
    fontSize: 12,
    fontWeight: "600",
    color: "#79411c",
  },
  reviewRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reviewRatingText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  reviewDate: {
    fontSize: 10,
    color: "#777777",
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: "#333333",
    marginTop: 4,
  },
  reviewImageRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  reviewImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#E5E5F0",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  addressInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1d324e",
    marginTop: 10,
  },
  addressTypeRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  addressTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    marginRight: 10,
  },
  addressTypeChipActive: {
    borderColor: "#ef7b1a",
    backgroundColor: "#FFEBD3",
  },
  addressTypeChipText: {
    fontSize: 12,
    color: "#555555",
  },
  addressTypeChipTextActive: {
    color: "#1d324e",
    fontWeight: "600",
  },
  addressSaveButton: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#ef7b1a",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  addressSaveButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  reviewImageHint: {
    fontSize: 11,
    color: "#777777",
    marginLeft: 6,
    alignSelf: "center",
  },
  sizeChartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sizeChartModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  addressModalExtra: {
    marginTop: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    borderRadius: 18,
  },
  sizeChartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sizeChartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d324e",
  },
  sizeChartSubTitle: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 12,
  },
  sizeChartTable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  },
  sizeChartRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  sizeChartRowHeader: {
    backgroundColor: "#FFF0E0",
  },
  sizeChartCell: {
    flex: 1,
    fontSize: 11,
    color: "#1d324e",
    textAlign: "center",
  },
  sizeChartCellLabel: {
    fontWeight: "700",
  },
  sizeChartNote: {
    fontSize: 11,
    color: "#555555",
    marginTop: 12,
  },
  // Address styles
  addressLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    justifyContent: "center",
  },
  addressLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666666",
  },
  addressScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addressCard: {
    width: 200,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCardSelected: {
    borderColor: "#ef7b1a",
    backgroundColor: "#FFF7F0",
  },
  addressCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addressCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1d324e",
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: "#10893E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  addressCardLine: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
    lineHeight: 16,
  },
  addressCardCity: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  addressCardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  setDefaultButton: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  setDefaultButtonText: {
    fontSize: 10,
    color: "#0066CC",
    fontWeight: "600",
  },
  deleteAddressButton: {
    padding: 4,
  },
  noAddressContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noAddressText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  addFirstAddressButton: {
    backgroundColor: "#ef7b1a",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addFirstAddressText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});


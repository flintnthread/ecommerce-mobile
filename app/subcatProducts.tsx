import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api, {
  productsByCategoryPath,
  productsByMainCategoryFeedPath,
  productsByMainCategoryPath,
  productsSearchPath,
  searchProductsPath,
  searchSuggestionsPath,
  WISHLIST_ADD_PATH,
  WISHLIST_REMOVE_PATH,
  WISHLIST_USER_PATH,
  filterProductsByPriceRange,
  filterProductsByRating,
  filterProductsByPriceAndRating,
} from "../services/api";
import {
  addWishlistProductIfAbsent,
  removeWishlistLine,
} from "../lib/shopStorage";
import DeliveryLocationSection from "../components/DeliveryLocationSection";
import { useLanguage } from "../lib/language";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import {
  firstWishlistRowImageUri,
  normalizeWishlistApiRows,
  numLike,
  type ApiWishlistRow,
} from "../lib/wishlistApi";
import { addToCartPtbOrLocal, getCartUnitCount } from "../lib/cartServerApi";
import { pickProductImageUriFromApi } from "../lib/pickProductImageUri";

/** Top Picks for You API endpoint - same as home.tsx */
const TOP_PICKS_POPULAR_PATH = "/api/products/popular";
/** Best of Dress section API endpoint (uses api.tsx base URL) */
const BEST_OF_DRESSES_PATH = "/api/products/popular";

/** Mega Discounts API endpoint - same as home.tsx */
const DISCOUNT_TOP_PRODUCTS_PATH = "/api/products/discount/top";

/** Premium finds API endpoint - same as home.tsx */
const TOP_SELLING_PRICE_PRODUCTS_PATH = "/api/products/top-selling-price";

/** Fresh Finds API endpoint - same as home.tsx */
const FRESH_FINDS_RECENT_PATH = "/api/products/recent";

/** Top Picks for You card type - same as home.tsx */
type TopPicksHomeCard = {
  id: string;
  name: string;
  subtitle: string;
  image: any;
};

/** Mega Discounts card type - same as home.tsx */
type MegaDiscountHomeCard = {
  id: string;
  name: string;
  subtitle: string;
  image: any;
};

/** Premium finds card type - same as home.tsx */
type PremiumFindsHomeCard = {
  id: string;
  name: string;
  subtitle: string;
  image: any;
};

/** Fresh Finds card type - same as home.tsx */
type FreshFindCard = {
  id: string;
  image: any;
};

type BestDressItem = {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  isVideo?: boolean;
  sourceProduct?: ProductItem;
};

const BEST_OF_DRESSES: BestDressItem[] = [
  {
    id: "b1",
    title: "Everyday cotton kurti",
    subtitle: "Starts at ₹299",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "b2",
    title: "Festive anarkali set",
    subtitle: "Up to 55% off",
    image: require("../assets/images/look2.png"),
    isVideo: true,
  },
  {
    id: "b3",
    title: "Office-ready midi dress",
    subtitle: "Best rated picks",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "b4",
    title: "Party shimmer gown",
    subtitle: "New & trending",
    image: require("../assets/images/look4.png"),
  },
];

type ProductItem = {
  id: string;
  title: string;
  price: number;
  mrp: number;
  discount: string;
  payLaterText: string;
  benefitText: string;
  rating: string;
  ratingCount: string;
  image: any;
  /** Backend variant id for POST `/api/wishlist/add` when from API. */
  variantId?: number;
  /** Filter / facet metadata (synthetic, stable per product id) */
  catalogCategory?: string;
  gender?: string;
  color?: string;
  fabric?: string;
  size?: string;
};

type SubcatWishlistApiEntry = {
  productId: number;
  variantId: number;
  title: string;
  image: any;
  price: number;
  mrp: number;
};

function mapWishlistRowToSubcatEntry(
  row: ApiWishlistRow,
  placeholderImage: any
): SubcatWishlistApiEntry | null {
  const productId = Math.floor(Number(row.productId));
  const variantId = Math.floor(Number(row.variantId));
  if (!Number.isFinite(productId) || productId <= 0) return null;
  if (!Number.isFinite(variantId) || variantId <= 0) return null;
  const uri = firstWishlistRowImageUri(row);
  const selling = numLike(row.sellingPrice);
  const mrp = numLike(row.mrpPrice);
  const price = selling > 0 ? Math.round(selling) : Math.round(mrp) || 0;
  const mrpRounded = mrp > 0 ? Math.round(mrp) : price;
  const title =
    String(row.productName ?? "").trim() || `Product ${productId}`;
  return {
    productId,
    variantId,
    title,
    image: uri ? { uri } : placeholderImage,
    price,
    mrp: mrpRounded,
  };
}

const PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    title: "Aarvi Handloom Cotton Saree",
    price: 799,
    mrp: 1599,
    discount: "50% off",
    payLaterText: "₹270 x 3 with Pay Later",
    benefitText: "Free Delivery • Cash on Delivery",
    rating: "4.5",
    ratingCount: "1,243",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "p2",
    title: "Nyra Georgette Embroidered Saree",
    price: 1249,
    mrp: 2499,
    discount: "50% off",
    payLaterText: "₹417 x 3 with Pay Later",
    benefitText: "Free Delivery • 7‑day Return",
    rating: "4.3",
    ratingCount: "3,876",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "p3",
    title: "Ziva Printed Chiffon Saree",
    price: 599,
    mrp: 1399,
    discount: "57% off",
    payLaterText: "₹200 x 3 with Pay Later",
    benefitText: "Express Delivery",
    rating: "4.1",
    ratingCount: "9,012",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "p4",
    title: "Veera Banarasi Silk Saree",
    price: 1699,
    mrp: 3499,
    discount: "51% off",
    payLaterText: "₹566 x 3 with Pay Later",
    benefitText: "Free Delivery • Gift Wrap Available",
    rating: "4.7",
    ratingCount: "18,540",
    image: require("../assets/images/look3.png"),
  },
];

const { width } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isMobile = width < 768;

const bannerWidth = width - 24;
/** 2-column grid inner width ≈ half row minus grid + card padding; ~1.3× for portrait product hero */
const productCardImageHeight = Math.min(
  276,
  Math.max(214, Math.round(((width - 12) * 0.497 - 8) * 1.3))
);

const bannerImages = [
  require("../assets/Fashion.png"),
  require("../assets/FootwearAccessories.png"),
  require("../assets/IndoorplayGift.png"),
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
      "https://images.unsplash.com/photo-1627639679638-8485316a4b21?fm=jpg&q=60&w=3000&auto=format&fit=crop",
  },
];

/** Subcategory labels from `subcate` accessories hub tiles — used for Shop All → full grid. */
const ACCESSORIES_SHOP_ALL_LABELS = [
  "JEWELLERY",
  "BAGS",
  "BELTS",
  "WATCHES",
] as const;

/** Accessories hub “Top Collection” — four tiles: jewellery, watches, bags, beauty. */
const ACCESSORIES_TOP_COLLECTION_LABELS = [
  "JEWELLERY",
  "WATCHES",
  "BAGS",
  "Hair Accessories",
] as const;

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
  "Skincare Tools & Devices",
  "Facial Devices",
];

/** Preview tiles per category on the browse screen (2×2). */
const CATEGORY_PREVIEW_COUNT = 4;

const filterSections = [
  "Category",
  "Gender",
  "Color",
  "Fabric",
  "Size",
  "Price",
  "Rating",
];

const filterOptions: Record<string, string[]> = {
  Category: categoryOptions,
  Gender: ["Women", "Men", "Girls", "Boys"],
  Color: ["Black", "Blue", "Pink", "Red", "White", "Green"],
  Fabric: ["Cotton", "Rayon", "Silk", "Polyester", "Linen"],
  Size: ["XS", "S", "M", "L", "XL", "XXL"],
  Price: ["Below ₹299", "₹300 - ₹499", "₹500 - ₹999", "Above ₹1000"],
  Rating: ["4★ & above", "3★ & above", "2★ & above"],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** From catalog label — avoids "women".includes("men") false positives. */
function inferGenderFromCategoryName(cat: string): "Men" | "Women" | "Neutral" {
  const c = cat.toLowerCase();
  if (
    /\bwomen\b/.test(c) ||
    c.includes("kurti") ||
    c.includes("dupatta") ||
    c.includes("blouse")
  ) {
    return "Women";
  }
  if (/\bmen\b/.test(c) || /^men\s/i.test(cat)) {
    return "Men";
  }
  return "Neutral";
}

function categoryMatchesGenderSelection(
  cat: string,
  selectedGender: string
): boolean {
  if (!selectedGender) return true;
  const inferred = inferGenderFromCategoryName(cat);
  if (inferred === "Neutral") return true;
  return inferred === selectedGender;
}

function withFilterTraits(
  product: ProductItem,
  catalogCategory: string,
  hubMainCat?: string,
  modalGender?: string
): ProductItem {
  const id = product.id;
  const g = filterOptions.Gender;
  const col = filterOptions.Color;
  const fab = filterOptions.Fabric;
  const sz = filterOptions.Size;
  const hi = hashStr(id);
  const fromCat = inferGenderFromCategoryName(catalogCategory);
  let gender: string;
  if (fromCat === "Men" || fromCat === "Women") {
    gender = fromCat;
  } else if (modalGender && fromCat === "Neutral") {
    gender = modalGender;
  } else if (hubMainCat === "menswear") {
    gender = "Men";
  } else if (hubMainCat === "womenswear") {
    gender = "Women";
  } else {
    gender = g[hi % g.length];
  }
  return {
    ...product,
    catalogCategory,
    gender,
    color: col[hashStr(`${id}c`) % col.length],
    fabric: fab[hashStr(`${id}f`) % fab.length],
    size: sz[hashStr(`${id}s`) % sz.length],
  };
}

function buildProductsForCategory(
  categoryName: string,
  hubMainCat?: string,
  modalGender?: string
): ProductItem[] {
  const slug = categoryName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
  const rounds = 3;
  const out: ProductItem[] = [];
  for (let r = 0; r < rounds; r++) {
    PRODUCTS.forEach((product, index) => {
      const base: ProductItem = {
        ...product,
        id: `${slug}-r${r}-i${index}`,
        title: r === 0 ? product.title : `${product.title} · ${r + 1}`,
      };
      out.push(withFilterTraits(base, categoryName, hubMainCat, modalGender));
    });
  }
  return out;
}

function priceMatchesFilter(price: number, tiers: string[]): boolean {
  return tiers.some((tier) => {
    if (tier === "Below ₹299") return price < 300;
    if (tier === "₹300 - ₹499") return price >= 300 && price <= 499;
    if (tier === "₹500 - ₹999") return price >= 500 && price <= 999;
    if (tier === "Above ₹1000") return price >= 1000;
    return false;
  });
}

function ratingMatchesFilter(rating: number, tiers: string[]): boolean {
  return tiers.some((tier) => {
    if (tier.includes("4")) return rating >= 4;
    if (tier.includes("3")) return rating >= 3;
    if (tier.includes("2")) return rating >= 2;
    return false;
  });
}

function parseDiscountPercent(discount: string): number {
  const m = discount.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function applyProductAttributeFilters(
  products: ProductItem[],
  selectedFilters: Record<string, string[]>,
  selectedCategoryModal: string[],
  selectedGender: string
): ProductItem[] {
  const filterPanelCategories = selectedFilters.Category || [];
  const filterPanelGenders = selectedFilters.Gender || [];
  const colors = selectedFilters.Color || [];
  const fabrics = selectedFilters.Fabric || [];
  const sizes = selectedFilters.Size || [];
  const prices = selectedFilters.Price || [];
  const ratings = selectedFilters.Rating || [];

  return products.filter((p) => {
    if (selectedCategoryModal.length > 0) {
      if (
        !p.catalogCategory ||
        !selectedCategoryModal.includes(p.catalogCategory)
      ) {
        return false;
      }
    }
    if (filterPanelCategories.length > 0) {
      if (
        !p.catalogCategory ||
        !filterPanelCategories.includes(p.catalogCategory)
      ) {
        return false;
      }
    }
    if (selectedGender) {
      if (p.gender !== selectedGender) return false;
    }
    if (filterPanelGenders.length > 0) {
      if (!p.gender || !filterPanelGenders.includes(p.gender)) return false;
    }
    if (colors.length > 0) {
      if (!p.color || !colors.includes(p.color)) return false;
    }
    if (fabrics.length > 0) {
      if (!p.fabric || !fabrics.includes(p.fabric)) return false;
    }
    if (sizes.length > 0) {
      if (!p.size || !sizes.includes(p.size)) return false;
    }
    if (prices.length > 0 && !priceMatchesFilter(p.price, prices)) {
      return false;
    }
    if (ratings.length > 0) {
      const r = parseFloat(p.rating);
      if (Number.isNaN(r) || !ratingMatchesFilter(r, ratings)) return false;
    }
    return true;
  });
}

function applyProductSort(products: ProductItem[], sort: string): ProductItem[] {
  const list = [...products];
  switch (sort) {
    case "Price (High to Low)":
      return list.sort((a, b) => b.price - a.price);
    case "Price (Low to High)":
      return list.sort((a, b) => a.price - b.price);
    case "Ratings":
      return list.sort(
        (a, b) => parseFloat(b.rating) - parseFloat(a.rating)
      );
    case "Discount":
      return list.sort(
        (a, b) =>
          parseDiscountPercent(b.discount) - parseDiscountPercent(a.discount)
      );
    case "New Arrivals":
      return list.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
    default:
      return list;
  }
}

function runProductPipeline(
  products: ProductItem[],
  searchQueryText: string,
  selectedFilters: Record<string, string[]>,
  selectedCategoryModal: string[],
  selectedGender: string,
  selectedSort: string
): ProductItem[] {
  const q = searchQueryText.trim().toLowerCase();
  let list = q
    ? products.filter((p) => p.title.toLowerCase().includes(q))
    : [...products];
  list = applyProductAttributeFilters(
    list,
    selectedFilters,
    selectedCategoryModal,
    selectedGender
  );
  return applyProductSort(list, selectedSort);
}

export default function SubcategoriesScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const params = useLocalSearchParams<{
    mainCat?: string | string[];
    subCategory?: string | string[];
    subcategoryId?: string | string[];
    mainCategoryId?: string | string[];
    categoryId?: string | string[];
    categoryIds?: string | string[];
    discountMin?: string | string[];
    discountMax?: string | string[];
    productsSearchQ?: string | string[];
    productsSearchCategoryId?: string | string[];
    productsSearchSort?: string | string[];
    productsSearchGender?: string | string[];
    mainCategoryFeed?: string | string[];
    mainCategoryPath?: string | string[];
    // New filter params from home.tsx filter modal
    colorNames?: string | string[];
    sizeNames?: string | string[];
    genders?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    minRating?: string | string[];
    filterApplied?: string | string[];
  }>();
  const mainCat = Array.isArray(params.mainCat)
    ? params.mainCat[0]
    : params.mainCat;
  const selectedSubCategory = Array.isArray(params.subCategory)
    ? params.subCategory[0]
    : params.subCategory;
  const routedSubcategoryIdRaw = Array.isArray(params.subcategoryId)
    ? params.subcategoryId[0]
    : params.subcategoryId;
  const routedSubcategoryId = routedSubcategoryIdRaw
    ? Number.parseInt(String(routedSubcategoryIdRaw), 10)
    : NaN;
  const routedMainCategoryIdRaw = Array.isArray(params.mainCategoryId)
    ? params.mainCategoryId[0]
    : params.mainCategoryId;
  const routedMainCategoryId = routedMainCategoryIdRaw
    ? Number.parseInt(String(routedMainCategoryIdRaw), 10)
    : NaN;
  const routedCategoryIdRaw = Array.isArray(params.categoryId)
    ? params.categoryId[0]
    : params.categoryId;
  const routedCategoryId = routedCategoryIdRaw
    ? Number.parseInt(String(routedCategoryIdRaw), 10)
    : NaN;
  const routedDiscountMinRaw = Array.isArray(params.discountMin)
    ? params.discountMin[0]
    : params.discountMin;
  const routedDiscountMin = routedDiscountMinRaw
    ? Number.parseFloat(String(routedDiscountMinRaw))
    : NaN;
  const routedDiscountMaxRaw = Array.isArray(params.discountMax)
    ? params.discountMax[0]
    : params.discountMax;
  const routedDiscountMax = routedDiscountMaxRaw
    ? Number.parseFloat(String(routedDiscountMaxRaw))
    : NaN;
  const productsSearchQRaw = Array.isArray(params.productsSearchQ)
    ? params.productsSearchQ[0]
    : params.productsSearchQ;
  const routedProductsSearchQ = String(productsSearchQRaw ?? "").trim();
  const productsSearchCategoryIdRaw = Array.isArray(params.productsSearchCategoryId)
    ? params.productsSearchCategoryId[0]
    : params.productsSearchCategoryId;
  const routedProductsSearchCategoryId = productsSearchCategoryIdRaw
    ? Number.parseInt(String(productsSearchCategoryIdRaw), 10)
    : NaN;
  const productsSearchSortRaw = Array.isArray(params.productsSearchSort)
    ? params.productsSearchSort[0]
    : params.productsSearchSort;
  const routedProductsSearchSort = String(productsSearchSortRaw ?? "").trim();
  const productsSearchGenderRaw = Array.isArray(params.productsSearchGender)
    ? params.productsSearchGender[0]
    : params.productsSearchGender;
  const routedProductsSearchGender = String(productsSearchGenderRaw ?? "").trim();
  const mainCategoryFeedRaw = Array.isArray(params.mainCategoryFeed)
    ? params.mainCategoryFeed[0]
    : params.mainCategoryFeed;
  const routedMainCategoryFeed = String(mainCategoryFeedRaw ?? "").trim().toLowerCase();
  const mainCategoryPathRaw = Array.isArray(params.mainCategoryPath)
    ? params.mainCategoryPath[0]
    : params.mainCategoryPath;
  const routedMainCategoryPath = String(mainCategoryPathRaw ?? "").trim();
  
  // Parse new filter params from home.tsx filter modal
  const categoryIdsRaw = Array.isArray(params.categoryIds) ? params.categoryIds[0] : params.categoryIds;
  const routedCategoryIds = categoryIdsRaw ? categoryIdsRaw.split(',').map((id: string) => Number.parseInt(id.trim(), 10)).filter((id: number) => !Number.isNaN(id)) : [];
  
  const colorNamesRaw = Array.isArray(params.colorNames) ? params.colorNames[0] : params.colorNames;
  const routedColorNames = colorNamesRaw ? colorNamesRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
  
  const sizeNamesRaw = Array.isArray(params.sizeNames) ? params.sizeNames[0] : params.sizeNames;
  const routedSizeNames = sizeNamesRaw ? sizeNamesRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  
  const gendersRaw = Array.isArray(params.genders) ? params.genders[0] : params.genders;
  const routedGenders = gendersRaw ? gendersRaw.split(',').map((g: string) => g.trim()).filter(Boolean) : [];
  
  const minPriceRaw = Array.isArray(params.minPrice) ? params.minPrice[0] : params.minPrice;
  const routedMinPrice = minPriceRaw ? Number.parseFloat(minPriceRaw) : undefined;
  
  const maxPriceRaw = Array.isArray(params.maxPrice) ? params.maxPrice[0] : params.maxPrice;
  const routedMaxPrice = maxPriceRaw ? Number.parseFloat(maxPriceRaw) : undefined;
  
  const minRatingRaw = Array.isArray(params.minRating) ? params.minRating[0] : params.minRating;
  const routedMinRating = minRatingRaw ? Number.parseFloat(minRatingRaw) : undefined;
  
  const filterAppliedRaw = Array.isArray(params.filterApplied) ? params.filterApplied[0] : params.filterApplied;
  const isFilterApplied = filterAppliedRaw === 'true';
  
  const pageTitle = tr(selectedSubCategory || "Products").toUpperCase();

  useEffect(() => {
    const norm = String(selectedSubCategory ?? "")
      .trim()
      .toLowerCase()
      .replace(/\u2019/g, "'"); // normalize curly apostrophe
    if (
      norm === "womens clothing" ||
      norm === "women's clothing" ||
      norm === "women clothing"
    ) {
      if (router.canGoBack()) router.back();
      else router.replace("/women");
    }
  }, [router, selectedSubCategory]);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedFilterSection, setSelectedFilterSection] =
    useState<string>("Category");
  const [searchCategoryText, setSearchCategoryText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView | null>(null);
  const [cartBadgeCount, setCartBadgeCount] = useState(0);
  /** Local-only wishlist ids when not signed in, or non-API catalog rows. */
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  /** Signed-in user wishlist from GET `/api/wishlist/user`. */
  const [wishlistApiEntries, setWishlistApiEntries] = useState<SubcatWishlistApiEntry[]>([]);
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [similarModalVisible, setSimilarModalVisible] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<ProductItem[]>([]);
  const [wishlistModalVisible, setWishlistModalVisible] = useState(false);
  /** null = browse by category (preview grids); string = full catalog for that category */
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [apiRoutedProducts, setApiRoutedProducts] = useState<ProductItem[]>([]);
  /** When `subcategoryId` is in the route, we only show API rows (no fallback to synthetic catalog). */
  const [apiRoutedFromIdReady, setApiRoutedFromIdReady] = useState(false);

  const [categoryApiProducts, setCategoryApiProducts] = useState<ProductItem[]>([]);
  const [categoryApiReady, setCategoryApiReady] = useState(false);

  const [mainCategoryApiProducts, setMainCategoryApiProducts] = useState<ProductItem[]>([]);
  const [mainCategoryApiReady, setMainCategoryApiReady] = useState(false);
  const [mainCategoryPathProducts, setMainCategoryPathProducts] = useState<ProductItem[]>([]);
  const [mainCategoryPathReady, setMainCategoryPathReady] = useState(false);
  const [mainCategoryFeedProducts, setMainCategoryFeedProducts] = useState<ProductItem[]>([]);
  const [mainCategoryFeedReady, setMainCategoryFeedReady] = useState(false);
  const [latestMainCategoryProducts, setLatestMainCategoryProducts] = useState<ProductItem[]>([]);
  const [latestMainCategoryReady, setLatestMainCategoryReady] = useState(false);

  const [productsSearchApiProducts, setProductsSearchApiProducts] = useState<ProductItem[]>([]);
  const [productsSearchApiReady, setProductsSearchApiReady] = useState(false);

  /** Top Picks for You products state */
  const [topPicksProducts, setTopPicksProducts] = useState<ProductItem[]>([]);
  const [topPicksReady, setTopPicksReady] = useState(false);
  /** Best of Dress section products state */
  const [bestDressProducts, setBestDressProducts] = useState<ProductItem[]>([]);
  const [bestDressReady, setBestDressReady] = useState(false);

  /** Mega Discounts products state */
  const [megaDiscountProducts, setMegaDiscountProducts] = useState<ProductItem[]>([]);
  const [megaDiscountReady, setMegaDiscountReady] = useState(false);

  /** Premium finds products state */
  const [premiumFindsProducts, setPremiumFindsProducts] = useState<ProductItem[]>([]);
  const [premiumFindsReady, setPremiumFindsReady] = useState(false);

  /** Fresh Finds products state */
  const [freshFindsProducts, setFreshFindsProducts] = useState<ProductItem[]>([]);
  const [freshFindsReady, setFreshFindsReady] = useState(false);

  /** Filtered products state (from home.tsx filter modal) */
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [filteredProductsReady, setFilteredProductsReady] = useState(false);
  const [filteredProductsLoading, setFilteredProductsLoading] = useState(false);

  // Enhanced zoom and blink animation for loading logo
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create enhanced animation with zoom in/out and blinking
    const enhancedAnimation = Animated.loop(
      Animated.sequence([
        // Zoom in
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Blink while zoomed
        Animated.sequence([
          Animated.timing(logoOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Zoom out
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Pause
        Animated.delay(500),
      ])
    );
    enhancedAnimation.start();
  }, []);

  const handleFilterPress = (label: string) => {
    if (label === "Sort") setSortModalVisible(true);
    if (label === "Category") setCategoryModalVisible(true);
    if (label === "Gender") setGenderModalVisible(true);
    if (label === "Filters") setFilterModalVisible(true);
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

  const clearAllProductFilters = () => {
    setSelectedFilters({});
    setSelectedCategory([]);
    setSelectedGender("");
    setSelectedSort("Relevance");
  };

  const allBrowseCatalogFlat = React.useMemo(
    () =>
      categoryOptions.flatMap((c) =>
        buildProductsForCategory(
          c,
          mainCat ?? undefined,
          selectedGender || undefined
        )
      ),
    [mainCat, selectedGender]
  );

  const browseCategoryOptions = React.useMemo(
    () =>
      categoryOptions.filter((cat) =>
        categoryMatchesGenderSelection(cat, selectedGender)
      ),
    [selectedGender]
  );

  const displayedCategories = categoryOptions.filter(
    (item) =>
      item.toLowerCase().includes(searchCategoryText.toLowerCase()) &&
      categoryMatchesGenderSelection(item, selectedGender)
  );

  const displayedFilterOptions =
    selectedFilterSection === "Category"
      ? (filterOptions[selectedFilterSection] || []).filter(
          (item) =>
            item.toLowerCase().includes(searchCategoryText.toLowerCase()) &&
            categoryMatchesGenderSelection(item, selectedGender)
        )
      : filterOptions[selectedFilterSection] || [];

  const categoryProducts = React.useMemo(() => {
    if (!selectedSubCategory) {
      return PRODUCTS.map((p, i) =>
        withFilterTraits(
          p,
          categoryOptions[i % categoryOptions.length],
          mainCat ?? undefined,
          selectedGender || undefined
        )
      );
    }
    const query = selectedSubCategory.trim().toLowerCase();
    const titleMatchedProducts = PRODUCTS.filter((product) =>
      product.title.toLowerCase().includes(query)
    );
    const matchedOption = categoryOptions.find(
      (c) => c.toLowerCase() === selectedSubCategory.trim().toLowerCase()
    );
    const catalogCat = matchedOption || selectedSubCategory.trim();

    if (titleMatchedProducts.length > 0) {
      return titleMatchedProducts.map((p) =>
        withFilterTraits(
          p,
          catalogCat,
          mainCat ?? undefined,
          selectedGender || undefined
        )
      );
    }

    return PRODUCTS.map((product, index) =>
      withFilterTraits(
        {
          ...product,
          id: `${product.id}-${index}-${query.replace(/\s+/g, "-")}`,
          title: `${selectedSubCategory} - ${product.title}`,
        },
        catalogCat,
        mainCat ?? undefined,
        selectedGender || undefined
      )
    );
  }, [selectedSubCategory, mainCat, selectedGender]);

  const filteredCategoryProducts = React.useMemo(
    () =>
      runProductPipeline(
        categoryProducts,
        searchQuery,
        selectedFilters,
        selectedCategory,
        selectedGender,
        selectedSort
      ),
    [
      categoryProducts,
      searchQuery,
      selectedFilters,
      selectedCategory,
      selectedGender,
      selectedSort,
    ]
  );

  const hasSubCategoryFromRoute = Boolean(selectedSubCategory?.trim());

  const safeText = (v: string): string =>
    String(v ?? "").replace(/\u0019/g, "'").trim();

  const getAssetUriFromApiPath = (pathOrUrl: string): string => {
    const raw = String(pathOrUrl ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!apiBase) return raw;
    return `${apiBase}/${raw.replace(/^\/+/, "")}`;
  };

  /** Utility functions from home.tsx for API product mapping */
  function formatInrAmount(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return "â";
    return `â${Math.round(n).toLocaleString("en-IN")}`;
  }

  function pickPrimaryProductImage(images: any[]): any {
    if (!Array.isArray(images) || images.length === 0) return undefined;
    const primary = images.find((img) => img?.isPrimary === true);
    return primary ?? images[0];
  }

  function resolveProductPrimaryImageUri(primary: any, resolvePath: (p: string) => string): string {
    if (!primary) return "";
    const path = primary.imagePath || primary.imageUrl || primary.url;
    return path ? resolvePath(String(path)) : "";
  }

  function mapMorePicksApiToGrid(
    rows: any[],
    apiBase: string,
    placeholderImage: any,
    options?: { requireProductActive?: boolean }
  ): ProductItem[] {
    const root = apiBase.replace(/\/$/, "");
    const resolvePath = (p: string) => {
      const s = String(p ?? "").trim();
      if (!s) return "";
      if (/^https?:\/\//i.test(s)) return s;
      if (!root) return "";
      return s.startsWith("/") ? `${root}${s}` : `${root}/${s}`;
    };

    const out: ProductItem[] = [];

    for (const p of rows) {
      if (options?.requireProductActive !== false) {
        const st = String(p.status ?? "").trim().toLowerCase();
        const hiddenStatuses = new Set(["inactive", "deleted", "archived", "draft", "rejected"]);
        if (st && hiddenStatuses.has(st)) continue;
      }

      const rawPid = p.id ?? p.productId;
      const idNum = typeof rawPid === "string" ? Number.parseInt(rawPid, 10) : Number(rawPid);
      if (!Number.isFinite(idNum) || idNum <= 0) continue;

      const primary = pickPrimaryProductImage(p.images);
      const uri = resolveProductPrimaryImageUri(primary, resolvePath);

      const name = String(p.name ?? p.productName ?? p.title ?? p.displayName ?? "").trim() || `Product ${idNum}`;

      const variants = Array.isArray(p.variants) ? p.variants : [];
      const v = variants.find((x) => x && x.inStock === true) ?? variants[0];
      const sale = Number(v?.sellingPrice ?? p.salePrice ?? p.sellingPrice ?? p.price ?? 0);
      const mrp = Number(v?.mrpPrice ?? p.mrp ?? p.maxRetailPrice ?? 0);

      let oldPrice: string | undefined;
      let discount: string | undefined;

      if (mrp > 0 && sale > 0 && mrp > sale) {
        oldPrice = formatInrAmount(mrp);
        discount = `${Math.round(((mrp - sale) / mrp) * 100)}%`;
      } else if (typeof v?.discountPercentage === "number" && v.discountPercentage > 0) {
        discount = `${Math.round(v.discountPercentage)}%`;
      } else if (typeof p.discountPercentage === "number" && p.discountPercentage > 0) {
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

      out.push({
        id: String(idNum),
        title: name,
        price: sale > 0 ? sale : mrp,
        mrp: mrp > sale ? mrp : sale,
        discount: discount || "Deal",
        payLaterText: "",
        benefitText: "Free Delivery",
        rating: "0.0",
        ratingCount: "0",
        image: uri ? { uri } : placeholderImage,
        ...(variantId != null ? { variantId } : {}),
      });
    }

    return out;
  }

  function normalizeProductListPayload(data: unknown, depth = 0): any[] {
    if (depth > 6) return [];
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    const o = data as Record<string, unknown>;

    const PRODUCT_LIST_ARRAY_KEYS = ["content", "data", "products", "items", "records", "results", "rows"];
    for (const key of PRODUCT_LIST_ARRAY_KEYS) {
      const v = o[key];
      if (Array.isArray(v)) return v;
    }

    const inner = o.data;
    if (inner != null && typeof inner === "object") {
      if (Array.isArray(inner)) return inner;
      return normalizeProductListPayload(inner, depth + 1);
    }

    return [];
  }

  const pickProductImageUri = (p: any): string | null =>
    pickProductImageUriFromApi(p, getAssetUriFromApiPath);

  const pickVariantNumbers = (p: any): {
    selling: number;
    mrp: number;
    discountPct: number | null;
    variantId?: number;
  } => {
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
    const rawVid = v?.id ?? v?.variantId;
    const vidNum =
      typeof rawVid === "string" ? Number.parseInt(rawVid, 10) : Number(rawVid);
    const variantId =
      Number.isFinite(vidNum) && vidNum > 0 ? Math.floor(vidNum) : undefined;
    return {
      selling: Math.max(0, Math.round(selling)),
      mrp: Math.max(Math.round(selling), Math.round(mrp)),
      discountPct,
      variantId,
    };
  };

  const pickRatingLabel = (p: any): string => {
    const r =
      p?.rating ?? p?.averageRating ?? p?.average_rating ?? p?.reviewRating ?? p?.review_rating;
    if (typeof r === "number" && Number.isFinite(r)) return r.toFixed(1);
    if (typeof r === "string") {
      const n = parseFloat(r);
      return Number.isFinite(n) ? n.toFixed(1) : "—";
    }
    return "—";
  };

  const mapApiProductToProductItem = (p: any): ProductItem | null => {
    if (!p || typeof p.id !== "number" || typeof p.name !== "string") return null;
    const st = String(p.status ?? "").trim().toLowerCase();
    /** Backend may return e.g. `under_review`; only hide clearly unpublishable rows. */
    const hiddenStatuses = new Set([
      "inactive",
      "deleted",
      "archived",
      "draft",
      "rejected",
    ]);
    if (st && hiddenStatuses.has(st)) return null;
    const imageUri = pickProductImageUri(p);
    if (!imageUri) return null;
    const { selling, mrp, discountPct, variantId } = pickVariantNumbers(p);
    const discountLabel =
      discountPct != null && Number.isFinite(discountPct)
        ? `${Number(discountPct).toFixed(1).replace(/\.0$/, "")}% off`
        : "Deal";
    const base: ProductItem = {
      id: String(p.id),
      title: safeText(p.name),
      price: selling,
      mrp,
      discount: discountLabel,
      payLaterText: "",
      benefitText: "Free Delivery",
      rating: pickRatingLabel(p),
      ratingCount: "•",
      image: { uri: imageUri },
      ...(variantId != null ? { variantId } : {}),
    };
    return withFilterTraits(
      base,
      selectedSubCategory || "Products",
      mainCat ?? undefined,
      selectedGender || undefined
    );
  };

  const routedFromSubcategoryId =
    Number.isFinite(routedSubcategoryId) && routedSubcategoryId > 0;

  const routedFromMainCategoryId =
    Number.isFinite(routedMainCategoryId) && routedMainCategoryId > 0;
  const routedFromMainCategoryPath = routedMainCategoryPath.length > 0;
  const routedFromMainCategoryFeed =
    !routedFromMainCategoryPath &&
    routedFromMainCategoryId &&
    (routedMainCategoryFeed === "spotlight" ||
      routedMainCategoryFeed === "top-collections" ||
      routedMainCategoryFeed === "trending" ||
      routedMainCategoryFeed === "unique" ||
      routedMainCategoryFeed === "recommended" ||
      routedMainCategoryFeed === "latest");

  const routedFromProductsSearch =
    routedProductsSearchQ.length > 0 ||
    (Number.isFinite(routedProductsSearchCategoryId) && routedProductsSearchCategoryId > 0);

  useEffect(() => {
    if (!routedFromProductsSearch) {
      setProductsSearchApiProducts([]);
      setProductsSearchApiReady(false);
      return;
    }

    setProductsSearchApiReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const path = productsSearchPath({
          q: routedProductsSearchQ || undefined,
          categoryId:
            Number.isFinite(routedProductsSearchCategoryId) &&
            routedProductsSearchCategoryId > 0
              ? routedProductsSearchCategoryId
              : undefined,
          sort: routedProductsSearchSort || undefined,
          gender: routedProductsSearchGender || undefined,
        });
        const { data } = await api.get<unknown>(path, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const rows = Array.isArray(data)
          ? (data as unknown[])
          : normalizeProductListPayload(data);
        const mapped = rows
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setProductsSearchApiProducts(mapped);
      } catch {
        if (!controller.signal.aborted) setProductsSearchApiProducts([]);
      } finally {
        if (!controller.signal.aborted) setProductsSearchApiReady(true);
      }
    })();

    return () => controller.abort();
  }, [
    routedFromProductsSearch,
    routedProductsSearchQ,
    routedProductsSearchCategoryId,
    routedProductsSearchSort,
    routedProductsSearchGender,
    selectedSubCategory,
    mainCat,
  ]);

  useEffect(() => {
    if (!Number.isFinite(routedCategoryId) || routedCategoryId <= 0) {
      setCategoryApiProducts([]);
      setCategoryApiReady(false);
      return;
    }

    setCategoryApiReady(false);
    const controller = new AbortController();

    (async () => {
      try {
        const path = productsByCategoryPath(routedCategoryId);
        const { data } = await api.get<unknown>(path, { signal: controller.signal });
        
        // Handle the API response format
        let products: unknown[] = [];
        if (Array.isArray(data)) {
          products = data;
        } else if (data && typeof data === 'object' && 'content' in data) {
          products = Array.isArray((data as any).content) ? (data as any).content : [];
        }

        const mapped = products
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setCategoryApiProducts(mapped);
      } catch {
        if (!controller.signal.aborted) setCategoryApiProducts([]);
      } finally {
        if (!controller.signal.aborted) setCategoryApiReady(true);
      }
    })();

    return () => controller.abort();
  }, [routedCategoryId, selectedSubCategory, mainCat]);

  useEffect(() => {
    if (!routedFromMainCategoryPath) {
      setMainCategoryPathProducts([]);
      setMainCategoryPathReady(false);
      return;
    }

    setMainCategoryPathReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get<unknown>(routedMainCategoryPath, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const rows = Array.isArray(data)
          ? (data as unknown[])
          : normalizeProductListPayload(data);
        const mapped = rows
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setMainCategoryPathProducts(mapped);
      } catch {
        if (!controller.signal.aborted) setMainCategoryPathProducts([]);
      } finally {
        if (!controller.signal.aborted) setMainCategoryPathReady(true);
      }
    })();

    return () => controller.abort();
  }, [routedFromMainCategoryPath, routedMainCategoryPath]);

  useEffect(() => {
    if (!routedFromMainCategoryFeed) {
      setMainCategoryFeedProducts([]);
      setMainCategoryFeedReady(false);
      return;
    }

    setMainCategoryFeedReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const path = productsByMainCategoryFeedPath(
          routedMainCategoryId,
          routedMainCategoryFeed
        );
        const { data } = await api.get<unknown>(path, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const rows = Array.isArray(data)
          ? (data as unknown[])
          : normalizeProductListPayload(data);
        const mapped = rows
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setMainCategoryFeedProducts(mapped);
      } catch {
        if (!controller.signal.aborted) setMainCategoryFeedProducts([]);
      } finally {
        if (!controller.signal.aborted) setMainCategoryFeedReady(true);
      }
    })();

    return () => controller.abort();
  }, [
    routedFromMainCategoryFeed,
    routedMainCategoryId,
    routedMainCategoryFeed,
  ]);

  useEffect(() => {
    if (!routedFromMainCategoryId) {
      setMainCategoryApiProducts([]);
      setMainCategoryApiReady(false);
      return;
    }

    setMainCategoryApiReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const hasDiscountMin = Number.isFinite(routedDiscountMin);
        const hasDiscountMax = Number.isFinite(routedDiscountMax);
        const query = new URLSearchParams();
        if (hasDiscountMin) query.set("discountMin", String(routedDiscountMin));
        if (hasDiscountMax) query.set("discountMax", String(routedDiscountMax));
        const path = productsByMainCategoryPath(routedMainCategoryId);
        const mainCategoryPath = query.toString()
          ? `${path}?${query.toString()}`
          : path;
        const { data } = await api.get<unknown>(
          mainCategoryPath,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const rows = Array.isArray(data)
          ? (data as unknown[])
          : normalizeProductListPayload(data);
        const mapped = rows
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setMainCategoryApiProducts(mapped);
      } catch {
        if (!controller.signal.aborted) setMainCategoryApiProducts([]);
      } finally {
        if (!controller.signal.aborted) setMainCategoryApiReady(true);
      }
    })();

    return () => controller.abort();
  }, [
    routedMainCategoryId,
    routedFromMainCategoryId,
    routedDiscountMin,
    routedDiscountMax,
    selectedSubCategory,
    mainCat,
  ]);

  useEffect(() => {
    if (!routedFromMainCategoryId) {
      setLatestMainCategoryProducts([]);
      setLatestMainCategoryReady(false);
      return;
    }

    setLatestMainCategoryReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const path = productsByMainCategoryFeedPath(routedMainCategoryId, "latest");
        const { data } = await api.get<unknown>(path, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const rows = Array.isArray(data)
          ? (data as unknown[])
          : normalizeProductListPayload(data);
        const mapped = rows
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setLatestMainCategoryProducts(mapped);
      } catch {
        if (!controller.signal.aborted) setLatestMainCategoryProducts([]);
      } finally {
        if (!controller.signal.aborted) setLatestMainCategoryReady(true);
      }
    })();

    return () => controller.abort();
  }, [routedMainCategoryId, routedFromMainCategoryId]);

  useEffect(() => {
    if (!routedFromSubcategoryId) {
      setApiRoutedProducts([]);
      setApiRoutedFromIdReady(false);
      return;
    }

    setApiRoutedFromIdReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get(`/api/products/subcategory/${routedSubcategoryId}`, {
          signal: controller.signal,
        });
        if (!Array.isArray(data)) {
          setApiRoutedProducts([]);
          return;
        }
        const mapped = (data as unknown[])
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];
        setApiRoutedProducts(mapped);
      } catch {
        setApiRoutedProducts([]);
      } finally {
        if (!controller.signal.aborted) setApiRoutedFromIdReady(true);
      }
    })();

    return () => controller.abort();
  }, [routedSubcategoryId, routedFromSubcategoryId, selectedSubCategory, mainCat]);

  // Fetch filtered products when filter params are passed from home.tsx
  useEffect(() => {
    if (!isFilterApplied) {
      setFilteredProducts([]);
      setFilteredProductsReady(false);
      setFilteredProductsLoading(false);
      return;
    }

    setFilteredProductsLoading(true);
    setFilteredProductsReady(false);
    const controller = new AbortController();

    (async () => {
      try {
        let response: any;
        
        // Determine which API to call based on available filters
        const hasPrice = routedMinPrice !== undefined || routedMaxPrice !== undefined;
        const hasRating = routedMinRating !== undefined;
        const hasCategories = routedCategoryIds.length > 0;
        
        const minPrice = routedMinPrice ?? 0;
        const maxPrice = routedMaxPrice ?? 999999;
        const rating = routedMinRating ?? 0;

        if (hasPrice && hasRating) {
          // Use combined filter endpoint
          response = await filterProductsByPriceAndRating(
            minPrice,
            maxPrice,
            rating,
            0,
            50
          );
        } else if (hasPrice) {
          // Use price-only filter endpoint
          response = await filterProductsByPriceRange(minPrice, maxPrice, 0, 50);
        } else if (hasRating) {
          // Use rating-only filter endpoint
          response = await filterProductsByRating(rating, 0, 50);
        } else if (hasCategories) {
          // Fetch products by category IDs
          const categoryPromises = routedCategoryIds.map(catId => 
            api.get(productsByCategoryPath(catId), { signal: controller.signal })
          );
          const responses = await Promise.all(categoryPromises);
          const allProducts: ProductItem[] = [];
          
          for (const res of responses) {
            let products: unknown[] = [];
            if (Array.isArray(res.data)) {
              products = res.data;
            } else if (res.data && typeof res.data === 'object' && 'content' in res.data) {
              products = Array.isArray((res.data as any).content) ? (res.data as any).content : [];
            }
            const mapped = products
              .map((row) => mapApiProductToProductItem(row))
              .filter(Boolean) as ProductItem[];
            allProducts.push(...mapped);
          }
          
          setFilteredProducts(allProducts);
          setFilteredProductsLoading(false);
          setFilteredProductsReady(true);
          return;
        } else {
          // No filters, don't fetch
          setFilteredProducts([]);
          setFilteredProductsLoading(false);
          setFilteredProductsReady(true);
          return;
        }

        if (controller.signal.aborted) return;

        // Map the response to product items
        let products: unknown[] = [];
        if (Array.isArray(response?.data)) {
          products = response.data;
        } else if (response?.data && typeof response.data === 'object') {
          if ('content' in response.data && Array.isArray(response.data.content)) {
            products = response.data.content;
          } else {
            products = normalizeProductListPayload(response.data);
          }
        }

        let mapped = products
          .map((row) => mapApiProductToProductItem(row))
          .filter(Boolean) as ProductItem[];

        // Apply additional client-side filters for colors, sizes, genders
        if (routedColorNames.length > 0) {
          mapped = mapped.filter(p => {
            const productColor = (p as any).color?.toLowerCase() || '';
            return routedColorNames.some(c => productColor.includes(c.toLowerCase()));
          });
        }

        if (routedSizeNames.length > 0) {
          mapped = mapped.filter(p => {
            const productSize = (p as any).size?.toLowerCase() || '';
            return routedSizeNames.some(s => productSize.includes(s.toLowerCase()));
          });
        }

        if (routedGenders.length > 0) {
          mapped = mapped.filter(p => {
            const productGender = (p as any).gender?.toLowerCase() || '';
            return routedGenders.some(g => productGender.includes(g.toLowerCase()));
          });
        }

        setFilteredProducts(mapped);
      } catch (error) {
        console.error("Error fetching filtered products:", error);
        if (!controller.signal.aborted) {
          setFilteredProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setFilteredProductsLoading(false);
          setFilteredProductsReady(true);
        }
      }
    })();

    return () => controller.abort();
  }, [
    isFilterApplied,
    routedCategoryIds,
    routedColorNames,
    routedSizeNames,
    routedGenders,
    routedMinPrice,
    routedMaxPrice,
    routedMinRating,
  ]);

  useEffect(() => {
    const subNorm = String(selectedSubCategory ?? "").trim().toLowerCase();
    if (subNorm !== "top picks for you") {
      setTopPicksProducts([]);
      setTopPicksReady(false);
      return;
    }

    console.log("Top Picks: Starting API call for", TOP_PICKS_POPULAR_PATH);
    setTopPicksReady(false);
    const controller = new AbortController();
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        console.log("Top Picks: API timeout - using fallback");
        setTopPicksProducts([]);
        setTopPicksReady(true);
      }
    }, 10000); // 10 second timeout

    (async () => {
      try {
        const { data } = await api.get<unknown>(TOP_PICKS_POPULAR_PATH, {
          signal: controller.signal,
          timeout: 8000, // 8 second timeout for axios
        });
        if (controller.signal.aborted) return;
        
        clearTimeout(timeoutId);
        console.log("Top Picks: Raw API response received");
        const rows = normalizeProductListPayload(data);
        console.log("Top Picks: Normalized rows count:", rows.length);

        // If no rows, try to find data in nested structure
        if (rows.length === 0 && data && typeof data === "object") {
          console.log("Top Picks: No rows found, checking nested structure");
          // Try to extract from common nested patterns
          const nestedKeys = ["content", "data", "products", "items", "records", "results", "rows"];
          for (const key of nestedKeys) {
            if (data[key] && Array.isArray(data[key])) {
              rows.push(...data[key]);
              console.log(`Top Picks: Found ${data[key].length} items in "${key}"`);
              break;
            }
          }
        }

        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          require("../assets/images/fntfav.png"),
          { requireProductActive: false }
        );
        console.log("Top Picks: Mapped products count:", mapped.length);
        
        const products: ProductItem[] = mapped.map((m) => ({
          ...m,
          catalogCategory: "Top picks for you",
        }));
        console.log("Top Picks: Setting", products.length, "products");
        setTopPicksProducts(products);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Top Picks API Error:", error);
        // Set empty array but mark as ready to prevent infinite loading
        setTopPicksProducts([]);
      } finally {
        if (!controller.signal.aborted) {
          console.log("Top Picks: Setting ready to true");
          setTopPicksReady(true);
        }
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [selectedSubCategory]);

  useEffect(() => {
    setBestDressReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get<unknown>(BEST_OF_DRESSES_PATH, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          require("../assets/images/look1.png"),
          { requireProductActive: false }
        );
        setBestDressProducts(mapped);
      } catch {
        setBestDressProducts([]);
      } finally {
        if (!controller.signal.aborted) setBestDressReady(true);
      }
    })();
    return () => controller.abort();
  }, []);

  const bestOfDressCards = useMemo<BestDressItem[]>(() => {
    if (!bestDressReady || bestDressProducts.length === 0) return BEST_OF_DRESSES;
    return bestDressProducts.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.price > 0 ? `Starts at ₹${p.price}` : p.discount || "Best picks",
      image: p.image,
      sourceProduct: p,
    }));
  }, [bestDressProducts, bestDressReady]);

  useEffect(() => {
    const subNorm = String(selectedSubCategory ?? "").trim().toLowerCase();
    if (subNorm !== "mega discounts") {
      setMegaDiscountProducts([]);
      setMegaDiscountReady(false);
      return;
    }

    setMegaDiscountReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get<unknown>(DISCOUNT_TOP_PRODUCTS_PATH, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          require("../assets/images/megadis1.png"),
          { requireProductActive: false }
        );
        const products: ProductItem[] = mapped.map((m) => ({
          ...m,
          catalogCategory: "Mega Discounts",
        }));
        setMegaDiscountProducts(products);
      } catch {
        setMegaDiscountProducts([]);
      } finally {
        if (!controller.signal.aborted) setMegaDiscountReady(true);
      }
    })();

    return () => controller.abort();
  }, [selectedSubCategory]);

  useEffect(() => {
    const subNorm = String(selectedSubCategory ?? "").trim().toLowerCase();
    if (subNorm !== "premium finds") {
      setPremiumFindsProducts([]);
      setPremiumFindsReady(false);
      return;
    }

    setPremiumFindsReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get<unknown>(TOP_SELLING_PRICE_PRODUCTS_PATH, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const rows = normalizeProductListPayload(data);
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          require("../assets/images/premium1.png"),
          { requireProductActive: false }
        );
        const products: ProductItem[] = mapped.map((m) => ({
          ...m,
          catalogCategory: "Premium finds",
        }));
        setPremiumFindsProducts(products);
      } catch {
        setPremiumFindsProducts([]);
      } finally {
        if (!controller.signal.aborted) setPremiumFindsReady(true);
      }
    })();

    return () => controller.abort();
  }, [selectedSubCategory]);

  useEffect(() => {
    const subNorm = String(selectedSubCategory ?? "").trim().toLowerCase();
    if (subNorm !== "fresh finds") {
      setFreshFindsProducts([]);
      setFreshFindsReady(false);
      return;
    }

    setFreshFindsReady(false);
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await api.get<unknown>(FRESH_FINDS_RECENT_PATH, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        
        const rows = normalizeProductListPayload(data);
        
        const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
        const mapped = mapMorePicksApiToGrid(
          rows,
          base,
          require("../assets/images/product1.png"),
          { requireProductActive: false }
        );
        
        const products: ProductItem[] = mapped.map((m) => ({
          ...m,
          catalogCategory: "Fresh finds",
        }));
        setFreshFindsProducts(products);
      } catch (error) {
        console.error("Fresh Finds API Error:", error);
        setFreshFindsProducts([]);
      } finally {
        if (!controller.signal.aborted) setFreshFindsReady(true);
      }
    })();

    return () => controller.abort();
  }, [selectedSubCategory]);

  const routedSubcategoryProducts = React.useMemo(() => {
    if (!selectedSubCategory?.trim()) return [];
    const subNorm = selectedSubCategory.trim().toLowerCase();
    if (mainCat === "accessories" && subNorm === "all accessories") {
      return ACCESSORIES_SHOP_ALL_LABELS.flatMap((label) =>
        buildProductsForCategory(
          label,
          mainCat ?? undefined,
          selectedGender || undefined
        )
      );
    }
    if (mainCat === "accessories" && subNorm === "top collection") {
      return ACCESSORIES_TOP_COLLECTION_LABELS.flatMap((label) =>
        buildProductsForCategory(
          label,
          mainCat ?? undefined,
          selectedGender || undefined
        )
      );
    }
    const matchedCat = categoryOptions.find(
      (c) => c.toLowerCase() === subNorm
    );
    if (matchedCat)
      return buildProductsForCategory(
        matchedCat,
        mainCat ?? undefined,
        selectedGender || undefined
      );
    return categoryProducts;
  }, [selectedSubCategory, categoryProducts, mainCat, selectedGender]);

const effectiveRoutedSubcategoryProducts = React.useMemo(() => {
  const subNorm = String(selectedSubCategory ?? "").trim().toLowerCase();

  // Handle filters from home.tsx filter modal (highest priority)
  if (isFilterApplied) {
    if (!filteredProductsReady) return [];
    return filteredProducts;
  }

  if (routedFromProductsSearch) {
    if (!productsSearchApiReady) return [];
    return productsSearchApiProducts;
  }

  if (routedFromMainCategoryPath) {
    if (!mainCategoryPathReady) return [];
    return mainCategoryPathProducts;
  }

  if (routedFromMainCategoryFeed) {
    if (!mainCategoryFeedReady) return [];
    return mainCategoryFeedProducts;
  }

  if (routedFromMainCategoryId) {
    if (!mainCategoryApiReady) return [];
    return mainCategoryApiProducts;
  }

  // Handle Top Picks for You category
  if (subNorm === "top picks for you") {
    if (!topPicksReady) return [];
    return topPicksProducts;
  }

  // Handle Mega Discounts category
  if (subNorm === "mega discounts") {
    if (!megaDiscountReady) return [];
    return megaDiscountProducts;
  }

  // Handle Premium finds category
  if (subNorm === "premium finds") {
    if (!premiumFindsReady) return [];
    return premiumFindsProducts;
  }

  // Handle Fresh finds category
  if (subNorm === "fresh finds") {
    if (!freshFindsReady) return [];
    return freshFindsProducts;
  }

  // Handle routed by categoryId (from category modal selection)
  if (Number.isFinite(routedCategoryId) && routedCategoryId > 0) {
    if (!categoryApiReady) return [];
    return categoryApiProducts;
  }

  // Handle routed by subcategoryId
  if (routedFromSubcategoryId) {
    if (!apiRoutedFromIdReady) return [];
    return apiRoutedProducts;
  }

  return routedSubcategoryProducts;
}, [
  selectedSubCategory,
  routedFromSubcategoryId,
  apiRoutedFromIdReady,
  apiRoutedProducts,
  routedSubcategoryProducts,
  topPicksReady,
  topPicksProducts,
  megaDiscountReady,
  megaDiscountProducts,
  premiumFindsReady,
  premiumFindsProducts,
  freshFindsReady,
  freshFindsProducts,
  routedFromMainCategoryId,
  routedFromMainCategoryPath,
  mainCategoryPathReady,
  mainCategoryPathProducts,
  routedFromMainCategoryFeed,
  mainCategoryApiReady,
  routedCategoryId,
  categoryApiReady,
  categoryApiProducts,
  mainCategoryApiProducts,
  mainCategoryFeedReady,
  mainCategoryFeedProducts,
  routedFromProductsSearch,
  productsSearchApiReady,
  productsSearchApiProducts,
  isFilterApplied,
  filteredProductsReady,
  filteredProducts,
]);

const filteredRoutedProducts = React.useMemo(() => {
  if (!selectedSubCategory?.trim()) return [];
  return runProductPipeline(
    effectiveRoutedSubcategoryProducts,
    searchQuery,
    selectedFilters,
    selectedCategory,
    selectedGender,
    selectedSort
  );
}, [
  selectedSubCategory,
  effectiveRoutedSubcategoryProducts,
  searchQuery,
  selectedFilters,
  selectedCategory,
  selectedGender,
  selectedSort,
]);

const expandedCategoryProducts = React.useMemo(() => {
  if (!expandedCategory) return [];
  const list = buildProductsForCategory(
    expandedCategory,
    mainCat ?? undefined,
    selectedGender || undefined
  );
  return runProductPipeline(
    list,
    searchQuery,
    selectedFilters,
    selectedCategory,
    selectedGender,
    selectedSort
  );
}, [
  expandedCategory,
  mainCat,
  searchQuery,
  selectedFilters,
  selectedCategory,
  selectedGender,
  selectedSort,
]);

const similarProductsPool = hasSubCategoryFromRoute
  ? filteredRoutedProducts
  : expandedCategory
    ? expandedCategoryProducts
    : filteredCategoryProducts;

/** Catalog used for "matching products" counts inside filter / category / gender modals */
const filterPipelineBaseProducts = React.useMemo(() => {
  if (hasSubCategoryFromRoute) return effectiveRoutedSubcategoryProducts;
  if (expandedCategory)
    return buildProductsForCategory(
      expandedCategory,
      mainCat ?? undefined,
      selectedGender || undefined
    );
  return allBrowseCatalogFlat;
}, [
  hasSubCategoryFromRoute,
  expandedCategory,
  effectiveRoutedSubcategoryProducts,
  allBrowseCatalogFlat,
  mainCat,
  selectedGender,
]);

const matchingProductsCount = React.useMemo(
  () =>
    runProductPipeline(
      filterPipelineBaseProducts,
      searchQuery,
      selectedFilters,
      selectedCategory,
      selectedGender,
      selectedSort
    ).length,
  [
    filterPipelineBaseProducts,
    searchQuery,
    selectedFilters,
    selectedCategory,
    selectedGender,
    selectedSort,
  ]
);

const filtersModalCheckboxCount = React.useMemo(
  () =>
    Object.values(selectedFilters).reduce((n, arr) => n + arr.length, 0),
  [selectedFilters]
);

const totalFacetSelections =
  filtersModalCheckboxCount +
  selectedCategory.length +
  (selectedGender ? 1 : 0);

const productCatalogById = React.useMemo(() => {
  const m = new Map<string, ProductItem>();
  for (const p of PRODUCTS) m.set(p.id, p);
  for (const p of categoryProducts) m.set(p.id, p);
  for (const p of apiRoutedProducts) m.set(p.id, p);
  for (const p of mainCategoryApiProducts) m.set(p.id, p);
  for (const p of productsSearchApiProducts) m.set(p.id, p);
  for (const p of topPicksProducts) m.set(p.id, p);
  for (const p of megaDiscountProducts) m.set(p.id, p);
  for (const p of premiumFindsProducts) m.set(p.id, p);
  for (const p of freshFindsProducts) m.set(p.id, p);
  for (const cat of categoryOptions) {
    for (const p of buildProductsForCategory(
      cat,
      mainCat ?? undefined,
      selectedGender || undefined
    )) {
      m.set(p.id, p);
    }
  }
  return m;
}, [
  categoryProducts,
  mainCat,
  selectedGender,
  apiRoutedProducts,
  mainCategoryApiProducts,
  productsSearchApiProducts,
  topPicksProducts,
  megaDiscountProducts,
  premiumFindsProducts,
  freshFindsProducts,
]);

const wishlistedProducts = React.useMemo(() => {
  return wishlistItems
    .map((id) => productCatalogById.get(id))
    .filter((p): p is ProductItem => p !== null);
}, [wishlistItems, productCatalogById]);

  const wishlistApiKeys = useMemo(
    () =>
      new Set(
        wishlistApiEntries.map((e) => `${e.productId}-${e.variantId}`)
      ),
    [wishlistApiEntries]
  );

  const wishlistBadgeCount = hasAuthToken
    ? wishlistApiEntries.length
    : wishlistItems.length;

  const loadWishlistFromApi = useCallback(async () => {
    const t = (await AsyncStorage.getItem("token"))?.trim();
    setHasAuthToken(!!t);
    if (!t) {
      setWishlistApiEntries([]);
      return;
    }
    try {
      const { data } = await api.get<unknown>(WISHLIST_USER_PATH);
      const rows = normalizeWishlistApiRows(data);
      const ph = require("../assets/images/product1.png");
      const entries = rows
        .map((r) => mapWishlistRowToSubcatEntry(r, ph))
        .filter((x): x is SubcatWishlistApiEntry => x != null);
      setWishlistApiEntries(entries);
    } catch {
      setWishlistApiEntries([]);
    }
  }, []);

  const reloadCartBadge = useCallback(async () => {
    setCartBadgeCount(await getCartUnitCount());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWishlistFromApi();
      void reloadCartBadge();
    }, [loadWishlistFromApi, reloadCartBadge])
  );

  const isProductInWishlist = useCallback(
    (product: ProductItem) => {
      const idStr = String(product.id ?? "").trim();
      if (hasAuthToken && /^\d+$/.test(idStr) && product.variantId) {
        return wishlistApiKeys.has(
          `${Math.floor(Number(idStr))}-${product.variantId}`
        );
      }
      return wishlistItems.includes(product.id);
    },
    [hasAuthToken, wishlistApiKeys, wishlistItems]
  );

  const handleWishlistPress = useCallback(
    async (product: ProductItem) => {
      const token = (await AsyncStorage.getItem("token"))?.trim();
      const idStr = String(product.id ?? "").trim();
      const pidNum = Math.floor(Number(product.id));

      if (
        token &&
        /^\d+$/.test(idStr) &&
        Number.isFinite(pidNum) &&
        pidNum > 0
      ) {
        const vid = product.variantId;
        if (!vid || vid <= 0) {
          Alert.alert(
            tr("Choose options"),
            tr("Open the product page, pick size and color, then add to wishlist.")
          );
          return;
        }
        const key = `${pidNum}-${vid}`;
        try {
          if (wishlistApiKeys.has(key)) {
            await api.delete(WISHLIST_REMOVE_PATH, {
              params: { productId: pidNum, variantId: vid },
            });
            await removeWishlistLine(String(pidNum));
            await loadWishlistFromApi();
            Alert.alert(
              tr("Removed"),
              `"${tr(product.title)}" ${tr("was removed from your wishlist.")}`
            );
          } else {
            await api.post(WISHLIST_ADD_PATH, {
              productId: pidNum,
              variantId: vid,
            });
            await addWishlistProductIfAbsent({
              id: String(pidNum),
              name: product.title,
              price: product.price,
              mrp: product.mrp,
            });
            await loadWishlistFromApi();
            Alert.alert(tr("Added to wishlist"), tr(product.title));
          }
        } catch (e: unknown) {
          const ax = e as { response?: { data?: unknown } };
          let msg = tr("Wishlist could not be updated. Please try again.");
          const d = ax.response?.data;
          if (typeof d === "string" && d.trim()) msg = d.trim();
          else if (d && typeof d === "object") {
            const m = (d as { message?: unknown }).message;
            if (typeof m === "string" && m.trim()) msg = m.trim();
          }
          Alert.alert(tr("Wishlist"), tr(msg));
        }
        return;
      }

      setWishlistItems((prev) =>
        prev.includes(product.id)
          ? prev.filter((id) => id !== product.id)
          : [...prev, product.id]
      );
    },
    [wishlistApiKeys, loadWishlistFromApi]
  );

  const confirmRemoveApiWishlistEntry = useCallback(
    (entry: SubcatWishlistApiEntry) => {
      Alert.alert(
        tr("Remove item"),
        `${tr("Remove")} "${tr(entry.title)}" ${tr("from your wishlist?")}`,
        [
          { text: tr("Cancel"), style: "cancel" },
          {
            text: tr("Remove"),
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  await api.delete(WISHLIST_REMOVE_PATH, {
                    params: {
                      productId: entry.productId,
                      variantId: entry.variantId,
                    },
                  });
                  await removeWishlistLine(String(entry.productId));
                  await loadWishlistFromApi();
                  Alert.alert(
                    tr("Removed"),
                    tr("Item has been removed from your wishlist.")
                  );
                } catch (e: unknown) {
                  const ax = e as { response?: { data?: unknown } };
                  let msg = tr("Could not remove this item.");
                  const d = ax.response?.data;
                  if (typeof d === "string" && d.trim()) msg = d.trim();
                  else if (d && typeof d === "object") {
                    const m = (d as { message?: unknown }).message;
                    if (typeof m === "string" && m.trim()) msg = m.trim();
                  }
                  Alert.alert(tr("Wishlist"), tr(msg));
                }
              })();
            },
          },
        ]
      );
    },
    [loadWishlistFromApi]
  );

const handleBannerScroll = (event: any) => {
  const slideIndex = Math.round(
    event.nativeEvent.contentOffset.x / bannerWidth
  );
  setBannerIndex(slideIndex);
};

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => {
        const nextIndex = (prev + 1) % bannerImages.length;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: bannerWidth * nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setExpandedCategory(null);
  }, [selectedSubCategory]);

  const addToCart = (product: ProductItem) => {
    void (async () => {
      const pid = Math.floor(Number(product.id));
      const r = await addToCartPtbOrLocal({
        productId: pid,
        variantId: product.variantId,
        quantity: 1,
        localLine: {
          id: product.id,
          name: product.title,
          price: product.price,
          mrp: product.mrp,
        },
      });
      if (r.ok === false) {
        Alert.alert(tr("Cart"), tr(r.message));
        return;
      }
      setCartBadgeCount(await getCartUnitCount());
      Alert.alert(tr("Added to cart"), tr(product.title));
    })();
  };

  const openSimilarProducts = (currentProduct: ProductItem) => {
    const items = similarProductsPool.filter(
      (product) => product.id !== currentProduct.id
    );
    setSimilarProducts(
      items.length > 0 ? items : similarProductsPool
    );
    setSimilarModalVisible(true);
  };

  const openProductDetail = (product?: ProductItem) => {
    const raw = product ? String(product.id ?? "").trim() : "";
    if (raw && /^\d+$/.test(raw)) {
      router.push({ pathname: "/productdetail", params: { id: raw } } as any);
    } else {
      router.push("/productdetail");
    }
  };

  const ProductCatalogCard = ({ product }: { product: ProductItem }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => openProductDetail(product)}
    >
      <View style={styles.productImageWrapper}>
        <Image
          source={product.image}
          style={styles.productImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.productWishlistButton}
          activeOpacity={0.85}
          onPress={(event) => {
            event.stopPropagation();
            void handleWishlistPress(product);
          }}
        >
          <Ionicons
            name={
              isProductInWishlist(product) ? "heart" : "heart-outline"
            }
            size={20}
            color={
              isProductInWishlist(product) ? "#EF4444" : "#374151"
            }
          />
        </TouchableOpacity>
      </View>

      <View style={styles.productInfoPanel}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {tr(product.title)}
        </Text>
        <Text style={styles.productSubtitle} numberOfLines={1}>
          {tr(product.benefitText)}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceCurrent}>₹{product.price}</Text>
          <Text style={styles.priceMrp}>₹{product.mrp}</Text>
          <Text style={styles.priceDiscount}>{product.discount}</Text>
        </View>

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
          <Text style={styles.ratingCount}>({product.ratingCount})</Text>
          <TouchableOpacity
            style={styles.similarIconButton}
            onPress={(event) => {
              event.stopPropagation();
              openSimilarProducts(product);
            }}
          >
            <Ionicons name="sparkles-outline" size={14} color="#1d324e" />
          </TouchableOpacity>
        </View>

        <View style={styles.productActionsRow}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => addToCart(product)}
          >
            <Ionicons
              name="cart-outline"
              size={17}
              color="#FFFFFF"
              style={styles.addToCartIcon}
            />
            <Text style={styles.addToCartText}>ADD TO CART</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const headerTitleText =
    !isSearchVisible &&
    expandedCategory &&
    !hasSubCategoryFromRoute
      ? expandedCategory.toUpperCase()
      : pageTitle;

  const latestProductsRow =
    routedFromMainCategoryId && latestMainCategoryReady
      ? latestMainCategoryProducts
      : hasSubCategoryFromRoute
      ? filteredRoutedProducts
      : filteredCategoryProducts;

  const handleHeaderBack = () => {
    if (!hasSubCategoryFromRoute && expandedCategory) {
      setExpandedCategory(null);
      return;
    }
    if (isSearchVisible) {
      setIsSearchVisible(false);
      return;
    }
    if (hasSubCategoryFromRoute && mainCat) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({ pathname: "/subcate", params: { mainCat } });
      }
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/categories");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleHeaderBack}
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>

        {isSearchVisible ? (
          <View style={styles.headerSearchWrapper}>
            <TextInput
              placeholder="Search products"
              placeholderTextColor="#69798c"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  router.push({ pathname: "/searchresults", params: { q: searchQuery } });
                }
              }}
              style={styles.searchInputHeader}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>{headerTitleText}</Text>
        )}

        <View style={styles.headerRight}>
          <View style={styles.headerIconWrapper}>
            <TouchableOpacity
              onPress={() => setIsSearchVisible((prev) => !prev)}
              style={styles.headerRightIcon}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#1d324e"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.headerIconWrapper}
            onPress={() => {
              void loadWishlistFromApi();
              setWishlistModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                wishlistBadgeCount > 0 ? "heart" : "heart-outline"
              }
              size={20}
              color={wishlistBadgeCount > 0 ? "#EF4444" : "#1d324e"}
              style={styles.headerRightIcon}
            />
            {wishlistBadgeCount > 0 && (
              <View style={styles.headerBadge} pointerEvents="none">
                <Text style={styles.headerBadgeText}>
                  {wishlistBadgeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* <View style={styles.headerIconWrapper}>
            <Ionicons name="bag-outline" size={20} color="#1d324e" />
            {cartBadgeCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {cartBadgeCount > 99 ? "99+" : String(cartBadgeCount)}
                </Text>
              </View>
            )}
          </View> */}
        </View>
      </View>

      {/* LOCATION BAR */}
      <View style={styles.locationBarWrapper}>
        <DeliveryLocationSection enableFullAddressApi />
      </View>

      {/* STICKY SORT / CATEGORY / GENDER / FILTERS ROW */}
      <View style={styles.sortTabsRow}>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Sort")}
        >
          <View style={styles.sortTabInner}>
            <View style={styles.sortTabLabelRow}>
              <Text style={styles.sortTabText}>Sort</Text>
              <Ionicons name="chevron-down" size={14} color="#1d324e" />
            </View>
            {selectedSort !== "Relevance" ? (
              <Text style={styles.sortTabHint} numberOfLines={1}>
                {selectedSort}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Category")}
        >
          <View style={styles.sortTabInner}>
            <View style={styles.sortTabLabelRow}>
              <Text style={styles.sortTabText}>Category</Text>
              <Ionicons name="chevron-down" size={14} color="#1d324e" />
            </View>
            {selectedCategory.length > 0 ? (
              <Text style={styles.sortTabHint} numberOfLines={1}>
                {selectedCategory.length} selected
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Gender")}
        >
          <View style={styles.sortTabInner}>
            <View style={styles.sortTabLabelRow}>
              <Text style={styles.sortTabText}>Gender</Text>
              <Ionicons name="chevron-down" size={14} color="#1d324e" />
            </View>
            {selectedGender ? (
              <Text style={styles.sortTabHint} numberOfLines={1}>
                {selectedGender}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortTab, styles.sortTabLast]}
          onPress={() => handleFilterPress("Filters")}
        >
          <View style={styles.sortTabInner}>
            <View style={styles.sortTabLabelRow}>
              <Text style={styles.sortTabText}>
                Filters
                {totalFacetSelections > 0
                  ? ` (${totalFacetSelections})`
                  : ""}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#1d324e" />
            </View>
            {filtersModalCheckboxCount > 0 ? (
              <Text style={styles.sortTabHint} numberOfLines={1}>
                {filtersModalCheckboxCount} in panel
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>

      {(totalFacetSelections > 0 || selectedSort !== "Relevance") && (
        <View style={styles.activeChipsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsScroll}
          >
            {selectedSort !== "Relevance" && (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => setSelectedSort("Relevance")}
              >
                <Text style={styles.filterChipText} numberOfLines={1}>
                  Sort: {selectedSort}
                </Text>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
            {selectedGender ? (
              <TouchableOpacity
                style={styles.filterChip}
                onPress={() => setSelectedGender("")}
              >
                <Text style={styles.filterChipText} numberOfLines={1}>
                  {selectedGender}
                </Text>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
            {selectedCategory.map((c) => (
              <TouchableOpacity
                key={`chip-cat-${c}`}
                style={styles.filterChip}
                onPress={() => toggleCategory(c)}
              >
                <Text style={styles.filterChipText} numberOfLines={1}>
                  {c}
                </Text>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </TouchableOpacity>
            ))}
            {Object.entries(selectedFilters).flatMap(([section, vals]) =>
              vals.map((v) => (
                <TouchableOpacity
                  key={`chip-${section}-${v}`}
                  style={styles.filterChip}
                  onPress={() => toggleFilterOption(section, v)}
                >
                  <Text style={styles.filterChipText} numberOfLines={1}>
                    {section}: {v}
                  </Text>
                  <Ionicons name="close-circle" size={18} color="#6B7280" />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={styles.filterChipClear}
              onPress={clearAllProductFilters}
            >
              <Text style={styles.filterChipClearText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROMO STRIP */}
        <View style={styles.promoStrip}>
          <View style={[styles.promoCard, styles.promoLeft]}>
            <Ionicons name="pricetag" size={20} color="#FFFFFF" style={styles.promoIcon} />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoHighlight}>40% off</Text>
              <Text style={styles.promoSub}>upto ₹400</Text>
            </View>
          </View>
          <View style={[styles.promoCard, styles.promoRight]}>
            <Ionicons name="sync" size={20} color="#FFFFFF" style={styles.promoIcon} />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoHighlight}>EASY</Text>
              <Text style={styles.promoSub}>Returns</Text>
            </View>
          </View>
        </View>

        {hasSubCategoryFromRoute ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {tr("ALL")} <Text style={styles.sectionTitleAccent}>{tr("PRODUCTS")}</Text>
              </Text>
              <Text style={styles.categoryProductCount}>
                {filteredRoutedProducts.length} {tr("items")}
              </Text>
            </View>
            {(routedFromSubcategoryId && !apiRoutedFromIdReady) ||
            (routedFromMainCategoryPath && !mainCategoryPathReady) ||
            (routedFromMainCategoryFeed && !mainCategoryFeedReady) ||
            (routedFromMainCategoryId && !mainCategoryApiReady) ||
            (routedFromProductsSearch && !productsSearchApiReady) ||
            (isFilterApplied && filteredProductsLoading) ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner}>
                  <Animated.Image 
                    source={require("../assets/images/fntfav.png")} 
                    style={[
                      styles.loadingLogo,
                      {
                        transform: [{ scale: logoScale }],
                        opacity: logoOpacity
                      }
                    ]}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : null}
            <View style={styles.productGrid}>
              {filteredRoutedProducts.map((product) => (
                <ProductCatalogCard key={product.id} product={product} />
              ))}
            </View>
          </>
        ) : expandedCategory ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {tr("ALL")} <Text style={styles.sectionTitleAccent}>{tr("PRODUCTS")}</Text>
              </Text>
              <Text style={styles.categoryProductCount}>
                {expandedCategoryProducts.length} {tr("items")}
              </Text>
            </View>
            <View style={styles.productGrid}>
              {expandedCategoryProducts.map((product) => (
                <ProductCatalogCard key={product.id} product={product} />
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {tr("SHOP BY")}{" "}
                <Text style={styles.sectionTitleAccent}>{tr("CATEGORY")}</Text>
              </Text>
            </View>
            {browseCategoryOptions.map((cat) => {
              const piped = runProductPipeline(
                buildProductsForCategory(
                  cat,
                  mainCat ?? undefined,
                  selectedGender || undefined
                ),
                searchQuery,
                selectedFilters,
                selectedCategory,
                selectedGender,
                selectedSort
              );
              const filteredPreview = piped.slice(0, CATEGORY_PREVIEW_COUNT);
              if (filteredPreview.length === 0) return null;
              return (
                <View key={cat} style={styles.categorySectionBlock}>
                  <TouchableOpacity
                    style={styles.categorySectionHeader}
                    activeOpacity={0.75}
                    onPress={() => setExpandedCategory(cat)}
                  >
                    <Text style={styles.categorySectionTitle}>{tr(cat)}</Text>
                    <View style={styles.categoryViewAllRow}>
                      <Text style={styles.categoryViewAllText}>{tr("View all")}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#ef7b1a"
                      />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.productGrid}>
                    {filteredPreview.map((product) => (
                      <ProductCatalogCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* BEST OF DRESSES SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{tr("BEST OF DRESS")}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bestRow}
        >
          {bestOfDressCards.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.bestCard}
              activeOpacity={0.9}
              onPress={() => openProductDetail(item.sourceProduct)}
            >
              <View style={styles.bestImageWrapper}>
                <Image
                  source={item.image}
                  style={styles.bestImage}
                  resizeMode="cover"
                />
                {item.isVideo && (
                  <View style={styles.playBadge}>
                    <Ionicons name="play" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.bestTitle} numberOfLines={1}>
                {tr(item.title)}
              </Text>
              <Text style={styles.bestSubtitle} numberOfLines={1}>
                {tr(item.subtitle)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TRENDING DRESSES BANNER */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{tr("TRENDING DRESSES")}</Text>
        </View>

        <View style={styles.bannerCarouselWrapper}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
          >
            {bannerImages.map((image, index) => (
              <View key={index} style={[styles.bannerCard, { width: bannerWidth }]}>
                <Image
                  source={image}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dotsRow}>
          {bannerImages.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === bannerIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* LATEST PRODUCTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{tr("LATEST PRODUCTS")}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.latestRow}
        >
          {latestProductsRow.map((product) => (
            <TouchableOpacity
              key={`latest-${product.id}`}
              style={styles.latestCard}
              activeOpacity={0.9}
              onPress={() => openProductDetail()}
            >
              <Image
                source={product.image}
                style={styles.latestImage}
                resizeMode="cover"
              />
              <Text style={styles.latestTitle} numberOfLines={1}>
                {tr(product.title)}
              </Text>
              <Text style={styles.latestPrice}>₹{product.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* SIMILAR PRODUCTS POPUP */}
      <Modal
        visible={similarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSimilarModalVisible(false)}
      >
        <View style={styles.similarModalOverlay}>
          <View style={styles.similarModalCard}>
            <View style={styles.similarModalHeader}>
              <Text style={styles.similarModalTitle}>{tr("SIMILAR PRODUCTS")}</Text>
              <TouchableOpacity onPress={() => setSimilarModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarProductsRow}
            >
              {similarProducts.map((product) => (
                <TouchableOpacity
                  key={`similar-${product.id}`}
                  style={styles.similarProductCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    setSimilarModalVisible(false);
                    openProductDetail(product);
                  }}
                >
                  <Image
                    source={product.image}
                    style={styles.similarProductImage}
                    resizeMode="cover"
                  />
                  <View style={styles.similarInfoPanel}>
                    <Text style={styles.similarProductTitle} numberOfLines={2}>
                      {tr(product.title)}
                    </Text>
                    <Text style={styles.similarProductSubtitle} numberOfLines={1}>
                      {tr(product.benefitText)}
                    </Text>
                    <View style={styles.similarPriceRow}>
                      <Text style={styles.similarProductPrice}>₹{product.price}</Text>
                      <Text style={styles.similarProductMrp}>₹{product.mrp}</Text>
                    </View>
                    <View style={styles.similarRatingRow}>
                      <View style={styles.similarRatingBadge}>
                        <Text style={styles.similarRatingText}>{product.rating}</Text>
                        <Ionicons name="star" size={9} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      </View>
                      <Text style={styles.similarRatingCount}>({product.ratingCount})</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* WISHLIST */}
      <Modal
        visible={wishlistModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWishlistModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.wishlistModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tr("WISHLIST")} ({wishlistBadgeCount})
              </Text>
              <TouchableOpacity onPress={() => setWishlistModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.wishlistScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.wishlistScrollContent}
            >
              {wishlistBadgeCount === 0 ? (
                <View style={styles.wishlistEmpty}>
                  <Ionicons
                    name="heart-outline"
                    size={52}
                    color="#D1D5DB"
                  />
                  <Text style={styles.wishlistEmptyTitle}>
                    {tr("Your wishlist is empty")}
                  </Text>
                  <Text style={styles.wishlistEmptySub}>
                    {tr("Tap the heart on a product to save it here")}
                  </Text>
                </View>
              ) : hasAuthToken ? (
                wishlistApiEntries.map((entry) => (
                  <View
                    key={`${entry.productId}-${entry.variantId}`}
                    style={styles.wishlistRow}
                  >
                    <TouchableOpacity
                      style={styles.wishlistRowMain}
                      activeOpacity={0.85}
                      onPress={() => {
                        setWishlistModalVisible(false);
                        router.push({
                          pathname: "/productdetail",
                          params: { id: String(entry.productId) },
                        } as any);
                      }}
                    >
                      <Image
                        source={entry.image}
                        style={styles.wishlistRowImage}
                        resizeMode="cover"
                      />
                      <View style={styles.wishlistRowBody}>
                        <Text
                          style={styles.wishlistRowTitle}
                          numberOfLines={2}
                        >
                          {tr(entry.title)}
                        </Text>
                        <Text style={styles.wishlistRowPrice}>
                          ₹{entry.price}
                        </Text>
                        <Text style={styles.wishlistRowMrp}>₹{entry.mrp}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.wishlistRemoveButton}
                      onPress={() => confirmRemoveApiWishlistEntry(entry)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="heart" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                wishlistedProducts.map((product) => (
                  <View key={product.id} style={styles.wishlistRow}>
                    <TouchableOpacity
                      style={styles.wishlistRowMain}
                      activeOpacity={0.85}
                      onPress={() => {
                        setWishlistModalVisible(false);
                        openProductDetail(product);
                      }}
                    >
                      <Image
                        source={product.image}
                        style={styles.wishlistRowImage}
                        resizeMode="cover"
                      />
                      <View style={styles.wishlistRowBody}>
                        <Text
                          style={styles.wishlistRowTitle}
                          numberOfLines={2}
                        >
                          {tr(product.title)}
                        </Text>
                        <Text style={styles.wishlistRowPrice}>
                          ₹{product.price}
                        </Text>
                        <Text style={styles.wishlistRowMrp}>₹{product.mrp}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.wishlistRemoveButton}
                      onPress={() =>
                        setWishlistItems((prev) =>
                          prev.filter((id) => id !== product.id)
                        )
                      }
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="heart" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
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

            {sortOptions.map((item) => (
              <TouchableOpacity
                key={item}
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
              {displayedCategories.map((item) => (
                <TouchableOpacity
                  key={item}
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
              <Text style={styles.productCount}>
                {matchingProductsCount} products
              </Text>
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
              <Text style={styles.modalTitle}>GENDER</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.genderContainer}>
              {genderOptions.map((item) => (
                <TouchableOpacity
                  key={item.label}
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
              <Text style={styles.productCount}>
                {matchingProductsCount} products
              </Text>
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
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={clearAllProductFilters}>
                  <Text style={styles.clearFiltersText}>Clear all</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={30} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterContent}>
              <ScrollView
                style={styles.filterLeftPanel}
                showsVerticalScrollIndicator={false}
              >
                {filterSections.map((item) => {
                  const sectionCount = selectedFilters[item]?.length || 0;
                  return (
                    <TouchableOpacity
                      key={item}
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
                      {sectionCount > 0 ? (
                        <View style={styles.filterSectionCountBadge}>
                          <Text style={styles.filterSectionCountText}>
                            {sectionCount}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
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
                  {displayedFilterOptions.map((item) => {
                    const isSelected =
                      selectedFilters[selectedFilterSection]?.includes(item) ||
                      false;

                    return (
                      <TouchableOpacity
                        key={item}
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
              <Text style={styles.productCount}>
                {matchingProductsCount} products
              </Text>
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

      {/* Bottom navigation (Home-like) */}
      <HomeBottomTabBar cartBadgeCount={cartBadgeCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    maxWidth: isDesktop ? 1200 : "100%",
    marginHorizontal: isDesktop ? "auto" : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: isDesktop ? 56 : 48,
    paddingHorizontal: isDesktop ? 24 : 16,
    paddingBottom: isDesktop ? 14 : 10,
    backgroundColor: "#f6c795",
  },
  headerIconButton: {
    paddingRight: isDesktop ? 12 : 8,
    paddingVertical: isDesktop ? 6 : 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    marginLeft: 4,
    fontSize: isDesktop ? 22 : 18,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#1d324e",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightIcon: {
    marginRight: 0,
  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FFEBD3",
  },
  searchInputHeader: {
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  headerIconWrapper: {
    marginRight: 16,
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: 0,
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
  locationBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContent: {
    paddingBottom: 108,
  },
  topTagRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f6c795",
    marginRight: 8,
  },
  topTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#79411c",
  },
  sortTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#f6c795",
  },
  sortTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E0E0E0",
  },
  sortTabLast: {
    borderRightWidth: 0,
  },
  sortTabInner: {
    alignItems: "center",
    maxWidth: "100%",
  },
  sortTabLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sortTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1d324e",
    marginRight: 4,
  },
  sortTabHint: {
    fontSize: 9,
    fontWeight: "600",
    color: "#ef7b1a",
    marginTop: 2,
    textAlign: "center",
    maxWidth: 88,
  },
  activeChipsBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  activeChipsScroll: {
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 16,
    marginRight: 8,
    maxWidth: 220,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginRight: 4,
    flexShrink: 1,
  },
  filterChipClear: {
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  filterChipClearText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef7b1a",
  },
  promoStrip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  promoCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  promoLeft: {
    backgroundColor: "#1d324e",
    marginRight: 6,
  },
  promoRight: {
    backgroundColor: "#79411c",
    marginLeft: 6,
  },
  promoHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  promoSub: {
    fontSize: 12,
    marginTop: 2,
    color: "#f6c795",
  },
  promoIcon: {
    marginRight: 8,
    fontSize: 20,
  },
  promoTextContainer: {
    flex: 1,
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#1d324e",
  },
  sectionTitleAccent: {
    color: "#ef7b1a",
  },
  categorySectionBlock: {
    marginBottom: 16,
  },
  categorySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 2,
  },
  categorySectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#1d324e",
    paddingRight: 8,
  },
  categoryViewAllRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryViewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ef7b1a",
    marginRight: 2,
  },
  categoryProductCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  apiRoutedLoadingHint: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingSpinner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingLogo: {
    width: 80,
    height: 40,
    opacity: 0.8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  bannerCarouselWrapper: {
    paddingHorizontal: 12,
  },
  bannerCard: {
    borderRadius: 10,
    overflow: "hidden",
    height: 150,
    backgroundColor: "#F6F6F9",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 10,
    borderRadius: 5,
    backgroundColor: "#ef7b1a",
  },
  bestRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bestCard: {
    width: 140,
    marginRight: 12,
  },
  bestImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
  },
  bestImage: {
    width: "100%",
    height: "100%",
  },
  playBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  bestTitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1d324e",
  },
  bestSubtitle: {
    fontSize: 11,
    color: "#79411c",
    marginTop: 2,
  },
  latestRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  latestCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f6c795",
  },
  latestImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#F6F6F9",
  },
  latestTitle: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  latestPrice: {
    fontSize: 12,
    color: "#ef7b1a",
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 8,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 0,
  },
  productCard: {
    width: "49.7%",
    marginBottom: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  productImageWrapper: {
    position: "relative",
    width: "100%",
    height: productCardImageHeight,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  productWishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfoPanel: {
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
    minHeight: 148,
    marginTop: 4,
    borderRadius: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 2,
  },
  productSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  priceCurrent: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginRight: 6,
  },
  priceMrp: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  priceDiscount: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ratingCount: {
    fontSize: 10,
    color: "#6B7280",
  },
  similarIconButton: {
    marginLeft: "auto",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  productActionsRow: {
    marginTop: 10,
  },
  addToCartButton: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartIcon: {
    marginRight: 6,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  similarModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  similarModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "50%",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  similarModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  similarModalTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  similarProductsRow: {
    paddingBottom: 4,
  },
  similarProductCard: {
    width: 170,
    height: 242,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  similarProductImage: {
    width: "100%",
    height: 170,
    backgroundColor: "#F8FAFC",
  },
  similarInfoPanel: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    height: 72,
  },
  similarProductTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  similarProductSubtitle: {
    marginTop: 3,
    fontSize: 10,
    color: "#6B7280",
  },
  similarPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  similarProductPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d324e",
  },
  similarProductMrp: {
    marginLeft: 6,
    fontSize: 10,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  similarRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  similarRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 5,
  },
  similarRatingText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  similarRatingCount: {
    fontSize: 9,
    color: "#6B7280",
  },
  wishlistModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: "78%",
    paddingTop: 10,
  },
  wishlistScroll: {
    flex: 1,
  },
  wishlistScrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  wishlistEmpty: {
    paddingVertical: 56,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  wishlistEmptyTitle: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
  },
  wishlistEmptySub: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  wishlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  wishlistRowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  wishlistRowImage: {
    width: 76,
    height: 92,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  wishlistRowBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  wishlistRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 19,
  },
  wishlistRowPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "800",
    color: "#1d324e",
  },
  wishlistRowMrp: {
    marginTop: 2,
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  wishlistRemoveButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f6c795",
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef7b1a",
    marginRight: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1d324e",
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
    color: "#1d324e",
  },
  selectedSortText: {
    color: "#ef7b1a",
    fontWeight: "600",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#1d324e",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: "#ef7b1a",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef7b1a",
  },
  categorySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f6c795",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: "#fff",
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1d324e",
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
    borderColor: "#f6c795",
    marginRight: 14,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#ef7b1a",
    borderColor: "#ef7b1a",
  },
  checkText: {
    fontSize: 16,
    color: "#1d324e",
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
    borderColor: "#f6c795",
  },
  activeGenderImage: {
    borderWidth: 2,
    borderColor: "#ef7b1a",
  },
  genderText: {
    marginTop: 10,
    fontSize: 15,
    color: "#1d324e",
  },
  filterContent: {
    flex: 1,
    flexDirection: "row",
  },
  filterLeftPanel: {
    width: "30%",
    backgroundColor: "#FFF7F0",
  },
  leftFilterItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f6c795",
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
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
  },
  activeLeftFilterText: {
    color: "#ef7b1a",
    fontWeight: "600",
  },
  filterSectionCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef7b1a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  filterSectionCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  filterRightPanel: {
    width: "70%",
    backgroundColor: "#fff",
    paddingTop: 12,
  },
  rightTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d324e",
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f6c795",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  productCount: {
    fontSize: 16,
    color: "#1d324e",
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#ef7b1a",
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
});

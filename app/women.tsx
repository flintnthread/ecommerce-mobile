import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
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
  productsByMainCategoryPath,
  searchProductsPath,
  searchSuggestionsPath,
} from "../services/api";
import {
  MainCategoryApiRowPtb,
  normalizeMainCategoryName,
  pickPtbProductImageUri,
  pickPtbProductRating,
  pickPtbVariantPricing,
  safePtbText,
} from "../lib/mainCategoryPtbHelpers";
import { addProductToCart, getWishlistIds, loadCart } from "../lib/shopStorage";
import {
  categoryPtbRowWishlisted,
  fetchWishlistServerKeySet,
  togglePtbWishlistWithServer,
} from "../lib/wishlistServerApi";

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
  const resolved = Image.resolveAssetSource(source);
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
function WomenStoreSection({ children }: { children: React.ReactNode }) {
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

function WomenSectionHead({
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
  /** When set, opens `subcatProducts` with `GET /api/products/subcategory/:id` (via `api` base URL). */
  subcategoryId?: number;
};

type WomenCategoryBlock = {
  key: string;
  title: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  shopImage: ImageSourcePropType;
  railFrom: string;
  railTo: string;
  subs: SubLabel[];
};

type WomenSubcategoryApiRow = {
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

type WomenSubcategoriesTableSubRow = {
  id: number;
  name: string;
  image: string | null;
  mobileImage: string | null;
};

type WomenSubcategoriesTableRow = {
  categoryName: string;
  mobileImage: string | null;
  subcategories: WomenSubcategoriesTableSubRow[];
};

const WOMEN_IMG = require("../assets/MainCatImages/images/Women.png");
/** Top-of-screen women hero banner. */
const WOMEN_HERO_IMAGE = require("../assets/women/WomensWea.jpeg");
const WOMEN_ETHNIC_IMG = require("../assets/women/EthnicWea.jpeg");
const WOMEN_WESTERN_IMG = require("../assets/women/WesternWea.jpeg");
const WOMEN_LINGERIE_IMG = require("../assets/women/LingerieSleepwea.jpeg");
const WOMEN_WINTER_IMG = require("../assets/women/WinterWea.jpeg");
const WOMEN_ACTIVE_IMG = require("../assets/women/WomensClothin.jpeg");

/** Same hub layout as `men.tsx` — main categories + sub-styles per department. */
const WOMEN_CATEGORIES: WomenCategoryBlock[] = [
  {
    key: "ethnic",
    title: "Ethnic wear",
    tag: "Sarees & festive",
    icon: "sparkles-outline",
    shopImage: WOMEN_ETHNIC_IMG,
    railFrom: "#7c2d12",
    railTo: "#c2410c",
    subs: [
      { id: "w1", label: "Sarees", image: WOMEN_ETHNIC_IMG, subcategoryId: 164 },
      { id: "w2", label: "Kurtas & Kurtis", image: WOMEN_ETHNIC_IMG },
      { id: "w3", label: "Lehengas", image: WOMEN_ETHNIC_IMG },
      { id: "w13", label: "Gowns", image: WOMEN_ETHNIC_IMG },
    ],
  },
  {
    key: "western",
    title: "Western wear",
    tag: "Everyday & dressy",
    icon: "shirt-outline",
    shopImage: WOMEN_WESTERN_IMG,
    railFrom: "#0c4a6e",
    railTo: "#0369a1",
    subs: [
      { id: "w7", label: "Tops & Tees", image: WOMEN_WESTERN_IMG },
      { id: "w8", label: "Dresses", image: WOMEN_WESTERN_IMG },
      { id: "w9", label: "Jeans", image: WOMEN_WESTERN_IMG },
    ],
  },
  {
    key: "lingerie",
    title: "Lingerie & Sleepwear",
    tag: "Comfort first",
    icon: "moon-outline",
    shopImage: WOMEN_LINGERIE_IMG,
    railFrom: "#4c1d4a",
    railTo: "#7c3a76",
    subs: [
      { id: "w4", label: "Bras", image: WOMEN_LINGERIE_IMG },
      { id: "w5", label: "Briefs", image: WOMEN_LINGERIE_IMG },
      { id: "w6", label: "Nightwear", image: WOMEN_LINGERIE_IMG },
    ],
  },
  {
    key: "winter",
    title: "Winter wear",
    tag: "Cozy layers",
    icon: "snow-outline",
    shopImage: WOMEN_WINTER_IMG,
    railFrom: "#0f172a",
    railTo: "#334155",
    subs: [
      { id: "w10", label: "Sweaters", image: WOMEN_WINTER_IMG },
      { id: "w11", label: "Jackets", image: WOMEN_WINTER_IMG },
      { id: "w12", label: "Co-ords", image: WOMEN_WINTER_IMG },
    ],
  },
  {
    key: "active",
    title: "Women's Clothing",
    tag: "Move easy",
    icon: "fitness-outline",
    shopImage: WOMEN_ACTIVE_IMG,
    railFrom: "#047857",
    railTo: "#059669",
    subs: [
      { id: "wa1", label: "Gym Tops", image: WOMEN_ACTIVE_IMG },
      { id: "wa2", label: "Tights", image: WOMEN_ACTIVE_IMG },
      { id: "wa3", label: "Track Pants", image: WOMEN_ACTIVE_IMG },
      { id: "wa4", label: "Sports Jackets", image: WOMEN_ACTIVE_IMG },
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
    title: "Silk blend saree",
    price: "₹1,899",
    image: WOMEN_IMG,
    tag: "Trending",
  },
  {
    key: "tr2",
    title: "Midi dress",
    price: "₹1,199",
    image: WOMEN_IMG,
    tag: "Top rated",
  },
  {
    key: "tr3",
    title: "Cotton kurta set",
    price: "₹899",
    image: WOMEN_IMG,
    tag: "Fast moving",
  },
  {
    key: "tr4",
    title: "Sports bra",
    price: "₹599",
    image: require("../assets/images/sportscate.png"),
    tag: "New",
  },
  {
    key: "tr5",
    title: "Lounge night set",
    price: "₹1,099",
    image: WOMEN_IMG,
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
    title: "Pastel edit",
    sub: "Soft seasonal hues",
    image: WOMEN_IMG,
  },
  {
    key: "u2",
    title: "Handloom picks",
    sub: "Crafted drapes",
    image: WOMEN_IMG,
  },
  {
    key: "u3",
    title: "Capsule drop",
    sub: "Limited run",
    image: WOMEN_IMG,
  },
  {
    key: "u4",
    title: "Designer collab",
    sub: "Exclusive here",
    image: WOMEN_IMG,
  },
];

const FC_BANNERS: {
  key: string;
  line1: string;
  line2: string;
  cta: string;
  from: string;
  to: string;
}[] = [
  {
    key: "bn1",
    line1: "Closet refresh",
    line2: "Up to 40% off edits",
    cta: "Shop sale",
    from: "#0f172a",
    to: "#334155",
  },
  {
    key: "bn2",
    line1: "Denim & dresses",
    line2: "New fits & washes",
    cta: "Explore",
    from: "#be185d",
    to: "#db2777",
  },
  {
    key: "bn3",
    line1: "Festive edit",
    line2: "Ethnic & fusion",
    cta: "View",
    from: "#7c2d12",
    to: "#ea580c",
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
    title: "Office chic",
    count: "120+ styles",
    image: WOMEN_IMG,
  },
  {
    key: "col2",
    title: "Weekend ease",
    count: "90+ styles",
    image: WOMEN_IMG,
  },
  {
    key: "col3",
    title: "Street style",
    count: "75+ styles",
    image: WOMEN_IMG,
  },
  {
    key: "col4",
    title: "Celebration",
    count: "60+ styles",
    image: WOMEN_IMG,
  },
];

/** Horizontal padding inside banner carousel row. */
const FC_BANNER_SIDE_PAD = 16;
/** WomenStoreSection margin (12) + horizontal padding (12) per side — keeps paging math aligned. */
const WOMEN_SECTION_SCREEN_INSET = 48;
const FC_BANNER_AUTO_MS = 4200;

/** Shop all sub categories — list carousel step (card + gap), same model as men. */
const SHOP_ALL_LIST_CARD_W = 172;
const SHOP_ALL_LIST_GAP = 16;
const SHOP_ALL_LIST_STEP = SHOP_ALL_LIST_CARD_W + SHOP_ALL_LIST_GAP;
const SHOP_ALL_AUTO_MS = 1000;

/** Full-width strip below Style lab (women’s category art). */
const WOMEN_STYLE_LAB_STRIP_IMAGE = WOMEN_WESTERN_IMG;

const FC_LAB_RING = 100;
const FC_LAB_RING_BORDER = 4;
const FC_LAB_GLOW = FC_LAB_RING + 36;

const FC_STYLE_LAB: {
  key: string;
  step: string;
  title: string;
  sub: string;
  detail: string;
  tips: readonly string[];
  shopCategory: string;
  icon: keyof typeof Ionicons.glyphMap;
  grad: readonly [string, string];
}[] = [
  {
    key: "sl1",
    step: "01",
    title: "Colour edit",
    sub: "Palettes that pair clean",
    detail:
      "Jewel tones love gold accessories; pastels love silver. Let one hero colour lead and keep the rest supporting.",
    tips: [
      "Blush + ivory + cocoa reads soft luxe.",
      "Red + black needs texture variation so it isn’t flat.",
      "Match undertone (warm/cool) across makeup and outfit.",
    ],
    shopCategory: "Tops & Tees",
    icon: "color-palette-outline",
    grad: ["#6366f1", "#4338ca"],
  },
  {
    key: "sl2",
    step: "02",
    title: "Fit finder",
    sub: "Cuts for your frame",
    detail:
      "Waist placement and hem length change proportions instantly. High-rise elongates legs; ankle crops show footwear.",
    tips: [
      "Darted waists sharpen silhouettes on woven dresses.",
      "Shoulder fit on blouses sets the whole upper body tone.",
      "Try heel height before final hem alterations.",
    ],
    shopCategory: "Jeans",
    icon: "body-outline",
    grad: ["#0ea5e9", "#0369a1"],
  },
  {
    key: "sl3",
    step: "03",
    title: "Fabric guide",
    sub: "Touch & drape decoded",
    detail:
      "Chiffon floats, cotton crisps, silk catches light. Swap lining weight seasonally so outfits breathe.",
    tips: [
      "Bias-cut skirts need true fluid fabrics to fall well.",
      "Stretch blends keep kurtas comfy through long days.",
      "Store embellished pieces folded with tissue to avoid snags.",
    ],
    shopCategory: "Kurtas & Kurtis",
    icon: "shirt-outline",
    grad: ["#14b8a6", "#0f766e"],
  },
  {
    key: "sl4",
    step: "04",
    title: "Layering 101",
    sub: "Depth without bulk",
    detail:
      "Light base, structured mid, soft outer—or reverse with a crisp jacket over a knit. Scarves add colour without heat.",
    tips: [
      "Dupatta drape can replace a heavy third layer indoors.",
      "Crop jackets over maxi dresses balance length.",
      "Monochrome layers feel editorial when textures differ.",
    ],
    shopCategory: "Jackets",
    icon: "layers-outline",
    grad: ["#a855f7", "#7e22ce"],
  },
  {
    key: "sl5",
    step: "05",
    title: "Shoe map",
    sub: "Finish every silhouette",
    detail:
      "Heel pitch and toe shape change walk and vibe. Block heels stabilize long hems; strappy flats dress down pleats.",
    tips: [
      "Nude-to-you pumps lengthen the leg line.",
      "Chunky loafers pair with wide trousers and denim.",
      "Match bag hardware to primary jewelry tone.",
    ],
    shopCategory: "Dresses",
    icon: "walk-outline",
    grad: ["#f97316", "#c2410c"],
  },
];

const FC_SEASONS: {
  key: string;
  season: string;
  title: string;
  price: string;
  image: ImageSourcePropType;
  rank: string;
  suitIcon: keyof typeof Ionicons.glyphMap;
  suitColor: string;
  shopLabel: string;
}[] = [
  {
    key: "se1",
    season: "Spring",
    title: "Floral dresses",
    price: "From ₹799",
    image: WOMEN_IMG,
    rank: "A",
    suitIcon: "leaf-outline",
    suitColor: "#059669",
    shopLabel: "Dresses",
  },
  {
    key: "se2",
    season: "Summer",
    title: "Cotton kurtas",
    price: "From ₹599",
    image: WOMEN_IMG,
    rank: "K",
    suitIcon: "sunny-outline",
    suitColor: "#ca8a04",
    shopLabel: "Kurtas & Kurtis",
  },
  {
    key: "se3",
    season: "Monsoon",
    title: "Quick-dry active",
    price: "From ₹899",
    image: require("../assets/images/sportscate.png"),
    rank: "Q",
    suitIcon: "rainy-outline",
    suitColor: "#0284c7",
    shopLabel: "Gym Tops",
  },
  {
    key: "se4",
    season: "Festive",
    title: "Lehenga sets",
    price: "From ₹2,499",
    image: WOMEN_IMG,
    rank: "J",
    suitIcon: "sparkles-outline",
    suitColor: "#ea580c",
    shopLabel: "Lehengas",
  },
  {
    key: "se5",
    season: "Winter",
    title: "Wool knits",
    price: "From ₹1,499",
    image: WOMEN_IMG,
    rank: "10",
    suitIcon: "snow-outline",
    suitColor: "#475569",
    shopLabel: "Sweaters",
  },
];

const FC_REPURCHASE: {
  key: string;
  title: string;
  price: string;
  buyers: string;
  image: ImageSourcePropType;
}[] = [
  {
    key: "rp1",
    title: "High-rise jeans",
    price: "₹1,299",
    buyers: "2.4k+ bought again",
    image: WOMEN_IMG,
  },
  {
    key: "rp2",
    title: "T-shirt bra duo",
    price: "₹749",
    buyers: "1.8k+ repeat",
    image: WOMEN_IMG,
  },
  {
    key: "rp3",
    title: "Anarkali kurta",
    price: "₹1,599",
    buyers: "3.1k+ reorders",
    image: WOMEN_IMG,
  },
  {
    key: "rp4",
    title: "Everyday briefs",
    price: "₹449",
    buyers: "5k+ stocked up",
    image: WOMEN_IMG,
  },
];

const FC_LIKED: {
  key: string;
  title: string;
  likes: string;
  subline: string;
  shopLabel: string;
  image: ImageSourcePropType;
}[] = [
  {
    key: "lk1",
    title: "Wrap top",
    likes: "18.2k",
    subline: "Saved in 18.2k collections",
    shopLabel: "Tops & Tees",
    image: WOMEN_IMG,
  },
  {
    key: "lk2",
    title: "Palazzo set",
    likes: "14.6k",
    subline: "Wishlist hit · 14.6k adds",
    shopLabel: "Jeans",
    image: WOMEN_IMG,
  },
  {
    key: "lk3",
    title: "Blazer dress",
    likes: "11.3k",
    subline: "Repeat loves · 11.3k",
    shopLabel: "Dresses",
    image: WOMEN_IMG,
  },
  {
    key: "lk4",
    title: "Banarasi saree",
    likes: "22.1k",
    subline: "Top wishlisted · 22.1k",
    shopLabel: "Sarees",
    image: WOMEN_IMG,
  },
];

const LOVE_MASONRY_GAP = 10;
const LOVE_MASONRY_TALL = 216;
const LOVE_MASONRY_SHORT = 168;

const WOMEN_PTB_GRID_GAP = 12;

export default function WomenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const mainScrollRef = useRef<ScrollView>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  /** Scroll target: card top (scroll coords) + rail block offset inside card. */
  const shopSubsCardLayoutY = useRef(0);
  const railBlockLayoutY = useRef(0);
  const [selectedKey, setSelectedKey] = useState<string>(WOMEN_CATEGORIES[0].key);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [shopAllLayout, setShopAllLayout] = useState<"list" | "grid">("list");
  const shopAllScrollRef = useRef<ScrollView>(null);
  const shopAllScrollIndexRef = useRef(0);
  const shopAllScrollDirRef = useRef(1);
  const [styleLabOpenKey, setStyleLabOpenKey] = useState<string | null>(null);
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

  const WOMEN_PARENT_ID = 61;

  const params = useLocalSearchParams<{
    id?: string | string[];
    mainCategoryId?: string | string[];
  }>();
  const rawWomenMainCat = Array.isArray(params.id)
    ? params.id[0]
    : params.id ?? Array.isArray(params.mainCategoryId)
    ? params.mainCategoryId[0]
    : params.mainCategoryId;
  const parsedRouteWomenMainCat = Number.parseInt(String(rawWomenMainCat ?? ""), 10);
  const routeWomenMainCategoryId =
    Number.isFinite(parsedRouteWomenMainCat) && parsedRouteWomenMainCat > 0
      ? parsedRouteWomenMainCat
      : null;
  const [resolvedWomenMainCategoryId, setResolvedWomenMainCategoryId] = useState<number | null>(
    null
  );
  const [resolvingWomenMainCategoryId, setResolvingWomenMainCategoryId] = useState(false);
  const womenMainCategoryIdForPtb =
    routeWomenMainCategoryId ?? resolvedWomenMainCategoryId ?? WOMEN_PARENT_ID;

  type WomenPtbApiRow = {
    id: number;
    name: string;
    imageUri: string;
    sellingPrice: number | null;
    mrpPrice: number | null;
    discountPercentage: number | null;
    rating: number | null;
    variantId?: number;
  };
  const [womenPtbApi, setWomenPtbApi] = useState<WomenPtbApiRow[]>([]);
  const [womenPtbLoading, setWomenPtbLoading] = useState(false);
  const [womenWishlistIds, setWomenWishlistIds] = useState<Set<string>>(new Set());
  const [womenWishlistServerKeys, setWomenWishlistServerKeys] = useState<Set<string>>(
    new Set()
  );
  const [womenWishlistHasAuth, setWomenWishlistHasAuth] = useState(false);
  const [womenCartCount, setWomenCartCount] = useState(0);

  const womenPtbColW = useMemo(
    () => Math.floor((windowWidth - 32 - WOMEN_PTB_GRID_GAP) / 2),
    [windowWidth]
  );

  const reloadWomenWishlistIds = useCallback(async () => {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    setWomenWishlistHasAuth(!!token);
    const [ids, keys] = await Promise.all([
      getWishlistIds(),
      fetchWishlistServerKeySet(),
    ]);
    setWomenWishlistIds(ids);
    setWomenWishlistServerKeys(keys);
  }, []);

  const reloadWomenCartCount = useCallback(async () => {
    const cart = await loadCart();
    setWomenCartCount(cart.reduce((sum, line) => sum + (line.quantity || 0), 0));
  }, []);

  useEffect(() => {
    void reloadWomenWishlistIds();
    void reloadWomenCartCount();
  }, [reloadWomenWishlistIds, reloadWomenCartCount]);

  useFocusEffect(
    useCallback(() => {
      void reloadWomenWishlistIds();
      void reloadWomenCartCount();
    }, [reloadWomenWishlistIds, reloadWomenCartCount])
  );

  useEffect(() => {
    if (routeWomenMainCategoryId != null) {
      setResolvedWomenMainCategoryId(null);
      setResolvingWomenMainCategoryId(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setResolvingWomenMainCategoryId(true);
      try {
        const { data } = await api.get("/api/categories/main");
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as MainCategoryApiRowPtb[]) : [];
        const row = rows.find((r) => {
          if (!r || typeof r.id !== "number") return false;
          if (typeof r.status === "number" && r.status !== 1) return false;
          const n = normalizeMainCategoryName(String(r.categoryName ?? ""));
          return (
            n === "women" ||
            n === "womens" ||
            n === "womenswear" ||
            n === "womens wear" ||
            n === "women wear" ||
            n === "ladies" ||
            n.includes("women")
          );
        });
        setResolvedWomenMainCategoryId(
          row && Number.isFinite(row.id) && row.id > 0 ? row.id : null
        );
      } catch {
        if (!cancelled) setResolvedWomenMainCategoryId(null);
      } finally {
        if (!cancelled) setResolvingWomenMainCategoryId(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeWomenMainCategoryId]);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      setWomenPtbLoading(true);
      try {
        const { data } = await api.get(productsByMainCategoryPath(womenMainCategoryIdForPtb), {
          signal: c.signal,
        });
        if (!Array.isArray(data)) {
          setWomenPtbApi([]);
          return;
        }
        const mapped = (data as unknown[])
          .filter((p) => p && typeof (p as any).id === "number" && typeof (p as any).name === "string")
          .map((p) => {
            const imageUri = pickPtbProductImageUri(p);
            if (!imageUri) return null;
            const { sellingPrice, mrpPrice, discountPercentage, variantId } =
              pickPtbVariantPricing(p);
            return {
              id: (p as any).id as number,
              name: safePtbText(String((p as any).name ?? "")),
              imageUri,
              sellingPrice,
              mrpPrice,
              discountPercentage,
              rating: pickPtbProductRating(p),
              ...(variantId != null ? { variantId } : {}),
            } satisfies WomenPtbApiRow;
          })
          .filter(Boolean) as WomenPtbApiRow[];
        setWomenPtbApi(mapped);
      } catch {
        setWomenPtbApi([]);
      } finally {
        setWomenPtbLoading(false);
      }
    })();
    return () => c.abort();
  }, [womenMainCategoryIdForPtb]);

  const handleToggleWomenPtbWishlist = useCallback(
    async (product: {
      id: string;
      name: string;
      sellingNum: number;
      mrpNum: number;
      variantId?: number;
    }) => {
      const r = await togglePtbWishlistWithServer(product, reloadWomenWishlistIds);
      if (!r.ok) Alert.alert("Wishlist", r.message);
      else Alert.alert(r.title, r.body);
    },
    [reloadWomenWishlistIds]
  );

  const handleAddWomenPtbCart = useCallback(
    async (product: { id: string; name: string; sellingNum: number; mrpNum: number }) => {
      const cart = await addProductToCart({
        id: product.id,
        name: product.name,
        price: product.sellingNum,
        mrp: product.mrpNum,
      });
      setWomenCartCount(cart.reduce((sum, line) => sum + (line.quantity || 0), 0));
      Alert.alert("Added to cart", product.name);
    },
    []
  );

  const goWomenPtbShop = useCallback(() => {
    router.push("/subcatProducts");
  }, [router]);

  const womenPtbUiRows = useMemo(() => {
    const fmtRs = (n: number | null) =>
      n != null && Number.isFinite(n) ? `Rs ${Math.round(n)}` : "";
    if (womenPtbApi.length === 0) {
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
    return womenPtbApi.map((p) => {
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
  }, [womenPtbApi]);

  const [womenApiCats, setWomenApiCats] = useState<WomenSubcategoryApiRow[]>([]);
  const [womenApiLoading, setWomenApiLoading] = useState<boolean>(true);
  const [womenApiError, setWomenApiError] = useState<string | null>(null);

  const getUploadsImageUriFromFilename = useCallback((filename?: string | null): string => {
    const raw = String(filename ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!base) return raw;
    return `${base}/uploads/${raw.replace(/^\/+/, "")}`;
  }, []);

  const WOMEN_ETHNIC_WEAR_TABLE_ID = 63;
  const [ethnicWearTable, setEthnicWearTable] = useState<WomenSubcategoriesTableRow | null>(
    null
  );
  const [ethnicWearTableLoading, setEthnicWearTableLoading] = useState<boolean>(false);
  const [ethnicWearTableError, setEthnicWearTableError] = useState<string | null>(null);

  const WOMEN_LINGERIE_SLEEPWEAR_TABLE_ID = 64;
  const [lingerieWearTable, setLingerieWearTable] =
    useState<WomenSubcategoriesTableRow | null>(null);
  const [lingerieWearTableLoading, setLingerieWearTableLoading] = useState<boolean>(false);
  const [lingerieWearTableError, setLingerieWearTableError] = useState<string | null>(null);

  const WOMEN_WESTERN_WEAR_TABLE_ID = 62;
  const [westernWearTable, setWesternWearTable] =
    useState<WomenSubcategoriesTableRow | null>(null);
  const [westernWearTableLoading, setWesternWearTableLoading] = useState<boolean>(false);
  const [westernWearTableError, setWesternWearTableError] = useState<string | null>(null);

  const WOMEN_WINTER_WEAR_TABLE_ID = 65;
  const [winterWearTable, setWinterWearTable] =
    useState<WomenSubcategoriesTableRow | null>(null);
  const [winterWearTableLoading, setWinterWearTableLoading] = useState<boolean>(false);
  const [winterWearTableError, setWinterWearTableError] = useState<string | null>(null);

  const WOMEN_ACTIVE_WEAR_TABLE_ID = 87;
  const [activeWearTable, setActiveWearTable] =
    useState<WomenSubcategoriesTableRow | null>(null);
  const [activeWearTableLoading, setActiveWearTableLoading] = useState<boolean>(false);
  const [activeWearTableError, setActiveWearTableError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setWomenApiLoading(true);
        setWomenApiError(null);
        const { data: rows } = await api.get(`/api/categories/${WOMEN_PARENT_ID}/subcategories`, {
          timeout: 15000,
        });
        const list = Array.isArray(rows) ? (rows as WomenSubcategoryApiRow[]) : [];
        if (cancelled) return;
        setWomenApiCats(list);
      } catch (e: any) {
        if (cancelled) return;
        setWomenApiCats([]);
        setWomenApiError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load women categories"
        );
      } finally {
        if (cancelled) return;
        setWomenApiLoading(false);
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
          `/api/categories/${WOMEN_ETHNIC_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as WomenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setEthnicWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setEthnicWearTable(null);
        setEthnicWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Ethnic wear subcategories"
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
        setLingerieWearTableLoading(true);
        setLingerieWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${WOMEN_LINGERIE_SLEEPWEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as WomenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setLingerieWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setLingerieWearTable(null);
        setLingerieWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Lingerie & Sleepwear subcategories"
        );
      } finally {
        if (cancelled) return;
        setLingerieWearTableLoading(false);
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
        setWesternWearTableLoading(true);
        setWesternWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${WOMEN_WESTERN_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as WomenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setWesternWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setWesternWearTable(null);
        setWesternWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Western wear subcategories"
        );
      } finally {
        if (cancelled) return;
        setWesternWearTableLoading(false);
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
        setWinterWearTableLoading(true);
        setWinterWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${WOMEN_WINTER_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as WomenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setWinterWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setWinterWearTable(null);
        setWinterWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Winter wear subcategories"
        );
      } finally {
        if (cancelled) return;
        setWinterWearTableLoading(false);
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
        setActiveWearTableLoading(true);
        setActiveWearTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${WOMEN_ACTIVE_WEAR_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as WomenSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setActiveWearTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setActiveWearTable(null);
        setActiveWearTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Women's Clothing subcategories"
        );
      } finally {
        if (cancelled) return;
        setActiveWearTableLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalize = useCallback((s: string) => String(s ?? "").trim().toLowerCase(), []);
  const normKey = useCallback(
    (s: string) =>
      normalize(s)
        // Remove weird control chars/punctuation from API (e.g. "Womens").
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\bwomen\s+s\b/g, "womens")
        .replace(/\s+/g, " ")
        .trim(),
    [normalize]
  );

  const isWomensClothingTitle = useCallback(
    (title: string) => {
      const compact = normKey(title).replace(/\s+/g, " ").trim();
      if (compact === "womens clothing") return true;
      if (compact === "women clothing") return true;
      if (compact === "women s clothing") return true;
      return compact.includes("womens clothing") || compact.includes("women clothing");
    },
    [normKey]
  );

  const womenCategoriesForUi = useMemo(() => {
    const apiActive = womenApiCats.filter((r) =>
      typeof r.status === "number" ? r.status === 1 : true
    );
    if (!apiActive.length) return WOMEN_CATEGORIES;

    const byName = new Map(apiActive.map((r) => [normKey(r.categoryName), r]));

    return WOMEN_CATEGORIES.map((block) => {
      const row = byName.get(normKey(block.title));
      if (!row) return block;
      const title = String(row.categoryName ?? block.title).trim() || block.title;
      const shopImage = row.mobileImage
        ? ({ uri: row.mobileImage } as any)
        : row.image
          ? ({ uri: getUploadsImageUriFromFilename(row.image) } as any)
          : block.shopImage;
      return { ...block, title, shopImage };
    });
  }, [getUploadsImageUriFromFilename, normKey, womenApiCats]);

  const womenStripItems = useMemo(() => {
    const apiActive = womenApiCats.filter((r) =>
      typeof r.status === "number" ? r.status === 1 : true
    );
    if (!apiActive.length) {
      return womenCategoriesForUi.map((b) => ({
        key: b.key,
        title: b.title,
        image: b.shopImage,
        mappedKey: b.key,
      }));
    }

    // Render ALL API categoryName entries in the strip, even if they don't
    // exist as hardcoded blocks (so user sees everything from Postman).
    const keyByName = new Map(
      womenCategoriesForUi.map((b) => [normKey(b.title), b.key] as const)
    );

    return apiActive
      .map((row) => {
        const title = String(row.categoryName ?? "").trim() || "Category";
        return { row, title };
      })
      .map(({ row, title }) => {
        const normTitle = normKey(title);
        const image: ImageSourcePropType =
          row.mobileImage
            ? ({ uri: row.mobileImage } as any)
            : row.image
              ? ({ uri: getUploadsImageUriFromFilename(row.image) } as any)
              : WOMEN_IMG;
        return {
          key: `api-${row.id}`,
          title,
          image,
          mappedKey:
            keyByName.get(normTitle) ??
            (isWomensClothingTitle(title) ? "active" : null),
        };
      });
  }, [
    getUploadsImageUriFromFilename,
    isWomensClothingTitle,
    normKey,
    womenApiCats,
    womenCategoriesForUi,
  ]);

  useEffect(() => {
    if (womenCategoriesForUi.some((c) => c.key === selectedKey)) return;
    setSelectedKey(womenCategoriesForUi[0]?.key ?? WOMEN_CATEGORIES[0].key);
  }, [selectedKey, womenCategoriesForUi]);

  const styleLabOpen = useMemo(
    () => FC_STYLE_LAB.find((l) => l.key === styleLabOpenKey) ?? null,
    [styleLabOpenKey]
  );

  const closeStyleLab = useCallback(() => setStyleLabOpenKey(null), []);

  const bannerSlideWidth =
    windowWidth - WOMEN_SECTION_SCREEN_INSET - FC_BANNER_SIDE_PAD * 2;

  const collectionRows = useMemo(() => {
    const rows: (typeof FC_COLLECTIONS)[] = [];
    for (let i = 0; i < FC_COLLECTIONS.length; i += 2) {
      rows.push(FC_COLLECTIONS.slice(i, i + 2));
    }
    return rows;
  }, []);

  const activeBlock = useMemo(
    () =>
      womenCategoriesForUi.find((c) => c.key === selectedKey) ?? womenCategoriesForUi[0],
    [selectedKey, womenCategoriesForUi]
  );

  const ethnicBlock = useMemo(
    () =>
      womenCategoriesForUi.find((c) => c.key === "ethnic") ??
      WOMEN_CATEGORIES.find((c) => c.key === "ethnic") ??
      WOMEN_CATEGORIES[0],
    [womenCategoriesForUi]
  );

  const ethnicRailSubs = useMemo((): SubLabel[] => {
    if (ethnicWearTable?.subcategories?.length) {
      return ethnicWearTable.subcategories.map((s) => ({
        id: `api-ethnic-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return ethnicBlock.subs;
  }, [ethnicBlock.subs, ethnicWearTable, getUploadsImageUriFromFilename]);

  const lingerieBlock = useMemo(
    () =>
      womenCategoriesForUi.find((c) => c.key === "lingerie") ??
      WOMEN_CATEGORIES.find((c) => c.key === "lingerie") ??
      WOMEN_CATEGORIES[0],
    [womenCategoriesForUi]
  );

  const lingerieRailSubs = useMemo((): SubLabel[] => {
    if (lingerieWearTable?.subcategories?.length) {
      return lingerieWearTable.subcategories.map((s) => ({
        id: `api-lingerie-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return lingerieBlock.subs;
  }, [getUploadsImageUriFromFilename, lingerieBlock.subs, lingerieWearTable]);

  const westernBlock = useMemo(
    () =>
      womenCategoriesForUi.find((c) => c.key === "western") ??
      WOMEN_CATEGORIES.find((c) => c.key === "western") ??
      WOMEN_CATEGORIES[0],
    [womenCategoriesForUi]
  );

  const westernRailSubs = useMemo((): SubLabel[] => {
    if (westernWearTable?.subcategories?.length) {
      return westernWearTable.subcategories.map((s) => ({
        id: `api-western-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return westernBlock.subs;
  }, [getUploadsImageUriFromFilename, westernBlock.subs, westernWearTable]);

  const winterBlock = useMemo(
    () =>
      womenCategoriesForUi.find((c) => c.key === "winter") ??
      WOMEN_CATEGORIES.find((c) => c.key === "winter") ??
      WOMEN_CATEGORIES[0],
    [womenCategoriesForUi]
  );

  const winterRailSubs = useMemo((): SubLabel[] => {
    if (winterWearTable?.subcategories?.length) {
      return winterWearTable.subcategories.map((s) => ({
        id: `api-winter-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return winterBlock.subs;
  }, [getUploadsImageUriFromFilename, winterBlock.subs, winterWearTable]);

  const activeBlockForTable = useMemo(
    () =>
      womenCategoriesForUi.find((c) => c.key === "active") ??
      WOMEN_CATEGORIES.find((c) => c.key === "active") ??
      WOMEN_CATEGORIES[0],
    [womenCategoriesForUi]
  );

  const activeRailSubs = useMemo((): SubLabel[] => {
    if (activeWearTable?.subcategories?.length) {
      return activeWearTable.subcategories.map((s) => ({
        id: `api-active-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return activeBlockForTable.subs;
  }, [activeBlockForTable.subs, activeWearTable, getUploadsImageUriFromFilename]);

  const activeRailSubsForUi = useMemo((): SubLabel[] => {
    if (activeBlock.key === "ethnic") return ethnicRailSubs;
    if (activeBlock.key === "lingerie") return lingerieRailSubs;
    if (activeBlock.key === "western") return westernRailSubs;
    if (activeBlock.key === "winter") return winterRailSubs;
    if (activeBlock.key === "active") return activeRailSubs;
    return activeBlock.subs;
  }, [
    activeBlock.key,
    activeBlock.subs,
    activeRailSubs,
    ethnicRailSubs,
    lingerieRailSubs,
    westernRailSubs,
    winterRailSubs,
  ]);

  const allWomenSubItems = useMemo(
    () =>
      womenCategoriesForUi.flatMap((cat) =>
        (cat.key === "ethnic"
          ? ethnicRailSubs
          : cat.key === "lingerie"
            ? lingerieRailSubs
            : cat.key === "western"
              ? westernRailSubs
              : cat.key === "winter"
                ? winterRailSubs
                : cat.key === "active"
                  ? activeRailSubs
            : cat.subs
        ).map((s) => ({
          flatId: `${cat.key}-${s.id}`,
          label: s.label,
          image: (s.image ?? cat.shopImage) as ImageSourcePropType,
          deptKey: cat.key,
          deptTitle: cat.title,
          deptColor: cat.railTo,
          subcategoryId: s.subcategoryId,
        }))
      ),
    [
      activeRailSubs,
      ethnicRailSubs,
      lingerieRailSubs,
      westernRailSubs,
      winterRailSubs,
      womenCategoriesForUi,
    ]
  );

  const womenDeptRailAwaitingTable = useMemo(() => {
    if (activeBlock.key === "ethnic") return ethnicWearTableLoading && !ethnicWearTable;
    if (activeBlock.key === "lingerie")
      return lingerieWearTableLoading && !lingerieWearTable;
    if (activeBlock.key === "western") return westernWearTableLoading && !westernWearTable;
    if (activeBlock.key === "winter") return winterWearTableLoading && !winterWearTable;
    if (activeBlock.key === "active") return activeWearTableLoading && !activeWearTable;
    return false;
  }, [
    activeBlock.key,
    activeWearTable,
    activeWearTableLoading,
    ethnicWearTable,
    ethnicWearTableLoading,
    lingerieWearTable,
    lingerieWearTableLoading,
    westernWearTable,
    westernWearTableLoading,
    winterWearTable,
    winterWearTableLoading,
  ]);

  const womenDeptRailTableErrorText = useMemo(() => {
    if (activeBlock.key === "ethnic")
      return !ethnicWearTableLoading ? ethnicWearTableError : null;
    if (activeBlock.key === "lingerie")
      return !lingerieWearTableLoading ? lingerieWearTableError : null;
    if (activeBlock.key === "western")
      return !westernWearTableLoading ? westernWearTableError : null;
    if (activeBlock.key === "winter")
      return !winterWearTableLoading ? winterWearTableError : null;
    if (activeBlock.key === "active")
      return !activeWearTableLoading ? activeWearTableError : null;
    return null;
  }, [
    activeBlock.key,
    activeWearTableLoading,
    activeWearTableError,
    ethnicWearTableLoading,
    ethnicWearTableError,
    lingerieWearTableLoading,
    lingerieWearTableError,
    westernWearTableLoading,
    westernWearTableError,
    winterWearTableLoading,
    winterWearTableError,
  ]);

  const shopAllGridRows = useMemo(() => {
    const rows: (typeof allWomenSubItems)[] = [];
    for (let i = 0; i < allWomenSubItems.length; i += 2) {
      rows.push(allWomenSubItems.slice(i, i + 2));
    }
    return rows;
  }, [allWomenSubItems]);

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

  const openWomenSubcategoryProducts = useCallback(
    (subCategoryLabel: string, subcategoryId?: number | null) => {
      const trimmed = String(subCategoryLabel ?? "").trim();
      if (!trimmed) return;
      const idOk =
        typeof subcategoryId === "number" &&
        Number.isFinite(subcategoryId) &&
        subcategoryId > 0;
      router.push({
        pathname: "/subcatProducts",
        params: {
          mainCat: "womenswear",
          subCategory: trimmed,
          ...(idOk ? { subcategoryId: String(subcategoryId) } : {}),
        },
      });
    },
    [router]
  );

  const onPressStripItem = useCallback(
    (item: { mappedKey: string | null; title: string }) => {
      if (item.mappedKey) {
        onSelectShopCategory(item.mappedKey);
        return;
      }
      if (isWomensClothingTitle(item.title)) {
        onSelectShopCategory("active");
        return;
      }
      // If this API category doesn't exist as a rail block, still allow "shop" navigation.
      openWomenSubcategoryProducts(item.title);
    },
    [isWomensClothingTitle, onSelectShopCategory, openWomenSubcategoryProducts]
  );

  const onStyleLabShopPicks = useCallback(() => {
    const cat = styleLabOpen?.shopCategory;
    setStyleLabOpenKey(null);
    if (cat) openWomenSubcategoryProducts(cat);
  }, [styleLabOpen, openWomenSubcategoryProducts]);

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

  /** List mode: auto-scroll ping‑pong (same behaviour as men). */
  useEffect(() => {
    if (shopAllLayout !== "list") return;
    const n = allWomenSubItems.length;
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
  }, [shopAllLayout, allWomenSubItems.length]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#fffefb", "#faf7f3", "#f5f1eb"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.womenStickyHeader, { paddingTop: insets.top + 8 }]}
      >
        <LinearGradient
          colors={["transparent", hexToRgba("#ef7b1a", 0.07), "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.womenHeaderAccentWash}
          pointerEvents="none"
        />
        <View style={styles.womenHeaderRow}>
          <TouchableOpacity
            style={styles.womenLogoHit}
            onPress={() => router.replace("/home")}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <View style={styles.womenLogoTile}>
              <Image
                source={HEADER_FT_LOGO}
                style={styles.womenLogoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.womenSearchPill}>
            <TouchableOpacity
              style={styles.womenSearchMain}
              onPress={() => router.push("/searchresults")}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={19} color="#64748b" />
              <Text style={styles.womenSearchPlaceholder}>Search..</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/camerasearch")}
              style={styles.womenSearchCameraBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Search by photo"
            >
              <Ionicons name="camera-outline" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.womenHeaderIconGroup}>
            <TouchableOpacity
              style={styles.womenHeaderIconHit}
              onPress={() => router.push("/wishlist")}
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
            >
              <View style={styles.womenHeaderIconBadgeWrap}>
                <Ionicons name="heart-outline" size={24} color="#c2410c" />
                {(womenWishlistHasAuth
                  ? womenWishlistServerKeys.size
                  : womenWishlistIds.size) > 0 ? (
                  <View style={styles.womenHeaderIconBadge}>
                    <Text style={styles.womenHeaderIconBadgeText}>
                      {(womenWishlistHasAuth
                        ? womenWishlistServerKeys.size
                        : womenWishlistIds.size) > 99
                        ? "99+"
                        : String(
                            womenWishlistHasAuth
                              ? womenWishlistServerKeys.size
                              : womenWishlistIds.size
                          )}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.womenHeaderIconHit}
              onPress={() => router.push("/cart")}
              accessibilityRole="button"
              accessibilityLabel="Cart"
            >
              <View style={styles.womenHeaderIconBadgeWrap}>
                <Ionicons name="cart-outline" size={24} color="#c2410c" />
                {womenCartCount > 0 ? (
                  <View style={styles.womenHeaderIconBadge}>
                    <Text style={styles.womenHeaderIconBadgeText}>
                      {womenCartCount > 99 ? "99+" : String(womenCartCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.womenHeaderIconHit}
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
        ref={mainScrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.heroWrap}>
          <Image source={WOMEN_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(15,23,42,0.25)"]}
            style={styles.heroFade}
            pointerEvents="none"
          />
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
              {womenApiLoading ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                  <ActivityIndicator size="small" color="#ef7b1a" />
                </View>
              ) : null}
              {!womenApiLoading && womenApiError ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, maxWidth: 260 }}>
                  <Text
                    style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}
                    numberOfLines={2}
                  >
                    {womenApiError}
                  </Text>
                </View>
              ) : null}

              {womenStripItems.map((c) => {
                const selected = Boolean(c.mappedKey) && c.mappedKey === selectedKey;
                const clipId = `womenHex-${c.key}`;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={styles.quickItem}
                    activeOpacity={0.85}
                    onPress={() => onPressStripItem({ mappedKey: c.mappedKey, title: c.title })}
                    accessibilityRole="button"
                    accessibilityLabel={
                      c.mappedKey
                        ? `Show only ${c.title} subcategories`
                        : `Shop ${c.title}`
                    }
                    accessibilityState={{ selected }}
                  >
                    <View
                      style={[
                        styles.quickHexShadow,
                        selected && styles.quickHexShadowSelected,
                      ]}
                    >
                      <HexagonShopBadge
                        source={c.image}
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
                {womenDeptRailAwaitingTable ? (
                  <View
                    style={{ paddingVertical: 18, paddingHorizontal: 8, justifyContent: "center" }}
                  >
                    <ActivityIndicator size="small" color={activeBlock.railTo} />
                  </View>
                ) : null}
                {womenDeptRailTableErrorText ? (
                  <View style={{ paddingVertical: 10, paddingHorizontal: 8, maxWidth: 280 }}>
                    <Text
                      style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}
                      numberOfLines={3}
                    >
                      {womenDeptRailTableErrorText}
                    </Text>
                  </View>
                ) : null}
                {(womenDeptRailAwaitingTable ? [] : activeRailSubsForUi).map((s) => {
                  const tileImage = s.image ?? activeBlock.shopImage;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.railCard}
                      activeOpacity={0.88}
                      onPress={() => openWomenSubcategoryProducts(s.label, s.subcategoryId)}
                      accessibilityRole="button"
                      accessibilityLabel={`Shop ${s.label}`}
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
                          {s.label}
                        </Text>
                        <Text style={styles.railCardHint}>Tap to shop</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.fcWrap}>
          {/* 1 — Trending picks */}
          <WomenStoreSection>
            <WomenSectionHead
              accent={activeBlock.railTo}
              title="Trending picks"
              sub="What everyone is adding to bag"
              icon="flame"
              iconColor="#f97316"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {FC_TRENDING.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.fcTrendCard,
                    { borderColor: hexToRgba(activeBlock.railTo, 0.2) },
                  ]}
                  activeOpacity={0.9}
                >
                  <View style={styles.fcTrendImgWrap}>
                    <Image source={p.image} style={styles.fcTrendImg} resizeMode="cover" />
                    <LinearGradient
                      colors={["transparent", "rgba(15,23,42,0.65)"]}
                      style={styles.fcTrendFade}
                    />
                    <View style={[styles.fcTrendTag, { backgroundColor: activeBlock.railTo }]}>
                      <Text style={styles.fcTrendTagText}>{p.tag}</Text>
                    </View>
                  </View>
                  <View style={styles.fcTrendBody}>
                    <Text style={styles.fcTrendTitle} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <Text style={[styles.fcTrendPrice, { color: activeBlock.railTo }]}>{p.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </WomenStoreSection>

          {/* 2 — Women spotlight */}
          <WomenStoreSection>
            <WomenSectionHead
              accent="#f59e0b"
              title="Women spotlight"
              sub="Hero edit · refreshed weekly"
              icon="star"
              iconColor="#f59e0b"
            />
            <View style={[styles.fcSpotlight, { borderColor: hexToRgba(activeBlock.railTo, 0.35) }]}>
            <Image source={WOMEN_IMG} style={styles.fcSpotlightImg} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(15,23,42,0.15)", "rgba(15,23,42,0.88)"]}
              style={styles.fcSpotlightFade}
            />
            <View style={styles.fcSpotlightCopy}>
              <Text style={styles.fcSpotlightEyebrow}>In focus</Text>
              <Text style={styles.fcSpotlightHead}>The women&apos;s studio drop</Text>
              <Text style={styles.fcSpotlightSub}>Silhouettes for every moment — tap categories above to shop.</Text>
              <View style={[styles.fcSpotlightPill, { borderColor: activeBlock.railTo }]}>
                <Text style={[styles.fcSpotlightPillText, { color: activeBlock.railTo }]}>View edit</Text>
                <Ionicons name="arrow-forward" size={16} color={activeBlock.railTo} />
              </View>
            </View>
          </View>
          </WomenStoreSection>

          {/* 3 — Unique picks */}
          <WomenStoreSection>
            <WomenSectionHead
              accent="#8b5cf6"
              title="Unique picks"
              sub="Rare finds & small runs"
              icon="sparkles-outline"
              iconColor="#8b5cf6"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {FC_UNIQUE.map((u) => (
                <View
                  key={u.key}
                  style={[
                    styles.fcUniqueCard,
                    { borderColor: hexToRgba(activeBlock.railTo, 0.25) },
                  ]}
                >
                  <View style={styles.fcUniqueImgBox}>
                    <Image source={u.image} style={styles.fcUniqueImg} resizeMode="cover" />
                    <LinearGradient
                      colors={["transparent", "rgba(88,28,135,0.5)"]}
                      style={styles.fcUniqueFade}
                    />
                    <View style={styles.fcUniqueRibbon}>
                      <Text style={styles.fcUniqueRibbonText}>Only here</Text>
                    </View>
                  </View>
                  <View style={styles.fcUniqueBody}>
                    <Text style={styles.fcUniqueTitle}>{u.title}</Text>
                    <Text style={styles.fcUniqueSub}>{u.sub}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </WomenStoreSection>

          {/* 4 — Banners (auto-advancing carousel) */}
          <WomenStoreSection>
            <WomenSectionHead
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
                <View key={b.key} style={{ width: bannerSlideWidth }}>
                  <LinearGradient
                    colors={[b.from, b.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.fcBanner, { width: bannerSlideWidth }]}
                  >
                    <Text style={styles.fcBannerLine1}>{b.line1}</Text>
                    <Text style={styles.fcBannerLine2}>{b.line2}</Text>
                    <View style={styles.fcBannerCta}>
                      <Text style={styles.fcBannerCtaText}>{b.cta}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
            <View style={styles.fcBannerDots}>
              {FC_BANNERS.map((b, i) => (
                <View
                  key={b.key}
                  style={[
                    styles.fcBannerDot,
                    i === bannerIndex && [
                      styles.fcBannerDotActive,
                      { backgroundColor: activeBlock.railTo },
                    ],
                  ]}
                />
              ))}
            </View>
          </View>
          </WomenStoreSection>

          {/* 5 — Top collections (2 per row) */}
          <WomenStoreSection>
            <WomenSectionHead
              accent={activeBlock.railTo}
              title="Top collections"
              sub="Curated rails by occasion"
              icon="grid-outline"
            />
            <View style={styles.fcCollGrid}>
            {collectionRows.map((row, ri) => (
              <View key={`coll-row-${ri}`} style={styles.fcCollRow}>
                {row.map((c) => (
                  <View
                    key={c.key}
                    style={[
                      styles.fcCollCard,
                      { borderColor: hexToRgba(activeBlock.railTo, 0.22) },
                    ]}
                  >
                    <View style={styles.fcCollImgBox}>
                      <Image source={c.image} style={styles.fcCollImg} resizeMode="cover" />
                      <LinearGradient
                        colors={["transparent", "rgba(15,23,42,0.75)"]}
                        style={styles.fcCollFade}
                      />
                      <Text style={styles.fcCollTitle}>{c.title}</Text>
                      <Text style={styles.fcCollCount}>{c.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
          </WomenStoreSection>

          {/* 6 — Shop all women sub categories (grid / list + auto-scroll list, same as men) */}
          <WomenStoreSection>
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
                  const n = allWomenSubItems.length;
                  const idx = Math.round(x / Math.max(1, SHOP_ALL_LIST_STEP));
                  const clamped = Math.max(0, Math.min(idx, Math.max(0, n - 1)));
                  shopAllScrollIndexRef.current = clamped;
                  if (n > 1) {
                    if (clamped <= 0) shopAllScrollDirRef.current = 1;
                    else if (clamped >= n - 1) shopAllScrollDirRef.current = -1;
                  }
                }}
              >
                {allWomenSubItems.map((item) => (
                  <TouchableOpacity
                    key={item.flatId}
                    style={styles.fcShopAllCardList}
                    activeOpacity={0.92}
                    onPress={() =>
                      openWomenSubcategoryProducts(item.label, item.subcategoryId)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Shop ${item.label}`}
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
                                  {item.label}
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
                        onPress={() =>
                          openWomenSubcategoryProducts(item.label, item.subcategoryId)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Shop ${item.label}`}
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
                                {item.label}
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
          </WomenStoreSection>

          {/* 7 — Style lab (tappable circular guides + detail sheet) */}
          <WomenStoreSection>
            <WomenSectionHead
              accent="#06b6d4"
              title="Style lab"
              sub="Tap any ring — full guide opens instantly"
              icon="color-wand-outline"
              iconColor="#0891b2"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcLabRow}
              nestedScrollEnabled
            >
              {FC_STYLE_LAB.map((lab) => (
                <TouchableOpacity
                  key={lab.key}
                  style={styles.fcLabItem}
                  activeOpacity={0.92}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${lab.title} guide`}
                  onPress={() => setStyleLabOpenKey(lab.key)}
                >
                  <View style={styles.fcLabTileCard}>
                    <View style={styles.fcLabRingWrap}>
                      <View
                        style={[
                          styles.fcLabGlow,
                          {
                            width: FC_LAB_GLOW,
                            height: FC_LAB_GLOW,
                            borderRadius: FC_LAB_GLOW / 2,
                            backgroundColor: hexToRgba(lab.grad[0], 0.2),
                          },
                        ]}
                      />
                      <LinearGradient
                        colors={[lab.grad[0], lab.grad[1], lab.grad[0]]}
                        locations={[0, 0.52, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.fcLabRingOuter}
                      >
                        <View style={styles.fcLabRingCutout}>
                          <LinearGradient
                            colors={["#ffffff", "#eef2ff"]}
                            style={styles.fcLabIconDisk}
                          >
                            <Ionicons name={lab.icon} size={30} color={lab.grad[0]} />
                          </LinearGradient>
                        </View>
                      </LinearGradient>
                      <View
                        style={[
                          styles.fcLabStepBadge,
                          { borderColor: hexToRgba(lab.grad[0], 0.4) },
                        ]}
                      >
                        <Text style={[styles.fcLabStepBadgeText, { color: lab.grad[0] }]}>
                          {lab.step}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.fcLabCircleTitle} numberOfLines={2}>
                      {lab.title}
                    </Text>
                    <Text style={styles.fcLabCircleSub} numberOfLines={2}>
                      {lab.sub}
                    </Text>
                    <View style={styles.fcLabTapCue}>
                      <Text style={[styles.fcLabTapCueText, { color: lab.grad[0] }]}>
                        Open
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={lab.grad[0]} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.womenLabFollowBanner}
              activeOpacity={0.94}
              onPress={() => openWomenSubcategoryProducts("Tops & Tees")}
              accessibilityRole="button"
              accessibilityLabel="Shop women's style edit — tops and tees"
            >
              <Image
                source={WOMEN_STYLE_LAB_STRIP_IMAGE}
                style={styles.womenLabFollowBannerImg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(29,50,78,0.15)", "rgba(15,23,42,0.88)"]}
                start={{ x: 0, y: 0.45 }}
                end={{ x: 1, y: 0.55 }}
                style={styles.womenLabFollowBannerTint}
              />
              <View style={styles.womenLabFollowBannerAccent} pointerEvents="none" />
              <View style={styles.womenLabFollowBannerContent}>
                <View style={styles.womenLabFollowBannerPill}>
                  <Ionicons name="shirt-outline" size={13} color="#1d324e" />
                  <Text style={styles.womenLabFollowBannerPillText}>Women{"'"}s picks</Text>
                </View>
                <Text style={styles.womenLabFollowBannerTitle} numberOfLines={2}>
                  From Style lab to your wardrobe
                </Text>
                <Text style={styles.womenLabFollowBannerSub} numberOfLines={2}>
                  Full-width edit · Western & ethnic · Tap to explore tops
                </Text>
                <View style={styles.womenLabFollowBannerCtaRow}>
                  <Text style={styles.womenLabFollowBannerCta}>Shop the edit</Text>
                  <Ionicons name="arrow-forward-circle" size={22} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
          </WomenStoreSection>

          {/* 8 — Shop by season (playing-card deck) */}
          <WomenStoreSection>
            <WomenSectionHead
              accent="#10b981"
              title="Shop by season"
              sub="Playing-card deck — tap a card to shop"
              icon="diamond-outline"
              iconColor="#059669"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcSeasonPlayingRow}
              nestedScrollEnabled
            >
              {FC_SEASONS.map((s, index) => (
                <TouchableOpacity
                  key={s.key}
                  activeOpacity={0.93}
                  style={[
                    styles.seasonPlayingCard,
                    { transform: [{ rotate: `${index % 2 === 0 ? -2.5 : 2.5}deg` }] },
                  ]}
                  onPress={() => openWomenSubcategoryProducts(s.shopLabel)}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.season}. ${s.title}. ${s.price}. Shop`}
                >
                  <LinearGradient
                    colors={["#fdfbf7", "#ebe4d8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.seasonPlayingCardOuter}
                  >
                    <View style={[styles.seasonPlayingCardRim, { borderColor: s.suitColor }]}>
                      <View style={styles.seasonPlayingCardFace}>
                        <View style={styles.seasonPlayingCornerTL}>
                          <Text style={[styles.seasonPlayingRank, { color: s.suitColor }]}>
                            {s.rank}
                          </Text>
                          <Ionicons name={s.suitIcon} size={15} color={s.suitColor} />
                        </View>
                        <View style={styles.seasonPlayingCornerBR}>
                          <View style={styles.seasonPlayingCornerRotated}>
                            <Text style={[styles.seasonPlayingRank, { color: s.suitColor }]}>
                              {s.rank}
                            </Text>
                            <Ionicons name={s.suitIcon} size={15} color={s.suitColor} />
                          </View>
                        </View>
                        <View style={styles.seasonPlayingArtWrap}>
                          <View
                            style={[
                              styles.seasonPlayingArtRing,
                              { borderColor: hexToRgba(s.suitColor, 0.45) },
                            ]}
                          >
                            <Image
                              source={s.image}
                              style={styles.seasonPlayingArtImg}
                              resizeMode="cover"
                            />
                          </View>
                          <View
                            style={[
                              styles.seasonPlayingSeasonPill,
                              { backgroundColor: s.suitColor },
                            ]}
                          >
                            <Text style={styles.seasonPlayingSeasonPillText}>{s.season}</Text>
                          </View>
                        </View>
                        <View style={styles.seasonPlayingFooter}>
                          <Text style={styles.seasonPlayingTitle} numberOfLines={2}>
                            {s.title}
                          </Text>
                          <Text style={[styles.seasonPlayingPrice, { color: s.suitColor }]}>
                            {s.price}
                          </Text>
                        </View>
                        <View style={styles.seasonAceWordmark} pointerEvents="none">
                          <Text style={styles.seasonAceWordmarkText}>FNT</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </WomenStoreSection>

          {/* 9 — More purchase products */}
          <WomenStoreSection>
            <WomenSectionHead
              accent="#ea580c"
              title="Bought again & again"
              sub="Trusted repeat buys from real shoppers"
              icon="bag-handle-outline"
              iconColor="#c2410c"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {FC_REPURCHASE.map((r) => (
                <View
                  key={r.key}
                  style={[
                    styles.fcBuyCard,
                    { borderColor: hexToRgba(activeBlock.railTo, 0.18) },
                  ]}
                >
                  <View style={styles.fcBuyImgWrap}>
                    <Image source={r.image} style={styles.fcBuyImg} resizeMode="cover" />
                  </View>
                  <Text style={styles.fcBuyTitle} numberOfLines={2}>
                    {r.title}
                  </Text>
                  <Text style={[styles.fcBuyPrice, { color: activeBlock.railTo }]}>{r.price}</Text>
                  <View style={styles.fcBuyRow}>
                    <Ionicons name="repeat-outline" size={14} color="#64748b" />
                    <Text style={styles.fcBuyMeta}>{r.buyers}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </WomenStoreSection>

          {/* 10 — Most loved (dark staggered masonry) */}
          <WomenStoreSection>
            <WomenSectionHead
              accent="#ec4899"
              title="Most loved"
              sub="Staggered spotlight grid — tap to shop"
              icon="heart"
              iconColor="#db2777"
            />
            <View style={styles.loveMasonryDarkShell}>
              <View style={[styles.loveMasonryRow, { gap: LOVE_MASONRY_GAP }]}>
                <View style={styles.loveMasonryCol}>
                  {FC_LIKED.filter((_, i) => i % 2 === 0).map((l, j, arr) => (
                    <TouchableOpacity
                      key={l.key}
                      activeOpacity={0.94}
                      style={[
                        styles.loveMasonryCard,
                        {
                          height: j % 2 === 0 ? LOVE_MASONRY_TALL : LOVE_MASONRY_SHORT,
                          marginBottom: j < arr.length - 1 ? LOVE_MASONRY_GAP : 0,
                        },
                      ]}
                      onPress={() => openWomenSubcategoryProducts(l.shopLabel)}
                      accessibilityRole="button"
                      accessibilityLabel={`${l.title}. ${l.subline}`}
                    >
                      <Image source={l.image} style={styles.loveMasonryImg} resizeMode="cover" />
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
                  {FC_LIKED.filter((_, i) => i % 2 === 1).map((l, j, arr) => (
                    <TouchableOpacity
                      key={l.key}
                      activeOpacity={0.94}
                      style={[
                        styles.loveMasonryCard,
                        {
                          height: j % 2 === 0 ? LOVE_MASONRY_SHORT : LOVE_MASONRY_TALL,
                          marginBottom: j < arr.length - 1 ? LOVE_MASONRY_GAP : 0,
                        },
                      ]}
                      onPress={() => openWomenSubcategoryProducts(l.shopLabel)}
                      accessibilityRole="button"
                      accessibilityLabel={`${l.title}. ${l.subline}`}
                    >
                      <Image source={l.image} style={styles.loveMasonryImg} resizeMode="cover" />
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
          </WomenStoreSection>

          <View style={styles.womenPtbSectionWrap}>
            <View style={styles.womenPtbHeaderRow}>
              <Text style={styles.womenPtbHeading}>Products to buy</Text>
              <TouchableOpacity onPress={goWomenPtbShop} activeOpacity={0.85}>
                <Text style={styles.womenPtbSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {routeWomenMainCategoryId == null && resolvingWomenMainCategoryId ? (
              <Text style={styles.womenPtbStatus}>Matching store category…</Text>
            ) : null}
            {womenPtbLoading && womenPtbApi.length === 0 ? (
              <Text style={styles.womenPtbStatus}>Loading products...</Text>
            ) : womenPtbUiRows.length === 0 ? (
              <Text style={styles.womenPtbStatus}>No products found.</Text>
            ) : (
              <View style={styles.womenPtbGrid}>
                {womenPtbUiRows.map((product) => (
                  <View key={product.id} style={[styles.womenPtbCard, { width: womenPtbColW }]}>
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
                      <View style={styles.womenPtbCardInner}>
                        <Image
                          source={product.imageSource}
                          style={styles.womenPtbImage}
                          resizeMode="cover"
                        />
                        <View style={styles.womenPtbMeta}>
                          <Text style={styles.womenPtbName} numberOfLines={2}>
                            {product.name}
                          </Text>
                          <View style={styles.womenPtbRatingRow}>
                            <View style={styles.womenPtbRatingPill}>
                              <Ionicons name="star" size={12} color="#ef7b1a" />
                              <Text style={styles.womenPtbRatingText}>{product.ratingLabel}</Text>
                            </View>
                          </View>
                          <View style={styles.womenPtbPriceRow}>
                            {product.sellingLabel ? (
                              <Text style={styles.womenPtbPrice}>{product.sellingLabel}</Text>
                            ) : null}
                            {product.showMrp && product.mrpLabel ? (
                              <Text style={styles.womenPtbMrp}>{product.mrpLabel}</Text>
                            ) : null}
                            {product.discountLabel ? (
                              <View style={styles.womenPtbDiscountPill}>
                                <Text style={styles.womenPtbDiscountText}>
                                  {product.discountLabel}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={styles.womenPtbBottomRow}>
                            <View style={styles.womenPtbActionsRow}>
                              <TouchableOpacity
                                style={styles.womenPtbWishBtn}
                                activeOpacity={0.85}
                                onPress={() =>
                                  void handleToggleWomenPtbWishlist({
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
                                    womenWishlistHasAuth,
                                    womenWishlistServerKeys,
                                    womenWishlistIds
                                  )
                                    ? "Remove from"
                                    : "Add to"
                                } wishlist: ${product.name}`}
                              >
                                <Ionicons
                                  name={
                                    categoryPtbRowWishlisted(
                                      product,
                                      womenWishlistHasAuth,
                                      womenWishlistServerKeys,
                                      womenWishlistIds
                                    )
                                      ? "heart"
                                      : "heart-outline"
                                  }
                                  size={16}
                                  color={
                                    categoryPtbRowWishlisted(
                                      product,
                                      womenWishlistHasAuth,
                                      womenWishlistServerKeys,
                                      womenWishlistIds
                                    )
                                      ? "#E11D48"
                                      : "#1d324e"
                                  }
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.womenPtbCartBtn}
                                activeOpacity={0.85}
                                onPress={() =>
                                  void handleAddWomenPtbCart({
                                    id: product.id,
                                    name: product.name,
                                    sellingNum: product.sellingNum,
                                    mrpNum: product.mrpNum,
                                  })
                                }
                                accessibilityRole="button"
                                accessibilityLabel={`Add to cart: ${product.name}`}
                              >
                                <Ionicons name="cart-outline" size={14} color="#FFFFFF" />
                                <Text style={styles.womenPtbCartBtnText}>Add to Cart</Text>
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

      <Modal
        visible={!!styleLabOpen}
        animationType="slide"
        transparent
        onRequestClose={closeStyleLab}
      >
        <View style={styles.styleLabModalRoot}>
          <Pressable style={styles.styleLabModalBackdrop} onPress={closeStyleLab} />
          <View
            style={[
              styles.styleLabModalSheet,
              { paddingBottom: Math.max(insets.bottom, 14) + 16 },
            ]}
          >
            {styleLabOpen ? (
              <>
                <View style={styles.styleLabModalHandle} />
                <LinearGradient
                  colors={[styleLabOpen.grad[0], styleLabOpen.grad[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.styleLabModalHero}
                >
                  <View style={styles.styleLabModalHeroTop}>
                    <View style={styles.styleLabModalHeroIconWrap}>
                      <Ionicons name={styleLabOpen.icon} size={34} color="#ffffff" />
                    </View>
                    <TouchableOpacity
                      style={styles.styleLabModalClose}
                      onPress={closeStyleLab}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel="Close guide"
                    >
                      <Ionicons name="close" size={22} color="rgba(255,255,255,0.95)" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.styleLabModalKicker}>Style lab · Step {styleLabOpen.step}</Text>
                  <Text style={styles.styleLabModalTitle}>{styleLabOpen.title}</Text>
                  <Text style={styles.styleLabModalSub}>{styleLabOpen.sub}</Text>
                </LinearGradient>
                <ScrollView
                  style={styles.styleLabModalBodyScroll}
                  contentContainerStyle={styles.styleLabModalBodyContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text style={styles.styleLabModalDetail}>{styleLabOpen.detail}</Text>
                  <Text style={styles.styleLabModalTipsTitle}>Quick wins</Text>
                  {styleLabOpen.tips.map((tip, idx) => (
                    <View key={`${styleLabOpen.key}-tip-${idx}`} style={styles.styleLabTipRow}>
                      <View
                        style={[
                          styles.styleLabTipDot,
                          { backgroundColor: hexToRgba(styleLabOpen.grad[0], 0.2) },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={styleLabOpen.grad[0]}
                        />
                      </View>
                      <Text style={styles.styleLabTipText}>{tip}</Text>
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.styleLabModalActions}>
                  <TouchableOpacity
                    style={styles.styleLabBtnGhost}
                    onPress={closeStyleLab}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.styleLabBtnGhostText}>Not now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={onStyleLabShopPicks}
                    accessibilityRole="button"
                    accessibilityLabel="Shop related picks"
                  >
                    <LinearGradient
                      colors={[styleLabOpen.grad[0], styleLabOpen.grad[1]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.styleLabBtnPrimary}
                    >
                      <Ionicons name="bag-handle-outline" size={20} color="#ffffff" />
                      <Text style={styles.styleLabBtnPrimaryText}>Shop picks</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e8ecf2",
  },
  womenStickyHeader: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.05)",
  },
  womenHeaderAccentWash: {
    ...StyleSheet.absoluteFillObject,
  },
  womenHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  womenLogoHit: {
    borderRadius: 18,
  },
  womenLogoTile: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  womenLogoImage: {
    width: 40,
    height: 40,
  },
  womenSearchPill: {
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
  womenSearchMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    minWidth: 0,
  },
  womenSearchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#94a3b8",
  },
  womenSearchCameraBtn: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(239, 123, 26, 0.1)",
  },
  womenHeaderIconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  womenHeaderIconHit: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.06)",
  },
  womenHeaderIconBadgeWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  womenHeaderIconBadge: {
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
  womenHeaderIconBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ffffff",
  },
  womenPtbSectionWrap: {
    marginTop: 18,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  womenPtbHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  womenPtbHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  womenPtbSeeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ea580c",
  },
  womenPtbStatus: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  womenPtbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: WOMEN_PTB_GRID_GAP,
  },
  womenPtbCard: {
    borderRadius: 12,
    backgroundColor: "#ef7b1a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 1,
    marginBottom: 12,
    overflow: "visible",
  },
  womenPtbCardInner: {
    flex: 1,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFDF9",
    margin: 1,
  },
  womenPtbImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
    backgroundColor: "#FFFFFF",
  },
  womenPtbMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  womenPtbName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D2430",
    minHeight: 30,
  },
  womenPtbRatingRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  womenPtbRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  womenPtbRatingText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A4E17",
  },
  womenPtbPriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 6,
  },
  womenPtbPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1d324e",
  },
  womenPtbMrp: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  womenPtbDiscountPill: {
    backgroundColor: "rgba(239,123,26,0.14)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  womenPtbDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#b45309",
  },
  womenPtbBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  womenPtbActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 4,
  },
  womenPtbWishBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.25)",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  womenPtbCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#1d324e",
  },
  womenPtbCartBtnText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
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
  heroFade: {
    ...StyleSheet.absoluteFillObject,
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
    gap: 12,
    paddingBottom: 2,
    paddingTop: 2,
  },
  fcTrendCard: {
    width: 158,
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
  fcTrendImgWrap: {
    height: 172,
    width: "100%",
    backgroundColor: "#e2e8f0",
    position: "relative",
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
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fcTrendTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.4,
  },
  fcTrendBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fcTrendTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d324e",
    lineHeight: 17,
  },
  fcTrendPrice: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
  },
  fcSpotlight: {
    marginHorizontal: 0,
    height: 212,
    borderRadius: 18,
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
  fcSpotlightCopy: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
  },
  fcSpotlightEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#fde68a",
    textTransform: "uppercase",
  },
  fcSpotlightHead: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 6,
    lineHeight: 26,
  },
  fcSpotlightSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.88)",
    marginTop: 8,
    lineHeight: 19,
  },
  fcSpotlightPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 2,
  },
  fcSpotlightPillText: {
    fontSize: 13,
    fontWeight: "800",
  },
  fcUniqueCard: {
    width: 176,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    overflow: "hidden",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  fcUniqueImgBox: {
    height: 148,
    width: "100%",
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  fcUniqueImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fcUniqueFade: {
    ...StyleSheet.absoluteFillObject,
  },
  fcUniqueRibbon: {
    position: "absolute",
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.95)",
  },
  fcUniqueRibbonText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  fcUniqueBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fcUniqueTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d324e",
  },
  fcUniqueSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
  },
  fcBannerCarousel: {
    marginBottom: 4,
  },
  fcBanner: {
    minHeight: 136,
    borderRadius: 20,
    padding: 22,
    justifyContent: "flex-end",
    marginRight: 0,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  fcBannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  fcBannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
  },
  fcBannerDotActive: {
    width: 22,
    borderRadius: 4,
  },
  fcBannerLine1: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  fcBannerLine2: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
  },
  fcBannerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  fcBannerCtaText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
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
  womenLabFollowBanner: {
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
  womenLabFollowBannerImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  womenLabFollowBannerTint: {
    ...StyleSheet.absoluteFillObject,
  },
  womenLabFollowBannerAccent: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#ef7b1a",
  },
  womenLabFollowBannerContent: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14,
  },
  womenLabFollowBannerPill: {
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
  womenLabFollowBannerPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  womenLabFollowBannerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  womenLabFollowBannerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    lineHeight: 17,
    maxWidth: "92%",
  },
  womenLabFollowBannerCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  womenLabFollowBannerCta: {
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

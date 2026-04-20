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
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  searchProductsPath,
  searchSuggestionsPath,
} from "../services/api";

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
      <Polygon points={pts} fill="#e8eaed"/>
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

const KIDS_HERO_IMAGE = require("../assets/kids/KidsWea.jpeg");
const KIDS_IMAGE = require("../assets/MainCatImages/images/Kids.png");
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
function KidsStoreSection({ children }: { children: React.ReactNode }) {
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

function KidsSectionHead({
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
  /** When set, opens `subcatProducts` with `GET /api/products/subcategory/:id` (uses `api` base URL). */
  subcategoryId?: number;
};

type KidsCategoryBlock = {
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

type KidsSubcategoryApiRow = {
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

type KidsSubcategoriesTableSubRow = {
  id: number;
  name: string;
  image?: string | null;
  mobileImage?: string | null;
};

type KidsSubcategoriesTableRow = {
  categoryName: string;
  mobileImage?: string | null;
  subcategories: KidsSubcategoriesTableSubRow[];
};

const KIDS_BOYS_IMG = require("../assets/kids/BoysClothin.jpeg");
const KIDS_GIRLS_IMG = require("../assets/kids/GirlsClothin.jpeg");
const KIDS_INFANT_IMG = require("../assets/kids/SchoolEssential.jpeg");

/** Model B: light storefront + horizontal rails (aligned with Men hub layout). */
const KIDS_CATEGORIES: KidsCategoryBlock[] = [
  {
    key: "boys",
    title: "Boys clothing",
    tag: "Play & school",
    icon: "shirt-outline",
    shopImage: KIDS_BOYS_IMG,
    railFrom: "#0c4a6e",
    railTo: "#0369a1",
    subs: [
      { id: "kb1", label: "T-Shirts", image: KIDS_BOYS_IMG },
      { id: "kb2", label: "Jeans", image: KIDS_BOYS_IMG },
      { id: "kb3", label: "Shirts", image: KIDS_BOYS_IMG },
      { id: "kb4", label: "Shorts", image: KIDS_BOYS_IMG },
    ],
  },
  {
    key: "girls",
    title: "Girls clothing",
    tag: "Dresses & more",
    icon: "heart-outline",
    shopImage: KIDS_GIRLS_IMG,
    railFrom: "#be185d",
    railTo: "#db2777",
    subs: [
      { id: "kg1", label: "Frocks", image: KIDS_GIRLS_IMG },
      { id: "kg2", label: "Tops", image: KIDS_GIRLS_IMG },
      { id: "kg3", label: "Skirts", image: KIDS_GIRLS_IMG },
      { id: "kg4", label: "Leggings", image: KIDS_GIRLS_IMG },
    ],
  },
  {
    key: "infants",
    title: "School Essential",
    tag: "Soft & snug",
    icon: "ribbon-outline",
    shopImage: KIDS_INFANT_IMG,
    railFrom: "#047857",
    railTo: "#059669",
    subs: [
      { id: "ki1", label: "Onesies", image: KIDS_INFANT_IMG },
      { id: "ki2", label: "Rompers", image: KIDS_INFANT_IMG },
      { id: "ki3", label: "Infant Sets", image: KIDS_INFANT_IMG },
      { id: "ki4", label: "Swaddles", image: KIDS_INFANT_IMG },
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
    title: "Graphic tee pack",
    price: "₹599",
    image: require("../assets/images/kidscate.png"),
    tag: "Trending",
  },
  {
    key: "tr2",
    title: "Party frock",
    price: "₹899",
    image: require("../assets/MainCatImages/images/Kids.png"),
    tag: "Top rated",
  },
  {
    key: "tr3",
    title: "Denim shorts set",
    price: "₹749",
    image: require("../assets/images/kidscate.png"),
    tag: "Fast moving",
  },
  {
    key: "tr4",
    title: "Soft romper",
    price: "₹499",
    image: require("../assets/MainCatImages/images/Kids.png"),
    tag: "New",
  },
  {
    key: "tr5",
    title: "Plush buddy",
    price: "₹399",
    image: require("../assets/images/kidscate.png"),
    tag: "Toys",
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
    title: "Organic cotton",
    sub: "Gentle on skin",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "u2",
    title: "Festive mini fits",
    sub: "Limited prints",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "u3",
    title: "Nursery bundle",
    sub: "Curated sets",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "u4",
    title: "STEM play kit",
    sub: "Learn through play",
    image: require("../assets/MainCatImages/images/Kids.png"),
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
    line1: "Back to school",
    line2: "Uniforms & basics",
    cta: "Shop sale",
    from: "#0f172a",
    to: "#334155",
  },
  {
    key: "bn2",
    line1: "Tiny trends",
    line2: "New season fits",
    cta: "Explore",
    from: "#be185d",
    to: "#db2777",
  },
  {
    key: "bn3",
    line1: "Toy fair",
    line2: "Games & plush",
    cta: "View",
    from: "#5b21b6",
    to: "#7c3aed",
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
    title: "School edit",
    count: "120+ styles",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "col2",
    title: "Playdate",
    count: "90+ styles",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "col3",
    title: "Newborn",
    count: "75+ styles",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "col4",
    title: "Party wear",
    count: "60+ styles",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
];

/** Horizontal padding inside banner carousel row. */
const FC_BANNER_SIDE_PAD = 16;
/** KidsStoreSection margin (12) + horizontal padding (12) per side — keeps paging math aligned. */
const KIDS_SECTION_SCREEN_INSET = 48;
const FC_BANNER_AUTO_MS = 4200;

/** Shop all sub categories — list carousel (same model as men / women). */
const SHOP_ALL_LIST_CARD_W = 172;
const SHOP_ALL_LIST_GAP = 16;
const SHOP_ALL_LIST_STEP = SHOP_ALL_LIST_CARD_W + SHOP_ALL_LIST_GAP;
const SHOP_ALL_AUTO_MS = 1000;

/** Full-width strip below Style lab (kids category art). */
const KIDS_STYLE_LAB_STRIP_IMAGE = KIDS_BOYS_IMG;

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
      "Busy prints hide small stains; solids mix for school photos. Let one fun colour pop on socks or tee trim.",
    tips: [
      "Neutrals + one bright makes outfits easy to repeat.",
      "Avoid too many competing characters/logos in one look.",
      "Dark knee panels help trousers survive playground slides.",
    ],
    shopCategory: "T-Shirts",
    icon: "color-palette-outline",
    grad: ["#6366f1", "#4338ca"],
  },
  {
    key: "sl2",
    step: "02",
    title: "Fit finder",
    sub: "Cuts for your frame",
    detail:
      "Thumb-cuff sleeves and adjustable waists buy months of wear. Check shoulder seams—too wide catches on bags.",
    tips: [
      "Room to grow: hem should skim the ankle, not drag.",
      "Elastic + drawstring beats tight jeans for all-day sit.",
      "Sized-to-age tags vary—measure chest/waist when in doubt.",
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
      "Breathable cotton for class; fleece for winter bus stops. Tag inside lists wash temp—hot fades prints fast.",
    tips: [
      "Jersey feels softer immediately; poplin stays crisp longer.",
      "Flat seams reduce itch on sensory-sensitive kids.",
      "Pre-wash bright reds once alone to prevent dye bleed.",
    ],
    shopCategory: "Shirts",
    icon: "shirt-outline",
    grad: ["#14b8a6", "#0f766e"],
  },
  {
    key: "sl4",
    step: "04",
    title: "Layering 101",
    sub: "Depth without bulk",
    detail:
      "Thin thermal under tee beats one giant coat indoors. Zip layers so kids can self-regulate at recess.",
    tips: [
      "Packable windbreaker lives in backpack for surprise drizzle.",
      "Hood under helmet needs thin fabric—no puffy hoods.",
      "Name labels on outerwear save lost-and-found time.",
    ],
    shopCategory: "Tops",
    icon: "layers-outline",
    grad: ["#a855f7", "#7e22ce"],
  },
  {
    key: "sl5",
    step: "05",
    title: "Shoe map",
    sub: "Finish every silhouette",
    detail:
      "Velcro speeds mornings; flex soles help running games. Half size up if toes touch—but not so loose they trip.",
    tips: [
      "Indoor shoes with light colour soles mark less on gym floors.",
      "Athletic socks cushion better than no-show on little heels.",
      "Rotate two pairs so shoes dry out between wear days.",
    ],
    shopCategory: "Shorts",
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
    title: "Light rompers",
    price: "From ₹499",
    image: require("../assets/images/kidscate.png"),
    rank: "A",
    suitIcon: "leaf-outline",
    suitColor: "#059669",
    shopLabel: "Rompers",
  },
  {
    key: "se2",
    season: "Summer",
    title: "Cotton tees",
    price: "From ₹399",
    image: require("../assets/MainCatImages/images/Kids.png"),
    rank: "K",
    suitIcon: "sunny-outline",
    suitColor: "#ca8a04",
    shopLabel: "T-Shirts",
  },
  {
    key: "se3",
    season: "Monsoon",
    title: "Rain jackets",
    price: "From ₹799",
    image: require("../assets/images/kidscate.png"),
    rank: "Q",
    suitIcon: "rainy-outline",
    suitColor: "#0284c7",
    shopLabel: "Shirts",
  },
  {
    key: "se4",
    season: "Festive",
    title: "Lehenga sets",
    price: "From ₹1,299",
    image: require("../assets/MainCatImages/images/Kids.png"),
    rank: "J",
    suitIcon: "sparkles-outline",
    suitColor: "#ea580c",
    shopLabel: "Frocks",
  },
  {
    key: "se5",
    season: "Winter",
    title: "Cozy knits",
    price: "From ₹999",
    image: require("../assets/images/kidscate.png"),
    rank: "10",
    suitIcon: "snow-outline",
    suitColor: "#475569",
    shopLabel: "Tops",
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
    title: "School socks 6-pack",
    price: "₹399",
    buyers: "2.4k+ bought again",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "rp2",
    title: "Cotton vest set",
    price: "₹449",
    buyers: "1.8k+ repeat",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "rp3",
    title: "Leggings combo",
    price: "₹599",
    buyers: "3.1k+ reorders",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "rp4",
    title: "Building blocks",
    price: "₹699",
    buyers: "5k+ stocked up",
    image: require("../assets/MainCatImages/images/Kids.png"),
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
    title: "Cartoon tee",
    likes: "18.2k",
    subline: "Parent saves · 18.2k",
    shopLabel: "T-Shirts",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "lk2",
    title: "Denim dungaree",
    likes: "14.6k",
    subline: "Cart favours · 14.6k",
    shopLabel: "Jeans",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "lk3",
    title: "Tutu skirt",
    likes: "11.3k",
    subline: "Wishlisted · 11.3k",
    shopLabel: "Skirts",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "lk4",
    title: "Snuggle blanket",
    likes: "22.1k",
    subline: "Repeat buys · 22.1k",
    shopLabel: "Swaddles",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
];

const LOVE_MASONRY_GAP = 10;
const LOVE_MASONRY_TALL = 216;
const LOVE_MASONRY_SHORT = 168;

export default function KidsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const mainScrollRef = useRef<ScrollView>(null);
  const bannerScrollRef = useRef<ScrollView>(null);
  /** Scroll target: card top (scroll coords) + rail block offset inside card. */
  const shopSubsCardLayoutY = useRef(0);
  const railBlockLayoutY = useRef(0);
  const [selectedKey, setSelectedKey] = useState<string>(KIDS_CATEGORIES[0].key);
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

  const KIDS_PARENT_ID = 30;
  const [kidsApiCats, setKidsApiCats] = useState<KidsSubcategoryApiRow[]>([]);
  const [kidsApiLoading, setKidsApiLoading] = useState<boolean>(true);
  const [kidsApiError, setKidsApiError] = useState<string | null>(null);

  const getUploadsImageUriFromFilename = useCallback((filename?: string | null): string => {
    const raw = String(filename ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
    if (!base) return raw;
    return `${base}/uploads/${raw.replace(/^\/+/, "")}`;
  }, []);

  const KIDS_GIRLS_CLOTHING_TABLE_ID = 48;
  const [girlsClothingTable, setGirlsClothingTable] = useState<KidsSubcategoriesTableRow | null>(
    null
  );
  const [girlsClothingTableLoading, setGirlsClothingTableLoading] = useState<boolean>(false);
  const [girlsClothingTableError, setGirlsClothingTableError] = useState<string | null>(null);

  const KIDS_BOYS_CLOTHING_TABLE_ID = 49;
  const [boysClothingTable, setBoysClothingTable] = useState<KidsSubcategoriesTableRow | null>(
    null
  );
  const [boysClothingTableLoading, setBoysClothingTableLoading] = useState<boolean>(false);
  const [boysClothingTableError, setBoysClothingTableError] = useState<string | null>(null);

  const KIDS_SCHOOL_ESSENTIALS_TABLE_ID = 50;
  const [schoolEssentialsTable, setSchoolEssentialsTable] =
    useState<KidsSubcategoriesTableRow | null>(null);
  const [schoolEssentialsTableLoading, setSchoolEssentialsTableLoading] =
    useState<boolean>(false);
  const [schoolEssentialsTableError, setSchoolEssentialsTableError] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setKidsApiLoading(true);
        setKidsApiError(null);
        const { data: rows } = await api.get(`/api/categories/${KIDS_PARENT_ID}/subcategories`, {
          timeout: 15000,
        });
        const list = Array.isArray(rows) ? (rows as KidsSubcategoryApiRow[]) : [];
        if (cancelled) return;
        setKidsApiCats(list);
      } catch (e: any) {
        if (cancelled) return;
        setKidsApiCats([]);
        setKidsApiError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load kids categories"
        );
      } finally {
        if (cancelled) return;
        setKidsApiLoading(false);
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
        setGirlsClothingTableLoading(true);
        setGirlsClothingTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${KIDS_GIRLS_CLOTHING_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as KidsSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setGirlsClothingTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setGirlsClothingTable(null);
        setGirlsClothingTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Girls clothing subcategories"
        );
      } finally {
        if (cancelled) return;
        setGirlsClothingTableLoading(false);
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
        setSchoolEssentialsTableLoading(true);
        setSchoolEssentialsTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${KIDS_SCHOOL_ESSENTIALS_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as KidsSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setSchoolEssentialsTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setSchoolEssentialsTable(null);
        setSchoolEssentialsTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load School Essentials subcategories"
        );
      } finally {
        if (cancelled) return;
        setSchoolEssentialsTableLoading(false);
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
        setBoysClothingTableLoading(true);
        setBoysClothingTableError(null);
        const { data: rows } = await api.get(
          `/api/categories/${KIDS_BOYS_CLOTHING_TABLE_ID}/subcategories-table`,
          { timeout: 15000 }
        );
        const list = Array.isArray(rows) ? (rows as KidsSubcategoriesTableRow[]) : [];
        const first = list[0] ?? null;
        if (cancelled) return;
        setBoysClothingTable(first);
      } catch (e: any) {
        if (cancelled) return;
        setBoysClothingTable(null);
        setBoysClothingTableError(
          typeof e?.message === "string" && e.message.trim()
            ? e.message
            : "Failed to load Boys clothing subcategories"
        );
      } finally {
        if (cancelled) return;
        setBoysClothingTableLoading(false);
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
        // Remove control chars/punctuation from API payloads.
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    [normalize]
  );

  const guessKidsMappedKey = useCallback(
    (title: string): string | null => {
      const t = normKey(title);
      if (!t) return null;
      // Common backend variants / typos should still map to our 3 rail blocks.
      if (t.includes("boy")) return "boys";
      if (t.includes("girl")) return "girls";
      if (t.includes("school")) return "infants";
      if (t.includes("essential")) return "infants";
      if (t.includes("infant") || t.includes("baby") || t.includes("newborn")) return "infants";
      return null;
    },
    [normKey]
  );

  const kidsCategoriesForUi = useMemo(() => {
    const apiActive = kidsApiCats.filter((r) =>
      typeof r.status === "number" ? r.status === 1 : true
    );
    if (!apiActive.length) return KIDS_CATEGORIES;

    const byName = new Map(apiActive.map((r) => [normKey(r.categoryName), r]));
    return KIDS_CATEGORIES.map((block) => {
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
  }, [KIDS_CATEGORIES, getUploadsImageUriFromFilename, kidsApiCats, normKey]);

  const kidsStripItems = useMemo(() => {
    const apiActive = kidsApiCats.filter((r) =>
      typeof r.status === "number" ? r.status === 1 : true
    );
    if (!apiActive.length) {
      return kidsCategoriesForUi.map((b) => ({
        key: b.key,
        title: b.title,
        image: b.shopImage,
        mappedKey: b.key,
      }));
    }

    const keyByName = new Map(
      kidsCategoriesForUi.map((b) => [normKey(b.title), b.key] as const)
    );

    return apiActive.map((row) => {
      const title = String(row.categoryName ?? "").trim() || "Category";
      const image: ImageSourcePropType =
        row.mobileImage
          ? ({ uri: row.mobileImage } as any)
          : row.image
            ? ({ uri: getUploadsImageUriFromFilename(row.image) } as any)
            : KIDS_IMAGE;
      return {
        key: `api-${row.id}`,
        title,
        image,
        mappedKey: keyByName.get(normKey(title)) ?? guessKidsMappedKey(title),
      };
    });
  }, [
    KIDS_IMAGE,
    getUploadsImageUriFromFilename,
    kidsApiCats,
    kidsCategoriesForUi,
    guessKidsMappedKey,
    normKey,
  ]);

  useEffect(() => {
    if (kidsCategoriesForUi.some((c) => c.key === selectedKey)) return;
    setSelectedKey(kidsCategoriesForUi[0]?.key ?? KIDS_CATEGORIES[0].key);
  }, [kidsCategoriesForUi, selectedKey]);

  const styleLabOpen = useMemo(
    () => FC_STYLE_LAB.find((l) => l.key === styleLabOpenKey) ?? null,
    [styleLabOpenKey]
  );

  const closeStyleLab = useCallback(() => setStyleLabOpenKey(null), []);

  const bannerSlideWidth =
    windowWidth - KIDS_SECTION_SCREEN_INSET - FC_BANNER_SIDE_PAD * 2;

  const collectionRows = useMemo(() => {
    const rows: (typeof FC_COLLECTIONS)[] = [];
    for (let i = 0; i < FC_COLLECTIONS.length; i += 2) {
      rows.push(FC_COLLECTIONS.slice(i, i + 2));
    }
    return rows;
  }, []);

  const activeBlock = useMemo(
    () => kidsCategoriesForUi.find((c) => c.key === selectedKey) ?? kidsCategoriesForUi[0],
    [kidsCategoriesForUi, selectedKey]
  );

  const girlsBlock = useMemo(
    () =>
      kidsCategoriesForUi.find((c) => c.key === "girls") ??
      KIDS_CATEGORIES.find((c) => c.key === "girls") ??
      KIDS_CATEGORIES[0],
    [kidsCategoriesForUi]
  );

  const girlsRailSubs = useMemo((): SubLabel[] => {
    if (girlsClothingTable?.subcategories?.length) {
      return girlsClothingTable.subcategories.map((s) => ({
        id: `api-girls-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return girlsBlock.subs;
  }, [getUploadsImageUriFromFilename, girlsBlock.subs, girlsClothingTable]);

  const boysBlock = useMemo(
    () =>
      kidsCategoriesForUi.find((c) => c.key === "boys") ??
      KIDS_CATEGORIES.find((c) => c.key === "boys") ??
      KIDS_CATEGORIES[0],
    [kidsCategoriesForUi]
  );

  const boysRailSubs = useMemo((): SubLabel[] => {
    if (boysClothingTable?.subcategories?.length) {
      return boysClothingTable.subcategories.map((s) => ({
        id: `api-boys-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return boysBlock.subs;
  }, [boysBlock.subs, boysClothingTable, getUploadsImageUriFromFilename]);

  const schoolBlock = useMemo(
    () =>
      kidsCategoriesForUi.find((c) => c.key === "infants") ??
      KIDS_CATEGORIES.find((c) => c.key === "infants") ??
      KIDS_CATEGORIES[0],
    [kidsCategoriesForUi]
  );

  const schoolRailSubs = useMemo((): SubLabel[] => {
    if (schoolEssentialsTable?.subcategories?.length) {
      return schoolEssentialsTable.subcategories.map((s) => ({
        id: `api-school-${s.id}`,
        label: s.name,
        image: (s.mobileImage
          ? ({ uri: s.mobileImage } as any)
          : s.image
            ? ({ uri: getUploadsImageUriFromFilename(s.image) } as any)
            : undefined) as ImageSourcePropType | undefined,
        subcategoryId: typeof s.id === "number" && s.id > 0 ? s.id : undefined,
      }));
    }
    return schoolBlock.subs;
  }, [getUploadsImageUriFromFilename, schoolBlock.subs, schoolEssentialsTable]);

  const kidsDeptRailAwaitingTable = useMemo(() => {
    if (activeBlock.key === "boys") return boysClothingTableLoading && !boysClothingTable;
    if (activeBlock.key === "girls")
      return girlsClothingTableLoading && !girlsClothingTable;
    if (activeBlock.key === "infants")
      return schoolEssentialsTableLoading && !schoolEssentialsTable;
    return false;
  }, [
    activeBlock.key,
    boysClothingTable,
    boysClothingTableLoading,
    girlsClothingTable,
    girlsClothingTableLoading,
    schoolEssentialsTable,
    schoolEssentialsTableLoading,
  ]);

  const kidsDeptRailTableErrorText = useMemo(() => {
    if (activeBlock.key === "boys")
      return !boysClothingTableLoading ? boysClothingTableError : null;
    if (activeBlock.key === "girls")
      return !girlsClothingTableLoading ? girlsClothingTableError : null;
    if (activeBlock.key === "infants")
      return !schoolEssentialsTableLoading ? schoolEssentialsTableError : null;
    return null;
  }, [
    activeBlock.key,
    boysClothingTableError,
    boysClothingTableLoading,
    girlsClothingTableError,
    girlsClothingTableLoading,
    schoolEssentialsTableError,
    schoolEssentialsTableLoading,
  ]);

  const activeRailSubsForUi = useMemo((): SubLabel[] => {
    if (activeBlock.key === "boys") return boysRailSubs;
    if (activeBlock.key === "girls") return girlsRailSubs;
    if (activeBlock.key === "infants") return schoolRailSubs;
    return activeBlock.subs;
  }, [activeBlock.key, activeBlock.subs, boysRailSubs, girlsRailSubs, schoolRailSubs]);

  const allKidsSubItems = useMemo(
    () =>
      kidsCategoriesForUi.flatMap((cat) => {
        const subs =
          cat.key === "boys"
            ? boysRailSubs
            : cat.key === "girls"
              ? girlsRailSubs
              : cat.key === "infants"
                ? schoolRailSubs
              : cat.subs;
        return subs.map((s) => ({
          flatId: `${cat.key}-${s.id}`,
          label: s.label,
          image: (s.image ?? cat.shopImage) as ImageSourcePropType,
          deptKey: cat.key,
          deptTitle: cat.title,
          deptColor: cat.railTo,
          subcategoryId: s.subcategoryId,
        }));
      }),
    [boysRailSubs, girlsRailSubs, kidsCategoriesForUi, schoolRailSubs]
  );

  const shopAllGridRows = useMemo(() => {
    const rows: (typeof allKidsSubItems)[] = [];
    for (let i = 0; i < allKidsSubItems.length; i += 2) {
      rows.push(allKidsSubItems.slice(i, i + 2));
    }
    return rows;
  }, [allKidsSubItems]);

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

  const openKidsSubcategoryProducts = useCallback(
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
          mainCat: "kidswear",
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
      const guessed = guessKidsMappedKey(item.title);
      if (guessed) {
        onSelectShopCategory(guessed);
        return;
      }
      openKidsSubcategoryProducts(item.title);
    },
    [guessKidsMappedKey, onSelectShopCategory, openKidsSubcategoryProducts]
  );

  const onStyleLabShopPicks = useCallback(() => {
    const cat = styleLabOpen?.shopCategory;
    setStyleLabOpenKey(null);
    if (cat) openKidsSubcategoryProducts(cat);
  }, [styleLabOpen, openKidsSubcategoryProducts]);

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

  useEffect(() => {
    if (shopAllLayout !== "list") return;
    const n = allKidsSubItems.length;
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
  }, [shopAllLayout, allKidsSubItems.length]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#fffefb", "#faf7f3", "#f5f1eb"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.kidsStickyHeader, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.kidsHeaderRow}>
          <TouchableOpacity
            style={styles.kidsLogoHit}
            onPress={() => router.replace("/home")}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <View style={styles.kidsLogoTile}>
              <Image
                source={HEADER_FT_LOGO}
                style={styles.kidsLogoImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.kidsSearchPill}>
            <TouchableOpacity
              style={styles.kidsSearchMain}
              onPress={() => router.push("/searchresults")}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={19} color="#64748b" />
              <Text style={styles.kidsSearchPlaceholder}>Search..</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/camerasearch")}
              style={styles.kidsSearchCameraBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Search by photo"
            >
              <Ionicons name="camera-outline" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.kidsHeaderIconGroup}>
            <TouchableOpacity
              style={styles.kidsHeaderIconHit}
              onPress={() => router.push("/wishlist")}
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
            >
              <Ionicons name="heart-outline" size={24} color="#c2410c" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.kidsHeaderIconHit}
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
          <Image source={KIDS_HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickStrip}
              nestedScrollEnabled
            >
              {kidsApiLoading ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
                  <ActivityIndicator size="small" color="#ef7b1a" />
                </View>
              ) : null}
              {!kidsApiLoading && kidsApiError ? (
                <View style={{ paddingHorizontal: 10, paddingVertical: 6, maxWidth: 260 }}>
                  <Text
                    style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}
                    numberOfLines={2}
                  >
                    {kidsApiError}
                  </Text>
                </View>
              ) : null}

              {kidsStripItems.map((c) => {
                const selected = Boolean(c.mappedKey) && c.mappedKey === selectedKey;
                const clipId = `kidsHex-${c.key}`;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={styles.quickItem}
                    activeOpacity={0.85}
                    onPress={() => onPressStripItem({ mappedKey: c.mappedKey, title: c.title })}
                    accessibilityRole="button"
                    accessibilityLabel={
                      c.mappedKey ? `Show only ${c.title} subcategories` : `Shop ${c.title}`
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
                {kidsDeptRailAwaitingTable ? (
                  <View
                    style={{ paddingVertical: 18, paddingHorizontal: 8, justifyContent: "center" }}
                  >
                    <ActivityIndicator size="small" color={activeBlock.railTo} />
                  </View>
                ) : null}
                {kidsDeptRailTableErrorText ? (
                  <View style={{ paddingVertical: 10, paddingHorizontal: 8, maxWidth: 280 }}>
                    <Text
                      style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}
                      numberOfLines={3}
                    >
                      {kidsDeptRailTableErrorText}
                    </Text>
                  </View>
                ) : null}
                {(kidsDeptRailAwaitingTable ? [] : activeRailSubsForUi).map((s) => {
                  const tileImage = s.image ?? activeBlock.shopImage;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.railCard}
                      activeOpacity={0.88}
                      onPress={() => openKidsSubcategoryProducts(s.label, s.subcategoryId)}
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
          <KidsStoreSection>
            <KidsSectionHead
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
          </KidsStoreSection>

          {/* 2 — Kids spotlight */}
          <KidsStoreSection>
            <KidsSectionHead
              accent="#f59e0b"
              title="Kids spotlight"
              sub="Hero edit · refreshed weekly"
              icon="star"
              iconColor="#f59e0b"
            />
            <View style={[styles.fcSpotlight, { borderColor: hexToRgba(activeBlock.railTo, 0.35) }]}>
            <Image source={KIDS_IMAGE} style={styles.fcSpotlightImg} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(15,23,42,0.15)", "rgba(15,23,42,0.88)"]}
              style={styles.fcSpotlightFade}
            />
            <View style={styles.fcSpotlightCopy}>
              <Text style={styles.fcSpotlightEyebrow}>In focus</Text>
              <Text style={styles.fcSpotlightHead}>The kids&apos; studio drop</Text>
              <Text style={styles.fcSpotlightSub}>Bright fits & playful ease — tap categories above to shop.</Text>
              <View style={[styles.fcSpotlightPill, { borderColor: activeBlock.railTo }]}>
                <Text style={[styles.fcSpotlightPillText, { color: activeBlock.railTo }]}>View edit</Text>
                <Ionicons name="arrow-forward" size={16} color={activeBlock.railTo} />
              </View>
            </View>
          </View>
          </KidsStoreSection>

          {/* 3 — Unique picks */}
          <KidsStoreSection>
            <KidsSectionHead
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
          </KidsStoreSection>

          {/* 4 — Banners (auto-advancing carousel) */}
          <KidsStoreSection>
            <KidsSectionHead
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
          </KidsStoreSection>

          {/* 5 — Top collections (2 per row) */}
          <KidsStoreSection>
            <KidsSectionHead
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
          </KidsStoreSection>

          {/* 6 — Shop all kids sub categories (grid / list + auto-scroll list, same as men / women) */}
          <KidsStoreSection>
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
                  const n = allKidsSubItems.length;
                  const idx = Math.round(x / Math.max(1, SHOP_ALL_LIST_STEP));
                  const clamped = Math.max(0, Math.min(idx, Math.max(0, n - 1)));
                  shopAllScrollIndexRef.current = clamped;
                  if (n > 1) {
                    if (clamped <= 0) shopAllScrollDirRef.current = 1;
                    else if (clamped >= n - 1) shopAllScrollDirRef.current = -1;
                  }
                }}
              >
                {allKidsSubItems.map((item) => (
                  <TouchableOpacity
                    key={item.flatId}
                    style={styles.fcShopAllCardList}
                    activeOpacity={0.92}
                    onPress={() =>
                      openKidsSubcategoryProducts(item.label, item.subcategoryId)
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
                          openKidsSubcategoryProducts(item.label, item.subcategoryId)
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
          </KidsStoreSection>

          {/* 7 — Style lab (tappable circular guides + detail sheet) */}
          <KidsStoreSection>
            <KidsSectionHead
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
              style={styles.kidsLabFollowBanner}
              activeOpacity={0.94}
              onPress={() => openKidsSubcategoryProducts("T-Shirts")}
              accessibilityRole="button"
              accessibilityLabel="Shop kids picks — T-shirts"
            >
              <Image
                source={KIDS_STYLE_LAB_STRIP_IMAGE}
                style={styles.kidsLabFollowBannerImg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(29,50,78,0.15)", "rgba(15,23,42,0.88)"]}
                start={{ x: 0, y: 0.45 }}
                end={{ x: 1, y: 0.55 }}
                style={styles.kidsLabFollowBannerTint}
              />
              <View style={styles.kidsLabFollowBannerAccent} pointerEvents="none" />
              <View style={styles.kidsLabFollowBannerContent}>
                <View style={styles.kidsLabFollowBannerPill}>
                  <Ionicons name="shirt-outline" size={13} color="#1d324e" />
                  <Text style={styles.kidsLabFollowBannerPillText}>Kids picks</Text>
                </View>
                <Text style={styles.kidsLabFollowBannerTitle} numberOfLines={2}>
                  From Style lab to the closet
                </Text>
                <Text style={styles.kidsLabFollowBannerSub} numberOfLines={2}>
                  Full-width edit · School & play · Tap for tees
                </Text>
                <View style={styles.kidsLabFollowBannerCtaRow}>
                  <Text style={styles.kidsLabFollowBannerCta}>Shop the edit</Text>
                  <Ionicons name="arrow-forward-circle" size={22} color="#ffffff" />
                </View>
              </View>
            </TouchableOpacity>
          </KidsStoreSection>

          {/* 8 — Shop by season (playing-card deck) */}
          <KidsStoreSection>
            <KidsSectionHead
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
                  onPress={() => openKidsSubcategoryProducts(s.shopLabel)}
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
          </KidsStoreSection>

          {/* 9 — More purchase products */}
          <KidsStoreSection>
            <KidsSectionHead
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
          </KidsStoreSection>

          {/* 10 — Most loved (dark staggered masonry) */}
          <KidsStoreSection>
            <KidsSectionHead
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
                      onPress={() => openKidsSubcategoryProducts(l.shopLabel)}
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
                      onPress={() => openKidsSubcategoryProducts(l.shopLabel)}
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
          </KidsStoreSection>
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
  kidsStickyHeader: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.05)",
  },
  kidsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  kidsLogoHit: {
    borderRadius: 18,
  },
  kidsLogoTile: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  kidsLogoImage: {
    width: 40,
    height: 40,
  },
  kidsSearchPill: {
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
  kidsSearchMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    minWidth: 0,
  },
  kidsSearchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#94a3b8",
  },
  kidsSearchCameraBtn: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(239, 123, 26, 0.1)",
  },
  kidsHeaderIconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  kidsHeaderIconHit: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29, 50, 78, 0.06)",
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
    height: Math.round(RAIL_CARD_H * 0.7),
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
    paddingVertical: 10,
    justifyContent: "center",
    minHeight: Math.round(RAIL_CARD_H * 0.3),
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
  kidsLabFollowBanner: {
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
  kidsLabFollowBannerImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  kidsLabFollowBannerTint: {
    ...StyleSheet.absoluteFillObject,
  },
  kidsLabFollowBannerAccent: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 4,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#ef7b1a",
  },
  kidsLabFollowBannerContent: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 14,
  },
  kidsLabFollowBannerPill: {
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
  kidsLabFollowBannerPillText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1d324e",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  kidsLabFollowBannerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.3,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  kidsLabFollowBannerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    lineHeight: 17,
    maxWidth: "92%",
  },
  kidsLabFollowBannerCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  kidsLabFollowBannerCta: {
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

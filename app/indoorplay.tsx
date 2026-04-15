import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  Platform,
  TextInput,
  type ImageSourcePropType,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import api from "../services/api";

const HEADER_BRAND_LOGO = require("../assets/images/logo.png");
const INDOOR_IMAGE = require("../assets/MainCatImages/images/IndoorPlayEquipments.png");
const KIDS_IMAGE = require("../assets/MainCatImages/images/Kids.png");
/** Dummy promos — existing project assets only */
const IMG_BANNER_ART = require("../assets/images/bannerArt.png");
const IMG_KIDS_CATE = require("../assets/images/kidscate.png");
const IMG_HOME_CATES = require("../assets/images/homecates.png");
const IMG_SPORTS_BANNER = require("../assets/images/sportsbanner1.png");
const IMG_HOME_CATE = require("../assets/images/homecate.png");
const IMG_PROMO_A = require("../assets/images/sportsbanner3.png");
const IMG_PROMO_B = require("../assets/images/getpromoting1.png");
const IMG_PROMO_C = require("../assets/homelyhub/KidsBabyGifts.png");
const IMG_GAARGI = require("../assets/MainCatImages/images/Gaargi.png");
const IMG_TOP_RATED = require("../assets/images/toprated.png");

/**
 * Flint n Thread /Indoor-Play taxonomy (level-2 + level-3 names as on site).
 * Subcategory strings are passed to subcatProducts as `subCategory`.
 */
/** Main aisle headings — image-backed cards (names match site + `openProducts`). */
type MainCategoryShowcaseItem = {
  title: string;
  tagline: string;
  image: ImageSourcePropType;
  overlay: [string, string];
};

type IndoorMainCategoryApiItem = {
  id?: number;
  categoryName?: string;
  image?: string | null;
  bannerImage?: string | null;
  mobileImage?: string | null;
  parentId?: number;
  sellerId?: number | null;
  gstPercentage?: number;
  hsnCode?: string;
  createdAt?: string;
  status?: number | null;
};

const MAIN_CATEGORY_SHOWCASE: MainCategoryShowcaseItem[] = [
  {
    title: "Educational Materials",
    tagline: "Blocks · threading · linking · shapes",
    image: IMG_BANNER_ART,
    overlay: ["rgba(14,165,233,0.82)", "rgba(99,102,241,0.88)"],
  },
  {
    title: "Pre Indoor Play Items",
    tagline: "Slides, rockers & active fun",
    image: IMG_KIDS_CATE,
    overlay: ["rgba(219,39,119,0.78)", "rgba(234,88,12,0.85)"],
  },
  {
    title: "Preschool Furniture",
    tagline: "Chairs, bins & room setup",
    image: IMG_HOME_CATES,
    overlay: ["rgba(2,132,199,0.8)", "rgba(21,94,117,0.9)"],
  },
  {
    title: "Preschool Indoor",
    tagline: "Full indoor preschool range",
    image: INDOOR_IMAGE,
    overlay: ["rgba(109,40,217,0.82)", "rgba(30,27,75,0.9)"],
  },
  {
    title: "Preschool Outdoor Sports Items",
    tagline: "Outdoor sports for little ones",
    image: IMG_SPORTS_BANNER,
    overlay: ["rgba(22,163,74,0.78)", "rgba(12,74,110,0.88)"],
  },
  {
    title: "School Furniture",
    tagline: "Desks, storage & classroom",
    image: IMG_HOME_CATE,
    overlay: ["rgba(180,83,9,0.82)", "rgba(127,29,29,0.88)"],
  },
];

const MAIN_CATEGORY_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/80/subcategories";

const MAIN_CATEGORY_FALLBACK_BY_NAME = new Map(
  MAIN_CATEGORY_SHOWCASE.map((item) => [item.title.trim().toLowerCase(), item])
);

const DEAL_PROMO_CAROUSEL: { image: number; headline: string; sub: string; openTarget: string }[] = [
  { image: IMG_PROMO_A, headline: "Today’s play picks", sub: "Tap to shop educational toys", openTarget: "Educational Materials" },
  { image: IMG_PROMO_B, headline: "Fill the playroom", sub: "Slides, rockers & more", openTarget: "Pre Indoor Play Items" },
  { image: IMG_PROMO_C, headline: "Gift-ready ideas", sub: "Blocks & learning sets", openTarget: "Building Blocks/Block Construction Set" },
];

const EDUCATIONAL_SUBS = [
  "Building Blocks/Block Construction Set",
  "Lacing & Threading Toys",
  "Linking Toys",
  "Shape Sorter & Stacking Toys",
] as const;

const EDU_MOSAIC_THUMBS = [IMG_BANNER_ART, IMG_GAARGI, INDOOR_IMAGE, IMG_TOP_RATED] as const;

type EducationalSubcategoryApiItem = {
  id?: number;
  name?: string;
  image?: string | null;
  mobileImage?: string | null;
};

type EducationalSubcategoriesTableItem = {
  categoryName?: string;
  mobileImage?: string | null;
  subcategories?: EducationalSubcategoryApiItem[];
};

type EducationalMosaicItem = {
  name: string;
  image: ImageSourcePropType;
  aspectRatio: number;
};

const EDUCATIONAL_SUBCATEGORIES_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/84/subcategories-table";

const DEFAULT_EDU_IMAGE_ASPECT_RATIO = 1.45;

function getLocalImageAspectRatio(source: ImageSourcePropType): number {
  const asset = Image.resolveAssetSource(source);
  if (asset?.width && asset?.height && asset.height > 0) {
    return asset.width / asset.height;
  }
  return DEFAULT_EDU_IMAGE_ASPECT_RATIO;
}

async function getRemoteImageAspectRatio(uri: string): Promise<number> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          resolve(width / height);
          return;
        }
        resolve(DEFAULT_EDU_IMAGE_ASPECT_RATIO);
      },
      () => resolve(DEFAULT_EDU_IMAGE_ASPECT_RATIO)
    );
  });
}

const EDUCATIONAL_MOSAIC_FALLBACK: EducationalMosaicItem[] = EDUCATIONAL_SUBS.map((name, idx) => ({
  name,
  image: EDU_MOSAIC_THUMBS[idx % EDU_MOSAIC_THUMBS.length],
  aspectRatio: getLocalImageAspectRatio(EDU_MOSAIC_THUMBS[idx % EDU_MOSAIC_THUMBS.length]),
}));

const PRE_INDOOR_SUBS = ["Rocking Toys", "Slides"] as const;

type PreIndoorCardItem = {
  name: string;
  image: ImageSourcePropType;
};

const PRE_INDOOR_SUBCATEGORIES_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/82/subcategories-table";

const PRE_INDOOR_IMAGE_FALLBACK_BY_NAME = new Map<string, ImageSourcePropType>([
  ["rocking toys", IMG_KIDS_CATE],
  ["slides", IMG_SPORTS_BANNER],
]);

const PRE_INDOOR_FALLBACK_CARDS: PreIndoorCardItem[] = PRE_INDOOR_SUBS.map((name) => ({
  name,
  image:
    PRE_INDOOR_IMAGE_FALLBACK_BY_NAME.get(name.trim().toLowerCase()) ??
    IMG_KIDS_CATE,
}));

const PRESCHOOL_FURNITURE_SUBS = ["Chairs", "Dustbins"] as const;

type PreschoolFurnitureCardItem = {
  name: string;
  image: ImageSourcePropType;
  aspectRatio: number;
};

const PRESCHOOL_FURNITURE_SUBCATEGORIES_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/86/subcategories-table";

const PRESCHOOL_INDOOR_SUBCATEGORIES_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/83/subcategories-table";

const PRESCHOOL_OUTDOOR_SPORTS_SUBCATEGORIES_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/85/subcategories-table";

const SCHOOL_FURNITURE_SUBCATEGORIES_API_URL =
  "https://flintnthread-app-axczbcbrdebce5ev.centralindia-01.azurewebsites.net/api/categories/81/subcategories-table";

const PRESCHOOL_FURNITURE_IMAGE_FALLBACK_BY_NAME = new Map<
  string,
  ImageSourcePropType
>([
  ["chairs", IMG_HOME_CATES],
  ["dustbins", IMG_HOME_CATE],
]);

const PRESCHOOL_FURNITURE_FALLBACK_CARDS: PreschoolFurnitureCardItem[] =
  PRESCHOOL_FURNITURE_SUBS.map((name) => ({
    name,
    image:
      PRESCHOOL_FURNITURE_IMAGE_FALLBACK_BY_NAME.get(
        name.trim().toLowerCase()
      ) ?? IMG_HOME_CATES,
    aspectRatio: getLocalImageAspectRatio(
      PRESCHOOL_FURNITURE_IMAGE_FALLBACK_BY_NAME.get(
        name.trim().toLowerCase()
      ) ?? IMG_HOME_CATES
    ),
  }));

const BROWSE_ONLY_PARENTS = [
  "Preschool Indoor",
  "Preschool Outdoor Sports Items",
  "School Furniture",
] as const;

const BANNERS: {
  key: string;
  title: string;
  sub: string;
  cta: string;
  colors: [string, string];
  image: number;
  openTarget: string;
}[] = [
  {
    key: "bn1",
    title: "Learning through play",
    sub: "Blocks, linking toys, shape sorters & more from Educational Materials",
    cta: "Shop educational",
    colors: ["#0d9488", "#0369a1"],
    image: INDOOR_IMAGE,
    openTarget: "Educational Materials",
  },
  {
    key: "bn2",
    title: "Rockers & slides",
    sub: "Active picks from Pre Indoor Play — rockers, slides, ride-ons",
    cta: "Explore pre-indoor",
    colors: ["#c026d3", "#7c3aed"],
    image: KIDS_IMAGE,
    openTarget: "Pre Indoor Play Items",
  },
];

/** Spotlight rows — each opens a real level-3 subcategory. */
const FEATURE_STORIES = [
  {
    title: "Build & stack",
    sub: "Construction sets and linking toys for curious minds",
    subCategory: "Building Blocks/Block Construction Set",
    image: INDOOR_IMAGE,
    colors: ["#0ea5e9", "#6366f1"] as [string, string],
  },
  {
    title: "Rock & ride",
    sub: "Rocking toys and slides for energy-filled playtimes",
    subCategory: "Rocking Toys",
    image: IMG_KIDS_CATE,
    colors: ["#f97316", "#db2777"] as [string, string],
  },
  {
    title: "Preschool corner",
    sub: "Chairs, storage and tidy-up helpers for little rooms",
    subCategory: "Chairs",
    image: INDOOR_IMAGE,
    colors: ["#14b8a6", "#8b5cf6"] as [string, string],
  },
] as const;

const CAROUSEL_PICKS: { sub: string; image: number }[] = [
  { sub: "Shape Sorter & Stacking Toys", image: IMG_TOP_RATED },
  { sub: "Lacing & Threading Toys", image: IMG_GAARGI },
  { sub: "Linking Toys", image: INDOOR_IMAGE },
  { sub: "Dustbins", image: IMG_HOME_CATE },
];

const CURATED_LIST = [
  { title: "Sort & stack skills", sub: "Shape Sorter & Stacking Toys" },
  { title: "Threading & fine motor", sub: "Lacing & Threading Toys" },
  { title: "Connect & build", sub: "Linking Toys" },
  { title: "Construction play", sub: "Building Blocks/Block Construction Set" },
] as const;

const PAIR_IDEAS = [
  { label: "Blocks + linking", a: "Building Blocks/Block Construction Set", b: "Linking Toys" },
  { label: "Slide + rockers", a: "Slides", b: "Rocking Toys" },
  { label: "Chairs + tidy bins", a: "Chairs", b: "Dustbins" },
  { label: "Shapes + lacing", a: "Shape Sorter & Stacking Toys", b: "Lacing & Threading Toys" },
] as const;

const QUICK_LINKS = [
  { emoji: "🧩", label: "Shape sort", sub: "Shape Sorter & Stacking Toys" },
  { emoji: "🧵", label: "Lacing fun", sub: "Lacing & Threading Toys" },
  { emoji: "🔗", label: "Linking set", sub: "Linking Toys" },
  { emoji: "🎠", label: "Rocking", sub: "Rocking Toys" },
] as const;

const GIFT_IDEAS = [
  { label: "Starter builder gift", sub: "Building Blocks/Block Construction Set" },
  { label: "Active play gift", sub: "Slides" },
  { label: "Classroom helper", sub: "Dustbins" },
  { label: "Little reader chair", sub: "Chairs" },
] as const;

const ALL_INDOOR_PLAY_CATALOG = "All Indoor Play";

const INDOOR_PLAY_PREVIEW_PRODUCTS: {
  title: string;
  subCategory: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  image: number;
}[] = [
  {
    title: "Builder blocks set",
    subCategory: "Building Blocks/Block Construction Set",
    price: 799,
    mrp: 1599,
    rating: 4.8,
    reviews: 412,
    image: IMG_BANNER_ART,
  },
  {
    title: "Lacing threading kit",
    subCategory: "Lacing & Threading Toys",
    price: 649,
    mrp: 1299,
    rating: 4.7,
    reviews: 356,
    image: IMG_GAARGI,
  },
  {
    title: "Rocking indoor toy",
    subCategory: "Rocking Toys",
    price: 1399,
    mrp: 2799,
    rating: 4.9,
    reviews: 278,
    image: IMG_KIDS_CATE,
  },
  {
    title: "Preschool chair",
    subCategory: "Chairs",
    price: 1199,
    mrp: 2399,
    rating: 4.6,
    reviews: 194,
    image: IMG_HOME_CATES,
  },
];

const SCHOOL_FURNITURE_ITEMS: {
  text: string;
  subCategory: string;
  image: ImageSourcePropType;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    text: "Classroom chairs for daily seating comfort",
    subCategory: "Chairs",
    image: IMG_HOME_CATES,
    icon: "body-outline",
  },
  {
    text: "Durable dustbins for clean school spaces",
    subCategory: "Dustbins",
    image: IMG_HOME_CATE,
    icon: "trash-outline",
  },
  {
    text: "Browse complete school furniture catalogue",
    subCategory: "School Furniture",
    image: IMG_HOME_CATES,
    icon: "library-outline",
  },
] as const;

/** Full-bleed snap carousel between Playroom tips and Shop all — each slide opens products. */
const TIPS_TO_SHOP_BANNERS: {
  key: string;
  image: number;
  title: string;
  sub: string;
  openTarget: string;
  accent: [string, string];
}[] = [
  {
    key: "ts1",
    image: require("../assets/images/sportsbanner4.png"),
    title: "Active play edit",
    sub: "Outdoor preschool sports & energy burners",
    openTarget: "Preschool Outdoor Sports Items",
    accent: ["#059669", "#0f766e"],
  },
  {
    key: "ts2",
    image: require("../assets/images/artBanner.png"),
    title: "Creative corner",
    sub: "Threading, linking & hands-on learning",
    openTarget: "Lacing & Threading Toys",
    accent: ["#7c3aed", "#4f46e5"],
  },
  {
    key: "ts3",
    image: require("../assets/images/sportsbanner2.png"),
    title: "School-ready setup",
    sub: "Furniture & storage for little classrooms",
    openTarget: "School Furniture",
    accent: ["#b45309", "#9a3412"],
  },
  {
    key: "ts4",
    image: require("../assets/images/applicationbanner.png"),
    title: "Indoor preschool hub",
    sub: "Browse the full Preschool Indoor range",
    openTarget: "Preschool Indoor",
    accent: ["#db2777", "#be185d"],
  },
];

function SectionTitle({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleIconWrap}>
        <Ionicons name={icon} size={15} color="#7c3aed" />
      </View>
      <View style={styles.sectionTitleTextWrap}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function BannerAd({
  title,
  sub,
  cta,
  colors,
  image,
  onPress,
}: {
  title: string;
  sub: string;
  cta: string;
  colors: [string, string];
  image: number;
  onPress?: () => void;
}) {
  const inner = (
    <>
      <Image source={image} style={styles.bannerImage} resizeMode="cover" />
      <LinearGradient colors={["rgba(15,23,42,0.1)", "rgba(15,23,42,0.45)"]} style={styles.bannerImageFade} />
      <View style={styles.bannerGlow} />
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>{title}</Text>
        <Text style={styles.bannerSub}>{sub}</Text>
        <View style={styles.bannerCta}>
          <Text style={styles.bannerCtaText}>{cta}</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </View>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        <LinearGradient colors={colors} style={styles.bannerCard}>
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return <LinearGradient colors={colors} style={styles.bannerCard}>{inner}</LinearGradient>;
}

const TIPS_CAROUSEL_INTERVAL_MS = 5200;

function TipsToShopBannerCarousel({ onOpen }: { onOpen: (subCategory: string) => void }) {
  const { width: winW } = useWindowDimensions();
  const slideH = Math.min(210, Math.max(172, Math.round(winW * 0.44)));
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const count = TIPS_TO_SHOP_BANNERS.length;
  const userInteracting = useRef(false);

  const snapToPage = useCallback(
    (index: number) => {
      const i = ((index % count) + count) % count;
      scrollRef.current?.scrollTo({ x: i * winW, animated: true });
      setPage(i);
    },
    [count, winW]
  );

  useEffect(() => {
    setPage(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [winW]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = setInterval(() => {
      if (userInteracting.current) return;
      setPage((prev) => {
        const next = (prev + 1) % count;
        scrollRef.current?.scrollTo({ x: next * winW, animated: true });
        return next;
      });
    }, TIPS_CAROUSEL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [count, winW]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / winW);
      setPage(Math.min(count - 1, Math.max(0, i)));
    },
    [count, winW]
  );

  return (
    <View style={styles.tipsShopBannerSection}>
      <LinearGradient colors={["#1e1b4b", "#312e81"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tipsShopBannerHeader}>
        <View style={styles.tipsShopBannerHeaderRow}>
          <Ionicons name="images-outline" size={20} color="#fde68a" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipsShopBannerEyebrow}>SCROLL · SWIPE</Text>
            <Text style={styles.tipsShopBannerTitle}>Spotlight before you shop all</Text>
            <Text style={styles.tipsShopBannerSub}>Auto-rotates — tap any slide to open products</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled={Platform.OS === "android"}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={winW}
        snapToAlignment="start"
        disableIntervalMomentum
        onScrollBeginDrag={() => {
          userInteracting.current = true;
        }}
        onScrollEndDrag={() => {
          userInteracting.current = false;
        }}
        onMomentumScrollEnd={onMomentumEnd}
        style={[styles.tipsShopBannerScroll, { height: slideH }]}
        contentContainerStyle={{ width: winW * count }}
      >
        {TIPS_TO_SHOP_BANNERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.95}
            onPress={() => onOpen(item.openTarget)}
            style={[styles.tipsShopBannerPage, { width: winW, height: slideH }]}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.sub}`}
          >
            <Image source={item.image} style={styles.tipsShopBannerImage} resizeMode="cover" />
            <LinearGradient colors={["transparent", "rgba(15,23,42,0.5)", "rgba(15,23,42,0.88)"]} style={styles.tipsShopBannerFade} />
            <LinearGradient
              colors={item.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tipsShopBannerAccentBar}
            />
            <View style={styles.tipsShopBannerTextBlock}>
              <Text style={styles.tipsShopBannerSlideTitle}>{item.title}</Text>
              <Text style={styles.tipsShopBannerSlideSub}>{item.sub}</Text>
              <View style={styles.tipsShopBannerCta}>
                <Text style={styles.tipsShopBannerCtaText}>View products</Text>
                <Ionicons name="arrow-forward-circle" size={18} color="#fde68a" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {count > 1 ? (
        <View style={styles.tipsShopBannerDots}>
          {TIPS_TO_SHOP_BANNERS.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => snapToPage(i)}
              style={[styles.tipsShopBannerDot, i === page ? styles.tipsShopBannerDotActive : null]}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MainCategoryShowcaseCard({
  title,
  tagline,
  image,
  overlay,
  onPress,
}: {
  title: string;
  tagline: string;
  image: ImageSourcePropType;
  overlay: [string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.mainCatCard} onPress={onPress} activeOpacity={0.92} accessibilityRole="button" accessibilityLabel={title}>
      <Image source={image} style={styles.mainCatCardImage} resizeMode="cover" />
      <LinearGradient colors={overlay} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={styles.mainCatCardOverlay} />
      <View style={styles.mainCatCardContent}>
        <Text style={styles.mainCatCardTitle}>{title}</Text>
        <Text style={styles.mainCatCardTagline} numberOfLines={2}>
          {tagline}
        </Text>
        <View style={styles.mainCatShopPill}>
          <Text style={styles.mainCatShopPillText}>Book / shop</Text>
          <Ionicons name="arrow-forward" size={14} color="#312e81" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function IndoorPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mainScrollRef = useRef<ScrollView>(null);
  const educationalSectionY = useRef(0);
  const preIndoorSectionY = useRef(0);
  const preschoolFurnitureSectionY = useRef(0);
  const pairIdeasSectionY = useRef(0);
  const quickShortcutsSectionY = useRef(0);
  const playroomTipsSectionY = useRef(0);
  const [mainCategoryCards, setMainCategoryCards] = useState<MainCategoryShowcaseItem[]>(MAIN_CATEGORY_SHOWCASE);
  const [educationalMosaicCards, setEducationalMosaicCards] =
    useState<EducationalMosaicItem[]>(EDUCATIONAL_MOSAIC_FALLBACK);
  const [preIndoorCards, setPreIndoorCards] =
    useState<PreIndoorCardItem[]>(PRE_INDOOR_FALLBACK_CARDS);
  const [preschoolFurnitureCards, setPreschoolFurnitureCards] = useState<
    PreschoolFurnitureCardItem[]
  >(PRESCHOOL_FURNITURE_FALLBACK_CARDS);
  const [preschoolIndoorBannerImage, setPreschoolIndoorBannerImage] =
    useState<ImageSourcePropType>(INDOOR_IMAGE);
  const [preschoolOutdoorBannerImage, setPreschoolOutdoorBannerImage] =
    useState<ImageSourcePropType>(IMG_SPORTS_BANNER);
  const [schoolFurnitureBannerImage, setSchoolFurnitureBannerImage] =
    useState<ImageSourcePropType>(IMG_HOME_CATES);

  useEffect(() => {
    let active = true;
    const loadMainCategories = async () => {
      try {
        const res = await api.get<IndoorMainCategoryApiItem[]>(MAIN_CATEGORY_API_URL);
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const activeItems = payload.filter(
          (item) => (item?.status == null || item.status === 1) && item?.categoryName?.trim()
        );
        if (activeItems.length === 0) return;

        const cardsFromApi: MainCategoryShowcaseItem[] = activeItems.map((item) => {
          const title = item.categoryName!.trim();
          const key = title.toLowerCase();
          const fallback = MAIN_CATEGORY_FALLBACK_BY_NAME.get(key);
          const remoteImage =
            item.mobileImage && /^https?:\/\//i.test(item.mobileImage)
              ? { uri: item.mobileImage }
              : null;

          return {
            title,
            tagline: fallback?.tagline ?? "Tap to explore this indoor category",
            image: remoteImage ?? fallback?.image ?? INDOOR_IMAGE,
            overlay: fallback?.overlay ?? ["rgba(30,41,59,0.75)", "rgba(15,23,42,0.9)"],
          };
        });

        if (active && cardsFromApi.length > 0) setMainCategoryCards(cardsFromApi);
      } catch {
        // keep existing static cards as fallback
      }
    };

    loadMainCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadEducationalSubcategories = async () => {
      try {
        const res = await api.get<EducationalSubcategoriesTableItem[]>(
          EDUCATIONAL_SUBCATEGORIES_API_URL
        );
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const target =
          payload.find(
            (item) =>
              item.categoryName?.trim().toLowerCase() ===
              "educational materials"
          ) ?? payload[0];
        const subcategories = target?.subcategories ?? [];
        if (subcategories.length === 0) return;

        const fallbackByName = new Map(
          EDUCATIONAL_MOSAIC_FALLBACK.map((item) => [
            item.name.trim().toLowerCase(),
            item.image,
          ])
        );

        const filtered = subcategories.filter((item) => item.name?.trim());
        const mapped: EducationalMosaicItem[] = await Promise.all(
          filtered.map(async (item, idx) => {
            const name = item.name!.trim();
            const fallbackImage =
              fallbackByName.get(name.toLowerCase()) ??
              EDU_MOSAIC_THUMBS[idx % EDU_MOSAIC_THUMBS.length];
            const remoteUri =
              item.mobileImage && /^https?:\/\//i.test(item.mobileImage)
                ? item.mobileImage
                : null;
            const aspectRatio = remoteUri
              ? await getRemoteImageAspectRatio(remoteUri)
              : getLocalImageAspectRatio(fallbackImage);
            return {
              name,
              image: remoteUri ? { uri: remoteUri } : fallbackImage,
              aspectRatio,
            };
          })
        );

        if (active && mapped.length > 0) {
          setEducationalMosaicCards(mapped);
        }
      } catch {
        // keep fallback educational subcategory cards
      }
    };

    loadEducationalSubcategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPreIndoorSubcategories = async () => {
      try {
        const res = await api.get<EducationalSubcategoriesTableItem[]>(
          PRE_INDOOR_SUBCATEGORIES_API_URL
        );
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const target =
          payload.find(
            (item) =>
              item.categoryName?.trim().toLowerCase() === "pre indoor play items"
          ) ?? payload[0];
        const subcategories = target?.subcategories ?? [];
        if (subcategories.length === 0) return;

        const mapped: PreIndoorCardItem[] = subcategories
          .filter((item) => item.name?.trim())
          .map((item) => {
            const name = item.name!.trim();
            const fallbackImage =
              PRE_INDOOR_IMAGE_FALLBACK_BY_NAME.get(name.toLowerCase()) ??
              IMG_KIDS_CATE;
            const remoteImage =
              item.mobileImage && /^https?:\/\//i.test(item.mobileImage)
                ? { uri: item.mobileImage }
                : null;
            return {
              name,
              image: remoteImage ?? fallbackImage,
            };
          });

        if (active && mapped.length > 0) {
          setPreIndoorCards(mapped);
        }
      } catch {
        // keep fallback pre indoor cards
      }
    };

    loadPreIndoorSubcategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPreschoolFurnitureSubcategories = async () => {
      try {
        const res = await api.get<EducationalSubcategoriesTableItem[]>(
          PRESCHOOL_FURNITURE_SUBCATEGORIES_API_URL
        );
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const target =
          payload.find(
            (item) =>
              item.categoryName?.trim().toLowerCase() ===
              "preschool furniture"
          ) ?? payload[0];
        const subcategories = target?.subcategories ?? [];
        if (subcategories.length === 0) return;

        const mapped: PreschoolFurnitureCardItem[] = subcategories
          .filter((item) => item.name?.trim())
          .map((item) => {
            const name = item.name!.trim();
            const fallbackImage =
              PRESCHOOL_FURNITURE_IMAGE_FALLBACK_BY_NAME.get(
                name.toLowerCase()
              ) ?? IMG_HOME_CATES;
            const remoteUri =
              item.mobileImage && /^https?:\/\//i.test(item.mobileImage)
                ? item.mobileImage
                : null;
            return {
              name,
              image: remoteUri ? { uri: remoteUri } : fallbackImage,
              aspectRatio: remoteUri
                ? DEFAULT_EDU_IMAGE_ASPECT_RATIO
                : getLocalImageAspectRatio(fallbackImage),
            };
          });

        const mappedWithRatios = await Promise.all(
          mapped.map(async (item) => {
            const uri =
              typeof item.image === "object" &&
              item.image !== null &&
              "uri" in item.image &&
              typeof item.image.uri === "string"
                ? item.image.uri
                : null;
            if (!uri) return item;
            return {
              ...item,
              aspectRatio: await getRemoteImageAspectRatio(uri),
            };
          })
        );

        if (active && mappedWithRatios.length > 0) {
          setPreschoolFurnitureCards(mappedWithRatios);
        }
      } catch {
        // keep fallback preschool furniture cards
      }
    };

    loadPreschoolFurnitureSubcategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPreschoolIndoorBanner = async () => {
      try {
        const res = await api.get<EducationalSubcategoriesTableItem[]>(
          PRESCHOOL_INDOOR_SUBCATEGORIES_API_URL
        );
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const target =
          payload.find(
            (item) =>
              item.categoryName?.trim().toLowerCase() === "preschool indoor"
          ) ?? payload[0];
        const remoteUri =
          target?.mobileImage && /^https?:\/\//i.test(target.mobileImage)
            ? target.mobileImage
            : null;
        if (active && remoteUri) {
          setPreschoolIndoorBannerImage({ uri: remoteUri });
        }
      } catch {
        // keep fallback preschool indoor banner image
      }
    };

    loadPreschoolIndoorBanner();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadPreschoolOutdoorSportsBanner = async () => {
      try {
        const res = await api.get<EducationalSubcategoriesTableItem[]>(
          PRESCHOOL_OUTDOOR_SPORTS_SUBCATEGORIES_API_URL
        );
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const target =
          payload.find(
            (item) =>
              item.categoryName?.trim().toLowerCase() ===
              "preschool outdoor sports items"
          ) ?? payload[0];
        const remoteUri =
          target?.mobileImage && /^https?:\/\//i.test(target.mobileImage)
            ? target.mobileImage
            : null;
        if (active && remoteUri) {
          setPreschoolOutdoorBannerImage({ uri: remoteUri });
        }
      } catch {
        // keep fallback preschool outdoor sports banner image
      }
    };

    loadPreschoolOutdoorSportsBanner();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSchoolFurnitureBanner = async () => {
      try {
        const res = await api.get<EducationalSubcategoriesTableItem[]>(
          SCHOOL_FURNITURE_SUBCATEGORIES_API_URL
        );
        const payload = Array.isArray(res.data) ? res.data : [];
        if (payload.length === 0) return;

        const target =
          payload.find(
            (item) =>
              item.categoryName?.trim().toLowerCase() === "school furniture"
          ) ?? payload[0];
        const remoteUri =
          target?.mobileImage && /^https?:\/\//i.test(target.mobileImage)
            ? target.mobileImage
            : null;
        if (active && remoteUri) {
          setSchoolFurnitureBannerImage({ uri: remoteUri });
        }
      } catch {
        // keep fallback school furniture banner image
      }
    };

    loadSchoolFurnitureBanner();
    return () => {
      active = false;
    };
  }, []);

  const openMainCategory = (title: string) => {
    if (title === "Educational Materials") {
      const targetY = Math.max(0, educationalSectionY.current - 8);
      mainScrollRef.current?.scrollTo({ y: targetY, animated: true });
      return;
    }
    if (title === "Pre Indoor Play Items") {
      const targetY = Math.max(0, preIndoorSectionY.current - 8);
      mainScrollRef.current?.scrollTo({ y: targetY, animated: true });
      return;
    }
    if (title === "Preschool Furniture") {
      const targetY = Math.max(0, preschoolFurnitureSectionY.current - 8);
      mainScrollRef.current?.scrollTo({ y: targetY, animated: true });
      return;
    }
    if (title === "Preschool Indoor") {
      const targetY = Math.max(0, pairIdeasSectionY.current - 8);
      mainScrollRef.current?.scrollTo({ y: targetY, animated: true });
      return;
    }
    if (title === "Preschool Outdoor Sports Items") {
      const targetY = Math.max(0, quickShortcutsSectionY.current - 8);
      mainScrollRef.current?.scrollTo({ y: targetY, animated: true });
      return;
    }
    if (title === "School Furniture") {
      const targetY = Math.max(0, playroomTipsSectionY.current - 8);
      mainScrollRef.current?.scrollTo({ y: targetY, animated: true });
      return;
    }
    openProducts(title);
  };

  const openProducts = (subCategory: string) => {
    router.push({
      pathname: "/subcatProducts",
      params: { mainCat: "indoorPlayEquipments", subCategory },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topFixedArea}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.headerBrand}
            onPress={() => router.replace("/home")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <Image source={HEADER_BRAND_LOGO} style={styles.headerBrandLogo} resizeMode="contain" />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <TouchableOpacity
              style={styles.searchBoxTap}
              activeOpacity={0.85}
              onPress={() => router.push("/search")}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <Ionicons name="search-outline" size={18} color="#9aa0a6" />
              <TextInput
                placeholder="Search.."
                placeholderTextColor="#b0b5ba"
                style={styles.searchInput}
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => router.push("/camerasearch")}
              accessibilityRole="button"
              accessibilityLabel="Search by camera"
            >
              <Ionicons name="camera-outline" size={20} color="#9aa0a6" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/wishlist")} accessibilityRole="button" accessibilityLabel="Wishlist">
              <Ionicons name="heart-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/cart")} accessibilityRole="button" accessibilityLabel="Cart">
              <Ionicons name="bag-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={["#1e1b4b", "#4c1d95", "#5b21b6"]} style={styles.hero}>
          <Image source={INDOOR_IMAGE} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={["rgba(30,27,75,0.2)", "rgba(30,27,75,0.88)"]} style={styles.heroFade} />
          <View style={styles.heroBadge}>
            <Ionicons name="storefront-outline" size={14} color="#fff" />
            <Text style={styles.heroBadgeText}>Flint n Thread</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>Indoor Play</Text>
            <Text style={styles.heroTitle}>Shop indoor play online</Text>
            
          </View>
        </LinearGradient>

        <View style={styles.dealStripSection}>
          <View style={styles.dealStripHeader}>
            <Ionicons name="pricetag-outline" size={18} color="#c026d3" />
            <Text style={styles.dealStripTitle}>Limited-time banners</Text>
          </View>
          <ScrollView
            horizontal
            nestedScrollEnabled={Platform.OS === "android"}
            showsHorizontalScrollIndicator={false}
            style={styles.hCarousel}
            contentContainerStyle={styles.dealStripScroll}
          >
            {DEAL_PROMO_CAROUSEL.map((deal, i) => (
              <TouchableOpacity
                key={i}
                style={styles.dealStripCard}
                onPress={() => openProducts(deal.openTarget)}
                activeOpacity={0.92}
              >
                <Image source={deal.image} style={styles.dealStripImage} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(15,23,42,0.82)"]} style={styles.dealStripFade} />
                <View style={styles.dealStripTextBlock}>
                  <Text style={styles.dealStripHeadline}>{deal.headline}</Text>
                  <Text style={styles.dealStripSub}>{deal.sub}</Text>
                  <View style={styles.dealStripCta}>
                    <Text style={styles.dealStripCtaText}>Shop</Text>
                    <Ionicons name="chevron-forward" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.mainCategoriesSection}>
          <View style={styles.mainCategoriesHeaderBand}>
            <View style={styles.mainCategoriesIconRow}>
              <View style={styles.mainCategoriesIconPill}>
                <Ionicons name="barbell-outline" size={13} color="#7c3aed" />
                <Text style={styles.mainCategoriesIconText}>Slides</Text>
              </View>
              <View style={styles.mainCategoriesIconPill}>
                <Ionicons name="football-outline" size={13} color="#0f766e" />
                <Text style={styles.mainCategoriesIconText}>Sports</Text>
              </View>
              <View style={styles.mainCategoriesIconPill}>
                <Ionicons name="school-outline" size={13} color="#1d4ed8" />
                <Text style={styles.mainCategoriesIconText}>Classroom</Text>
              </View>
            </View>
            <Text style={styles.mainCategoriesHeading}>Playground Equipment Categories</Text>
            <Text style={styles.mainCategoriesSub}>
              Explore indoor learning, active play, and school setup sections.
            </Text>
          </View>
          <View style={styles.mainCatGrid}>
            {mainCategoryCards.map((cat) => (
              <MainCategoryShowcaseCard
                key={cat.title}
                title={cat.title}
                tagline={cat.tagline}
                image={cat.image}
                overlay={cat.overlay}
                onPress={() => openMainCategory(cat.title)}
              />
            ))}
          </View>
        </View>

        <View
          style={[styles.section, styles.sectionAccentTeal]}
          onLayout={(event) => {
            educationalSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionTitle icon="library-outline" title="Educational Materials" subtitle="Blocks, threading, linking & shape play" />
          <View style={styles.eduMosaic}>
            {educationalMosaicCards.map((sub, i) => (
              <TouchableOpacity
                key={sub.name}
                style={[styles.eduMosaicCell, i % 2 === 0 ? styles.eduMosaicCellA : styles.eduMosaicCellB]}
                onPress={() => openProducts(sub.name)}
                activeOpacity={0.92}
              >
                <Image
                  source={sub.image}
                  style={[styles.eduMosaicThumb, { aspectRatio: sub.aspectRatio || DEFAULT_EDU_IMAGE_ASPECT_RATIO }]}
                  resizeMode="contain"
                />
                <Text style={styles.eduMosaicIndex}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={styles.eduMosaicTitle} numberOfLines={3}>
                  {sub.name}
                </Text>
                <View style={styles.eduMosaicFoot}>
                  <Text style={styles.eduMosaicCta}>Shop</Text>
                  <Ionicons name="chevron-forward" size={14} color="#0f766e" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => openProducts("Educational Materials")}>
            <Text style={styles.outlineBtnText}>Browse all Educational Materials</Text>
            <Ionicons name="arrow-forward" size={15} color="#0f766e" />
          </TouchableOpacity>
        </View>

        <View style={styles.bannerWrap}>
          <BannerAd
            title={BANNERS[0].title}
            sub={BANNERS[0].sub}
            cta={BANNERS[0].cta}
            colors={BANNERS[0].colors}
            image={BANNERS[0].image}
            onPress={() => openProducts(BANNERS[0].openTarget)}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle icon="flame-outline" title="Popular picks" subtitle="Trending types from the catalogue" />
          <ScrollView
            horizontal
            nestedScrollEnabled={Platform.OS === "android"}
            showsHorizontalScrollIndicator={false}
            style={styles.hCarousel}
            contentContainerStyle={styles.hCarouselContent}
          >
            {CAROUSEL_PICKS.map((item) => (
              <TouchableOpacity key={item.sub} style={styles.cardTall} onPress={() => openProducts(item.sub)}>
                <Image source={item.image} style={styles.cardTallImage} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(15,23,42,0.78)"]} style={styles.cardTallFade} />
                <Text style={styles.cardTallText}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View
          style={[styles.section, styles.sectionAccentRose]}
          onLayout={(event) => {
            preIndoorSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionTitle icon="barbell-outline" title="Pre Indoor Play Items" subtitle="Slides, rockers & active play" />
          <View style={styles.dualFeatured}>
            {preIndoorCards.map((item) => (
              <TouchableOpacity key={item.name} style={styles.dualCard} onPress={() => openProducts(item.name)} activeOpacity={0.92}>
                <Image source={item.image} style={styles.dualCardImage} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(15,23,42,0.5)"]} style={styles.dualCardFade} />
                <Text style={styles.dualCardTitle}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.ghostLink} onPress={() => openProducts("Pre Indoor Play Items")}>
            <Text style={styles.ghostLinkText}>View entire Pre Indoor aisle</Text>
            <Ionicons name="chevron-forward" size={16} color="#be185d" />
          </TouchableOpacity>
        </View>

        <View style={styles.storyWrap}>
          <SectionTitle
            icon="sparkles-outline"
            title="Spotlight stories"
            subtitle="Quick collections you can open instantly"
          />
          {FEATURE_STORIES.map((story, index) => (
            <TouchableOpacity
              key={story.title}
              style={[styles.storyCard, index % 2 === 1 ? styles.storyCardReverse : null]}
              onPress={() => openProducts(story.subCategory)}
              activeOpacity={0.92}
            >
              <View style={styles.storyMedia}>
                <Image source={story.image} style={styles.storyImageFill} resizeMode="cover" />
              </View>
              <LinearGradient colors={story.colors} style={styles.storyTextPanel}>
                <Text style={styles.storyEyebrow}>Spotlight</Text>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storySub}>{story.sub}</Text>
                <View style={styles.storyCta}>
                  <Text style={styles.storyCtaText}>Open collection</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={styles.section}
          onLayout={(event) => {
            preschoolFurnitureSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionTitle icon="construct-outline" title="Preschool Furniture" subtitle="Chairs, bins & room helpers" />
          <View style={styles.furnitureRow}>
            {preschoolFurnitureCards.map((item) => (
              <TouchableOpacity key={item.name} style={styles.furnitureCard} onPress={() => openProducts(item.name)} activeOpacity={0.9}>
                <Image
                  source={item.image}
                  style={[
                    styles.furniturePhoto,
                    {
                      aspectRatio:
                        item.aspectRatio || DEFAULT_EDU_IMAGE_ASPECT_RATIO,
                    },
                  ]}
                  resizeMode="contain"
                />
                <View style={styles.furnitureMetaRow}>
                  <View style={styles.furnitureIconWrap}>
                    {item.name.toLowerCase() === "chairs" ? (
                      <MaterialCommunityIcons
                        name="chair-rolling"
                        size={18}
                        color="#0369a1"
                      />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#0369a1"
                      />
                    )}
                  </View>
                  <Text style={styles.furnitureTitle}>{item.name}</Text>
                </View>
                <Text style={styles.furnitureHint}>Tap to browse</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle icon="sparkles-outline" title="Curated for learning" subtitle="Hand-picked subcategories" />
          {CURATED_LIST.map((row, idx) => (
            <TouchableOpacity key={row.title} style={styles.listRow} onPress={() => openProducts(row.sub)}>
              <Image source={EDU_MOSAIC_THUMBS[idx % EDU_MOSAIC_THUMBS.length]} style={styles.listThumb} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowText}>{row.title}</Text>
                <Text style={styles.listRowHint}>{row.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bannerWrap}>
          <BannerAd
            title={BANNERS[1].title}
            sub={BANNERS[1].sub}
            cta={BANNERS[1].cta}
            colors={BANNERS[1].colors}
            image={BANNERS[1].image}
            onPress={() => openProducts(BANNERS[1].openTarget)}
          />
        </View>

        <View
          style={styles.section}
          onLayout={(event) => {
            pairIdeasSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionTitle icon="git-compare-outline" title="Preschool Indoor" subtitle="Shop two complementary types" />
          <TouchableOpacity
            style={styles.targetedSectionBanner}
            activeOpacity={0.92}
            onPress={() => openProducts("Preschool Indoor")}
            accessibilityRole="button"
            accessibilityLabel="Preschool Indoor banner"
          >
            <Image
              source={INDOOR_IMAGE}
              style={styles.targetedSectionBannerImage}
              resizeMode="cover"
            />
            <LinearGradient colors={["rgba(30,27,75,0.2)", "rgba(30,27,75,0.88)"]} style={styles.targetedSectionBannerOverlay} />
            <View style={styles.targetedSectionBannerInner}>
              <View style={styles.targetedSectionBannerIconWrap}>
                <Ionicons name="school-outline" size={16} color="#e0e7ff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetedSectionBannerKicker}>PRESCHOOL INDOOR</Text>
                <Text style={styles.targetedSectionBannerText}>Preschool Indoor combos and room pairings</Text>
                <Text style={styles.targetedSectionBannerSub}>Tap to open indoor preschool collections</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={18} color="#e0e7ff" />
            </View>
          </TouchableOpacity>
          <View style={styles.comboWrap}>
            {PAIR_IDEAS.map((pair) => (
              <TouchableOpacity
                key={pair.label}
                style={styles.comboCard}
                onPress={() => openProducts(pair.a)}
                activeOpacity={0.9}
              >
                <LinearGradient colors={["#fff7ed", "#ffedd5"]} style={styles.comboInner}>
                  <Ionicons name="link-outline" size={16} color="#ea580c" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comboText}>{pair.label}</Text>
                    <Text style={styles.comboSub} numberOfLines={2}>
                      {pair.a} · {pair.b}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={styles.section}
          onLayout={(event) => {
            quickShortcutsSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionTitle icon="color-wand-outline" title="Preschool Outdoor Sports Items" subtitle="One tap into a top subcategory" />
          <TouchableOpacity
            style={styles.targetedSectionBanner}
            activeOpacity={0.92}
            onPress={() => openProducts("Preschool Outdoor Sports Items")}
            accessibilityRole="button"
            accessibilityLabel="Preschool Outdoor Sports Items banner"
          >
            <Image
              source={preschoolOutdoorBannerImage}
              style={styles.targetedSectionBannerImage}
              resizeMode="cover"
            />
            <LinearGradient colors={["rgba(6,78,59,0.18)", "rgba(6,78,59,0.9)"]} style={styles.targetedSectionBannerOverlay} />
            <View style={styles.targetedSectionBannerInner}>
              <View style={styles.targetedSectionBannerIconWrap}>
                <Ionicons name="football-outline" size={16} color="#d1fae5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetedSectionBannerKicker}>PRESCHOOL OUTDOOR SPORTS</Text>
                <Text style={styles.targetedSectionBannerText}>Outdoor sports quick starts for preschoolers</Text>
                <Text style={styles.targetedSectionBannerSub}>Tap to browse active outdoor picks</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={18} color="#d1fae5" />
            </View>
          </TouchableOpacity>
          <View style={styles.challengeWrap}>
            {QUICK_LINKS.map((q) => (
              <TouchableOpacity key={q.label} style={styles.challengeCard} onPress={() => openProducts(q.sub)}>
                <Text style={styles.challengeEmoji}>{q.emoji}</Text>
                <Text style={styles.challengeText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={styles.section}
          onLayout={(event) => {
            playroomTipsSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <SectionTitle icon="book-outline" title="School Furniture" subtitle="Ideas that pair with our aisles" />
          <TouchableOpacity
            style={styles.targetedSectionBanner}
            activeOpacity={0.92}
            onPress={() => openProducts("School Furniture")}
            accessibilityRole="button"
            accessibilityLabel="School Furniture banner"
          >
            <Image
              source={schoolFurnitureBannerImage}
              style={styles.targetedSectionBannerImage}
              resizeMode="cover"
            />
            <LinearGradient colors={["rgba(120,53,15,0.18)", "rgba(120,53,15,0.9)"]} style={styles.targetedSectionBannerOverlay} />
            <View style={styles.targetedSectionBannerInner}>
              <View style={styles.targetedSectionBannerIconWrap}>
                <Ionicons name="library-outline" size={16} color="#fef3c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetedSectionBannerKicker}>SCHOOL FURNITURE</Text>
                <Text style={styles.targetedSectionBannerText}>School furniture setup tips and layout ideas</Text>
                <Text style={styles.targetedSectionBannerSub}>Tap to open desks, storage and classroom essentials</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={18} color="#fef3c7" />
            </View>
          </TouchableOpacity>
          {SCHOOL_FURNITURE_ITEMS.map((item) => (
            <TouchableOpacity
              key={`${item.subCategory}-${item.text}`}
              style={styles.tipRow}
              onPress={() => openProducts(item.subCategory)}
              activeOpacity={0.92}
            >
              <Image source={item.image} style={styles.tipImage} resizeMode="cover" />
              <Ionicons name={item.icon} size={18} color="#f59e0b" />
              <Text style={styles.tipText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TipsToShopBannerCarousel onOpen={openProducts} />

        <View style={styles.section}>
          <SectionTitle icon="gift-outline" title="Gift-friendly picks" subtitle="Subcategories that work well as presents" />
          <View style={styles.giftWrap}>
            {GIFT_IDEAS.map((g, gi) => (
              <TouchableOpacity key={g.label} style={styles.giftCard} onPress={() => openProducts(g.sub)}>
                <Image
                  source={[IMG_PROMO_C, INDOOR_IMAGE, IMG_HOME_CATE, IMG_KIDS_CATE][gi % 4]}
                  style={styles.giftImage}
                  resizeMode="cover"
                />
                <Ionicons name="star-outline" size={15} color="#a855f7" />
                <Text style={styles.giftText}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.productPreviewSection]}>
          <SectionTitle icon="grid-outline" title="Featured products" />
          <View style={styles.productPreviewGrid}>
            {INDOOR_PLAY_PREVIEW_PRODUCTS.map((p, idx) => (
              <TouchableOpacity
                key={p.subCategory}
                style={[styles.productPreviewCard, idx % 2 === 1 && styles.productPreviewCardRight]}
                activeOpacity={0.92}
                onPress={() => openProducts(p.subCategory)}
                accessibilityRole="button"
                accessibilityLabel={p.title}
              >
                <Image source={p.image} style={styles.productPreviewImage} resizeMode="contain" />
                <Text style={styles.productPreviewTitle} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={styles.productPreviewSub} numberOfLines={2}>
                  {p.subCategory}
                </Text>
                <View style={styles.productPreviewRatingRow}>
                  <Ionicons name="star" size={13} color="#f59e0b" />
                  <Text style={styles.productPreviewRatingText}>
                    {p.rating.toFixed(1)} ({p.reviews})
                  </Text>
                </View>
                <View style={styles.productPreviewPriceRow}>
                  <Text style={styles.productPreviewPrice}>₹{p.price}</Text>
                  <Text style={styles.productPreviewMrp}>₹{p.mrp}</Text>
                </View>
                <View style={styles.productPreviewOpenPill}>
                  <Ionicons name="cart-outline" size={14} color="#ffffff" />
                  <Text style={styles.productPreviewOpenText}>Add to cart</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.allIndoorItemsBtn}
            activeOpacity={0.9}
            onPress={() => openProducts(ALL_INDOOR_PLAY_CATALOG)}
            accessibilityRole="button"
            accessibilityLabel="All Indoor Play Items"
          >
            <LinearGradient
              colors={["#0d9488", "#0f766e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.allIndoorItemsBtnInner}
            >
              <Ionicons name="apps-outline" size={18} color="#ecfeff" />
              <Text style={styles.allIndoorItemsBtnText}>All Indoor Play Items</Text>
              <Ionicons name="chevron-forward" size={18} color="#ecfeff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Fills space above overlay tab bar; white so no gray strip after last section */}
        <View style={[styles.scrollEndSpacer, { height: Math.max(insets.bottom + 58, 68) }]} />
      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
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
  header: {
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
  searchBoxTap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
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
  scroll: { flex: 1, backgroundColor: "#ffffff" },
  /** No flexGrow — avoids stretching content to fill the viewport. Bottom inset is scrollEndSpacer (white). */
  scrollContent: { flexGrow: 0, paddingBottom: 0 },
  scrollEndSpacer: {
    width: "100%",
    backgroundColor: "#ffffff",
  },

  hero: {
    marginHorizontal: 0,
    marginTop: 12,
    height: 248,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.45)",
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroFade: { ...StyleSheet.absoluteFillObject },
  heroBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(99, 102, 241, 0.85)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  heroContent: { position: "absolute", bottom: 14, left: 14, right: 14 },
  heroKicker: { fontSize: 11, fontWeight: "800", color: "#c4b5fd", textTransform: "uppercase", letterSpacing: 0.8 },
  heroTitle: { fontSize: 24, fontWeight: "900", color: "#fff", marginTop: 6 },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.94)", marginTop: 6, lineHeight: 18 },
  section: {
    marginTop: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.2)",
  },
  sectionAccentTeal: {
    borderColor: "rgba(45, 212, 191, 0.45)",
    backgroundColor: "#f0fdfa",
  },
  sectionAccentRose: {
    borderColor: "rgba(244, 114, 182, 0.45)",
    backgroundColor: "#fff1f2",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  sectionTitleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3e8ff",
    marginRight: 8,
    marginTop: 2,
  },
  sectionTitleTextWrap: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#1d324e" },
  sectionSubtitle: { marginTop: 2, fontSize: 11, color: "#64748b", fontWeight: "600" },
  dealStripSection: {
    marginTop: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.35)",
    overflow: "hidden",
  },
  dealStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  dealStripTitle: { fontSize: 15, fontWeight: "900", color: "#9d174d" },
  dealStripScroll: { flexDirection: "row", gap: 12, paddingHorizontal: 0, paddingBottom: 4 },
  dealStripCard: {
    width: 268,
    height: 132,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#1e293b",
    borderWidth: 0,
    borderRightWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.5)",
  },
  dealStripImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  dealStripFade: { ...StyleSheet.absoluteFillObject },
  dealStripTextBlock: { position: "absolute", left: 12, right: 12, bottom: 10 },
  dealStripHeadline: { color: "#fff", fontSize: 16, fontWeight: "900" },
  dealStripSub: { color: "rgba(255,255,255,0.92)", fontSize: 11, marginTop: 4, fontWeight: "600" },
  dealStripCta: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dealStripCtaText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  mainCategoriesSection: {
    marginTop: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#c4b5fd",
    backgroundColor: "transparent",
  },
  mainCategoriesHeaderBand: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderColor: "rgba(196, 181, 253, 0.45)",
  },
  mainCategoriesIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
    flexWrap: "wrap",
  },
  mainCategoriesIconPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.9)",
  },
  mainCategoriesIconText: { fontSize: 10, fontWeight: "800", color: "#334155" },
  mainCategoriesKicker: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  mainCategoriesHeading: { color: "#1d324e", fontSize: 21, fontWeight: "900" },
  mainCategoriesSub: {
    color: "#475569",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
    fontWeight: "600",
  },
  mainCatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 0,
    rowGap: 10,
  },
  mainCatCard: {
    width: "50%",
    height: 176,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
  },
  mainCatCardEmphasis: {
    borderColor: "rgba(253, 224, 71, 0.85)",
    borderWidth: 1.2,
  },
  mainCatCardImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  mainCatCardOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.28 },
  mainCatMediaArea: {
    height: 128,
    backgroundColor: "#ffffff",
  },
  mainCatEmphasisBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(253, 224, 71, 0.95)",
  },
  mainCatEmphasisBadgeText: {
    color: "#fef9c3",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  mainCatCardContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 10,
    paddingBottom: 12,
  },
  mainCatCardContentOutside: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  mainCatCardContentOutsideEmphasis: {
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.65)",
  },
  mainCatCardTitle: { color: "#fff", fontSize: 13, fontWeight: "900", lineHeight: 17 },
  mainCatCardTagline: { color: "rgba(255,255,255,0.9)", fontSize: 10, marginTop: 4, lineHeight: 14, fontWeight: "600" },
  mainCatShopPill: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#fde68a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  mainCatShopPillEmphasis: {
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    borderWidth: 1,
    borderColor: "rgba(253, 224, 71, 0.9)",
  },
  mainCatShopPillText: { fontSize: 10, fontWeight: "900", color: "#312e81" },
  mainCatShopPillTextEmphasis: { color: "#fef9c3" },
  eduMosaic: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 0,
    paddingHorizontal: 0,
  },
  eduMosaicCell: {
    width: "50%",
    borderRadius: 0,
    padding: 12,
    minHeight: 152,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.45)",
    justifyContent: "space-between",
  },
  eduMosaicThumb: {
    width: "100%",
    borderRadius: 0,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  eduMosaicCellA: {
    backgroundColor: "#ecfeff",
  },
  eduMosaicCellB: {
    backgroundColor: "#f0fdf4",
  },
  eduMosaicIndex: { fontSize: 10, fontWeight: "900", color: "#0f766e", opacity: 0.75 },
  eduMosaicTitle: { fontSize: 12, fontWeight: "800", color: "#134e4a", lineHeight: 16, marginTop: 4 },
  eduMosaicFoot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  eduMosaicCta: { fontSize: 11, fontWeight: "800", color: "#0f766e" },
  outlineBtn: {
    marginTop: 12,
    marginHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#14b8a6",
    backgroundColor: "#fff",
  },
  outlineBtnText: { fontSize: 12, fontWeight: "800", color: "#0f766e" },
  bannerWrap: { marginTop: 0, marginHorizontal: 0 },
  bannerCard: {
    borderRadius: 0,
    paddingVertical: 18,
    paddingHorizontal: 14,
    overflow: "hidden",
    minHeight: 156,
    justifyContent: "center",
  },
  bannerContent: { position: "relative", zIndex: 2 },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  bannerImageFade: { ...StyleSheet.absoluteFillObject },
  bannerGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.18)",
    right: -30,
    top: -40,
  },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  bannerSub: { color: "rgba(255,255,255,0.95)", fontSize: 12, marginTop: 6 },
  bannerCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  bannerCtaText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  storyWrap: { marginTop: 0, marginHorizontal: 0, gap: 0 },
  storyCard: {
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#c4b5fd",
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    minHeight: 144,
  },
  storyCardReverse: { flexDirection: "row-reverse" },
  storyMedia: {
    flex: 1,
    minHeight: 144,
    backgroundColor: "#e2e8f0",
  },
  storyImageFill: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  storyTextPanel: {
    flex: 1,
    minHeight: 144,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  storyEyebrow: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  storyTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 4 },
  storySub: { color: "rgba(255,255,255,0.95)", fontSize: 11, marginTop: 5, lineHeight: 16 },
  storyCta: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  storyCtaText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  hCarousel: { flexGrow: 0 },
  hCarouselContent: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
    paddingHorizontal: 0,
    paddingBottom: 4,
  },
  cardTall: {
    width: 148,
    height: 188,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    borderWidth: 0,
    borderRightWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.55)",
  },
  cardTallImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  cardTallFade: { ...StyleSheet.absoluteFillObject },
  cardTallText: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  dualFeatured: { flexDirection: "row", gap: 0 },
  dualCard: {
    flex: 1,
    height: 132,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    borderRightWidth: 1,
    borderColor: "#fda4af",
    backgroundColor: "#1e293b",
  },
  dualCardImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  dualCardFade: { ...StyleSheet.absoluteFillObject },
  dualCardTitle: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  ghostLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 14,
  },
  ghostLinkText: { fontSize: 12, fontWeight: "800", color: "#be185d" },
  furnitureRow: { flexDirection: "row", gap: 0 },
  furnitureCard: {
    flex: 1,
    borderRadius: 0,
    padding: 10,
    paddingBottom: 12,
    backgroundColor: "#f0f9ff",
    borderWidth: 0,
    borderRightWidth: 1,
    borderColor: "#bae6fd",
    alignItems: "center",
    overflow: "hidden",
  },
  furniturePhoto: {
    width: "100%",
    borderRadius: 0,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  furnitureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7dd3fc",
  },
  furnitureMetaRow: {
    marginTop: 4,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  furnitureTitle: { fontSize: 13, fontWeight: "900", color: "#0c4a6e", textAlign: "left" },
  furnitureHint: { marginTop: 4, fontSize: 10, fontWeight: "700", color: "#0369a1" },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  listThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  listRowText: { fontSize: 13, fontWeight: "800", color: "#1d324e" },
  listRowHint: { fontSize: 10, color: "#64748b", fontWeight: "600", marginTop: 2 },
  comboWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  targetedSectionBanner: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 118,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },
  targetedSectionBannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  targetedSectionBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  targetedSectionBannerInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  targetedSectionBannerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  targetedSectionBannerKicker: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  targetedSectionBannerText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 15,
  },
  targetedSectionBannerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  comboCard: { width: "50%", flexGrow: 0 },
  comboInner: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#fed7aa",
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    minHeight: 72,
  },
  comboText: { fontSize: 12, fontWeight: "800", color: "#9a3412" },
  comboSub: { fontSize: 9, color: "#c2410c", fontWeight: "600", marginTop: 4, lineHeight: 12 },
  challengeWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", rowGap: 0 },
  challengeCard: {
    width: "50%",
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  challengeEmoji: { fontSize: 14 },
  challengeText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#92400e" },
  tipsShopBannerSection: {
    marginTop: 0,
    marginHorizontal: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.35)",
    backgroundColor: "#0f172a",
  },
  tipsShopBannerHeader: { paddingVertical: 14, paddingHorizontal: 14 },
  tipsShopBannerHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tipsShopBannerEyebrow: {
    color: "rgba(253, 230, 138, 0.95)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  tipsShopBannerTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 4 },
  tipsShopBannerSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 6, fontWeight: "600", lineHeight: 16 },
  tipsShopBannerScroll: { width: "100%" },
  tipsShopBannerPage: { overflow: "hidden", backgroundColor: "#1e293b" },
  tipsShopBannerImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  tipsShopBannerFade: { ...StyleSheet.absoluteFillObject },
  tipsShopBannerAccentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  tipsShopBannerTextBlock: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 20 },
  tipsShopBannerSlideTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  tipsShopBannerSlideSub: { color: "rgba(255,255,255,0.92)", fontSize: 12, marginTop: 4, fontWeight: "600", lineHeight: 17 },
  tipsShopBannerCta: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  tipsShopBannerCtaText: { color: "#fde68a", fontSize: 12, fontWeight: "800" },
  tipsShopBannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#0f172a",
  },
  tipsShopBannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  tipsShopBannerDotActive: {
    width: 22,
    backgroundColor: "#fde68a",
  },
  tipRow: {
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 8,
  },
  tipImage: { width: 34, height: 34, borderRadius: 9 },
  tipText: { flex: 1, color: "#78350f", fontSize: 12, fontWeight: "700" },
  giftWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", rowGap: 0 },
  giftCard: {
    width: "50%",
    borderRadius: 0,
    backgroundColor: "#faf5ff",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#e9d5ff",
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
  },
  giftImage: { width: 24, height: 24, borderRadius: 8 },
  giftText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#6b21a8" },
  productPreviewSection: {
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },
  productPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    rowGap: 0,
  },
  productPreviewCard: {
    width: "50%",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 220,
  },
  productPreviewCardRight: { borderRightWidth: 0 },
  productPreviewImage: {
    width: "100%",
    height: 114,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  productPreviewTitle: {
    fontSize: 31 / 2,
    fontWeight: "900",
    color: "#1f2937",
    lineHeight: 20,
  },
  productPreviewSub: {
    marginTop: 2,
    fontSize: 15 / 1.25,
    color: "#4b5563",
    fontWeight: "700",
    lineHeight: 18,
  },
  productPreviewRatingRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productPreviewRatingText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "700",
  },
  productPreviewPriceRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  productPreviewPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  productPreviewMrp: {
    fontSize: 11,
    color: "#6b7280",
    textDecorationLine: "line-through",
  },
  productPreviewOpenPill: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "stretch",
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  productPreviewOpenText: { fontSize: 12, fontWeight: "800", color: "#ffffff" },
  allIndoorItemsBtn: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  allIndoorItemsBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  allIndoorItemsBtnText: { color: "#ecfeff", fontSize: 13, fontWeight: "900" },
});

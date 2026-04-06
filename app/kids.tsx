import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
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

/** Flat-top regular hexagon: compact width, moderate height (√3/2 × width). */
const HEX_W = 76;
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
      <SvgImage
        href={href}
        width={HEX_W}
        height={HEX_H}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />
      <Polygon points={pts} fill="none" stroke={HEX_STROKE_COLOR} strokeWidth={strokeW} />
    </Svg>
  );
}

const KIDS_IMAGE = require("../assets/MainCatImages/images/Kids.png");
const HEADER_FT_LOGO = require("../assets/MainCatImages/images/fntfav.png");

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

/** Model B: light storefront + horizontal rails (aligned with Men hub layout). */
const KIDS_CATEGORIES: KidsCategoryBlock[] = [
  {
    key: "boys",
    title: "Boys clothing",
    tag: "Play & school",
    icon: "shirt-outline",
    shopImage: require("../assets/images/kidscate.png"),
    railFrom: "#0c4a6e",
    railTo: "#0369a1",
    subs: [
      { id: "kb1", label: "T-Shirts", image: require("../assets/images/kidscate.png") },
      { id: "kb2", label: "Jeans", image: require("../assets/images/kidscate.png") },
      { id: "kb3", label: "Shirts", image: require("../assets/images/kidscate.png") },
      { id: "kb4", label: "Shorts", image: require("../assets/images/kidscate.png") },
    ],
  },
  {
    key: "girls",
    title: "Girls clothing",
    tag: "Dresses & more",
    icon: "heart-outline",
    shopImage: require("../assets/MainCatImages/images/Kids.png"),
    railFrom: "#be185d",
    railTo: "#db2777",
    subs: [
      { id: "kg1", label: "Frocks", image: require("../assets/MainCatImages/images/Kids.png") },
      { id: "kg2", label: "Tops", image: require("../assets/MainCatImages/images/Kids.png") },
      { id: "kg3", label: "Skirts", image: require("../assets/MainCatImages/images/Kids.png") },
      { id: "kg4", label: "Leggings", image: require("../assets/MainCatImages/images/Kids.png") },
    ],
  },
  {
    key: "infants",
    title: "Infant wear",
    tag: "Soft & snug",
    icon: "ribbon-outline",
    shopImage: require("../assets/images/kidscate.png"),
    railFrom: "#047857",
    railTo: "#059669",
    subs: [
      { id: "ki1", label: "Onesies", image: require("../assets/images/kidscate.png") },
      { id: "ki2", label: "Rompers", image: require("../assets/images/kidscate.png") },
      { id: "ki3", label: "Infant Sets", image: require("../assets/images/kidscate.png") },
      { id: "ki4", label: "Swaddles", image: require("../assets/images/kidscate.png") },
    ],
  },
  {
    key: "toys",
    title: "Kids Toys",
    tag: "Play & learn",
    icon: "game-controller-outline",
    shopImage: require("../assets/MainCatImages/images/Kids.png"),
    railFrom: "#7c3aed",
    railTo: "#8b5cf6",
    subs: [
      { id: "kty1", label: "Educational Toys", image: require("../assets/MainCatImages/images/Kids.png") },
      { id: "kty2", label: "Action Toys", image: require("../assets/MainCatImages/images/Kids.png") },
      { id: "kty3", label: "Soft Toys", image: require("../assets/MainCatImages/images/Kids.png") },
      { id: "kty4", label: "Puzzle Games", image: require("../assets/MainCatImages/images/Kids.png") },
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

const FC_STYLE_LAB: {
  key: string;
  step: string;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  grad: readonly [string, string];
}[] = [
  {
    key: "sl1",
    step: "01",
    title: "Colour edit",
    sub: "Palettes that pair clean",
    icon: "color-palette-outline",
    grad: ["#6366f1", "#4338ca"],
  },
  {
    key: "sl2",
    step: "02",
    title: "Fit finder",
    sub: "Cuts for your frame",
    icon: "body-outline",
    grad: ["#0ea5e9", "#0369a1"],
  },
  {
    key: "sl3",
    step: "03",
    title: "Fabric guide",
    sub: "Touch & drape decoded",
    icon: "shirt-outline",
    grad: ["#14b8a6", "#0f766e"],
  },
  {
    key: "sl4",
    step: "04",
    title: "Layering 101",
    sub: "Depth without bulk",
    icon: "layers-outline",
    grad: ["#a855f7", "#7e22ce"],
  },
  {
    key: "sl5",
    step: "05",
    title: "Shoe map",
    sub: "Finish every silhouette",
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
}[] = [
  {
    key: "se1",
    season: "Spring",
    title: "Light rompers",
    price: "From ₹499",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "se2",
    season: "Summer",
    title: "Cotton tees",
    price: "From ₹399",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "se3",
    season: "Monsoon",
    title: "Rain jackets",
    price: "From ₹799",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "se4",
    season: "Festive",
    title: "Lehenga sets",
    price: "From ₹1,299",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "se5",
    season: "Winter",
    title: "Cozy knits",
    price: "From ₹999",
    image: require("../assets/images/kidscate.png"),
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
  image: ImageSourcePropType;
}[] = [
  {
    key: "lk1",
    title: "Cartoon tee",
    likes: "18.2k",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "lk2",
    title: "Denim dungaree",
    likes: "14.6k",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "lk3",
    title: "Tutu skirt",
    likes: "11.3k",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "lk4",
    title: "Snuggle blanket",
    likes: "22.1k",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
];

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
    () => KIDS_CATEGORIES.find((c) => c.key === selectedKey) ?? KIDS_CATEGORIES[0],
    [selectedKey]
  );

  const allKidsSubItems = useMemo(
    () =>
      KIDS_CATEGORIES.flatMap((cat) =>
        cat.subs.map((s) => ({
          flatId: `${cat.key}-${s.id}`,
          label: s.label,
          image: (s.image ?? cat.shopImage) as ImageSourcePropType,
          deptKey: cat.key,
          deptTitle: cat.title,
          deptColor: cat.railTo,
        }))
      ),
    []
  );

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
    (subCategoryLabel: string) => {
      router.push({
        pathname: "/subcatProducts",
        params: {
          mainCat: "kidswear",
          subCategory: subCategoryLabel,
        },
      });
    },
    [router]
  );

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
        <LinearGradient
          colors={["transparent", hexToRgba("#ef7b1a", 0.07), "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.kidsHeaderAccentWash}
          pointerEvents="none"
        />
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
              <View style={styles.kidsLogoBrandDot} />
            </View>
          </TouchableOpacity>

          <View style={styles.kidsSearchPill}>
            <TouchableOpacity
              style={styles.kidsSearchMain}
              onPress={() => router.push("/search")}
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
              <Ionicons name="heart-outline" size={23} color="#c2410c" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.kidsHeaderIconHit}
              onPress={() => router.push("/cart")}
              accessibilityRole="button"
              accessibilityLabel="Cart"
            >
              <Ionicons name="bag-outline" size={23} color="#1d324e" />
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
          <View style={styles.heroTopStripe} />
          <Image source={KIDS_IMAGE} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(29,50,78,0.92)"]}
            style={styles.heroFade}
          />
          <View style={styles.heroSpotBadge}>
            <Text style={styles.heroSpotBadgeText}>Curated edit</Text>
          </View>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroKicker}>Kids fashion</Text>
            <Text style={styles.heroHead}>Shop the kids&apos; edit</Text>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>
                Pick a category — other departments stay hidden until you switch
              </Text>
            </View>
          </View>
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
              {KIDS_CATEGORIES.map((c) => {
                const selected = c.key === selectedKey;
                const clipId = `kidsHex-${c.key}`;
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
                {activeBlock.subs.map((s) => {
                  const tileImage = s.image ?? activeBlock.shopImage;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.railCard}
                      activeOpacity={0.88}
                      onPress={() => openKidsSubcategoryProducts(s.label)}
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

          {/* 6 — Shop all kids sub categories */}
          <KidsStoreSection>
            <KidsSectionHead
              accent="#64748b"
              title="Shop all sub categories"
              sub="Tap any type to open products"
              icon="apps-outline"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {allKidsSubItems.map((item) => (
                <TouchableOpacity
                  key={item.flatId}
                  style={[
                    styles.fcShopAllCard,
                    { borderColor: hexToRgba(item.deptColor, 0.35) },
                  ]}
                  activeOpacity={0.88}
                  onPress={() => openKidsSubcategoryProducts(item.label)}
                  accessibilityRole="button"
                  accessibilityLabel={`Shop ${item.label}`}
                >
                  <View style={styles.fcShopAllImgWrap}>
                    <Image source={item.image} style={styles.fcShopAllImg} resizeMode="cover" />
                  </View>
                  <Text style={styles.fcShopAllDept} numberOfLines={1}>
                    {item.deptTitle}
                  </Text>
                  <Text style={styles.fcShopAllLabel} numberOfLines={2}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </KidsStoreSection>

          {/* 7 — Style lab */}
          <KidsStoreSection>
            <KidsSectionHead
              accent="#06b6d4"
              title="Style lab"
              sub="Guides & tools (preview)"
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
                <LinearGradient
                  key={lab.key}
                  colors={[lab.grad[0], lab.grad[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fcLabCardGrad}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.22)", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.6 }}
                    style={styles.fcLabSheen}
                  />
                  <Text style={styles.fcLabStep}>{lab.step}</Text>
                  <View style={styles.fcLabIconRing}>
                    <Ionicons name={lab.icon} size={26} color="#ffffff" />
                  </View>
                  <Text style={styles.fcLabTitleLight}>{lab.title}</Text>
                  <Text style={styles.fcLabSubLight}>{lab.sub}</Text>
                  <View style={styles.fcLabFooter}>
                    <Text style={styles.fcLabTapHint}>Open guide</Text>
                    <Ionicons name="arrow-forward-circle" size={22} color="rgba(255,255,255,0.9)" />
                  </View>
                </LinearGradient>
              ))}
            </ScrollView>
          </KidsStoreSection>

          {/* 8 — Seasons (horizontal) */}
          <KidsStoreSection>
            <KidsSectionHead
              accent="#10b981"
              title="Shop by season"
              sub="Fresh picks for every climate"
              icon="leaf-outline"
              iconColor="#059669"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {FC_SEASONS.map((s) => (
                <View
                  key={s.key}
                  style={[
                    styles.fcSeasonCard,
                    { borderColor: hexToRgba(activeBlock.railTo, 0.2) },
                  ]}
                >
                  <View style={styles.fcSeasonImgBox}>
                    <Image source={s.image} style={styles.fcSeasonImg} resizeMode="cover" />
                    <View style={[styles.fcSeasonBadge, { backgroundColor: activeBlock.railTo }]}>
                      <Text style={styles.fcSeasonBadgeText}>{s.season}</Text>
                    </View>
                  </View>
                  <Text style={styles.fcSeasonTitle} numberOfLines={2}>
                    {s.title}
                  </Text>
                  <Text style={styles.fcSeasonPrice}>{s.price}</Text>
                </View>
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

          {/* 10 — More likes */}
          <KidsStoreSection>
            <KidsSectionHead
              accent="#ec4899"
              title="Most loved"
              sub="Community favourites right now"
              icon="heart"
              iconColor="#db2777"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fcRow}
              nestedScrollEnabled
            >
              {FC_LIKED.map((l) => (
                <View
                  key={l.key}
                  style={[
                    styles.fcLikeCard,
                    { borderColor: hexToRgba(activeBlock.railTo, 0.18) },
                  ]}
                >
                  <View style={styles.fcLikeImgWrap}>
                    <Image source={l.image} style={styles.fcLikeImg} resizeMode="cover" />
                    <View style={styles.fcLikeHeart}>
                      <Ionicons name="heart" size={14} color="#ffffff" />
                      <Text style={styles.fcLikeCount}>{l.likes}</Text>
                    </View>
                  </View>
                  <Text style={styles.fcLikeTitle} numberOfLines={2}>
                    {l.title}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </KidsStoreSection>
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
  kidsStickyHeader: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29, 50, 78, 0.05)",
  },
  kidsHeaderAccentWash: {
    ...StyleSheet.absoluteFillObject,
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
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  kidsLogoImage: {
    width: 36,
    height: 36,
  },
  kidsLogoBrandDot: {
    position: "absolute",
    right: 5,
    bottom: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef7b1a",
    borderWidth: 2,
    borderColor: "#ffffff",
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
    fontSize: 15,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTopStripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#ef7b1a",
    zIndex: 4,
  },
  heroSpotBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 3,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(239, 123, 26, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heroSpotBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTextBox: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#fdba74",
    textTransform: "uppercase",
  },
  heroHead: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 6,
  },
  heroPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f8fafc",
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
    height: 108,
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
    paddingVertical: 12,
    justifyContent: "center",
    minHeight: 72,
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
  fcShopAllCard: {
    width: 108,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    paddingBottom: 10,
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fcShopAllImgWrap: {
    height: 88,
    width: "100%",
    backgroundColor: "#e2e8f0",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
  },
  fcShopAllImg: {
    width: "100%",
    height: "100%",
  },
  fcShopAllDept: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  fcShopAllLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d324e",
    marginTop: 2,
    paddingHorizontal: 8,
    lineHeight: 14,
  },
  fcLabRow: {
    paddingHorizontal: 0,
    gap: 14,
    paddingBottom: 4,
    paddingTop: 2,
  },
  fcLabCardGrad: {
    width: 168,
    minHeight: 212,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  fcLabSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  fcLabStep: {
    position: "absolute",
    top: 14,
    right: 14,
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1,
  },
  fcLabIconRing: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  fcLabTitleLight: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  fcLabSubLight: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginTop: 6,
    lineHeight: 17,
  },
  fcLabFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.28)",
  },
  fcLabTapHint: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  fcSeasonCard: {
    width: 134,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    overflow: "hidden",
    paddingBottom: 10,
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  fcSeasonImgBox: {
    height: 124,
    width: "100%",
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  fcSeasonImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  fcSeasonBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fcSeasonBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  fcSeasonTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d324e",
    marginTop: 10,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  fcSeasonPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 4,
    paddingHorizontal: 10,
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
  fcLikeCard: {
    width: 148,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    overflow: "hidden",
    paddingBottom: 10,
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  fcLikeImgWrap: {
    height: 140,
    width: "100%",
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  fcLikeImg: {
    width: "100%",
    height: "100%",
  },
  fcLikeHeart: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(236,72,153,0.92)",
  },
  fcLikeCount: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  fcLikeTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d324e",
    marginTop: 10,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
});

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
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

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
const MAIN_CATEGORY_SHOWCASE: {
  title: string;
  tagline: string;
  image: number;
  overlay: [string, string];
}[] = [
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

const PRE_INDOOR_SUBS = ["Rocking Toys", "Slides"] as const;

const PRESCHOOL_FURNITURE_SUBS = ["Chairs", "Dustbins"] as const;

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

const PARENT_TIPS = [
  "Mix construction toys with sorting games for longer focus",
  "Rotate between active (slides) and calm (threading) play",
  "Keep preschool furniture at child height for independence",
  "Label dustbins with icons so clean-up feels like a game",
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

/** Every leaf + browse parent for one-tap shopping. */
const SHOP_ALL_CHIPS = [
  ...EDUCATIONAL_SUBS,
  ...PRE_INDOOR_SUBS,
  ...PRESCHOOL_FURNITURE_SUBS,
  ...BROWSE_ONLY_PARENTS,
] as const;

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
  image: number;
  overlay: [string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.mainCatCard} onPress={onPress} activeOpacity={0.92} accessibilityRole="button" accessibilityLabel={title}>
      <Image source={image} style={styles.mainCatCardImage} resizeMode="cover" />
      <LinearGradient colors={overlay} start={{ x: 0, y: 0.35 }} end={{ x: 0, y: 1 }} style={styles.mainCatCardOverlay} />
      <View style={styles.mainCatCardContent}>
        <View style={styles.mainCatRibbon}>
          <Text style={styles.mainCatRibbonText}>MAIN CATEGORY</Text>
        </View>
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
            <Text style={styles.heroSub}>
              Educational materials, pre-indoor play, preschool furniture — same categories as on the web store.
            </Text>
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
          <LinearGradient colors={["#4c1d95", "#7c3aed", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainCategoriesHeaderBand}>
            <Text style={styles.mainCategoriesKicker}>SHOP BY AISLE</Text>
            <Text style={styles.mainCategoriesHeading}>Main categories</Text>
            <Text style={styles.mainCategoriesSub}>
              The six Indoor Play departments — tap a card to open products and book your picks.
            </Text>
          </LinearGradient>
          <View style={styles.mainCatGrid}>
            {MAIN_CATEGORY_SHOWCASE.map((cat) => (
              <MainCategoryShowcaseCard
                key={cat.title}
                title={cat.title}
                tagline={cat.tagline}
                image={cat.image}
                overlay={cat.overlay}
                onPress={() => openProducts(cat.title)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.sectionAccentTeal]}>
          <SectionTitle icon="library-outline" title="Educational Materials" subtitle="Blocks, threading, linking & shape play" />
          <View style={styles.eduMosaic}>
            {EDUCATIONAL_SUBS.map((sub, i) => (
              <TouchableOpacity
                key={sub}
                style={[styles.eduMosaicCell, i % 2 === 0 ? styles.eduMosaicCellA : styles.eduMosaicCellB]}
                onPress={() => openProducts(sub)}
                activeOpacity={0.92}
              >
                <Image source={EDU_MOSAIC_THUMBS[i]} style={styles.eduMosaicThumb} resizeMode="cover" />
                <Text style={styles.eduMosaicIndex}>{String(i + 1).padStart(2, "0")}</Text>
                <Text style={styles.eduMosaicTitle} numberOfLines={3}>
                  {sub}
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

        <View style={styles.storyWrap}>
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

        <View style={[styles.section, styles.sectionAccentRose]}>
          <SectionTitle icon="barbell-outline" title="Pre Indoor Play Items" subtitle="Slides, rockers & active play" />
          <View style={styles.dualFeatured}>
            {PRE_INDOOR_SUBS.map((sub, idx) => (
              <TouchableOpacity key={sub} style={styles.dualCard} onPress={() => openProducts(sub)} activeOpacity={0.92}>
                <Image source={idx === 0 ? IMG_KIDS_CATE : IMG_SPORTS_BANNER} style={styles.dualCardImage} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(15,23,42,0.75)"]} style={styles.dualCardFade} />
                <Text style={styles.dualCardTitle}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.ghostLink} onPress={() => openProducts("Pre Indoor Play Items")}>
            <Text style={styles.ghostLinkText}>View entire Pre Indoor aisle</Text>
            <Ionicons name="chevron-forward" size={16} color="#be185d" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <SectionTitle icon="construct-outline" title="Preschool Furniture" subtitle="Chairs, bins & room helpers" />
          <View style={styles.furnitureRow}>
            {PRESCHOOL_FURNITURE_SUBS.map((sub) => (
              <TouchableOpacity key={sub} style={styles.furnitureCard} onPress={() => openProducts(sub)} activeOpacity={0.9}>
                <Image
                  source={sub === "Chairs" ? IMG_HOME_CATES : IMG_HOME_CATE}
                  style={styles.furniturePhoto}
                  resizeMode="cover"
                />
                <View style={styles.furnitureIconWrap}>
                  <Ionicons name={sub === "Chairs" ? "body-outline" : "trash-outline"} size={22} color="#0369a1" />
                </View>
                <Text style={styles.furnitureTitle}>{sub}</Text>
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

        <View style={styles.section}>
          <SectionTitle icon="git-compare-outline" title="Pair ideas" subtitle="Shop two complementary types" />
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

        <View style={styles.section}>
          <SectionTitle icon="color-wand-outline" title="Quick shortcuts" subtitle="One tap into a top subcategory" />
          <View style={styles.challengeWrap}>
            {QUICK_LINKS.map((q) => (
              <TouchableOpacity key={q.label} style={styles.challengeCard} onPress={() => openProducts(q.sub)}>
                <Text style={styles.challengeEmoji}>{q.emoji}</Text>
                <Text style={styles.challengeText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle icon="book-outline" title="Playroom tips" subtitle="Ideas that pair with our aisles" />
          {PARENT_TIPS.map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Image source={INDOOR_IMAGE} style={styles.tipImage} resizeMode="cover" />
              <Ionicons name="bulb-outline" size={18} color="#f59e0b" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
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

        <View style={styles.section}>
          <SectionTitle icon="bag-check-outline" title="Shop all Indoor Play" subtitle="Every subcategory & collection in one grid" />
          <View style={styles.shopAllWrap}>
            {SHOP_ALL_CHIPS.map((item) => (
              <TouchableOpacity key={item} style={styles.shopAllCard} onPress={() => openProducts(item)}>
                <Text style={styles.shopAllText} numberOfLines={2}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
    backgroundColor: "#fff",
  },
  mainCategoriesHeaderBand: { paddingVertical: 16, paddingHorizontal: 14 },
  mainCategoriesKicker: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  mainCategoriesHeading: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 6 },
  mainCategoriesSub: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
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
  mainCatCardImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  mainCatCardOverlay: { ...StyleSheet.absoluteFillObject },
  mainCatCardContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 10,
    paddingBottom: 12,
  },
  mainCatRibbon: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  mainCatRibbonText: { fontSize: 8, fontWeight: "900", color: "#5b21b6", letterSpacing: 0.6 },
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
  mainCatShopPillText: { fontSize: 10, fontWeight: "900", color: "#312e81" },
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
    height: 56,
    borderRadius: 0,
    marginBottom: 4,
    backgroundColor: "#e2e8f0",
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
    height: 76,
    borderRadius: 0,
    marginBottom: 8,
    backgroundColor: "#e0f2fe",
  },
  furnitureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7dd3fc",
  },
  furnitureTitle: { marginTop: 4, fontSize: 13, fontWeight: "900", color: "#0c4a6e", textAlign: "center" },
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
  shopAllWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", rowGap: 0 },
  shopAllCard: {
    width: "50%",
    borderRadius: 0,
    backgroundColor: "#ecfeff",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#a5f3fc",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  shopAllText: { fontSize: 11, fontWeight: "700", color: "#0f766e", lineHeight: 15 },
});

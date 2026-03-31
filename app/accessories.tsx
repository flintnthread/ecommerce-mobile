import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import { VideoView, useVideoPlayer } from "expo-video";

type TopCategory = {
  id: string;
  label: string;
  image: any;
};

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

const topCategories: TopCategory[] = [
  { id: "men", label: "MEN", image: require("../assets/images/menscate.png") },
  { id: "women", label: "WOMEN", image: require("../assets/images/womencate.png") },
  { id: "kids", label: "KIDS", image: require("../assets/images/kidscate.png") },
  {
    id: "beauty",
    label: "BEAUTY",
    image: require("../assets/images/accessoriescate.png"),
  },
  {
    id: "accessories",
    label: "ACCESSORIES",
    image: require("../assets/images/accessariescate.png"),
  },
];

const topCollectionItems: CollectionItem[] = [
  {
    id: "c1",
    title: "Everyday Elegance",
    subtitle: "Jewellery & charms",
    tag: "Top Rated",
    image: require("../assets/images/latest1.png"),
  },
  {
    id: "c2",
    title: "Signature Watches",
    subtitle: "Premium timepieces",
    tag: "New Drop",
    image: require("../assets/images/accessoriescate.png"),
  },
  {
    id: "c3",
    title: "Festive Handbags",
    subtitle: "Party-ready bags",
    tag: "Limited",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "c4",
    title: "Beauty Must-haves",
    subtitle: "Glow essentials",
    tag: "Trending",
    image: require("../assets/images/product6.png"),
  },
];

const womenAccessoriesItems: CollectionItem[] = [
  {
    id: "w1",
    title: "Elegant Earrings",
    subtitle: "Party & festive styles",
    tag: "Women",
    image: require("../assets/images/latest2.png"),
  },
  {
    id: "w2",
    title: "Chic Handbags",
    subtitle: "Daily carry picks",
    tag: "Women",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "w3",
    title: "Statement Watches",
    subtitle: "Classic and modern",
    tag: "Women",
    image: require("../assets/images/accessoriescate.png"),
  },
  {
    id: "w4",
    title: "Beauty Essentials",
    subtitle: "Glow-ready accessories",
    tag: "Women",
    image: require("../assets/images/product5.png"),
  },
];

const womenRelatedCategories: Record<string, string[]> = {
  w1: ["Stud Earrings", "Hoop Earrings", "Drop Earrings", "Pearl Sets"],
  w2: ["Tote Bags", "Sling Bags", "Clutches", "Shoulder Bags"],
  w3: ["Analog Watches", "Bracelet Watches", "Party Watches", "Casual Watches"],
  w4: ["Makeup Organizers", "Travel Pouches", "Beauty Tools", "Vanity Kits"],
};

const relatedCategoryImages: Record<string, any> = {
  "Stud Earrings": require("../assets/images/latest1.png"),
  "Hoop Earrings": require("../assets/images/latest2.png"),
  "Drop Earrings": require("../assets/images/latest3.png"),
  "Pearl Sets": require("../assets/images/latest4.png"),
  "Tote Bags": require("../assets/images/look3.png"),
  "Sling Bags": require("../assets/images/look4.png"),
  Clutches: require("../assets/images/product2.png"),
  "Shoulder Bags": require("../assets/images/product5.png"),
  "Analog Watches": require("../assets/images/accessoriescate.png"),
  "Bracelet Watches": require("../assets/images/product6.png"),
  "Party Watches": require("../assets/images/accessariescate.png"),
  "Casual Watches": require("../assets/images/look2.png"),
  "Makeup Organizers": require("../assets/images/homecate.png"),
  "Travel Pouches": require("../assets/images/product1.png"),
  "Beauty Tools": require("../assets/images/product3.png"),
  "Vanity Kits": require("../assets/images/product4.png"),
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
    title: "Classic Wallets",
    subtitle: "Daily carry essentials",
    tag: "Men",
    image: require("../assets/images/product1.png"),
  },
  {
    id: "m2",
    title: "Premium Belts",
    subtitle: "Formal and casual styles",
    tag: "Men",
    image: require("../assets/images/product6.png"),
  },
  {
    id: "m3",
    title: "Statement Watches",
    subtitle: "Bold and elegant timepieces",
    tag: "Men",
    image: require("../assets/images/accessoriescate.png"),
  },
  {
    id: "m4",
    title: "Sunglasses Edit",
    subtitle: "UV protection with style",
    tag: "Men",
    image: require("../assets/images/look2.png"),
  },
];

const menRelatedCategories: Record<string, string[]> = {
  m1: ["Bi-fold Wallets", "Leather Wallets", "Card Holders", "Travel Wallets"],
  m2: ["Formal Belts", "Casual Belts", "Reversible Belts", "Buckle Belts"],
  m3: ["Analog Watches", "Smart Watches", "Sport Watches", "Leather Strap Watches"],
  m4: ["Aviator Sunglasses", "Wayfarer Sunglasses", "Polarized Sunglasses", "Sport Shades"],
};

const menRelatedCategoryImages: Record<string, any> = {
  "Bi-fold Wallets": require("../assets/images/product1.png"),
  "Leather Wallets": require("../assets/images/product6.png"),
  "Card Holders": require("../assets/images/product2.png"),
  "Travel Wallets": require("../assets/images/product3.png"),
  "Formal Belts": require("../assets/images/product6.png"),
  "Casual Belts": require("../assets/images/look2.png"),
  "Reversible Belts": require("../assets/images/look3.png"),
  "Buckle Belts": require("../assets/images/product4.png"),
  "Analog Watches": require("../assets/images/accessoriescate.png"),
  "Smart Watches": require("../assets/images/accessariescate.png"),
  "Sport Watches": require("../assets/images/sportscate.png"),
  "Leather Strap Watches": require("../assets/images/product5.png"),
  "Aviator Sunglasses": require("../assets/images/look2.png"),
  "Wayfarer Sunglasses": require("../assets/images/look3.png"),
  "Polarized Sunglasses": require("../assets/images/look4.png"),
  "Sport Shades": require("../assets/images/sportscate.png"),
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
const KIDS_RELATED_LANE_IDS = ["k1", "k2", "k3", "k4"] as const;

function getKidsRelatedItemIdForCarouselIndex(index: number) {
  const safeIndex = ((index % KIDS_RELATED_LANE_IDS.length) + KIDS_RELATED_LANE_IDS.length) %
    KIDS_RELATED_LANE_IDS.length;
  return KIDS_RELATED_LANE_IDS[safeIndex];
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

const KIDS_YOU_ARE_QUOTE =
  "We create pieces that celebrate how you move, imagine, and shine — because growing up should still feel like fun.";

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
  "NEW DROP",
  "SIGNATURE",
  "LAYERED",
  "EVENING",
  "DAILY",
  "CURATED",
  "EXCLUSIVE",
] as const;

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
const WOMAN_YOU_ARE_CAROUSEL_PAD_LEFT = 8;
const WOMAN_YOU_ARE_CAROUSEL_PAD_RIGHT = 8;

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

export default function Accessories() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string | string[] }>();
  const { width: windowWidth } = useWindowDimensions();
  const [activeTopCategory, setActiveTopCategory] = useState("accessories");
  const [womenSectionY, setWomenSectionY] = useState(0);
  const [menSectionY, setMenSectionY] = useState(0);
  const [kidsYouAreSectionY, setKidsYouAreSectionY] = useState(0);
  const womenSectionYRef = useRef<number | null>(null);
  const menSectionYRef = useRef<number | null>(null);
  const kidsYouAreSectionYRef = useRef<number | null>(null);
  const [selectedWomenItemId, setSelectedWomenItemId] = useState("w1");
  const [selectedMenItemId, setSelectedMenItemId] = useState("m1");
  const [selectedKidsRelatedItemId, setSelectedKidsRelatedItemId] = useState(
    KIDS_RELATED_SECTION_ITEM_ID
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
  const sparkleFloat = useRef(new Animated.Value(0)).current;
  const tintPulse = useRef(new Animated.Value(0)).current;
  const lightSweepX = useRef(new Animated.Value(-260)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const bottomAdPlayer = useVideoPlayer(require("../assets/images/videobanner.mp4"), (player) => {
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
    setActiveTopCategory("kids");
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

    const sweepLoop = Animated.loop(
      Animated.timing(lightSweepX, {
        toValue: 460,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
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
    sweepLoop.start();
    ctaLoop.start();

    return () => {
      sparkleLoop.stop();
      tintLoop.stop();
      sweepLoop.stop();
      ctaLoop.stop();
    };
  }, [ctaPulse, lightSweepX, sparkleFloat, tintPulse]);

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

  const handleWomenItemPress = (itemId: string) => {
    setSelectedWomenItemId(itemId);
  };

  const handleMenItemPress = (itemId: string) => {
    setSelectedMenItemId(itemId);
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
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        removeClippedSubviews={false}
      >
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#69798c" />
            <TextInput
              placeholder="Search accessories"
              placeholderTextColor="#69798c"
              style={styles.searchInput}
            />
            <Ionicons name="camera-outline" size={20} color="#69798c" />
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="heart-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="bag-outline" size={23} color="#1d324e" />
            </TouchableOpacity>
          </View>
        </View>

        <ImageBackground
          source={require("../assets/images/freepik_0001.jpeg")}
          style={styles.topStrip}
          imageStyle={styles.topStripBgImage}
        >
         
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topStripContent}
          >
            {topCategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.topCategoryItem,
                  activeTopCategory === item.id && styles.topCategoryItemActive,
                ]}
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
                  if (item.id === "women") {
                    scrollToSectionY(womenSectionYRef.current ?? womenSectionY);
                  } else if (item.id === "men") {
                    scrollToSectionY(menSectionYRef.current ?? menSectionY);
                  } else if (item.id === "kids") {
                    scrollToSectionY(
                      kidsYouAreSectionYRef.current ?? kidsYouAreSectionY
                    );
                  }
                }}
              >
                <View
                  style={[
                    styles.topCategoryImageWrap,
                    activeTopCategory === item.id && styles.topCategoryImageWrapActive,
                  ]}
                >
                  <Image source={item.image} style={styles.topCategoryImage} resizeMode="cover" />
                </View>
                <Text
                  style={[
                    styles.topCategoryText,
                    activeTopCategory === item.id && styles.topCategoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ImageBackground>

        <View style={styles.heroSection}>
          <Image
            source={require("../assets/images/accessariescate.png")}
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
          <Animated.View
            style={[
              styles.heroLightSweep,
              {
                transform: [{ translateX: lightSweepX }, { rotate: "-18deg" }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heroSparkleOne,
              {
                opacity: sparkleFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 0.9],
                }),
                transform: [
                  {
                    translateY: sparkleFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heroSparkleTwo,
              {
                opacity: sparkleFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 0.35],
                }),
                transform: [
                  {
                    translateY: sparkleFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 10],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.heroSparkleThree,
              {
                opacity: sparkleFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 0.95],
                }),
                transform: [
                  {
                    translateX: sparkleFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 5],
                    }),
                  },
                ],
              },
            ]}
          />
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
          {/* <Text style={styles.glamTitle}>GLOW, GLAM & GAME ON</Text> */}
          <Text style={styles.glamSubtitle}>Festivities, but make it stylish</Text>
        </View>

        <View style={styles.tileSection}>
          <View style={styles.tileRow}>
            <TouchableOpacity style={[styles.tileCard, styles.leftTile]} activeOpacity={0.9}>
              <View style={styles.tileBadge}>
                <Text style={styles.tileBadgeText}>HOME GLOW</Text>
              </View>
              <Text style={styles.tileHeading}>Light up Home</Text>
              <Text style={styles.tileSubHeading}>Warm lamps and festive decor picks</Text>
              <Image
                source={require("../assets/images/homecate.png")}
                style={styles.tileImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tileCard, styles.rightTile]} activeOpacity={0.9}>
              <View style={styles.tileBadge}>
                <Text style={styles.tileBadgeText}>STYLE DROP</Text>
              </View>
              <Text style={styles.tileHeading}>Festive Glam</Text>
              <Text style={styles.tileSubHeading}>Statement accessories for celebrations</Text>
              <Image
                source={require("../assets/images/accessoriescate.png")}
                style={styles.tileImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.collectionSection}>
          <View style={styles.collectionHeader}>
            <View>
              <Text style={styles.collectionTitle}>Top Collection</Text>
              <Text style={styles.collectionSubtitle}>Accessories you will love</Text>
            </View>
            <TouchableOpacity style={styles.collectionViewAll}>
              <Text style={styles.collectionViewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.collectionFeaturedCard}
            activeOpacity={0.9}
            onPress={() => router.push("/productdetail")}
          >
            <Image
              source={topCollectionItems[0].image}
              style={styles.collectionFeaturedImage}
              resizeMode="cover"
            />
            <View style={styles.collectionFeaturedTag}>
              <Text style={styles.collectionFeaturedTagText}>{topCollectionItems[0].tag}</Text>
            </View>
            <View style={styles.collectionFeaturedOverlay}>
              <Text style={styles.collectionFeaturedTitle} numberOfLines={1}>
                {topCollectionItems[0].title}
              </Text>
              <Text style={styles.collectionFeaturedSubtitle} numberOfLines={1}>
                {topCollectionItems[0].subtitle}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.collectionMiniGrid}>
            {topCollectionItems.slice(1).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.collectionMiniCard}
                activeOpacity={0.9}
                onPress={() => router.push("/productdetail")}
              >
                <Image source={item.image} style={styles.collectionMiniImage} resizeMode="contain" />
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
          <View style={styles.videoAdHeader}>
            <Text style={styles.videoAdTitle}>Accessories Spotlight</Text>
            <Text style={styles.videoAdSubtitle}>Exclusive festive ad</Text>
          </View>
          <View style={[styles.videoAdCard, styles.videoAdCardSpotlight]}>
            <Image
              source={require("../assets/images/accessariescate.png")}
              style={styles.videoAdPlayer}
              resizeMode="cover"
            />
            <View style={styles.videoAdOverlay}>
              <Text style={styles.videoAdOverlayTitle}>Style the Season with Accessories</Text>
              <TouchableOpacity
                style={styles.videoAdButton}
                onPress={() => router.push("/productdetail")}
              >
                <Text style={styles.videoAdButtonText}>Shop the look</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <Text style={styles.womenTitle}>Women Accessories</Text>
              <Text style={styles.womenSubtitle}>Curated picks for her style</Text>
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
              <View style={styles.womenTag}>
                <Text style={styles.womenTagText}>{womenAccessoriesItems[0].tag}</Text>
              </View>
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
                <View style={styles.womenTag}>
                  <Text style={styles.womenTagText}>{womenAccessoriesItems[1].tag}</Text>
                </View>
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
                <View style={styles.womenTag}>
                  <Text style={styles.womenTagText}>{womenAccessoriesItems[2].tag}</Text>
                </View>
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
            <View style={styles.womenTag}>
              <Text style={styles.womenTagText}>{womenAccessoriesItems[3].tag}</Text>
            </View>
            <View style={styles.womenCardOverlay}>
              <Text style={styles.womenCardTitle} numberOfLines={1}>
                {womenAccessoriesItems[3].title}
              </Text>
              <Text style={styles.womenCardSubtitle} numberOfLines={1}>
                {womenAccessoriesItems[3].subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.womenRelatedSection}>
          <Text style={styles.womenRelatedTitle}>
            Related categories for{" "}
            {womenAccessoriesItems.find((item) => item.id === selectedWomenItemId)?.title ??
              "Women Accessories"}
          </Text>
          <View style={styles.womenRelatedChips}>
            {(womenRelatedCategories[selectedWomenItemId] || []).map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.womenRelatedChip}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.womenRelatedImageWrap}>
                  <Image
                    source={relatedCategoryImages[category] ?? require("../assets/images/accessoriescate.png")}
                    style={styles.womenRelatedImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.womenRelatedChipText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
            <Text style={styles.videoAdTitle}>Style Lab Ad</Text>
            <Text style={styles.videoAdSubtitle}>Watch and shop accessories</Text>
          </View>
          <View style={styles.videoAdCard}>
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
              <Text style={styles.menTitle}>Men Accessories</Text>
              <Text style={styles.menSubtitle}>Essentials curated for him</Text>
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
                <View style={styles.menTag}>
                  <Text style={styles.menTagText}>{item.tag}</Text>
                </View>
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
          <Text style={styles.menRelatedTitle}>
            Related categories for{" "}
            {menAccessoriesItems.find((item) => item.id === selectedMenItemId)?.title ??
              "Men Accessories"}
          </Text>
          <View style={styles.menRelatedChips}>
            {(menRelatedCategories[selectedMenItemId] || []).map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.menRelatedChip}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.menRelatedImageWrap}>
                  <Image
                    source={
                      menRelatedCategoryImages[category] ??
                      require("../assets/images/accessoriescate.png")
                    }
                    style={styles.menRelatedImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.menRelatedChipText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ImageBackground
          source={require("../assets/images/freepik_0001.jpeg")}
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

                      <View>
                        <Text style={styles.splitProductTitle} numberOfLines={2}>
                          {product.title}
                        </Text>

                        <View style={styles.splitProductRatingPill}>
                          <Ionicons name="star" size={11} color="#f6c795" />
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

                        <TouchableOpacity
                          style={styles.splitAddButton}
                          activeOpacity={0.88}
                          onPress={() => router.push("/productdetail")}
                        >
                          <Ionicons name="bag-add-outline" size={17} color="#f7fbf9" />
                          <Text style={styles.splitAddButtonText}>Add to Cart</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ImageBackground>

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
                <Text style={styles.womanYouAreMainOrange}>KIDS</Text>
                <Text style={styles.womanYouAreMainNavy}>YOU ARE</Text>
              </View>
              <View style={styles.womanYouAreQuoteCol}>
                <View style={styles.womanYouAreQuoteAccent} pointerEvents="none" />
                <Text style={styles.womanYouAreQuote}>{KIDS_YOU_ARE_QUOTE}</Text>
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
                const kidsLaneItemId = getKidsRelatedItemIdForCarouselIndex(index);
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
                                onPress={() => setSelectedKidsRelatedItemId(kidsLaneItemId)}
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
              Tear-off ideas · More in this kids lane for{" "}
              {kidsAccessoriesItems.find((item) => item.id === selectedKidsRelatedItemId)?.title ??
                "Kids Accessories"}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={styles.kidsRelatedScroll}
          >
            {(kidsRelatedCategories[selectedKidsRelatedItemId] || []).map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.kidsRelatedPill}
                activeOpacity={0.88}
                onPress={() => router.push("/productdetail")}
              >
                <View style={styles.kidsRelatedPillImageWrap}>
                  <Image
                    source={
                      kidsRelatedCategoryImages[category] ??
                      require("../assets/images/kidscate.png")
                    }
                    style={styles.kidsRelatedPillImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.kidsRelatedPillText} numberOfLines={2}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TabItem icon="home-outline" label="Home" onPress={() => router.push("/home")} />
        <TabItem icon="storefront-outline" label="Explore" onPress={() => router.push("/categories")} />
        <TabItem icon="pricetags-outline" label="TRNDin" onPress={() => router.push("/promote")} />
        <TabItem icon="grid-outline" label="Categories" onPress={() => router.push("/categories")} />
        <TabItem icon="person-outline" label="Account" onPress={() => router.push("/account")} />
      </View>
    </View>
  );
}

type TabItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
};

const TabItem = ({ icon, label, onPress }: TabItemProps) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color="#1d324e" />
    <Text style={styles.tabLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff4fb",
  },
  content: {
    paddingBottom: 90,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },
  searchBox: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1.0,
    borderColor: "#222125",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    color: "#1d324e",
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  topStrip: {
    backgroundColor: "#5B4B8A",
    paddingBottom: 10,
    paddingTop: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3b3a41",
  },
  topStripBgImage: {
    opacity: 0.22,
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
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  topCategoryItem: {
    width: 84,
    marginHorizontal: 5,
    borderRadius: 12,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  topCategoryItemActive: {
    backgroundColor: "transparent",
    borderColor: "#ffea00",
  },
  topCategoryImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e2e2",
  },
  topCategoryImageWrapActive: {
    borderColor: "#ffea00",
  },
  topCategoryImage: {
    width: "100%",
    height: "100%",
  },
  topCategoryText: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "700",
    color: "#d1d1d6",
    textAlign: "center",
  },
  topCategoryTextActive: {
    color: "#ffffff",
  },
  heroSection: {
    width: "100%",
    height: 500,
    position: "relative",
    backgroundColor: "#504f56",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(29,50,78,0.16)",
  },
  heroLightSweep: {
    position: "absolute",
    top: -60,
    left: -150,
    width: 140,
    height: 700,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroSparkleOne: {
    position: "absolute",
    top: 70,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(246,199,149,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  heroSparkleTwo: {
    position: "absolute",
    top: 140,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239,123,26,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  heroSparkleThree: {
    position: "absolute",
    top: 220,
    right: 75,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(121,65,28,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
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
    paddingBottom: 8,
    alignItems: "center",
  },
  glamTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1d324e",
    textAlign: "center",
  },
  glamSubtitle: {
    marginTop: 2,
    fontSize: 18,
    color: "#6c8494",
    textAlign: "center",
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
    width: "48.5%",
    minHeight: 240,
    borderRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 10,
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
  tileImage: {
    width: "100%",
    height: 130,
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
  collectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1d324e",
  },
  collectionSubtitle: {
    marginTop: 2,
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
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d5dbe7",
    backgroundColor: "#ffffff",
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
  },
  collectionFeaturedTitle: {
    color: "#f6c795",
    fontSize: 16,
    fontWeight: "800",
  },
  collectionFeaturedSubtitle: {
    marginTop: 2,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
    paddingHorizontal: 12,
  },
  videoAdTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#311b92",
  },
  videoAdSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#4a148c",
  },
  videoAdCard: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "#504f56",
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
    marginBottom: 12,
  },
  womenTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  womenTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#311b92",
  },
  womenSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#4a148c",
    fontWeight: "600",
  },
  womenViewAll: {
    backgroundColor: "#ef7b1a",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  womenTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#79411c",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  womenTagText: {
    color: "#f6c795",
    fontSize: 10,
    fontWeight: "800",
  },
  womenCardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29,50,78,0.78)",
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
    marginBottom: 10,
  },
  womenRelatedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  womenRelatedChip: {
    width: "25%",
    alignItems: "center",
    marginBottom: 12,
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
    marginBottom: 12,
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
    paddingLeft: 8,
    paddingRight: 8,
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
    marginBottom: 10,
  },
  menTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  menTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d324e",
  },
  menSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#5f6f8c",
    fontWeight: "600",
  },
  menViewAll: {
    backgroundColor: "#1d324e",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  menTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#0f766e",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  menTagText: {
    color: "#d1fae5",
    fontSize: 10,
    fontWeight: "800",
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
    marginBottom: 10,
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
    height: 364,
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
    justifyContent: "space-between",
  },
  splitProductImageStage: {
    height: 132,
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
    backgroundColor: "#1d324e",
    borderWidth: 1,
    borderColor: "#2d4a63",
  },
  splitProductRatingPillValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f7fbf9",
  },
  splitProductRatingPillCount: {
    fontSize: 9,
    fontWeight: "600",
    color: "#9eb5cc",
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
    marginTop: 10,
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
  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#69798c",
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#1d324e",
    fontWeight: "600",
  },
});

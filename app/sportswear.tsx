import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  Easing,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IMG_SPORTS_DEALS = require("../assets/images/sportswear.png");

const { height, width } = Dimensions.get("window");
const NOTEBOOK_MAX_W = width - 24;
/** Width of one diary “spread” (page | spiral | page) for horizontal paging */
const DIARY_SPREAD_W = NOTEBOOK_MAX_W - 20;
const HERO_GAP = 8;
const HERO_TOP_H = 148;
const HERO_BOTTOM_H = 132;
const SPECTRUM_SIDE_PADDING = 12;

/** Swap these `require(...)` paths when you add your own banner images. */
const IMG_HERO_WORKOUT = require("../assets/images/fntsportswear1.png");
const IMG_HERO_SOCCER = require("../assets/images/fntsportswear2.png");
const IMG_HERO_TENNIS = require("../assets/images/fntsportswear3.png");
const IMG_HERO = require("../assets/images/fntsportswear4.png");

const TOP_BANNER_SLIDES = [
  IMG_HERO_WORKOUT,
  IMG_HERO_SOCCER,
  IMG_HERO_TENNIS,
  IMG_HERO,
] as const;

const SPORTSWEAR_DEAL_CARDS: {
  id: string;
  title: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "1",
    title: "Sports footwear",
    image: require("../assets/images/SportsFootwear.png"),
  },
  {
    id: "2",
    title: "Women's sports wear",
    image: require("../assets/images/WomenSportsWear.png"),
  },
  {
    id: "3",
    title: "Men's sports wear",
    image: require("../assets/images/MenSportsWear.png"),
  },
  {
    id: "4",
    title: "Accessories",
    image: require("../assets/images/SportsAccessories.png"),
  },
 
];

// moon shape


  const data = [
  {
    id: "1",
    title: "Suede Bomber Jacket",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "2",
    title: "Casual Hoodie",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "3",
    title: "Denim Jacket",
    image: require("../assets/images/sports3.png"),
  },
];


// L shape data



const data2 = [
  {
    id: 1,
    bigImage: require('../assets/images/redsport2.png'),
    smallImage: require('../assets/images/whitesport.png'),
  },
  {
    id: 2,
    bigImage: require('../assets/images/greensport1.png'),
    smallImage: require('../assets/images/redsport2.png'),
  },
  {
    id: 3,
    bigImage: require('../assets/images/yellowsport3.png'),
    smallImage: require('../assets/images/whitesport4.png'),
  },
];

type PlaybookPageAssets = {
  topLeft: ImageSourcePropType;
  topRight: ImageSourcePropType;
  bottomLeft: ImageSourcePropType;
  bottomMini1: ImageSourcePropType;
  bottomMini2: ImageSourcePropType;
};

const DEFAULT_PAGE_BADGES: [string, string, string, string, string] = [
  "UP TO 30% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
];

/** Athlete's Playbook — editorial / campaign assets */
const DIARY_SPREADS: {
  left: PlaybookPageAssets;
  right: PlaybookPageAssets;
  leftBadges?: [string, string, string, string, string];
  rightBadges?: [string, string, string, string, string];
}[] = [
  {
    left: {
      topLeft: require("../assets/images/fntsportswear1.png"),
      topRight: require("../assets/images/fntsportswear2.png"),
      bottomLeft: require("../assets/images/newsports.jpeg"),
      bottomMini1: require("../assets/images/fntsportswear3.png"),
      bottomMini2: require("../assets/images/fntsportswear4.png"),
    },
    right: {
      topLeft: require("../assets/images/fntsportswear5.png"),
      topRight: require("../assets/images/fntsportswear6.png"),
      bottomLeft: require("../assets/images/newsports2.jpeg"),
      bottomMini1: require("../assets/images/fntsportswear2.png"),
      bottomMini2: require("../assets/images/fntsportswear1.png"),
    },
  },
  {
    left: {
      topLeft: require("../assets/images/fntsportswear3.png"),
      topRight: require("../assets/images/fntsportswear4.png"),
      bottomLeft: require("../assets/images/fntsportswear5.png"),
      bottomMini1: require("../assets/images/greensport1.png"),
      bottomMini2: require("../assets/images/redsport2.png"),
    },
    right: {
      topLeft: require("../assets/images/fntsportswear6.png"),
      topRight: require("../assets/images/newsports.jpeg"),
      bottomLeft: require("../assets/images/yellowsport2.png"),
      bottomMini1: require("../assets/images/blacksport2.png"),
      bottomMini2: require("../assets/images/whitesport2.png"),
    },
  },
];

// banner section

const SHOP_STORE_DATA = [
  {
    id: "1",
    title: "Print Store",
    image: require("../assets/images/sportsbanner1.png"),
  },
  {
    id: "2",
    title: "Giftables",
    image: require("../assets/images/sportsbanner2.png"),
  },
  {
    id: "3",
    title: "Summer Store",
    image: require("../assets/images/sportsbanner3.png"),
  },
  {
    id: "4",
    title: "Combo Packs",
    image: require("../assets/images/sportsbanner4.png"),
  },
];


// according to color pick up


const colorOptions = [
  { id: "black", color: "#000" },
  { id: "white", color: "#eee" },
  { id: "red", color: "#ff0000" },
  { id: "green", color: "#9acd32" },
  { id: "yellow", color: "#ffd700" },
];


// mens  sports section
const interests = [
  { name: "Mens Sports Wear", size: 170, img: require("../assets/images/sportsbanner1.png") },
  { name: "Cycling shoes", size: 120, img: require("../assets/images/sportsbanner2.png") },
  { name: "Hiking shoes", size: 90, img: require("../assets/images/sports3.png") },
  { name: "Running shoes", size: 90, img: require("../assets/images/sports4.png") },
  { name: "Sports sandals", size: 90, img: require("../assets/images/sports5.png") },
  { name: "Training shoes", size: 100, img: require("../assets/images/sports6.png") },
  { name: "Footwear", size: 80, img: require("../assets/images/sports7.png") },
  { name: "Sports wear", size: 80, img: require("../assets/images/sports8.png") },
];

// banner section

const banners = [
  require("../assets/images/sportsbanner1.png"),
  require("../assets/images/sportsbanner2.png"),
  require("../assets/images/sportsbanner5.png"),
  require("../assets/images/sportsbanner6.png"),
];

const LOOKBOOK_SCROLL_ITEMS: { id: string; image: ImageSourcePropType }[] =
  banners.map((img, index) => ({
    id: `lookbook-${index}`,
    image: img as ImageSourcePropType,
  }));

const ACCESSORIES_MASONRY_ITEMS: {
  id: string;
  name: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "acc1",
    name: "Bags & backpacks",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "acc2",
    name: "Caps & headwear",
    image: require("../assets/images/sports4.png"),
  },
  {
    id: "acc3",
    name: "Socks & essentials",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "acc4",
    name: "Training gear",
    image: require("../assets/images/sports3.png"),
  },
  {
    id: "acc5",
    name: "Bottles & kits",
    image: require("../assets/images/sports5.png"),
  },
  {
    id: "acc6",
    name: "Wrist & supports",
    image: require("../assets/images/sports6.png"),
  },
];

/** Accessory promo rail tiles (horizontal strip) */
const ACCESSORIES_ABOVE_PLAYBOOK_BANNERS: {
  id: string;
  tag: string;
  title: string;
  image: ImageSourcePropType;
  chrome: readonly [string, string, string];
}[] = [
  {
    id: "apb1",
    tag: "ESSENTIALS",
    title: "Caps & headwear",
    image: require("../assets/images/sports4.png"),
    chrome: ["#0f766e", "#115e59", "#134e4a"],
  },
  {
    id: "apb2",
    tag: "NEW",
    title: "Bottles & kits",
    image: require("../assets/images/sports5.png"),
    chrome: ["#7c3aed", "#5b21b6", "#4c1d95"],
  },
  {
    id: "apb3",
    tag: "GEAR UP",
    title: "Socks & layers",
    image: require("../assets/images/sports1.png"),
    chrome: ["#ea580c", "#c2410c", "#9a3412"],
  },
];

const MENS_SPORTSWEAR_SCROLL_CARDS: {
  id: string;
  title: string;
  image: ReturnType<typeof require>;
  offer: string;
}[] = [
  {
    id: "m1",
    title: "Tops, T shirts & Shirts",
    image: require("../assets/images/greensport1.png"),
    offer: "MIN. 60% OFF*",
  },
  {
    id: "m2",
    title: "Jeans",
    image: require("../assets/images/yellowsport2.png"),
    offer: "MIN. 60% OFF*",
  },
  {
    id: "m3",
    title: "Trousers",
    image: require("../assets/images/whitesport2.png"),
    offer: "MIN. 65% OFF*",
  },
];

const SPORTSWEAR_SPECTRUM_ITEMS: {
  id: string;
  label: string;
  image: ReturnType<typeof require>;
}[] = [
  { id: "spc1", label: "Black", image: require("../assets/images/blacksport2.png") },
  { id: "spc2", label: "Blue", image: require("../assets/images/sports4.png") },
  { id: "spc3", label: "Green", image: require("../assets/images/greensport2.png") },
  { id: "spc4", label: "Red", image: require("../assets/images/redsport2.png") },
  { id: "spc5", label: "Yellow", image: require("../assets/images/yellowsport2.png") },
  { id: "spc6", label: "White", image: require("../assets/images/whitesport2.png") },
];

const WHATS_MOVING_ITEMS: {
  id: string;
  title: string;
  offer: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "wm1",
    title: "Running shoes",
    offer: "UP TO 40% OFF*",
    image: require("../assets/images/sports6.png"),
  },
  {
    id: "wm2",
    title: "Gym wear",
    offer: "UP TO 55% OFF*",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "wm3",
    title: "Sports jackets",
    offer: "UP TO 50% OFF*",
    image: require("../assets/images/greensport1.png"),
  },
  {
    id: "wm4",
    title: "Training tees",
    offer: "UP TO 60% OFF*",
    image: require("../assets/images/redsport2.png"),
  },
  {
    id: "wm5",
    title: "Shorts",
    offer: "UP TO 35% OFF*",
    image: require("../assets/images/yellowsport2.png"),
  },
  {
    id: "wm6",
    title: "Socks & gear",
    offer: "UP TO 30% OFF*",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "wm7",
    title: "Bags",
    offer: "MIN. 40% OFF*",
    image: require("../assets/images/sports5.png"),
  },
  {
    id: "wm8",
    title: "Accessories",
    offer: "UP TO 45% OFF*",
    image: require("../assets/images/sports4.png"),
  },
  {
    id: "wm9",
    title: "Sports bottles",
    offer: "UP TO 40% OFF*",
    image: require("../assets/images/sports4.png"),
  },
  {
    id: "wm10",
    title: "Track pants",
    offer: "UP TO 55% OFF*",
    image: require("../assets/images/sports3.png"),
  },
  {
    id: "wm11",
    title: "Gym bags",
    offer: "MIN. 40% OFF*",
    image: require("../assets/images/sports5.png"),
  },
  {
    id: "wm12",
    title: "Caps & headwear",
    offer: "UP TO 35% OFF*",
    image: require("../assets/images/sports1.png"),
  },
];

const SPOTLIGHT_CARDS: {
  id: string;
  title: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "sp1",
    title: "Running Essentials",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "sp2",
    title: "Gym Wear",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "sp3",
    title: "Shoes & Sneakers",
    image: require("../assets/images/sports3.png"),
  },
  {
    id: "sp4",
    title: "Accessories",
    image: require("../assets/images/sports4.png"),
  },
];

/** Wide + strip tiles — shown above the SPORTS FOOTWEAR spotlight */
const FOOTWEAR_PROMO_STRIP: {
  id: string;
  tag: string;
  label: string;
  image: ImageSourcePropType;
  chrome: readonly [string, string, string];
}[] = [
  {
    id: "fpr1",
    tag: "RUN",
    label: "Road runners",
    image: require("../assets/images/sports6.png"),
    chrome: ["#dc2626", "#b91c1c", "#991b1b"],
  },
  {
    id: "fpr2",
    tag: "GYM",
    label: "Training kicks",
    image: require("../assets/images/sports7.png"),
    chrome: ["#2563eb", "#1d4ed8", "#1e40af"],
  },
  {
    id: "fpr3",
    tag: "COURT",
    label: "Court & turf",
    image: require("../assets/images/sports3.png"),
    chrome: ["#059669", "#047857", "#065f46"],
  },
  {
    id: "fpr4",
    tag: "HIKE",
    label: "Trail ready",
    image: require("../assets/images/sports4.png"),
    chrome: ["#d97706", "#b45309", "#92400e"],
  },
];

const FOOTWEAR_PROMO_RAIL_CARD_WIDTH = 132;
const FOOTWEAR_PROMO_RAIL_GAP = 12;
const FOOTWEAR_PROMO_RAIL_STRIDE =
  FOOTWEAR_PROMO_RAIL_CARD_WIDTH + FOOTWEAR_PROMO_RAIL_GAP;

const PRODUCTS_TO_BUY: {
  id: string;
  name: string;
  price: string;
  mrp?: string;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "ptb1",
    name: "Training Shoes — cushioned sole",
    price: "₹2,499",
    mrp: "₹3,499",
    discountPercent: 29,
    rating: 4.3,
    reviewCount: 216,
    image: require("../assets/images/sports6.png"),
  },
  {
    id: "ptb2",
    name: "Gym T-shirt quick-dry",
    price: "₹799",
    mrp: "₹1,099",
    discountPercent: 27,
    rating: 4.1,
    reviewCount: 89,
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "ptb3",
    name: "Running Shorts lightweight",
    price: "₹999",
    mrp: "₹1,299",
    discountPercent: 23,
    rating: 0,
    reviewCount: 0,
    image: require("../assets/images/sports3.png"),
  },
  {
    id: "ptb4",
    name: "Sports Bottle 750ml",
    price: "₹399",
    mrp: "₹549",
    discountPercent: 27,
    rating: 4.7,
    reviewCount: 340,
    image: require("../assets/images/sports4.png"),
  },
];

/** Products to buy — 2 columns; section horizontal padding 16 + gap between cells */
const PTB_GRID_GAP = 12;
const PTB_GRID_COL_W = Math.floor((width - 32 - PTB_GRID_GAP) / 2);

const imagesByColor = {
  black: [
    require("../assets/images/blacksport2.png"),
    require("../assets/images/blacksport2.png"),
    require("../assets/images/blacksport2.png"),
  ],
  white: [
    require("../assets/images/whitesport4.png"),
    require("../assets/images/whitesport2.png"),
    require("../assets/images/whitesport3.png"),
  ],
  red: [
    require("../assets/images/redsport1.png"),
    require("../assets/images/redsport2.png"),
    require("../assets/images/redsport3.png"),
  ],
  green: [
    require("../assets/images/greensport1.png"),
    require("../assets/images/greensport2.png"),
    require("../assets/images/greensport3.png"),
  ],
  yellow: [
    require("../assets/images/yellowsport1.png"),
    require("../assets/images/yellowsport2.png"),
    require("../assets/images/yellowsport3.png"),
  ],

  
};

function ArcText({
  text,
  radius,
  textStyle,
}: {
  text: string;
  radius: number;
  textStyle?: object;
}) {
  const chars = text.split("");
  const start = -Math.PI; // left
  const end = 0; // right
  const denom = Math.max(1, chars.length - 1);
  return (
    <View style={[styles.arcTextFull, { width: radius * 2, height: radius * 2 }]}>
      {chars.map((ch, i) => {
        const t = i / denom;
        const ang = start + t * (end - start);
        const x = radius + radius * Math.cos(ang);
        const y = radius + radius * Math.sin(ang);
        const rotate = `${(ang + Math.PI / 2) * (180 / Math.PI)}deg`;
        return (
          <View
            key={`${ch}-${i}`}
            style={[
              styles.arcChar,
              {
                transform: [
                  { translateX: x },
                  { translateY: y },
                  { rotate },
                ],
              },
            ]}
          >
            <Text style={[styles.arcCharText, textStyle]}>{ch}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Center spine + mirrored C-hooks (coil through the gutter) */
function SpiralBindColumn() {
  const rings = 20;
  return (
    <View style={styles.spiralBindOuter} accessibilityLabel="Spiral binding">
      <View style={styles.spiralBindCenterBar} pointerEvents="none" />
      {Array.from({ length: rings }, (_, i) => (
        <View key={i} style={styles.spiralBindRow}>
          <View
            style={[
              styles.spiralBindHook,
              i % 2 === 1 ? styles.spiralBindHookMirror : null,
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function PlaybookPageGrid({
  page,
  badges,
  onShop,
}: {
  page: PlaybookPageAssets;
  badges: [string, string, string, string, string];
  onShop: () => void;
}) {
  return (
    <View style={styles.playbookPage}>
      <View style={styles.pbRowTop}>
        <TouchableOpacity
          style={styles.pbTopFull}
          activeOpacity={0.9}
          onPress={onShop}
        >
          <Image
            source={page.topLeft}
            style={styles.pbCardImg}
            resizeMode="cover"
          />
          <View style={styles.pbCardFooter}>
            <Text style={styles.pbBadge} numberOfLines={2}>
              {badges[0]}
            </Text>
            <View style={styles.pbShopBtn}>
              <Text style={styles.pbShopBtnText}>Shop now</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.pbRowBottom}>
        <TouchableOpacity
          style={styles.pbBottomFull}
          activeOpacity={0.9}
          onPress={onShop}
        >
          <Image
            source={page.bottomLeft}
            style={styles.pbCardImg}
            resizeMode="cover"
          />
          <View style={[styles.pbCardFooter, styles.pbCardFooterDark]}>
            <Text style={[styles.pbBadge, styles.pbBadgeOnDark]} numberOfLines={2}>
              {badges[2]}
            </Text>
            <View style={styles.pbShopBtnLight}>
              <Text style={styles.pbShopBtnTextDark}>Shop now</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SportswearGlassDealCard({
  title,
  image,
  onOpen,
  onBag,
  onDetail,
  index,
  scrollY,
  anchorY,
}: {
  title: string;
  image: ReturnType<typeof require>;
  onOpen: () => void;
  onBag: () => void;
  onDetail: () => void;
  index: number;
  scrollY: Animated.Value;
  anchorY: number;
}) {
  // Zig-zag while scrolling:
  // - a subtle "wobble" around the card's anchor position
  // - plus a small entrance slide so it feels dynamic when it first appears
  const dir = index % 2 === 0 ? -1 : 1;

  // As the user scrolls through this card's vertical region,
  // move it left→right→left (or right→left→right) for a strong "sweep" effect.
  const sweepRange = 520;
  const sweep = scrollY.interpolate({
    inputRange: [
      Math.max(0, anchorY - sweepRange),
      Math.max(0, anchorY),
      Math.max(0, anchorY + sweepRange),
    ],
    outputRange: [dir * 140, dir * -140, dir * 140],
    extrapolate: "clamp",
  });

  // Fade-in as it enters viewport
  const fadeStart = Math.max(0, anchorY - height * 0.9);
  const fadeEnd = Math.max(0, anchorY - height * 0.55);
  const opacity = scrollY.interpolate({
    inputRange: [fadeStart, fadeEnd],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const translateX = sweep;

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <TouchableOpacity
        style={styles.glassDealCard}
        activeOpacity={0.95}
        onPress={onOpen}
      >
        <ImageBackground
          source={image}
          style={styles.glassDealBg}
          imageStyle={styles.glassDealBgImage}
          resizeMode="cover"
        >
          <View style={styles.glassDealTopRow}>
            <View style={styles.glassDealTopSpacer} />
          </View>

          <View style={styles.glassDealMiddle} />

          <View style={styles.glassDealBar}>
            <View style={styles.glassDealBarBlur} />
            <View style={styles.glassDealBarInner}>
              <Text style={styles.glassDealTitle} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SportsWearSection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [playbookPage, setPlaybookPage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("white");
  const topBannerRef = useRef<ScrollView>(null);
  const [topBannerIndex, setTopBannerIndex] = useState(0);
  const [activeBannerShortcut, setActiveBannerShortcut] = useState<
    "footwear" | "women" | "men" | "accessories" | null
  >(null);
  const rootScrollY = useRef(new Animated.Value(0)).current;
  const [browseCardYs, setBrowseCardYs] = useState<number[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const productsToBuyRef = useRef<View>(null);
  const productsToBuyY = useRef(0);
  const spotlightFootwearY = useRef(0);
  const shopByStoreY = useRef(0);
  const mensInterestY = useRef(0);
  const mensSportsWearY = useRef(0);
  const athletesPlaybookY = useRef(0);
  /** "Accessories worth the hype" promo block (mosaic + rail) */
  const accessoriesWorthHypeY = useRef(0);
  const playbookScrollRef = useRef<ScrollView>(null);

  const lookbookScales = useRef(banners.map(() => new Animated.Value(1)));

  const openCamera = useCallback(() => {
    Alert.alert(
      "Camera access",
      "Allow camera access to take photos?",
      [
        { text: "Don't allow", style: "cancel" },
        { text: "Allow", onPress: () => router.push("/camerasearch") },
      ]
    );
  }, [router]);

  const goShop = useCallback(() => {
    router.push("/products");
  }, [router]);

  const goSubcatProducts = useCallback(() => {
    router.push("/subcatProducts" as Href);
  }, [router]);

  const scrollToSpotlightFootwear = useCallback(() => {
    scrollRef.current?.scrollTo({ y: spotlightFootwearY.current, animated: true });
  }, []);

  const scrollToShopByStore = useCallback(() => {
    scrollRef.current?.scrollTo({ y: shopByStoreY.current, animated: true });
  }, []);

  const scrollToMensInterest = useCallback(() => {
    scrollRef.current?.scrollTo({ y: mensInterestY.current, animated: true });
  }, []);

  const scrollToMensSportsWear = useCallback(() => {
    scrollRef.current?.scrollTo({ y: mensSportsWearY.current, animated: true });
  }, []);

  const scrollToAccessoriesWorthTheHype = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, accessoriesWorthHypeY.current - 16),
      animated: true,
    });
  }, []);

  const movingGridScrollRef = useRef<ScrollView>(null);
  const [movingGridPage, setMovingGridPage] = useState(0);

  const footwearPromoScrollRef = useRef<ScrollView>(null);
  const footwearPromoBannerIndexRef = useRef(0);

  const rotateAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 12000,
      useNativeDriver: true,
    })
  ).start();
}, []);

const rotate = rotateAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ["0deg", "360deg"],
});

  const movingPages = useMemo(() => {
    const out: typeof WHATS_MOVING_ITEMS[] = [];
    for (let i = 0; i < WHATS_MOVING_ITEMS.length; i += 6) {
      out.push(WHATS_MOVING_ITEMS.slice(i, i + 6));
    }
    return out.length ? out : [WHATS_MOVING_ITEMS];
  }, []);

  useEffect(() => {
    const n = movingPages.length;
    if (n <= 1) return undefined;
    const interval = setInterval(() => {
      setMovingGridPage((prev) => {
        const next = (prev + 1) % n;
        movingGridScrollRef.current?.scrollTo({
          x: next * width,
          y: 0,
          animated: true,
        });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [movingPages.length]);

  const womensCardScale1 = useRef(new Animated.Value(1)).current;
  const womensCardScale2 = useRef(new Animated.Value(1)).current;
  const womensCardScale3 = useRef(new Animated.Value(1)).current;

  const pressIn = (v: Animated.Value) => {
    Animated.spring(v, {
      toValue: 1.06,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };
  const pressOut = (v: Animated.Value) => {
    Animated.spring(v, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  useEffect(() => {
    const n = DIARY_SPREADS.length;
    if (n <= 1) return undefined;
    const interval = setInterval(() => {
      setPlaybookPage((prev) => {
        const next = (prev + 1) % n;
        playbookScrollRef.current?.scrollTo({
          x: next * DIARY_SPREAD_W,
          animated: true,
        });
        return next;
      });
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const n = TOP_BANNER_SLIDES.length;
    if (n <= 1) return undefined;

    const interval = setInterval(() => {
      setTopBannerIndex((prev) => {
        const next = (prev + 1) % n;
        topBannerRef.current?.scrollTo({ x: next * width, y: 0, animated: true });
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const n = FOOTWEAR_PROMO_STRIP.length;
    if (n <= 1) return undefined;
    const interval = setInterval(() => {
      const prev = footwearPromoBannerIndexRef.current;
      const next = (prev + 1) % n;
      footwearPromoBannerIndexRef.current = next;
      footwearPromoScrollRef.current?.scrollTo({
        x: next * FOOTWEAR_PROMO_RAIL_STRIDE,
        y: 0,
        animated: true,
      });
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
    <Animated.ScrollView
      ref={scrollRef as any}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: rootScrollY } } }],
        { useNativeDriver: true }
      )}
    >
      {/* HEADER */}
      <View style={[styles.header, { marginTop: insets.top + 6 }]}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            placeholder="Search sports wear..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={openCamera}
            style={styles.searchBarIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Open camera"
          >
            <Ionicons name="camera-outline" size={22} color="#777" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/wishlist")}
        >
          <Ionicons name="heart-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/cart")}
        >
          <Ionicons name="cart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

    <View style={styles.bannerContainer}>
      <ScrollView
        ref={topBannerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setTopBannerIndex(Math.max(0, Math.min(page, TOP_BANNER_SLIDES.length - 1)));
        }}
        style={styles.topBannerScroll}
      >
        {TOP_BANNER_SLIDES.map((src, idx) => (
          <Image
            key={`top-banner-${idx}`}
            source={src}
            style={styles.topBannerSlide}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* top category buttons on banner */}
      <View style={styles.bannerShortcutDock}>
        <View style={styles.bannerShortcutGrid}>
          <TouchableOpacity
            style={[
              styles.bannerShortcutTile,
              activeBannerShortcut === "footwear" && styles.bannerShortcutTileActive,
            ]}
            activeOpacity={0.9}
            onPress={() => {
              setActiveBannerShortcut("footwear");
              scrollToSpotlightFootwear();
            }}
          >
            <Ionicons name="walk-outline" size={18} color="#111" />
            <Text style={styles.bannerShortcutTileText}>Footwear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bannerShortcutTile,
              activeBannerShortcut === "women" && styles.bannerShortcutTileActive,
            ]}
            activeOpacity={0.9}
            onPress={() => {
              setActiveBannerShortcut("women");
              scrollToShopByStore();
            }}
          >
            <Ionicons name="flower-outline" size={18} color="#111" />
            <Text style={styles.bannerShortcutTileText}>Women</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bannerShortcutTile,
              activeBannerShortcut === "men" && styles.bannerShortcutTileActive,
            ]}
            activeOpacity={0.9}
            onPress={() => {
              setActiveBannerShortcut("men");
              scrollToMensSportsWear();
            }}
          >
            <Ionicons name="flash-outline" size={18} color="#111" />
            <Text style={styles.bannerShortcutTileText}>Men</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bannerShortcutTile,
              activeBannerShortcut === "accessories" && styles.bannerShortcutTileActive,
            ]}
            activeOpacity={0.9}
            onPress={() => {
              setActiveBannerShortcut("accessories");
              scrollToAccessoriesWorthTheHype();
            }}
          >
            <Ionicons name="bag-handle-outline" size={18} color="#111" />
            <Text style={styles.bannerShortcutTileText}>Accessories</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.topBannerDots}>
        {TOP_BANNER_SLIDES.map((_, idx) => (
          <View
            key={`top-banner-dot-${idx}`}
            style={[styles.topBannerDot, idx === topBannerIndex && styles.topBannerDotActive]}
          />
        ))}
      </View>
    </View>


      

      {/* SHOP BY CATEGORY */}
      <LinearGradient
        colors={["#120810", "#5c1f33", "#7c2d6e", "#1e1b4b"]}
        locations={[0, 0.28, 0.58, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.glassDealsSection}
      >
        <LinearGradient
          colors={["#34d399", "#38bdf8", "#e879f9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.glassDealsSectionRibbon}
        />
        <Text style={styles.glassDealsSectionTitle}>Browse Collections</Text>
        {SPORTSWEAR_DEAL_CARDS.map((item, index) => (
          <View
            key={item.id}
            onLayout={(e) => {
              const y = e.nativeEvent.layout.y;
              setBrowseCardYs((prev) => {
                if (prev[index] === y) return prev;
                const next = prev.slice();
                next[index] = y;
                return next;
              });
            }}
          >
            <SportswearGlassDealCard
              title={item.title}
              image={item.image}
              index={index}
              scrollY={rootScrollY}
              anchorY={browseCardYs[index] ?? 0}
              onOpen={
                item.id === "1"
                  ? scrollToSpotlightFootwear
                  : item.id === "2"
                  ? scrollToShopByStore
                  : item.id === "3"
                  ? scrollToMensSportsWear
                  : item.id === "4"
                  ? scrollToAccessoriesWorthTheHype
                  : goShop
              }
              onBag={() => router.push("/cart")}
              onDetail={
                item.id === "1"
                  ? scrollToSpotlightFootwear
                  : item.id === "2"
                  ? scrollToShopByStore
                  : item.id === "3"
                  ? scrollToMensSportsWear
                  : item.id === "4"
                  ? scrollToAccessoriesWorthTheHype
                  : goShop
              }
            />
          </View>
        ))}
      </LinearGradient>

      <View style={{ height: 25 }} />
  


      {/* POWER PICKS */}
      <View style={styles.powerSection}>
        <View style={styles.powerHeader}>
          <View>
            <Text style={styles.powerEyebrow}>Limited-time</Text>
            <Text style={styles.powerTitle}>Power Picks</Text>
            <Text style={styles.powerSubTitle}>Handpicked deals in sportswear.</Text>
          </View>
          <TouchableOpacity
            style={styles.powerSeeAllBtn}
            activeOpacity={0.9}
            onPress={goShop}
            accessibilityRole="button"
            accessibilityLabel="See all power picks"
          >
            <Text style={styles.powerSeeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.powerGrid}>
          {[
            {
              id: "pp1",
              img: require("../assets/images/fntsportswear2.png"),
              label: "NEW DROP",
              offer: "UP TO 40% OFF",
            },
            {
              id: "pp2",
              img: require("../assets/images/fntsportswear4.png"),
              label: "BEST DEALS",
              offer: "EXTRA 10% OFF",
            },
            {
              id: "pp3",
              img: require("../assets/images/fntsportswear3.png"),
              label: "TRENDING",
              offer: "MIN 30% OFF",
            },
            {
              id: "pp4",
              img: require("../assets/images/fntsportswear1.png"),
              label: "TOP RATED",
              offer: "UNDER ₹999",
            },
          ].map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.powerGridCard}
              activeOpacity={0.92}
              onPress={goShop}
              accessibilityRole="button"
              accessibilityLabel={`${card.label}, ${card.offer}`}
            >
              <Image
                source={card.img}
                style={styles.powerGridImage}
                resizeMode="cover"
              />
              <View style={styles.powerGridShade} />

              <View style={styles.powerGridBadge}>
                <Text style={styles.powerGridBadgeText}>{card.label}</Text>
              </View>

              <View style={styles.powerGridFooter}>
                <Text style={styles.powerGridOffer}>{card.offer}</Text>
                <View style={styles.powerGridCta}>
                  <Text style={styles.powerGridCtaText}>Shop</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Accessory promos — mosaic + rail */}
      <View
        style={styles.accessoriesAbovePlaybookOuter}
        onLayout={(e) => {
          accessoriesWorthHypeY.current = e.nativeEvent.layout.y;
        }}
      >
        <LinearGradient
          colors={["#ecfeff", "#e0f2fe", "#f5f3ff"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accessoriesAbovePlaybookSurface}
        >
          <View style={styles.accessoriesAbovePlaybookHeader}>
            <View style={styles.accessoriesAbovePlaybookHeaderText}>
              <View style={styles.accessoriesAbovePlaybookEyebrow}>
                <Ionicons name="sparkles" size={14} color="#0369a1" />
                <Text style={styles.accessoriesAbovePlaybookEyebrowTxt}>
                  Add-ons & sport gear
                </Text>
              </View>
              <Text style={styles.accessoriesAbovePlaybookTitle}>
                Accessories worth the hype
              </Text>
              <Text style={styles.accessoriesAbovePlaybookSub}>
                Bags, caps, bottles, and small essentials — curated picks in one place.
              </Text>
            </View>
          </View>

          <View style={styles.accessoriesAbovePlaybookMosaic}>
            <TouchableOpacity
              style={styles.accessoriesAbovePlaybookHeroTile}
              activeOpacity={0.92}
              onPress={goSubcatProducts}
              accessibilityRole="button"
              accessibilityLabel="Shop sports accessories collection"
            >
              <ImageBackground
                source={require("../assets/images/SportsAccessories.png")}
                style={styles.accessoriesAbovePlaybookHeroImg}
                imageStyle={styles.accessoriesAbovePlaybookHeroImgInner}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={["transparent", "rgba(15,23,42,0.05)", "rgba(15,23,42,0.82)"]}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.accessoriesAbovePlaybookHeroCopy}>
                  <Text style={styles.accessoriesAbovePlaybookHeroKicker}>COLLECTION</Text>
                  <Text style={styles.accessoriesAbovePlaybookHeroHeadline}>
                    Sport accessories
                  </Text>
                  <View style={styles.accessoriesAbovePlaybookHeroPill}>
                    <Text style={styles.accessoriesAbovePlaybookHeroPillTxt}>Shop now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0c4a6e" />
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>

            <View style={styles.accessoriesAbovePlaybookStackCol}>
              <TouchableOpacity
                style={styles.accessoriesAbovePlaybookMiniA}
                activeOpacity={0.9}
                onPress={goSubcatProducts}
              >
                <ImageBackground
                  source={ACCESSORIES_MASONRY_ITEMS[0]!.image}
                  style={styles.accessoriesAbovePlaybookMiniImg}
                  imageStyle={styles.accessoriesAbovePlaybookMiniImgInner}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={["rgba(15,118,110,0.2)", "rgba(15,23,42,0.75)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.accessoriesAbovePlaybookMiniLabel} numberOfLines={2}>
                    {ACCESSORIES_MASONRY_ITEMS[0]!.name}
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.accessoriesAbovePlaybookMiniB}
                activeOpacity={0.9}
                onPress={goSubcatProducts}
              >
                <ImageBackground
                  source={ACCESSORIES_MASONRY_ITEMS[1]!.image}
                  style={styles.accessoriesAbovePlaybookMiniImg}
                  imageStyle={styles.accessoriesAbovePlaybookMiniImgInnerB}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={["rgba(124,58,237,0.2)", "rgba(15,23,42,0.78)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.accessoriesAbovePlaybookMiniLabel} numberOfLines={2}>
                    {ACCESSORIES_MASONRY_ITEMS[1]!.name}
                  </Text>
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accessoriesAbovePlaybookRail}
          >
            {ACCESSORIES_ABOVE_PLAYBOOK_BANNERS.map((b) => (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.9}
                onPress={goSubcatProducts}
                style={styles.accessoriesAbovePlaybookRailCard}
                accessibilityRole="button"
                accessibilityLabel={b.title}
              >
                <LinearGradient colors={b.chrome} style={styles.accessoriesAbovePlaybookRailFrame}>
                  <Image source={b.image} style={styles.accessoriesAbovePlaybookRailImg} resizeMode="cover" />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.75)"]}
                    style={styles.accessoriesAbovePlaybookRailShade}
                  />
                  <View style={styles.accessoriesAbovePlaybookRailCopy}>
                    <Text style={styles.accessoriesAbovePlaybookRailTag}>{b.tag}</Text>
                    <Text style={styles.accessoriesAbovePlaybookRailTitle} numberOfLines={2}>
                      {b.title}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Playbook: left page | spiral | right page — swipe for next spread */}
      <View
        style={styles.springBookOuter}
        onLayout={(e) => {
          athletesPlaybookY.current = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.diaryTitle}>The Athlete&apos;s Playbook</Text>

        <ScrollView
          ref={playbookScrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          style={styles.diaryScroll}
          contentContainerStyle={styles.diaryScrollContent}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const next = Math.round(x / DIARY_SPREAD_W);
            setPlaybookPage(
              Math.min(
                Math.max(0, next),
                Math.max(0, DIARY_SPREADS.length - 1)
              )
            );
          }}
        >
          {DIARY_SPREADS.map((spread, spreadIndex) => {
            const leftB = spread.leftBadges ?? DEFAULT_PAGE_BADGES;
            const rightB = spread.rightBadges ?? DEFAULT_PAGE_BADGES;
            return (
              <View
                key={spreadIndex}
                style={[styles.diarySpreadCard, { width: DIARY_SPREAD_W }]}
              >
                <View style={styles.notebookPageWrap}>
                  <PlaybookPageGrid
                    page={spread.left}
                    badges={leftB}
                    onShop={goShop}
                  />
                </View>

                <SpiralBindColumn />

                <View style={styles.notebookPageWrap}>
                  <PlaybookPageGrid
                    page={spread.right}
                    badges={rightB}
                    onShop={goShop}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.diaryPageDots}>
          {DIARY_SPREADS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.diaryPageDot,
                i === playbookPage && styles.diaryPageDotActive,
              ]}
            />
          ))}
        </View>
      </View>

     {/* sports footwear */}





{/* ACESSARORIES*/}
<View
  style={styles.storeSection}
  onLayout={(e) => {
    shopByStoreY.current = e.nativeEvent.layout.y;
  }}
>
  
  {/* 🔶 TOP BANNER */}
  <ImageBackground
    source={require("../assets/images/redsport1.png")} // change banner
    style={styles.storeBanner}
    imageStyle={{ borderRadius: 14 }}
    resizeMode="cover"
  >
    <View style={styles.storeOverlay}>
      <View style={styles.storeTitleRow}>
        <Text style={styles.storeTitle}>WOMEN SPORTS WEAR</Text>
      </View>

      <TouchableOpacity onPress={goSubcatProducts}>
        <Text style={styles.storeShopAll}>Shop All</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>

  {/* 🔶 HORIZONTAL SCROLL */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={130}
    decelerationRate="fast"
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {SHOP_STORE_DATA.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.storeCard}
        onPress={goShop}
        activeOpacity={0.9}
      >
        <View style={styles.storeImageWrapper}>
          <Image
            source={item.image}
            style={styles.storeImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.storeText}>{item.title}</Text>
        <Text style={styles.storeOffer}>UP TO 50% OFF</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
{/* BANNER SECTION */}

 

<View style={styles.lookbookWrapper}>

  <View style={styles.lookbookTitleRow}>
    <Text style={styles.lookbookTitle}>THE LOCAL LOOKBOOK</Text>
  </View>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={width * 0.75}
    decelerationRate="fast"
  >
    {LOOKBOOK_SCROLL_ITEMS.map((item, index) => (
      <View key={item.id} style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={goShop}
          onPressIn={() => {
            Animated.spring(lookbookScales.current[index], {
              toValue: 1.04,
              useNativeDriver: true,
              speed: 18,
              bounciness: 6,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(lookbookScales.current[index], {
              toValue: 1,
              useNativeDriver: true,
              speed: 18,
              bounciness: 6,
            }).start();
          }}
        >
          <Animated.View
            style={[
              styles.redFrame,
              { transform: [{ scale: lookbookScales.current[index] }] },
            ]}
          >
            <Image
              source={item.image}
              style={styles.lookbookImage}
              resizeMode="cover"
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>

</View>

{/* womens sports wear */}

<View
  style={styles.westernSection}
  onLayout={(e) => {
    mensSportsWearY.current = e.nativeEvent.layout.y;
  }}
>
  
  {/* 🔶 TOP BANNER */}
  <ImageBackground
    source={require("../assets/images/redsport2.png")}
    style={styles.westernBanner}
    imageStyle={{ borderRadius: 12 }}
    resizeMode="cover"
  >
    <View style={styles.bannerOverlay}>
      <View style={styles.bannerTitleRow}>
        <Text style={styles.bannerTitle}>MEN&apos;S SPORTS WEAR</Text>
      </View>

      <TouchableOpacity onPress={goSubcatProducts}>
        <Text style={styles.shopAll}>Shop All</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>

  {/* 🔶 SCROLLING PRODUCTS */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={170}
    decelerationRate="fast"
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {MENS_SPORTSWEAR_SCROLL_CARDS.map((item, index) => {
      const scale = [womensCardScale1, womensCardScale2, womensCardScale3][
        index % 3
      ];
      return (
        <Animated.View key={item.id} style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={styles.productCard}
            onPressIn={() => pressIn(scale)}
            onPressOut={() => pressOut(scale)}
            activeOpacity={0.95}
            onPress={goShop}
          >
            <Image
              source={item.image}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productOverlay}>
              <Text style={styles.productText}>{item.title}</Text>
            </View>
            <Text style={styles.productOffer}>{item.offer}</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    })}
  </ScrollView>
</View>



{/* mens wear */}
 <View
   style={styles.container2}
   onLayout={(e) => {
     mensInterestY.current = e.nativeEvent.layout.y;
   }}
 >
    <View style={styles.interestTitleRow}>
      <Text style={styles.title}>What&apos;s your interest in?</Text>
    </View>

    <View style={styles.centerWrapper}>
      {/* CENTER CIRCLE */}
      <View style={[styles.circle, styles.centerCircle]}>
        <Image
          source={interests[0]!.img}
          style={styles.circleImage}
          resizeMode="cover"
        />
        <Text style={styles.circleText}>{interests[0]!.name}</Text>
      </View>

      {/* ORBITING CIRCLES */}
      <Animated.View
        style={[
          styles.orbitContainer,
          { transform: [{ rotate }] },
        ]}
      >
        {interests.slice(1).map((item, index) => {
          const total = interests.length;
          const denom = Math.max(1, total - 1);
          const angle = (index / denom) * (2 * Math.PI);
          const radius = 140;

          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          return (
            <View
              key={`${item.name}-${index}`}
              style={[
                styles.circle,
                {
                  width: item.size,
                  height: item.size,
                  borderRadius: item.size / 2,
                  transform: [{ translateX: x }, { translateY: y }],
                },
              ]}
            >
              <Image
                source={item.img}
                style={styles.circleImage}
                resizeMode="cover"
              />
              <Text style={styles.circleText}>{item.name}</Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  </View>

  <View
    onLayout={(e) => {
      spotlightFootwearY.current = e.nativeEvent.layout.y;
    }}
  >
    {/* Sports footwear banners — new layout above spotlight */}
    <View style={styles.footwearPromoSection}>
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#0c4a6e"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.footwearPromoSurface}
      >
        <View style={styles.footwearPromoRibbon} />
        <View style={styles.footwearPromoHeader}>
          <View style={styles.footwearPromoEyebrowRow}>
            <Ionicons name="walk-outline" size={16} color="#fbbf24" />
            <Text style={styles.footwearPromoEyebrowText}>SPORTS FOOTWEAR</Text>
          </View>
          <Text style={styles.footwearPromoHeadline}>Built for every stride</Text>
          <Text style={styles.footwearPromoSub}>
            Road, gym, court, and trail — banners auto-scroll; swipe the rail anytime.
          </Text>
        </View>

        <View style={styles.footwearPromoDuoRow}>
          <TouchableOpacity
            style={styles.footwearPromoDuoLeft}
            activeOpacity={0.92}
            onPress={goShop}
            accessibilityRole="button"
            accessibilityLabel="Shop featured sports shoes"
          >
            <ImageBackground
              source={require("../assets/images/sports6.png")}
              style={styles.footwearPromoDuoImg}
              imageStyle={styles.footwearPromoDuoImgInner}
              resizeMode="cover"
            >
              <LinearGradient
                colors={["transparent", "rgba(15,23,42,0.2)", "rgba(15,23,42,0.88)"]}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.footwearPromoDuoCopy}>
                <Text style={styles.footwearPromoDuoTag}>SPRINT</Text>
                <Text style={styles.footwearPromoDuoTitle}>Speed lane</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footwearPromoDuoRight}
            activeOpacity={0.92}
            onPress={goShop}
            accessibilityRole="button"
            accessibilityLabel="Shop training footwear"
          >
            <ImageBackground
              source={require("../assets/images/sports7.png")}
              style={styles.footwearPromoDuoImg}
              imageStyle={styles.footwearPromoDuoImgInnerR}
              resizeMode="cover"
            >
              <LinearGradient
                colors={["transparent", "rgba(30,58,138,0.25)", "rgba(15,23,42,0.9)"]}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.footwearPromoDuoCopy}>
                <Text style={styles.footwearPromoDuoTag}>LIFT</Text>
                <Text style={styles.footwearPromoDuoTitle}>Training grip</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footwearPromoHeroWrap}
          activeOpacity={0.92}
          onPress={goShop}
          accessibilityRole="button"
          accessibilityLabel="Shop sports footwear collection"
        >
          <ImageBackground
            source={require("../assets/images/SportsFootwear.png")}
            style={styles.footwearPromoHeroBg}
            imageStyle={styles.footwearPromoHeroImgRadius}
            resizeMode="cover"
          >
            <View style={styles.footwearPromoHeroImageFill} />
          </ImageBackground>
        </TouchableOpacity>

        <ScrollView
          ref={footwearPromoScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={FOOTWEAR_PROMO_RAIL_STRIDE}
          snapToAlignment="start"
          contentContainerStyle={styles.footwearPromoRail}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const page = Math.round(x / FOOTWEAR_PROMO_RAIL_STRIDE);
            const max = FOOTWEAR_PROMO_STRIP.length - 1;
            footwearPromoBannerIndexRef.current = Math.max(0, Math.min(page, max));
          }}
        >
          {FOOTWEAR_PROMO_STRIP.map((row) => (
            <TouchableOpacity
              key={row.id}
              activeOpacity={0.9}
              onPress={goShop}
              style={styles.footwearPromoRailCard}
              accessibilityRole="button"
              accessibilityLabel={row.label}
            >
              <LinearGradient colors={row.chrome} style={styles.footwearPromoRailFrame}>
                <Image source={row.image} style={styles.footwearPromoRailImg} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.82)"]}
                  style={styles.footwearPromoRailShade}
                />
                <View style={styles.footwearPromoRailCopy}>
                  <Text style={styles.footwearPromoRailTag}>{row.tag}</Text>
                  <Text style={styles.footwearPromoRailLabel} numberOfLines={2}>
                    {row.label}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>

    {/* spotlight cards section */}
    <View style={styles.spotlightSection}>
      <View style={styles.spotlightTitleRow}>
        <View style={styles.spotlightTitlePill}>
          <Text style={styles.spotlightTitle}>SPORTS FOOTWEAR</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.42 + 14}
        decelerationRate="fast"
        contentContainerStyle={styles.spotlightScroll}
      >
        {SPOTLIGHT_CARDS.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={styles.spotlightCard}
            onPress={goShop}
          >
            <Image
              source={item.image}
              style={styles.spotlightImage}
              resizeMode="cover"
            />
            <Text style={styles.spotlightCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>

{/* trending cards */}



{/* deals section */}
      {/* WHAT'S MOVING — grid like reference + horizontal auto-scroll */}
      <View style={styles.movingSection}>
        <LinearGradient
          colors={["#FFE4E6", "#FFF1F2", "#FFE4E6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.movingBg}
        />
        <Text style={styles.movingTitle}>WHAT&apos;S MOVING</Text>

        <ScrollView
          ref={movingGridScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width);
            const max = movingPages.length - 1;
            setMovingGridPage(Math.max(0, Math.min(page, max)));
          }}
        >
          {movingPages.map((pageItems, pageIdx) => (
            <View key={`moving-page-${pageIdx}`} style={[styles.movingPage, { width }]}>
              <View style={styles.movingGrid}>
                {pageItems.slice(0, 3).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.movingCard}
                    activeOpacity={0.92}
                    onPress={goShop}
                    accessibilityRole="button"
                    accessibilityLabel={`Shop ${item.title}`}
                  >
                    <LinearGradient
                      colors={["#FFFFFF", "#FFE4E6", "#FECACA"]}
                      locations={[0, 0.55, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.movingCardBg}
                    />
                    <View style={styles.movingCardInnerStroke} />
                    <View style={styles.movingCardImageShell}>
                      <Image
                        source={item.image}
                        style={styles.movingCardImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.movingCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.movingCardOffer} numberOfLines={1}>
                      {item.offer}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.movingGrid}>
                {pageItems.slice(3, 6).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.movingCard}
                    activeOpacity={0.92}
                    onPress={goShop}
                    accessibilityRole="button"
                    accessibilityLabel={`Shop ${item.title}`}
                  >
                    <LinearGradient
                      colors={["#FFFFFF", "#FFE4E6", "#FECACA"]}
                      locations={[0, 0.55, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.movingCardBg}
                    />
                    <View style={styles.movingCardInnerStroke} />
                    <View style={styles.movingCardImageShell}>
                      <Image
                        source={item.image}
                        style={styles.movingCardImage}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.movingCardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.movingCardOffer} numberOfLines={1}>
                      {item.offer}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.movingDotsRow}>
          {movingPages.map((_, i) => (
            <View
              key={`moving-dot-${i}`}
              style={[
                styles.movingDot,
                i === movingGridPage ? styles.movingDotActive : null,
              ]}
            />
          ))}
        </View>
      </View>

      {/* products to buy — 2 per row, no inner scroll */}
      <View
        ref={productsToBuyRef}
        style={styles.ptbSection}
        onLayout={(e) => {
          productsToBuyY.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.ptbHeaderSimple}>
          <Text style={styles.ptbHeading}>Products to buy</Text>
          <TouchableOpacity onPress={goShop} activeOpacity={0.85}>
            <Text style={styles.ptbSeeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.ptbGrid}>
          {PRODUCTS_TO_BUY.map((p) => (
            <View
              key={p.id}
              style={[styles.ptbCard, { width: PTB_GRID_COL_W }]}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={goShop}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, ${p.price}`}
              >
                <View style={styles.ptbCardImageWrap}>
                  {p.discountPercent != null && p.discountPercent > 0 ? (
                    <View style={styles.ptbDiscountBadge}>
                      <Text style={styles.ptbDiscountBadgeText}>
                        {p.discountPercent}%
                      </Text>
                    </View>
                  ) : null}
                  <Image
                    source={p.image}
                    style={styles.ptbCardImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.ptbCardBody}>
                  <Text style={styles.ptbCardName} numberOfLines={3}>
                    {p.name}
                  </Text>
                  <View style={styles.ptbRatingRow}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const filled = i <= Math.round(p.rating);
                      return (
                        <Ionicons
                          key={`${p.id}-star-${i}`}
                          name={filled ? "star" : "star-outline"}
                          size={11}
                          color={filled ? "#f59e0b" : "#cbd5e1"}
                        />
                      );
                    })}
                    <Text style={styles.ptbRatingMeta}>
                      {p.rating.toFixed(1)} ({p.reviewCount})
                    </Text>
                  </View>
                  <View style={styles.ptbPriceRow}>
                    {p.mrp ? (
                      <Text style={styles.ptbMrp}>{p.mrp}</Text>
                    ) : null}
                    <Text style={styles.ptbSalePrice}>{p.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ptbAddToCart}
                activeOpacity={0.9}
                onPress={() => router.push("/cart")}
                accessibilityRole="button"
                accessibilityLabel={`Add to cart: ${p.name}`}
              >
                <Ionicons name="cart-outline" size={17} color="#fff" />
                <Text style={styles.ptbAddToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

  

    
   
  
    
    </Animated.ScrollView>
    <HomeBottomTabBar variant="inline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 0,
    marginBottom: 14,
    gap: 6,
  },

  logo: {
    width: 56,
    height: 32,
    marginRight: 4,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 22,
    paddingHorizontal: 10,
    minHeight: 44,
  },

  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 15,
    color: "#111",
    paddingVertical: 8,
  },

  searchBarIconBtn: {
    padding: 6,
    marginLeft: 4,
  },

  cartBtn: {
    marginLeft: 4,
    padding: 4,
  },

  iconBtn: {
    marginLeft: 4,
    padding: 4,
  },

  bannerContainer: {
    width: "100%",
    height: Math.min(Math.round(height * 0.62), 520),
    position: "relative",
  },

  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  topBannerScroll: {
    width: "100%",
    height: "100%",
  },
  topBannerSlide: {
    width,
    height: "100%",
    resizeMode: "cover",
  },
  topBannerDots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 4,
  },
  topBannerDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  topBannerDotActive: {
    width: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  bannerShortcutDock: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 30,
    zIndex: 5,
  },
  bannerShortcutGrid: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  bannerShortcutTile: {
    width: "48.5%",
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  bannerShortcutTileActive: {
    backgroundColor: "rgba(255, 111, 0, 0.14)",
    borderColor: "rgba(255, 111, 0, 0.38)",
  },
  bannerShortcutTileText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111",
    letterSpacing: 0.2,
  },

  bannerTopButtonsRow: {
    position: "absolute",
    top: 14,
    left: 12,
    right: 12,
    zIndex: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bannerTopBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  bannerTopBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },
  bannerExploreBtn: {
    position: "absolute",
    bottom: 16,
    left: 12,
    right: 12,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff6f00",
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#e65100",
  },
  bannerExploreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  bannerCtaWrap: {
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
  },
  bannerCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff6f00",
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#e65100",
  },
  bannerCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  heroDealsOnlyWrap: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
  },

  sportswearDealsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff6f00",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e65100",
    shadowColor: "#ff6f00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },

  sportswearDealsBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },

  spectrumSection: {
    marginTop: 10,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  spectrumArcWrap: {
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  spectrumSubTitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.2,
  },
  arcTextOuter: {
    position: "relative",
    overflow: "visible",
  },
  arcHalfMask: {
    overflow: "hidden",
  },
  arcTextFull: {
    position: "relative",
  },
  arcChar: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  arcCharText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FF6F00",
    letterSpacing: 1.35,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spectrumCardsRow: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 6,
    marginTop: -18,
  },
  spectrumCard: {
    width: 228,
    height: 245,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    marginRight: 12,
  },
  spectrumCardImage: {
    width: "100%",
    height: "100%",
  },
  spectrumCardFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  spectrumCardLabelPill: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  spectrumCardLabelText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  movingSection: {
    marginTop: 10,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#FFE4E6",
    overflow: "hidden",
  },
  movingBg: {
    ...StyleSheet.absoluteFillObject,
  },
  movingTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#9A3412",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  movingPage: {
    paddingHorizontal: 12,
  },
  movingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  movingCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#FFF7F7",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    padding: 10,
    shadowColor: "#9A3412",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  movingCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  movingCardInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(154,52,18,0.18)",
  },
  movingCardImageShell: {
    width: "100%",
    height: 96,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1.2,
    borderColor: "rgba(154,52,18,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  movingCardImage: {
    width: "100%",
    height: "100%",
  },
  movingCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 15,
    minHeight: 28,
  },
  movingCardOffer: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "900",
    color: "#B45309",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  movingDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  movingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(154,52,18,0.28)",
  },
  movingDotActive: {
    width: 20,
    backgroundColor: "#9A3412",
  },

  motionSection: {
    marginTop: 10,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },
  motionHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  motionSubTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  motionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 14,
  },
  motionArcMask: {
    position: "relative",
  },
  motionArcMarqueeText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "56%",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.4,
    color: "#FF6F00",
    opacity: 0.24,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    zIndex: 0,
    pointerEvents: "none",
  },
  motionArcCharText: {
    fontSize: 14,
    letterSpacing: 1.0,
  },
  motionCard: {
    flex: 1,
    height: 255,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    zIndex: 2,
  },
  motionCardImage: {
    width: "100%",
    height: "100%",
  },
  motionCardFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: "rgba(255,255,255,0.80)",
  },
  motionCardLabel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },

  /* Hero promo grid */
  heroSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: HERO_GAP,
  },

  heroLeftCol: {
    flex: 1,
    minWidth: 0,
  },

  heroTopWide: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
  },

  heroBottomRow: {
    flexDirection: "row",
    gap: HERO_GAP,
  },

  heroBottomCell: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
  },

  heroRightTall: {
    width: width * 0.34,
    maxWidth: 140,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
    minHeight: HERO_TOP_H + HERO_GAP + HERO_BOTTOM_H,
  },

  heroBgImageOnly: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  heroBgImage: {
    borderRadius: 10,
  },

  heroDimLight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 10,
  },

  heroSaleOuter: {
    flex: 1,
    backgroundColor: "#b71c1c",
    borderRadius: 10,
    padding: 3,
  },

  heroSaleInnerMinimal: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#ffeb3b",
    borderRadius: 8,
    backgroundColor: "rgba(183, 28, 28, 0.92)",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 15,
    marginTop: 16,
    marginBottom: 10,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },

  categoryCard: {
    width: "48%",
    marginBottom: 15,
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    overflow: "hidden",
  },

  categoryImage: {
    width: "100%",
    height: 120,
  },

  categoryText: {
    padding: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  powerSection: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "#F8FAFF",
  },

  powerHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  powerEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#FF6F00",
  },
  powerTitle: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  powerSubTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  powerSeeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  powerSeeAllText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
  },

  powerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  powerGridCard: {
    width: "48.5%",
    height: 196,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
  },
  powerGridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  powerGridShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  powerGridBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
  },
  powerGridBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.4,
  },
  powerGridFooter: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
  powerGridOffer: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  powerGridCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FF6F00",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
  },
  powerGridCtaText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  /* Accessory promos (mosaic + rail) — above playbook */
  accessoriesAbovePlaybookOuter: {
    marginTop: 18,
    marginHorizontal: 8,
    marginBottom: 6,
  },
  accessoriesAbovePlaybookSurface: {
    borderRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(14,116,144,0.18)",
    overflow: "hidden",
  },
  accessoriesAbovePlaybookHeader: {
    marginBottom: 14,
  },
  accessoriesAbovePlaybookHeaderText: {
    maxWidth: "100%",
  },
  accessoriesAbovePlaybookEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.35)",
  },
  accessoriesAbovePlaybookEyebrowTxt: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0369a1",
    letterSpacing: 0.4,
  },
  accessoriesAbovePlaybookTitle: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  accessoriesAbovePlaybookSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#64748b",
  },
  accessoriesAbovePlaybookMosaic: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  accessoriesAbovePlaybookHeroTile: {
    flex: 1.18,
    minWidth: 0,
  },
  accessoriesAbovePlaybookHeroImg: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  accessoriesAbovePlaybookHeroImgInner: {
    borderRadius: 20,
  },
  accessoriesAbovePlaybookHeroCopy: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
  },
  accessoriesAbovePlaybookHeroKicker: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.4,
  },
  accessoriesAbovePlaybookHeroHeadline: {
    marginTop: 4,
    fontSize: 19,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  accessoriesAbovePlaybookHeroPill: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  accessoriesAbovePlaybookHeroPillTxt: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0c4a6e",
  },
  accessoriesAbovePlaybookStackCol: {
    flex: 1,
    height: 200,
    justifyContent: "space-between",
    minWidth: 0,
  },
  accessoriesAbovePlaybookMiniA: {
    height: 95,
    borderRadius: 16,
    overflow: "hidden",
  },
  accessoriesAbovePlaybookMiniB: {
    height: 95,
    borderRadius: 16,
    overflow: "hidden",
  },
  accessoriesAbovePlaybookMiniImg: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  accessoriesAbovePlaybookMiniImgInner: {
    borderRadius: 16,
    borderBottomRightRadius: 6,
  },
  accessoriesAbovePlaybookMiniImgInnerB: {
    borderRadius: 16,
    borderTopLeftRadius: 6,
  },
  accessoriesAbovePlaybookMiniLabel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  accessoriesAbovePlaybookRail: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
    paddingRight: 4,
  },
  accessoriesAbovePlaybookRailCard: {
    width: 154,
  },
  accessoriesAbovePlaybookRailFrame: {
    height: 132,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  accessoriesAbovePlaybookRailImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  accessoriesAbovePlaybookRailShade: {
    ...StyleSheet.absoluteFillObject,
  },
  accessoriesAbovePlaybookRailCopy: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
  accessoriesAbovePlaybookRailTag: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 1.2,
  },
  accessoriesAbovePlaybookRailTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 18,
  },

  /* The Athlete's Playbook */
  springBookOuter: {
    marginTop: 26,
    marginHorizontal: 10,
    marginBottom: 12,
    maxWidth: NOTEBOOK_MAX_W + 20,
    alignSelf: "center",
    width: "100%",
    backgroundColor: "skyblue",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },

  diaryTitle: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#1d324e",
    marginBottom: 14,
    textShadowColor: "#fff",
    textShadowOffset: { width: 2, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 0.5,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(29, 50, 78, 0.25)",
  },

  diaryScroll: {
    width: DIARY_SPREAD_W,
    alignSelf: "center",
  },

  diaryScrollContent: {
    flexDirection: "row",
  },

  diarySpreadCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  notebookPageWrap: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 5,
  },

  playbookPage: {
    flex: 1,
    justifyContent: "space-between",
  },

  pbRowTop: {
    flexDirection: "row",
    gap: 6,
    height: 250,
    marginBottom: 6,
  },

  pbTopFull: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbTopLeft: {
    width: "36%",
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbTopRight: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbRowBottom: {
    flexDirection: "row",
    gap: 6,
    height: 200,
  },

  pbBottomFull: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbBottomLeft: {
    width: "42%",
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbMiniPair: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    gap: 5,
  },

  pbMini: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbCardImg: {
    width: "100%",
    flex: 1,
    minHeight: 48,
    resizeMode: "cover",
  },

  pbCardFooter: {
    flexDirection: "column",
    paddingHorizontal: 4,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.95)",
    gap: 0,
  },

  pbCardFooterDark: {
    backgroundColor: "rgba(0,0,0,0.82)",
  },

  pbBadge: {
    fontSize: 7,
    fontWeight: "900",
    color: "#111",
    lineHeight: 9,
  },

  pbBadgeOnDark: {
    color: "#fff",
  },

  pbShopBtn: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: "#111",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },

  pbShopBtnText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#fff",
  },

  pbShopBtnLight: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },

  pbShopBtnTextDark: {
    fontSize: 7,
    fontWeight: "800",
    color: "#111",
  },

  spiralBindOuter: {
    width: 38,
    flexShrink: 0,
    alignSelf: "stretch",
    backgroundColor: "#d5d5d5",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#9e9e9e",
    paddingVertical: 6,
    position: "relative",
    justifyContent: "space-between",
  },

  spiralBindCenterBar: {
    position: "absolute",
    left: "50%",
    marginLeft: -2,
    width: 4,
    top: 8,
    bottom: 8,
    backgroundColor: "#0a0a0a",
    borderRadius: 2,
    zIndex: 1,
  },

  spiralBindRow: {
    flex: 1,
    minHeight: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  spiralBindHook: {
    width: 22,
    height: 13,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    borderWidth: 2.5,
    borderColor: "#111",
    borderRightWidth: 0,
    backgroundColor: "#fafafa",
  },

  spiralBindHookMirror: {
    transform: [{ scaleX: -1 }],
  },

  diaryPageDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  diaryPageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },

  diaryPageDotActive: {
    width: 20,
    backgroundColor: "#ff2d8b",
    borderColor: "#c2185b",
  },

  /* Glass-style vertical deals */
  glassDealsSection: {
    marginTop: 8,
    marginHorizontal: 10,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(56,189,248,0.28)",
  },

  glassDealsSectionRibbon: {
    alignSelf: "center",
    width: "72%",
    maxWidth: 280,
    height: 4,
    borderRadius: 4,
    marginBottom: 16,
    opacity: 1,
  },

  glassDealsSectionTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#ecfeff",
    marginBottom: 16,
    letterSpacing: 0.3,
    textShadowColor: "rgba(232,121,249,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  angledWrap: {
    marginTop: 10,
    paddingVertical: 22,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  angledCard: {
    width: "100%",
    height: 210,
    alignSelf: "center",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#eee",
  },
  angledImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  angledNavRow: {
    marginTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  angledNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff6f00",
    alignItems: "center",
    justifyContent: "center",
  },
  angledDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  angledDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,111,0,0.35)",
  },
  angledDotActive: {
    width: 18,
    backgroundColor: "#ff6f00",
  },

  glassDealCard: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    height: width * 0.62,
    maxHeight: 250,
    marginBottom: 16,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#af9778",
  },

  glassDealBg: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
  },

  glassDealBgImage: {
    borderRadius: 28,
  },

  glassDealTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 16,
  },

  glassDealTopSpacer: {
    flex: 1,
  },

  glassIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  glassDealMiddle: {
    flex: 1,
  },

  glassDealBar: {
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    minHeight: 60,
  },

  glassDealBarBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.35)",
  },

  glassDealBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    zIndex: 1,
  },

  glassDealTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 21,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  glassIconCircleSm: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  dealsOverlay: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)", // dark overlay for text visibility
  borderRadius: 14,
},


// according to colour


colorcontainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 20,
    borderRadius: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: "#000",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  shoeImage: {
    width: 100,
    height: 80,
    resizeMode: "contain",
  },
  offerText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    fontWeight: "600",
  },


  // sports footwear

  accessoriesCarouselOuter: {
    paddingHorizontal: 12,
  },
  accessoriesCarouselHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  accessoriesCarouselEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#FF6F00",
  },
  accessoriesCarouselTitle: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  accessoriesCarouselAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  accessoriesCarouselAllText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
  },
  accessoriesCarouselScroll: {
    paddingRight: 12,
  },
  accessoriesCarouselCard: {
    width: 258,
    height: 210,
    marginRight: 12,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  accessoriesCarouselImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  accessoriesCarouselShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  accessoriesCarouselFooter: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  accessoriesCarouselName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    marginBottom: 10,
  },
  accessoriesCarouselCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FF6F00",
  },
  accessoriesCarouselCtaText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  accessoriesCollageScroll: {
    paddingHorizontal: 12,
  },
  accessoriesCollagePage: {
    width: width - 24,
    paddingBottom: 8,
  },
  accessoriesCollageTopRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  accessoriesCollageBig: {
    flex: 1,
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  accessoriesCollageRightCol: {
    width: 150,
    gap: 10,
  },
  accessoriesCollageSmall: {
    height: 100,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
    justifyContent: "flex-end",
  },
  accessoriesCollageWide: {
    height: 120,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.10)",
  },
  accessoriesCollageImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  accessoriesCollageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  accessoriesCollageShadeLite: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  accessoriesCollageLabel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  accessoriesCollageTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
    marginBottom: 10,
  },
  accessoriesCollagePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FF6F00",
  },
  accessoriesCollagePillText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  accessoriesCollageSmallTitle: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  accessoriesCollageWideRow: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  accessoriesCollageWideTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

trendCard: {
  width: 180,
  height: 260,
  marginRight: 15,
  borderRadius: 10,
  overflow: "hidden",
  borderWidth: 0,
},

trendImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

trendOverlay: {
  position: "absolute",
  bottom: 10,
  left: 10,
  right: 10,
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 10,
  backgroundColor: "rgba(255,255,255,0.9)",
},

trendBrand: {
  color: "#111",
  fontSize: 12,
  fontWeight: "600",
},

trendPrice: {
  color: "#111",
  fontSize: 16,
  fontWeight: "bold",
},

//  women sports wear


westernSection: {
  marginTop: 15,
  backgroundColor: "#f5e1d8",
  paddingVertical: 15,
},

/* 🔶 BANNER */
westernBanner: {
  height: 200,
  marginHorizontal: 10,
  marginBottom: 15,
  justifyContent: "center",
},

bannerOverlay: {
  alignItems: "center",
},

bannerTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

bannerTitle: {
  fontSize: 22,
  fontWeight: "bold",
  color: "white",
  letterSpacing: 2,
},

shopAll: {
  marginTop: 10,
  fontSize: 16,
  textDecorationLine: "underline",
  fontWeight: "600",
  color:"white",
},

/* 🔶 PRODUCT CARDS */
productCard: {
  width: 160,
  marginRight: 12,
},

productImage: {
  width: "100%",
  height: 160,
  borderRadius: 12,
  resizeMode: "cover",
},

productOverlay: {
  position: "absolute",
  bottom: 35,
  left: 10,
},

productText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
  backgroundColor: "rgba(0,0,0,0.5)",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
},

productOffer: {
  textAlign: "center",
  marginTop: 6,
  fontWeight: "bold",
  fontSize: 14,
},






/* Acessaries */

storeSection: {
  marginTop: 20,
  backgroundColor: "#fff",
  paddingVertical: 15,
},

storeBanner: {
  height: 180,
  marginHorizontal: 10,
  marginBottom: 15,
  justifyContent: "center",
},

storeOverlay: {
  alignItems: "center",
},

storeTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},

storeTitle: {
  fontSize: 22,
  fontWeight: "bold",
  color: "#fff",
  letterSpacing: 2,
},

storeShopAll: {
  marginTop: 8,
  fontSize: 16,
  textDecorationLine: "underline",
  color: "#fff",
},

storeCard: {
  width: 120,
  marginRight: 12,
  alignItems: "center",
},

/* 🔥 HALF ROUND IMAGE */
storeImageWrapper: {
  width: 110,
  height: 80,
  backgroundColor: "#f2f2f2",
  borderTopLeftRadius: 60,
  borderTopRightRadius: 60,
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  overflow: "hidden",
  justifyContent: "center",
  alignItems: "center",
},

storeImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

storeText: {
  marginTop: 6,
  fontSize: 13,
  fontWeight: "600",
  textAlign: "center",
},

storeOffer: {
  fontSize: 11,
  color: "#ff2d2d",
  fontWeight: "bold",
},
// banner section
/* 🔥 LOOKBOOK SECTION */
lookbookWrapper:{
  marginTop:20,
},

lookbookTitleRow: {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "center",
  marginBottom: 15,
},

lookbookTitle:{
  textAlign:"center",
  fontSize:18,
  fontWeight:"900",
  alignSelf: "center",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 999,
  backgroundColor: "#111",
  color: "#fff",
  letterSpacing: 1,
},

cardWrapper:{
  width:width*0.75,
  marginHorizontal:12,
},

redFrame:{
  backgroundColor:"#fff",
  padding:6,
  borderRadius:16,
  shadowColor:"#000",
  shadowOpacity:0.12,
  shadowRadius:8,
  elevation:8,
},

lookbookImage:{
  width:"100%",
  height:260,
  borderRadius:24,
  resizeMode:"cover",
},

// mens wear

container2: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  footwearPromoSection: {
    marginTop: 28,
    marginHorizontal: 10,
    marginBottom: 0,
  },
  footwearPromoSurface: {
    borderRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.22)",
  },
  footwearPromoRibbon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#fbbf24",
    opacity: 0.9,
  },
  footwearPromoHeader: {
    marginBottom: 14,
  },
  footwearPromoEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  footwearPromoEyebrowText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fde68a",
    letterSpacing: 1.2,
  },
  footwearPromoHeadline: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: -0.3,
  },
  footwearPromoSub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#94a3b8",
  },
  footwearPromoDuoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  footwearPromoDuoLeft: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 118,
  },
  footwearPromoDuoRight: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 118,
  },
  footwearPromoDuoImg: {
    width: "100%",
    height: 118,
    justifyContent: "flex-end",
  },
  footwearPromoDuoImgInner: {
    borderRadius: 16,
    borderBottomRightRadius: 6,
  },
  footwearPromoDuoImgInnerR: {
    borderRadius: 16,
    borderBottomLeftRadius: 6,
  },
  footwearPromoDuoCopy: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },
  footwearPromoDuoTag: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(248,250,252,0.85)",
    letterSpacing: 1.1,
  },
  footwearPromoDuoTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  footwearPromoHeroWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
  },
  footwearPromoHeroBg: {
    height: 148,
    width: "100%",
  },
  footwearPromoHeroImgRadius: {
    borderRadius: 18,
  },
  footwearPromoHeroImageFill: {
    flex: 1,
  },
  footwearPromoRail: {
    gap: FOOTWEAR_PROMO_RAIL_GAP,
    paddingRight: 6,
    paddingBottom: 2,
  },
  footwearPromoRailCard: {
    width: FOOTWEAR_PROMO_RAIL_CARD_WIDTH,
  },
  footwearPromoRailFrame: {
    height: 118,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  footwearPromoRailImg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  footwearPromoRailShade: {
    ...StyleSheet.absoluteFillObject,
  },
  footwearPromoRailCopy: {
    position: "absolute",
    left: 10,
    right: 8,
    bottom: 10,
  },
  footwearPromoRailTag: {
    fontSize: 9,
    fontWeight: "900",
    color: "rgba(255,255,255,0.92)",
    letterSpacing: 1,
  },
  footwearPromoRailLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
    color: "#fff",
    lineHeight: 16,
  },

  spotlightSection: {
    marginTop: 14,
    marginHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#d9d9d9",
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 14,
  },
  spotlightTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  spotlightTitlePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ff6f00",
  },
  spotlightTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ff6f00",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  spotlightScroll: {
    paddingRight: 10,
    gap: 14,
  },
  spotlightCard: {
    width: width * 0.46,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
    padding: 10,
  },
  spotlightImage: {
    width: "100%",
    height: 165,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#f2f2f2",
  },
  spotlightCardTitle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },

  ptbSection: {
    marginTop: 18,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  ptbHeaderSimple: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ptbHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  ptbSeeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ea580c",
  },
  ptbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: PTB_GRID_GAP,
  },
  ptbCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingBottom: 10,
  },
  ptbCardImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f1f5f9",
    position: "relative",
  },
  ptbDiscountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    minWidth: 36,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: "#ea580c",
    alignItems: "center",
    justifyContent: "center",
  },
  ptbDiscountBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  ptbCardImage: {
    width: "100%",
    height: "100%",
  },
  ptbCardBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  ptbCardName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 16,
  },
  ptbRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 2,
  },
  ptbRatingMeta: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  ptbPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  ptbMrp: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  ptbSalePrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ea580c",
  },
  ptbAddToCart: {
    marginTop: 10,
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#ea580c",
  },
  ptbAddToCartText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1B1B5F",
    marginBottom: 0,
  },

  interestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },

  centerWrapper: {
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },

  orbitContainer: {
    position: "absolute",
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },

  circle: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 5,
  },

  centerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    zIndex: 10,
  },

  circleImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    resizeMode: "cover",
  },

  circleText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    width: "100%",
     },




    // moon shape





/* 🔥 THIS CREATES TOP CURVE CUT */
curveSection: {
  marginTop: 30,
},

curveCard: {
  width: 260,
  height: 320,
  borderRadius: 20,
  overflow: 'hidden',
  backgroundColor: '#fff',
  marginHorizontal: 10,
},

curveImage: {
  width: '100%',
  height: '100%',
  position: 'absolute',
},

curveSvg: {
  position: 'absolute',
  top: -10,
  left: 0,
},


curveOverlay: {
  position: "absolute",
  bottom: 60,
  left: 20,
},

curveTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "white",
},

curvePrice: {
  fontSize: 18,
  fontWeight: "600",
  marginTop: 5,
  color: "white",
},

topIcon: {
  position: "absolute",
  top: 20,
  right: 20,
  backgroundColor: "#fff",
  padding: 8,
  borderRadius: 20,
},

bottomIcon: {
  position: "absolute",
  bottom: 20,
  right: 20,
  backgroundColor: "#fff",
  padding: 10,
  borderRadius: 25,
},


topBanner: {
  backgroundColor: '#1FA79A',
  height: 260,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  paddingTop: 40,
  paddingHorizontal: 20,
},

/* 🔥 SMALL TOP BOX (reduced size) */


// L shape section

lSection: {
  width: 280,          // 👈 REQUIRED for scroll
  height: 260,
  position: 'relative',
  marginHorizontal: 10,
},

bigBox: {
  width: '68%',        // 👈 leaves gap for small box
  height: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  
},

bigImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},

smallBox: {
  position: 'absolute',
  right: 0,
  bottom: 0,

  width: 120,
  height: 110,

  borderRadius: 12,
  overflow: 'hidden',
},

smallImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},





});
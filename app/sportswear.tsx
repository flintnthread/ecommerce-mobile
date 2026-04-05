import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import api, { getPublicImageUrl } from "../services/api";

const IMG_SPORTS_DEALS = require("../assets/images/sportswear.png");

const { height, width } = Dimensions.get("window");
const NOTEBOOK_MAX_W = width - 24;
/** Width of one diary “spread” (page | spiral | page) for horizontal paging */
const DIARY_SPREAD_W = NOTEBOOK_MAX_W - 20;
const HERO_GAP = 8;
const HERO_TOP_H = 148;
const HERO_BOTTOM_H = 132;

/** Swap these `require(...)` paths when you add your own banner images. */
const IMG_HERO_WORKOUT = require("../assets/images/fntsportswear1.png");
const IMG_HERO_SOCCER = require("../assets/images/fntsportswear2.png");
const IMG_HERO_TENNIS = require("../assets/images/fntsportswear3.png");
const IMG_HERO = require("../assets/images/fntsportswear4.png");

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

type PlaybookPageAssets = {
  topLeft: ImageSourcePropType;
  topRight: ImageSourcePropType;
  bottomLeft: ImageSourcePropType;
  bottomMini1: ImageSourcePropType;
  bottomMini2: ImageSourcePropType;
};

type ApiSubcategory = { id: number; name: string; image: string };
type ApiCategoryResponse = {
  categoryName: string;
  subcategories: ApiSubcategory[];
};

const DEFAULT_PAGE_BADGES: [string, string, string, string, string] = [
  "UP TO 30% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
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
const DIARY_SPREADS: {
  left: PlaybookPageAssets;
  right: PlaybookPageAssets;
  leftBadges?: [string, string, string, string, string];
  rightBadges?: [string, string, string, string, string];
}[] = [
  {
    left: {
      topLeft: require("../assets/images/sports1.png"),
      topRight: require("../assets/images/sports2.png"),
      bottomLeft: require("../assets/images/sports3.png"),
      bottomMini1: require("../assets/images/sports4.png"),
      bottomMini2: require("../assets/images/sports5.png"),
    },
    right: {
      topLeft: require("../assets/images/sports3.png"),
      topRight: require("../assets/images/sports5.png"),
      bottomLeft: require("../assets/images/sports1.png"),
      bottomMini1: require("../assets/images/sports4.png"),
      bottomMini2: require("../assets/images/sports2.png"),
    },
  },
  {
    left: {
      topLeft: require("../assets/images/sports1.png"),
      topRight: require("../assets/images/sports4.png"),
      bottomLeft: require("../assets/images/sports3.png"),
      bottomMini1: require("../assets/images/sports4.png"),
      bottomMini2: require("../assets/images/sports2.png"),
    },
    right: {
      topLeft: require("../assets/images/sports5.png"),
      topRight: require("../assets/images/sports4.png"),
      bottomLeft: require("../assets/images/sports6.png"),
      bottomMini1: require("../assets/images/sports1.png"),
      bottomMini2: require("../assets/images/sports4.png"),
    },
  },
];

type DiarySpreadEntry = (typeof DIARY_SPREADS)[number];

function padBadgesFromNames(names: string[]): [string, string, string, string, string] {
  const n = [...names];
  while (n.length < 5) {
    n.push(n[n.length - 1] ?? "Shop");
  }
  return n.slice(0, 5) as [string, string, string, string, string];
}

function buildPlaybookPageFromFiles(topFile: string, bottomFile: string): PlaybookPageAssets {
  const top: ImageSourcePropType = { uri: getPublicImageUrl(topFile) };
  const bottom: ImageSourcePropType = { uri: getPublicImageUrl(bottomFile) };
  return {
    topLeft: top,
    topRight: top,
    bottomLeft: bottom,
    bottomMini1: bottom,
    bottomMini2: bottom,
  };
}

/** Builds one playbook spread from Accessories subcategories (first half of API list). */
function buildAccessoryPlaybookSpreads(subs: ApiSubcategory[]): DiarySpreadEntry[] {
  if (subs.length === 0) return [];
  const pickFile = (i: number) =>
    subs[Math.min(Math.max(0, i), subs.length - 1)]!.image;
  const names = subs.map((s) => s.name);
  const a0 = pickFile(0);
  const a1 = pickFile(1);
  const a2 = pickFile(2);
  const a3 = subs.length >= 4 ? pickFile(3) : pickFile(0);
  return [
    {
      left: buildPlaybookPageFromFiles(a0, a1),
      right: buildPlaybookPageFromFiles(a2, a3),
      leftBadges: padBadgesFromNames([
        names[0] ?? "",
        names[1] ?? names[0] ?? "",
        names[2] ?? names[0] ?? "",
        names[0] ?? "",
        names[1] ?? "",
      ]),
      rightBadges: padBadgesFromNames([
        names[2] ?? names[0] ?? "",
        names[3] ?? names[0] ?? "",
        names[0] ?? "",
        names[1] ?? "",
        names[2] ?? "",
      ]),
    },
  ];
}

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

/** Orbit circle sizes when mapping API subcategories (category 67) */
const MENS_INTEREST_ORBIT_SIZES = [170, 120, 100, 90, 90, 90, 80, 80];

  

// banner section

const banners = [
  require("../assets/images/sportsbanner1.png"),
  require("../assets/images/sportsbanner2.png"),
  require("../assets/images/sportsbanner5.png"),
  require("../assets/images/sportsbanner6.png"),
];

/** Full-width banners under “Sportswear deals” (new assets + fnt sportswear promos) */
const SPORTSWEAR_DEALS_BANNERS: { id: string; image: ReturnType<typeof require> }[] = [
  { id: "sd1", image: require("../assets/images/newsports.jpeg") },
  { id: "sd2", image: require("../assets/images/newsports2.jpeg") },
  { id: "sd3", image: require("../assets/images/fntsportswear5.png") },
  { id: "sd4", image: require("../assets/images/fntsportswear6.png") },
  { id: "sd5", image: require("../assets/images/fntsportswear1.png") },
  { id: "sd6", image: require("../assets/images/fntsportswear2.png") },
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

const PRODUCTS_TO_BUY: {
  id: string;
  name: string;
  price: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "ptb1",
    name: "Training Shoes",
    price: "₹2,499",
    image: require("../assets/images/sports6.png"),
  },
  {
    id: "ptb2",
    name: "Gym T-shirt",
    price: "₹799",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "ptb3",
    name: "Running Shorts",
    price: "₹999",
    image: require("../assets/images/sports3.png"),
  },
  {
    id: "ptb4",
    name: "Sports Bottle",
    price: "₹399",
    image: require("../assets/images/sports4.png"),
  },
];

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
/** Center spine + mirrored C-hooks (coil through the gutter), like a real spiral bind */
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
          <Image source={page.topLeft} style={styles.pbCardImg} />
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
          <Image source={page.bottomLeft} style={styles.pbCardImg} />
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
  // Trigger while this card is entering the viewport (not earlier),
  // so the movement is visible during scroll.
  const fromX = index % 2 === 0 ? -140 : 140;
  const start = Math.max(0, anchorY - height * 0.85);
  const end = Math.max(0, anchorY - height * 0.55);
  const inputRange = [start, end];
  const translateX = scrollY.interpolate({
    inputRange,
    outputRange: [fromX, 0],
    extrapolate: "clamp",
  });
  const opacity = scrollY.interpolate({
    inputRange,
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

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
  const [searchQuery, setSearchQuery] = useState("");
  const [playbookPage, setPlaybookPage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("white");
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
  const playbookScrollRef = useRef<ScrollView>(null);
  const sportswearDealsBannerScrollRef = useRef<ScrollView>(null);
  const [sportswearDealsBannerIndex, setSportswearDealsBannerIndex] = useState(0);
  const [accessoryApiLoading, setAccessoryApiLoading] = useState(true);
  const [accessoryApiError, setAccessoryApiError] = useState<string | null>(null);
  const [accessoryApiPayload, setAccessoryApiPayload] = useState<{
    playbookSpreads: DiarySpreadEntry[];
    accessoriesSubs: ApiSubcategory[];
  } | null>(null);

  const [footwearApiLoading, setFootwearApiLoading] = useState(true);
  const [footwearApiError, setFootwearApiError] = useState<string | null>(null);
  const [footwearApiPayload, setFootwearApiPayload] = useState<{
    spotlightSubs: ApiSubcategory[];
    dealsSubs: ApiSubcategory[];
  } | null>(null);

  const [womensApiLoading, setWomensApiLoading] = useState(true);
  const [womensApiError, setWomensApiError] = useState<string | null>(null);
  const [womensApiPayload, setWomensApiPayload] = useState<{
    womenSectionSubs: ApiSubcategory[];
    lookbookSubs: ApiSubcategory[];
  } | null>(null);

  const [mensApiLoading, setMensApiLoading] = useState(true);
  const [mensApiError, setMensApiError] = useState<string | null>(null);
  const [mensApiPayload, setMensApiPayload] = useState<{
    mensSectionSubs: ApiSubcategory[];
    interestSubs: ApiSubcategory[];
  } | null>(null);

  const spreadsForPlaybook = useMemo(() => {
    if (accessoryApiPayload?.playbookSpreads?.length) {
      return accessoryApiPayload.playbookSpreads;
    }
    return DIARY_SPREADS;
  }, [accessoryApiPayload]);

  const accessoriesFromApi = accessoryApiPayload?.accessoriesSubs ?? null;

  /** Category 47 — first half → SPORTS FOOTWEAR spotlight; second half → Sportswear deals carousel */
  const spotlightSectionItems = useMemo(() => {
    if (footwearApiPayload?.spotlightSubs?.length) {
      return footwearApiPayload.spotlightSubs.map((s) => ({
        id: String(s.id),
        title: s.name,
        image: { uri: getPublicImageUrl(s.image) } as ImageSourcePropType,
      }));
    }
    return SPOTLIGHT_CARDS.map((c) => ({
      id: c.id,
      title: c.title,
      image: c.image,
    }));
  }, [footwearApiPayload]);

  const dealsCarouselItems = useMemo(() => {
    if (footwearApiPayload?.dealsSubs?.length) {
      return footwearApiPayload.dealsSubs.map((s) => ({
        id: String(s.id),
        image: { uri: getPublicImageUrl(s.image) } as ImageSourcePropType,
      }));
    }
    return SPORTSWEAR_DEALS_BANNERS.map((b) => ({
      id: b.id,
      image: b.image,
    }));
  }, [footwearApiPayload]);

  /** Category 68 — first half → WOMEN SPORTS WEAR store row; second half → THE LOCAL LOOKBOOK */
  const womenStoreSectionItems = useMemo(() => {
    if (womensApiPayload?.womenSectionSubs?.length) {
      return womensApiPayload.womenSectionSubs.map((s) => ({
        id: String(s.id),
        title: s.name,
        image: { uri: getPublicImageUrl(s.image) } as ImageSourcePropType,
      }));
    }
    return SHOP_STORE_DATA;
  }, [womensApiPayload]);

  const lookbookSectionItems = useMemo(() => {
    if (womensApiPayload?.lookbookSubs?.length) {
      return womensApiPayload.lookbookSubs.map((s) => ({
        id: String(s.id),
        image: { uri: getPublicImageUrl(s.image) } as ImageSourcePropType,
      }));
    }
    return banners.map((img, index) => ({
      id: `lookbook-fallback-${index}`,
      image: img as ImageSourcePropType,
    }));
  }, [womensApiPayload]);

  /** Category 67 — first half → MEN'S SPORTS WEAR cards; second half → What's your interest orbit */
  const mensWesternProductItems = useMemo(() => {
    if (mensApiPayload?.mensSectionSubs?.length) {
      return mensApiPayload.mensSectionSubs.map((s) => ({
        id: String(s.id),
        title: s.name,
        image: { uri: getPublicImageUrl(s.image) } as ImageSourcePropType,
      }));
    }
    return null;
  }, [mensApiPayload]);

  const mensInterestsList = useMemo(() => {
    if (mensApiPayload?.interestSubs?.length) {
      return mensApiPayload.interestSubs.map((s, i) => ({
        name: s.name,
        size:
          MENS_INTEREST_ORBIT_SIZES[i % MENS_INTEREST_ORBIT_SIZES.length] ?? 90,
        img: { uri: getPublicImageUrl(s.image) } as ImageSourcePropType,
      }));
    }
    return interests;
  }, [mensApiPayload]);

  useEffect(() => {
    const max = Math.max(0, dealsCarouselItems.length - 1);
    setSportswearDealsBannerIndex((prev) => Math.min(prev, max));
  }, [dealsCarouselItems.length]);

  useEffect(() => {
    let cancelled = false;

    const loadAccessoryCategory = async () => {
      setAccessoryApiLoading(true);
      setAccessoryApiError(null);
      try {
        const { data } = await api.get<ApiCategoryResponse[]>(
          "/api/categories/70/subcategories-table"
        );
        if (cancelled) return;
        const subs = Array.isArray(data) ? data[0]?.subcategories ?? [] : [];
        if (subs.length === 0) {
          setAccessoryApiPayload(null);
          return;
        }
        const mid = Math.ceil(subs.length / 2);
        const playbookSubs = subs.slice(0, mid);
        const accessoriesSubs = subs.slice(mid);
        const spreads = buildAccessoryPlaybookSpreads(playbookSubs);
        setAccessoryApiPayload({
          playbookSpreads: spreads.length > 0 ? spreads : [],
          accessoriesSubs,
        });
      } catch {
        if (!cancelled) {
          setAccessoryApiError("Could not load accessories");
          setAccessoryApiPayload(null);
        }
      } finally {
        if (!cancelled) setAccessoryApiLoading(false);
      }
    };

    const loadFootwearCategory = async () => {
      setFootwearApiLoading(true);
      setFootwearApiError(null);
      try {
        const { data } = await api.get<ApiCategoryResponse[]>(
          "/api/categories/47/subcategories-table"
        );
        if (cancelled) return;
        const subs = Array.isArray(data) ? data[0]?.subcategories ?? [] : [];
        if (subs.length === 0) {
          setFootwearApiPayload(null);
          return;
        }
        const mid = Math.ceil(subs.length / 2);
        setFootwearApiPayload({
          spotlightSubs: subs.slice(0, mid),
          dealsSubs: subs.slice(mid),
        });
      } catch {
        if (!cancelled) {
          setFootwearApiError("Could not load sports footwear");
          setFootwearApiPayload(null);
        }
      } finally {
        if (!cancelled) setFootwearApiLoading(false);
      }
    };

    const loadWomensSportswearCategory = async () => {
      setWomensApiLoading(true);
      setWomensApiError(null);
      try {
        const { data } = await api.get<ApiCategoryResponse[]>(
          "/api/categories/68/subcategories-table"
        );
        if (cancelled) return;
        const subs = Array.isArray(data) ? data[0]?.subcategories ?? [] : [];
        if (subs.length === 0) {
          setWomensApiPayload(null);
          return;
        }
        const mid = Math.ceil(subs.length / 2);
        setWomensApiPayload({
          womenSectionSubs: subs.slice(0, mid),
          lookbookSubs: subs.slice(mid),
        });
      } catch {
        if (!cancelled) {
          setWomensApiError("Could not load women's sportswear");
          setWomensApiPayload(null);
        }
      } finally {
        if (!cancelled) setWomensApiLoading(false);
      }
    };

    const loadMensSportswearCategory = async () => {
      setMensApiLoading(true);
      setMensApiError(null);
      try {
        const { data } = await api.get<ApiCategoryResponse[]>(
          "/api/categories/67/subcategories-table"
        );
        if (cancelled) return;
        const subs = Array.isArray(data) ? data[0]?.subcategories ?? [] : [];
        if (subs.length === 0) {
          setMensApiPayload(null);
          return;
        }
        const mid = Math.ceil(subs.length / 2);
        setMensApiPayload({
          mensSectionSubs: subs.slice(0, mid),
          interestSubs: subs.slice(mid),
        });
      } catch {
        if (!cancelled) {
          setMensApiError("Could not load men's sportswear");
          setMensApiPayload(null);
        }
      } finally {
        if (!cancelled) setMensApiLoading(false);
      }
    };

    void Promise.all([
      loadAccessoryCategory(),
      loadFootwearCategory(),
      loadWomensSportswearCategory(),
      loadMensSportswearCategory(),
    ]);
    return () => {
      cancelled = true;
    };
  }, []);

  const lookbookScales = useRef(banners.map(() => new Animated.Value(1)));
  /** One page per banner; scrollTo x = index * width */
  const DEALS_BANNER_PAGE_W = width;

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

  const scrollToSportswearDeals = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const run = () => {
      const inner = (
        scroll as unknown as { getInnerViewRef?: () => View | null }
      ).getInnerViewRef?.();
      const target = productsToBuyRef.current;
      if (inner && target) {
        target.measureLayout(
          inner,
          (_x, y) => {
            scroll.scrollTo({
              x: 0,
              y: Math.max(0, y - 16),
              animated: true,
            });
          },
          () => {
            scroll.scrollTo({
              x: 0,
              y: Math.max(0, productsToBuyY.current),
              animated: true,
            });
          }
        );
        return;
      }
      scroll.scrollTo({
        x: 0,
        y: Math.max(0, productsToBuyY.current),
        animated: true,
      });
    };

    requestAnimationFrame(run);
  }, []);

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

  const scrollToAthletesPlaybook = useCallback(() => {
    scrollRef.current?.scrollTo({ y: athletesPlaybookY.current, animated: true });
  }, []);

  useEffect(() => {
    const n = dealsCarouselItems.length;
    if (n === 0) return undefined;
    const interval = setInterval(() => {
      setSportswearDealsBannerIndex((prev) => {
        const next = (prev + 1) % n;
        sportswearDealsBannerScrollRef.current?.scrollTo({
          x: next * DEALS_BANNER_PAGE_W,
          animated: true,
        });
        return next;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [DEALS_BANNER_PAGE_W, dealsCarouselItems.length]);


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
    const n = spreadsForPlaybook.length;
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
  }, [spreadsForPlaybook.length]);

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
      <View style={styles.header}>
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
      <Image
        source={require("../assets/images/sportswear.png")}
        style={styles.bannerImage}
      />

      {/* top category buttons on banner */}
      <View style={styles.bannerTopButtonsRow}>
        <TouchableOpacity
          style={styles.bannerTopBtn}
          activeOpacity={0.9}
          onPress={scrollToSpotlightFootwear}
        >
          <Text style={styles.bannerTopBtnText}>Sports footwear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bannerTopBtn}
          activeOpacity={0.9}
          onPress={scrollToShopByStore}
        >
          <Text style={styles.bannerTopBtnText}>Women's sports wear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bannerTopBtn}
          activeOpacity={0.9}
          onPress={scrollToMensSportsWear}
        >
          <Text style={styles.bannerTopBtnText}>Mens sports wear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bannerTopBtn}
          activeOpacity={0.9}
          onPress={scrollToAthletesPlaybook}
        >
          <Text style={styles.bannerTopBtnText}>Accessories</Text>
        </TouchableOpacity>
      </View>

      {/* explore deals button inside banner */}
      <TouchableOpacity
        style={styles.bannerExploreBtn}
        activeOpacity={0.9}
        onPress={scrollToSportswearDeals}
      >
        <Text style={styles.bannerExploreText}>Explore deals</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>


      

      {/* SHOP BY CATEGORY */}
      <View style={styles.glassDealsSection}>
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
                  ? scrollToAthletesPlaybook
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
                  ? scrollToAthletesPlaybook
                  : goShop
              }
            />
          </View>
        ))}
      </View>

      <View style={{ height: 25 }} />
  


      {/* POWER PICKS */}
      <View style={styles.powerSection}>
        <View style={styles.powerTitleRow}>
          <Text style={styles.powerTitle}>POWER PICKS</Text>
          <View style={styles.powerTitleLine} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
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
          ].map((card) => {
            const scale = new Animated.Value(1);
            return (
              <TouchableOpacity
                key={card.id}
                activeOpacity={0.95}
                onPressIn={() => {
                  Animated.spring(scale, {
                    toValue: 1.05,
                    useNativeDriver: true,
                    speed: 18,
                    bounciness: 6,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                    speed: 18,
                    bounciness: 6,
                  }).start();
                }}
                onPress={goShop}
              >
                <Animated.View style={[styles.powerCard, { transform: [{ scale }] }]}>
                  <Image source={card.img} style={styles.powerImage} />

                  <View style={styles.powerTagRow}>
                    <Text style={styles.powerTag}>{card.label}</Text>
                  </View>

                  <View style={styles.powerOfferTag}>
                    <Text style={styles.powerOfferText}>{card.offer}</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
                Math.max(0, spreadsForPlaybook.length - 1)
              )
            );
          }}
        >
          {spreadsForPlaybook.map((spread, spreadIndex) => {
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
          {spreadsForPlaybook.map((_, i) => (
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



     <View style={styles.trendsSection}>
  <View style={styles.trendsTitleRow}>
    <Text style={styles.trendsTitle}>Accessories</Text>
    {accessoryApiLoading ? (
      <ActivityIndicator size="small" color="#666" style={{ marginLeft: 8 }} />
    ) : null}
  </View>
  {accessoryApiError ? (
    <Text style={styles.accessoryApiErrorText}>{accessoryApiError}</Text>
  ) : null}

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={195} // card width + margin
    decelerationRate="fast"
    snapToAlignment="start"
    disableIntervalMomentum={true}
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {accessoriesFromApi && accessoriesFromApi.length > 0 ? (
      accessoriesFromApi.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.trendCard}
          activeOpacity={0.9}
          onPress={goShop}
        >
          <Image
            source={{ uri: getPublicImageUrl(item.image) }}
            style={styles.trendImage}
          />
          <View style={styles.trendOverlay}>
            <Text style={styles.trendBrand} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.trendPrice}>Shop now</Text>
          </View>
        </TouchableOpacity>
      ))
    ) : (
      <>
        <TouchableOpacity style={styles.trendCard} onPress={goShop}>
          <Image
            source={require("../assets/images/sports2.png")}
            style={styles.trendImage}
          />
          <View style={styles.trendOverlay}>
            <Text style={styles.trendBrand}>DNMX • NETPLAY</Text>
            <Text style={styles.trendPrice}>UNDER ₹399*</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.trendCard} onPress={goShop}>
          <Image
            source={require("../assets/images/sports4.png")}
            style={styles.trendImage}
          />
          <View style={styles.trendOverlay}>
            <Text style={styles.trendBrand}>YOUSTA</Text>
            <Text style={styles.trendPrice}>UNDER ₹399*</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trendCard} onPress={goShop}>
          <Image
            source={require("../assets/images/sports1.png")}
            style={styles.trendImage}
          />
          <View style={styles.trendOverlay}>
            <Text style={styles.trendBrand}>JOHN PLAYERS</Text>
            <Text style={styles.trendPrice}>MIN. 65% OFF</Text>
          </View>
        </TouchableOpacity>
      </>
    )}
  </ScrollView>
</View>






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
  >
    <View style={styles.storeOverlay}>
      <View style={styles.storeTitleRow}>
        <Text style={styles.storeTitle}>WOMEN SPORTS WEAR</Text>
        {womensApiLoading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ marginLeft: 10 }}
          />
        ) : null}
      </View>

      <TouchableOpacity onPress={goShop}>
        <Text style={styles.storeShopAll}>Shop All</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>

  {womensApiError ? (
    <Text style={styles.womensApiErrorText}>{womensApiError}</Text>
  ) : null}

  {/* 🔶 HORIZONTAL SCROLL */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={130}
    decelerationRate="fast"
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {womenStoreSectionItems.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.storeCard}
        onPress={goShop}
        activeOpacity={0.9}
      >
        <View style={styles.storeImageWrapper}>
          <Image source={item.image} style={styles.storeImage} />
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
    {womensApiLoading ? (
      <ActivityIndicator
        size="small"
        color="#333"
        style={{ marginLeft: 8 }}
      />
    ) : null}
  </View>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={width * 0.75}
    decelerationRate="fast"
  >
    {womensApiPayload?.lookbookSubs?.length ? (
      lookbookSectionItems.map((item) => (
        <View key={item.id} style={styles.cardWrapper}>
          <TouchableOpacity activeOpacity={0.95} onPress={goShop}>
            <View style={styles.redFrame}>
              <Image source={item.image} style={styles.lookbookImage} />
            </View>
          </TouchableOpacity>
        </View>
      ))
    ) : (
      banners.map((img, index) => (
        <View key={index} style={styles.cardWrapper}>
          <TouchableOpacity
            activeOpacity={0.95}
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
              <Image source={img} style={styles.lookbookImage} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      ))
    )}
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
  >
    <View style={styles.bannerOverlay}>
      <View style={styles.bannerTitleRow}>
        <Text style={styles.bannerTitle}>MEN&apos;S SPORTS WEAR</Text>
        {mensApiLoading ? (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={{ marginLeft: 10 }}
          />
        ) : null}
      </View>

      <TouchableOpacity onPress={goShop}>
        <Text style={styles.shopAll}>Shop All</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>

  {mensApiError ? (
    <Text style={styles.mensApiErrorText}>{mensApiError}</Text>
  ) : null}

  {/* 🔶 SCROLLING PRODUCTS */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={170}
    decelerationRate="fast"
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {mensWesternProductItems ? (
      mensWesternProductItems.map((item, index) => {
        const scale = [womensCardScale1, womensCardScale2, womensCardScale3][
          index % 3
        ];
        return (
          <Animated.View
            key={item.id}
            style={{ transform: [{ scale }] }}
          >
            <TouchableOpacity
              style={styles.productCard}
              onPressIn={() => pressIn(scale)}
              onPressOut={() => pressOut(scale)}
              activeOpacity={0.95}
              onPress={goShop}
            >
              <Image source={item.image} style={styles.productImage} />
              <View style={styles.productOverlay}>
                <Text style={styles.productText}>{item.title}</Text>
              </View>
              <Text style={styles.productOffer}>MIN. 60% OFF*</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })
    ) : (
      <>
        <Animated.View style={{ transform: [{ scale: womensCardScale1 }] }}>
          <TouchableOpacity
            style={styles.productCard}
            onPressIn={() => pressIn(womensCardScale1)}
            onPressOut={() => pressOut(womensCardScale1)}
            activeOpacity={0.95}
            onPress={goShop}
          >
            <Image
              source={require("../assets/images/greensport1.png")}
              style={styles.productImage}
            />
            <View style={styles.productOverlay}>
              <Text style={styles.productText}>Tops, T shirts & Shirts</Text>
            </View>
            <Text style={styles.productOffer}>MIN. 60% OFF*</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: womensCardScale2 }] }}>
          <TouchableOpacity
            style={styles.productCard}
            onPressIn={() => pressIn(womensCardScale2)}
            onPressOut={() => pressOut(womensCardScale2)}
            activeOpacity={0.95}
            onPress={goShop}
          >
            <Image
              source={require("../assets/images/yellowsport2.png")}
              style={styles.productImage}
            />
            <View style={styles.productOverlay}>
              <Text style={styles.productText}>Jeans</Text>
            </View>
            <Text style={styles.productOffer}>MIN. 60% OFF*</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: womensCardScale3 }] }}>
          <TouchableOpacity
            style={styles.productCard}
            onPressIn={() => pressIn(womensCardScale3)}
            onPressOut={() => pressOut(womensCardScale3)}
            activeOpacity={0.95}
            onPress={goShop}
          >
            <Image
              source={require("../assets/images/whitesport2.png")}
              style={styles.productImage}
            />
            <View style={styles.productOverlay}>
              <Text style={styles.productText}>Trousers</Text>
            </View>
            <Text style={styles.productOffer}>MIN. 65% OFF*</Text>
          </TouchableOpacity>
        </Animated.View>
      </>
    )}
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
      {mensApiLoading ? (
        <ActivityIndicator
          size="small"
          color="#333"
          style={{ marginLeft: 10 }}
        />
      ) : null}
    </View>

    <View style={styles.centerWrapper}>
      {/* CENTER CIRCLE */}
      <View style={[styles.circle, styles.centerCircle]}>
        <Image
          source={mensInterestsList[0]!.img}
          style={styles.circleImage}
        />
        <Text style={styles.circleText}>{mensInterestsList[0]!.name}</Text>
      </View>

      {/* ORBITING CIRCLES */}
      <Animated.View
        style={[
          styles.orbitContainer,
          { transform: [{ rotate }] },
        ]}
      >
        {mensInterestsList.slice(1).map((item, index) => {
          const total = mensInterestsList.length;
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
              <Image source={item.img} style={styles.circleImage} />
              <Text style={styles.circleText}>{item.name}</Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  </View>

  {/* spotlight cards section (below interest) */}
  <View
    style={styles.spotlightSection}
    onLayout={(e) => {
      spotlightFootwearY.current = e.nativeEvent.layout.y;
    }}
  >
    <View style={styles.spotlightTitleRow}>
      <View style={styles.spotlightTitlePill}>
        <Text style={styles.spotlightTitle}>SPORTS FOOTWEAR</Text>
      </View>
      {footwearApiLoading ? (
        <ActivityIndicator
          size="small"
          color="#ff6f00"
          style={{ marginLeft: 10 }}
        />
      ) : null}
    </View>
    {footwearApiError ? (
      <Text style={styles.footwearApiErrorText}>{footwearApiError}</Text>
    ) : null}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={width * 0.42 + 14}
      decelerationRate="fast"
      contentContainerStyle={styles.spotlightScroll}
    >
      {spotlightSectionItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.9}
          style={styles.spotlightCard}
          onPress={goShop}
        >
          <Image source={item.image} style={styles.spotlightImage} />
          <Text style={styles.spotlightCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>

{/* trending cards */}



{/* deals section */}
<View style={styles.heroDealsOnlyWrap}>
  <TouchableOpacity onPress={goShop} activeOpacity={0.9}>
    <View style={styles.sportswearDealsBtn}>
      <Text style={styles.sportswearDealsBtnText}>Sportswear deals</Text>
      <Ionicons name="chevron-forward" size={18} color="#fff" />
    </View>
  </TouchableOpacity>
      </View>

      {/* Sportswear deals banners — full-width paging; back / forward scroll one image */}
      <View style={styles.angledWrap}>
        <ScrollView
          ref={sportswearDealsBannerScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={(e) => {
            const page = Math.round(
              e.nativeEvent.contentOffset.x / DEALS_BANNER_PAGE_W
            );
            const max = dealsCarouselItems.length - 1;
            setSportswearDealsBannerIndex(Math.max(0, Math.min(page, max)));
          }}
        >
          {dealsCarouselItems.map((item) => (
            <View
              key={item.id}
              style={{
                width: DEALS_BANNER_PAGE_W,
                paddingHorizontal: 14,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={goShop}
                accessibilityRole="button"
                accessibilityLabel="Open sportswear deal"
              >
                <View style={styles.angledCard}>
                  <Image source={item.image} style={styles.angledImage} />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.angledNavRow}>
          <TouchableOpacity
            style={styles.angledNavBtn}
            activeOpacity={0.85}
            onPress={() => {
              setSportswearDealsBannerIndex((prev) => {
                const next = Math.max(0, prev - 1);
                sportswearDealsBannerScrollRef.current?.scrollTo({
                  x: next * DEALS_BANNER_PAGE_W,
                  animated: true,
                });
                return next;
              });
            }}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.angledDotsRow}>
            {dealsCarouselItems.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.angledDot,
                  i === sportswearDealsBannerIndex ? styles.angledDotActive : null,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.angledNavBtn}
            activeOpacity={0.85}
            onPress={() => {
              const last = dealsCarouselItems.length - 1;
              setSportswearDealsBannerIndex((prev) => {
                const next = Math.min(last, prev + 1);
                sportswearDealsBannerScrollRef.current?.scrollTo({
                  x: next * DEALS_BANNER_PAGE_W,
                  animated: true,
                });
                return next;
              });
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* (removed old promo grid + L-shape section; replaced by angled carousel above) */}

      {/* products to buy (bottom section) */}
      <View
        ref={productsToBuyRef}
        style={styles.ptbSection}
        onLayout={(e) => {
          productsToBuyY.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.ptbHeaderRow}>
          <Text style={styles.ptbTitle}>Products to buy</Text>
          <TouchableOpacity onPress={goShop} activeOpacity={0.9}>
            <Text style={styles.ptbSeeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ptbScroll}
        >
          {PRODUCTS_TO_BUY.map((p) => (
            <View key={p.id} style={styles.ptbCard}>
              <Image source={p.image} style={styles.ptbImage} />
              <Text style={styles.ptbName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.ptbPrice}>{p.price}</Text>
              <TouchableOpacity
                style={styles.ptbBtn}
                activeOpacity={0.9}
                onPress={() => router.push("/cart")}
              >
                <Text style={styles.ptbBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
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
    marginTop: StatusBar.currentHeight || 20,
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
    height: height * 0.6,
    position: "relative",
  },

  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: "#ff6f00",
  },

  powerTitleRow: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 15,
  },
  powerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  powerTitleLine: {
    height: 2,
    width: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  powerCard: {
    width: 260,
    height: 320,
    marginRight: 15,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  powerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  powerTagRow: {
    position: "absolute",
    left: 12,
    top: 12,
  },
  powerTag: {
    color: "#111",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    letterSpacing: 0.4,
  },
  powerOfferTag: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  powerOfferText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  /* The Athlete's Playbook */
  springBookOuter: {
  marginTop: 26,              // थोड़ा spacing बढ़ाया
  marginHorizontal: 10,       // side से थोड़ा ज्यादा width मिलेगा
  marginBottom: 12,
  
  maxWidth: NOTEBOOK_MAX_W + 20, // 👉 width बढ़ाया
  alignSelf: "center",
  width: "100%",

  backgroundColor: "skyblue",
  borderRadius: 20,

  paddingVertical: 22,        // 👉 height feel बढ़ाने के लिए
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

  /* Glass-style vertical deals (below playbook) */
  glassDealsSection: {
    backgroundColor: "#1d324e",
    marginTop: 6,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 10,
  },

  glassDealsSectionTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#ece2d5",
    marginBottom: 16,
    letterSpacing: 0.3,
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
    height:300,
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

  trendsSection: {
  marginTop: 10,
  paddingVertical: 20,
  backgroundColor: "#1a0000",
},

  trendsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginLeft: 12,
  },

trendsTitle: {
  color: "#111",
  fontSize: 20,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 2,
  paddingHorizontal: 14,
  paddingVertical: 8,
  alignSelf: "flex-start",
  borderRadius: 999,
  backgroundColor: "rgba(255,255,255,0.95)",
  borderWidth: 2,
  borderColor: "#ff6f00",
},

  accessoryApiErrorText: {
    color: "#ffcdd2",
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 10,
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

mensApiErrorText: {
  color: "#b71c1c",
  fontSize: 12,
  marginHorizontal: 16,
  marginBottom: 8,
  textAlign: "center",
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

womensApiErrorText: {
  color: "#b71c1c",
  fontSize: 12,
  marginHorizontal: 16,
  marginBottom: 8,
  textAlign: "center",
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

  spotlightSection: {
    marginTop: 34,
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
  footwearApiErrorText: {
    color: "#b71c1c",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
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
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: "#fff",
  },
  ptbHeaderRow: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ptbTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
    letterSpacing: 0.2,
  },
  ptbSeeAll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ff6f00",
  },
  ptbScroll: {
    paddingHorizontal: 14,
    gap: 12,
    paddingRight: 20,
  },
  ptbCard: {
    width: 150,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
  },
  ptbImage: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#f3f3f3",
    marginBottom: 8,
  },
  ptbName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  ptbPrice: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  ptbBtn: {
    height: 34,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  ptbBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.3,
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

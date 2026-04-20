import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import api, { searchProductsPath, searchSuggestionsPath } from "../services/api";
import { pickProductImageUriFromApi } from "../lib/pickProductImageUri";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

/** Dry sweets — Dry fruit laddu (and siblings under same API subcategory). */
const DRY_DRYFRUIT_LADDU_SUBCATEGORY_ID = 142;
const SWEETS_PRODUCTS_BY_SUBCATEGORY_ENDPOINT = (subcategoryId: number) =>
  `/api/products/subcategory/${subcategoryId}`;

type SweetsSubItem = {
  id: string;
  name: string;
  note: string;
  color: string;
  image?: any; // local require(...) or { uri }
};

const DRY_SWEET_TILE_COLORS = ["#FFE7D4", "#FFF2C9", "#EAFBF2", "#F4E9FF"];

/** Static dry-sweets tiles (no API). */
const DRY_SUBS_FALLBACK: SweetsSubItem[] = [
  {
    id: "d1",
    name: "Sununda",
    note: "Traditional dry sweet",
    color: "#FFE7D4",
    image: require("../assets/sweetsimages/sununda.jpg"),
  },
  {
    id: "d2",
    name: "Boondi Laddus",
    note: "Classic boondi laddu",
    color: "#FFF2C9",
    image: require("../assets/sweetsimages/laddu.jpg"),
  },
  {
    id: "d3",
    name: "Dryfruit Laddus",
    note: "Nuts & dry fruits",
    color: "#EAFBF2",
    image: require("../assets/sweetsimages/dry fruit laddu.jpg"),
  },
];

const MILK_SWEET_TILE_COLORS = ["#FFE7D4", "#F4E9FF", "#FFF2C9", "#EAFBF2"];

/** Static milk-sweets tiles (no API). */
const MILK_SUBS_FALLBACK: SweetsSubItem[] = [
  {
    id: "m1",
    name: "Gulab Jamun",
    note: "Warm syrupy",
    color: "#FFE7D4",
    image: require("../assets/sweetsimages/jamun.jpg"),
  },
  {
    id: "m2",
    name: "Kalakand",
    note: "Milky fudge",
    color: "#F4E9FF",
    image: require("../assets/sweetsimages/48.png"),
  },
];

/** Product tiles for the bottom grid — ids `sw*` are registered in `productdetail` ALL_PRODUCTS. */
type SweetsHubProduct = {
  id: string;
  name: string;
  tag: string;
  price: number;
  rating: number;
  image: any;
};

const RELATED_SWEETS_PRODUCTS: SweetsHubProduct[] = [
  {
    id: "sw1",
    name: "Festive Gulab Jamun",
    tag: "Milk sweets",
    price: 449,
    rating: 4.7,
    image: require("../assets/sweetsimages/jamun.jpg"),
  },
  {
    id: "sw2",
    name: "Boondi Laddu Pack",
    tag: "Dry sweets",
    price: 399,
    rating: 4.5,
    image: require("../assets/sweetsimages/laddu.jpg"),
  },
  {
    id: "sw3",
    name: "Sununda Special",
    tag: "Traditional",
    price: 329,
    rating: 4.6,
    image: require("../assets/sweetsimages/sununda.jpg"),
  },
  {
    id: "sw4",
    name: "Dry Fruit Laddu",
    tag: "Premium nuts",
    price: 549,
    rating: 4.8,
    image: require("../assets/sweetsimages/dry fruit laddu.jpg"),
  },
  {
    id: "sw5",
    name: "Milk Kalakand",
    tag: "Milk sweets",
    price: 479,
    rating: 4.4,
    image: require("../assets/sweetsimages/48.png"),
  },
  {
    id: "sw6",
    name: "Assorted Mithai Box",
    tag: "Gift box",
    price: 899,
    rating: 4.7,
    image: require("../assets/sweetsimages/49.png"),
  },
  {
    id: "sw7",
    name: "Signature Asvi Collection",
    tag: "House special",
    price: 649,
    rating: 4.6,
    image: require("../assets/sweetsimages/Asvi.png"),
  },
];

export default function Sweets() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const scrollRef = useRef<ScrollView>(null);
  const bannerListRef = useRef<any>(null);
  const midBannerListRef = useRef<any>(null);
  const bannerScrollX = useRef(new Animated.Value(0)).current;
  const midBannerScrollX = useRef(new Animated.Value(0)).current;
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeMidBanner, setActiveMidBanner] = useState(0);
  const bannerItemW = width;
  const midBannerGap = 12;
  const midBannerCardW = Math.min(280, width - 56);
  const midBannerItemW = midBannerCardW + midBannerGap;
  const MENU_BAR_HEIGHT = 62;
  const [headerHeight, setHeaderHeight] = useState(96);
  const HEADER_FAVICON = require("../assets/images/fntfav.png");

  const bottomVideoPlayer = useVideoPlayer(require("../assets/images/videobanner.mp4"), (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const bottomVideoHeight = Math.min(280, Math.round(width * 0.52));

  type CategoryKey = "dry" | "milk";
  const [active, setActive] = useState<CategoryKey>("dry");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [drySubcategories, setDrySubcategories] =
    useState<SweetsSubItem[]>(DRY_SUBS_FALLBACK);
  const [milkSubcategories, setMilkSubcategories] =
    useState<SweetsSubItem[]>(MILK_SUBS_FALLBACK);

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
      // Map API response to simple format for sweets
      const mappedResults = Array.isArray(data) ? data.slice(0, 10).map((item: any) => ({
        id: String(item.id),
        name: item.name || item.productName || item.title || `Product ${item.id}`,
        imageUri: item.images?.[0]?.imagePath || "",
        sellingPrice: item.sellingPrice || item.price || 0,
        mrpPrice: item.mrpPrice || item.maxRetailPrice || 0,
        discountPercentage: item.discountPercentage || 0,
        rating: item.rating || 0,
      })) : [];
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
      if (query.trim()) {
        handleSearch(query);
      } else {
        setShowSearchResults(false);
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);
  const [categoryIconUrls, setCategoryIconUrls] = useState<
    Partial<Record<CategoryKey, string>>
  >({});

  type DrySpotlightProduct = {
    id: string;
    name: string;
    imageUri: string;
    sellingPrice: number;
    mrpPrice: number;
    discountLabel: string;
    ratingLabel: string;
  };

  const [drySpotlightProducts, setDrySpotlightProducts] = useState<DrySpotlightProduct[]>([]);
  const [drySpotlightLoading, setDrySpotlightLoading] = useState(true);

  const sectionY = useRef<Record<CategoryKey, number>>({
    dry: 0,
    milk: 0,
  });

  const CATEGORIES: { key: CategoryKey; label: string; image: any }[] = useMemo(
    () => [
      {
        key: "dry",
        label: "Dry Sweets",
        image:
          categoryIconUrls.dry ??
          require("../assets/sweetsimages/dry fruit laddu.jpg"),
      },
      {
        key: "milk",
        label: "Milk Sweets",
        image: categoryIconUrls.milk ?? require("../assets/sweetsimages/jamun.jpg"),
      },
    ],
    [categoryIconUrls.dry, categoryIconUrls.milk]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Your endpoint returns: [{ categoryName: "Dry Sweets"|"Milk Sweets", mobileImage: "https://..." }, ...]
        const res = await api.get(
          "/api/categories/53/subcategories"
        );
        const data = res.data as Array<{
          categoryName?: string;
          mobileImage?: string | null;
        }>;

        const next: Partial<Record<CategoryKey, string>> = {};
        for (const item of Array.isArray(data) ? data : []) {
          const name = (item?.categoryName ?? "").trim().toLowerCase();
          const url = item?.mobileImage ?? undefined;
          if (!url) continue;
          if (name === "dry sweets") next.dry = url;
          if (name === "milk sweets") next.milk = url;
        }

        if (alive && (next.dry || next.milk)) setCategoryIconUrls(next);
      } catch {
        // keep local fallback images
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(
          "/api/categories/55/subcategories-table"
        );
        const data = res.data as Array<{
          categoryName?: string;
          mobileImage?: string | null;
          subcategories?: Array<{
            id?: number;
            name?: string;
            mobileImage?: string | null;
          }>;
        }>;

        const dry = (Array.isArray(data) ? data : []).find(
          (x) => (x?.categoryName ?? "").trim().toLowerCase() === "dry sweets"
        );
        const subs = dry?.subcategories ?? [];
        const mapped: SweetsSubItem[] = subs
          .filter((s) => !!s && typeof s.name === "string" && !!s.mobileImage)
          .map((s, idx) => ({
            id: String(s.id ?? `dry-${idx}`),
            name: s.name as string,
            note: "Dry sweet",
            color: DRY_SWEET_TILE_COLORS[idx % DRY_SWEET_TILE_COLORS.length],
            image: { uri: s.mobileImage as string },
          }));

        if (alive && mapped.length) setDrySubcategories(mapped);
      } catch {
        // keep local fallback dry tiles
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(
          "/api/categories/56/subcategories-table"
        );
        const data = res.data as Array<{
          categoryName?: string;
          mobileImage?: string | null;
          subcategories?: Array<{
            id?: number;
            name?: string;
            mobileImage?: string | null;
          }>;
        }>;

        const milk = (Array.isArray(data) ? data : []).find(
          (x) => (x?.categoryName ?? "").trim().toLowerCase() === "milk sweets"
        );
        const subs = milk?.subcategories ?? [];
        const mapped: SweetsSubItem[] = subs
          .filter((s) => !!s && typeof s.name === "string" && !!s.mobileImage)
          .map((s, idx) => ({
            id: String(s.id ?? `milk-${idx}`),
            name: s.name as string,
            note: "Milk sweet",
            color: MILK_SWEET_TILE_COLORS[idx % MILK_SWEET_TILE_COLORS.length],
            image: { uri: s.mobileImage as string },
          }));

        if (alive && mapped.length) setMilkSubcategories(mapped);
      } catch {
        // keep local fallback milk tiles
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const pickProductImageUri = (p: any): string | null =>
    pickProductImageUriFromApi(p, getAssetUriFromApiPath);

  const pickVariantNumbers = (p: any): {
    selling: number;
    mrp: number;
    discountPct: number | null;
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
    return {
      selling: Math.max(0, Math.round(selling)),
      mrp: Math.max(Math.round(selling), Math.round(mrp)),
      discountPct,
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

  const mapApiRowToDrySpotlight = (p: any): DrySpotlightProduct | null => {
    if (!p || typeof p.id !== "number" || typeof p.name !== "string") return null;
    const st = String(p.status ?? "").trim().toLowerCase();
    if (st && st !== "active") return null;
    const imageUri = pickProductImageUri(p);
    if (!imageUri) return null;
    const { selling, mrp, discountPct } = pickVariantNumbers(p);
    const discountLabel =
      discountPct != null && Number.isFinite(discountPct)
        ? `${Number(discountPct).toFixed(1).replace(/\.0$/, "")}% off`
        : "Deal";
    return {
      id: String(p.id),
      name: safeText(p.name),
      imageUri,
      sellingPrice: selling,
      mrpPrice: mrp,
      discountLabel,
      ratingLabel: pickRatingLabel(p),
    };
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setDrySpotlightLoading(true);
        const { data } = await api.get(
          SWEETS_PRODUCTS_BY_SUBCATEGORY_ENDPOINT(DRY_DRYFRUIT_LADDU_SUBCATEGORY_ID)
        );
        if (!alive) return;
        if (!Array.isArray(data)) {
          setDrySpotlightProducts([]);
          return;
        }
        const mapped = (data as unknown[])
          .map((row) => mapApiRowToDrySpotlight(row))
          .filter(Boolean) as DrySpotlightProduct[];
        setDrySpotlightProducts(mapped);
      } catch {
        if (alive) setDrySpotlightProducts([]);
      } finally {
        if (alive) setDrySpotlightLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const BANNERS = useMemo(
    () => [
      { id: "b1", image: require("../assets/sweetsimages/48.png") },
      { id: "b2", image: require("../assets/sweetsimages/49.png") },
      { id: "b3", image: require("../assets/sweetsimages/Asvi.png") },
    ],
    []
  );

  /** Promo strip between Dry and Milk — smaller cards, same scroll-scale animation as hero */
  const MID_PROMO_BANNERS = useMemo(
    () => [
      { id: "p1", image: require("../assets/sweetsimages/jamun.jpg"), title: "Festive box", subtitle: "Limited time" },
      { id: "p2", image: require("../assets/sweetsimages/49.png"), title: "Bulk sweets", subtitle: "Wholesale picks" },
      { id: "p3", image: require("../assets/sweetsimages/laddu.jpg"), title: "Gift hampers", subtitle: "Ready to ship" },
    ],
    []
  );

  useEffect(() => {
    if (!BANNERS.length) return;
    const t = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerListRef.current?.scrollToOffset?.({ offset: next * bannerItemW, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [BANNERS.length, bannerItemW]);

  useEffect(() => {
    if (!MID_PROMO_BANNERS.length) return;
    const t = setInterval(() => {
      setActiveMidBanner((prev) => {
        const next = (prev + 1) % MID_PROMO_BANNERS.length;
        midBannerListRef.current?.scrollToOffset?.({ offset: next * midBannerItemW, animated: true });
        return next;
      });
    }, 4200);
    return () => clearInterval(t);
  }, [MID_PROMO_BANNERS.length, midBannerItemW]);

  const SUB: Record<CategoryKey, SweetsSubItem[]> = useMemo(
    () => ({
      dry: drySubcategories,
      milk: milkSubcategories,
    }),
    [drySubcategories, milkSubcategories]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUB;
    const out = { ...SUB };
    (Object.keys(out) as CategoryKey[]).forEach((k) => {
      out[k] = out[k].filter((x) => x.name.toLowerCase().includes(q));
    });
    return out;
  }, [SUB, query]);

  const relatedSweetsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RELATED_SWEETS_PRODUCTS;
    return RELATED_SWEETS_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
    );
  }, [query]);

  const scrollTo = (key: CategoryKey) => {
    setActive(key);
    const y = sectionY.current[key] ?? 0;
    // Align section header just below the fixed header + tabs bar.
    const offset = headerHeight + MENU_BAR_HEIGHT + 10;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - offset), animated: true });
  };

  const handleSweetsSubcategoryPress = (section: CategoryKey, item: SweetsSubItem) => {
    const numericSubcategoryId = Number.parseInt(String(item.id), 10);
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: section === "dry" ? "sweets-dry" : "sweets-milk",
        subCategory: item.name,
        subcategoryId:
          Number.isFinite(numericSubcategoryId) && numericSubcategoryId > 0
            ? String(numericSubcategoryId)
            : undefined,
      },
    });
  };

  const renderCategorySection = (key: CategoryKey) => (
    <View
      key={key}
      onLayout={(e) => {
        sectionY.current[key] = e.nativeEvent.layout.y;
      }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{CATEGORIES.find((x) => x.key === key)?.label}</Text>
        <Text style={styles.sectionCount}>{(filtered[key] ?? []).length} items</Text>
      </View>

      <View style={styles.grid}>
        {(filtered[key] ?? []).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              !!item.image && styles.tileCard,
              { backgroundColor: item.color, width: (width - 10 * 2 - 10) / 2 },
            ]}
            activeOpacity={0.9}
            onPress={() => handleSweetsSubcategoryPress(key, item)}
          >
            {!!item.image ? (
              <View style={styles.tileWrap}>
                <ImageBackground source={item.image} style={styles.tileImage} imageStyle={styles.tileImageInner}>
                  <View style={styles.tileTint} />
                  <View style={styles.tileScrim} />
                  <View style={styles.tileLabelRow}>
                    <Text style={styles.tileLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                </ImageBackground>
              </View>
            ) : (
              <>
                <View style={styles.cardTop}>
                  <Ionicons name="sparkles" size={18} color="#1d324e" />
                  <Text style={styles.badge}>NEW</Text>
                </View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardNote}>{item.note}</Text>
                <View style={styles.cardBottomRow}>
                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>From Rs 199</Text>
                  </View>
                  <View style={styles.addBtn}>
                    <Ionicons name="add" size={18} color="#ffffff" />
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed header (like Footwear) */}
      <View style={styles.headerRow} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <TouchableOpacity
          style={styles.headerLeading}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          activeOpacity={0.8}
        >
          <Image source={HEADER_FAVICON} style={styles.faviconImage} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#1d324e" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search.."
            placeholderTextColor="#8D97AA"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => {
              if (query.trim()) {
                router.push({ pathname: "/searchresults", params: { q: query } });
              }
            }}
          />
          <Ionicons name="camera-outline" size={18} color="#72809A" />
        </View>

        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="heart-outline" size={22} color="#1D2430" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Ionicons name="bag-outline" size={22} color="#1D2430" />
        </TouchableOpacity>
      </View>

      {/* Sticky top menu bar (chips) */}
      <View style={[styles.topMenuBar, { top: headerHeight, minHeight: MENU_BAR_HEIGHT }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((c) => {
            const isActive = active === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, isActive && styles.chipActive]}
                activeOpacity={0.9}
                onPress={() => scrollTo(c.key)}
              >
                <View style={[styles.chipIconWrap, isActive && styles.chipIconWrapActive]}>
                  <Image
                    source={
                      typeof c.image === "string" ? { uri: c.image } : c.image
                    }
                    style={styles.chipIconImage}
                  />
                </View>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + MENU_BAR_HEIGHT + 2,
            paddingBottom: 24 + 92,
          },
        ]}
        onScroll={(e) => {
          // Pick the section whose header has crossed under the fixed header + tabs.
          const y =
            e.nativeEvent.contentOffset.y + headerHeight + MENU_BAR_HEIGHT + 24;
          let next: CategoryKey = "dry";
          (["dry", "milk"] as CategoryKey[]).forEach((k) => {
            if (y >= sectionY.current[k]) next = k;
          });
          if (next !== active) setActive(next);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.bannerWrap}>
          <Animated.FlatList
            ref={bannerListRef}
            data={BANNERS}
            keyExtractor={(x) => x.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={bannerItemW}
            snapToAlignment="start"
            contentContainerStyle={styles.bannerRow}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: bannerScrollX } } }], {
              useNativeDriver: true,
            })}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / bannerItemW);
              setActiveBanner(Math.max(0, Math.min(BANNERS.length - 1, idx)));
            }}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * bannerItemW,
                index * bannerItemW,
                (index + 1) * bannerItemW,
              ];
              const scale = bannerScrollX.interpolate({
                inputRange,
                outputRange: [0.92, 1, 0.92],
                extrapolate: "clamp",
              });
              const opacity = bannerScrollX.interpolate({
                inputRange,
                outputRange: [0.75, 1, 0.75],
                extrapolate: "clamp",
              });

              return (
                <Animated.View style={[styles.bannerItem, { transform: [{ scale }], opacity }]}>
                  <ImageBackground
                    source={item.image}
                    style={styles.banner}
                    imageStyle={styles.bannerImage}
                    blurRadius={index === activeBanner ? 0 : 10}
                  >
                    <View style={styles.bannerScrim} />
                  </ImageBackground>
                </Animated.View>
              );
            }}
          />
        </View>

       

        {renderCategorySection("dry")}

        <View style={styles.midPromoBlock}>
          <View style={styles.midPromoHeader}>
            <Text style={styles.midPromoTitle}>Deals & stories</Text>
            <Text style={styles.midPromoHint}>Opens like a book</Text>
          </View>
          <View style={styles.midPromoCarousel}>
            <Animated.FlatList
              ref={midBannerListRef}
              data={MID_PROMO_BANNERS}
              keyExtractor={(x) => x.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={midBannerItemW}
              snapToAlignment="start"
              contentContainerStyle={styles.midPromoList}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: midBannerScrollX } } }], {
                useNativeDriver: true,
              })}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / midBannerItemW);
                setActiveMidBanner(Math.max(0, Math.min(MID_PROMO_BANNERS.length - 1, idx)));
              }}
              renderItem={({ item, index }) => {
                const inputRange = [
                  (index - 1) * midBannerItemW,
                  index * midBannerItemW,
                  (index + 1) * midBannerItemW,
                ];
                const scale = midBannerScrollX.interpolate({
                  inputRange,
                  outputRange: [0.9, 1, 0.9],
                  extrapolate: "clamp",
                });
                const opacity = midBannerScrollX.interpolate({
                  inputRange,
                  outputRange: [0.65, 1, 0.65],
                  extrapolate: "clamp",
                });
                return (
                  <Animated.View
                    style={[
                      styles.midPromoItem,
                      { width: midBannerCardW, marginRight: midBannerGap, transform: [{ scale }], opacity },
                    ]}
                  >
                    <GiftOpeningPromoCard
                      item={item}
                      isActive={index === activeMidBanner}
                      cardWidth={midBannerCardW}
                    />
                  </Animated.View>
                );
              }}
            />
          </View>
          <View style={styles.midPromoDots}>
            {MID_PROMO_BANNERS.map((b, i) => (
              <View key={b.id} style={[styles.midPromoDot, i === activeMidBanner && styles.midPromoDotActive]} />
            ))}
          </View>
        </View>

        {renderCategorySection("milk")}

        <View style={styles.sweetsProductsSection}>
          <View style={styles.sweetsProductsHeaderRow}>
            <Text style={styles.sweetsProductsTitle}>Popular sweet picks</Text>
            <Text style={styles.sweetsProductsCount}>
              {relatedSweetsFiltered.length} items
            </Text>
          </View>
          <View style={styles.sweetsProductsGrid}>
            {relatedSweetsFiltered.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.sweetsProductCard}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/productdetail",
                    params: { id: product.id },
                  } as any)
                }
                accessibilityRole="button"
                accessibilityLabel={`${product.name}, view details`}
              >
                <View style={styles.sweetsProductInner}>
                  <Image source={product.image} style={styles.sweetsProductImage} />
                  <View style={styles.sweetsProductMeta}>
                    <Text style={styles.sweetsProductName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.sweetsProductTag}>{product.tag}</Text>
                    <View style={styles.sweetsProductBottomRow}>
                      <Text style={styles.sweetsProductPrice}>Rs {product.price}</Text>
                      <View style={styles.sweetsProductRatingPill}>
                        <Ionicons name="star" size={12} color="#c2410c" />
                        <Text style={styles.sweetsProductRatingText}>
                          {product.rating}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sweetsVideoSection}>
          <Text style={styles.sweetsVideoTitle}>Behind the sweets</Text>
          <View style={[styles.sweetsVideoWrap, { height: bottomVideoHeight }]}>
            <VideoView
              player={bottomVideoPlayer}
              style={styles.sweetsVideo}
              contentFit="cover"
              nativeControls={false}
            />
          </View>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F0" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#FFF7F0",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFF7F0",
    shadowColor: "#1d324e",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerLeading: {
    width: 32,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  faviconImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    resizeMode: "cover",
  },
  iconBtn: {
    marginLeft: 12,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  searchInput: { flex: 1, marginHorizontal: 8, fontSize: 13, color: "#1D324E" },
  topMenuBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 25,
    backgroundColor: "#FFF7F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFF7F0",
  },
  chipsRow: { paddingVertical: 6, paddingRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  chipActive: { backgroundColor: "#1d324e", borderColor: "#1d324e" },
  chipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(29,50,78,0.06)",
  },
  chipIconWrapActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chipIconImage: { width: "100%", height: "100%", resizeMode: "cover" },
  chipText: { marginLeft: 10, fontSize: 13, fontWeight: "900", color: "#1d324e" },
  chipTextActive: { color: "#ffffff" },
  content: { paddingHorizontal: 10, paddingBottom: 24 },
  bannerWrap: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  bannerRow: { paddingHorizontal: 0 },
  bannerItem: { marginRight: 0 },
  banner: { width: Dimensions.get("window").width, height: 200 },
  bannerImage: { resizeMode: "cover" },
  bannerScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  beautyPromoRow: {
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1d324e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  beautyPromoGradient: {
    borderRadius: 16,
    padding: 2,
  },
  beautyPromoInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(106,27,154,0.15)",
  },
  beautyPromoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  beautyPromoTextCol: { flex: 1 },
  beautyPromoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#311b92",
    letterSpacing: 0.2,
  },
  beautyPromoSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#5e35b1",
    opacity: 0.95,
  },
  midPromoBlock: {
    marginTop: 18,
    marginBottom: 4,
  },
  midPromoHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  midPromoTitle: { fontSize: 15, fontWeight: "900", color: "#1d324e" },
  midPromoHint: { fontSize: 11, fontWeight: "700", color: "#8a93a3" },
  midPromoCarousel: {
    borderRadius: 16,
    overflow: "visible",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    backgroundColor: "#fff",
  },
  midPromoList: {
    paddingTop: 28,
    paddingBottom: 14,
    paddingLeft: 10,
    paddingRight: 10,
  },
  midPromoItem: {
    borderRadius: 14,
    overflow: "visible",
  },
  midPromoCard: { borderRadius: 14, overflow: "hidden" },
  midPromoImage: {
    width: "100%",
    height: 132,
    justifyContent: "flex-end",
  },
  midPromoImageInner: { borderRadius: 14, resizeMode: "cover" },
  midPromoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 14,
  },
  midPromoTextCol: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    zIndex: 1,
  },
  midPromoCardTitle: { color: "#ffffff", fontSize: 15, fontWeight: "900" },
  midPromoCardSub: { color: "rgba(255,255,255,0.88)", fontSize: 11, fontWeight: "700", marginTop: 2 },
  midPromoDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  midPromoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(29,50,78,0.18)",
  },
  midPromoDotActive: {
    width: 18,
    backgroundColor: "#1d324e",
  },
  sweetsProductsSection: {
    marginTop: 18,
    marginBottom: 8,
  },
  sweetsProductsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sweetsProductsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1d324e",
    flex: 1,
    paddingRight: 8,
  },
  sweetsProductsCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5a6578",
  },
  sweetsProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sweetsProductCard: {
    width: "49%",
    borderRadius: 12,
    backgroundColor: "#ef7b1a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    padding: 1,
    marginBottom: 14,
    overflow: "visible",
  },
  sweetsProductInner: {
    flex: 1,
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "#FFFDF9",
    margin: 1,
  },
  sweetsProductImage: {
    width: "100%",
    height: 124,
    resizeMode: "cover",
    backgroundColor: "#FFFFFF",
  },
  sweetsProductMeta: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sweetsProductName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D2430",
    minHeight: 30,
  },
  sweetsProductTag: {
    marginTop: 2,
    fontSize: 11,
    color: "#6f7a8d",
    fontWeight: "600",
  },
  drySpotlightLoadingHint: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#5a6578",
  },
  sweetsProductPriceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  sweetsProductDiscountPill: {
    backgroundColor: "rgba(239,123,26,0.14)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sweetsProductDiscountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#b45309",
  },
  sweetsProductMrp: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  sweetsProductBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sweetsProductPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1d324e",
  },
  sweetsProductRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sweetsProductRatingText: {
    marginLeft: 3,
    fontSize: 11,
    fontWeight: "800",
    color: "#8A4E17",
  },
  giftBoxWrap: {
    borderRadius: 14,
    overflow: "visible",
    backgroundColor: "#2c1810",
    position: "relative",
  },
  giftInnerShine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 215, 120, 0.22)",
    borderRadius: 14,
  },
  giftBookCover: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 4,
    height: 132,
    backgroundColor: "#8f1d2f",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.2)",
    shadowColor: "#000",
    shadowOpacity: 0.38,
    shadowRadius: 8,
    shadowOffset: { width: 5, height: 3 },
    elevation: 9,
    backfaceVisibility: "hidden",
  },
  giftBookSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 11,
    backgroundColor: "#4a121c",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  giftBookGoldLine: {
    position: "absolute",
    left: 11,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: "#f1c40f",
    opacity: 0.9,
    borderRadius: 1,
  },
  giftBookBand: {
    position: "absolute",
    left: 20,
    right: 14,
    top: "36%",
    height: 22,
    backgroundColor: "rgba(241, 196, 15, 0.3)",
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(241, 196, 15, 0.5)",
  },
  giftBowOuter: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  giftBow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e74c3c",
    borderWidth: 2,
    borderColor: "#f1c40f",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  section: { marginTop: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#1d324e" },
  sectionCount: { fontSize: 12, fontWeight: "700", color: "#5a6578" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 0 },
  card: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.10)",
    overflow: "hidden",
  },
  tileCard: {
    padding: 0,
    borderWidth: 1,
    borderColor: "rgba(18, 13, 27, 0.35)",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff",
    backgroundColor: "#1d324e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tileWrap: {
    height: 140,
    width: "100%",
  },
  tileImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  tileImageInner: {
    resizeMode: "cover",
  },
  tileTint: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  tileScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    backgroundColor: "rgba(44, 39, 48, 0.48)",
  },
  tileLabelRow: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  tileLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardTitle: { marginTop: 10, fontSize: 14, fontWeight: "900", color: "#1d324e" },
  cardNote: { marginTop: 4, fontSize: 11, lineHeight: 15, color: "#5a6578", fontWeight: "700" },
  cardBottomRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pricePill: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  priceText: { fontSize: 11, fontWeight: "900", color: "#1d324e" },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#1d324e",
    alignItems: "center",
    justifyContent: "center",
  },
  footerSpace: { height: 22 },
  sweetsVideoSection: {
    marginTop: 18,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  sweetsVideoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1d324e",
    marginBottom: 10,
  },
  sweetsVideoWrap: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1a1520",
  },
  sweetsVideo: {
    width: "100%",
    height: "100%",
  },
});

type MidPromoItem = {
  id: string;
  image: any;
  title: string;
  subtitle: string;
};

/** Single front “cover” hinged on the left spine; opens with rotateY like turning a hardcover */
function GiftOpeningPromoCard({
  item,
  isActive,
  cardWidth,
}: {
  item: MidPromoItem;
  isActive: boolean;
  cardWidth: number;
}) {
  const coverOpen = useRef(new Animated.Value(0)).current;
  const bowScale = useRef(new Animated.Value(1)).current;
  const innerGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      coverOpen.setValue(0);
      bowScale.setValue(1);
      innerGlow.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(bowScale, {
            toValue: 0.08,
            duration: 190,
            useNativeDriver: true,
          }),
          Animated.spring(coverOpen, {
            toValue: 1,
            friction: 7,
            tension: 38,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(innerGlow, {
          toValue: 1,
          duration: 720,
          delay: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(coverOpen, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(bowScale, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(innerGlow, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isActive, coverOpen, bowScale, innerGlow]);

  const rotateY = coverOpen.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-100deg"],
  });

  const coverOpacity = coverOpen.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [1, 0.95, 0.48],
  });

  return (
    <View style={[styles.giftBoxWrap, { width: cardWidth, height: 132 }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        style={{
          width: cardWidth,
          height: 132,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <ImageBackground
          source={item.image}
          style={styles.midPromoImage}
          imageStyle={styles.midPromoImageInner}
          blurRadius={isActive ? 0 : 9}
        >
          <Animated.View style={[styles.giftInnerShine, { opacity: innerGlow }]} pointerEvents="none" />
          <View style={styles.midPromoScrim} />
          <View style={styles.midPromoTextCol}>
            <Text style={styles.midPromoCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.midPromoCardSub} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.giftBookCover,
          {
            width: cardWidth,
            opacity: coverOpacity,
            transform: [{ perspective: 1400 }, { rotateY }],
            transformOrigin: "left center",
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.giftBookSpine} />
        <View style={styles.giftBookGoldLine} />
        <View style={styles.giftBookBand} />
        <Animated.View style={[styles.giftBowOuter, { transform: [{ scale: bowScale }] }]}>
          <View style={styles.giftBow} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

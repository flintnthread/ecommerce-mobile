import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { VideoView, useVideoPlayer } from "expo-video";

export default function Sweets() {
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
  const MENU_BAR_HEIGHT = 56;
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

  const sectionY = useRef<Record<CategoryKey, number>>({
    dry: 0,
    milk: 0,
  });

  const CATEGORIES: { key: CategoryKey; label: string; icon: any }[] = useMemo(
    () => [
      { key: "dry", label: "Dry Sweets", icon: "leaf-outline" },
      { key: "milk", label: "Milk Sweets", icon: "cafe-outline" },
    ],
    []
  );

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

  const SUB: Record<
    CategoryKey,
    { id: string; name: string; note: string; color: string; image?: any }[]
  > = useMemo(
    () => ({
      dry: [
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
      ],
      milk: [
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
      ],
    }),
    []
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

  const scrollTo = (key: CategoryKey) => {
    setActive(key);
    const y = sectionY.current[key] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
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
      <View style={[styles.topMenuBar, { top: headerHeight, height: MENU_BAR_HEIGHT }]}>
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
                <Ionicons name={c.icon} size={16} color={isActive ? "#ffffff" : "#1d324e"} />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + MENU_BAR_HEIGHT + 2 }]}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y + 160;
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
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  chipActive: { backgroundColor: "#1d324e", borderColor: "#1d324e" },
  chipText: { marginLeft: 8, fontSize: 12, fontWeight: "900", color: "#1d324e" },
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

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";

const { width } = Dimensions.get("window");
const DESK_INNER_WIDTH = width - 20; // deskSection marginHorizontal: 10 × 2
/** Horizontal padding inside the desk block; increase for narrower banners */
const HERO_SIDE_INSET = 20;
const HERO_SLIDE_WIDTH = DESK_INNER_WIDTH - HERO_SIDE_INSET * 2;

const FW1 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM.jpeg");
const FW2 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM (1).jpeg");
const FW3 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM (2).jpeg");
const FW4 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM.jpeg");
const FW5 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM (1).jpeg");
const FW6 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.33 AM.jpeg");
const FW7 = require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.21.01 AM.jpeg");
const BOTTOM3_MAIN_BANNER = require("../assets/footwearimages/bottom 3 of main banners.png");
const HEADER_FAVICON = require("../assets/footwearimages/Fav Icon.png");

const BANNER_IMAGES = [
  require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM.jpeg"),
  require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM (1).jpeg"),
  require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.33 AM.jpeg"),
];

const CATEGORY_TILES = [
  { id: "all", label: "Footwear", image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM.jpeg") },
  { id: "women", label: "Womens-Footwear", image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM (1).jpeg") },
  { id: "kids", label: "Kids-Footwear", image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.02 AM (2).jpeg") },
  { id: "men", label: "Mens-Footwear", image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.21.01 AM.jpeg") },
  { id: "brands", label: "Top Brands", image: require("../assets/footwearimages/WhatsApp Image 2026-03-26 at 6.20.15 AM.jpeg") },
];

const SUBCATEGORY_MAP: Record<
  string,
  { id: string; label: string; image: any }[]
> = {
  women: [
    { id: "w1", label: "Heels", image: FW2 },
    { id: "w2", label: "Flats", image: FW5 },
    { id: "w3", label: "Sandals", image: FW3 },
    { id: "w4", label: "Wedges", image: FW7 },
    { id: "w5", label: "Boots", image: FW4 },
    { id: "w6", label: "Sneakers", image: FW1 },
  ],
  kids: [
    { id: "k1", label: "School Shoes", image: FW3 },
    { id: "k2", label: "Sports Shoes", image: FW6 },
    { id: "k3", label: "Slip-ons", image: FW2 },
    { id: "k4", label: "Sandals", image: FW5 },
    { id: "k5", label: "Party Shoes", image: FW7 },
    { id: "k6", label: "Sneakers", image: FW1 },
  ],
  men: [
    { id: "m1", label: "Sneakers", image: FW1 },
    { id: "m2", label: "Formal Shoes", image: FW4 },
    { id: "m3", label: "Loafers", image: FW6 },
    { id: "m4", label: "Boots", image: FW5 },
    { id: "m5", label: "Sports Shoes", image: FW3 },
    { id: "m6", label: "Sandals", image: FW2 },
  ],
};

type GenderCategoryId = "women" | "kids" | "men";

const GENDER_SECTION_BANNER: Record<GenderCategoryId, number> = {
  women: FW2,
  men: FW7,
  kids: FW3,
};

export default function FootwearScreen() {
  const router = useRouter();
  const mainScrollRef = useRef<ScrollView>(null);
  const heroScrollRef = useRef<ScrollView>(null);
  const categoriesListYRef = useRef(0);
  const womenSectionYRef = useRef(0);
  const menSectionYRef = useRef(0);
  const kidsSectionYRef = useRef(0);
  const trendNowSectionYRef = useRef(0);
  const womenBannerAnim = useRef(new Animated.Value(0)).current;
  const menBannerAnim = useRef(new Animated.Value(0)).current;
  const kidsBannerAnim = useRef(new Animated.Value(0)).current;
  const activeBannerRef = useRef<GenderCategoryId | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [query, setQuery] = useState("");
  const MENU_BAR_HEIGHT = 72;
  const [headerHeight, setHeaderHeight] = useState(96);
  type TopMenuKey = "footwear" | "womens-footwear" | "mens-footwear" | "kids-footwear" | "trendnow";
  const [activeTopMenu, setActiveTopMenu] = useState<TopMenuKey>("footwear");

  // Temporary tall video banner until you provide final asset.
  const tallBannerPlayer = useVideoPlayer(
    require("../assets/images/videobanner.mp4"),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % BANNER_IMAGES.length;
        heroScrollRef.current?.scrollTo({
          x: next * HERO_SLIDE_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const handleCategoryTilePress = (id: string) => {
    // Scroll within the same page (no navigation).
    if (id === "all") {
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, categoriesListYRef.current),
        animated: true,
      });
      return;
    }

    if (id === "women" || id === "kids" || id === "men") {
      const ref =
        id === "women"
          ? womenSectionYRef
          : id === "kids"
          ? kidsSectionYRef
          : menSectionYRef;
      mainScrollRef.current?.scrollTo({
        y: Math.max(0, ref.current),
        animated: true,
      });
      return;
    }

    if (id === "brands") {
      // Keep simple: go back to the top of the screen.
      mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const animateGenderBanner = (gender: GenderCategoryId | null) => {
    Animated.parallel([
      Animated.timing(womenBannerAnim, {
        toValue: gender === "women" ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(menBannerAnim, {
        toValue: gender === "men" ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(kidsBannerAnim, {
        toValue: gender === "kids" ? 1 : 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMainScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const threshold = 160;

    const currentY = y + threshold;

    // Banner animation (Women/Men/Kids)
    let candidate: GenderCategoryId | null = null;
    if (!(womenSectionYRef.current <= 0 && menSectionYRef.current <= 0)) {
      if (
        kidsSectionYRef.current > 0 &&
        currentY >= kidsSectionYRef.current
      ) {
        candidate = "kids";
      } else if (
        menSectionYRef.current > 0 &&
        currentY >= menSectionYRef.current
      ) {
        candidate = "men";
      } else if (currentY >= womenSectionYRef.current) {
        candidate = "women";
      }
    }

    if (candidate !== activeBannerRef.current) {
      activeBannerRef.current = candidate;
      animateGenderBanner(candidate);
    }

    // Sticky top menu active tab
    let nextMenu: TopMenuKey = "footwear";
    const beforeCategories =
      categoriesListYRef.current <= 0 || currentY < categoriesListYRef.current;

    if (
      beforeCategories &&
      trendNowSectionYRef.current > 0 &&
      currentY >= trendNowSectionYRef.current
    ) {
      nextMenu = "trendnow";
    }

    if (womenSectionYRef.current > 0 && currentY >= womenSectionYRef.current) {
      nextMenu = "womens-footwear";
    }
    if (menSectionYRef.current > 0 && currentY >= menSectionYRef.current) {
      nextMenu = "mens-footwear";
    }
    if (kidsSectionYRef.current > 0 && currentY >= kidsSectionYRef.current) {
      nextMenu = "kids-footwear";
    }

    if (nextMenu !== activeTopMenu) {
      setActiveTopMenu(nextMenu);
    }
  };

  const scrollToY = (y: number) => {
    mainScrollRef.current?.scrollTo({
      y: Math.max(0, y),
      animated: true,
    });
  };

  const handleTopMenuPress = (key: TopMenuKey) => {
    if (key === "footwear") {
      scrollToY(categoriesListYRef.current);
      return;
    }
    if (key === "womens-footwear") {
      scrollToY(womenSectionYRef.current);
      return;
    }
    if (key === "mens-footwear") {
      scrollToY(menSectionYRef.current);
      return;
    }
    if (key === "kids-footwear") {
      scrollToY(kidsSectionYRef.current);
      return;
    }
    if (key === "trendnow") {
      scrollToY(trendNowSectionYRef.current);
      return;
    }
  };

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View
        style={styles.headerRow}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          style={styles.headerLeading}
          onPress={() => mainScrollRef.current?.scrollTo({ y: 0, animated: true })}
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

        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => router.push("/wishlist")}>
          <Ionicons name="heart-outline" size={22} color="#1D2430" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => router.push("/cart")}>
          <Ionicons name="bag-outline" size={22} color="#1D2430" />
        </TouchableOpacity>
      </View>

      {/* Sticky top menu bar */}
      <View
        style={[
          styles.topMenuBar,
          { top: headerHeight, height: MENU_BAR_HEIGHT },
        ]}
      >
        {(
          [
            {
              key: "footwear",
              label: "Footwear",
              image: CATEGORY_TILES[0].image,
            },
            {
              key: "womens-footwear",
              label: "Womens",
              image: FW2,
            },
            {
              key: "mens-footwear",
              label: "Mens",
              image: FW7,
            },
            {
              key: "kids-footwear",
              label: "Kids",
              image: FW3,
            },
            { key: "trendnow", label: "TrendNow", image: BANNER_IMAGES[0] },
          ] as { key: TopMenuKey; label: string; image?: number }[]
        ).map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.topMenuTab}
            activeOpacity={0.85}
            onPress={() => handleTopMenuPress(item.key)}
          >
            {typeof item.image === "number" && (
              <Image
                source={item.image}
                style={styles.topMenuTabIcon}
              />
            )}
            <Text
              style={[
                styles.topMenuTabText,
                activeTopMenu === item.key && styles.topMenuTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          ...styles.contentContainer,
          paddingTop: headerHeight + MENU_BAR_HEIGHT + 2,
        }}
        onScroll={handleMainScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.dualBannerCard}>
          <Image source={BOTTOM3_MAIN_BANNER} style={styles.dualBannerTopImage} />
          <View style={styles.dualBannerDivider} />
          <Image source={BOTTOM3_MAIN_BANNER} style={styles.dualBannerBottomImage} />
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          
          <View style={styles.topTierSection}>
            <Text style={styles.sectionTitle}>Top-tier Kicks</Text>
            <View style={styles.grid2}>
              {CATEGORY_TILES.slice(0, 4).map((card, idx) => (
                <TouchableOpacity key={`${card.id}-${idx}`} style={styles.promoCard} activeOpacity={0.9}>
                  <Image source={card.image} style={styles.promoImage} />
                  <View style={styles.promoBadge}>
                    <Text style={styles.promoBadgeText}>Min {30 + idx * 10}% OFF*</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
 {/* Categories list + per-category subcategory sections */}
 <View
          style={styles.categoriesListSection}
          onLayout={(event) => {
            categoriesListYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.hubScreenTitle}>Categories list</Text>
          <Text style={styles.hubScreenSub}>
            Choose Womens, Mens, or Kids footwear.
          </Text>

          <View style={styles.hubGrid}>
            {(["women", "men", "kids"] as GenderCategoryId[]).map((id) => (
              <TouchableOpacity
                key={id}
                style={styles.hubCard}
                activeOpacity={0.9}
                onPress={() => handleCategoryTilePress(id)}
              >
                <Image
                  source={GENDER_SECTION_BANNER[id]}
                  style={styles.hubCardImage}
                />
                <Text style={styles.hubCardLabel}>
                  {id === "women"
                    ? "Womens Footwear"
                    : id === "men"
                      ? "Mens Footwear"
                      : "Kids Footwear"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

          <View style={styles.moodSection}>
            <Text style={styles.sectionTitles}>Move With Your Mood</Text>
            <View style={styles.moodRow}>
              <TouchableOpacity style={styles.moodCard} activeOpacity={0.9}>
                <Image source={BANNER_IMAGES[1]} style={styles.moodImage} />
                <Text style={styles.moodText}>Active & Sporty</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moodCard} activeOpacity={0.9}>
                <Image source={BANNER_IMAGES[2]} style={styles.moodImage} />
                <Text style={styles.moodText}>Travel & Explore</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.deskSection}>
            {/* New section from shared reference style */}
            <View style={styles.deskHeaderStrip}>
              <Text style={styles.deskHeaderTitle}>From Desk to Dazzle</Text>
              <Text style={styles.deskHeaderSub}>
                Style that moves with your day and lights up your night
              </Text>
            </View>

            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.heroCarousel}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / HERO_SLIDE_WIDTH
                );
                setBannerIndex(idx);
              }}
            >
              {BANNER_IMAGES.map((img, idx) => (
                <View key={`hero-${idx}`} style={styles.heroWrap}>
                  <Image source={img} style={styles.heroImage} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.dotRow}>
              {BANNER_IMAGES.map((_, idx) => (
                <View key={`dot-${idx}`} style={[styles.dot, bannerIndex === idx && styles.dotActive]} />
              ))}
            </View>
          </View>
          
        <View
          style={styles.genderSection}
          onLayout={(event) => {
            womenSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View
            style={[styles.genderBannerWrap, styles.womenGenderBannerWrap]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerOverlay,
                styles.womenBannerOverlay,
                { opacity: womenBannerAnim },
              ]}
            />

            <Animated.View
              style={[
                styles.genderBannerImageAnimWrap,
                {
                  transform: [
                    {
                      translateY: womenBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                    {
                      scale: womenBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={GENDER_SECTION_BANNER.women}
                style={styles.genderBannerImage}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerBadgeAnimWrap,
                {
                  opacity: womenBannerAnim,
                  transform: [
                    {
                      translateY: womenBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.genderBannerBadge, styles.womenBannerBadge]}>
                <Ionicons name="heart" size={16} color="#7A1E49" />
                <Text style={[styles.genderBannerBadgeText, styles.womenBadgeText]}>
                  For Her
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={[styles.genderSubWrap, styles.womenGenderSubWrap]}>
            <Text
              style={[styles.subSectionTitle, styles.womenSubSectionTitle]}
            >
              Womens-Footwear Subcategories
            </Text>
            <View style={styles.subGrid}>
              {SUBCATEGORY_MAP.women.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subCard, styles.womenSubCard]}
                  activeOpacity={0.9}
                >
                  <Image source={sub.image} style={styles.subCardImage} />
                  <Text
                    style={[styles.subCardLabel, styles.womenSubCardLabel]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

          <View style={styles.perfectPairSection}>
            <View style={styles.perfectPairHeader}>
              <Text style={styles.perfectPairTitle}>Pick Your Perfect Pair</Text>
            </View>

            <View style={styles.perfectPairBody}>
              <View style={styles.perfectGrid}>
                {["Sneakers", "Casuals", "Travel", "Sporty", "Flats", "Loafers"].map(
                  (label, idx) => (
                    <View key={label} style={styles.perfectItem}>
                      <Image
                        source={CATEGORY_TILES[idx % CATEGORY_TILES.length].image}
                        style={styles.perfectCircleImage}
                      />
                      <Text style={styles.perfectItemLabel}>{label}</Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
          {/* Tall portrait video banner */}
 <View
              style={styles.tallVideoSection}
              onLayout={(event) => {
                trendNowSectionYRef.current = event.nativeEvent.layout.y;
              }}
            >
            <Text style={styles.tallVideoTitle}>Style Reel</Text>
            <View style={styles.tallVideoWrap}>
              <VideoView
                player={tallBannerPlayer}
                style={styles.tallVideo}
                contentFit="cover"
                nativeControls={false}
              />
            </View>
            <Text style={styles.tallVideoHint}>
              Replace this with your final vertical video later.
            </Text>
          </View>

        </Animated.View>
       
        <View
          style={styles.genderSection}
          onLayout={(event) => {
            menSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View
            style={[styles.genderBannerWrap, styles.menGenderBannerWrap]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerOverlay,
                styles.menBannerOverlay,
                { opacity: menBannerAnim },
              ]}
            />

            <Animated.View
              style={[
                styles.genderBannerImageAnimWrap,
                {
                  transform: [
                    {
                      translateY: menBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                    {
                      scale: menBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={GENDER_SECTION_BANNER.men}
                style={styles.genderBannerImage}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerBadgeAnimWrap,
                {
                  opacity: menBannerAnim,
                  transform: [
                    {
                      translateY: menBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.genderBannerBadge, styles.menBannerBadge]}>
                <Ionicons name="person" size={16} color="#0B3A91" />
                <Text style={[styles.genderBannerBadgeText, styles.menBadgeText]}>
                  For Him
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={[styles.genderSubWrap, styles.menGenderSubWrap]}>
            <Text
              style={[styles.subSectionTitle, styles.menSubSectionTitle]}
            >
              Mens-Footwear Subcategories
            </Text>
            <View style={styles.subGrid}>
              {SUBCATEGORY_MAP.men.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subCard, styles.menSubCard]}
                  activeOpacity={0.9}
                >
                  <Image source={sub.image} style={styles.subCardImage} />
                  <Text
                    style={[styles.subCardLabel, styles.menSubCardLabel]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View
          style={styles.genderSection}
          onLayout={(event) => {
            kidsSectionYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View
            style={[styles.genderBannerWrap, styles.kidsGenderBannerWrap]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerOverlay,
                styles.kidsBannerOverlay,
                { opacity: kidsBannerAnim },
              ]}
            />

            <Animated.View
              style={[
                styles.genderBannerImageAnimWrap,
                {
                  transform: [
                    {
                      translateY: kidsBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -10],
                      }),
                    },
                    {
                      scale: kidsBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={GENDER_SECTION_BANNER.kids}
                style={styles.genderBannerImage}
              />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[
                styles.genderBannerBadgeAnimWrap,
                {
                  opacity: kidsBannerAnim,
                  transform: [
                    {
                      translateY: kidsBannerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.genderBannerBadge, styles.kidsBannerBadge]}>
                <Ionicons name="star" size={16} color="#7A5200" />
                <Text style={[styles.genderBannerBadgeText, styles.kidsBadgeText]}>
                  Mini Stars
                </Text>
              </View>
            </Animated.View>
          </View>
          <View style={[styles.genderSubWrap, styles.kidsGenderSubWrap]}>
            <Text
              style={[styles.subSectionTitle, styles.kidsSubSectionTitle]}
            >
              Kids-Footwear Subcategories
            </Text>
            <View style={styles.subGrid}>
              {SUBCATEGORY_MAP.kids.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subCard, styles.kidsSubCard]}
                  activeOpacity={0.9}
                >
                  <Image source={sub.image} style={styles.subCardImage} />
                  <Text
                    style={[styles.subCardLabel, styles.kidsSubCardLabel]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F0",
  },
  contentContainer: {
    paddingBottom: 24,
  },
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
  topMenuBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 25,
    backgroundColor: "#FFF7F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFF7F0",
  },
  topMenuTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  topMenuTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5a6578",
  },
  topMenuTabTextActive: {
    color: "#1d324e",
  },
  topMenuTabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 6,
    resizeMode: "cover",
  },
  faviconDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#CFD7E6",
  },
  faviconImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    resizeMode: "cover",
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
  searchInput: {
    flex: 1,
    marginHorizontal: 7,
    fontSize: 13,
    color: "#1D324E",
  },
  iconBtn: {
    marginLeft: 12,
  },
  dualBannerCard: {
    marginHorizontal: 0,
    marginTop: 4,
    marginBottom: 10,
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#202020",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(3, 4, 5, 0.25)",
    shadowColor: "#1d324e",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dualBannerTopImage: {
    width: "100%",
    height: 210,
    resizeMode: "cover",
  },
  dualBannerDivider: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dualBannerBottomImage: {
    width: "100%",
    height: 170,
    resizeMode: "cover",
  },
  tileRow: {
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  tileCard: {
    width: 86,
    marginHorizontal: 4,
    backgroundColor: "#FFFDF9",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.25)",
    padding: 6,
    alignItems: "center",
    shadowColor: "#ef7b1a",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tileCardActive: {
    borderColor: "#ef7b1a",
    borderWidth: 1,
  },
  tileImage: {
    width: 72,
    height: 44,
    borderRadius: 6,
    resizeMode: "cover",
  },
  tileLabel: {
    marginTop: 5,
    fontSize: 11,
    color: "#1E2330",
    fontWeight: "700",
  },
  heroCarousel: {
    width: HERO_SLIDE_WIDTH,
    alignSelf: "center",
  },
  heroWrap: {
    width: HERO_SLIDE_WIDTH,
    height: 310,
    backgroundColor: "#f6c795",
    borderRadius: 14,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dotRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  dot: {
    width: 20,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#D8D8D8",
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: "#1d324e",
  },
  hubScreenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1d324e",
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  hubScreenSub: {
    fontSize: 14,
    color: "#5a6578",
    paddingHorizontal: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  hubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  hubCard: {
    width: "48.5%",
    backgroundColor: "#FFFDF9",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,118,110,0.25)",
    shadowColor: "#1d324e",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  hubCardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  hubCardLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A6B5C",
    paddingHorizontal: 10,
    paddingVertical: 12,
    textAlign: "center",
  },
  categoriesListSection: {
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 18,
    backgroundColor: "#E0FFF4",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15,118,110,0.25)",
    padding: 10,
  },
  genderSection: {
    marginTop: 6,
  },
  genderBannerWrap: {
    marginHorizontal: 10,
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EAF2FF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
  },
  genderBannerImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  genderBannerImageAnimWrap: {
    width: "100%",
    height: 200,
  },
  genderSubWrap: {
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    padding: 10,
  },
  genderBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  womenBannerOverlay: {
    backgroundColor: "rgba(255,224,236,0.55)",
  },
  menBannerOverlay: {
    backgroundColor: "rgba(221,235,255,0.55)",
  },
  kidsBannerOverlay: {
    backgroundColor: "rgba(255,247,219,0.65)",
  },
  genderBannerBadgeAnimWrap: {
    position: "absolute",
    top: 14,
    left: 14,
  },
  genderBannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
  },
  genderBannerBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },
  womenBannerBadge: {
    borderColor: "rgba(122,30,73,0.25)",
  },
  womenBadgeText: {
    color: "#7A1E49",
  },
  menBannerBadge: {
    borderColor: "rgba(11,58,145,0.18)",
  },
  menBadgeText: {
    color: "#0B3A91",
  },
  kidsBannerBadge: {
    borderColor: "rgba(122,82,0,0.20)",
  },
  kidsBadgeText: {
    color: "#7A5200",
  },
  womenGenderBannerWrap: {
    backgroundColor: "#FFE0EC",
    borderColor: "rgba(239,123,26,0.25)",
  },
  womenGenderSubWrap: {
    backgroundColor: "#FFEAF7",
    borderColor: "rgba(239,123,26,0.25)",
  },
  menGenderBannerWrap: {
    backgroundColor: "#DDEBFF",
    borderColor: "rgba(29,50,78,0.18)",
  },
  menGenderSubWrap: {
    backgroundColor: "#EAF2FF",
    borderColor: "rgba(29,50,78,0.20)",
  },
  kidsGenderBannerWrap: {
    backgroundColor: "#FFF7DB",
    borderColor: "rgba(239,123,26,0.22)",
  },
  kidsGenderSubWrap: {
    backgroundColor: "#FFFBEA",
    borderColor: "rgba(239,123,26,0.22)",
  },
  womenSubSectionTitle: {
    color: "#7A1E49",
  },
  womenSubCard: {
    backgroundColor: "#FFF1FA",
    borderColor: "rgba(122,30,73,0.20)",
  },
  womenSubCardLabel: {
    color: "#7A1E49",
  },
  menSubSectionTitle: {
    color: "#0B3A91",
  },
  menSubCard: {
    backgroundColor: "#EEF5FF",
    borderColor: "rgba(11,58,145,0.18)",
  },
  menSubCardLabel: {
    color: "#0B3A91",
  },
  kidsSubSectionTitle: {
    color: "#7A5200",
  },
  kidsSubCard: {
    backgroundColor: "#FFF7D6",
    borderColor: "rgba(239,123,26,0.22)",
  },
  kidsSubCardLabel: {
    color: "#7A5200",
  },
  subSectionWrap: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: "#FFF3E9",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
    padding: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1d324e",
    marginBottom: 10,
  },
  subGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  subCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.30)",
  },
  subCardImage: {
    width: "100%",
    height: 110,
    resizeMode: "cover",
  },
  subCardLabel: {
    fontSize: 12,
    color: "#1D2430",
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#F4F6FA",
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitles: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1d324e",
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  topTierSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#504f56",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1d324e",
    paddingBottom: 8,
  },
  moodSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f6c795",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f6c795",
    paddingBottom: 10,
  },
  deskSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#69798c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,160,185,0.35)",
    overflow: "hidden",
  },
  perfectPairSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f6c795",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.40)",
    overflow: "hidden",
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  promoCard: {
    width: "48.5%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#FFDDBA",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
  },
  promoImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
  },
  promoBadge: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: "#1d324e",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 6,
  },
  promoBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  moodCard: {
    width: "48.5%",
    borderRadius: 12,
    backgroundColor: "#FFF1C2",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,123,26,0.35)",
    overflow: "hidden",
    marginBottom: 8,
  },
  moodImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  moodText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D2430",
    padding: 8,
    textAlign: "center",
  },
  deskHeaderStrip: {
    marginTop: 10,
    marginHorizontal: 10,
    backgroundColor: "#69798c",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  deskHeaderTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  deskHeaderSub: {
    marginTop: 3,
    fontSize: 10,
    color: "#FFF7E8",
    fontWeight: "600",
  },
  weekendCard: {
    marginTop: 8,
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#FFE8D5",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,160,185,0.35)",
    overflow: "hidden",
    paddingBottom: 10,
  },
  weekendTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1f252f",
    paddingHorizontal: 12,
    paddingTop: 10,
    marginBottom: 8,
  },
  weekendImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  weekendDotRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  weekendDot: {
    width: 20,
    height: 4,
    borderRadius: 5,
    marginHorizontal: 4,
    backgroundColor: "#D7D7D7",
  },
  weekendDotActive: {
    backgroundColor: "#ef7b1a",
  },
  perfectPairHeader: {
    marginTop: 12,
    marginHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#ef7b1a",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  perfectPairTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
  },
  perfectPairBody: {
    marginHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#Ef7b1a",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  perfectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  perfectItem: {
    width: "31%",
    alignItems: "center",
    marginBottom: 12,
  },
  perfectCircleImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: "#1D324E",
  },
  perfectItemLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  tallVideoSection: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#504f56",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148,160,185,0.35)",
    padding: 10,
  },
  tallVideoTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
  },
  tallVideoWrap: {
    width: "100%",
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f6c795",
  },
  tallVideo: {
    width: "100%",
    height: "100%",
  },
  tallVideoHint: {
    marginTop: 8,
    fontSize: 11,
    color: "#79411c",
    fontWeight: "600",
  },
});


import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

const { width: SCREEN_W } = Dimensions.get("window");
const CONTENT_PAD = 20;
const FULL_W = SCREEN_W - CONTENT_PAD * 2;

const HEADER_FAVICON = require("../assets/images/fntfav.png");

const SKINCARE_TOOLS_DEVICES_CATEGORY = "Skincare Tools & Devices";
const FACIAL_DEVICES_SUBCATEGORY = "Facial Devices";

/**
 * F&T logo colours: deep navy on “F” / “&”, vibrant orange on “T”.
 * Orange ramp aligned with `home.tsx` LOGO_RING_COLORS / search accents.
 */
const NAVY_DEEP = "#0f2138";
const NAVY = "#152a45";
const NAVY_MID = "#1e3a5f";
const NAVY_TEXT = "#0c1929";
const NAVY_ICON = "#1e3a5f";
const ORANGE = "#EA580C";
const ORANGE_HOT = "#F97316";
const ORANGE_SOFT = "#FB923C";
const ORANGE_LIGHT = "#FDBA74";
const PEACH = "#FFEDD5";
const CREAM = "#FFF7ED";
const AMBER_ICON = "#C2410C";

/** Spotlight cards — all accents from the orange side of the logo. */
const SPOTLIGHT_DEVICE_TYPES: {
  id: string;
  label: string;
  hint: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "led", label: "LED therapy", hint: "Light masks & panels", accent: ORANGE_LIGHT, icon: "sunny-outline" },
  { id: "ems", label: "Microcurrent", hint: "Lift & contour", accent: ORANGE_HOT, icon: "pulse-outline" },
  { id: "sonic", label: "Sonic cleanse", hint: "Brushes & scrubbers", accent: ORANGE, icon: "water-outline" },
  { id: "rf", label: "Thermal / RF", hint: "Spa-style devices", accent: ORANGE_SOFT, icon: "flame-outline" },
];

export default function BeautyPersonalCareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerPadTop = Math.max(insets.top, 12);
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introTrans = useRef(new Animated.Value(20)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const [headerElevated, setHeaderElevated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [headerTotalHeight, setHeaderTotalHeight] = useState(headerPadTop + 72);
  const mainScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.timing(introTrans, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start();
  }, [introOpacity, introTrans]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.08,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseScale]);

  const onMainScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setHeaderElevated(e.nativeEvent.contentOffset.y > 12);
  };

  const openFacialDevices = () => {
    router.push({
      pathname: "/subcatProducts",
      params: {
        mainCat: "skincare-tools-devices",
        subCategory: FACIAL_DEVICES_SUBCATEGORY,
      },
    });
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FFFDFB", CREAM, PEACH]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <View
        style={[
          styles.headerShell,
          {
            paddingTop: headerPadTop,
            backgroundColor: headerElevated
              ? "rgba(255,253,251,0.97)"
              : "rgba(255,253,251,0.82)",
            borderBottomWidth: headerElevated ? StyleSheet.hairlineWidth : 0,
            borderBottomColor: "rgba(234,88,12,0.12)",
            shadowOpacity: headerElevated ? 0.12 : 0,
            elevation: headerElevated ? 6 : 0,
          },
        ]}
        onLayout={(e) => setHeaderTotalHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerLeadingWrap}
            onPress={() => mainScrollRef.current?.scrollTo({ y: 0, animated: true })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Scroll to top"
          >
            <Image source={HEADER_FAVICON} style={styles.headerFavicon} />
          </TouchableOpacity>

          <View style={styles.headerSearchBar}>
            <Ionicons name="search-outline" size={17} color={AMBER_ICON} />
            <TextInput
              style={styles.headerSearchInput}
              placeholder={`Search ${FACIAL_DEVICES_SUBCATEGORY.toLowerCase()}…`}
              placeholderTextColor="#9A3412"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/wishlist")}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Ionicons name="heart-outline" size={22} color={NAVY_ICON} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={NAVY_ICON} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerCaption} numberOfLines={2}>
          {SKINCARE_TOOLS_DEVICES_CATEGORY}
        </Text>
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + 8, paddingBottom: 108 },
        ]}
        onScroll={onMainScroll}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introTrans }] }}>
          {/* Category hero banner */}
          <LinearGradient
            colors={[NAVY_DEEP, NAVY, NAVY_MID]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.categoryHero, { width: FULL_W }]}
          >
            <View style={styles.heroOrb1} />
            <View style={styles.heroOrb2} />
            <View style={styles.heroRing} />
            <Text style={styles.heroEyebrow}>F&amp;T Beauty</Text>
            <Text style={styles.heroCategoryTitle}>{SKINCARE_TOOLS_DEVICES_CATEGORY}</Text>
            <Text style={styles.heroLead}>
              Precision tools for cleansing, massage, and at-home facial care — starting with our
              curated Facial Devices range.
            </Text>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="leaf-outline" size={14} color="#FFF7ED" />
                <Text style={styles.heroBadgeText}>Derm-friendly focus</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#FFF7ED" />
                <Text style={styles.heroBadgeText}>Quality picks</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Soft wave — breaks the solid hero edge (different from flat cards) */}
          <View style={[styles.waveUnderHero, { width: FULL_W }]}>
            <Svg width={FULL_W} height={28} viewBox={`0 0 ${FULL_W} 28`}>
              <Path
                d={`M0,12 Q ${FULL_W * 0.22} 26 ${FULL_W * 0.45} 12 T ${FULL_W * 0.9} 10 L ${FULL_W} 8 L ${FULL_W} 28 L 0 28 Z`}
                fill={CREAM}
              />
            </Svg>
          </View>

          {/* Dark spotlight rail — tech aesthetic vs. mint UI elsewhere */}
          <LinearGradient
            colors={[NAVY_DEEP, NAVY, "#122338"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.spotlightShell, { width: FULL_W }]}
          >
            <View style={styles.spotlightGlow} />
            <Animated.View
              style={[
                styles.spotlightPulseRing,
                { transform: [{ scale: pulseScale }] },
              ]}
            />
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightBrandDot} />
              <Text style={styles.spotlightEyebrow}>Device spotlight</Text>
            </View>
            <Text style={styles.spotlightTitle}>Tech meets skin</Text>
            <Text style={styles.spotlightSubtitle}>
              Same catalog — explore how facial devices show up across these families.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.spotlightScrollInner}
            >
              {SPOTLIGHT_DEVICE_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.spotlightCard, { borderLeftColor: item.accent }]}
                  activeOpacity={0.88}
                  onPress={openFacialDevices}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}, open ${FACIAL_DEVICES_SUBCATEGORY}`}
                >
                  <View style={styles.spotlightIconBlob}>
                    <View
                      style={[
                        styles.spotlightIconBlobFill,
                        { backgroundColor: item.accent },
                      ]}
                    />
                    <Ionicons name={item.icon} size={22} color={item.accent} />
                  </View>
                  <Text style={styles.spotlightCardLabel}>{item.label}</Text>
                  <Text style={styles.spotlightCardHint}>{item.hint}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>

          {/* Decorative ribbon — category only */}
          <View style={[styles.designRibbon, { width: FULL_W }]}>
            <LinearGradient
              colors={[ORANGE_SOFT, ORANGE_LIGHT, "#FFFFFF", ORANGE_HOT]}
              locations={[0, 0.35, 0.62, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.designRibbonInner}
            >
              <View style={styles.ribbonNotch} />
              <Text style={styles.ribbonText}>{SKINCARE_TOOLS_DEVICES_CATEGORY.toUpperCase()}</Text>
              <View style={styles.ribbonLine} />
            </LinearGradient>
          </View>

          {/* Subcategory feature banner */}
          <TouchableOpacity
            style={[styles.facialBanner, { width: FULL_W }]}
            activeOpacity={0.92}
            onPress={openFacialDevices}
            accessibilityRole="button"
            accessibilityLabel={`Open ${FACIAL_DEVICES_SUBCATEGORY}`}
          >
            <LinearGradient
              colors={["#FFFFFF", CREAM]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.facialBannerAccent} />
            <View style={styles.facialIconCluster}>
              <View style={styles.facialIconCircle}>
                <Ionicons name="scan-outline" size={28} color={NAVY_MID} />
              </View>
              <View style={[styles.facialIconCircle, styles.facialIconCircleSmall]}>
                <Ionicons name="pulse-outline" size={18} color={ORANGE} />
              </View>
            </View>
            <View style={styles.facialTextCol}>
              <Text style={styles.facialKicker}>Subcategory</Text>
              <Text style={styles.facialTitle}>{FACIAL_DEVICES_SUBCATEGORY}</Text>
              <Text style={styles.facialBody}>
                Cleansing brushes, LED masks, microcurrent & more — tap to shop the full catalog.
              </Text>
              <View style={styles.facialCtaRow}>
                <Text style={styles.facialCta}>Shop now</Text>
                <Ionicons name="arrow-forward-circle" size={22} color={ORANGE} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Design strip — visual only */}
          <View style={[styles.stripRow, { width: FULL_W }]}>
            <View style={styles.stripDot} />
            <View style={[styles.stripDot, styles.stripDotMid]} />
            <View style={styles.stripDot} />
          </View>

          <LinearGradient
            colors={[CREAM, PEACH]}
            style={[styles.bottomPanel, { width: FULL_W }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.bottomPanelTitle}>Ready to browse?</Text>
            <Text style={styles.bottomPanelSub}>
              All products on this hub are tagged under {FACIAL_DEVICES_SUBCATEGORY}.
            </Text>
            <TouchableOpacity style={styles.primaryCta} activeOpacity={0.9} onPress={openFacialDevices}>
              <LinearGradient
                colors={[ORANGE, ORANGE_HOT, ORANGE_SOFT]}
                locations={[0, 0.45, 1]}
                style={styles.primaryCtaGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryCtaText}>View {FACIAL_DEVICES_SUBCATEGORY}</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  headerShell: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingBottom: 10,
    shadowColor: ORANGE_SOFT,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLeadingWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,88,12,0.2)",
  },
  headerFavicon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    resizeMode: "cover",
  },
  headerSearchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,88,12,0.15)",
  },
  headerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: NAVY_TEXT,
    paddingVertical: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCaption: {
    marginTop: 8,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: "800",
    color: NAVY_MID,
    letterSpacing: 0.15,
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PAD,
    alignItems: "center",
  },
  categoryHero: {
    borderRadius: 22,
    padding: 24,
    paddingTop: 28,
    paddingBottom: 26,
    overflow: "hidden",
    marginBottom: 16,
    minHeight: 220,
  },
  heroOrb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(249,115,22,0.18)",
    top: -36,
    right: -28,
  },
  heroOrb2: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.1)",
    bottom: 40,
    left: -20,
  },
  heroRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.35)",
    top: "18%",
    right: "-8%",
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  heroCategoryTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
    lineHeight: 28,
    marginBottom: 12,
    maxWidth: "100%",
  },
  heroLead: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    lineHeight: 21,
    marginBottom: 18,
    maxWidth: "98%",
  },
  heroBadgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(234,88,12,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
  },
  waveUnderHero: {
    marginTop: -10,
    marginBottom: 6,
    alignSelf: "center",
  },
  spotlightShell: {
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.25)",
  },
  spotlightGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(249,115,22,0.12)",
    top: -80,
    right: -60,
  },
  spotlightPulseRing: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(251,146,60,0.55)",
    backgroundColor: "transparent",
  },
  spotlightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  spotlightBrandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE_HOT,
  },
  spotlightEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(254,215,170,0.95)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  spotlightSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,237,213,0.9)",
    lineHeight: 19,
    marginBottom: 16,
    maxWidth: "100%",
  },
  spotlightScrollInner: {
    gap: 12,
    paddingRight: 8,
    paddingBottom: 2,
  },
  spotlightCard: {
    width: 148,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(12,25,41,0.55)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.2)",
    borderLeftWidth: 4,
  },
  spotlightIconBlob: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  spotlightIconBlobFill: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    borderRadius: 12,
  },
  spotlightCardLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f1f5f9",
    marginBottom: 4,
  },
  spotlightCardHint: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(254,215,170,0.88)",
    lineHeight: 15,
  },
  designRibbon: {
    marginBottom: 18,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  designRibbonInner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ribbonNotch: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "rgba(21,42,69,0.45)",
  },
  ribbonText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    color: NAVY_TEXT,
    letterSpacing: 1.8,
  },
  ribbonLine: {
    height: 2,
    width: 40,
    borderRadius: 1,
    backgroundColor: "rgba(234,88,12,0.45)",
  },
  facialBanner: {
    borderRadius: 20,
    marginBottom: 20,
    minHeight: 168,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,88,12,0.18)",
    flexDirection: "row",
    padding: 18,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  facialBannerAccent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "38%",
    backgroundColor: "rgba(251,146,60,0.14)",
    borderTopLeftRadius: 80,
    borderBottomLeftRadius: 80,
  },
  facialIconCluster: {
    justifyContent: "center",
    marginRight: 14,
  },
  facialIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(30,58,95,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(30,58,95,0.18)",
  },
  facialIconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: -8,
    marginLeft: 20,
    backgroundColor: "rgba(234,88,12,0.15)",
  },
  facialTextCol: { flex: 1, justifyContent: "center" },
  facialKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: AMBER_ICON,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  facialTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: NAVY_TEXT,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  facialBody: {
    fontSize: 13,
    fontWeight: "600",
    color: NAVY_MID,
    lineHeight: 19,
    marginBottom: 10,
  },
  facialCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  facialCta: {
    fontSize: 14,
    fontWeight: "800",
    color: ORANGE,
  },
  stripRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingVertical: 6,
  },
  stripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE_SOFT,
    opacity: 0.55,
  },
  stripDotMid: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 1,
    backgroundColor: NAVY_MID,
  },
  bottomPanel: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(234,88,12,0.15)",
  },
  bottomPanelTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: NAVY_TEXT,
    marginBottom: 6,
  },
  bottomPanelSub: {
    fontSize: 13,
    fontWeight: "600",
    color: NAVY_MID,
    lineHeight: 19,
    marginBottom: 18,
  },
  primaryCta: {
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  primaryCtaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryCtaText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});

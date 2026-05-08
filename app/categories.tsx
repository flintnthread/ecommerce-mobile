import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import api from "../services/api";

// Responsive breakpoints
const { width } = Dimensions.get("window");
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isMobile = width < 768;

type CategoryKey =
  | "womenswear"
  | "menswear"
  | "kidswear"
  | "homelyHub"
  | "sportswear"
  | "footwear"
  | "accessories"
  | "sweets"
  | "beautyPersonalCare"
  | "gaargi"
  | "indoorPlayEquipments";

type SideCategory = {
  key: CategoryKey;
  label: string;
  image: any;
};

const SIDE_CATEGORIES_FALLBACK: SideCategory[] = [
  {
    key: "womenswear",
    label: "Women",
    image: require("../assets/MainCatImages/images/Women.png"),
  },
  {
    key: "menswear",
    label: "Men",
    image: require("../assets/MainCatImages/images/Men.png"),
  },
  {
    key: "kidswear",
    label: "Kids",
    image: require("../assets/MainCatImages/images/Kids.png"),
  },
  {
    key: "homelyHub",
    label: "Homely Hub",
    image: require("../assets/MainCatImages/images/HomelyHub.png"),
  },
  {
    key: "sportswear",
    label: "Sportswear",
    image: require("../assets/MainCatImages/images/Sportswear.png"),
  },
  {
    key: "footwear",
    label: "Footwear",
    image: require("../assets/MainCatImages/images/Footwear.png"),
  },
  {
    key: "accessories",
    label: "Accessories",
    image: require("../assets/MainCatImages/images/Accessories.png"),
  },
  {
    key: "sweets",
    label: "Sweets",
    image: require("../assets/MainCatImages/images/Sweets.png"),
  },
  {
    key: "beautyPersonalCare",
    label: "Beauty & Personal Care",
    image: require("../assets/MainCatImages/images/Beauty&PersonalCare.png"),
  },
  {
    key: "gaargi",
    label: "Gaargi",
    image: require("../assets/MainCatImages/images/Gaargi.png"),
  },
  {
    key: "indoorPlayEquipments",
    label: "Indoor play Equipments",
    image: require("../assets/MainCatImages/images/IndoorPlayEquipments.png"),
  },
];

type ApiMainCategory = {
  bannerImage: string | null;
  categoryName: string;
  createdAt: string;
  gstPercentage: number;
  hsnCode: string;
  id: number;
  image: string;
  mobileImage: string | null;
  parentId: number | null;
  sellerId: number | null;
  status: number;
};

function categoryNameToKey(name: string): CategoryKey | null {
  const normalized = name.trim().toLowerCase();
  if (normalized === "women") return "womenswear";
  if (normalized === "men") return "menswear";
  if (normalized === "kids") return "kidswear";
  if (normalized === "homely hub") return "homelyHub";
  if (normalized === "sportswear") return "sportswear";
  if (normalized === "footwear") return "footwear";
  if (normalized === "accessories") return "accessories";
  if (normalized === "sweets") return "sweets";
  if (normalized === "beauty & personal care") return "beautyPersonalCare";
  if (normalized === "gaargi") return "gaargi";
  if (normalized === "indoor play") return "indoorPlayEquipments";
  return null;
}

function fallbackImageForKey(key: CategoryKey) {
  switch (key) {
    case "womenswear":
      return require("../assets/MainCatImages/images/Women.png");
    case "menswear":
      return require("../assets/MainCatImages/images/Men.png");
    case "kidswear":
      return require("../assets/MainCatImages/images/Kids.png");
    case "homelyHub":
      return require("../assets/MainCatImages/images/HomelyHub.png");
    case "sportswear":
      return require("../assets/MainCatImages/images/Sportswear.png");
    case "footwear":
      return require("../assets/MainCatImages/images/Footwear.png");
    case "accessories":
      return require("../assets/MainCatImages/images/Accessories.png");
    case "sweets":
      return require("../assets/MainCatImages/images/Sweets.png");
    case "beautyPersonalCare":
      return require("../assets/MainCatImages/images/Beauty&PersonalCare.png");
    case "gaargi":
      return require("../assets/MainCatImages/images/Gaargi.png");
    case "indoorPlayEquipments":
      return require("../assets/MainCatImages/images/IndoorPlayEquipments.png");
    default:
      return require("../assets/MainCatImages/images/Women.png");
  }
}

type SubItem = {
  id: string;
  name: string;
  image: any;
};

type Section = {
  title: string;
  items: SubItem[];
};

const CATEGORY_CONTENT: Record<CategoryKey, Section[]> = {
  womenswear: [],
  menswear: [],
  kidswear: [],
  homelyHub: [
    {
      title: "homely hub",
      items: [
        {
          id: "h1",
          name: "Gift Hampers",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
        {
          id: "h2",
          name: "Personalized Gifts",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
        {
          id: "h3",
          name: "Festival Gifts",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
        {
          id: "h4",
          name: "Home Decor Gifts",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
        {
          id: "h5",
          name: "Kids & Baby Gifts",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
        {
          id: "h6",
          name: "Spiritual & Festival Gifts",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
        {
          id: "h7",
          name: "Wearable & Personal Gifts",
          image: require("../assets/MainCatImages/images/HomelyHub.png"),
        },
      ],
    },
  ],
  sportswear: [
    {
      title: "Sportswear",
      items: [
        {
          id: "s1",
          name: "Activewear",
          image: require("../assets/MainCatImages/images/Sportswear.png"),
        },
        {
          id: "s2",
          name: "Tracksuits",
          image: require("../assets/MainCatImages/images/Sportswear.png"),
        },
        {
          id: "s3",
          name: "Jerseys",
          image: require("../assets/MainCatImages/images/Sportswear.png"),
        },
      ],
    },
  ],
  footwear: [
    {
      title: "Footwear",
      items: [
        {
          id: "f1",
          name: "Sneakers",
          image: require("../assets/MainCatImages/images/Footwear.png"),
        },
        {
          id: "f2",
          name: "Sandals",
          image: require("../assets/MainCatImages/images/Footwear.png"),
        },
        {
          id: "f3",
          name: "Formals",
          image: require("../assets/MainCatImages/images/Footwear.png"),
        },
      ],
    },
  ],
  accessories: [],
  sweets: [
    {
      title: "sweets",
      items: [
        {
          id: "sw1",
          name: "Traditional sweets",
          image: require("../assets/MainCatImages/images/Sweets.png"),
        },
        {
          id: "sw2",
          name: "Chocolates",
          image: require("../assets/MainCatImages/images/Sweets.png"),
        },
        {
          id: "sw3",
          name: "Dry fruits",
          image: require("../assets/MainCatImages/images/Sweets.png"),
        },
      ],
    },
  ],
  beautyPersonalCare: [
    {
      title: "Beauty & care",
      items: [
        {
          id: "bc1",
          name: "Skincare",
          image: require("../assets/MainCatImages/images/Beauty&PersonalCare.png"),
        },
        {
          id: "bc2",
          name: "Hair care",
          image: require("../assets/MainCatImages/images/Beauty&PersonalCare.png"),
        },
        {
          id: "bc3",
          name: "Bath & body",
          image: require("../assets/MainCatImages/images/Beauty&PersonalCare.png"),
        },
      ],
    },
  ],
  gaargi: [
    {
      title: "Gaargi",
      items: [
        {
          id: "g1",
          name: "Featured picks",
          image: require("../assets/MainCatImages/images/Gaargi.png"),
        },
        {
          id: "g2",
          name: "New arrivals",
          image: require("../assets/MainCatImages/images/Gaargi.png"),
        },
        {
          id: "g3",
          name: "Bestsellers",
          image: require("../assets/MainCatImages/images/Gaargi.png"),
        },
      ],
    },
  ],
  indoorPlayEquipments: [
    {
      title: "Indoor play",
      items: [
        {
          id: "ip1",
          name: "Play mats & gyms",
          image: require("../assets/MainCatImages/images/IndoorPlayEquipments.png"),
        },
        {
          id: "ip2",
          name: "Slides & climbers",
          image: require("../assets/MainCatImages/images/IndoorPlayEquipments.png"),
        },
        {
          id: "ip3",
          name: "Indoor games",
          image: require("../assets/MainCatImages/images/IndoorPlayEquipments.png"),
        },
      ],
    },
  ],
};

export default function Categories() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("womenswear");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [sideCategories, setSideCategories] = useState<SideCategory[]>(
    SIDE_CATEGORIES_FALLBACK
  );
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const sections = CATEGORY_CONTENT[activeCategory] || [];

  // All sections from every main category, used for global search
  const allSections = useMemo(
    () => Object.values(CATEGORY_CONTENT).flat(),
    []
  );

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // When there is no search text, show only the active category's sections
    if (!query) return sections;

    // When searching, look across all categories so items like "Sarees"
    // are found even if you're currently on another main category tab.
    return allSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.name.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, allSections, searchQuery]);

  // When returning back to this screen from any category page,
  // keep the Categories screen clean: do not show the previous subcategory list.
  useFocusEffect(
    React.useCallback(() => {
      setIsSearchVisible(false);
      setSearchQuery("");
      setIsSideBarOpen(false);
      setActiveCategory("womenswear");
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoadingCategories(true);
        const res = await api.get("/api/categories/main");
        const json = res.data as ApiMainCategory[];
        if (!isMounted) return;

        const mapped: SideCategory[] = (Array.isArray(json) ? json : [])
          .filter((c) => c && c.status === 1 && typeof c.categoryName === "string")
          .map((c) => {
            const key = categoryNameToKey(c.categoryName);
            if (!key) return null;
            // If API doesn't provide mobileImage, keep manual image for that category.
            const img = c.mobileImage ? { uri: c.mobileImage } : fallbackImageForKey(key);
            return { key, label: c.categoryName, image: img };
          })
          .filter(Boolean) as SideCategory[];

        // Order requirement:
        // 1) Show API categories first (in API order)
        // 2) Then append any manual categories missing from API
        const apiKeys = new Set(mapped.map((c) => c.key));
        const missingManual = SIDE_CATEGORIES_FALLBACK.filter(
          (manual) => !apiKeys.has(manual.key)
        );
        setSideCategories([...mapped, ...missingManual]);
      } catch {
        if (!isMounted) return;
        setSideCategories(SIDE_CATEGORIES_FALLBACK);
      } finally {
        if (!isMounted) return;
        setIsLoadingCategories(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const mainCategoryCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sideCategories;

    return sideCategories.filter((c) =>
      c.label.toLowerCase().includes(query)
    );
  }, [searchQuery, sideCategories]);

  const handleCategoriesHeaderBack = () => {
    if (isSearchVisible) {
      setIsSearchVisible(false);
      return;
    }
    if (!router.canGoBack()) {
      router.replace("/home");
      return;
    }
    router.dismissTo("/home" as Href);
  };

  return (
    <View style={styles.container}>
      {/* HEADER + INLINE SEARCH */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCategoriesHeaderBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Image
            source={require("../assets/MainCatImages/images/fntfav.png")}
            style={styles.headerFavicon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        {isSearchVisible ? (
          <View style={styles.headerSearchWrapper}>
            
            <TextInput
              placeholder="Search categories"
              placeholderTextColor="#69798c"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInputHeader}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>Pick Your Style</Text>
        )}

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => setIsSearchVisible((prev) => !prev)}
            style={styles.headerIcon}
          >
            <Ionicons name="search-outline" size={20} color="#ef7b1a" />
          </TouchableOpacity>
          <Ionicons
            name="heart"
            size={20}
            color="red"
            style={styles.headerIcon}
          />
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={styles.headerIcon}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color="#000"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.contentRow}>
        {/* LEFT SIDE CATEGORY LIST */}
        {isSideBarOpen && (
          <ScrollView
            style={styles.sideBar}
            contentContainerStyle={styles.sideBarContent}
            showsVerticalScrollIndicator={false}
          >
            {sideCategories.map((cat) => {
              const isActive = cat.key === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => {
                    if (cat.key === "womenswear") {
                      setIsSideBarOpen(false);
                      router.push("/women" as Href);
                      return;
                    }
                    if (cat.key === "menswear") {
                      setIsSideBarOpen(false);
                      router.push("/men" as Href);
                      return;
                    }
                    if (cat.key === "kidswear") {
                      setIsSideBarOpen(false);
                      router.push("/kids" as Href);
                      return;
                    }
                    if (cat.key === "homelyHub") {
                      setIsSideBarOpen(false);
                      router.push("/gifts" as Href);
                      return;
                    }
                    if (cat.key === "indoorPlayEquipments") {
                      setIsSideBarOpen(false);
                      router.push("/indoorplay" as Href);
                      return;
                    }
                    setActiveCategory(cat.key);
                    setIsSideBarOpen(false);
                  }}
                  style={[styles.sideItem, isActive && styles.sideItemActive]}
                >
                  <Image
                    source={cat.image}
                    style={styles.sideImage}
                    resizeMode="cover"
                  />
                  <Text
                    style={[styles.sideLabel, isActive && styles.sideLabelActive]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* RIGHT SIDE SECTIONS & SUBCATEGORIES */}
        <ScrollView
          style={styles.sectionContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionBlock}>
            {isLoadingCategories ? (
              <View style={{ paddingVertical: 18, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#ef7b1a" />
              </View>
            ) : null}
            <View style={styles.itemsGrid}>
              {mainCategoryCards.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      style={styles.itemCard}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (cat.key === "womenswear") {
                          router.push("/women" as Href);
                          return;
                        }
                        if (cat.key === "menswear") {
                          router.push("/men" as Href);
                          return;
                        }
                        if (cat.key === "kidswear") {
                          router.push("/kids" as Href);
                          return;
                        }
                        if (cat.key === "homelyHub") {
                          router.push("/gifts" as Href);
                          return;
                        }
                        if (cat.key === "accessories") {
                          router.push("/accessories" as Href);
                          return;
                        }
                        if (cat.key === "sportswear") {
                          router.push("/sportswear" as Href);
                          return;
                        }
                        if (cat.key === "beautyPersonalCare") {
                          router.push("/beauty-personal-care" as Href);
                          return;
                        }
                        if (cat.key === "sweets") {
                          router.push("/sweets" as Href);
                          return;
                        }
                        if (cat.key === "footwear") {
                          router.push("/footwear" as Href);
                          return;
                        }
                        if (cat.key === "indoorPlayEquipments") {
                          router.push("/indoorplay" as Href);
                          return;
                        }
                        setActiveCategory(cat.key);
                        router.push({
                          pathname: "/subcate",
                          params: { mainCat: cat.key },
                        });
                      }}
                    >
                      <View style={styles.itemImageWrapper}>
                        <Image
                          source={cat.image}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      </View>
                      <Text style={styles.itemLabel} numberOfLines={2}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </View>

            {filteredSections.length > 0 ? (
              <View style={styles.subCategoriesBlock}>
                {filteredSections.map((section) => (
                  <View key={section.title} style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.itemsGrid}>
                      {section.items.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.itemCard}
                          activeOpacity={0.85}
                          onPress={() =>
                            router.push({
                              pathname: "/subcate",
                              params: {
                                mainCat: activeCategory,
                              },
                            })
                          }
                        >
                          <View style={styles.itemImageWrapper}>
                            <Image
                              source={item.image}
                              style={styles.itemImage}
                              resizeMode="cover"
                            />
                          </View>
                          <Text style={styles.itemLabel} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: isDesktop ? 40 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: isDesktop ? 60 : 48,
    paddingHorizontal: isDesktop ? 32 : 16,
    paddingBottom: isDesktop ? 16 : 12,
    backgroundColor: "#ffffff",
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  headerFavicon: {
    width: isDesktop ? 44 : 36,
    height: isDesktop ? 44 : 36,
  },
  headerTitle: {
    fontSize: isDesktop ? 22 : 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
    marginLeft: 4,
    color: "#1d324e",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 14,
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",

  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: isDesktop ? 16 : 8,
    paddingHorizontal: isDesktop ? 16 : 10,
    paddingVertical: isDesktop ? 8 : 4,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInputHeader: {
    flex: 1,
    fontSize: isDesktop ? 16 : 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  sideBar: {
    flexShrink: 0,
    width: 0.1,
    backgroundColor: "#ffffff",
  },
  sideBarContent: {
    paddingVertical: 16,
    
  },
  sideItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  sideItemActive: {
    backgroundColor: "#79411c",
  },
  sideImage: {
    width: isDesktop ? 120 : 100,
    height: isDesktop ? 120 : 100,
    borderRadius: 8,
    marginBottom: 3,
    backgroundColor: "transparent",
  },
  sideLabel: {
    fontSize: isDesktop ? 13 : 11,
    color: "#1d324e",
    textAlign: "center",
  },
  sideLabelActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: isDesktop ? 24 : 12,
    paddingTop: isDesktop ? 24 : 16,
  },
  sideToggleColumn: {
    width: 40,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingRight: 8,
  },
  sideToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
  },
  sectionBlock: {
    marginBottom: 24,
  },
  subCategoriesBlock: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
  },
  sectionTitle: {
    fontSize: isDesktop ? 18 : 14,
    fontWeight: "600",
    marginBottom: isDesktop ? 12 : 10,
    textTransform: "capitalize",
    color: "#1d324e",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: isDesktop ? 24 : 18,
    paddingHorizontal: isDesktop ? 12 : 6,
  },
  itemCard: {
    width: isDesktop ? "30%" : "48%",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: isDesktop ? 16 : 12,
    paddingHorizontal: isDesktop ? 16 : 10,
    marginBottom: isDesktop ? 24 : 18,
    alignItems: "center",
  },
  itemImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemLabel: {
    fontSize: isDesktop ? 14 : 12,
    fontWeight: "600",
    marginTop: isDesktop ? 12 : 10,
    color: "#1d324e",
    textAlign: "center",
  },
});
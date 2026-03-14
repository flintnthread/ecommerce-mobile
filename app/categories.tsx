import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type CategoryKey =
  | "trending"
  | "womenswear"
  | "menswear"
  | "kidswear"
  | "sportswear"
  | "footwear"
  | "accessories"
  | "homelyHub"
  | "fitnessPro"
  | "sweets";

type SideCategory = {
  key: CategoryKey;
  label: string;
  image: any;
};

const SIDE_CATEGORIES: SideCategory[] = [
  {
    key: "trending",
    label: "trending",
    image: require("../assets/images/womencate.png"),
  },
  {
    key: "womenswear",
    label: "womenswear",
    image: require("../assets/images/womencate.png"),
  },
  {
    key: "menswear",
    label: "menswear",
    image: require("../assets/images/menscate.png"),
  },
  {
    key: "kidswear",
    label: "kidswear",
    image: require("../assets/images/kidscate.png"),
  },
  {
    key: "sportswear",
    label: "sportswear",
    image: require("../assets/images/sportscate.png"),
  },
  {
    key: "footwear",
    label: "footwear",
    image: require("../assets/images/footwearcate.png"),
  },
  {
    key: "accessories",
    label: "Accessories",
    image: require("../assets/images/accessariescate.png"),
  },
  {
    key: "homelyHub",
    label: "homely hub",
    image: require("../assets/images/homecate.png"),
  },
  {
    key: "fitnessPro",
    label: "f&t pro",
    image: require("../assets/images/sportscate.png"),
  },
  {
    key: "sweets",
    label: "sweets",
    image: require("../assets/images/sweetscate.png"),
  },
];

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
  trending: [
    {
      title: "popular items",
      items: [
        {
          id: "t1",
          name: "Trending styles",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "t2",
          name: "Best sellers",
          image: require("../assets/images/menscate.png"),
        },
        {
          id: "t3",
          name: "New arrivals",
          image: require("../assets/images/kidscate.png"),
        },
        {
          id: "t4",
          name: "Season picks",
          image: require("../assets/images/sportscate.png"),
        },
        {
          id: "t5",
          name: "Daily essentials",
          image: require("../assets/images/homecate.png"),
        },
        {
          id: "t6",
          name: "Limited offers",
          image: require("../assets/images/sweetscate.png"),
        },
      ],
    },
  ],
  womenswear: [
    {
      title: "Ethnic wear",
      items: [
        {
          id: "w1",
          name: "Sarees",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w2",
          name: "Kurtas & Kurtis",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w3",
          name: "Lehengas",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w13",
          name: "Gowns",
          image: require("../assets/images/womencate.png"),
        },
      ],
    },
    {
      title: "Lingerie & Sleepwear",
      items: [
        {
          id: "w4",
          name: "Bras",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w5",
          name: "Briefs",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w6",
          name: "Nightwear",
          image: require("../assets/images/womencate.png"),
        },
      ],
    },
    {
      title: "western wear",
      items: [
        {
          id: "w7",
          name: "Tops & Tees",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w8",
          name: "Dresses",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w9",
          name: "Jeans",
          image: require("../assets/images/womencate.png"),
        },
      ],
    },
    {
      title: "winterwear",
      items: [
        {
          id: "w10",
          name: "Sweaters",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w11",
          name: "Jackets",
          image: require("../assets/images/womencate.png"),
        },
        {
          id: "w12",
          name: "Co-ords",
          image: require("../assets/images/womencate.png"),
        },
      ],
    },
  ],
  menswear: [
    {
      title: "Menswear picks",
      items: [
        {
          id: "m1",
          name: "Casual shirts",
          image: require("../assets/images/menscate.png"),
        },
        {
          id: "m2",
          name: "T-shirts",
          image: require("../assets/images/menscate.png"),
        },
        {
          id: "m3",
          name: "Jeans & Trousers",
          image: require("../assets/images/menscate.png"),
        },
      ],
    },
  ],
  kidswear: [
    {
      title: "Kidswear picks",
      items: [
        {
          id: "k1",
          name: "Boys clothing",
          image: require("../assets/images/kidscate.png"),
        },
        {
          id: "k2",
          name: "Girls clothing",
          image: require("../assets/images/kidscate.png"),
        },
        {
          id: "k3",
          name: "Infant wear",
          image: require("../assets/images/kidscate.png"),
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
          image: require("../assets/images/sportscate.png"),
        },
        {
          id: "s2",
          name: "Tracksuits",
          image: require("../assets/images/sportscate.png"),
        },
        {
          id: "s3",
          name: "Jerseys",
          image: require("../assets/images/sportscate.png"),
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
          image: require("../assets/images/footwearcate.png"),
        },
        {
          id: "f2",
          name: "Sandals",
          image: require("../assets/images/footwearcate.png"),
        },
        {
          id: "f3",
          name: "Formals",
          image: require("../assets/images/footwearcate.png"),
        },
      ],
    },
  ],
  accessories: [
    {
      title: "Accessories",
      items: [
        {
          id: "a1",
          name: "Bags",
          image: require("../assets/images/accessariescate.png"),
        },
        {
          id: "a2",
          name: "Belts",
          image: require("../assets/images/accessariescate.png"),
        },
        {
          id: "a3",
          name: "Jewellery",
          image: require("../assets/images/accessariescate.png"),
        },
      ],
    },
  ],
  homelyHub: [
    {
      title: "homely hub",
      items: [
        {
          id: "h1",
          name: "Home decor",
          image: require("../assets/images/homecate.png"),
        },
        {
          id: "h2",
          name: "Kitchen & dining",
          image: require("../assets/images/homecate.png"),
        },
        {
          id: "h3",
          name: "Bedding",
          image: require("../assets/images/homecate.png"),
        },
      ],
    },
  ],
  fitnessPro: [
    {
      title: "f&t pro",
      items: [
        {
          id: "fp1",
          name: "Gym wear",
          image: require("../assets/images/sportscate.png"),
        },
        {
          id: "fp2",
          name: "Fitness gear",
          image: require("../assets/images/sportscate.png"),
        },
        {
          id: "fp3",
          name: "Yoga essentials",
          image: require("../assets/images/sportscate.png"),
        },
      ],
    },
  ],
  sweets: [
    {
      title: "sweets",
      items: [
        {
          id: "sw1",
          name: "Traditional sweets",
          image: require("../assets/images/sweetscate.png"),
        },
        {
          id: "sw2",
          name: "Chocolates",
          image: require("../assets/images/sweetscate.png"),
        },
        {
          id: "sw3",
          name: "Dry fruits",
          image: require("../assets/images/sweetscate.png"),
        },
      ],
    },
  ],
};

export default function Categories() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("trending");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);

  const sections = CATEGORY_CONTENT[activeCategory] || [];

  // All sections from every main category, used for global search
  const allSections = React.useMemo(
    () => Object.values(CATEGORY_CONTENT).flat(),
    []
  );

  const filteredSections = React.useMemo(() => {
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

  return (
    <View style={styles.container}>
      {/* HEADER + INLINE SEARCH */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>

        {isSearchVisible ? (
          <View style={styles.headerSearchWrapper}>
            
            <TextInput
              placeholder="Search subcategories"
              placeholderTextColor="#69798c"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInputHeader}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>Categories</Text>
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
          <Ionicons name="cart-outline" size={20} color="#1d324e" />
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
            {SIDE_CATEGORIES.map((cat) => {
              const isActive = cat.key === activeCategory;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => {
                    setActiveCategory(cat.key);
                    setIsSideBarOpen(false);
                  }}
                  style={[styles.sideItem, isActive && styles.sideItemActive]}
                >
                  <Image
                    source={cat.image}
                    style={[styles.sideImage, isActive && styles.sideImageActive]}
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
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredSections.map((section) => (
            <View key={section.title} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.itemsGrid}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    activeOpacity={0.85}
                    onPress={() => router.push("/subcate")}
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
        </ScrollView>

        {/* RIGHT-SIDE HAMBURGER TOGGLE (only when sidebar is closed) */}
        {!isSideBarOpen && (
          <View style={styles.sideToggleColumn}>
            <TouchableOpacity
              style={styles.sideToggleButton}
              onPress={() => setIsSideBarOpen(true)}
            >
              <Ionicons name="menu-outline" size={20} color="#1d324e" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f6c795",
    backgroundColor: "#f6c795",
  },
  backButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 18,
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
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FFEBD3",
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInputHeader: {
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  sideBar: {
    flexShrink: 0,
    width: 0.1,
    backgroundColor: "#FFF0E0",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#f6c795",
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
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 3,
    backgroundColor: "#D8D8E2",
  },
  sideImageActive: {
    borderWidth: 2,
    borderColor: "#ef7b1a",

  },
  sideLabel: {
    fontSize: 11,
    color: "#1d324e",
    textAlign: "center",
  },
  sideLabelActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
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
    backgroundColor: "#F6F6F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "capitalize",
    color: "#1d324e",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 18,
    paddingLeft: 36,
  },
  itemCard: {
    width: "48%",
    marginBottom: 18,
  },
  itemImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemLabel: {
    fontSize: 11,
    marginTop: 4,
    color: "#1d324e",
    textAlign: "center",
  },
  
});
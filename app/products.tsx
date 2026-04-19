import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  type ImageSourcePropType,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import {
  addProductToCart,
  getWishlistIds,
  toggleWishlistProduct,
} from "../lib/shopStorage";

const { width: SCREEN_W } = Dimensions.get("window");
const SIDE_PAD = 12;
const COL_GAP = 8;
const CARD_W = (SCREEN_W - SIDE_PAD * 2 - COL_GAP) / 2;

type GenderTag = "Women" | "Men" | "Girls" | "Boys";

type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  image: ImageSourcePropType;
  rating: number;
  reviews?: number;
  supplier?: string;
  /** Subset of `categoryOptions` labels used to match home category filters */
  homeCategoryTags: string[];
  genderTag: GenderTag;
  colorTag: string;
  sizeTag: string;
  fabricTag?: string;
};

const sortOptions = [
  "Relevance",
  "New Arrivals",
  "Price (High to Low)",
  "Price (Low to High)",
  "Ratings",
  "Discount",
];

const genderOptions = [
  {
    label: "Women",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  },
  {
    label: "Men",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  },
  {
    label: "Girls",
    image:
      "https://www.jiomart.com/images/product/original/rvqld2qupj/trilok-fab-girls-woven-design-art-silk-dress-product-images-rvqld2qupj-3-202409231515.jpg?im=Resize=(500,630)",
  },
  {
    label: "Boys",
    image:
      "https://images.unsplash.com/photo-1627639679638-8485316a4b21?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y3V0ZSUyMGtpZHxlbnwwfHwwfHx8MA%3D%3D",
  },
];

const categoryOptions = [
  "Women Bra",
  "Hair Accessories",
  "Women T-shirts",
  "Women Tops And Tunics",
  "Women Bangles & Bracelets",
  "Kids Toys",
  "Men Shirts",
  "Men T-shirts",
  "Women Dupatta Sets",
  "Women Kurta Sets",
  "Women Kurtis",
  "Dupatta Sets",
  "Analog Watches",
  "Bakeware",
  "Bedsheets",
  "Bike Covers",
  "Blouses",
  "Bluetooth Headphones",
];

const filterSections = [
  "Category",
  "Gender",
  "Color",
  "Fabric",
  "Dial Shape",
  "Size",
  "Price",
  "Rating",
  "Occassion",
  "combo of",
  "Kurta Fabric",
  "Dupatta Color",
];

const filterOptions: Record<string, string[]> = {
  Category: categoryOptions,
  Gender: ["Women", "Men", "Girls", "Boys"],
  Color: ["Black", "Blue", "Pink", "Red", "White", "Green"],
  Fabric: ["Cotton", "Rayon", "Silk", "Polyester", "Linen"],
  "Dial Shape": ["Round", "Square", "Oval", "Rectangle"],
  Size: ["XS", "S", "M", "L", "XL", "XXL"],
  Price: ["Below ₹299", "₹300 - ₹499", "₹500 - ₹999", "Above ₹1000"],
  Rating: ["4★ & above", "3★ & above", "2★ & above"],
  Occassion: ["Casual", "Party", "Festive", "Wedding"],
  "combo of": ["Pack of 1", "Pack of 2", "Pack of 3", "Pack of 5"],
  "Kurta Fabric": ["Cotton", "Silk", "Rayon", "Georgette"],
  "Dupatta Color": ["Pink", "Red", "Yellow", "Blue", "White"],
};

function matchesHomePriceBuckets(price: number, buckets: string[] | undefined) {
  if (!buckets?.length) return true;
  return buckets.some((b) => {
    if (b === "Below ₹299") return price < 299;
    if (b === "₹300 - ₹499") return price >= 300 && price <= 499;
    if (b === "₹500 - ₹999") return price >= 500 && price <= 999;
    if (b === "Above ₹1000") return price >= 1000;
    return true;
  });
}

function matchesRatingFilter(rating: number, buckets: string[] | undefined) {
  if (!buckets?.length) return true;
  return buckets.some((b) => {
    if (b.startsWith("4")) return rating >= 4;
    if (b.startsWith("3")) return rating >= 3;
    if (b.startsWith("2")) return rating >= 2;
    return true;
  });
}

/** If product has no tag for this dimension, keep it visible (permissive). */
function matchesOptionalTag(
  productVal: string | undefined,
  selected: string[] | undefined
) {
  if (!selected?.length) return true;
  if (!productVal) return true;
  return selected.includes(productVal);
}

const demoProducts: Product[] = [
  {
    id: "p1",
    name: "Women Floral Printed Cotton Dress",
    price: 109,
    mrp: 184,
    image: require("../assets/images/look1.png"),
    rating: 4.2,
    reviews: 136,
    homeCategoryTags: ["Women Kurtis", "Women T-shirts"],
    genderTag: "Women",
    colorTag: "Pink",
    sizeTag: "S",
    fabricTag: "Cotton",
  },
  {
    id: "p2",
    name: "Casual A-line summer dress",
    price: 265,
    mrp: 999,
    image: require("../assets/images/look2.png"),
    rating: 4.5,
    reviews: 89,
    homeCategoryTags: ["Women Tops And Tunics", "Women T-shirts"],
    genderTag: "Women",
    colorTag: "Blue",
    sizeTag: "M",
    fabricTag: "Cotton",
  },
  {
    id: "p3",
    name: "Printed kurta set with dupatta",
    price: 316,
    mrp: 1499,
    image: require("../assets/images/look3.png"),
    rating: 4.0,
    supplier: "Supplier",
    homeCategoryTags: ["Women Kurta Sets", "Dupatta Sets"],
    genderTag: "Women",
    colorTag: "Green",
    sizeTag: "L",
    fabricTag: "Silk",
  },
  {
    id: "p4",
    name: "Women ethnic wear combo",
    price: 361,
    mrp: 2199,
    image: require("../assets/images/look4.png"),
    rating: 4.3,
    reviews: 210,
    homeCategoryTags: ["Women Kurtis", "Blouses"],
    genderTag: "Women",
    colorTag: "Red",
    sizeTag: "XL",
    fabricTag: "Rayon",
  },
  {
    id: "p5",
    name: "Pahirava Women printed kurti",
    price: 311,
    mrp: 2199,
    image: require("../assets/images/product1.png"),
    rating: 4.1,
    reviews: 54,
    homeCategoryTags: ["Women Kurtis"],
    genderTag: "Women",
    colorTag: "Black",
    sizeTag: "M",
    fabricTag: "Cotton",
  },
  {
    id: "p6",
    name: "Niharika Creation cotton top",
    price: 215,
    mrp: 999,
    image: require("../assets/images/product2.png"),
    rating: 3.9,
    reviews: 412,
    homeCategoryTags: ["Women T-shirts", "Women Tops And Tunics"],
    genderTag: "Women",
    colorTag: "White",
    sizeTag: "L",
    fabricTag: "Cotton",
  },
  {
    id: "p7",
    name: "MABRI Women festive kurta",
    price: 266,
    mrp: 1499,
    image: require("../assets/images/product3.png"),
    rating: 4.4,
    supplier: "Supplier",
    homeCategoryTags: ["Women Kurta Sets"],
    genderTag: "Women",
    colorTag: "Blue",
    sizeTag: "M",
    fabricTag: "Silk",
  },
  {
    id: "p8",
    name: "Premokar printed dress material",
    price: 241,
    mrp: 1999,
    image: require("../assets/images/product4.png"),
    rating: 4.0,
    reviews: 98,
    homeCategoryTags: ["Women Kurtis", "Blouses"],
    genderTag: "Women",
    colorTag: "Pink",
    sizeTag: "S",
    fabricTag: "Rayon",
  },
  {
    id: "p9",
    name: "Air Zoom running shoes",
    price: 899,
    mrp: 2499,
    image: require("../assets/images/sports6.png"),
    rating: 4.6,
    reviews: 1203,
    homeCategoryTags: ["Men T-shirts", "Bluetooth Headphones"],
    genderTag: "Men",
    colorTag: "Black",
    sizeTag: "L",
    fabricTag: "Polyester",
  },
  {
    id: "p10",
    name: "Gym training tee quick dry",
    price: 449,
    mrp: 899,
    image: require("../assets/images/sports2.png"),
    rating: 4.2,
    reviews: 67,
    homeCategoryTags: ["Men T-shirts", "Men Shirts"],
    genderTag: "Men",
    colorTag: "White",
    sizeTag: "XL",
    fabricTag: "Polyester",
  },
  {
    id: "p11",
    name: "Premium party wear dress",
    price: 599,
    mrp: 1799,
    image: require("../assets/images/premium1.png"),
    rating: 4.5,
    reviews: 44,
    homeCategoryTags: ["Women Kurtis", "Women Dupatta Sets"],
    genderTag: "Women",
    colorTag: "Pink",
    sizeTag: "M",
    fabricTag: "Silk",
  },
  {
    id: "p12",
    name: "Everyday cotton t-shirt pack",
    price: 199,
    mrp: 499,
    image: require("../assets/images/product5.png"),
    rating: 3.8,
    reviews: 512,
    homeCategoryTags: ["Men T-shirts"],
    genderTag: "Men",
    colorTag: "Green",
    sizeTag: "M",
    fabricTag: "Cotton",
  },
];

const placeholderTexts = [" Shoes", " Womens Wear", " Fashion", " Sportswear"];

function discountPct(price: number, mrp: number) {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

type ProductGridCardProps = {
  item: Product;
  inWishlist: boolean;
  onOpen: () => void;
  onWishlistPress: () => void;
  onAddToCart: () => void;
};

function ProductGridCard({
  item,
  inWishlist,
  onOpen,
  onWishlistPress,
  onAddToCart,
}: ProductGridCardProps) {
  const off = discountPct(item.price, item.mrp);
  const meta =
    item.reviews != null ? `(${item.reviews})` : item.supplier ?? "";

  return (
    <Pressable
      style={[styles.gridCard, { width: CARD_W }]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
    >
      <View style={styles.imageWrap}>
        <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
        <Pressable
          style={styles.heartBtn}
          onPress={onWishlistPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={
            inWishlist ? "Remove from wishlist" : "Add to wishlist"
          }
        >
          <Ionicons
            name={inWishlist ? "heart" : "heart-outline"}
            size={20}
            color={inWishlist ? "#E11D48" : "#64748B"}
          />
        </Pressable>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.priceNow}>₹{item.price}</Text>
        <Text style={styles.priceMrp}>₹{item.mrp}</Text>
        {off > 0 ? (
          <Text style={styles.priceOff}>{off}% off</Text>
        ) : null}
      </View>
      <View style={styles.discountPill}>
        <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
        <Text style={styles.discountPillText}>Discount Applied</Text>
      </View>
      <View style={styles.ratingRow}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>{item.rating}</Text>
          <Ionicons name="star" size={11} color="#fff" />
        </View>
        {meta ? <Text style={styles.metaGrey}>{meta}</Text> : null}
      </View>
      <Pressable
        style={styles.addToCartBtn}
        onPress={onAddToCart}
        accessibilityRole="button"
        accessibilityLabel={`Add ${item.name} to cart`}
      >
        <Text style={styles.addToCartBtnText}>Add to Cart</Text>
      </Pressable>
    </Pressable>
  );
}

export default function Products() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedFilterSection, setSelectedFilterSection] = useState("Category");
  const [searchCategoryText, setSearchCategoryText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const refreshWishlistIds = useCallback(() => {
    void getWishlistIds().then(setWishlistIds);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWishlistIds();
    }, [refreshWishlistIds])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) =>
        prev === placeholderTexts.length - 1 ? 0 : prev + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const launchGoogleVoiceInput = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Voice search",
        "Google voice input is available on Android. On iPhone, type your search in the bar."
      );
      return;
    }
    try {
      const result = await IntentLauncher.startActivityAsync(
        "android.speech.action.RECOGNIZE_SPEECH",
        {
          extra: {
            "android.speech.extra.LANGUAGE_MODEL": "free_form",
            "android.speech.extra.PROMPT": "What do you want to search for?",
            "android.speech.extra.LANGUAGE": "en-US",
          },
        }
      );
      if (
        result.resultCode === IntentLauncher.ResultCode.Success &&
        result.extra
      ) {
        const e = result.extra as Record<string, unknown>;
        const raw = e["android.speech.extra.RESULTS"] ?? e.results;
        if (Array.isArray(raw) && raw.length > 0) {
          setSearchQuery(String(raw[0]));
          return;
        }
      }
    } catch {
      Alert.alert(
        "Voice search",
        "Could not open speech recognition. Check Google / speech services on your device."
      );
    }
  };

  const startVoiceSearch = () => {
    Alert.alert(
      "Microphone access",
      "Allow microphone access to use voice search?",
      [
        { text: "Don't allow", style: "cancel" },
        { text: "Allow", onPress: () => void launchGoogleVoiceInput() },
      ]
    );
  };

  const launchProductsCamera = useCallback(async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== "granted") {
      Alert.alert("Permission required", "Camera permission is required.");
      return;
    }
    await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
  }, []);

  const openCamera = () => {
    Alert.alert("Camera access", "Allow camera access to take photos?", [
      { text: "Don't allow", style: "cancel" },
      {
        text: "Allow",
        onPress: () => {
          Alert.alert("Camera", "Camera option opened.", [
            { text: "OK", onPress: () => void launchProductsCamera() },
          ]);
        },
      },
    ]);
  };

  const handleFilterPress = (label: string) => {
    if (label === "Sort") setSortModalVisible(true);
    if (label === "Category") setCategoryModalVisible(true);
    if (label === "Gender") setGenderModalVisible(true);
    if (label === "Filter") setFilterModalVisible(true);
  };

  const toggleCategory = (item: string) => {
    if (selectedCategory.includes(item)) {
      setSelectedCategory(selectedCategory.filter((cat) => cat !== item));
    } else {
      setSelectedCategory([...selectedCategory, item]);
    }
  };

  const toggleFilterOption = (section: string, item: string) => {
    const existingValues = selectedFilters[section] || [];

    if (existingValues.includes(item)) {
      setSelectedFilters({
        ...selectedFilters,
        [section]: existingValues.filter((value) => value !== item),
      });
    } else {
      setSelectedFilters({
        ...selectedFilters,
        [section]: [...existingValues, item],
      });
    }
  };

  const clearCategoryModalSelections = () => {
    setSelectedCategory([]);
    setSelectedFilters((prev) => {
      const next = { ...prev };
      delete next.Category;
      return next;
    });
  };

  const clearGenderModalSelection = () => {
    setSelectedGender("");
    setSelectedFilters((prev) => {
      const next = { ...prev };
      delete next.Gender;
      return next;
    });
  };

  const clearFilterModalSelections = () => {
    setSelectedFilters({});
    setSelectedCategory([]);
    setSelectedGender("");
  };

  const displayedCategories = categoryOptions.filter((item) =>
    item.toLowerCase().includes(searchCategoryText.toLowerCase())
  );

  const displayedFilterOptions =
    selectedFilterSection === "Category"
      ? (filterOptions[selectedFilterSection] || []).filter((item) =>
          item.toLowerCase().includes(searchCategoryText.toLowerCase())
        )
      : filterOptions[selectedFilterSection] || [];

  const filtered = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    let list = !s
      ? [...demoProducts]
      : demoProducts.filter((p) => p.name.toLowerCase().includes(s));

    const categoryPick = new Set([
      ...selectedCategory,
      ...(selectedFilters.Category || []),
    ]);
    if (categoryPick.size > 0) {
      list = list.filter((p) =>
        p.homeCategoryTags.some((c) => categoryPick.has(c))
      );
    }

    const genderPick = new Set<string>([
      ...(selectedGender ? [selectedGender] : []),
      ...(selectedFilters.Gender || []),
    ]);
    if (genderPick.size > 0) {
      list = list.filter((p) => genderPick.has(p.genderTag));
    }

    const colors = selectedFilters.Color;
    if (colors?.length) {
      list = list.filter((p) => colors.includes(p.colorTag));
    }
    const sizes = selectedFilters.Size;
    if (sizes?.length) {
      list = list.filter((p) => sizes.includes(p.sizeTag));
    }
    if (selectedFilters.Price?.length) {
      list = list.filter((p) =>
        matchesHomePriceBuckets(p.price, selectedFilters.Price)
      );
    }
    if (selectedFilters.Rating?.length) {
      list = list.filter((p) =>
        matchesRatingFilter(p.rating, selectedFilters.Rating)
      );
    }
    if (selectedFilters.Fabric?.length) {
      list = list.filter((p) =>
        matchesOptionalTag(p.fabricTag, selectedFilters.Fabric)
      );
    }

    switch (selectedSort) {
      case "Price (High to Low)":
        list.sort((a, b) => b.price - a.price);
        break;
      case "Price (Low to High)":
        list.sort((a, b) => a.price - b.price);
        break;
      case "Ratings":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "Discount":
        list.sort(
          (a, b) => discountPct(b.price, b.mrp) - discountPct(a.price, a.mrp)
        );
        break;
      case "New Arrivals":
        list = [...list].reverse();
        break;
      default:
        break;
    }
    return list;
  }, [searchQuery, selectedSort, selectedCategory, selectedGender, selectedFilters]);

  const listBottomPad = Math.max(insets.bottom, 12) + 88 + 24;

  const header = (
    <>
      <View
        style={[
          styles.searchRowOuter,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
      >
        <View style={styles.logoMark}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholderTexts[placeholderIndex]}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            onFocus={() => {
              router.push("/search");
            }}
          />
          <TouchableOpacity onPress={openCamera} style={styles.searchBarIconBtn}>
            <Ionicons name="camera-outline" size={22} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={startVoiceSearch}
            style={styles.searchBarIconBtn}
          >
            <Ionicons name="mic-outline" size={22} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterCell}
          onPress={() => handleFilterPress("Sort")}
          accessibilityRole="button"
          accessibilityLabel="Sort"
        >
          <MaterialIcons name="swap-vert" size={18} color="#334155" />
          <Text style={styles.filterLabel}>Sort</Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity
          style={styles.filterCell}
          accessibilityRole="button"
          accessibilityLabel="Category"
          onPress={() => handleFilterPress("Category")}
        >
          <Ionicons name="chevron-down" size={16} color="#334155" />
          <Text style={styles.filterLabel}>Category</Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity
          style={styles.filterCell}
          accessibilityRole="button"
          accessibilityLabel="Gender"
          onPress={() => handleFilterPress("Gender")}
        >
          <Ionicons name="chevron-down" size={16} color="#334155" />
          <Text style={styles.filterLabel}>Gender</Text>
        </TouchableOpacity>
        <View style={styles.filterDivider} />
        <TouchableOpacity
          style={styles.filterCell}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          onPress={() => handleFilterPress("Filter")}
        >
          <MaterialIcons name="tune" size={18} color="#334155" />
          <Text style={styles.filterLabel}>Filters</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: listBottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductGridCard
            item={item}
            inWishlist={wishlistIds.has(item.id)}
            onOpen={() => router.push("/productdetail")}
            onWishlistPress={() => {
              void (async () => {
                await toggleWishlistProduct({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  mrp: item.mrp,
                });
                refreshWishlistIds();
              })();
            }}
            onAddToCart={() => {
              void (async () => {
                await addProductToCart({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  mrp: item.mrp,
                });
                Alert.alert("Added to cart", `${item.name} is in your cart.`);
              })();
            }}
          />
        )}
      />

      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SORT</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            {sortOptions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sortRow}
                onPress={() => {
                  setSelectedSort(item);
                  setSortModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.sortText,
                    selectedSort === item && styles.selectedSortText,
                  ]}
                >
                  {item}
                </Text>

                <View
                  style={[
                    styles.radioOuter,
                    selectedSort === item && styles.radioOuterActive,
                  ]}
                >
                  {selectedSort === item && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fullBottomModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CATEGORY</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.categorySearchBox}>
              <Ionicons
                name="search-outline"
                size={22}
                color="#999"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Search"
                placeholderTextColor="#999"
                value={searchCategoryText}
                onChangeText={setSearchCategoryText}
                style={styles.categorySearchInput}
              />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
              {displayedCategories.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.checkRow}
                  onPress={() => toggleCategory(item)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selectedCategory.includes(item) && styles.checkboxActive,
                    ]}
                  >
                    {selectedCategory.includes(item) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={clearCategoryModalSelections}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Clear category selections"
              >
                <Text style={styles.clearFiltersButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={genderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>USER TYPE</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.genderContainer}>
              {genderOptions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.genderItem}
                  onPress={() => setSelectedGender(item.label)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={[
                      styles.genderImage,
                      selectedGender === item.label && styles.activeGenderImage,
                    ]}
                  />
                  <Text style={styles.genderText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={clearGenderModalSelection}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Clear gender selection"
              >
                <Text style={styles.clearFiltersButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setGenderModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTERS</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterContent}>
              <ScrollView
                style={styles.filterLeftPanel}
                showsVerticalScrollIndicator={false}
              >
                {filterSections.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.leftFilterItem,
                      selectedFilterSection === item &&
                        styles.activeLeftFilterItem,
                    ]}
                    onPress={() => setSelectedFilterSection(item)}
                  >
                    <View
                      style={[
                        styles.leftActiveBar,
                        selectedFilterSection === item && {
                          backgroundColor: "#A0208C",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.leftFilterText,
                        selectedFilterSection === item &&
                          styles.activeLeftFilterText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.filterRightPanel}>
                <Text style={styles.rightTitle}>{selectedFilterSection}</Text>

                {selectedFilterSection === "Category" && (
                  <View style={styles.categorySearchBox}>
                    <Ionicons
                      name="search-outline"
                      size={22}
                      color="#999"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      placeholder="Search"
                      placeholderTextColor="#999"
                      value={searchCategoryText}
                      onChangeText={setSearchCategoryText}
                      style={styles.categorySearchInput}
                    />
                  </View>
                )}

                <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                  {displayedFilterOptions.map((item, index) => {
                    const isSelected =
                      selectedFilters[selectedFilterSection]?.includes(item) ||
                      false;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.checkRow}
                        onPress={() =>
                          toggleFilterOption(selectedFilterSection, item)
                        }
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <Text style={styles.checkText}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={clearFilterModalSelections}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearFiltersButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <HomeBottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: 4,
  },
  columnWrap: {
    justifyContent: "space-between",
    marginBottom: COL_GAP,
  },

  searchRowOuter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIDE_PAD,
    marginBottom: 10,
    gap: 10,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  logoImg: {
    width: 34,
    height: 34,
  },

  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
  },
  searchBarIconBtn: {
    padding: 4,
    marginLeft: 4,
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    marginHorizontal: SIDE_PAD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
    overflow: "hidden",
  },
  filterCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  filterDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },

  gridCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    padding: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    marginBottom: 8,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  heartBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 16,
    minHeight: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  priceNow: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  priceMrp: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  priceOff: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  discountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  discountPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#15803D",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#16A34A",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  metaGrey: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    flexShrink: 1,
  },
  addToCartBtn: {
    marginTop: 10,
    backgroundColor: "#C2410C",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  bottomModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    minHeight: 300,
  },
  fullBottomModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: "82%",
    paddingTop: 10,
  },
  filterModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: "82%",
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 24,
  },
  sortText: {
    fontSize: 18,
    color: "#555",
  },
  selectedSortText: {
    color: "#000",
    fontWeight: "600",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: "#2d33b4",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#243384",
  },
  categorySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: "#fff",
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#888",
    marginRight: 14,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#d48933",
    borderColor: "#d78322",
  },
  checkText: {
    fontSize: 16,
    color: "#666",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 30,
  },
  genderItem: {
    alignItems: "center",
  },
  genderImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  activeGenderImage: {
    borderWidth: 2,
    borderColor: "#224498",
  },
  genderText: {
    marginTop: 10,
    fontSize: 15,
    color: "#333",
  },
  filterContent: {
    flex: 1,
    flexDirection: "row",
  },
  filterLeftPanel: {
    width: "30%",
    backgroundColor: "#F1F1F7",
  },
  leftFilterItem: {
    position: "relative",
    minHeight: 62,
    justifyContent: "center",
    paddingLeft: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },
  activeLeftFilterItem: {
    backgroundColor: "#fff",
  },
  leftActiveBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "transparent",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  leftFilterText: {
    fontSize: 14,
    color: "#666",
  },
  activeLeftFilterText: {
    color: "#28449c",
    fontWeight: "600",
  },
  filterRightPanel: {
    width: "70%",
    backgroundColor: "#fff",
    paddingTop: 12,
  },
  rightTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 86,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  clearFiltersButtonText: {
    fontSize: 16,
    color: "#A0208C",
    fontWeight: "700",
  },
  doneButton: {
    backgroundColor: "#205194",
    paddingHorizontal: 34,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

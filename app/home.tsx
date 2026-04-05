import React, { useCallback, useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { VideoView, useVideoPlayer } from 'expo-video';
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { FlatList } from "react-native";

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Alert,
  Platform,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.6;

interface FilterItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}



export default function Home() {
 const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const placeholderTexts = [
    " Shoes",
    " Womens Wear",
    " Fashion",
    " Sportswear",
  ];
  
  const [searchQuery, setSearchQuery] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("Ramya");

  const loadUserDisplayName = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("userDisplayName");
      if (stored?.trim()) {
        setUserDisplayName(stored.trim());
      }
    } catch {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUserDisplayName();
    }, [loadUserDisplayName])
  );

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
        const raw =
          e["android.speech.extra.RESULTS"] ?? e.results;
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

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerIndex2, setBannerIndex2] = useState(0);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedFilterSection, setSelectedFilterSection] = useState("Category");
  const [searchCategoryText, setSearchCategoryText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const videoBannerPlayer = useVideoPlayer(
    require("../assets/images/videobanner.mp4"),
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  );

  useFocusEffect(
    useCallback(() => {
      videoBannerPlayer.play();
      return () => {
        videoBannerPlayer.pause();
      };
    }, [videoBannerPlayer])
  );

  const banners = [
    require("../assets/images/banner1.png"),
    require("../assets/images/banner2.png"),
    require("../assets/images/banner3.png"),
    require("../assets/images/banner1.png"),
    require("../assets/images/banner5.png"),
  ];
const banners2 = [
  require("../assets/images/banner6.png"),
  require("../assets/images/banner7.png"),
  require("../assets/images/banner8.png"),
   require("../assets/images/banner9.png"),
];



  const serviceItems = [
    {
      id: 1,
      label: "delivery",
      icon: "car-sport-outline" as const,
    },
    {
      id: 2,
      label: "upi payment",
      icon: "wallet-outline" as const,
    },
    {
      id: 3,
      label: "coupons",
      icon: "pricetag-outline" as const,
    },
  ];

  const lookingProducts = [
    {
      id: 1,
      name: "Bangles ",
      image: require("../assets/images/look1.png"),
    },
    {
      id: 2,
      name: "Clock",
      image: require("../assets/images/look2.png"),
    },
    {
      id: 3,
      name: "accessories",
      image: require("../assets/images/look3.png"),
    },
    {
      id: 4,
      name: "Women's wear  ",
      image: require("../assets/images/look4.png"),
    },
  ];

  

  

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) =>
        prev === placeholderTexts.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length]);

useEffect(() => {
  const interval = setInterval(() => {
    setBannerIndex2((prev) => (prev + 1) % banners2.length);
  }, 3000);

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setMegaBannerIndex((prev) =>
      prev === megaBanners.length - 1 ? 0 : prev + 1
    );
  }, 3000);


  




  return () => clearInterval(interval);
}, []);



  const categories: {
    name: string;
    image: ReturnType<typeof require>;
    href: Href;
  }[] = [
    {
      name: "Kids Wear",
      image: require("../assets/images/kidscate.png"),
      href: "/age",
    },
    {
      name: "Mens Wear",
      image: require("../assets/images/menscate.png"),
      href: "/gender",
    },
    {
      name: "Womens Wear",
      image: require("../assets/images/womencate.png"),
      href: "/categories",
    },
    {
      name: "Play",
      image: require("../assets/images/playcate.png"),
      href: "/other",
    },
    {
      name: "Gargi",
      image: require("../assets/images/sofacate.png"),
      href: "/subcate",
    },
    {
      name: "Sweets",
      image: require("../assets/images/sweetscate.png"),
      href: "/sweets",
    },
    {
      name: "Foot Wear",
      image: require("../assets/images/footwearcate.png"),
      href: "/footwear",
    },
    {
      name: "Sports Wear",
      image: require("../assets/images/sportscate.png"),
      href: "/sportswear",
    },
    {
      name: "Accessories",
      image: require("../assets/images/accessariescate.png"),
      href: "/accessories",
    },
    {
      name: "Homelyhub",
      image: require("../assets/images/homecate.png"),
      href: "/gifts",
    },
  ];

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
    Identity: ["Women", "Men", "Girls", "Boys"],
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

  const displayedCategories = categoryOptions.filter((item) =>
    item.toLowerCase().includes(searchCategoryText.toLowerCase())
  );

  const displayedFilterOptions =
    selectedFilterSection === "Category"
      ? (filterOptions[selectedFilterSection] || []).filter((item) =>
          item.toLowerCase().includes(searchCategoryText.toLowerCase())
        )
      : filterOptions[selectedFilterSection] || [];

  const productGrid = [
    {
      id: 1,
      name: "Pahirava Women..",
      image: require("../assets/images/product1.png"),
      oldPrice: "₹2,199",
      price: "₹361",
      buyPrice: "₹311",
    },
    {
      id: 2,
      name: "Niharika Creatio...",
      image: require("../assets/images/product2.png"),
      oldPrice: "₹999",
      price: "₹265",
      buyPrice: "₹215",
    },
    {
      id: 3,
      name: "MABRI Women F...",
      image: require("../assets/images/product3.png"),
      oldPrice: "₹1,499",
      price: "₹316",
      buyPrice: "₹266",
    },
    {
      id: 4,
      name: "Premokar Creati...",
      image: require("../assets/images/product4.png"),
      oldPrice: "₹1,999",
      price: "₹241",
      buyPrice: "₹191",
    },
    {
      id: 5,
      name: "Aayesha Textile ...",
      image: require("../assets/images/product5.png"),
      oldPrice: "₹999",
      price: "₹242",
      buyPrice: "₹192",
      rating: "4.4 ★",
    },
    {
      id: 6,
      name: "premokar fashio...",
      image: require("../assets/images/product6.png"),
      oldPrice: "₹1,999",
      price: "₹237",
      buyPrice: "₹187",
    },
  ];

  // mega discounts
  const megaProducts = [
  {
    id: '1',
    name: 'women wear',
    subtitle: 'Up to 60% Off',
    image: require('../assets/images/megadis1.png'),
  },
  {
    id: '2',
    name: 'new brand',
    subtitle: 'Best Deals',
    image: require('../assets/images/megadis2.png'),
  },
  {
    id: '3',
    name: 'performance',
    subtitle: 'Flat 50% Off',
    image: require('../assets/images/megadis3.png'),
  },
  {
    id: '4',
    name: 'Stylish ',
    subtitle: 'Trending Deals',
    image: require('../assets/images/megadis4.png'),
  },
];
// megabanners
const megaBanners = [
  { id: '1', image: require('../assets/images/mega1.png') },
  { id: '2', image: require('../assets/images/mega2.png') },
  { id: '3', image: require('../assets/images/mega3.png') },
];
const [megaBannerIndex, setMegaBannerIndex] = useState(0);



// focus in
const focusBanners = [
  {
    id: '1',
    image: require('../assets/images/focus1.png'),
  },
  {
    id: '2',
    image: require('../assets/images/focus2.png'),
  },
];
  const openCamera = () => {
    Alert.alert(
      "Camera access",
      "Allow camera access to take photos?",
      [
        { text: "Don't allow", style: "cancel" },
        { text: "Allow", onPress: () => router.push("/camerasearch") },
      ]
    );
  };


    // suggested
    const suggestedProducts = [
  {
    id: '1',
    name: 'Fresh Apple',
    image: require('../assets/images/suggest1.png'),
    oldPrice: '₹120',
    price: '₹99',
    rating: '4.5',
  },
  {
    id: '2',
    name: 'Banana',
    image: require('../assets/images/suggest2.png'),
    oldPrice: '₹80',
    price: '₹60',
    rating: '4.2',
  },
  {
    id: '3',
    name: 'Mango',
    image: require('../assets/images/suggest3.png'),
    oldPrice: '₹150',
    price: '₹130',
    rating: '4.8',
  },
  {
    id: '4',
    name: 'Orange',
    image: require('../assets/images/suggest4.png'),
    oldPrice: '₹100',
    price: '₹85',
    rating: '4.3',
  },
];



const premiumProducts = [
  {
    id: '1',
    name: 'Induction Cooktops',
    subtitle: "Don't Miss",
    image: require('../assets/images/premium1.png'),
  },
  {
    id: '2',
    name: 'new ',
    subtitle: 'New Collection',
    image: require('../assets/images/premium2.png'),
  },
  {
    id: '3',
    name: 'Shirt',
    subtitle: 'Trending Now',
    image: require('../assets/images/premium3.png'),
  },
  {
    id: '4',
    name: 'mens wear',
    subtitle: 'Best Seller',
    image: require('../assets/images/premium4.png'),
  },
];
// latest products


const latestProducts = [
  {
    id: "1",
    name: "Golden Bangles Set",
    image: require("../assets/images/latest1.png"),
    rating: "0.0 (0)",
    price: "₹1,446",
  },
  {
    id: "2",
    name: "Traditional Meenakari P...",
    image: require("../assets/images/latest2.png"),
    rating: "0.0 (0)",
    price: "₹2,394",
    oldPrice: "₹3,999",
    discount: "50%",
  },
  {
    id: "3",
    name: "Bridal Bangles Set",
    image: require("../assets/images/latest3.png"),
    rating: "0.0 (0)",
    price: "₹1,899",
  },
  {
    id: "4",
    name: "Red Designer Bangles",
    image: require("../assets/images/latest4.png"),
    rating: "0.0 (0)",
    price: "₹1,599",
  },
];

// scrolling brand
const brands = [
  {
    id: "1",
    name: "men",
    image: require("../assets/images/visky.png"),
  },
  {
    id: "2",
    name: "accessaries",
    image: require("../assets/images/shanthoshi.png"),
  },
  {
    id: "3",
    name: "shoes",
    image: require("../assets/images/aman.png"),
  },
  {
    id: "4",
    name: "bangles",
    image: require("../assets/images/satyasai.png"),
  },
  {
    id: "5",
    name: "saree",
    image: require("../assets/images/sasia.png"),
  },
];

// seller gallary

const sellerGallery = [
  {
    id: "1",
    name: "new brand",
    image: require("../assets/images/image1.png"),
  },
  {
    id: "2",
    name: "unlimited stuff",
    image: require("../assets/images/image2.png"),
  },
  {
    id: "3",
    name: "focusing products",
    image: require("../assets/images/image3.png"),
  },
  {
    id: "4",
    name: "brand",
    image: require("../assets/images/image4.png"),
  },
];
// cards
const freshData = [
  { id: "1", image: require("../assets/images/product1.png") },
  { id: "2", image: require("../assets/images/product2.png") },
  { id: "3", image: require("../assets/images/premium1.png") },
  { id: "4", image: require("../assets/images/premium2.png") },
];
const FRESH_ROW_PADDING = 16;
const FRESH_INNER = width - FRESH_ROW_PADDING * 2;
const FRESH_IMG_60 = FRESH_INNER * 0.6;
const FRESH_IMG_30 = FRESH_INNER * 0.3;
const FRESH_IMG_GAP = FRESH_INNER * 0.1;

const freshPairs: (typeof freshData)[] = [];
for (let i = 0; i < freshData.length; i += 2) {
  freshPairs.push(freshData.slice(i, i + 2));
}


// categariy data

const categoryData = [
  {
    id: "1",
    title: "Print Store",
    image: require("../assets/images/megadis1.png"),
  },
  {
    id: "2",
    title: "Giftables Store",
    image: require("../assets/images/megadis2.png"),
  },
  {
    id: "3",
    title: "Summer Store",
    image: require("../assets/images/megadis3.png"),
  },
  {
    id: "4",
    title: "Combo Store",
    image: require("../assets/images/megadis4.png"),
  },
];


// megabanners

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerSticky,
          { paddingTop: insets.top },
        ]}
      >
        {/* HEADER — logo, location, search (fixed while scrolling) */}
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={styles.logoLocationCol}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.locationBtnUnderLogo}
                onPress={() => router.push("/loc")}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Location"
              >
                <Ionicons name="location-outline" size={21} color="#ff6600" />
                <Text style={styles.locationBtnTextUnderLogo} numberOfLines={1}>
                  Location
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color="#777" />
              <TextInput
                placeholder={placeholderTexts[placeholderIndex]}
                placeholderTextColor="#777"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => {
                  router.push("/search");
                }}
              />
<TouchableOpacity onPress={openCamera} style={styles.searchBarIconBtn}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color="#777"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={startVoiceSearch}
                style={styles.searchBarIconBtn}
              >
                <Ionicons name="mic-outline" size={24} color="#777" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <View style={styles.greetingBar}>
          <View style={styles.topRow}>
            <View style={styles.greetingCol}>
              <Text style={styles.helloText} numberOfLines={1}>
                Hello, {userDisplayName} 👋
              </Text>
              <Text style={styles.shopText}>Let&apos;s shop</Text>
            </View>
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() => router.push("/wishlist")}
                style={styles.headerIconHit}
                accessibilityLabel="Wishlist"
              >
                <Ionicons name="heart-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={styles.headerIconHit}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ALL CATEGORIES (NO SLIDE) */}
      <View style={styles.categoryPage}>
  {categories.map((cat, index) => (
    <TouchableOpacity
      key={index}
      style={styles.categoryBox}
      onPress={() => router.push(cat.href)}
    >
      <Image source={cat.image} style={styles.categoryImage} />
      <Text style={styles.categoryText}>{cat.name}</Text>
    </TouchableOpacity>
  ))}
</View>

        {/* FILTER ROW */}
        <View style={styles.filterRow}>
          <FilterItem
            icon="swap-vert"
            label="Sort"
            onPress={() => handleFilterPress("Sort")}
          />
          <FilterItem
            icon="grid-view"
            label="Category"
            onPress={() => handleFilterPress("Category")}
          />
          <FilterItem
            icon="person-outline"
            label="Gender"
            onPress={() => handleFilterPress("Gender")}
          />
          <FilterItem
            icon="filter-list"
            label="Filter"
            onPress={() => handleFilterPress("Filter")}
          />
        </View>

        {/* BANNER */}
        <View>
          <View style={styles.banner}>
            <Image
              source={banners[bannerIndex]}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>

         <View style={styles.bannerDotsRow}>
  {banners.map((item, index) => (
    <View
      key={item.id || index}
      style={[
        styles.bannerDot,
        bannerIndex === index ? styles.bannerDotActive : null,
      ]}
    />
  ))}
</View>
        </View>

        {/* USER BOX */}
        <View style={styles.userSuggestionCard}>
  <Text style={styles.userSuggestionTitle}>
    Top Picks for You
  </Text>

  <View style={styles.userSuggestionRow}>
    {lookingProducts.slice(0, 3).map((item) => (
      <TouchableOpacity key={item.id} style={styles.userSuggestionItem}>
        <Image
          source={item.image}
          style={styles.userSuggestionImageBox}
          resizeMode="cover"
        />
        <Text style={styles.userSuggestionText}>{item.name}</Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

        {/* SERVICE LOGOS */}
        <View style={styles.serviceRow}>
          {serviceItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.serviceItem}>
              <View style={styles.serviceIconCircle}>
                <Ionicons name={item.icon} size={24} color="#000" />
              </View>
              <Text style={styles.serviceText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
{/* cards section */}



      
    <View style={styles.freshSection}>
 <View style={styles.freshHeader}>
  <Text style={styles.freshTitle}>Fresh Finds</Text>

  <TouchableOpacity
    style={styles.freshArrow}
    onPress={() => router.push("/startselling")}
  >
    <Ionicons name="arrow-forward" size={20} color="#fff" />
  </TouchableOpacity>
</View>
  <FlatList
    data={freshPairs}
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    snapToInterval={width}
    decelerationRate="fast"
    keyExtractor={(_, i) => `fresh-pair-${i}`}
    contentContainerStyle={{ marginTop: 8 }}
    onMomentumScrollEnd={(e) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(
        Math.min(Math.max(0, index), Math.max(0, freshPairs.length - 1))
      );
    }}
    renderItem={({ item: pair, index }) => {
      const isActive = index === activeIndex;
      const [left, right] = [pair[0], pair[1]];
      return (
        <View style={{ width, paddingHorizontal: FRESH_ROW_PADDING }}>
          <View
            style={[
              styles.freshPairRow,
              {
                gap: FRESH_IMG_GAP,
                opacity: isActive ? 1 : 0.88,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={{ width: FRESH_IMG_60 }}
            >
              <Image
                source={left.image}
                style={styles.freshCardImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            {right ? (
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ width: FRESH_IMG_30 }}
              >
                <Image
                  source={right.image}
                  style={styles.freshCardImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: FRESH_IMG_30 }} />
            )}
          </View>
        </View>
      );
    }}
  />
</View>
{/* second banner section  */}

<View style={{ marginTop: 4 }}>
  <View style={styles.banner}>
    <Image
      source={banners2[bannerIndex2]}
      style={styles.bannerImage}
      resizeMode="contain"
    />
  </View>

  <View style={styles.bannerDotsRow}>
    {banners2.map((item, index) => (
      <View
        key={index}
        style={[
          styles.bannerDot,
          bannerIndex2 === index ? styles.bannerDotActive : null,
        ]}
      />
    ))}
  </View>
</View>
{/* suggested list */}

<View style={styles.productSectionHeader}>
  <Text style={styles.productSectionTitle}>Suggested For You</Text>
  <TouchableOpacity
    style={styles.productArrowButton}
    onPress={() => router.push("/sportswear")}
  >
    <Ionicons name="arrow-forward" size={22} color="#fff" />
  </TouchableOpacity>
</View>

<View style={styles.productGridWrapper}>
  {suggestedProducts.map((item) => (
    <TouchableOpacity key={item.id} style={styles.productCard}>
      <View style={styles.productImageWrap}>
        <Image
          source={item.image}
          style={styles.productCardImage}
          resizeMode="cover"
        />
        {item.rating ? (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.productName} numberOfLines={1}>
        {item.name}
      </Text>

      <View style={styles.priceRow}>
        <Text style={styles.oldPrice}>{item.oldPrice}</Text>
        <Text style={styles.newPrice}> {item.price}</Text>
      </View>

      <View style={styles.addCartContainer}>
        <TouchableOpacity style={styles.addCartButton}>
          <Text style={styles.addCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ))}
</View>

{/* Video Banner Section */}
  <View style={styles.videoBannerContainer}>
    <VideoView
      player={videoBannerPlayer}
      style={styles.videoBanner}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
    />
  </View>






{/* Premium Finds Section */}
<View style={styles.premiumSection}>
  <View style={styles.premiumHeader}>
    <Text style={styles.premiumTitle}>Premium finds for you</Text>

    <TouchableOpacity
      style={styles.premiumArrowButton}
      onPress={() => router.push("/products")}
    >
      <Ionicons name="arrow-forward" size={22} color="#000" />
    </TouchableOpacity>
  </View>

  <View style={styles.premiumGrid}>
    {premiumProducts.map((item) => (
      <TouchableOpacity key={item.id} style={styles.premiumCard}>
        <View style={styles.premiumImageWrap}>
          <Image
            source={item.image}
            style={styles.premiumImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.premiumName} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={styles.premiumSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>


{/* catagariesbased products
 */}

 <Text style={styles.sectionTitle}>Shop by Store</Text>

<FlatList
  data={categoryData}
  horizontal
  showsHorizontalScrollIndicator={false}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.storeList}
  renderItem={({ item }) => (
    <View style={styles.storeItem}>
      
      <View style={styles.arcContainer}>
        <Image source={item.image} style={styles.arcImage} />
      </View>

      <Text style={styles.storeText}>{item.title}</Text>

    </View>
  )}
/>


{/* focus */}
{/* IN FOCUS Section */}
<View style={styles.focusSection}>
  <Text style={styles.focusTitle}>IN FOCUS</Text>
  <View style={styles.focusUnderline} />

  {focusBanners.map((item) => (
    <TouchableOpacity key={item.id} style={styles.focusCard} activeOpacity={0.9}>
      <Image source={item.image} style={styles.focusImage} resizeMode="cover" />
    </TouchableOpacity>
  ))}
</View>




{/* premium list */}
{/* Mega Discounts Section */}
<View style={styles.megaSection}>
  <View style={styles.megaHeader}>
    <Text style={styles.megaTitle}>Mega Discounts</Text>

    <TouchableOpacity
      style={styles.megaArrowButton}
      onPress={() => router.push("/products")}
    >
      <Ionicons name="arrow-forward" size={22} color="#000" />
    </TouchableOpacity>
  </View>

  <View style={styles.megaGrid}>
    {megaProducts.map((item) => (
      <TouchableOpacity key={item.id} style={styles.megaCard}>
        <View style={styles.megaImageWrap}>
          <Image
            source={item.image}
            style={styles.megaImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.megaName}>{item.name}</Text>

        <Text style={styles.megaSubtitle}>{item.subtitle}</Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

{/* Latest Products Section */}
<View style={styles.latestSection}>
  <View style={styles.latestTopLine} />

  <View style={styles.latestHeaderWrap}>
    <View style={styles.latestHeaderBox}>
      <Text style={styles.latestHeaderTitle}>Latest Products</Text>
      <View style={styles.latestHeaderUnderline} />
    </View>
  </View>

  <Text style={styles.latestHeaderSubtitle}>
    Check out our newest arrivals
  </Text>

  <View style={styles.latestGrid}>
    {latestProducts.map((item) => (
      <TouchableOpacity key={item.id} style={styles.latestCard}>
        <View style={styles.latestImageWrap}>
          <Image
            source={item.image}
            style={styles.latestImage}
            resizeMode="cover"
          />

          {item.discount ? (
            <View style={styles.latestDiscountBadge}>
              <Text style={styles.latestDiscountText}>{item.discount}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.latestProductTitle} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.latestRatingRow}>
          <Text style={styles.latestStars}>★★★★★</Text>
          <Text style={styles.latestRatingValue}>{item.rating}</Text>
        </View>

        <View style={styles.latestPriceRow}>
          {item.oldPrice ? (
            <Text style={styles.latestOldPrice}>{item.oldPrice}</Text>
          ) : null}
          <Text style={styles.latestNewPrice}>{item.price}</Text>
        </View>

        <TouchableOpacity style={styles.latestCartButton}>
  <Ionicons name="cart-outline" size={18} color="#fff" />
  <Text style={styles.latestCartButtonText}> Add To Cart</Text>
</TouchableOpacity>
      </TouchableOpacity>
    ))}
  </View>
</View>
{/* seller gallary
 */}

 <View style={styles.sellerSectionContainer}>

  {/* Title */}
<View style={styles.titleContainer}>
  <Text style={styles.titleText}>SELLER GALLERY</Text>
  <View style={styles.titleLine} />
</View>

  {/* Grid */}
  <View style={styles.sellerGrid}>
    {sellerGallery.map((item) => (
      <View key={item.id} style={styles.sellerCard}>
        
        <View style={styles.imageArea}>
          <Image source={item.image} style={styles.sellerImage} />
        </View>

        <View style={styles.nameBar}>
          <Text style={styles.businessName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>

      </View>
    ))}
  </View>

  {/* Arrow Navigation */}
  <TouchableOpacity
    style={styles.arrowButton}
    onPress={() => router.push("/sellergalleryscreen")}
  >
    <Feather name="arrow-right" size={24} color="#eedfdf" />
  </TouchableOpacity>

</View>


      </ScrollView>








      {/* SORT MODAL */}
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

      {/* CATEGORY MODAL */}
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
              <Text style={styles.productCount}>1000+ Products</Text>
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

      {/* GENDER MODAL */}
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
              <Text style={styles.productCount}>1000+ Products</Text>
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

      {/* FILTER MODAL */}
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
              <Text style={styles.productCount}>1000+ Products</Text>
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

const FilterItem = ({ icon, label, onPress }: FilterItemProps) => (
  <TouchableOpacity style={styles.filterItem} onPress={onPress}>
    <MaterialIcons name={icon} size={20} color="#000" />
    <Text style={styles.filterText}>{label}</Text>
  </TouchableOpacity>
);





const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  headerSticky: {
    backgroundColor: "#fff",
    zIndex: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  header: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 15,
  },

  greetingBar: {
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingCol: {
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
    gap: 4,
  },
  headerIconHit: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  helloText: { fontSize: 14, color: "#777" },
  shopText: { fontSize: 18, fontWeight: "bold" },

  searchBarIconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 0,
    marginRight: 0,
    paddingHorizontal: 2,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    gap: 4,
  },

  logoLocationCol: {
    alignItems: "center",
    flexShrink: 0,
    width: 64,
    paddingRight: 0,
  },

  logo: { width: 60, height: 35 },

  locationBtnUnderLogo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 5,
    maxWidth: "100%",
  },

  locationBtnTextUnderLogo: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: 25,
    paddingHorizontal: 10,
    minHeight: 48,
    paddingVertical: 2,
  },

  searchInput: { flex: 1, marginLeft: 8 },

  searchDropdown: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 4,
    maxHeight: 180,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  searchDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },

  searchDropdownText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },

  categoryPage: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  categoryBox: {
    width: width / 5 - 10,
    alignItems: "center",
    marginBottom: 15,
  },

  categoryImage: { width: 55, height: 55, marginBottom: 4 },
  categoryText: { fontSize: 11, textAlign: "center" },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
    backgroundColor: "#fff",
    paddingVertical: 10,
  },

  filterItem: { alignItems: "center" },
  filterText: { fontSize: 12, marginTop: 4 },

 banner: {
  width: '100%',
  height: 200,
  backgroundColor: '#fff',
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginTop: 15,
},

  bannerImage: {
    width: "100%",
    height: "100%",
  },

  bannerDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 18,
  },

  bannerDot: {
    width: 22,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#D3D3D3",
    marginHorizontal: 4,
  },

  bannerDotActive: {
    width: 34,
    backgroundColor: "#000",
  },
// looking card

  lookingCard: {
    marginHorizontal: 16,
    backgroundColor: "#1d324e",
    borderRadius: 26,
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 18,
  },

  lookingTitle: {
    fontSize: 45,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 18,
    marginBottom: 16,
  },

  lookingScrollContent: {
    paddingLeft: 18,
    paddingRight: 8,
  },

  lookingItemCard: {
    width: 300,
    backgroundColor: "#F1F1F1",
    borderRadius: 22,
    padding: 10,
    marginRight: 16,
    alignItems: "center",
  },

  lookingItemImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#e6e7e9",
  },

  lookingItemText: {
    fontSize: 13,
    color: "#050e12",
    textAlign: "center",
    fontWeight: "500",
  },

  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 8,
    marginTop: 10,
    backgroundColor: "#EFEFEF",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  serviceItem: {
    alignItems: "center",
    justifyContent: "center",
  },

  serviceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D9D9D9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  serviceText: {
    fontSize: 10,
    color: "#333",
    textAlign: "center",
  },

  userSuggestionCard: {
    backgroundColor: "#c8c8da",
    marginHorizontal: 30,
    marginTop: 18,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  userSuggestionTitle: {
    fontSize: 25,
    color: "#1d324e",
    marginBottom: 16,
  },

  userSuggestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userSuggestionItem: {
    width: "28%",
    alignItems: "center",
  },

  userSuggestionImageBox: {
    width: 90,
    height: 120,
    backgroundColor: "#ECECEC",
    borderRadius: 8,
    marginBottom: 8,
  },

  userSuggestionText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },

  likeHeaderRow: {
    marginTop: 18,
    marginHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  likeHeaderText: {
    fontSize: 24,
    color: "#333",
  },

  likeArrow: {
    fontSize: 22,
    color: "#333",
    fontWeight: "500",
  },

  likeRow: {
    marginTop: 18,
    marginHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  likeItem: {
    width: 46,
    height: 62,
    backgroundColor: "#D3D3D3",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  likeImage: {
    width: "100%",
    height: "100%",
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

  productCount: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
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

  productSectionHeader: {
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productSectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },

  productArrowButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },

  productGridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  productCard: {
    width: "31%",
    marginBottom: 24,
  },

  productImageWrap: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E5E5",
    marginBottom: 10,
    position: "relative",
  },

  productCardImage: {
    width: "100%",
    height: "100%",
  },

  ratingBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
  },

  productName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  oldPrice: {
    fontSize: 11,
    color: "#888",
    textDecorationLine: "line-through",
  },

  newPrice: {
    fontSize: 12,
    color: "#222",
    fontWeight: "700",
  },

  buyText: {
    fontSize: 11,
    color: "#1E4AA8",
    fontWeight: "700",
  },
addCartContainer: {
  marginTop: 6,
},

addCartButton: {
  backgroundColor: "#FF7A00",
  paddingVertical: 6,
  borderRadius: 6,
  alignItems: "center",
},

addCartText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
},

videoBannerContainer: {
  width: width - 32,
  alignSelf: "center",
  aspectRatio: 16 / 9,
  maxHeight: 220,
  marginTop: 12,
  marginBottom: 24,
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#000",
},

videoBanner: {
  ...StyleSheet.absoluteFillObject,
},
// premimum
premiumSection: {
  marginHorizontal: 10,
  marginTop: 16,
  backgroundColor: '#ef7b1a',
  borderRadius: 26,
  paddingTop: 18,
  paddingBottom: 18,
  paddingHorizontal: 14,
},

premiumHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},

premiumTitle: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '800',
},

premiumArrowButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: '#fff',
  justifyContent: 'center',
  alignItems: 'center',
},

premiumGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

premiumCard: {
  width: '48.5%',
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 10,
  marginBottom: 12,
},

premiumImageWrap: {
  width: '100%',
  height: 150,
  borderRadius: 14,
  backgroundColor: '#f3f3f3',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginBottom: 10,
},

premiumImage: {
  width: '100%',
  height: '100%',
},

premiumName: {
  fontSize: 14,
  color: '#222',
  marginBottom: 4,
},

premiumSubtitle: {
  fontSize: 15,
  fontWeight: '800',
  color: '#000',
},
// megacolors
megaSection: {
  marginHorizontal: 10,
  marginTop: 45,
  backgroundColor: '#1d324e',
  borderRadius: 26,
  paddingTop: 18,
  paddingBottom: 18,
  paddingHorizontal: 14,
},

megaHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},

megaTitle: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '800',
},

megaArrowButton: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: '#fff',
  justifyContent: 'center',
  alignItems: 'center',
},

megaGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},

megaCard: {
  width: '48%',
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 10,
  marginBottom: 12,
},

megaImageWrap: {
  width: '100%',
  height: 150,
  borderRadius: 14,
  backgroundColor: '#f3f3f3',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  marginBottom: 10,
},

megaImage: {
  width: '100%',
  height: '100%',
},

megaName: {
  fontSize: 14,
  color: '#333',
},

megaSubtitle: {
  fontSize: 15,
  fontWeight: '800',
  color: '#000',
},
// focus
focusSection: {
  marginTop: 20,
  paddingHorizontal: 14,
},

focusTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: '#243b5a',
  textAlign: 'center',
  letterSpacing: 1,
  marginBottom: 12,
},

focusUnderline: {
  height: 3,
  backgroundColor: '#d98324',
  borderRadius: 2,
  marginBottom: 22,
},

focusCard: {
  width: '100%',
  height: 210,
  borderRadius: 18,
  overflow: 'hidden',
  backgroundColor: '#f3f3f3',
  marginBottom: 20,
},

focusImage: {
  width: '100%',
  height: '100%',
},

nextSectionTitleWrap: {
  marginTop: 8,
  marginBottom: 12,
  alignItems: 'center',
},

nextSectionTitle: {
  fontSize: 22,
  fontWeight: '800',
  color: '#243b5a',
  letterSpacing: 1,
},

megaBannerSection: {
  paddingHorizontal: 14,
  marginBottom: 30,
},

megaBannerCard: {
  width: '100%',
  height: 400,
  borderRadius: 18,
  overflow: 'hidden',
  marginBottom: 18,
  backgroundColor: '#f3f3f3',
},

megaBannerImage: {
  width: '100%',
  height: 400,
},



// latest products

latestSection: {
  marginTop: 14,
  backgroundColor: "#f6f6f6",
  paddingTop: 8,
  paddingBottom: 10,
},

latestTopLine: {
  height: 3,
  backgroundColor: "#d8922f",
  marginHorizontal: 12,
  marginBottom: 14,
},

latestHeaderWrap: {
  alignItems: "center",
},

latestHeaderBox: {
  minWidth: 210,
  backgroundColor: "#f7f3ed",
  borderWidth: 1,
  borderColor: "#eadbc8",
  paddingVertical: 16,
  paddingHorizontal: 26,
  alignItems: "center",
},

latestHeaderTitle: {
  fontSize: 20,
  fontWeight: "800",
  color: "#243b5a",
},

latestHeaderUnderline: {
  width: 94,
  height: 8,
  borderRadius: 10,
  backgroundColor: "#8b4e22",
  marginTop: 10,
},

latestHeaderSubtitle: {
  textAlign: "center",
  fontSize: 17,
  color: "#556f99",
  marginTop: 10,
  marginBottom: 22,
},

latestGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  paddingHorizontal: 14,
},

latestCard: {
  width: "48.3%",
  backgroundColor: "#ffffff",
  borderRadius: 16,
  marginBottom: 18,
  overflow: "hidden",
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
},

latestImageWrap: {
  width: "100%",
  height: 200,
  backgroundColor: "#f2f2f2",
  position: "relative",
},

latestImage: {
  width: "100%",
  height: "100%",
},

latestDiscountBadge: {
  position: "absolute",
  top: 14,
  left: 14,
  backgroundColor: "white",
  width: 88,
  height: 30,
  borderRadius: 27,
  justifyContent: "center",
  alignItems: "center",
},

latestDiscountText: {
  color: "#fff",
  fontSize: 15,
  fontWeight: "700",
},

latestProductTitle: {
  fontSize: 14,
  color: "#243b5a",
  marginTop: 14,
  marginHorizontal: 12,
},

latestRatingRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
  marginHorizontal: 12,
},

latestStars: {
  color: "#8b8b8b",
  fontSize: 16,
  letterSpacing: 1,
},

latestRatingValue: {
  marginLeft: 8,
  color: "#6f7b8a",
  fontSize: 13,
},

latestPriceRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
  marginHorizontal: 12,
},

latestOldPrice: {
  color: "#7a8795",
  fontSize: 16,
  textDecorationLine: "line-through",
  marginRight: 8,
},

latestNewPrice: {
  color: "#f28a18",
  fontSize: 18,
  fontWeight: "800",
},

latestCartButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f28a18",
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 6,
  height:50,
},

latestCartButtonText: {
  color: "#fff",
  fontSize: 14,
  marginLeft: 6,
  fontWeight: "600",
},
//  seller gallary


  sellerSectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#F5F5F5",
  },

 titleContainer: {
  alignItems: "center",
  marginVertical: 15,
},

titleText: {
  fontSize: 20,
  fontWeight: "700",
  letterSpacing: 2,
  color: "#2E3A4D",
  marginBottom: 8,
},

titleLine: {
  width: "90%",
  height: 4,
  backgroundColor: "#C4812E",
  borderRadius: 2,
},

  sellerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  sellerCard: {
    width: "48%",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#E6E3F3",
  },

  imageArea: {
    height: 210,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6E3F3",
  },

  sellerImage: {
    width: "75%",
    height: "75%",
    resizeMode: "contain",
  },

  nameBar: {
    height: 55,
    backgroundColor: "#766DCC",
    justifyContent: "center",
    alignItems: "center",
  },

  businessName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  arrowButton: {
  alignSelf: "flex-end",
  backgroundColor: "black",
  marginTop: 6,
  width: 40,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
},

// cards
freshSection: {
  marginTop: 28,
},

freshTitle: {
  fontSize: 28,
  fontWeight: "600",
  marginLeft: 16,
  marginBottom: 8,
},

freshCardImage: {
  width: "100%",
  height: 300,
  borderRadius: 14,
},
freshArrow: {
  backgroundColor: "#0A2540", // navy blue (your theme)
  padding: 8,
  borderRadius: 25,
},
freshHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
},

freshPairRow: {
  flexDirection: "row",
  alignItems: "stretch",
},

// categariesbased

sectionTitle: {
  fontSize: 28,
  fontWeight: "600",
  marginLeft: 15,
  marginTop: 20,
  marginBottom: 15,
  color: "#333",
},

storeList: {
  paddingLeft: 15,
},

storeItem: {
  width: 140,
  alignItems: "center",
  marginRight: 18,
},

arcContainer: {
  width: 130,
  height: 120,
  borderTopLeftRadius: 80,
  borderTopRightRadius: 80,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  overflow: "hidden",
  backgroundColor: "#eee",
},

arcImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

storeText: {
  marginTop: 10,
  fontSize: 15,
  fontWeight: "500",
  textAlign: "center",
  color: "#333",
},
});
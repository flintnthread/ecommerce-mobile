import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type BestDressItem = {
  id: string;
  title: string;
  subtitle: string;
  image: any;
  isVideo?: boolean;
};

const BEST_OF_DRESSES: BestDressItem[] = [
  {
    id: "b1",
    title: "Everyday cotton kurti",
    subtitle: "Starts at ₹299",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "b2",
    title: "Festive anarkali set",
    subtitle: "Up to 55% off",
    image: require("../assets/images/look2.png"),
    isVideo: true,
  },
  {
    id: "b3",
    title: "Office-ready midi dress",
    subtitle: "Best rated picks",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "b4",
    title: "Party shimmer gown",
    subtitle: "New & trending",
    image: require("../assets/images/look4.png"),
  },
];

type ProductItem = {
  id: string;
  title: string;
  price: number;
  mrp: number;
  discount: string;
  payLaterText: string;
  benefitText: string;
  rating: string;
  ratingCount: string;
  image: any;
};

const PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    title: "Aarvi Handloom Cotton Saree",
    price: 799,
    mrp: 1599,
    discount: "50% off",
    payLaterText: "₹270 x 3 with Pay Later",
    benefitText: "Free Delivery • Cash on Delivery",
    rating: "4.5",
    ratingCount: "1,243",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "p2",
    title: "Nyra Georgette Embroidered Saree",
    price: 1249,
    mrp: 2499,
    discount: "50% off",
    payLaterText: "₹417 x 3 with Pay Later",
    benefitText: "Free Delivery • 7‑day Return",
    rating: "4.3",
    ratingCount: "3,876",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "p3",
    title: "Ziva Printed Chiffon Saree",
    price: 599,
    mrp: 1399,
    discount: "57% off",
    payLaterText: "₹200 x 3 with Pay Later",
    benefitText: "Express Delivery",
    rating: "4.1",
    ratingCount: "9,012",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "p4",
    title: "Veera Banarasi Silk Saree",
    price: 1699,
    mrp: 3499,
    discount: "51% off",
    payLaterText: "₹566 x 3 with Pay Later",
    benefitText: "Free Delivery • Gift Wrap Available",
    rating: "4.7",
    ratingCount: "18,540",
    image: require("../assets/images/look3.png"),
  },
];

const { width } = Dimensions.get("window");
const bannerWidth = width - 24;

const bannerImages = [
  require("../assets/images/womenscate.png"),
  require("../assets/images/mencate.png"),
  require("../assets/images/accessoriescate.png"),
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
      "https://images.unsplash.com/photo-1627639679638-8485316a4b21?fm=jpg&q=60&w=3000&auto=format&fit=crop",
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
  "Size",
  "Price",
  "Rating",
];

const filterOptions: Record<string, string[]> = {
  Category: categoryOptions,
  Gender: ["Women", "Men", "Girls", "Boys"],
  Color: ["Black", "Blue", "Pink", "Red", "White", "Green"],
  Fabric: ["Cotton", "Rayon", "Silk", "Polyester", "Linen"],
  Size: ["XS", "S", "M", "L", "XL", "XXL"],
  Price: ["Below ₹299", "₹300 - ₹499", "₹500 - ₹999", "Above ₹1000"],
  Rating: ["4★ & above", "3★ & above", "2★ & above"],
};

export default function SubcategoriesScreen() {
  const router = useRouter();

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedFilterSection, setSelectedFilterSection] =
    useState<string>("Category");
  const [searchCategoryText, setSearchCategoryText] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView | null>(null);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterPress = (label: string) => {
    if (label === "Sort") setSortModalVisible(true);
    if (label === "Category") setCategoryModalVisible(true);
    if (label === "Gender") setGenderModalVisible(true);
    if (label === "Filters") setFilterModalVisible(true);
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

  const filteredProducts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return PRODUCTS;
    return PRODUCTS.filter((product) =>
      product.title.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleBannerScroll = (event: any) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / bannerWidth
    );
    setBannerIndex(slideIndex);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => {
        const nextIndex = (prev + 1) % bannerImages.length;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: bannerWidth * nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleWishlist = (productId: string) => {
    // Only add if not already in wishlist (no remove)
    setWishlistItems((prev) =>
      prev.includes(productId) ? prev : [...prev, productId]
    );
  };

  const addToCart = (productId: string) => {
    // Only add if not already in cart (no remove)
    setCartItems((prev) =>
      prev.includes(productId) ? prev : [...prev, productId]
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>

        {isSearchVisible ? (
          <View style={styles.headerSearchWrapper}>
            <TextInput
              placeholder="Search products"
              placeholderTextColor="#69798c"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInputHeader}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>DRESSES</Text>
        )}

        <View style={styles.headerRight}>
          <View style={styles.headerIconWrapper}>
            <TouchableOpacity
              onPress={() => setIsSearchVisible((prev) => !prev)}
              style={styles.headerRightIcon}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="#1d324e"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.headerIconWrapper}>
            <Ionicons
              name="heart"
              size={20}
              color="red"
              style={styles.headerRightIcon}
            />
            {wishlistItems.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {wishlistItems.length}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="bag-outline" size={20} color="#1d324e" />
            {cartItems.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* LOCATION BAR */}
      <View style={styles.locationBar}>
        <Ionicons name="location-outline" size={16} color="#ef7b1a" />
        <Text style={styles.locationText} numberOfLines={1}>
          Villa-113 - PRAVEENS PRIDE, Road No. 11, Pat...
        </Text>
        <Ionicons name="chevron-down" size={16} color="#79411c" />
      </View>

      {/* STICKY SORT / CATEGORY / GENDER / FILTERS ROW */}
      <View style={styles.sortTabsRow}>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Sort")}
        >
          <Text style={styles.sortTabText}>Sort</Text>
          <Ionicons name="chevron-down" size={14} color="#1d324e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Category")}
        >
          <Text style={styles.sortTabText}>Category</Text>
          <Ionicons name="chevron-down" size={14} color="#1d324e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Gender")}
        >
          <Text style={styles.sortTabText}>Gender</Text>
          <Ionicons name="chevron-down" size={14} color="#1d324e" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortTab}
          onPress={() => handleFilterPress("Filters")}
        >
          <Text style={styles.sortTabText}>Filters</Text>
          <Ionicons name="chevron-down" size={14} color="#1d324e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROMO STRIP */}
        <View style={styles.promoStrip}>
          <View style={[styles.promoCard, styles.promoLeft]}>
            <Text style={styles.promoHighlight}>40% off</Text>
            <Text style={styles.promoSub}>upto ₹400</Text>
          </View>
          <View style={[styles.promoCard, styles.promoRight]}>
            <Text style={styles.promoHighlight}>EASY</Text>
            <Text style={styles.promoSub}>Returns</Text>
          </View>
        </View>

        {/* BEST OF DRESSES SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>BEST OF DRESSES</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bestRow}
        >
          {BEST_OF_DRESSES.map((item) => (
            <View key={item.id} style={styles.bestCard}>
              <View style={styles.bestImageWrapper}>
                <Image
                  source={item.image}
                  style={styles.bestImage}
                  resizeMode="cover"
                />
                {item.isVideo && (
                  <View style={styles.playBadge}>
                    <Ionicons name="play" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.bestTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.bestSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* TRENDING DRESSES BANNER */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>TRENDING DRESSES</Text>
        </View>

        <View style={styles.bannerCarouselWrapper}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
          >
            {bannerImages.map((image, index) => (
              <View key={index} style={[styles.bannerCard, { width: bannerWidth }]}>
                <Image
                  source={image}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dotsRow}>
          {bannerImages.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === bannerIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* ALL PRODUCTS HEADING */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            ALL <Text style={styles.sectionTitleAccent}>PRODUCTS</Text>
          </Text>
        </View>

        {/* PRODUCT GRID */}
        <View style={styles.productGrid}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productImageWrapper}>
                <Image
                  source={product.image}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.wishlistIcon}
                  onPress={() => toggleWishlist(product.id)}
                >
                  <Ionicons
                    name={
                      wishlistItems.includes(product.id)
                        ? "heart"
                        : "heart-outline"
                    }
                    size={18}
                    color={wishlistItems.includes(product.id) ? "red" : "#444444"}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.productTitle} numberOfLines={2}>
                {product.title}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceCurrent}>₹{product.price}</Text>
                <Text style={styles.priceMrp}>₹{product.mrp}</Text>
                <Text style={styles.priceDiscount}>{product.discount}</Text>
              </View>

              <Text style={styles.payLaterText} numberOfLines={1}>
                {product.payLaterText}
              </Text>
              <Text style={styles.benefitText} numberOfLines={1}>
                {product.benefitText}
              </Text>

              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{product.rating}</Text>
                  <Ionicons
                    name="star"
                    size={10}
                    color="#FFFFFF"
                    style={{ marginLeft: 2 }}
                  />
                </View>
                <Text style={styles.ratingCount}>({product.ratingCount})</Text>
              </View>
            </View>
          ))}
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

            {sortOptions.map((item) => (
              <TouchableOpacity
                key={item}
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
              {displayedCategories.map((item) => (
                <TouchableOpacity
                  key={item}
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
              <Text style={styles.modalTitle}>GENDER</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                <Ionicons name="close" size={30} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.genderContainer}>
              {genderOptions.map((item) => (
                <TouchableOpacity
                  key={item.label}
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
                {filterSections.map((item) => (
                  <TouchableOpacity
                    key={item}
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
                  {displayedFilterOptions.map((item) => {
                    const isSelected =
                      selectedFilters[selectedFilterSection]?.includes(item) ||
                      false;

                    return (
                      <TouchableOpacity
                        key={item}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#f6c795",
  },
  headerIconButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
    marginLeft: 4,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: "#1d324e",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightIcon: {
    marginRight: 0,
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
  searchInputHeader: {
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  headerIconWrapper: {
    marginRight: 16,
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef7b1a",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  headerBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF7F0",
  },
  locationText: {
    flex: 1,
    marginHorizontal: 6,
    fontSize: 12,
    color: "#1d324e",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#FFF7F0",
  },
  scrollContent: {
    paddingBottom: 90,
  },
  topTagRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  topTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f6c795",
    marginRight: 8,
  },
  topTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#79411c",
  },
  sortTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#f6c795",
  },
  sortTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#E0E0E0",
  },
  sortTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1d324e",
    marginRight: 4,
  },
  promoStrip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  promoCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  promoLeft: {
    backgroundColor: "#1d324e",
    marginRight: 6,
  },
  promoRight: {
    backgroundColor: "#79411c",
    marginLeft: 6,
  },
  promoHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  promoSub: {
    fontSize: 12,
    marginTop: 2,
    color: "#f6c795",
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#1d324e",
  },
  sectionTitleAccent: {
    color: "#ef7b1a",
  },
  bannerCarouselWrapper: {
    paddingHorizontal: 12,
  },
  bannerCard: {
    borderRadius: 10,
    overflow: "hidden",
    height: 150,
    backgroundColor: "#F6F6F9",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 3,
  },
  dotActive: {
    width: 10,
    borderRadius: 5,
    backgroundColor: "#ef7b1a",
  },
  bestRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  bestCard: {
    width: 140,
    marginRight: 12,
  },
  bestImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
  },
  bestImage: {
    width: "100%",
    height: "100%",
  },
  playBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  bestTitle: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#1d324e",
  },
  bestSubtitle: {
    fontSize: 11,
    color: "#79411c",
    marginTop: 2,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 16,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f6c795",
  },
  productImageWrapper: {
    width: "100%",
    height: 180,
    backgroundColor: "#F6F6F9",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  wishlistIcon: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333333",
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  priceCurrent: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d324e",
    marginRight: 6,
  },
  priceMrp: {
    fontSize: 11,
    color: "#777777",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  priceDiscount: {
    fontSize: 11,
    color: "#ef7b1a",
    fontWeight: "600",
  },
  payLaterText: {
    fontSize: 11,
    color: "#79411c",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 11,
    color: "#79411c",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef7b1a",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  ratingCount: {
    fontSize: 10,
    color: "#555555",
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f6c795",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1d324e",
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
    color: "#1d324e",
  },
  selectedSortText: {
    color: "#ef7b1a",
    fontWeight: "600",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#1d324e",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: {
    borderColor: "#ef7b1a",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef7b1a",
  },
  categorySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f6c795",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: "#fff",
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1d324e",
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
    borderColor: "#f6c795",
    marginRight: 14,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#ef7b1a",
    borderColor: "#ef7b1a",
  },
  checkText: {
    fontSize: 16,
    color: "#1d324e",
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
    borderColor: "#f6c795",
  },
  activeGenderImage: {
    borderWidth: 2,
    borderColor: "#ef7b1a",
  },
  genderText: {
    marginTop: 10,
    fontSize: 15,
    color: "#1d324e",
  },
  filterContent: {
    flex: 1,
    flexDirection: "row",
  },
  filterLeftPanel: {
    width: "30%",
    backgroundColor: "#FFF7F0",
  },
  leftFilterItem: {
    minHeight: 62,
    justifyContent: "center",
    paddingLeft: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f6c795",
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
    color: "#1d324e",
  },
  activeLeftFilterText: {
    color: "#ef7b1a",
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
    color: "#1d324e",
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f6c795",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  productCount: {
    fontSize: 16,
    color: "#1d324e",
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#ef7b1a",
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
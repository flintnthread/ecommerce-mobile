import React, { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  type ImageSourcePropType,
  ScrollView,
  Share,
  Modal,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getWishlistIds, loadWishlist, toggleWishlistProduct } from "../lib/shopStorage";

type SellerProduct = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  price: string;
  mrp?: string;
  off?: string;
};

const P1 = require("../assets/images/latest1.png");
const P2 = require("../assets/images/latest2.png");
const P3 = require("../assets/images/latest3.png");
const P4 = require("../assets/images/latest4.png");
const SELLER_PROFILE_IMG = require("../assets/images/image1.png");

const sortOptions = [
  "Relevance",
  "New Arrivals",
  "Price (High to Low)",
  "Price (Low to High)",
  "Ratings",
  "Discount",
];

const genderOptions = ["Women", "Men", "Girls", "Boys"];

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
  "Analog Watches",
];

const filterSections = ["Category", "Gender", "Price", "Rating", "Discount"] as const;

const filterOptions: Record<(typeof filterSections)[number], string[]> = {
  Category: categoryOptions,
  Gender: genderOptions,
  Price: ["Below ₹299", "₹300 - ₹499", "₹500 - ₹999", "Above ₹1000"],
  Rating: ["4★ & above", "3★ & above", "2★ & above"],
  Discount: ["10% and above", "25% and above", "40% and above", "60% and above"],
};

const SELLER_PRODUCTS: SellerProduct[] = [
  { id: "p1", title: "Banita Attractive Women Dupatta", image: P1, price: "₹1,323", mrp: "₹1,398", off: "5% off" },
  { id: "p2", title: "Charvi Attractive Women Dupatta", image: P2, price: "₹1,318", mrp: "₹1,384", off: "5% off" },
  { id: "p3", title: "Ethnic Kurta Set", image: P3, price: "₹899", mrp: "₹1,599", off: "44% off" },
  { id: "p4", title: "Lace Detail Dress", image: P4, price: "₹1,199", mrp: "₹1,999", off: "40% off" },
];

export default function SellerStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const sellerName = String(params.name ?? "@ SHIV CREATION");
  const rating = String(params.rating ?? "4.1");
  const [following, setFollowing] = useState(false);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [searchCategoryText, setSearchCategoryText] = useState("");

  const [selectedFilterSection, setSelectedFilterSection] =
    useState<(typeof filterSections)[number]>("Category");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const data = useMemo(() => SELLER_PRODUCTS, []);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);
  const shareMessage = useMemo(
    () => `Check out this shop on our app - ${sellerName}`,
    [sellerName]
  );

  const reloadWishlist = useCallback(async () => {
    const ids = await getWishlistIds();
    const list = await loadWishlist();
    setWishlistIds(ids);
    setWishlistCount(list.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reloadWishlist();
    }, [reloadWishlist])
  );

  const parseRupee = (value?: string) => {
    const raw = String(value ?? "").replace(/[^\d.]/g, "");
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const handleToggleWishlist = useCallback(
    async (p: SellerProduct) => {
      const nowInWishlist = await toggleWishlistProduct({
        id: p.id,
        name: p.title,
        price: parseRupee(p.price),
        mrp: Math.max(parseRupee(p.mrp), parseRupee(p.price)),
      });
      await reloadWishlist();
      Alert.alert(
        "Wishlist",
        nowInWishlist ? "Added to wishlist" : "Removed from wishlist"
      );
    },
    [reloadWishlist]
  );

  const handleFilterPress = (label: string) => {
    if (label === "Sort") setSortModalVisible(true);
    if (label === "Category") setCategoryModalVisible(true);
    if (label === "Gender") setGenderModalVisible(true);
    if (label === "Filters") setFilterModalVisible(true);
  };

  const toggleCategory = (item: string) => {
    setSelectedCategory((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const toggleFilterOption = (section: string, item: string) => {
    setSelectedFilters((prev) => {
      const existing = prev[section] || [];
      const nextForSection = existing.includes(item)
        ? existing.filter((v) => v !== item)
        : [...existing, item];
      return { ...prev, [section]: nextForSection };
    });
  };

  const clearFilterModalSelections = () => {
    setSelectedFilters({});
    setSelectedCategory([]);
    setSelectedGender("");
    setSelectedSort("Relevance");
    setSelectedFilterSection("Category");
  };

  const displayedCategories = categoryOptions.filter((item) =>
    item.toLowerCase().includes(searchCategoryText.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topBar,
          { paddingTop: Math.max(insets.top, 10) + 10, paddingBottom: 10 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {sellerName}
        </Text>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.topIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/search")}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Ionicons name="search" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/wishlist")}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Ionicons name="heart-outline" size={22} color="#0F172A" />
            {wishlistCount > 0 ? (
              <View style={styles.wishlistBadge}>
                <Text style={styles.wishlistBadgeText}>
                  {wishlistCount > 99 ? "99+" : String(wishlistCount)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/cart")}
            accessibilityRole="button"
            accessibilityLabel="Cart"
          >
            <Ionicons name="cart-outline" size={22} color="#0F172A" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>6</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          <View style={styles.heroNewBase} />
          <View style={styles.heroNewRibbon} />
          <View style={styles.heroNewWave} />
          <View style={styles.heroNewBadge}>
            <Ionicons name="sparkles" size={14} color="#7C2D12" />
            <Text style={styles.heroNewBadgeText}>TOP SELLER</Text>
          </View>
          <TouchableOpacity
            style={styles.shareFab}
            activeOpacity={0.85}
            onPress={() => Share.share({ message: shareMessage })}
            accessibilityRole="button"
            accessibilityLabel="Share store"
          >
            <Ionicons name="share-outline" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatarSolo}>
            <Image source={SELLER_PROFILE_IMG} style={styles.profileAvatarSoloImage} />
          </View>
          <Text style={styles.profileName}>{sellerName}</Text>

          <View style={styles.profileRatingRow}>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>{rating}</Text>
              <Ionicons name="star" size={13} color="#0F766E" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.profileRatingSub}>2,435 ratings</Text>
          </View>

          <View style={styles.profileStatsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statNum}>214</Text>
              <Text style={styles.statSub}>Followers</Text>
            </View>

            <View style={styles.statBlock}>
              <Text style={styles.statNum}>1,417</Text>
              <Text style={styles.statSub}>Products</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.followBtn,
                following ? styles.followBtnOn : styles.followBtnOff,
              ]}
              activeOpacity={0.9}
              onPress={() => setFollowing((v) => !v)}
            >
              <Text style={[styles.followText, following ? styles.followTextOn : null]}>
                {following ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterRow}>
          {[
            { id: "sort", label: "Sort", icon: "swap-vertical" as const },
            { id: "cat", label: "Category", icon: "chevron-down" as const },
            { id: "gen", label: "Gender", icon: "chevron-down" as const },
            { id: "fil", label: "Filters", icon: "options" as const },
          ].map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.filterBtn}
              activeOpacity={0.85}
              onPress={() => handleFilterPress(b.label)}
            >
              <Ionicons name={b.icon} size={16} color="#0F172A" />
              <Text style={styles.filterText}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          renderItem={({ item, index }) => {
            const col = index % 2;
            return (
              <View style={styles.gridCell}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    col === 0 ? styles.cardDividerRight : null,
                    styles.cardDividerBottom,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => router.push("/productdetail")}
                >
                  <View style={styles.cardImageWrap}>
                    <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.wishBtn}
                      activeOpacity={0.85}
                      onPress={() => void handleToggleWishlist(item)}
                      accessibilityRole="button"
                      accessibilityLabel="Add to wishlist"
                    >
                      <Ionicons
                        name={wishlistIds.has(item.id) ? "heart" : "heart-outline"}
                        size={18}
                        color={wishlistIds.has(item.id) ? "#E11D48" : "#0F172A"}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>{item.price}</Text>
                      {item.mrp ? <Text style={styles.mrp}>{item.mrp}</Text> : null}
                      {item.off ? <Text style={styles.off}>{item.off}</Text> : null}
                    </View>
                    <Text style={styles.payLater} numberOfLines={1}>
                      ₹1,385 with Pay Later
                    </Text>
                    <View style={styles.shopRow}>
                      <Text style={styles.shopLabel}>shop</Text>
                      <View style={styles.shopRatingPill}>
                        <Text style={styles.shopRatingText}>{rating}</Text>
                        <Ionicons name="star" size={12} color="#0F766E" style={{ marginLeft: 3 }} />
                      </View>
                      <Text style={styles.shopCount}>(2,435)</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
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
                <Ionicons name="close" size={28} color="#555" />
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
                <Text style={[styles.sortText, selectedSort === item ? styles.selectedSortText : null]}>
                  {item}
                </Text>
                <View style={[styles.radioOuter, selectedSort === item ? styles.radioOuterActive : null]}>
                  {selectedSort === item ? <View style={styles.radioInner} /> : null}
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
                <Ionicons name="close" size={28} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.categorySearchBox}>
              <Ionicons name="search" size={18} color="#777" />
              <TextInput
                value={searchCategoryText}
                onChangeText={setSearchCategoryText}
                placeholder="Search categories"
                placeholderTextColor="#999"
                style={styles.categorySearchInput}
              />
              {searchCategoryText ? (
                <TouchableOpacity onPress={() => setSearchCategoryText("")}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {displayedCategories.map((item) => {
                const checked = selectedCategory.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={styles.checkRow}
                    activeOpacity={0.8}
                    onPress={() => toggleCategory(item)}
                  >
                    <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
                      {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                    </View>
                    <Text style={styles.checkText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setSelectedCategory([]);
                  setCategoryModalVisible(false);
                }}
              >
                <Text style={styles.modalSecondaryText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.modalPrimaryText}>Apply</Text>
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
                <Ionicons name="close" size={28} color="#555" />
              </TouchableOpacity>
            </View>

            {genderOptions.map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.sortRow}
                onPress={() => {
                  setSelectedGender(g);
                  setGenderModalVisible(false);
                }}
              >
                <Text style={[styles.sortText, selectedGender === g ? styles.selectedSortText : null]}>
                  {g}
                </Text>
                <View style={[styles.radioOuter, selectedGender === g ? styles.radioOuterActive : null]}>
                  {selectedGender === g ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* FILTERS MODAL (placeholder apply/clear like home) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setFilterModalVisible(false)} />
          <View style={styles.filterModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTERS</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterBodyRow}>
              <View style={styles.filterLeftCol}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {filterSections.map((sec) => {
                    const active = selectedFilterSection === sec;
                    return (
                      <TouchableOpacity
                        key={sec}
                        style={[styles.filterSectionBtn, active ? styles.filterSectionBtnActive : null]}
                        activeOpacity={0.85}
                        onPress={() => setSelectedFilterSection(sec)}
                      >
                        <Text style={[styles.filterSectionText, active ? styles.filterSectionTextActive : null]}>
                          {sec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.filterRightCol}>
                <Text style={styles.filterRightTitle}>{selectedFilterSection}</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {(filterOptions[selectedFilterSection] || []).map((opt) => {
                    const checked = (selectedFilters[selectedFilterSection] || []).includes(opt);
                    return (
                      <TouchableOpacity
                        key={`${selectedFilterSection}:${opt}`}
                        style={styles.filterOptionRow}
                        activeOpacity={0.8}
                        onPress={() => toggleFilterOption(selectedFilterSection, opt)}
                      >
                        <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
                          {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                        </View>
                        <Text style={styles.checkText}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  clearFilterModalSelections();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalSecondaryText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  // keep modal selections in sync with dedicated states
                  const cat = selectedFilters.Category || [];
                  const gen = selectedFilters.Gender || [];
                  if (cat.length) setSelectedCategory(cat);
                  if (gen.length) setSelectedGender(gen[0] || "");
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.modalPrimaryText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { paddingBottom: 18 },

  topBar: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  topBarTitle: { flex: 1, marginLeft: 8, fontSize: 16, fontWeight: "900", color: "#0F172A" },
  topBarActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  topIconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  cartBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  wishlistBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistBadgeText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },

  heroWrap: { height: 150, backgroundColor: "#FFFFFF", overflow: "hidden" },
  heroNewBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF7ED",
  },
  heroNewRibbon: {
    position: "absolute",
    left: -40,
    top: 22,
    width: 240,
    height: 110,
    borderRadius: 28,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FED7AA",
    transform: [{ rotate: "-6deg" }],
  },
  heroNewWave: {
    position: "absolute",
    right: -60,
    bottom: -70,
    width: 260,
    height: 200,
    borderRadius: 120,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    transform: [{ rotate: "8deg" }],
  },
  heroNewBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  heroNewBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7C2D12",
    letterSpacing: 0.8,
  },
  shareFab: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },

  profileCard: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    alignItems: "center",
  },

  profileAvatarSolo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    overflow: "hidden",
    marginTop: -34,
  },
  profileAvatarSoloImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  profileName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#0F172A" },

  profileRatingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileRatingSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },
  profileStatsRow: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  statBlock: { alignItems: "center", flexShrink: 0 },
  statNum: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  statSub: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FFFFFF",
  },
  ratingPillText: { fontSize: 13, fontWeight: "900", color: "#0F766E" },
  followBtn: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  followBtnOff: { backgroundColor: "#2563EB" },
  followBtnOn: { backgroundColor: "#E5E7EB" },
  followText: { fontSize: 13, fontWeight: "900", color: "#FFFFFF" },
  followTextOn: { color: "#111827" },

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
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  sortText: { fontSize: 16, color: "#555" },
  selectedSortText: { color: "#000", fontWeight: "700" },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: { borderColor: "#2d33b4" },
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
    height: 52,
    backgroundColor: "#fff",
    gap: 10,
  },
  categorySearchInput: { flex: 1, fontSize: 15, color: "#333" },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: { backgroundColor: "#2d33b4", borderColor: "#2d33b4" },
  checkText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  modalFooterRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalSecondaryText: { fontSize: 14, fontWeight: "800", color: "#111827" },
  modalPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d33b4",
  },
  modalPrimaryText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  filterBodyRow: {
    flex: 1,
    flexDirection: "row",
  },
  filterLeftCol: {
    width: 140,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    backgroundColor: "#FAFAFA",
  },
  filterRightCol: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  filterSectionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  filterSectionBtnActive: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
    borderLeftColor: "#2d33b4",
  },
  filterSectionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  filterSectionTextActive: {
    color: "#0F172A",
  },
  filterRightTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  filterOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#EEF2F7",
  },
  filterText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },

  grid: { paddingBottom: 6 },
  gridRow: { gap: 0 },
  gridCell: { flex: 1 },
  card: { backgroundColor: "#FFFFFF" },
  cardDividerRight: { borderRightWidth: 2, borderRightColor: "#E5E7EB" },
  cardDividerBottom: { borderBottomWidth: 2, borderBottomColor: "#E5E7EB" },
  cardImageWrap: { height: 190, backgroundColor: "#F1F5F9" },
  cardImage: { width: "100%", height: "100%" },
  wishBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12, gap: 6 },
  cardTitle: { fontSize: 12, fontWeight: "700", color: "#334155" },
  priceRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 },
  price: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  mrp: { fontSize: 12, fontWeight: "800", color: "#94A3B8", textDecorationLine: "line-through" },
  off: { fontSize: 12, fontWeight: "900", color: "#10B981" },
  payLater: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  shopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  shopLabel: { fontSize: 12, fontWeight: "800", color: "#94A3B8" },
  shopRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FFFFFF",
  },
  shopRatingText: { fontSize: 12, fontWeight: "900", color: "#0F766E" },
  shopCount: { fontSize: 12, fontWeight: "800", color: "#94A3B8" },
});


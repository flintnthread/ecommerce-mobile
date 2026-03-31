import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

type CatalogProduct = {
  id: string;
  name: string;
  images: any[];
  price: number;
  mrp: number;
  discount: string;
  rating: string;
  ratingCount: string;
};

const L1 = require("../assets/images/look1.png");
const L2 = require("../assets/images/look2.png");
const L3 = require("../assets/images/look3.png");

const DEFAULT_PRODUCT_ID = "main";

/** Gallery for the default (featured) product */
const DEFAULT_PRODUCT_IMAGES = [L1, L2, L3, L1, L2, L3];

const DEFAULT_PRODUCT: CatalogProduct = {
  id: DEFAULT_PRODUCT_ID,
  name: "Floral Printed Cotton Dress",
  images: DEFAULT_PRODUCT_IMAGES,
  price: 1299,
  mrp: 2499,
  discount: "48% off",
  rating: "4.5",
  ratingCount: "2,345",
};

/** “You may also like” — each item opens its own detail when tapped */
const SUGGEST_PRODUCTS: CatalogProduct[] = [
  {
    id: "s1",
    name: "Printed summer dress",
    images: Array(6).fill(L1),
    price: 899,
    mrp: 1799,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "856",
  },
  {
    id: "s2",
    name: "Floral wrap dress",
    images: Array(6).fill(L2),
    price: 999,
    mrp: 1999,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "1,120",
  },
  {
    id: "s3",
    name: "Casual A-line dress",
    images: Array(6).fill(L3),
    price: 849,
    mrp: 1699,
    discount: "50% off",
    rating: "4.0",
    ratingCount: "642",
  },
  {
    id: "s4",
    name: "Weekend maxi dress",
    images: Array(6).fill(L1),
    price: 1199,
    mrp: 2399,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "2,010",
  },
  {
    id: "s5",
    name: "Office chic dress",
    images: Array(6).fill(L2),
    price: 1399,
    mrp: 2599,
    discount: "46% off",
    rating: "4.3",
    ratingCount: "1,445",
  },
  {
    id: "s6",
    name: "Evening mini dress",
    images: Array(6).fill(L3),
    price: 1099,
    mrp: 2199,
    discount: "50% off",
    rating: "4.5",
    ratingCount: "3,200",
  },
];

export const ALL_PRODUCTS = [
  {
    id: "ap1",
    name: "Printed cotton kurti",
    price: 699,
    mrp: 1399,
    discount: "50% off",
    rating: "4.3",
    ratingCount: "1,204",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "ap2",
    name: "Floral fit & flare dress",
    price: 1099,
    mrp: 2199,
    discount: "50% off",
    rating: "4.5",
    ratingCount: "3,580",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "ap3",
    name: "Solid A-line midi dress",
    price: 899,
    mrp: 1799,
    discount: "50% off",
    rating: "4.1",
    ratingCount: "980",
    image: require("../assets/images/look3.png"),
  },
  {
    id: "ap4",
    name: "Party shimmer gown",
    price: 1799,
    mrp: 3499,
    discount: "48% off",
    rating: "4.6",
    ratingCount: "2,145",
    image: require("../assets/images/look4.png"),
  },
  {
    id: "ap5",
    name: "Everyday straight kurta",
    price: 549,
    mrp: 999,
    discount: "45% off",
    rating: "4.0",
    ratingCount: "1,010",
    image: require("../assets/images/look1.png"),
  },
  {
    id: "ap6",
    name: "Checked shirt dress",
    price: 1199,
    mrp: 2499,
    discount: "52% off",
    rating: "4.4",
    ratingCount: "3,012",
    image: require("../assets/images/look2.png"),
  },
  {
    id: "ap7",
    name: "Women sports running t-shirt",
    price: 799,
    mrp: 1599,
    discount: "50% off",
    rating: "4.2",
    ratingCount: "860",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "ap8",
    name: "Women gym leggings",
    price: 999,
    mrp: 1999,
    discount: "50% off",
    rating: "4.4",
    ratingCount: "1,540",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "ap9",
    name: "Women running shoes",
    price: 2499,
    mrp: 4999,
    discount: "50% off",
    rating: "4.6",
    ratingCount: "2,320",
    image: require("../assets/images/sports3.png"),
  },
];

function getCatalogProduct(id?: string | string[] | null): CatalogProduct {
  const raw = Array.isArray(id) ? id[0] : id;
  const pid = typeof raw === "string" ? raw.trim() : "";
  if (!pid || pid === DEFAULT_PRODUCT_ID) {
    return DEFAULT_PRODUCT;
  }
  const fromSuggest = SUGGEST_PRODUCTS.find((p) => p.id === pid);
  if (fromSuggest) return fromSuggest;
  const fromAll = ALL_PRODUCTS.find((p) => p.id === pid);
  if (fromAll) {
    return {
      id: fromAll.id,
      name: fromAll.name,
      images: Array(6).fill(fromAll.image),
      price: fromAll.price,
      mrp: fromAll.mrp,
      discount: fromAll.discount,
      rating: fromAll.rating,
      ratingCount: fromAll.ratingCount,
    };
  }
  return DEFAULT_PRODUCT;
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProductDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = params.id;
  const product = useMemo(() => getCatalogProduct(productId), [productId]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [hasAddedToCart, setHasAddedToCart] = useState(false);
  const [hasCountedWishlist, setHasCountedWishlist] = useState(false);
  const [isSizeChartVisible, setIsSizeChartVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddressFormVisible, setIsAddressFormVisible] = useState(false);
  // Saved address (shown in the UI)
  const [savedAddressLine, setSavedAddressLine] = useState(
    "Villa 113, Praveens Pride, Road No. 11"
  );
  const [savedCity, setSavedCity] = useState("Hyderabad");
  const [savedPincode, setSavedPincode] = useState("500034");
  const [savedAddressType, setSavedAddressType] = useState<"Home" | "Office">(
    "Office"
  );
  // Editing fields (used only inside the form)
  const [addressLine, setAddressLine] = useState(savedAddressLine);
  const [city, setCity] = useState(savedCity);
  const [pincode, setPincode] = useState(savedPincode);
  const [selectedAddressType, setSelectedAddressType] =
    useState<"Home" | "Office">(savedAddressType);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [reviews, setReviews] = useState<
    { id: string; user: string; rating: number; comment: string; date: string }[]
  >([
    {
      id: "r1",
      user: "Ananya",
      rating: 5,
      comment: "Fabric quality is great and colour is same as shown in images.",
      date: "2 days ago",
    },
    {
      id: "r2",
      user: "Meera",
      rating: 4,
      comment: "Perfect for office wear, fit is slightly loose but comfortable.",
      date: "1 week ago",
    },
    {
      id: "r3",
      user: "Kavya",
      rating: 4,
      comment: "Nice dress for the price. Length is just below the knee.",
      date: "3 weeks ago",
    },
  ]);

  const mainImage = product.images[activeImageIndex] ?? product.images[0];

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(null);
    setIsWishlisted(false);
    setHasAddedToCart(false);
    setHasCountedWishlist(false);
    setSearchQuery("");
  }, [productId]);

  const handleAddToBag = () => {
    // Only increase cart badge count once for this product
    if (!hasAddedToCart) {
      setCartCount((prev) => prev + 1);
      setHasAddedToCart(true);
    }
  };

  const currentAddress = `${savedAddressType} - ${savedAddressLine}, ${savedCity} - ${savedPincode}`;

  const handleSaveAddress = () => {
    // Persist edited values into saved address
    setSavedAddressLine(addressLine.trim());
    setSavedCity(city.trim());
    setSavedPincode(pincode.trim());
    setSavedAddressType(selectedAddressType);
    setIsAddressFormVisible(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this product on F&T: ${product.name} for ₹${product.price.toLocaleString()}.`,
      });
    } catch (e) {
      // ignore share errors
    }
  };

  const openProductDetail = (id: string) => {
    router.push({ pathname: "/productdetail", params: { id } } as any);
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

        <View style={styles.headerSearchWrapper}>
          <TextInput
            placeholder="Search in product"
            placeholderTextColor="#69798c"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInputHeader}
          />
        </View>

        <View style={styles.headerRight}>
          <View style={styles.headerIconWrapper}>
            <TouchableOpacity
              onPress={() => {
                router.push("/wishlist");
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="heart-outline"
                size={22}
                color="#1d324e"
              />
            </TouchableOpacity>
            {wishlistCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{wishlistCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerIconWrapper}>
            <TouchableOpacity
              onPress={() => {
                router.push("/cart");
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-outline" size={22} color="#1d324e" />
            </TouchableOpacity>
            {cartCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* MAIN IMAGE */}
        <View style={styles.mainImageWrapper}>
          <Image source={mainImage} style={styles.mainImage} />
        </View>

        {/* THUMBNAILS ROW */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailRow}
        >
          {product.images.map((img, index) => {
            const isActive = index === activeImageIndex;
            return (
              <TouchableOpacity
                key={`${product.id}-thumb-${index}`}
                style={[
                  styles.thumbnailWrapper,
                  isActive && styles.thumbnailWrapperActive,
                ]}
                onPress={() => setActiveImageIndex(index)}
                activeOpacity={0.8}
              >
                <Image source={img} style={styles.thumbnailImage} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TEXT BLOCK */}
        <View style={styles.detailBlock}>
          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceCurrent}>
              ₹{product.price.toLocaleString()}
            </Text>
            <Text style={styles.priceMrp}>₹{product.mrp.toLocaleString()}</Text>
            <Text style={styles.priceDiscount}>{product.discount}</Text>
          </View>

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
            <Text style={styles.ratingCount}>{product.ratingCount} ratings</Text>
          </View>
        </View>

        {/* DELIVERY ADDRESS & BENEFITS */}
        <View style={styles.sectionBlock}>
          <View style={styles.addressRow}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Deliver to
            </Text>
            <TouchableOpacity
              style={styles.addressChangeButton}
              activeOpacity={0.75}
              onPress={() => {
                // Seed editing fields from saved address when opening
                setAddressLine(savedAddressLine);
                setCity(savedCity);
                setPincode(savedPincode);
                setSelectedAddressType(savedAddressType);
                setIsAddressFormVisible(true);
              }}
            >
              <Text style={styles.addressChangeText}>Change</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressText} numberOfLines={2}>
            {currentAddress}
          </Text>
          <View style={styles.deliveryPillRow}>
            <View style={styles.deliveryPill}>
              <Ionicons
                name="refresh-outline"
                size={12}
                color="#10893E"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.deliveryPillText}>7 days return</Text>
            </View>
            <View style={styles.deliveryPill}>
              <Ionicons
                name="cash-outline"
                size={12}
                color="#10893E"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.deliveryPillText}>Cash on delivery</Text>
            </View>
          </View>
        </View>

        {/* SIZE SELECTOR */}
        <View style={styles.sectionBlock}>
          <View style={styles.sizeHeaderRow}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Select size
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsSizeChartVisible(true)}
            >
              <Text style={styles.sizeChartText}>Size Chart</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sizeRow}>
            {AVAILABLE_SIZES.map((size) => {
              const isActive = selectedSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    isActive && styles.sizeChipActive,
                  ]}
                  onPress={() => setSelectedSize(size)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.sizeChipText,
                      isActive && styles.sizeChipTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sizeActionsRow}>
            <View style={styles.sizeActionButtonsRow}>
              <TouchableOpacity
                style={styles.inlineWishlistButton}
                activeOpacity={0.85}
                onPress={() => {
                  if (isWishlisted) {
                    router.push("/wishlist");
                  } else {
                    setIsWishlisted(true);
                    if (!hasCountedWishlist) {
                      setWishlistCount((prev) => prev + 1);
                      setHasCountedWishlist(true);
                    }
                  }
                }}
              >
                <Ionicons
                  name={isWishlisted ? "heart" : "heart-outline"}
                  size={18}
                  color={isWishlisted ? "red" : "#1d324e"}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.inlineWishlistText}>
                  {isWishlisted ? "Go to wishlist" : "Wishlist"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineShareButton}
                activeOpacity={0.85}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color="#1d324e"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.inlineShareText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineAddToBagButton}
                activeOpacity={0.9}
                onPress={() => {
                  if (hasAddedToCart) {
                    router.push("/cart");
                  } else {
                    handleAddToBag();
                  }
                }}
              >
                <Ionicons name="bag-outline" size={18} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.inlineAddToBagText}>
                  {hasAddedToCart ? "Go to cart" : "Add to bag"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SOLD BY */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Sold by:</Text>
          <Text style={styles.sellerName}>
            Fashion Hub Retail Pvt. Ltd.{" "}
            <Text style={styles.sellerInfo}>• 4.3 ★ • 10k+ followers</Text>
          </Text>
        </View>

        {/* REVIEWS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            Reviews
          </Text>
          {(reviewsExpanded ? reviews : reviews.slice(0, 2)).map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewUser}>{rev.user}</Text>
                <View style={styles.reviewRatingBadge}>
                  <Text style={styles.reviewRatingText}>{rev.rating}</Text>
                  <Ionicons
                    name="star"
                    size={10}
                    color="#FFFFFF"
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>
              <Text style={styles.reviewDate}>{rev.date}</Text>
              <Text style={styles.reviewComment}>{rev.comment}</Text>
              <View style={styles.reviewImageRow}>
                <View style={styles.reviewImagePlaceholder} />
                <View style={styles.reviewImagePlaceholder} />
              </View>
            </View>
          ))}
          {reviews.length > 2 && (
            <TouchableOpacity
              style={styles.viewAllReviewsButton}
              activeOpacity={0.75}
              onPress={() => setReviewsExpanded((prev) => !prev)}
            >
              <Text style={styles.viewAllReviewsText}>
                {reviewsExpanded ? "See less" : "View all reviews"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PRODUCT HIGHLIGHTS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelSecondary]}>
            Product highlights
          </Text>
          <View style={styles.highlightRow}>
            <View style={styles.highlightBullet} />
            <Text style={styles.highlightText}>
              Pure cotton fabric for all‑day comfort
            </Text>
          </View>
          <View style={styles.highlightRow}>
            <View style={styles.highlightBullet} />
            <Text style={styles.highlightText}>
              A‑line silhouette ideal for casual and work wear
            </Text>
          </View>
          <View style={styles.highlightRow}>
            <View style={styles.highlightBullet} />
            <Text style={styles.highlightText}>
              Model is 5'6&quot; and wearing size M
            </Text>
          </View>
          <View style={styles.highlightRow}>
            <View style={styles.highlightBullet} />
            <Text style={styles.highlightText}>
              Machine wash, mild cycle, wash dark colours separately
            </Text>
          </View>
        </View>

        {/* ARE YOU LOOKING FOR THIS? */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelSecondary]}>
            Are you looking for this?
          </Text>
          <View style={styles.chipRow}>
            <View style={styles.searchChip}>
              <Text style={styles.searchChipText}>Floral dresses</Text>
            </View>
            <View style={styles.searchChip}>
              <Text style={styles.searchChipText}>Office wear kurtis</Text>
            </View>
            <View style={styles.searchChip}>
              <Text style={styles.searchChipText}>Party gowns</Text>
            </View>
          </View>
        </View>

        {/* YOU MAY ALSO LIKE */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            You may also like
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestRow}
          >
            {SUGGEST_PRODUCTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestCard}
                activeOpacity={0.85}
                onPress={() => openProductDetail(item.id)}
              >
                <View style={styles.suggestImageWrapper}>
                  <Image source={item.images[0]} style={styles.suggestImage} />
                </View>
                <Text style={styles.suggestTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.suggestPrice}>
                  ₹{item.price.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ALL PRODUCTS */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
            All products
          </Text>
          <View style={styles.allProductsGrid}>
            {ALL_PRODUCTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.allProductCard}
                activeOpacity={0.85}
                onPress={() => openProductDetail(item.id)}
              >
                <View style={styles.allProductImageWrapper}>
                  <Image source={item.image} style={styles.allProductImage} />
                </View>
                <Text style={styles.allProductName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.allProductPriceRow}>
                  <Text style={styles.allProductPrice}>
                    ₹{item.price.toLocaleString()}
                  </Text>
                  <Text style={styles.allProductMrp}>
                    ₹{item.mrp.toLocaleString()}
                  </Text>
                  <Text style={styles.allProductDiscount}>{item.discount}</Text>
                </View>
                <View style={styles.allProductRatingRow}>
                  <View style={styles.allProductRatingBadge}>
                    <Text style={styles.allProductRatingText}>{item.rating}</Text>
                    <Ionicons
                      name="star"
                      size={9}
                      color="#FFFFFF"
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                  <Text style={styles.allProductRatingCount}>
                    ({item.ratingCount})
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      

      {/* SIZE CHART MODAL */}
      {isSizeChartVisible && (
        <View style={styles.sizeChartOverlay}>
          <View style={styles.sizeChartModal}>
            <View style={styles.sizeChartHeaderRow}>
              <Text style={styles.sizeChartTitle}>Size Chart</Text>
              <TouchableOpacity onPress={() => setIsSizeChartVisible(false)}>
                <Ionicons name="close" size={22} color="#333333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sizeChartSubTitle}>
              All measurements are in inches.
            </Text>

            <View style={styles.sizeChartTable}>
              <View style={[styles.sizeChartRow, styles.sizeChartRowHeader]}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  Size
                </Text>
                <Text style={styles.sizeChartCell}>Bust</Text>
                <Text style={styles.sizeChartCell}>Waist</Text>
                <Text style={styles.sizeChartCell}>Hip</Text>
              </View>

              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  S
                </Text>
                <Text style={styles.sizeChartCell}>32‑34</Text>
                <Text style={styles.sizeChartCell}>26‑28</Text>
                <Text style={styles.sizeChartCell}>34‑36</Text>
              </View>
              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  M
                </Text>
                <Text style={styles.sizeChartCell}>34‑36</Text>
                <Text style={styles.sizeChartCell}>28‑30</Text>
                <Text style={styles.sizeChartCell}>36‑38</Text>
              </View>
              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  L
                </Text>
                <Text style={styles.sizeChartCell}>36‑38</Text>
                <Text style={styles.sizeChartCell}>30‑32</Text>
                <Text style={styles.sizeChartCell}>38‑40</Text>
              </View>
              <View style={styles.sizeChartRow}>
                <Text style={[styles.sizeChartCell, styles.sizeChartCellLabel]}>
                  XL
                </Text>
                <Text style={styles.sizeChartCell}>38‑40</Text>
                <Text style={styles.sizeChartCell}>32‑34</Text>
                <Text style={styles.sizeChartCell}>40‑42</Text>
              </View>
            </View>

            <Text style={styles.sizeChartNote}>
              Tip: If you are in between two sizes, we recommend picking the
              larger size for comfort.
            </Text>
          </View>
        </View>
      )}

      {/* ADDRESS FORM MODAL (bottom sheet with extra top gap) */}
      {isAddressFormVisible && (
        <View style={styles.sizeChartOverlay}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.sizeChartModal, styles.addressModalExtra]}>
              <View style={styles.sizeChartHeaderRow}>
                <Text style={styles.sizeChartTitle}>Change address</Text>
                <TouchableOpacity onPress={() => setIsAddressFormVisible(false)}>
                  <Ionicons name="close" size={22} color="#333333" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sizeChartSubTitle}>
                Update the address where you want this product to be delivered.
              </Text>

              <TextInput
                placeholder="House / Flat / Building"
                placeholderTextColor="#999999"
                value={addressLine}
                onChangeText={setAddressLine}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="City"
                placeholderTextColor="#999999"
                value={city}
                onChangeText={setCity}
                style={styles.addressInput}
              />
              <TextInput
                placeholder="Pincode"
                placeholderTextColor="#999999"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                style={styles.addressInput}
              />

              <View style={styles.addressTypeRow}>
                {(["Home", "Office"] as const).map((type) => {
                  const isActive = selectedAddressType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.addressTypeChip,
                        isActive && styles.addressTypeChipActive,
                      ]}
                      onPress={() => setSelectedAddressType(type)}
                    >
                      <Text
                        style={[
                          styles.addressTypeChipText,
                          isActive && styles.addressTypeChipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.addressSaveButton}
                activeOpacity={0.85}
                onPress={handleSaveAddress}
              >
                <Text style={styles.addressSaveButtonText}>Save address</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

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
    paddingBottom: 12,
    backgroundColor: "#FFF7F0",
  },
  headerIconButton: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerSearchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#f6c795",
  },
  searchInputHeader: {
    flex: 1,
    fontSize: 14,
    color: "#1d324e",
    paddingVertical: 2,
  },
  headerIconWrapper: {
    marginLeft: 12,
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
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
  mainImageWrapper: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#E5E5F0",
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 12,
  },
  thumbnailWrapper: {
    width: 52,
    height: 64,
    borderRadius: 8,
    backgroundColor: "#E5E5F0",
    marginRight: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  thumbnailWrapperActive: {
    borderColor: "#ef7b1a",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbnailArrowWrapper: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  detailBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d324e",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceCurrent: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d324e",
    marginRight: 8,
  },
  priceMrp: {
    fontSize: 13,
    color: "#777777",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  priceDiscount: {
    fontSize: 13,
    color: "#10893E",
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  ratingCount: {
    fontSize: 11,
    color: "#555555",
  },
  sectionBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d324e",
    marginBottom: 8,
  },
  sectionLabelAccent: {
    color: "#ef7b1a",
  },
  sectionLabelSecondary: {
    color: "#79411c",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressText: {
    fontSize: 12,
    color: "#333333",
    marginTop: 4,
  },
  addressChangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ef7b1a",
  },
  addressChangeText: {
    fontSize: 11,
    color: "#ef7b1a",
    fontWeight: "600",
  },
  deliveryPillRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  deliveryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#E8F6EC",
    marginRight: 8,
  },
  deliveryPillText: {
    fontSize: 11,
    color: "#10893E",
    fontWeight: "600",
  },
  sizeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  sizeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sizeChip: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#CCCCCC",
    marginRight: 10,
    alignItems: "center",
  },
  sizeChipActive: {
    borderColor: "#ef7b1a",
    backgroundColor: "#FFEBD3",
  },
  sizeChipText: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
  },
  sizeChipTextActive: {
    color: "#1d324e",
  },
  sizeChartText: {
    fontSize: 12,
    color: "#ef7b1a",
    fontWeight: "600",
  },
  sizeActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sizeChartTouch: {
    paddingVertical: 4,
  },
  sizeActionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inlineWishlistButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    marginRight: 8,
  },
  inlineWishlistText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  inlineShareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    marginRight: 8,
  },
  inlineShareText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  inlineAddToBagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 35,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#ef7b1a",
  },
  inlineAddToBagText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sellerName: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "600",
  },
  sellerInfo: {
    fontSize: 11,
    color: "#555555",
    marginTop: 2,
  },
  reviewsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  writeReviewButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#ef7b1a",
    marginRight: 12,
  },
  writeReviewText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  viewAllReviewsButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  viewAllReviewsText: {
    fontSize: 12,
    color: "#ef7b1a",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
  },
  shareButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  highlightBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ef7b1a",
    marginTop: 6,
    marginRight: 8,
  },
  highlightText: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  searchChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFF0E0",
    marginRight: 8,
    marginBottom: 8,
  },
  searchChipText: {
    fontSize: 11,
    color: "#79411c",
    fontWeight: "500",
  },
  suggestRow: {
    paddingTop: 10,
    paddingRight: 10,
  },
  suggestCard: {
    width: 120,
    marginRight: 12,
  },
  suggestImageWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
    marginBottom: 6,
  },
  suggestImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  suggestTitle: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "500",
    marginBottom: 2,
  },
  suggestPrice: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "700",
  },
  allProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  allProductCard: {
    width: "48%",
    marginBottom: 16,
  },
  allProductImageWrapper: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F6F6F9",
    marginBottom: 6,
  },
  allProductImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  allProductName: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "500",
    marginBottom: 2,
  },
  allProductPrice: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "700",
  },
  allProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  allProductMrp: {
    fontSize: 11,
    color: "#777777",
    textDecorationLine: "line-through",
    marginLeft: 6,
  },
  allProductDiscount: {
    fontSize: 11,
    color: "#10893E",
    fontWeight: "600",
    marginLeft: 4,
  },
  allProductRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  allProductRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  allProductRatingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  allProductRatingCount: {
    fontSize: 10,
    color: "#555555",
    marginLeft: 4,
  },
  reviewCard: {
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewUser: {
    fontSize: 12,
    fontWeight: "600",
    color: "#79411c",
  },
  reviewRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10893E",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reviewRatingText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  reviewDate: {
    fontSize: 10,
    color: "#777777",
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: "#333333",
    marginTop: 4,
  },
  reviewImageRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  reviewImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#E5E5F0",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  addressInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#1d324e",
    marginTop: 10,
  },
  addressTypeRow: {
    flexDirection: "row",
    marginTop: 12,
  },
  addressTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D0D0",
    marginRight: 10,
  },
  addressTypeChipActive: {
    borderColor: "#ef7b1a",
    backgroundColor: "#FFEBD3",
  },
  addressTypeChipText: {
    fontSize: 12,
    color: "#555555",
  },
  addressTypeChipTextActive: {
    color: "#1d324e",
    fontWeight: "600",
  },
  addressSaveButton: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#ef7b1a",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  addressSaveButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  reviewImageHint: {
    fontSize: 11,
    color: "#777777",
    marginLeft: 6,
    alignSelf: "center",
  },
  sizeChartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sizeChartModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  addressModalExtra: {
    marginTop: 40,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    borderRadius: 18,
  },
  sizeChartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sizeChartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d324e",
  },
  sizeChartSubTitle: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 12,
  },
  sizeChartTable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  },
  sizeChartRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  sizeChartRowHeader: {
    backgroundColor: "#FFF0E0",
  },
  sizeChartCell: {
    flex: 1,
    fontSize: 11,
    color: "#1d324e",
    textAlign: "center",
  },
  sizeChartCellLabel: {
    fontWeight: "700",
  },
  sizeChartNote: {
    fontSize: 11,
    color: "#555555",
    marginTop: 12,
  },
});


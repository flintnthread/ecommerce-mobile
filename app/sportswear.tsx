import React, { useCallback, useState,useRef, useEffect  } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  StatusBar,
  Alert,
   Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Svg, { Path } from 'react-native-svg'; // add at top

const IMG_SPORTS_DEALS = require("../assets/images/sportswear.png");

const { height, width } = Dimensions.get("window");
const NOTEBOOK_MAX_W = width - 24;
/** Width of one diary “spread” (page | spiral | page) for horizontal paging */
const DIARY_SPREAD_W = NOTEBOOK_MAX_W - 20;
const HERO_GAP = 8;
const HERO_TOP_H = 148;
const HERO_BOTTOM_H = 132;

/** Swap these `require(...)` paths when you add your own banner images. */
const IMG_HERO_WORKOUT = require("../assets/images/sports2.png");
const IMG_HERO_SOCCER = require("../assets/images/sports3.png");
const IMG_HERO_TENNIS = require("../assets/images/sports4.png");
const IMG_HERO = require("../assets/images/sports4.png");

const SPORTSWEAR_DEAL_CARDS: {
  id: string;
  title: string;
  image: ReturnType<typeof require>;
}[] = [
  {
    id: "1",
    title: "Sports footwear",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "2",
    title: "Women's sports wear",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "3",
    title: "Men's sports wear",
    image: require("../assets/images/sports3.png"),
  },
  {
    id: "4",
    title: "Accessories",
    image: require("../assets/images/sports4.png"),
  },
 
];

type PlaybookPageAssets = {
  topLeft: ReturnType<typeof require>;
  topRight: ReturnType<typeof require>;
  bottomLeft: ReturnType<typeof require>;
  bottomMini1: ReturnType<typeof require>;
  bottomMini2: ReturnType<typeof require>;
};

const DEFAULT_PAGE_BADGES: [string, string, string, string, string] = [
  "UP TO 30% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
  "UP TO 50% OFF*",
];
// moon shape


  const data = [
  {
    id: "1",
    title: "Suede Bomber Jacket",
    image: require("../assets/images/sports1.png"),
  },
  {
    id: "2",
    title: "Casual Hoodie",
    image: require("../assets/images/sports2.png"),
  },
  {
    id: "3",
    title: "Denim Jacket",
    image: require("../assets/images/sports3.png"),
  },
];


// L shape data



const data2 = [
  {
    id: 1,
    bigImage: require('../assets/images/redsport2.png'),
    smallImage: require('../assets/images/whitesport.png'),
  },
  {
    id: 2,
    bigImage: require('../assets/images/greensport1.png'),
    smallImage: require('../assets/images/redsport2.png'),
  },
  {
    id: 3,
    bigImage: require('../assets/images/yellowsport3.png'),
    smallImage: require('../assets/images/whitesport4.png'),
  },
];
const DIARY_SPREADS: {
  left: PlaybookPageAssets;
  right: PlaybookPageAssets;
  leftBadges?: [string, string, string, string, string];
  rightBadges?: [string, string, string, string, string];
}[] = [
  {
    left: {
      topLeft: require("../assets/images/sports1.png"),
      topRight: require("../assets/images/sports2.png"),
      bottomLeft: require("../assets/images/sports3.png"),
      bottomMini1: require("../assets/images/sports4.png"),
      bottomMini2: require("../assets/images/sports5.png"),
    },
    right: {
      topLeft: require("../assets/images/sports3.png"),
      topRight: require("../assets/images/sports5.png"),
      bottomLeft: require("../assets/images/sports1.png"),
      bottomMini1: require("../assets/images/sports4.png"),
      bottomMini2: require("../assets/images/sports2.png"),
    },
  },
  {
    left: {
      topLeft: require("../assets/images/sports1.png"),
      topRight: require("../assets/images/sports4.png"),
      bottomLeft: require("../assets/images/sports3.png"),
      bottomMini1: require("../assets/images/sports4.png"),
      bottomMini2: require("../assets/images/sports2.png"),
    },
    right: {
      topLeft: require("../assets/images/sports5.png"),
      topRight: require("../assets/images/sports4.png"),
      bottomLeft: require("../assets/images/sports6.png"),
      bottomMini1: require("../assets/images/sports1.png"),
      bottomMini2: require("../assets/images/sports4.png"),
    },
  },
];
// banner section

const SHOP_STORE_DATA = [
  {
    id: "1",
    title: "Print Store",
    image: require("../assets/images/sportsbanner1.png"),
  },
  {
    id: "2",
    title: "Giftables",
    image: require("../assets/images/sportsbanner2.png"),
  },
  {
    id: "3",
    title: "Summer Store",
    image: require("../assets/images/sportsbanner3.png"),
  },
  {
    id: "4",
    title: "Combo Packs",
    image: require("../assets/images/sportsbanner4.png"),
  },
];


// according to color pick up


const colorOptions = [
  { id: "black", color: "#000" },
  { id: "white", color: "#eee" },
  { id: "red", color: "#ff0000" },
  { id: "green", color: "#9acd32" },
  { id: "yellow", color: "#ffd700" },
];


// mens  sports section
const interests = [
  { name: "Sports Wear", size: 170, img: require("../assets/images/sportsbanner1.png") },
  { name: "Cycling shoes", size: 120, img: require("../assets/images/sportsbanner2.png") },
  { name: "Hiking shoes", size: 90, img: require("../assets/images/sports3.png") },
  { name: "Running shoes", size: 90, img: require("../assets/images/sports4.png") },
  { name: "Sports sandals", size: 90, img: require("../assets/images/sports5.png") },
  { name: "Training shoes", size: 100, img: require("../assets/images/sports6.png") },
  { name: "Footwear", size: 80, img: require("../assets/images/sports7.png") },
  { name: "Sports wear", size: 80, img: require("../assets/images/sports8.png") },
];


  

// banner section

const banners = [
  require("../assets/images/sportsbanner1.png"),
  require("../assets/images/sportsbanner2.png"),
  require("../assets/images/sportsbanner5.png"),
  require("../assets/images/sportsbanner6.png"),
];

const imagesByColor = {
  black: [
    require("../assets/images/blacksport2.png"),
    require("../assets/images/blacksport2.png"),
    require("../assets/images/blacksport2.png"),
  ],
  white: [
    require("../assets/images/whitesport4.png"),
    require("../assets/images/whitesport2.png"),
    require("../assets/images/whitesport3.png"),
  ],
  red: [
    require("../assets/images/redsport1.png"),
    require("../assets/images/redsport2.png"),
    require("../assets/images/redsport3.png"),
  ],
  green: [
    require("../assets/images/greensport1.png"),
    require("../assets/images/greensport2.png"),
    require("../assets/images/greensport3.png"),
  ],
  yellow: [
    require("../assets/images/yellowsport1.png"),
    require("../assets/images/yellowsport2.png"),
    require("../assets/images/yellowsport3.png"),
  ],

  
};
/** Center spine + mirrored C-hooks (coil through the gutter), like a real spiral bind */
function SpiralBindColumn() {
  const rings = 20;
  return (
    <View style={styles.spiralBindOuter} accessibilityLabel="Spiral binding">
      <View style={styles.spiralBindCenterBar} pointerEvents="none" />
      {Array.from({ length: rings }, (_, i) => (
        <View key={i} style={styles.spiralBindRow}>
          <View
            style={[
              styles.spiralBindHook,
              i % 2 === 1 ? styles.spiralBindHookMirror : null,
            ]}
          />
        </View>
      ))}
    </View>
  );
}

function PlaybookPageGrid({
  page,
  badges,
  onShop,
}: {
  page: PlaybookPageAssets;
  badges: [string, string, string, string, string];
  onShop: () => void;
}) {
  return (
    <View style={styles.playbookPage}>
      <View style={styles.pbRowTop}>
        <TouchableOpacity
          style={styles.pbTopLeft}
          activeOpacity={0.9}
          onPress={onShop}
        >
          <Image source={page.topLeft} style={styles.pbCardImg} />
          <View style={styles.pbCardFooter}>
            <Text style={styles.pbBadge} numberOfLines={2}>
              {badges[0]}
            </Text>
            <View style={styles.pbShopBtn}>
              <Text style={styles.pbShopBtnText}>Shop now</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pbTopRight}
          activeOpacity={0.9}
          onPress={onShop}
        >
          <Image source={page.topRight} style={styles.pbCardImg} />
          <View style={styles.pbCardFooter}>
            <Text style={styles.pbBadge} numberOfLines={2}>
              {badges[1]}
            </Text>
            <View style={styles.pbShopBtn}>
              <Text style={styles.pbShopBtnText}>Shop now</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.pbRowBottom}>
        <TouchableOpacity
          style={styles.pbBottomLeft}
          activeOpacity={0.9}
          onPress={onShop}
        >
          <Image source={page.bottomLeft} style={styles.pbCardImg} />
          <View style={[styles.pbCardFooter, styles.pbCardFooterDark]}>
            <Text style={[styles.pbBadge, styles.pbBadgeOnDark]} numberOfLines={2}>
              {badges[2]}
            </Text>
            <View style={styles.pbShopBtnLight}>
              <Text style={styles.pbShopBtnTextDark}>Shop now</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.pbMiniPair}>
          <TouchableOpacity
            style={styles.pbMini}
            activeOpacity={0.9}
            onPress={onShop}
          >
            <Image source={page.bottomMini1} style={styles.pbCardImg} />
            <View style={styles.pbCardFooter}>
              <Text style={styles.pbBadge} numberOfLines={2}>
                {badges[3]}
              </Text>
              <View style={styles.pbShopBtn}>
                <Text style={styles.pbShopBtnText}>Shop now</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pbMini}
            activeOpacity={0.9}
            onPress={onShop}
          >
            <Image source={page.bottomMini2} style={styles.pbCardImg} />
            <View style={styles.pbCardFooter}>
              <Text style={styles.pbBadge} numberOfLines={2}>
                {badges[4]}
              </Text>
              <View style={styles.pbShopBtn}>
                <Text style={styles.pbShopBtnText}>Shop now</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SportswearGlassDealCard({
  title,
  image,
  onOpen,
  onBag,
  onDetail,
}: {
  title: string;
  image: ReturnType<typeof require>;
  onOpen: () => void;
  onBag: () => void;
  onDetail: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.glassDealCard}
      activeOpacity={0.95}
      onPress={onOpen}
    >
      <ImageBackground
        source={image}
        style={styles.glassDealBg}
        imageStyle={styles.glassDealBgImage}
      >
        <View style={styles.glassDealTopRow}>
          <View style={styles.glassDealTopSpacer} />
          <TouchableOpacity
            style={styles.glassIconCircle}
            onPress={onBag}
            accessibilityRole="button"
            accessibilityLabel="Bag"
          >
            <Ionicons name="bag-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.glassDealMiddle} />

        <View style={styles.glassDealBar}>
          <View style={styles.glassDealBarBlur} />
          <View style={styles.glassDealBarInner}>
            <Text style={styles.glassDealTitle} numberOfLines={2}>
              {title}
            </Text>
            <TouchableOpacity
              style={styles.glassIconCircleSm}
              onPress={onDetail}
              accessibilityRole="button"
              accessibilityLabel="View"
            >
              <Ionicons name="fitness-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function SportsWearSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [playbookPage, setPlaybookPage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("white");

  const openCamera = useCallback(() => {
    Alert.alert(
      "Camera access",
      "Allow camera access to take photos?",
      [
        { text: "Don't allow", style: "cancel" },
        { text: "Allow", onPress: () => router.push("/camerasearch") },
      ]
    );
  }, [router]);

  const goShop = useCallback(() => {
    router.push("/products");
  }, [router]);


  const rotateAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.loop(
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 12000,
      useNativeDriver: true,
    })
  ).start();
}, []);

const rotate = rotateAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ["0deg", "360deg"],
});

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            placeholder="Search sports wear..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={openCamera}
            style={styles.searchBarIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Open camera"
          >
            <Ionicons name="camera-outline" size={22} color="#777" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/wishlist")}
        >
          <Ionicons name="heart-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push("/cart")}
        >
          <Ionicons name="cart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

    <View style={styles.bannerContainer}>
  <Image
    source={require("../assets/images/sportswear.png")}
    style={styles.bannerImage}
  />
</View>


      

      {/* SHOP BY CATEGORY */}
      <View style={styles.glassDealsSection}>
        <Text style={styles.glassDealsSectionTitle}>Shop by Categories</Text>
        {SPORTSWEAR_DEAL_CARDS.map((item) => (
          <SportswearGlassDealCard
            key={item.id}
            title={item.title}
            image={item.image}
            onOpen={goShop}
            onBag={() => router.push("/cart")}
            onDetail={goShop}
          />
        ))}
      </View>

      <View style={{ height: 25 }} />

      {/* according to color pick up */}


      <View style={styles.colorcontainer}>
      <Text style={styles.heading}>Which color would you Pick ?</Text>

      {/* Color Buttons */}
      <View style={styles.colorRow}>
        {colorOptions.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setSelectedColor(item.id)}
            style={[
              styles.colorCircle,
              { backgroundColor: item.color },
              selectedColor === item.id && styles.selectedCircle,
            ]}
          />
        ))}
      </View>

      {/* Shoe Images */}
      <View style={styles.imageRow}>
        {imagesByColor[selectedColor].map((img, index) => (
          <Image key={index} source={img} style={styles.shoeImage} />
        ))}
      </View>

      {/* Offer Text */}
      <Text style={styles.offerText}>Upto 80% Off*</Text>

      {/* Button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>SHOP NOW</Text>
      </TouchableOpacity>
    </View>
  


      {/* POWER PICKS */}
      <View style={styles.powerSection}>
        <Text style={styles.powerTitle}>POWER PICKS</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <TouchableOpacity style={styles.powerCard}>
            <Image
              source={require("../assets/images/sports2.png")}
              style={styles.powerImage}
            />
            <View style={styles.powerOverlay}>
              <Text style={styles.powerText}>NEW DROP</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.powerCard}>
            <Image
              source={require("../assets/images/sports4.png")}
              style={styles.powerImage}
            />
            <View style={styles.powerOverlay}>
              <Text style={styles.powerText}>BEST DEALS</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.powerCard}>
            <Image
              source={require("../assets/images/sports4.png")}
              style={styles.powerImage}
            />
            <View style={styles.powerOverlay}>
              <Text style={styles.powerText}>TRENDING</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Playbook: left page | spiral | right page — swipe for next spread */}
      <View style={styles.springBookOuter}>
        <Text style={styles.diaryTitle}>The Athlete&apos;s Playbook</Text>

        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          style={styles.diaryScroll}
          contentContainerStyle={styles.diaryScrollContent}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const next = Math.round(x / DIARY_SPREAD_W);
            setPlaybookPage(
              Math.min(
                Math.max(0, next),
                Math.max(0, DIARY_SPREADS.length - 1)
              )
            );
          }}
        >
          {DIARY_SPREADS.map((spread, spreadIndex) => {
            const leftB = spread.leftBadges ?? DEFAULT_PAGE_BADGES;
            const rightB = spread.rightBadges ?? DEFAULT_PAGE_BADGES;
            return (
              <View
                key={spreadIndex}
                style={[styles.diarySpreadCard, { width: DIARY_SPREAD_W }]}
              >
                <View style={styles.notebookPageWrap}>
                  <PlaybookPageGrid
                    page={spread.left}
                    badges={leftB}
                    onShop={goShop}
                  />
                </View>

                <SpiralBindColumn />

                <View style={styles.notebookPageWrap}>
                  <PlaybookPageGrid
                    page={spread.right}
                    badges={rightB}
                    onShop={goShop}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.diaryPageDots}>
          {DIARY_SPREADS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.diaryPageDot,
                i === playbookPage && styles.diaryPageDotActive,
              ]}
            />
          ))}
        </View>
      </View>

     {/* sports footwear */}


     <View style={styles.trendsSection}>
  <Text style={styles.trendsTitle}>Accessories</Text>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={195} // card width + margin
    decelerationRate="fast"
    snapToAlignment="start"
    disableIntervalMomentum={true}
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {/* CARD 1 */}
    <TouchableOpacity style={styles.trendCard}>
      <Image
        source={require("../assets/images/sports2.png")}
        style={styles.trendImage}
      />
      <View style={styles.trendOverlay}>
        <Text style={styles.trendBrand}>DNMX • NETPLAY</Text>
        <Text style={styles.trendPrice}>UNDER ₹399*</Text>
      </View>
    </TouchableOpacity>

    {/* CARD 2 */}
    <TouchableOpacity style={styles.trendCard}>
      <Image
        source={require("../assets/images/sports4.png")}
        style={styles.trendImage}
      />
      <View style={styles.trendOverlay}>
        <Text style={styles.trendBrand}>YOUSTA</Text>
        <Text style={styles.trendPrice}>UNDER ₹399*</Text>
      </View>
    </TouchableOpacity>
    {/* CARD 3 */}
    <TouchableOpacity style={styles.trendCard}>
      <Image
        source={require("../assets/images/sports1.png")}
        style={styles.trendImage}
      />
      <View style={styles.trendOverlay}>
        <Text style={styles.trendBrand}>JOHN PLAYERS</Text>
        <Text style={styles.trendPrice}>MIN. 65% OFF</Text>
      </View>
    </TouchableOpacity>
  </ScrollView>
</View>






{/* ACESSARORIES*/}
<View style={styles.storeSection}>
  
  {/* 🔶 TOP BANNER */}
  <ImageBackground
    source={require("../assets/images/redsport1.png")} // change banner
    style={styles.storeBanner}
    imageStyle={{ borderRadius: 14 }}
  >
    <View style={styles.storeOverlay}>
      <Text style={styles.storeTitle}>SHOP BY STORE</Text>

      <TouchableOpacity>
        <Text style={styles.storeShopAll}>Shop All</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>

  {/* 🔶 HORIZONTAL SCROLL */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={130}
    decelerationRate="fast"
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {SHOP_STORE_DATA.map((item) => (
      <TouchableOpacity key={item.id} style={styles.storeCard}>
        
        {/* 🔥 HALF ROUND CARD */}
        <View style={styles.storeImageWrapper}>
          <Image source={item.image} style={styles.storeImage} />
        </View>

        <Text style={styles.storeText}>{item.title}</Text>
        <Text style={styles.storeOffer}>UP TO 50% OFF</Text>

      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
{/* BANNER SECTION */}

 

<View style={styles.lookbookWrapper}>

  <Text style={styles.lookbookTitle}>THE LOCAL LOOKBOOK</Text>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={width * 0.75}
    decelerationRate="fast"
  >
    {banners.map((img, index) => (
      <View key={index} style={styles.cardWrapper}>

        <View style={styles.redFrame}>
          <Image
            source={img}
            style={styles.lookbookImage}
          />
        </View>

      </View>
    ))}
  </ScrollView>

</View>

{/* womens sports wear */}

<View style={styles.westernSection}>
  
  {/* 🔶 TOP BANNER */}
  <ImageBackground
    source={require("../assets/images/redsport2.png")}
    style={styles.westernBanner}
    imageStyle={{ borderRadius: 12 }}
  >
    <View style={styles.bannerOverlay}>
      <Text style={styles.bannerTitle}>WOMEN SPORTS WEAR</Text>

      <TouchableOpacity>
        <Text style={styles.shopAll}>Shop All</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>

  {/* 🔶 SCROLLING PRODUCTS */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    snapToInterval={170}
    decelerationRate="fast"
    contentContainerStyle={{ paddingHorizontal: 10 }}
  >
    {/* CARD 1 */}
    <TouchableOpacity style={styles.productCard}>
      <Image
        source={require("../assets/images/greensport1.png")}
        style={styles.productImage}
      />
      <View style={styles.productOverlay}>
        <Text style={styles.productText}>Tops, T shirts & Shirts</Text>
      </View>
      <Text style={styles.productOffer}>MIN. 60% OFF*</Text>
    </TouchableOpacity>

    {/* CARD 2 */}
    <TouchableOpacity style={styles.productCard}>
      <Image
        source={require("../assets/images/yellowsport2.png")}
        style={styles.productImage}
      />
      <View style={styles.productOverlay}>
        <Text style={styles.productText}>Jeans</Text>
      </View>
      <Text style={styles.productOffer}>MIN. 60% OFF*</Text>
    </TouchableOpacity>

    {/* CARD 3 */}
    <TouchableOpacity style={styles.productCard}>
      <Image
        source={require("../assets/images/whitesport2.png")}
        style={styles.productImage}
      />
      <View style={styles.productOverlay}>
        <Text style={styles.productText}>Trousers</Text>
      </View>
      <Text style={styles.productOffer}>MIN. 65% OFF*</Text>
    </TouchableOpacity>
  </ScrollView>
</View>



{/* mens wear */}
 <View style={styles.container2}>
    <Text style={styles.title}>What's your interest in?</Text>

    <View style={styles.centerWrapper}>
      {/* CENTER CIRCLE */}
      <View style={[styles.circle, styles.centerCircle]}>
        <Image source={interests[0].img} style={styles.circleImage} />
        <Text style={styles.circleText}>{interests[0].name}</Text>
      </View>

      {/* ORBITING CIRCLES */}
      <Animated.View
        style={[
          styles.orbitContainer,
          { transform: [{ rotate }] },
        ]}
      >
        {interests.slice(1).map((item, index) => {
          const angle = (index / (interests.length - 1)) * (2 * Math.PI);
          const radius = 140;

          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          return (
            <View
              key={index}
              style={[
                styles.circle,
                {
                  width: item.size,
                  height: item.size,
                  borderRadius: item.size / 2,
                  transform: [{ translateX: x }, { translateY: y }],
                },
              ]}
            >
              <Image source={item.img} style={styles.circleImage} />
              <Text style={styles.circleText}>{item.name}</Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  </View>

{/* trending cards */}


{/* 🔥 CURVED BIG CARD SLIDER */}
<View style={styles.curveSection}>
  <ScrollView
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
  >
    {data.map((item) => (
      <View key={item.id} style={styles.curveCard}>

        {/* IMAGE */}
        <Image source={item.image} style={styles.curveImage} />

       {/* 🔥 REAL TOP CURVE CUT */}
<Svg
  width="100%"
  height={90}
  viewBox="0 0 300 90"
  style={styles.curveSvg}
>
  <Path
    d="M0,90 Q150,-40 300,90 L300,0 L0,0 Z"
    fill="#fff"
  />
</Svg>

        {/* TEXT OVERLAY */}
        <View style={styles.curveOverlay}>
          <Text style={styles.curveTitle}>{item.title}</Text>
          <Text style={styles.curvePrice}>169.99</Text>
        </View>

        {/* ICONS */}
        <TouchableOpacity style={styles.topIcon}>
          <Ionicons name="bookmark-outline" size={20} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomIcon}>
          <Ionicons name="bag-outline" size={22} color="#000" />
        </TouchableOpacity>

      </View>
    ))}
  </ScrollView>
</View>
{/* deals section */}
<View style={styles.heroDealsOnlyWrap}>
       <TouchableOpacity onPress={goShop} activeOpacity={0.9}>
  <ImageBackground
    source={IMG_SPORTS_DEALS}
    style={styles.sportswearDealsBtn}
    imageStyle={{ borderRadius: 14 }}
  >
    <View style={styles.dealsOverlay}>
      <Text style={styles.sportswearDealsBtnText}>Sportswear deals</Text>
      <Ionicons name="chevron-forward" size={18} color="#fff" />
    </View>
  </ImageBackground>
</TouchableOpacity>
      </View>

      {/* Promo grid — tap any tile; main CTA is the bar above */}
      <View style={styles.heroSection}>
        <View style={styles.heroRow}>
          <View style={styles.heroLeftCol}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={goShop}
              style={[styles.heroTopWide, { height: HERO_TOP_H }]}
            >
              <ImageBackground
                source={IMG_HERO_WORKOUT}
                style={styles.heroBgImageOnly}
                imageStyle={styles.heroBgImage}
              >
                <View style={styles.heroDimLight} />
              </ImageBackground>
            </TouchableOpacity>

            <View
              style={[
                styles.heroBottomRow,
                { marginTop: HERO_GAP, height: HERO_BOTTOM_H },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={goShop}
                style={styles.heroBottomCell}
              >
                <ImageBackground
                  source={IMG_HERO_SOCCER}
                  style={styles.heroBgImageOnly}
                  imageStyle={styles.heroBgImage}
                >
                  <View style={styles.heroDimLight} />
                </ImageBackground>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.92}
                onPress={goShop}
                style={styles.heroBottomCell}
              >
                <View style={styles.heroSaleOuter}>
                  <View style={styles.heroSaleInnerMinimal} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.92}
            onPress={goShop}
            style={styles.heroRightTall}
          >
            <ImageBackground
              source={IMG_HERO_TENNIS}
              style={styles.heroBgImageOnly}
              imageStyle={styles.heroBgImage}
            >
              <View style={styles.heroDimLight} />
            </ImageBackground>
          </TouchableOpacity>
        </View>
      </View>





{/* L shape section  */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    paddingHorizontal: 10,
    paddingTop: 10,   // 👈 small inner spacing
  }}
  style={{ marginTop: 45 }}   // 👈 🔥 THIS CREATES GAP FROM ABOVE SECTION
>

  {data2.map((item) => (
    <View key={item.id} style={styles.lSection}>

      {/* BIG BOX */}
      <View style={styles.bigBox}>
        <Image source={item.bigImage} style={styles.bigImage} />
      </View>

      {/* SMALL BOX */}
      <View style={styles.smallBox}>
        <Image source={item.smallImage} style={styles.smallImage} />
      </View>

    </View>
  ))}

</ScrollView>

  

    
   
  
    
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: StatusBar.currentHeight || 20,
    marginBottom: 14,
    gap: 6,
  },

  logo: {
    width: 56,
    height: 32,
    marginRight: 4,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 22,
    paddingHorizontal: 10,
    minHeight: 44,
  },

  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 15,
    color: "#111",
    paddingVertical: 8,
  },

  searchBarIconBtn: {
    padding: 6,
    marginLeft: 4,
  },

  cartBtn: {
    marginLeft: 4,
    padding: 4,
  },

  iconBtn: {
    marginLeft: 4,
    padding: 4,
  },

  bannerContainer: {
    width: "100%",
    height: height * 0.5,
  },

  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heroDealsOnlyWrap: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
  },

  sportswearDealsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff6f00",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e65100",
    shadowColor: "#ff6f00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },

  sportswearDealsBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },

  /* Hero promo grid */
  heroSection: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: HERO_GAP,
  },

  heroLeftCol: {
    flex: 1,
    minWidth: 0,
  },

  heroTopWide: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
  },

  heroBottomRow: {
    flexDirection: "row",
    gap: HERO_GAP,
  },

  heroBottomCell: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
  },

  heroRightTall: {
    width: width * 0.34,
    maxWidth: 140,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#222",
    minHeight: HERO_TOP_H + HERO_GAP + HERO_BOTTOM_H,
  },

  heroBgImageOnly: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  heroBgImage: {
    borderRadius: 10,
  },

  heroDimLight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
    borderRadius: 10,
  },

  heroSaleOuter: {
    flex: 1,
    backgroundColor: "#b71c1c",
    borderRadius: 10,
    padding: 3,
  },

  heroSaleInnerMinimal: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#ffeb3b",
    borderRadius: 8,
    backgroundColor: "rgba(183, 28, 28, 0.92)",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 15,
    marginTop: 16,
    marginBottom: 10,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },

  categoryCard: {
    width: "48%",
    marginBottom: 15,
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    overflow: "hidden",
  },

  categoryImage: {
    width: "100%",
    height: 120,
  },

  categoryText: {
    padding: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  powerSection: {
    marginTop: 20,
    paddingVertical: 20,
    backgroundColor: "orange",
  },

  powerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    letterSpacing: 2,
  },

  powerCard: {
    width: 260,
    height: 320,
    marginRight: 15,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "blue",
  },

  powerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  powerOverlay: {
    position: "absolute",
    bottom: 15,
    left: 15,
  },

  powerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },

  /* The Athlete's Playbook */
  springBookOuter: {
  marginTop: 26,              // थोड़ा spacing बढ़ाया
  marginHorizontal: 10,       // side से थोड़ा ज्यादा width मिलेगा
  marginBottom: 12,
  
  maxWidth: NOTEBOOK_MAX_W + 20, // 👉 width बढ़ाया
  alignSelf: "center",
  width: "100%",

  backgroundColor: "#cfe8f6",
  borderRadius: 20,

  paddingVertical: 22,        // 👉 height feel बढ़ाने के लिए
  paddingHorizontal: 14,

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 5,
},

  diaryTitle: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#1d324e",
    marginBottom: 14,
    textShadowColor: "#fff",
    textShadowOffset: { width: 2, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 0.5,
  },

  diaryScroll: {
    width: DIARY_SPREAD_W,
    alignSelf: "center",
  },

  diaryScrollContent: {
    flexDirection: "row",
  },

  diarySpreadCard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },

  notebookPageWrap: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 5,
  },

  playbookPage: {
    flex: 1,
    justifyContent: "space-between",
  },

  pbRowTop: {
    flexDirection: "row",
    gap: 6,
    height: 250,
    marginBottom: 6,
  },

  pbTopLeft: {
    width: "36%",
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbTopRight: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbRowBottom: {
    flexDirection: "row",
    gap: 6,
    height: 200,
  },

  pbBottomLeft: {
    width: "42%",
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbMiniPair: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    gap: 5,
  },

  pbMini: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ececec",
  },

  pbCardImg: {
    width: "100%",
    flex: 1,
    minHeight: 48,
    resizeMode: "cover",
  },

  pbCardFooter: {
    flexDirection: "column",
    paddingHorizontal: 4,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.95)",
    gap: 0,
  },

  pbCardFooterDark: {
    backgroundColor: "rgba(0,0,0,0.82)",
  },

  pbBadge: {
    fontSize: 7,
    fontWeight: "900",
    color: "#111",
    lineHeight: 9,
  },

  pbBadgeOnDark: {
    color: "#fff",
  },

  pbShopBtn: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: "#111",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },

  pbShopBtnText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#fff",
  },

  pbShopBtnLight: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },

  pbShopBtnTextDark: {
    fontSize: 7,
    fontWeight: "800",
    color: "#111",
  },

  spiralBindOuter: {
    width: 38,
    flexShrink: 0,
    alignSelf: "stretch",
    backgroundColor: "#d5d5d5",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#9e9e9e",
    paddingVertical: 6,
    position: "relative",
    justifyContent: "space-between",
  },

  spiralBindCenterBar: {
    position: "absolute",
    left: "50%",
    marginLeft: -2,
    width: 4,
    top: 8,
    bottom: 8,
    backgroundColor: "#0a0a0a",
    borderRadius: 2,
    zIndex: 1,
  },

  spiralBindRow: {
    flex: 1,
    minHeight: 6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  spiralBindHook: {
    width: 22,
    height: 13,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    borderWidth: 2.5,
    borderColor: "#111",
    borderRightWidth: 0,
    backgroundColor: "#fafafa",
  },

  spiralBindHookMirror: {
    transform: [{ scaleX: -1 }],
  },

  diaryPageDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  diaryPageDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },

  diaryPageDotActive: {
    width: 20,
    backgroundColor: "#ff2d8b",
    borderColor: "#c2185b",
  },

  /* Glass-style vertical deals (below playbook) */
  glassDealsSection: {
    backgroundColor: "#d7a3a3",
    marginTop: 6,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 10,
  },

  glassDealsSectionTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#ece2d5",
    marginBottom: 16,
    letterSpacing: 0.3,
  },

  glassDealCard: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    height: width * 0.62,
    maxHeight: 250,
    marginBottom: 16,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#af9778",
  },

  glassDealBg: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
  },

  glassDealBgImage: {
    borderRadius: 28,
    height:300,
  },

  glassDealTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingTop: 16,
  },

  glassDealTopSpacer: {
    flex: 1,
  },

  glassIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  glassDealMiddle: {
    flex: 1,
  },

  glassDealBar: {
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    minHeight: 60,
  },

  glassDealBarBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.35)",
  },

  glassDealBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    zIndex: 1,
  },

  glassDealTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 21,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  glassIconCircleSm: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  dealsOverlay: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)", // dark overlay for text visibility
  borderRadius: 14,
},


// according to colour


colorcontainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 20,
    borderRadius: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: "#000",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  shoeImage: {
    width: 100,
    height: 80,
    resizeMode: "contain",
  },
  offerText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    fontWeight: "600",
  },


  // sports footwear

  trendsSection: {
  marginTop: 10,
  paddingVertical: 20,
  backgroundColor: "#1a0000",
},

trendsTitle: {
  color: "#fff",
  fontSize: 20,
  fontWeight: "bold",
  textAlign: "center",
  marginBottom: 15,
  letterSpacing: 2,
},

trendCard: {
  width: 180,
  height: 260,
  marginRight: 15,
  borderRadius: 10,
  overflow: "hidden",
  borderWidth: 2,
  borderColor: "#ff2d2d",
},

trendImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

trendOverlay: {
  position: "absolute",
  bottom: 10,
  left: 10,
},

trendBrand: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
},

trendPrice: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
},

//  women sports wear


westernSection: {
  marginTop: 15,
  backgroundColor: "#f5e1d8",
  paddingVertical: 15,
},

/* 🔶 BANNER */
westernBanner: {
  height: 200,
  marginHorizontal: 10,
  marginBottom: 15,
  justifyContent: "center",
},

bannerOverlay: {
  alignItems: "center",
},

bannerTitle: {
  fontSize: 22,
  fontWeight: "bold",
  color: "white",
  letterSpacing: 2,
},

shopAll: {
  marginTop: 10,
  fontSize: 16,
  textDecorationLine: "underline",
  fontWeight: "600",
  color:"white",
},

/* 🔶 PRODUCT CARDS */
productCard: {
  width: 160,
  marginRight: 12,
},

productImage: {
  width: "100%",
  height: 160,
  borderRadius: 12,
},

productOverlay: {
  position: "absolute",
  bottom: 35,
  left: 10,
},

productText: {
  color: "#fff",
  fontSize: 12,
  fontWeight: "600",
  backgroundColor: "rgba(0,0,0,0.5)",
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 4,
},

productOffer: {
  textAlign: "center",
  marginTop: 6,
  fontWeight: "bold",
  fontSize: 14,
},






/* Acessaries */

storeSection: {
  marginTop: 20,
  backgroundColor: "#fff",
  paddingVertical: 15,
},

storeBanner: {
  height: 180,
  marginHorizontal: 10,
  marginBottom: 15,
  justifyContent: "center",
},

storeOverlay: {
  alignItems: "center",
},

storeTitle: {
  fontSize: 22,
  fontWeight: "bold",
  color: "#fff",
  letterSpacing: 2,
},

storeShopAll: {
  marginTop: 8,
  fontSize: 16,
  textDecorationLine: "underline",
  color: "#fff",
},

storeCard: {
  width: 120,
  marginRight: 12,
  alignItems: "center",
},

/* 🔥 HALF ROUND IMAGE */
storeImageWrapper: {
  width: 110,
  height: 80,
  backgroundColor: "#f2f2f2",
  borderTopLeftRadius: 60,
  borderTopRightRadius: 60,
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  overflow: "hidden",
  justifyContent: "center",
  alignItems: "center",
},

storeImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

storeText: {
  marginTop: 6,
  fontSize: 13,
  fontWeight: "600",
  textAlign: "center",
},

storeOffer: {
  fontSize: 11,
  color: "#ff2d2d",
  fontWeight: "bold",
},
// banner section
/* 🔥 LOOKBOOK SECTION */
lookbookWrapper:{
  marginTop:20,
},

lookbookTitle:{
  textAlign:"center",
  fontSize:20,
  fontWeight:"700",
  marginBottom:15,
},

cardWrapper:{
  width:width*0.75,
  marginHorizontal:12,
},

redFrame:{
  backgroundColor:"#ff3b30",
  padding:6,
  borderRadius:28,
  shadowColor:"#000",
  shadowOpacity:0.3,
  shadowRadius:10,
  elevation:8,
},

lookbookImage:{
  width:"100%",
  height:260,
  borderRadius:24,
  resizeMode:"cover",
},

// mens wear

container2: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1B1B5F",
    marginBottom: 40,
  },

  centerWrapper: {
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },

  orbitContainer: {
    position: "absolute",
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },

  circle: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 5,
  },

  centerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    zIndex: 10,
  },

  circleImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  circleText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    width: "100%",
     },




    // moon shape





/* 🔥 THIS CREATES TOP CURVE CUT */
curveSection: {
  marginTop: 30,
},

curveCard: {
  width: 260,
  height: 320,
  borderRadius: 20,
  overflow: 'hidden',
  backgroundColor: '#fff',
  marginHorizontal: 10,
},

curveImage: {
  width: '100%',
  height: '100%',
  position: 'absolute',
},

curveSvg: {
  position: 'absolute',
  top: -10,
  left: 0,
},


curveOverlay: {
  position: "absolute",
  bottom: 60,
  left: 20,
},

curveTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "white",
},

curvePrice: {
  fontSize: 18,
  fontWeight: "600",
  marginTop: 5,
  color: "white",
},

topIcon: {
  position: "absolute",
  top: 20,
  right: 20,
  backgroundColor: "#fff",
  padding: 8,
  borderRadius: 20,
},

bottomIcon: {
  position: "absolute",
  bottom: 20,
  right: 20,
  backgroundColor: "#fff",
  padding: 10,
  borderRadius: 25,
},


topBanner: {
  backgroundColor: '#1FA79A',
  height: 260,
  borderBottomLeftRadius: 30,
  borderBottomRightRadius: 30,
  paddingTop: 40,
  paddingHorizontal: 20,
},

/* 🔥 SMALL TOP BOX (reduced size) */


// L shape section

lSection: {
  width: 280,          // 👈 REQUIRED for scroll
  height: 260,
  position: 'relative',
  marginHorizontal: 10,
},

bigBox: {
  width: '68%',        // 👈 leaves gap for small box
  height: '100%',
  borderRadius: 12,
  overflow: 'hidden',
  
},

bigImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},

smallBox: {
  position: 'absolute',
  right: 0,
  bottom: 0,

  width: 120,
  height: 110,

  borderRadius: 12,
  overflow: 'hidden',
},

smallImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
});

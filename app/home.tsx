import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function Home() {
  const placeholderTexts = [
    "Search Shoes",
    "Search Womens Wear",
    "Search Fashion",
    "Search Sportswear",
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) =>
        prev === placeholderTexts.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const categories = [
    { name: "Kids Wear", image: require("../assets/images/kidscate.png") },
    { name: "Mens Wear", image: require("../assets/images/menscate.png") },
    { name: "Womens Wear", image: require("../assets/images/womencate.png") },
    { name: "Play", image: require("../assets/images/playcate.png") },
    { name: "Gargi", image: require("../assets/images/sofacate.png") },
    { name: "Sweets", image: require("../assets/images/sweetscate.png") },
    { name: "Foot Wear", image: require("../assets/images/footwearcate.png") },
    { name: "Sports Wear", image: require("../assets/images/sportscate.png") },
    { name: "Accessories", image: require("../assets/images/accessariescate.png") },
    { name: "Homelyhub", image: require("../assets/images/homecate.png") },
  ];

  const firstSix = categories.slice(0, 6);
  const nextFour = categories.slice(6);
  const pages = [firstSix, nextFour];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveDot(slide);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          {/* Greeting + Profile */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.helloText}>Hello 👋</Text>
              <Text style={styles.shopText}>Lets shop</Text>
            </View>

            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=12" }}
              style={styles.profileImage}
            />
          </View>

          {/* Logo + Search */}
          <View style={styles.searchRow}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={18} color="#777" />

              <TextInput
                placeholder={placeholderTexts[placeholderIndex]}
                placeholderTextColor="#777"
                style={styles.searchInput}
              />

              <Ionicons
                name="camera-outline"
                size={20}
                color="#777"
                style={{ marginRight: 10 }}
              />

              <Ionicons name="mic-outline" size={18} color="#777" />
            </View>
          </View>
        </View>

        {/* CATEGORY SLIDER */}
        <FlatList
          data={pages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.categoryPage}>
              {item.map((cat, index) => (
                <View key={index} style={styles.categoryBox}>
                  <Image source={cat.image} style={styles.categoryImage} />
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </View>
              ))}
            </View>
          )}
        />

        {/* DOT INDICATOR */}
        <View style={styles.dotContainer}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: activeDot === i ? "#000" : "#ccc" },
              ]}
            />
          ))}
        </View>

        {/* FILTER ROW */}
        <View style={styles.filterRow}>
          <FilterItem icon="swap-vert" label="Sort" />
          <FilterItem icon="grid-view" label="Category" />
          <FilterItem icon="person-outline" label="Gender" />
          <FilterItem icon="filter-list" label="Filter" />
        </View>

        {/* BANNER */}
        <View style={styles.banner}>
          <Text style={{ fontWeight: "600" }}>Unlimited Scrolling</Text>
        </View>

        {/* VIDEO */}
        <View style={styles.videoBox}>
          <Text>Video Section</Text>
        </View>
      </ScrollView>

      {/* ORIGINAL BOTTOM TAB (NOT REMOVED) */}
      <View style={styles.bottomTab}>
        <TabItem icon="home-outline" label="Home" />
        <TabItem icon="grid-outline" label="Categories" />
        <TabItem icon="clipboard-outline" label="Orders" />
        <TabItem icon="person-outline" label="Account" />
        <TabItem icon="cart-outline" label="Cart" />
      </View>
    </View>
  );
}

const FilterItem = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.filterItem}>
    <MaterialIcons name={icon} size={20} color="#000" />
    <Text style={styles.filterText}>{label}</Text>
  </TouchableOpacity>
);

const TabItem = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.tabItem}>
    <Ionicons name={icon} size={22} color="#000" />
    <Text style={styles.tabLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 15,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  helloText: { fontSize: 14, color: "#777" },
  shopText: { fontSize: 18, fontWeight: "bold" },

  profileImage: { width: 40, height: 40, borderRadius: 20 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  logo: { width: 60, height: 35, marginRight: 8 },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFEFEF",
    borderRadius: 25,
    paddingHorizontal: 12,
    height: 45,
  },

  searchInput: { flex: 1, marginLeft: 8 },

  categoryPage: {
    width: width,
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

  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },

  filterItem: { alignItems: "center" },

  filterText: { fontSize: 12, marginTop: 4 },

  banner: {
    height: 200,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  videoBox: {
    height: 180,
    backgroundColor: "#D9D9D9",
    margin: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#ccc",
  },

  tabItem: { alignItems: "center" },

  tabLabel: { fontSize: 11, marginTop: 3 },
});
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function YouMayAlsoLike() {
  const router = useRouter();

  const products = [
    {
      id: "1",
      name: "4PC Gold AD Stone Bangles",
      image: require("../assets/images/latest1.png"),
      oldPrice: "₹2,999",
      price: "₹1,802",
    },
    {
      id: "2",
      name: "Mint Pink AD Stone Bangles",
      image: require("../assets/images/latest2.png"),
      oldPrice: "₹2,999",
      price: "₹1,802",
    },
    {
      id: "3",
      name: "Gold AD Ethnic Bangles",
      image: require("../assets/images/latest3.png"),
      oldPrice: "₹2,499",
      price: "₹1,506",
    },
    {
      id: "4",
      name: "Silver AD Fancy Bangles",
      image: require("../assets/images/latest4.png"),
      oldPrice: "₹2,499",
      price: "₹1,802",
    },
  ];

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          {/* <Ionicons name="arrow-back" size={24} color="#000" /> */}
        </TouchableOpacity>

        
        <View style={{ width: 24 }} />
      </View>

      {/* Product Grid */}
      <View style={styles.grid}>
        {products.map((item) => (
          <View key={item.id} style={styles.card}>

            {/* Image */}
            <View style={styles.imageWrapper}>
              <Image source={item.image} style={styles.image} />

              {/* Discount Badge */}
              <View style={styles.discountBadge}>
                <Text style={styles.badgeText}>50%</Text>
              </View>

              {/* New Badge */}
              <View style={styles.newBadge}>
                <Text style={styles.badgeText}>New</Text>
              </View>
            </View>

            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#aaa" />
              <Ionicons name="star" size={12} color="#aaa" />
              <Ionicons name="star" size={12} color="#aaa" />
              <Ionicons name="star" size={12} color="#aaa" />
              <Ionicons name="star" size={12} color="#aaa" />

              <Text style={styles.ratingText}>0.0 (0)</Text>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.oldPrice}>{item.oldPrice}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>

            {/* Add to Cart */}
            <TouchableOpacity style={styles.cartButton}>
              <Text style={styles.cartText}>Add To Cart</Text>
            </TouchableOpacity>

          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    marginBottom: 55,
    elevation: 2,
  },

  imageWrapper: {
    position: "relative",
  },

  image: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
    borderRadius: 10,
  },

  discountBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#1F2A44",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  newBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#1F2A44",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  productName: {
    fontSize: 13,
    marginTop: 8,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  ratingText: {
    marginLeft: 6,
    fontSize: 11,
    color: "#777",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  oldPrice: {
    textDecorationLine: "line-through",
    color: "#777",
    marginRight: 6,
  },

  price: {
    color: "#F57C00",
    fontWeight: "700",
  },

  cartButton: {
    marginTop: 8,
    backgroundColor: "#F57C00",
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },

  cartText: {
    color: "#fff",
    fontWeight: "600",
  },
});
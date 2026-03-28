import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SellerGalleryScreen() {
  const router = useRouter();

  const sellerGallery = [
    {
      id: "1",
      name: "New Brand",
      image: require("../assets/images/suggest1.png"),
    },
    {
      id: "2",
      name: "Unlimited Stuff",
      image: require("../assets/images/suggest2.png"),
    },
    {
      id: "3",
      name: "Focusing Products",
      image: require("../assets/images/suggest3.png"),
    },
    {
      id: "4",
      name: "Brand",
      image: require("../assets/images/suggest4.png"),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      
      

      {/* Seller Grid */}
      <View style={styles.grid}>
        {sellerGallery.map((item) => (
          <View key={item.id} style={styles.card}>
            
            <View style={styles.imageArea}>
              <Image source={item.image} style={styles.image} />
            </View>

            <View style={styles.nameBar}>
              <Text style={styles.nameText}>{item.name}</Text>
            </View>

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
    paddingHorizontal: 16,
    paddingTop: 100,
  },

  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
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

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 45,
    backgroundColor: "#E6E3F3",
  },

  imageArea: {
    height: 190,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6E3F3",
  },

  image: {
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

  nameText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  arrowButton: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
});
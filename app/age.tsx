import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AgeScreen() {
  const ageGroups = [
    "0-18 YEARS",
    "19-24 YEARS",
    "25-40 YEARS",
    "40+ YEARS",
  ];

  // 🔥 Preload images
  useEffect(() => {
    const images = [
      require("../assets/images/age1.png"),
require("../assets/images/age2.png"),
require("../assets/images/age3.png"),
require("../assets/images/age4.png"),
require("../assets/images/age5.png"),
require("../assets/images/age6.png"),
    ];

    images.forEach((img) => {
      Image.prefetch(Image.resolveAssetSource(img).uri);
    });
  }, []);

  const goNext = () => {
    router.replace("/promote"); 
  };

  return (
    <View style={styles.container}>
      {/* Image Grid */}
      <View style={styles.imageGrid}>
        <Image
          style={[styles.imageLarge, { marginTop: 40 }]}
          source={require("../assets/images/age1.png")}
        />

      
        <Image
          style={[styles.imageSmall, { marginTop: 40 }]}
          source={require("../assets/images/age2.png")}
        />
        <Image
          style={[styles.imageLarge, { marginTop: 40 }]}
          source={require("../assets/images/age3.png")}
        />
        <Image
          style={[styles.imageLarge, { marginTop: 10 }]}
          source={require("../assets/images/age4.png")}
        />
        <Image
          style={[styles.imageSmall, { marginTop: 10 }]}
          source={require("../assets/images/age5.png")}
        />
        <Image
          style={[styles.imageLarge, { marginTop: 10 }]}
          source={require("../assets/images/age6.png")}
        />
      </View>

      {/* Age Buttons */}
      <View style={styles.buttonContainer}>
        {ageGroups.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={goNext}
          >
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

        <TouchableOpacity
  style={styles.backButton}
  onPress={() => router.push("/gender")} // change route if needed
>
  <Ionicons name="arrow-back" size={24} color="#000" />
</TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity style={styles.skipContainer} onPress={goNext}>
        <Text style={styles.skip}>SKIP &gt;</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 60,
    alignItems: "center",
  },

  /* Image Grid */
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 30,
  },

  imageLarge: {
    width: "30%",
    height: 110,
    borderRadius: 12,
    marginBottom: 15,
  },

  imageSmall: {
    width: "30%",
    height: 95,
    borderRadius: 12,
    marginBottom: 15,
    marginTop: 15,
  },

  /* Buttons */
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },

  button: {
    width: 280,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 30,
    marginVertical: 8,
    alignItems: "center",
    backgroundColor: "#e98b3e",
  },

  buttonText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#000",
  },

  /* Skip */
  skipContainer: {
    position: "absolute",
    left: 266,
    top: 672,
    width: 70,
    height: 59,
    justifyContent: "center",
    alignItems: "center",
  },

  skip: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },

   backButton: {
  position: "absolute",
  top: 60,
  left: 20,
  zIndex: 10,
  backgroundColor: "#fff",
  padding: 8,
  borderRadius: 20,
  elevation: 3, // Android shadow
},
});
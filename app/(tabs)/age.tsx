import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";

export default function AgeScreen() {
  const ageGroups = [
    "0-18 YEARS",
    "19-24 YEARS",
    "25-40 YEARS",
    "40+ YEARS",
  ];

  // 🔥 Preload images for faster rendering
  useEffect(() => {
    const images = [
      require("../../assets/images/age1.png"),
      require("../../assets/images/age2.png"),
      require("../../assets/images/age3.png"),
      require("../../assets/images/age4.png"),
      require("../../assets/images/age5.png"),
      require("../../assets/images/age6.png"),
    ];

    images.forEach((img) => {
      Image.prefetch(Image.resolveAssetSource(img).uri);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Image Grid */}
      <View style={styles.imageGrid}>
        {/* Row 1 */}
        <Image
          source={require("../../assets/images/age1.png")}
          style={styles.imageLarge}
          resizeMode="cover"
        />
        <Image
          source={require("../../assets/images/age2.png")}
          style={styles.imageSmall}
          resizeMode="cover"
        />
        <Image
          source={require("../../assets/images/age3.png")}
          style={styles.imageLarge}
          resizeMode="cover"
        />

        {/* Row 2 */}
        <Image
          source={require("../../assets/images/age4.png")}
          style={styles.imageLarge}
          resizeMode="cover"
        />
        <Image
          source={require("../../assets/images/age5.png")}
          style={styles.imageSmall}
          resizeMode="cover"
        />
        <Image
          source={require("../../assets/images/age6.png")}
          style={styles.imageLarge}
          resizeMode="cover"
        />
      </View>

      {/* Age Buttons */}
      <View style={styles.buttonContainer}>
        {ageGroups.map((item, index) => (
          <TouchableOpacity key={index} style={styles.button}>
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipContainer}
        onPress={() => router.push("/")}
      >
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
    height: 110, // slightly reduced for faster layout
    borderRadius: 12,
    marginBottom: 15,
  },

  imageSmall: {
    width: "30%",
    height: 95, // optimized
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
  },

  /* Skip */
  skipContainer: {
    position: "absolute",
    bottom: 30,
    right: 25,
  },

  skip: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
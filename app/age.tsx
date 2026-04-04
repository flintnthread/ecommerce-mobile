import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AgeScreen() {
  const insets = useSafeAreaInsets();
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
    router.replace("/login");
  };

  const goBack = () => {
    router.replace("/gender");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={goBack}
        style={styles.backBtnTop}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Select Age</Text>
        <Text style={styles.titleAlt}>
          
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Grid */}
        <View style={styles.imageGrid}>
          <Image
            style={[styles.imageLarge, { marginTop: 16 }]}
            source={require("../assets/images/age1.png")}
          />
          <Image
            style={[styles.imageSmall, { marginTop: 16 }]}
            source={require("../assets/images/age2.png")}
          />
          <Image
            style={[styles.imageLarge, { marginTop: 16 }]}
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
      </ScrollView>

      <View
        style={[
          styles.skipFooter,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <TouchableOpacity
          onPress={goNext}
          style={styles.skipTouch}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skip}>SKIP &gt;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 52,
    alignItems: "center",
  },

  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },

  header: {
    width: "100%",
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    letterSpacing: 0.3,
  },
  titleAlt: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    letterSpacing: 0.2,
    lineHeight: 22,
  },

  /** Upper-left back — same pattern as gender.tsx */
  backBtnTop: {
    position: "absolute",
    left: 10,
    top: 35,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    borderWidth: 1.5,
    borderColor: "#FFA500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
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

  skipFooter: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    backgroundColor: "#f2f2f2",
  },
  skipTouch: {
    minWidth: 72,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skip: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
});
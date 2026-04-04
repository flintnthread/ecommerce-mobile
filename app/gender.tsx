import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// 7 floating animations created outside component to avoid hook rule violation
const createAnimations = () =>
  Array.from({ length: 7 }, () => useRef(new Animated.Value(0)).current);

export default function GenderScreen() {
  const router = useRouter();

  // 7 floating animations
  const animations = createAnimations();

  useEffect(() => {
    animations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            delay: index * 80,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [animations]);

  const goAge = () => {
    router.replace("/age");
  };

  const goBack = () => {
    router.replace("/language");
  };

  const floatingStyle = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -15],
        }),
      },
    ],
  });

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
        <Text style={styles.title}>Select Gender</Text>
        <Text style={styles.titleAlt}>
        
        
        </Text>
      </View>

      {/* Floating Images */}
      <View style={styles.imageContainer}>
        {/* 1 */}
        <Animated.Image
          source={require("../assets/images/image1.png")}
          style={[
            styles.image,
            { left: 80, top: 50, width: 161, height: 106 },
            floatingStyle(animations[0]),
          ]}
        />

        {/* 2 */}
        <Animated.Image
          source={require("../assets/images/image2.png")}
          style={[
            styles.image,
            { left: 40, top: 170, width: 75, height: 134 },
            floatingStyle(animations[1]),
          ]}
        />

        {/* 3 */}
        <Animated.Image
          source={require("../assets/images/image3.png")}
          style={[
            styles.image,
            { left: 40, top: 320, width: 75, height: 69 },
            floatingStyle(animations[2]),
          ]}
        />

        {/* 4 */}
        <Animated.Image
          source={require("../assets/images/image4.png")}
          style={[
            styles.image,
            { left: 130, top: 175, width: 111, height: 83 },
            floatingStyle(animations[3]),
          ]}
        />

        {/* 5 */}
        <Animated.Image
          source={require("../assets/images/image5.png")}
          style={[
            styles.image,
            { left: 130, top: 275, width: 111, height: 157 },
            floatingStyle(animations[4]),
          ]}
        />

        {/* 6 */}
        <Animated.Image
          source={require("../assets/images/image6.png")}
          style={[
            styles.image,
            { left: 260, top: 120, width: 80, height: 130 },
            floatingStyle(animations[5]),
          ]}
        />

        {/* 7 - Add your image path later */}
        <Animated.Image
          source={require("../assets/images/image7.png")}
          style={[
            styles.image,
            { left: 260, top: 260, width: 80, height: 142 },
            floatingStyle(animations[6]),
          ]}
        />
      </View>

      {/* Gender Buttons */}
      {/* Female Button */}
<TouchableOpacity
  style={[styles.button, styles.femaleButton]}
  onPress={goAge}
>
  <Text style={styles.bigIcon}>👩</Text>
  <Text style={styles.btnText}>FEMALE</Text>
</TouchableOpacity>

{/* Male Button */}
<TouchableOpacity
  style={[styles.button, styles.maleButton]}
  onPress={goAge}
>
  <Text style={styles.bigIcon}>👨</Text>
  <Text style={styles.btnText}>MALE</Text>
</TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity style={styles.skipRow} onPress={goAge}>
        <Text style={styles.skip}>SKIP &gt;</Text>
      </TouchableOpacity>
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

  /** Upper-left back — just below top inset (paddingTop + small offset) */
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

  imageContainer: {
    width: "100%",
    flex: 1,
    position: "relative",
  },

  image: {
    position: "absolute",
    borderRadius: 10,
  },

  femaleButton: {
    position: "absolute",
    left: 14,
    top: 612,
  },

  maleButton: {
    position: "absolute",
    left: 170,
    top: 612,
  },

  button: {
    width: 150,
    paddingVertical: 14,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFA500",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  bigIcon: {
    fontSize: 30,
  },

  btnText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#000",
  },

  skipRow: {
    position: "absolute",
    left: 266,
    top: 728,
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
});
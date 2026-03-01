import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, Image } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const SplashScreen = () => {
  // 🔹 Background Logo Animation
  const bgScale = useRef(new Animated.Value(0.3)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;

  // 🔹 Full Logo Animation
  const logoTranslateX = useRef(new Animated.Value(-200)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: Background logo animation
    Animated.parallel([
      Animated.timing(bgScale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 0.08,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Full logo slide animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoTranslateX, {
            toValue: -80,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(logoTranslateX, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* 🔹 Background Large Logo */}
      <Animated.Image
        source={require("../assets/images/f&tlogo.jpg.jpeg")}
        resizeMode="contain"
        style={[
          styles.backgroundLogo,
          {
            opacity: bgOpacity,
            transform: [{ scale: bgScale }],
          },
        ]}
      />

      {/* 🔹 Full Logo (Top Layer) */}
      <Animated.Image
        source={require("../assets/images/f&tlogoFull.png")}
        resizeMode="contain"
        style={[
          styles.fullLogo,
          {
            opacity: logoOpacity,
            transform: [{ translateX: logoTranslateX }],
          },
        ]}
      />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundLogo: {
    position: "absolute",
    width: 373,
    height: 373,
    top: 228,
  },
  fullLogo: {
    position: "absolute",
    width: 298,
    height: 113,
    top: 334,
    left: (screenWidth - 298) / 2,
  },
});

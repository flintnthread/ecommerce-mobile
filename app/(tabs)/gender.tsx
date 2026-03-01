import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

export default function GenderScreen() {
  const animations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    animations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,      // ✅ reduced from 800
            delay: index * 10,  // ✅ reduced from 120
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,      // ✅ reduced from 800
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const goAge = () => {
    router.push("/age");
  };

  const move = (anim: any) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12], // slightly reduced for smoother feel
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Animated.Image
          source={require("../../assets/images/image1.png")}
          style={[styles.image, { top: 20, left: 80 }, move(animations[0])]}
        />

        <Animated.Image
          source={require("../../assets/images/image2.png")}
          style={[styles.image, { top: 20, right: 80 }, move(animations[1])]}
        />

        <Animated.Image
          source={require("../../assets/images/image3.png")}
          style={[styles.image, { top: 140, left: 20 }, move(animations[2])]}
        />

        <Animated.Image
          source={require("../../assets/images/image4.png")}
          style={[styles.image, { top: 140, right: 20 }, move(animations[3])]}
        />

        <Animated.Image
          source={require("../../assets/images/image5.png")}
          style={[styles.image, { top: 280, left: 90 }, move(animations[4])]}
        />

        <Animated.Image
          source={require("../../assets/images/image6.png")}
          style={[styles.image, { top: 280, right: 90 }, move(animations[5])]}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={goAge}>
          <Text style={styles.bigIcon}>👩</Text>
          <Text style={styles.btnText}>FEMALE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={goAge}>
          <Text style={styles.bigIcon}>👨</Text>
          <Text style={styles.btnText}>MALE</Text>
        </TouchableOpacity>
      </View>

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
    paddingTop: 60,
    alignItems: "center",
  },

  imageContainer: {
    width: "100%",
    height: 420,
    position: "relative",
  },

  image: {
    width: 85,     // slightly optimized for faster render
    height: 105,
    borderRadius: 10,
    position: "absolute",
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  button: {
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 10,
    borderRadius: 12,
    width: 150,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
  },

  bigIcon: {
    fontSize: 32,
  },

  btnText: {
    fontWeight: "600",
    fontSize: 16,
  },

  skipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  skip: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
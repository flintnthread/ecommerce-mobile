import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function PromoteScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    require("../assets/images/promote1.png"),
    require("../assets/images/promote2.png"),
    require("../assets/images/promote3.png"),
    require("../assets/images/promote4.png"),
    require("../assets/images/promote5.png"),
    require("../assets/images/image8.png"),
  ];

  // 🔥 AUTO SCROLL
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;

      if (nextIndex >= images.length) {
        nextIndex = 0; // loop back
      }

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / width
    );
    setCurrentIndex(index);
  };

  const goLogin = () => {
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.subtitle}>Today top deals</Text>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={goLogin}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      {/* Slider */}
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image source={item} style={styles.image} resizeMode="contain" />
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={
              index === currentIndex
                ? styles.dotActive
                : styles.dot
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaeaea",
    alignItems: "center",
    paddingTop: 80,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#f58220",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 30,
  },

  buttonText: {
    color: "#002B5B",
    fontSize: 18,
    fontWeight: "bold",
  },

  imageContainer: {
    width: width,
    alignItems: "center",
    marginTop: 40,
  },

  image: {
    width: width * 1,   
    height: 370,          
  },

  dotsContainer: {
    flexDirection: "row",
    marginTop: 70,
  },

  dot: {
    width: 8,
    height: 10,
    borderRadius: 4,
    backgroundColor: "#000",
    marginHorizontal: 4,
    opacity: 0.3,
  },

  dotActive: {
    width: 8,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#000",
    marginHorizontal: 4,
  },
});
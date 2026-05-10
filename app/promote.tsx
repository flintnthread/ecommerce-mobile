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
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height: SCREEN_H } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isMobile = width < 768;

export default function PromoteScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const images = [
    require("../assets/images/promot1.png"),
    require("../assets/images/promot2.png"),
    require("../assets/images/promot3.png"),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;

      if (nextIndex >= images.length) {
        nextIndex = 0;
      }

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, images.length]);

  const onScroll = (event: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goToLanguage = () => {
    router.replace("/language");
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        style={styles.list}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(_, index) => index.toString()}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item}
              style={styles.fullImage}
              resizeMode="cover"
            />
          </View>
        )}
      />

      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 20,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topContent}>
          <Text style={styles.title}>Hot Deals</Text>
          <Text style={styles.subtitle}>Explore Best Offers</Text>
          
          <TouchableOpacity style={styles.button} onPress={goToLanguage}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={
                index === currentIndex ? styles.dotActive : styles.dot
              }
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  list: {
    flex: 1,
  },

  slide: {
    width: width,
    height: SCREEN_H,
  },

  fullImage: {
    width: width,
    height: SCREEN_H,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: isDesktop ? 48 : isTablet ? 32 : 24,
  },

  topContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: isDesktop ? 400 : isTablet ? 350 : 330,
  },

  title: {
    fontSize: isDesktop ? 48 : isTablet ? 40 : 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  subtitle: {
    fontSize: isDesktop ? 36 : isTablet ? 32 : 28,
    fontWeight: "bold",
    marginTop: 5,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subtitleAlt: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  button: {
    backgroundColor: "#f0d55f",
    paddingVertical: isDesktop ? 18 : isTablet ? 16 : 14,
    paddingHorizontal: isDesktop ? 60 : isTablet ? 50 : 40,
    borderRadius: 10,
    marginTop: isDesktop ? 40 : 30,
    minWidth: isDesktop ? 200 : 150,
  },

  buttonText: {
    color: "#002B5B",
    fontSize: isDesktop ? 22 : isTablet ? 20 : 18,
    fontWeight: "bold",
  },

  dotsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: isDesktop ? 48 : isTablet ? 32 : 24,
  },

  dot: {
    width: isDesktop ? 10 : 8,
    height: isDesktop ? 12 : 10,
    borderRadius: isDesktop ? 5 : 4,
    backgroundColor: "#fff",
    marginHorizontal: isDesktop ? 6 : 4,
    opacity: 0.45,
  },

  dotActive: {
    width: isDesktop ? 10 : 8,
    height: isDesktop ? 24 : 20,
    borderRadius: isDesktop ? 5 : 4,
    backgroundColor: "#fff",
    marginHorizontal: isDesktop ? 6 : 4,
  },
});

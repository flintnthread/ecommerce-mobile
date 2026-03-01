import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { router } from "expo-router";

const languages = [
  { name: "Telugu", image: require("../../assets/images/telugu.png") },
  { name: "Hindi", image: require("../../assets/images/hindi.png") },
  { name: "English", image: require("../../assets/images/english.png") },
  { name: "Tamil", image: require("../../assets/images/tamil.png") },
  { name: "Malayalam", image: require("../../assets/images/malayalam.png") },
  { name: "Kannada", image: require("../../assets/images/kannada.png") },
  { name: "Marathi", image: require("../../assets/images/marathi.png") },
  { name: "Bengali", image: require("../../assets/images/bengali.png") },
];

export default function LanguageScreen() {
  const scales = useRef(
    languages.map(() => new Animated.Value(1))
  ).current;

  const handleSelect = (index: number) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scales[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/gender");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Language</Text>

      <View style={styles.grid}>
        {languages.map((item, index) => {
          const isLarge =
            item.name === "English" ||
            item.name === "Malayalam" ||
            item.name === "Kannada" ||
            item.name === "Bengali";

          return (
            <TouchableOpacity
              key={index}
              style={styles.cardWrapper}
              onPress={() => handleSelect(index)}
            >
              <Animated.View
                style={[
                  styles.card,
                  { transform: [{ scale: scales[index] }] },
                ]}
              >
                <Image
                  source={item.image}
                  style={[
                    styles.image,
                    isLarge && styles.largeImage, // ✅ size increase here
                  ]}
                />
                <Text style={styles.text}>{item.name}</Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
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

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "70%",
  },

  cardWrapper: {
    width: "48%",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#FFA500",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: 50,
    height: 45,
    resizeMode: "contain",
    marginBottom: 8,
  },

  largeImage: {
    width: 90,
    height: 60,
  },

  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NotificationPermission from "./notification";
import LocationPermission from "./loc";

const languages = [
  { name: "Telugu", image: require("../assets/images/telugu.png") },
  { name: "Hindi", image: require("../assets/images/hindi.png") },
  { name: "English", image: require("../assets/images/english.png") },
  { name: "Tamil", image: require("../assets/images/tamil.png") },
  { name: "Malayalam", image: require("../assets/images/malayalam.png") },
  { name: "Kannada", image: require("../assets/images/kannada.png") },
  { name: "Marathi", image: require("../assets/images/marathi.png") },
  { name: "Bengali", image: require("../assets/images/bengali.png") },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const scales = useRef(
    languages.map(() => new Animated.Value(1))
  ).current;

  const handleSelect = (index: number) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scales[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNotification(true);
    });
  };

  const handleNotificationAllow = () => {
    setShowNotification(false);
    setShowLocation(true);
  };

  const handleNotificationDeny = () => {
    setShowNotification(false);
    setShowLocation(true);
  };

  const handleLocationWhileUsing = () => {
    setShowLocation(false);
    router.replace("/genderage");
  };

  const handleLocationOnlyThisTime = () => {
    setShowLocation(false);
    router.replace("/genderage");
  };

  const handleLocationDontAllow = () => {
    setShowLocation(false);
    router.replace("/genderage");
  };

  const handleBack = () => {
    if (showLocation) {
      setShowLocation(false);
      setShowNotification(true);
      return;
    }
    if (showNotification) {
      setShowNotification(false);
      return;
    }
    router.replace("/promote");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backBtnTop}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Select Language</Text>
        <Text style={styles.titleAlt}>Choose your preferred language</Text>
      </View>

      <View style={styles.grid}>
        {languages.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => handleSelect(index)}
          >
            <Animated.View
              style={[
                styles.card,
                { transform: [{ scale: scales[index] }] },
              ]}
            >
              <View style={styles.imageFrame}>
                <Image source={item.image} style={styles.image} />
              </View>
              <Text style={styles.text}>{item.name}</Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notification Permission Modal */}
      <NotificationPermission
        visible={showNotification}
        onAllow={handleNotificationAllow}
        onDeny={handleNotificationDeny}
      />

      {/* Location Permission Modal */}
      <LocationPermission
        visible={showLocation}
        onWhileUsing={handleLocationWhileUsing}
        onOnlyThisTime={handleLocationOnlyThisTime}
        onDontAllow={handleLocationDontAllow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingTop: 52,
  },

  backBtnTop: {
    position: "absolute",
    left: 10,
    top: 22,
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

  header: {
    paddingTop: 66,
    paddingHorizontal: 20,
    paddingBottom: 10,
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
  },

  grid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    paddingHorizontal: 6,
  },

  // Card Style
  card: {
    width: 154,
    height: 118,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FFA500",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    // Shadow (Android)
    elevation: 5,
  },

  imageFrame: {
    width: 52,
    height: 52,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },

  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
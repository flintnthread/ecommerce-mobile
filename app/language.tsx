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
    router.replace("/gender");
  };

  const handleLocationOnlyThisTime = () => {
    setShowLocation(false);
    router.replace("/gender");
  };

  const handleLocationDontAllow = () => {
    setShowLocation(false);
    router.replace("/gender");
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Select Language</Text>

      {/* Grid */}
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
              <Image source={item.image} style={styles.image} />
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
  },

  // Title (Exact Position)
  title: {
    position: "absolute",
    left: 48,      // x-48
    top: 79,       // y-79
    width: 246,
    height: 45,
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 32 * 1.4, // 140%
    color: "#000",
  },

  // Grid Layout
  grid: {
    marginTop: 160,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
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
    marginBottom: 25,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    // Shadow (Android)
    elevation: 5,
  },

  image: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 8,
  },

  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
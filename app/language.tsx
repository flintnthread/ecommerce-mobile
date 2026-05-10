import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  type ImageSourcePropType,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NotificationPermission from "./notification";
import LocationPermission from "./loc";
import { type SupportedLanguage, useLanguage } from "../lib/language";

const { width } = Dimensions.get("window");

// Responsive breakpoints
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isMobile = width < 768;

const languages = [
  { name: "Telugu", image: require("../assets/images/telugu.png") },
  { name: "Hindi", image: require("../assets/images/hindi.png") },
  { name: "English", image: require("../assets/images/english.png") },
  { name: "Tamil", image: require("../assets/images/tamil.png") },
  { name: "Malayalam", image: require("../assets/images/malayalam.png") },
  { name: "Kannada", image: require("../assets/images/kannada.png") },
  { name: "Marathi", image: require("../assets/images/marathi.png") },
  { name: "Bengali", image: require("../assets/images/bengali.png") },
] as { name: SupportedLanguage; image: ImageSourcePropType }[];

export default function LanguageScreen() {
  const router = useRouter();
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [showNotification, setShowNotification] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const handleSelect = (index: number) => {
    const nextLanguage = languages[index]?.name;
    if (!nextLanguage) return;

    // Move flow forward on first tap; do not wait for animation completion.
    void setSelectedLanguage(nextLanguage);
    setShowNotification(true);
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
            activeOpacity={1}
            onPress={() => handleSelect(index)}
          >
            <View style={styles.card}>
              <View style={styles.imageFrame}>
                <Image source={item.image} style={styles.image} />
              </View>
              <Text style={styles.text}>{item.name}</Text>
              {selectedLanguage === item.name ? <View style={styles.selectedDot} /> : null}
            </View>
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
    left: isDesktop ? 20 : 10,
    top: 60,
    width: isDesktop ? 56 : 48,
    height: isDesktop ? 56 : 48,
    borderRadius: isDesktop ? 28 : 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  header: {
    paddingTop: isDesktop ? 80 : 66,
    paddingHorizontal: isDesktop ? 40 : 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: isDesktop ? 36 : isTablet ? 32 : 28,
    fontWeight: "800",
    color: "#111",
    letterSpacing: 0.3,
  },
  titleAlt: {
    marginTop: 6,
    fontSize: isDesktop ? 18 : isTablet ? 16 : 15,
    fontWeight: "500",
    color: "#666",
    letterSpacing: 0.2,
  },

  grid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: isDesktop ? "flex-start" : "space-evenly",
    paddingHorizontal: isDesktop ? 40 : 6,
  },

  // Card Style
  card: {
    width: isDesktop ? 180 : isTablet ? 170 : 154,
    height: isDesktop ? 140 : isTablet ? 130 : 118,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isDesktop ? 24 : 18,
    marginHorizontal: isDesktop ? 12 : 0,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    // Shadow (Android)
    elevation: 5,
  },

  imageFrame: {
    width: isDesktop ? 80 : 64,
    height: isDesktop ? 80 : 64,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: isDesktop ? 80 : 64,
    height: isDesktop ? 80 : 64,
    resizeMode: "contain",
  },

  text: {
    fontSize: isDesktop ? 18 : isTablet ? 17 : 16,
    fontWeight: "600",
    color: "#000",
  },
  selectedDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
});
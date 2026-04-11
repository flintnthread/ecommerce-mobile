import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const placeholderTexts = [" Shoes", " Womens Wear", " Fashion", " Sportswear"];

const sellerGallery = [
  {
    id: "1",
    name: "New Brand",
    image: require("../assets/images/suggest1.png"),
  },
  {
    id: "2",
    name: "Unlimited Stuff",
    image: require("../assets/images/suggest2.png"),
  },
  {
    id: "3",
    name: "Focusing Products",
    image: require("../assets/images/suggest3.png"),
  },
  {
    id: "4",
    name: "Brand",
    image: require("../assets/images/suggest4.png"),
  },
];

export default function SellerGalleryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) =>
        prev === placeholderTexts.length - 1 ? 0 : prev + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const launchGoogleVoiceInput = async () => {
    if (Platform.OS !== "android") {
      Alert.alert(
        "Voice search",
        "Google voice input is available on Android. On iPhone, type your search in the bar."
      );
      return;
    }
    try {
      const result = await IntentLauncher.startActivityAsync(
        "android.speech.action.RECOGNIZE_SPEECH",
        {
          extra: {
            "android.speech.extra.LANGUAGE_MODEL": "free_form",
            "android.speech.extra.PROMPT": "What do you want to search for?",
            "android.speech.extra.LANGUAGE": "en-US",
          },
        }
      );
      if (
        result.resultCode === IntentLauncher.ResultCode.Success &&
        result.extra
      ) {
        const e = result.extra as Record<string, unknown>;
        const raw = e["android.speech.extra.RESULTS"] ?? e.results;
        if (Array.isArray(raw) && raw.length > 0) {
          setSearchQuery(String(raw[0]));
          return;
        }
      }
    } catch {
      Alert.alert(
        "Voice search",
        "Could not open speech recognition. Check Google / speech services on your device."
      );
    }
  };

  const startVoiceSearch = () => {
    Alert.alert(
      "Microphone access",
      "Allow microphone access to use voice search?",
      [
        { text: "Don't allow", style: "cancel" },
        { text: "Allow", onPress: () => void launchGoogleVoiceInput() },
      ]
    );
  };

  const launchSellerGalleryCamera = useCallback(async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== "granted") {
      Alert.alert("Permission required", "Camera permission is required.");
      return;
    }
    await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
  }, []);

  const openCamera = () => {
    Alert.alert("Camera access", "Allow camera access to take photos?", [
      { text: "Don't allow", style: "cancel" },
      {
        text: "Allow",
        onPress: () => {
          Alert.alert("Camera", "Camera option opened.", [
            { text: "OK", onPress: () => void launchSellerGalleryCamera() },
          ]);
        },
      },
    ]);
  };

  const filteredSellers = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    if (!s) return sellerGallery;
    return sellerGallery.filter((item) =>
      item.name.toLowerCase().includes(s)
    );
  }, [searchQuery]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 8) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRowOuter}>
          <View style={styles.logoMark}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={placeholderTexts[placeholderIndex]}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              onFocus={() => {
                router.push("/search");
              }}
            />
            <TouchableOpacity onPress={openCamera} style={styles.searchBarIconBtn}>
              <Ionicons name="camera-outline" size={22} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={startVoiceSearch}
              style={styles.searchBarIconBtn}
            >
              <Ionicons name="mic-outline" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          {filteredSellers.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.imageArea}>
                <Image source={item.image} style={styles.image} />
              </View>
              <View style={styles.nameBar}>
                <Text style={styles.nameText}>{item.name}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  searchRowOuter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  logoImg: {
    width: 34,
    height: 34,
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
  },
  searchBarIconBtn: {
    padding: 4,
    marginLeft: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 45,
    backgroundColor: "#E6E3F3",
  },

  imageArea: {
    height: 190,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6E3F3",
  },

  image: {
    width: "75%",
    height: "75%",
    resizeMode: "contain",
  },

  nameBar: {
    height: 55,
    backgroundColor: "#766DCC",
    justifyContent: "center",
    alignItems: "center",
  },

  nameText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

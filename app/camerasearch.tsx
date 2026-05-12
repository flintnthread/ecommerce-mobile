import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import api, { searchProductsByImage, type SearchUiResult } from "../services/api";

const PLACEHOLDER = require("../assets/images/product1.png");
const SEARCH_SESSION_KEY = "ft_recent_view_session_id";

function formatInrAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function CameraSearch() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchUiResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoLaunched, setAutoLaunched] = useState(false);

  const decodeUserIdFromToken = useCallback((token: string): number | undefined => {
    try {
      const part = token.split(".")[1] || "";
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
      const candidate = Number(payload.userId ?? payload.id ?? payload.uid ?? payload.sub);
      if (Number.isFinite(candidate) && candidate > 0) return Math.floor(candidate);
    } catch {
      // Ignore decode issues and rely on session id.
    }
    return undefined;
  }, []);

  const runImageSearch = useCallback(
    async (uri: string) => {
      setSearching(true);
      setError(null);
      setResults([]);
      try {
        const token = (await AsyncStorage.getItem("token"))?.trim() || "";
        const userId = token ? decodeUserIdFromToken(token) : undefined;
        const sessionId =
          (await AsyncStorage.getItem(SEARCH_SESSION_KEY))?.trim() || undefined;

        const rows = await searchProductsByImage(uri, { userId, sessionId });
        const products = rows.filter((x) => x.kind === "product");
        setResults(products);
        if (products.length === 0) {
          setError("No similar products found. Try another angle or lighting.");
        }
      } catch (err) {
        let message = "Could not run camera search. Please try again.";
        if (err instanceof Error && err.message.trim()) {
          message = err.message.trim();
        } else if (isAxiosError(err)) {
          const apiMessage = err.response?.data?.message;
          if (typeof apiMessage === "string" && apiMessage.trim()) {
            message = apiMessage.trim();
          }
        }
        setError(message);
      } finally {
        setSearching(false);
      }
    },
    [decodeUserIdFromToken]
  );

  const openDeviceCamera = useCallback(async () => {
    setOpening(true);
    try {
      const { status, canAskAgain } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera permission",
          canAskAgain
            ? "Allow camera access in Settings to take a photo for search."
            : "Camera access is turned off. Enable it in your device settings."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await runImageSearch(uri);
    } catch {
      Alert.alert("Camera", "Could not open the camera. Try again.");
    } finally {
      setOpening(false);
    }
  }, [runImageSearch]);

  const openDeviceGallery = useCallback(async () => {
    setOpening(true);
    try {
      const { status, canAskAgain } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Gallery permission",
          canAskAgain
            ? "Allow gallery access in Settings to pick a photo for search."
            : "Gallery access is turned off. Enable it in your device settings."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await runImageSearch(uri);
    } catch {
      Alert.alert("Gallery", "Could not open gallery. Try again.");
    } finally {
      setOpening(false);
    }
  }, [runImageSearch]);

  useEffect(() => {
    if (autoLaunched) return;
    if (source !== "camera" && source !== "gallery") return;
    setAutoLaunched(true);
    if (source === "gallery") {
      void openDeviceGallery();
    } else {
      void openDeviceCamera();
    }
  }, [autoLaunched, openDeviceCamera, openDeviceGallery, source]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Camera search</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.hint}>
          Take a photo of a product to search for similar items.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, opening && styles.primaryBtnDisabled]}
          onPress={() => void openDeviceCamera()}
          disabled={opening}
          accessibilityRole="button"
          accessibilityLabel="Open camera"
        >
          {opening ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.primaryBtnText}>Open camera</Text>
            </>
          )}
        </TouchableOpacity>

        {photoUri ? (
          <View style={styles.previewWrap}>
            <Text style={styles.previewLabel}>Last capture</Text>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            {searching ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#111" />
                <Text style={styles.loadingText}>Finding similar products...</Text>
              </View>
            ) : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => void openDeviceCamera()}
              disabled={opening || searching}
            >
              <Text style={styles.ghostBtnText}>Take another photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.secondaryActionBtn, (opening || searching) && styles.primaryBtnDisabled]}
          onPress={() => void openDeviceGallery()}
          disabled={opening || searching}
          accessibilityRole="button"
          accessibilityLabel="Open gallery"
        >
          <Ionicons name="images-outline" size={18} color="#111" />
          <Text style={styles.secondaryActionText}>Choose from gallery</Text>
        </TouchableOpacity>

        {!searching && results.length > 0 ? (
          <View style={styles.resultsWrap}>
            <Text style={styles.resultsTitle}>Matched products ({results.length})</Text>
            <View style={styles.grid}>
              {results.map((item) => {
                const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
                const imageUri =
                  item.imageUri && /^https?:\/\//i.test(item.imageUri)
                    ? item.imageUri
                    : item.imageUri
                      ? `${apiBase}/${item.imageUri.replace(/^\/+/, "")}`
                      : "";
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() =>
                      router.push({ pathname: "/productdetail", params: { id: item.id } })
                    }
                    activeOpacity={0.85}
                  >
                    <Image
                      source={imageUri ? ({ uri: imageUri } as const) : PLACEHOLDER}
                      style={styles.cardImage}
                    />
                    <Text style={styles.cardName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardPrice}>{formatInrAmount(item.sellingPrice)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111" },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  hint: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#111",
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewWrap: { marginTop: 28 },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  loadingWrap: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { fontSize: 13, color: "#333" },
  errorText: { marginTop: 10, fontSize: 13, color: "#b91c1c" },
  ghostBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  ghostBtnText: { fontSize: 15, color: "#333" },
  secondaryActionBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff",
  },
  secondaryActionText: { fontSize: 14, color: "#111", fontWeight: "600" },
  resultsWrap: { marginTop: 28 },
  resultsTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardImage: { width: "100%", height: 120, borderRadius: 10, backgroundColor: "#f3f4f6" },
  cardName: { marginTop: 8, fontSize: 13, color: "#111", fontWeight: "600" },
  cardPrice: { marginTop: 4, fontSize: 13, color: "#111", fontWeight: "700" },
});

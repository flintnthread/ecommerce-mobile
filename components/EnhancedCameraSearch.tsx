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
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import api, { searchProductsByImage, type SearchUiResult } from "../services/api";

const { width, height } = Dimensions.get("window");
const PLACEHOLDER = require("../assets/images/product1.png");
const SEARCH_SESSION_KEY = "ft_recent_view_session_id";

interface EnhancedCameraSearchProps {
  visible: boolean;
  onClose: () => void;
  source?: "camera" | "gallery";
}

function formatInrAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function EnhancedCameraSearch({ visible, onClose, source }: EnhancedCameraSearchProps) {
  const router = useRouter();
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

        console.log("🔍 Starting AI-powered camera search...");
        const rows = await searchProductsByImage(uri, { userId, sessionId });
        const products = rows.filter((x) => x.kind === "product");
        setResults(products);
        
        if (products.length === 0) {
          setError("No similar products found. Try another angle or lighting.");
        } else {
          console.log(`✅ Found ${products.length} similar products`);
        }
      } catch (err) {
        console.error("❌ Camera search failed:", err);
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
      Alert.alert("Camera", "Could not open camera. Try again.");
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
    if (autoLaunched || !visible) return;
    if (source !== "camera" && source !== "gallery") return;
    setAutoLaunched(true);
    if (source === "gallery") {
      void openDeviceGallery();
    } else {
      void openDeviceCamera();
    }
  }, [autoLaunched, openDeviceCamera, openDeviceGallery, source, visible]);

  const handleProductPress = useCallback((productId: string) => {
    router.push({ pathname: "/productdetail", params: { id: productId } });
    onClose();
  }, [router, onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.title}>AI Camera Search</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.aiBadgeText}>Powered by AI</Text>
          </View>

          <Text style={styles.hint}>
            Take a photo or choose from gallery to find visually similar products using AI technology.
          </Text>

          <View style={styles.buttonRow}>
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
                  <Text style={styles.primaryBtnText}>Take Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, (opening || searching) && styles.primaryBtnDisabled]}
              onPress={() => void openDeviceGallery()}
              disabled={opening || searching}
              accessibilityRole="button"
              accessibilityLabel="Open gallery"
            >
              <Ionicons name="images-outline" size={20} color="#111" />
              <Text style={styles.secondaryBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {photoUri ? (
            <View style={styles.previewWrap}>
              <Text style={styles.previewLabel}>Selected Image</Text>
              <Image source={{ uri: photoUri }} style={styles.preview} />
              {searching ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color="#111" />
                  <Text style={styles.loadingText}>AI is analyzing image...</Text>
                </View>
              ) : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => void openDeviceCamera()}
                disabled={opening || searching}
              >
                <Text style={styles.retryBtnText}>Try Another Photo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!searching && results.length > 0 ? (
            <View style={styles.resultsWrap}>
              <Text style={styles.resultsTitle}>
                Found {results.length} Similar Products
              </Text>
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
                      onPress={() => handleProductPress(item.id)}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={imageUri ? ({ uri: imageUri } as const) : PLACEHOLDER}
                        style={styles.cardImage}
                      />
                      <Text style={styles.cardName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.cardPrice}>{formatInrAmount(item.sellingPrice)}</Text>
                        {item.mrpPrice > item.sellingPrice && (
                          <Text style={styles.originalPrice}>{formatInrAmount(item.mrpPrice)}</Text>
                        )}
                      </View>
                      {item.discountPercentage > 0 && (
                        <Text style={styles.discountText}>
                          {Math.round(item.discountPercentage)}% OFF
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  hint: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginBottom: 32,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    flex: 1,
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
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 16,
    borderRadius: 14,
  },
  secondaryBtnText: { fontSize: 16, color: "#111", fontWeight: "600" },
  previewWrap: { marginTop: 28 },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  loadingWrap: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: { fontSize: 14, color: "#333" },
  errorText: { 
    marginTop: 12, 
    fontSize: 14, 
    color: "#dc2626", 
    textAlign: "center" 
  },
  retryBtn: { 
    marginTop: 16, 
    alignItems: "center", 
    paddingVertical: 12 
  },
  retryBtnText: { 
    fontSize: 15, 
    color: "#6366f1", 
    fontWeight: "600" 
  },
  resultsWrap: { marginTop: 32 },
  resultsTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#111", 
    marginBottom: 16 
  },
  grid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between" 
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: { 
    width: "100%", 
    height: 140, 
    borderRadius: 10, 
    backgroundColor: "#f3f4f6" 
  },
  cardName: { 
    marginTop: 8, 
    fontSize: 13, 
    color: "#111", 
    fontWeight: "600" 
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  cardPrice: { 
    fontSize: 14, 
    color: "#111", 
    fontWeight: "700" 
  },
  originalPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  discountText: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
    marginTop: 4,
  },
});

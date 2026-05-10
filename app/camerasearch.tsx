import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import api, { searchProductsByImage, searchProductByBarcode, type SearchUiResult } from "../services/api";

const { width, height } = Dimensions.get("window");
const PLACEHOLDER = require("../assets/images/product1.png");
const SEARCH_SESSION_KEY = "ft_recent_view_session_id";

type ScanMode = "visual" | "barcode";

function formatInrAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function CameraSearch() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<ScanMode>("visual");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchUiResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  // Camera permissions (v14 style)
  const [permission, requestPermission] = useCameraPermissions();
  useEffect(() => {
    // Auto-request permission if not determined yet
    if (permission?.status === 'undetermined') {
      requestPermission();
    } else if (permission?.status === 'granted') {
      setHasPermission(true);
    } else if (permission?.status === 'denied') {
      setHasPermission(false);
    }
  }, [permission, requestPermission]);

  const decodeUserIdFromToken = useCallback((token: string): number | undefined => {
    try {
      const part = token.split(".")[1] || "";
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
      const candidate = Number(payload.userId ?? payload.id ?? payload.uid ?? payload.sub);
      if (Number.isFinite(candidate) && candidate > 0) return Math.floor(candidate);
    } catch {
      return undefined;
    }
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) {
      Alert.alert("Error", "Camera ref not available.");
      return;
    }
    if (!isCameraReady) {
      Alert.alert("Error", "Camera not ready. Please wait a moment.");
      return;
    }
    try {
      console.log("Taking photo...");
      // v14 CameraView uses takePictureAsync() method
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });
      console.log("Photo result:", photo);
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        await runImageSearch(photo.uri);
      } else {
        Alert.alert("Error", "Photo capture failed. No URI returned.");
      }
    } catch (err) {
      console.error("Camera capture error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", "Could not capture photo: " + msg);
    }
  }, [cameraRef, isCameraReady]);

  const runImageSearch = useCallback(async (uri: string) => {
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const token = (await AsyncStorage.getItem("token"))?.trim() || "";
      const userId = token ? decodeUserIdFromToken(token) : undefined;
      const sessionId = (await AsyncStorage.getItem(SEARCH_SESSION_KEY))?.trim() || undefined;
      const rows = await searchProductsByImage(uri, { userId, sessionId });
      const products = rows.filter((x) => x.kind === "product");
      setResults(products);
      if (products.length === 0) {
        setError("No similar products found. Try a clearer photo or barcode scan.");
      }
    } catch (err) {
      let message = "Could not run camera search.";
      if (err instanceof Error) message = err.message;
      else if (isAxiosError(err)) message = err.response?.data?.message || message;
      setError(message);
    } finally {
      setSearching(false);
    }
  }, [decodeUserIdFromToken]);

  const runBarcodeSearch = useCallback(async (barcode: string) => {
    setSearching(true);
    setError(null);
    setResults([]);
    try {
      const token = (await AsyncStorage.getItem("token"))?.trim() || "";
      const userId = token ? decodeUserIdFromToken(token) : undefined;
      const sessionId = (await AsyncStorage.getItem(SEARCH_SESSION_KEY))?.trim() || undefined;
      const rows = await searchProductByBarcode(barcode, { userId, sessionId });
      const products = rows.filter((x) => x.kind === "product");
      setResults(products);
      if (products.length === 0) {
        setError("No product found for this barcode.");
      }
    } catch (err) {
      let message = "Could not search by barcode.";
      if (err instanceof Error) message = err.message;
      else if (isAxiosError(err)) message = err.response?.data?.message || message;
      setError(message);
    } finally {
      setSearching(false);
    }
  }, [decodeUserIdFromToken]);

  const handleBarcodeScanned = useCallback((result: any) => {
    const data = result?.data;
    if (data && typeof data === "string") {
      runBarcodeSearch(data);
    }
  }, [runBarcodeSearch]);

  const openGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        await runImageSearch(uri);
      }
    } catch {
      Alert.alert("Error", "Could not open gallery.");
    }
  }, [runImageSearch]);

  const resetScan = useCallback(() => {
    setPhotoUri(null);
    setResults([]);
    setError(null);
  }, []);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Camera permission denied.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera Search</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, scanMode === "visual" && styles.modeBtnActive]}
          onPress={() => { setScanMode("visual"); resetScan(); }}
        >
          <MaterialIcons name="camera-alt" size={18} color={scanMode === "visual" ? "#fff" : "#666"} />
          <Text style={[styles.modeText, scanMode === "visual" && styles.modeTextActive]}>Visual</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, scanMode === "barcode" && styles.modeBtnActive]}
          onPress={() => { setScanMode("barcode"); resetScan(); }}
        >
          <MaterialIcons name="qr-code-scanner" size={18} color={scanMode === "barcode" ? "#fff" : "#666"} />
          <Text style={[styles.modeText, scanMode === "barcode" && styles.modeTextActive]}>Barcode</Text>
        </TouchableOpacity>
      </View>

      {/* Camera View */}
      <View style={styles.cameraWrapper}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onCameraReady={() => setIsCameraReady(true)}
            barcodeScannerSettings={scanMode === "barcode" ? { barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] } : undefined}
            onBarcodeScanned={scanMode === "barcode" ? handleBarcodeScanned : undefined}
          >
            {scanMode === "barcode" && (
              <View style={styles.barcodeOverlay}>
                <Text style={styles.barcodeHint}>Align barcode within frame</Text>
              </View>
            )}
          </CameraView>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!photoUri && scanMode === "visual" && (
            <>
              <TouchableOpacity style={styles.controlBtn} onPress={openGallery}>
                <Ionicons name="images" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} disabled={!isCameraReady}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              <View style={styles.controlBtn} />
            </>
          )}
          {photoUri && (
            <TouchableOpacity style={styles.retakeBtn} onPress={resetScan}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent}>
        {searching && <ActivityIndicator size="large" color="#111" style={styles.loader} />}
        
        {error && !searching && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={resetScan}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!searching && results.length > 0 && (
          <>
            <Text style={styles.resultsTitle}>
              {results.length} product{results.length > 1 ? "s" : ""} found
            </Text>
            <View style={styles.productGrid}>
              {results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.productCard}
                  onPress={() => router.push({ pathname: "/productdetail", params: { productId: String(item.id) } } as any)}
                >
                  <View style={styles.productImageWrap}>
                  <Image
                    source={item.imageUri ? { uri: item.imageUri } : PLACEHOLDER}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.productOverlay}>
                    {item.discountPercentage > 0 ? (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>
                          {Math.round(item.discountPercentage)}% OFF
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.productRatingBadge}>
                      <Ionicons name="star" size={10} color="#FBBF24" />
                      <Text style={styles.productRatingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.productMeta}>
                    <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>{formatInrAmount(item.sellingPrice)}</Text>
                      {item.mrpPrice > 0 && item.mrpPrice !== item.sellingPrice ? (
                        <Text style={styles.productMrp}>{formatInrAmount(item.mrpPrice)}</Text>
                      ) : null}
                    </View>
                    {item.discountPercentage > 0 ? (
                      <Text style={styles.productDiscount}>{item.discountPercentage}% off</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  placeholder: { width: 36 },
  modeToggle: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
    backgroundColor: "#111",
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#222",
  },
  modeBtnActive: { backgroundColor: "#111" },
  modeText: { fontSize: 14, fontWeight: "500", color: "#999" },
  modeTextActive: { color: "#fff" },
  cameraWrapper: { flex: 1, position: "relative" },
  camera: { flex: 1 },
  preview: { flex: 1, backgroundColor: "#000" },
  barcodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  barcodeHint: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
  },
  controls: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  controlBtn: { padding: 12, borderRadius: 30, backgroundColor: "rgba(0,0,0,0.5)" },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff", borderWidth: 3, borderColor: "#111" },
  retakeBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retakeText: { color: "#111", fontWeight: "600", fontSize: 16 },
  results: { flex: 1, backgroundColor: "#fff" },
  resultsContent: { padding: 16, paddingBottom: 40 },
  loader: { marginVertical: 40 },
  errorBox: { alignItems: "center", paddingVertical: 40 },
  errorText: { marginTop: 12, fontSize: 14, color: "#666", textAlign: "center", paddingHorizontal: 20 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#111",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  resultsTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 12 },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  productImageWrap: {
    position: "relative",
    width: "100%",
    height: 170,
    backgroundColor: "#f5f5f5",
  },
  productOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  discountBadge: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  productRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.84)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  productRatingText: {
    fontSize: 11,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "700",
  },
  productImage: { width: "100%", height: "100%", backgroundColor: "#f5f5f5" },
  productMeta: { padding: 12 },
  productName: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 8, lineHeight: 18 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  ratingText: { fontSize: 12, color: "#4B5563" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  productPrice: { fontSize: 15, fontWeight: "700", color: "#111" },
  productMrp: { fontSize: 12, color: "#6B7280", textDecorationLine: "line-through" },
  productDiscount: { fontSize: 12, fontWeight: "700", color: "#10B981" },
  permissionText: { color: "#fff", fontSize: 16, textAlign: "center", marginTop: 200 },
});

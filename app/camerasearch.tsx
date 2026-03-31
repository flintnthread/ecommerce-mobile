import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function CameraSearch() {
  const router = useRouter();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

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
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      setPhotoUri(result.assets[0].uri);
    } catch {
      Alert.alert("Camera", "Could not open the camera. Try again.");
    } finally {
      setOpening(false);
    }
  }, []);

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

      <View style={styles.body}>
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
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push("/products")}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Continue to products</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => void openDeviceCamera()}
              disabled={opening}
            >
              <Text style={styles.ghostBtnText}>Take another photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
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
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
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
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#111" },
  ghostBtn: { marginTop: 12, alignItems: "center", paddingVertical: 8 },
  ghostBtnText: { fontSize: 15, color: "#333" },
});

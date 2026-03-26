import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CameraSearch() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const openCameraPicker = useCallback(async () => {
    setBusy(true);
    setPreviewUri(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Camera permission is needed to take photos."
        );
        setBusy(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        setBusy(false);
        return;
      }

      const uri = result.assets[0]?.uri;
      if (uri) {
        setPreviewUri(uri);
        console.log("Captured image:", uri);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Camera search</Text>
      </View>

      <Text style={styles.hint}>
        Take a photo to search for similar products.
      </Text>

      {busy ? (
        <ActivityIndicator size="large" color="#ff6600" style={styles.loader} />
      ) : null}

      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.preview} />
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.primaryBtnDisabled]}
        onPress={() => void openCameraPicker()}
        disabled={busy}
      >
        <Ionicons name="camera-outline" size={22} color="#fff" />
        <Text style={styles.primaryBtnText}>
          {previewUri ? "Take another photo" : "Open camera"}
        </Text>
      </TouchableOpacity>

      {previewUri ? (
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Done</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  hint: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
  },
  loader: {
    marginVertical: 24,
  },
  preview: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 320,
    borderRadius: 12,
    marginBottom: 24,
    alignSelf: "center",
    backgroundColor: "#f0f0f0",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ff6600",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    color: "#ff6600",
    fontWeight: "600",
  },
});

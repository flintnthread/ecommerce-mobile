import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  getRatePurchaseCard,
  RATE_PURCHASE_CARDS,
  RATE_STAR_LABELS,
} from "../lib/ratePurchaseCatalog";

type MediaItem = { uri: string; type: "image" | "video" };

const LOVE_QUESTIONS = ["Material Quality", "Waist Fitting", "Size", "Design"] as const;
type LoveQuestionKey = (typeof LOVE_QUESTIONS)[number];

export default function RatePurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const card = useMemo(() => {
    return getRatePurchaseCard(params.id) ?? RATE_PURCHASE_CARDS[0];
  }, [params.id]);

  const [rating, setRating] = useState<number>(0);
  const [loveRatings, setLoveRatings] = useState<Record<LoveQuestionKey, number>>({
    "Material Quality": 0,
    "Waist Fitting": 0,
    Size: 0,
    Design: 0,
  });
  const [comment, setComment] = useState("");
  const [media, setMedia] = useState<MediaItem | null>(null);

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow Photos access to attach media.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setMedia({ uri: asset.uri, type: asset.type === "video" ? "video" : "image" });
  };

  const capturePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow Camera access to take a photo.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setMedia({ uri: asset.uri, type: "image" });
  };

  const captureVideo = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow Camera access to record a video.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 30,
      quality: Platform.OS === "android" ? 0.8 : 1,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    setMedia({ uri: asset.uri, type: "video" });
  };

  const handleAddMedia = () => {
    Alert.alert("Add photo/video", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      { text: "Camera photo", onPress: () => void capturePhoto() },
      { text: "Camera video", onPress: () => void captureVideo() },
      { text: "Choose from gallery", onPress: () => void pickFromLibrary() },
    ]);
  };

  const submit = () => {
    if (rating === 0) {
      Alert.alert("Rate this purchase", "Please select a star rating first.");
      return;
    }
    // No backend wired in this repo yet — keep UX complete.
    Alert.alert("Thanks!", "Your feedback was saved.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const setLove = (key: LoveQuestionKey, value: number) => {
    setLoveRatings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Share your experience</Text>
        <View style={styles.topPill}>
          <Text style={styles.topPillText}>Only takes 2 min</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productRow}>
          <Image source={card.image} style={styles.productImage} resizeMode="contain" />
          <View style={styles.productMeta}>
            <Text style={styles.productBrand} numberOfLines={1}>
              {card.brand}
            </Text>
            <Text style={styles.productTitle} numberOfLines={2}>
              {card.title}
            </Text>
            <Text style={styles.productDelivered} numberOfLines={1}>
              {card.deliveredOn}
            </Text>
          </View>
        </View>

        <View style={styles.starsBlock}>
          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const value = idx + 1;
              const active = value <= rating;
              return (
                <TouchableOpacity
                  key={`star-${value}`}
                  onPress={() => setRating(value)}
                  activeOpacity={0.7}
                  style={styles.starHit}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${value} stars`}
                >
                  <Ionicons
                    name={active ? "star" : "star-outline"}
                    size={34}
                    color={active ? "#F59E0B" : "#CBD5E1"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.starLabel}>
            {rating ? RATE_STAR_LABELS[rating - 1] : "Tap to rate"}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Add photo/video</Text>
        <TouchableOpacity style={styles.mediaCard} onPress={handleAddMedia} activeOpacity={0.85}>
          <View style={styles.mediaCopy}>
            <Text style={styles.mediaTitle}>The top 5% of our best reviewers</Text>
            <Text style={styles.mediaSub}>usually add a photo/video</Text>
            {media ? (
              <Text style={styles.mediaPicked} numberOfLines={1}>
                Selected: {media.type === "video" ? "Video" : "Photo"}
              </Text>
            ) : null}
          </View>
          <View style={styles.mediaIconBtn}>
            <Ionicons name="camera-outline" size={22} color="#1D4ED8" />
            <View style={styles.mediaPlus}>
              <Ionicons name="add" size={12} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {media?.type === "image" ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: media.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.previewRemove}
              onPress={() => setMedia(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove media"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : media?.type === "video" ? (
          <View style={styles.previewWrap}>
            <View style={styles.previewVideo}>
              <Ionicons name="videocam" size={22} color="#fff" />
              <Text style={styles.previewVideoText} numberOfLines={1}>
                Video selected
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewRemove}
              onPress={() => setMedia(null)}
              accessibilityRole="button"
              accessibilityLabel="Remove media"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>What did you love about it?</Text>
        <View style={styles.loveList}>
          {LOVE_QUESTIONS.map((q) => (
            <View key={q} style={styles.loveRow}>
              <Text style={styles.loveLabel}>{q}</Text>
              <View style={styles.loveStars}>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const value = idx + 1;
                  const active = value <= loveRatings[q];
                  return (
                    <TouchableOpacity
                      key={`${q}-s-${value}`}
                      onPress={() => setLove(q, value)}
                      style={styles.loveStarHit}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${q} ${value} stars`}
                    >
                      <Ionicons
                        name={active ? "star" : "star-outline"}
                        size={20}
                        color={active ? "#94A3B8" : "#CBD5E1"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tell us more</Text>
        <View style={styles.textAreaWrap}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share details of what you loved about this product"
            placeholderTextColor="#94A3B8"
            multiline
            style={styles.textArea}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.submitBar}>
        <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.85}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  topBar: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: "#111" },
  topPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  topPillText: { fontSize: 12, fontWeight: "700", color: "#334155" },

  productRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  productImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#F8FAFC" },
  productMeta: { flex: 1, minWidth: 0 },
  productBrand: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  productTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A", opacity: 0.9, marginTop: 2 },
  productDelivered: { marginTop: 4, fontSize: 12, fontWeight: "600", color: "#64748B" },

  starsBlock: { paddingVertical: 16, alignItems: "center" },
  starRow: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  starHit: { padding: 4 },
  starLabel: { marginTop: 10, fontSize: 13, fontWeight: "800", color: "#334155" },

  sectionTitle: { marginTop: 14, marginBottom: 10, fontSize: 16, fontWeight: "900", color: "#0F172A" },

  mediaCard: {
    backgroundColor: "#F1F5FF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  mediaCopy: { flex: 1, minWidth: 0 },
  mediaTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  mediaSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#475569" },
  mediaPicked: { marginTop: 8, fontSize: 12, fontWeight: "800", color: "#1D4ED8" },
  mediaIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPlus: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  previewWrap: { marginTop: 12, borderRadius: 14, overflow: "hidden" },
  previewImage: { width: "100%", height: 180, backgroundColor: "#0F172A" },
  previewVideo: {
    width: "100%",
    height: 120,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  previewVideoText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  previewRemove: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  loveList: { backgroundColor: "#fff" },
  loveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  loveLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0F172A" },
  loveStars: { flexDirection: "row", gap: 6, alignItems: "center" },
  loveStarHit: { padding: 2 },

  textAreaWrap: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 120, fontSize: 14, color: "#0F172A", fontWeight: "600" },

  submitBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.2 },
});


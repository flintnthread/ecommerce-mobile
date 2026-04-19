import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  getRatePurchaseCard,
  RATE_STAR_LABELS,
} from "../lib/ratePurchaseCatalog";

function parseInitialRating(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 3;
  const r = Math.round(n);
  if (r < 1) return 1;
  if (r > 5) return 5;
  return r;
}

export default function ShareExperienceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    productId?: string;
    rating?: string;
  }>();

  const product = useMemo(
    () => getRatePurchaseCard(params.productId),
    [params.productId]
  );

  const initialRating = useMemo(
    () => parseInitialRating(params.rating),
    [params.rating]
  );

  const [rating, setRating] = useState(initialRating);
  const [detailText, setDetailText] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  const pickMedia = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to attach a photo."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setMediaUri(result.assets[0].uri);
    }
  }, []);

  const onSubmit = useCallback(() => {
    Alert.alert(
      "Thank you",
      "Your review helps other shoppers. We appreciate you taking the time.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }, [router]);

  if (!product) {
    return (
      <View
        style={[
          styles.missingWrap,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Text style={styles.missingTitle}>We couldn&apos;t load this item</Text>
        <TouchableOpacity
          style={styles.missingBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.missingBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share your experience</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Only takes 2 min.</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.productRow}>
            <Image
              source={product.image}
              style={styles.productThumb}
              resizeMode="cover"
            />
            <View style={styles.productMeta}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {product.brand} {product.title}
              </Text>
              <Text style={styles.productDelivered}>{product.deliveredOn}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Your rating</Text>
          <View style={styles.starsBlock}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starColumn}
                onPress={() => setRating(star)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${RATE_STAR_LABELS[star - 1]}, ${star} star${star > 1 ? "s" : ""}`}
              >
                <View style={styles.starIconWrap}>
                  <Ionicons
                    name={rating >= star ? "star" : "star-outline"}
                    size={32}
                    color={rating >= star ? "#EAB308" : "#94A3B8"}
                  />
                  {star === 3 && rating >= 3 ? (
                    <Text style={styles.starEmoji} accessibilityElementsHidden>
                      🙂
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.starLabel}>{RATE_STAR_LABELS[star - 1]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Add photo/video</Text>
          <View style={styles.mediaRow}>
            <View style={styles.mediaHintBox}>
              <Text style={styles.mediaHintText}>
                The top 5% of our best reviewers usually add a photo/video.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.mediaBtn}
              onPress={pickMedia}
              accessibilityRole="button"
              accessibilityLabel="Add photo or video"
            >
              {mediaUri ? (
                <Image
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreview}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="camera-outline" size={32} color="#2563EB" />
              )}
              {!mediaUri ? (
                <View style={styles.mediaPlus}>
                  <Ionicons name="add" size={14} color="#2563EB" />
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Tell us more</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share more details to help other customers"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            value={detailText}
            onChangeText={setDetailText}
            maxLength={2000}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              paddingHorizontal: 16,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={onSubmit}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Submit review"
          >
            <Text style={styles.submitBtnText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  headerBadge: {
    maxWidth: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  productRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 22,
    alignItems: "flex-start",
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  productMeta: {
    flex: 1,
    minWidth: 0,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  productDelivered: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },
  starsBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  starColumn: {
    alignItems: "center",
    flex: 1,
    maxWidth: 68,
  },
  starIconWrap: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  starEmoji: {
    position: "absolute",
    fontSize: 14,
    bottom: 2,
  },
  starLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 22,
  },
  mediaHintBox: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
  },
  mediaHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
    lineHeight: 17,
  },
  mediaBtn: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaPlus: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 16,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  missingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  missingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  missingBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  missingBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

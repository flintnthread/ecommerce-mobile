import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../lib/language";
import {
  fetchPushNotifications,
  getCurrentUserIdFromToken,
  markPushNotificationAsRead,
  type PushNotificationItem,
} from "../services/pushNotifications";

export default function Notifications() {
  const router = useRouter();
  const { tr } = useLanguage();
  const [rows, setRows] = useState<PushNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const userId = await getCurrentUserIdFromToken();
      const data = await fetchPushNotifications(userId);
      setRows(data);
    } catch {
      setLoadError("Could not load notifications.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRows();
    }, [loadRows])
  );

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/home");
  }, [router]);

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return "cube-outline";
      case "offer":
        return "pricetag-outline";
      case "wishlist":
        return "heart-outline";
      default:
        return "notifications-outline";
    }
  };

  const formatRelativeTime = (value: string): string => {
    const t = Date.parse(value);
    if (!Number.isFinite(t)) return "Just now";
    const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const handleNotificationPress = useCallback(
    async (item: PushNotificationItem) => {
      if (!item.isRead) {
        setRows((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row))
        );
        try {
          await markPushNotificationAsRead(item.id);
        } catch {
          // Keep UI responsive even if API call fails.
        }
      }
      if (item.link) {
        router.push(item.link as any);
      }
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr("Notifications")}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.placeholderWrap}>
            <ActivityIndicator size="small" color="#E97A1F" />
            <Text style={styles.placeholderText}>{tr("Loading notifications...")}</Text>
          </View>
        ) : null}

        {!loading && loadError ? (
          <View style={styles.placeholderWrap}>
            <Text style={styles.placeholderText}>{tr(loadError)}</Text>
          </View>
        ) : null}

        {!loading && !loadError && rows.length === 0 ? (
          <View style={styles.placeholderWrap}>
            <Text style={styles.placeholderText}>{tr("No notifications yet.")}</Text>
          </View>
        ) : null}

        {!loading &&
          !loadError &&
          rows.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.card, !n.isRead && styles.cardUnread]}
              activeOpacity={0.9}
              onPress={() => void handleNotificationPress(n)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={getIcon(n.type) as any} size={18} color="#fff" />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.title} numberOfLines={2}>
                  {tr(n.title)}
                </Text>
                <Text style={styles.body} numberOfLines={3}>
                  {tr(n.message)}
                </Text>
                <Text style={styles.time}>{tr(formatRelativeTime(n.createdAt))}</Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  placeholderWrap: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    color: "#555",
  },
  card: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  cardUnread: {
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff9800",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: "#777",
  },
});


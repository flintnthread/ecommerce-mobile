import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../lib/language";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Your order has been shipped",
    body: "Track your running shoes order now. Expected delivery by Thu, 4 Apr.",
    time: "2h ago",
    type: "order",
  },
  {
    id: "2",
    title: "Deal of the day on sportswear",
    body: "Up to 60% off on women’s gym wear. Limited time offer.",
    time: "5h ago",
    type: "offer",
  },
  {
    id: "3",
    title: "Price drop alert",
    body: "An item in your wishlist just dropped in price. Don’t miss out.",
    time: "Yesterday",
    type: "wishlist",
  },
  {
    id: "4",
    title: "Delivery update",
    body: "Your last order was delivered. We hope you’re enjoying your purchase.",
    time: "2 days ago",
    type: "info",
  },
];

export default function Notifications() {
  const router = useRouter();
  const { tr } = useLanguage();

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr("Notifications")}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {MOCK_NOTIFICATIONS.map((n) => (
          <TouchableOpacity key={n.id} style={styles.card} activeOpacity={0.9}>
            <View style={styles.iconCircle}>
              <Ionicons name={getIcon(n.type) as any} size={18} color="#fff" />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {tr(n.title)}
              </Text>
              <Text style={styles.body} numberOfLines={3}>
                {tr(n.body)}
              </Text>
              <Text style={styles.time}>{tr(n.time)}</Text>
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
    paddingTop: 14,
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
  card: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
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


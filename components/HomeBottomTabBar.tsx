import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICON_SIZE = 24;
const TAB_ICON_COLOR = "#1a1a1a";

type TabItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  badgeCount?: number;
};

export type HomeBottomTabBarProps = {
  /** overlay: floats above scroll (home). inline: row in flex layout — use on Animated.ScrollView screens. */
  variant?: "overlay" | "inline";
  cartBadgeCount?: number;
};

function TabItem({ icon, label, onPress, badgeCount }: TabItemProps) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.tabIconWrap}>
        <Ionicons name={icon} size={TAB_ICON_SIZE} color={TAB_ICON_COLOR} />
        {badgeCount && badgeCount > 0 ? (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {badgeCount > 99 ? "99+" : String(badgeCount)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeBottomTabBar({
  variant = "overlay",
  cartBadgeCount = 0,
}: HomeBottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(10, insets.bottom);

  return (
    <View
      style={[
        styles.bottomTabBase,
        variant === "overlay" ? styles.bottomTabOverlay : styles.bottomTabInline,
        { paddingBottom },
      ]}
    >
      <TabItem
        icon="home-outline"
        label="Home"
        onPress={() => router.push("/home")}
      />
      <TabItem
        icon="grid-outline"
        label="Categories"
        onPress={() => router.push("/categories")}
      />
      <TabItem
        icon="receipt-outline"
        label="Orders"
        onPress={() => router.push("/orders")}
      />
      <TabItem
        icon="person-circle-outline"
        label="Account"
        onPress={() => router.push("/account")}
      />
      <TabItem
        icon="bag-handle-outline"
        label="Cart"
        badgeCount={cartBadgeCount}
        onPress={() => router.push("/cart")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBase: {
    minHeight: 72,
    paddingTop: 8,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#d8d8d8",
  },
  bottomTabOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 24,
  },
  bottomTabInline: {
    width: "100%",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
    minWidth: 56,
  },
  tabIconWrap: {
    position: "relative",
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#E11D48",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  tabLabel: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "#333",
  },
});

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OrderSuccess() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      
      {/* ✅ SUCCESS ICON */}
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={120} color="#28a745" />
      </View>

      {/* ✅ TITLE */}
      <Text style={styles.title}>Order Placed Successfully 🎉</Text>

      {/* ✅ DESCRIPTION */}
      <Text style={styles.desc}>
        Your order has been placed successfully. 
        You can track your order in the Orders section.
      </Text>

      {/* ✅ BUTTONS */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.replace("/home")} // Home
      >
        <Text style={styles.primaryText}>Go to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push("/orders")} // Orders page
      >
        <Text style={styles.secondaryText}>View Orders</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  iconContainer: {
    marginBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
  },

  desc: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },

  primaryBtn: {
    backgroundColor: "#f58220",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },

  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#f58220",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },

  secondaryText: {
    color: "#f58220",
    fontSize: 16,
    fontWeight: "600",
  },
});
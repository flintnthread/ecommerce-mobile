import React from "react";
import { View, Text, StyleSheet } from "react-native";

type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled" | "returns" | "payment_pending" | "payment_failed";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "processing":
        return { color: "#F59E0B", bgColor: "#FEF3C7", text: "Processing" };
      case "shipped":
        return { color: "#3B82F6", bgColor: "#DBEAFE", text: "Shipped" };
      case "delivered":
        return { color: "#10B981", bgColor: "#D1FAE5", text: "Delivered" };
      case "cancelled":
        return { color: "#EF4444", bgColor: "#FEE2E2", text: "Cancelled" };
      case "returns":
        return { color: "#8B5CF6", bgColor: "#EDE9FE", text: "Returns" };
      case "payment_pending":
        return { color: "#F59E0B", bgColor: "#FEF3C7", text: "Payment Pending" };
      case "payment_failed":
        return { color: "#EF4444", bgColor: "#FEE2E2", text: "Payment Failed" };
      default:
        return { color: "#6B7280", bgColor: "#F3F4F6", text: "Unknown" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
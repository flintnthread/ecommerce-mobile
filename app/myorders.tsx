import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

const orders = [
  {
    id: "ORD001",
    item: "Black T-Shirt",
    price: 799,
    status: "Delivered",
  },
  {
    id: "ORD002",
    item: "Blue Jeans",
    price: 1499,
    status: "Shipped",
  },
  {
    id: "ORD003",
    item: "Running Shoes",
    price: 2499,
    status: "Processing",
  },
];

export default function MyOrders() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.orderId}>Order ID: {item.id}</Text>
            <Text style={styles.itemName}>{item.item}</Text>
            <Text style={styles.price}>₹{item.price}</Text>
            <Text
              style={[
                styles.status,
                item.status === "Delivered"
                  ? { color: "green" }
                  : item.status === "Shipped"
                  ? { color: "orange" }
                  : { color: "blue" },
              ]}
            >
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  orderId: {
    fontSize: 12,
    color: "gray",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 5,
  },
  price: {
    fontSize: 15,
  },
  status: {
    marginTop: 5,
    fontWeight: "bold",
  },
});
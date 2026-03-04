import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";

const cartItems = [
  { id: "1", name: "T-Shirt", price: 799 },
  { id: "2", name: "Jeans", price: 1499 },
  { id: "3", name: "Sneakers", price: 2499 },
];

export default function Cart() {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Cart</Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
        )}
      />

      <View style={styles.totalSection}>
        <Text style={styles.totalText}>Total: ₹{total}</Text>

        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
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
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  itemName: {
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 20,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  checkoutButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
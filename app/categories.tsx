import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";

const categories = [
  { id: "1", title: "Men's Fashion" },
  { id: "2", title: "Women's Fashion" },
  { id: "3", title: "Kids Wear" },
  { id: "4", title: "Accessories" },
  { id: "5", title: "Footwear" },
  { id: "6", title: "Sports Wear" },
];

export default function Categories() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Categories</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
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
    width: "48%",
    padding: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  cardText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
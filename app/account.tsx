import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Account() {
  return (
    <View style={styles.container}>
      
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Ionicons name="person-circle-outline" size={100} color="#555" />
        <Text style={styles.name}>Ramya</Text>
        <Text style={styles.email}>ramya@email.com</Text>
      </View>

      {/* Options Section */}
      <View style={styles.options}>
        
        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="receipt-outline" size={22} color="#000" />
          <Text style={styles.optionText}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="settings-outline" size={22} color="#000" />
          <Text style={styles.optionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="log-out-outline" size={22} color="red" />
          <Text style={[styles.optionText, { color: "red" }]}>Logout</Text>
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
  profileSection: {
    alignItems: "center",
    marginTop: 50,
    marginBottom: 40,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  options: {
    marginTop: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
  },
});
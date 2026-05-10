import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface FullScreenLoaderProps {
  visible: boolean;
  text?: string;
}

export default function FullScreenLoader({ visible, text = "Loading..." }: FullScreenLoaderProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E97A1F" />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  container: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: "#111827",
    textAlign: "center",
  },
});
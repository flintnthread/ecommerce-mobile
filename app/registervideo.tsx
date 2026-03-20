import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";

export default function RegisterVideo() {
  const { url } = useLocalSearchParams();

  const videoId =
    typeof url === "string"
      ? url.match(/(?:youtu\.be\/|v=)([^&]+)/)?.[1]
      : "l-lBX-g2tEY";

  return (
    <View style={styles.container}>
      <WebView
        source={{
          uri: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        }}
        allowsFullscreenVideo
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function VoiceSearchMic() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestMicPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();

    if (status === "granted") {
      setPermissionGranted(true);
      Alert.alert("Permission Granted", "Microphone is ready to use ");
    } else {
      Alert.alert(
        "Permission Denied",
        "Please allow microphone access to use voice search"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Search</Text>

      <TouchableOpacity style={styles.micButton} onPress={requestMicPermission}>
        <Ionicons name="mic" size={40} color="white" />
      </TouchableOpacity>

      {permissionGranted && (
        <Text style={styles.text}>🎤 Listening for your voice...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  micButton: {
    backgroundColor: "#ff6600",
    padding: 25,
    borderRadius: 50,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
});
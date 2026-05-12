import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  View,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import EnhancedCameraSearch from "./EnhancedCameraSearch";

interface CameraSearchButtonProps {
  style?: any;
  iconSize?: number;
  showLabel?: boolean;
}

export default function CameraSearchButton({ 
  style, 
  iconSize = 24, 
  showLabel = false 
}: CameraSearchButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const openCameraOptions = () => {
    Alert.alert(
      "Camera Search",
      "Find products using AI-powered visual search",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Take Photo",
          onPress: () => setModalVisible(true),
        },
        {
          text: "Choose from Gallery",
          onPress: () => setModalVisible(true),
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={openCameraOptions}
        activeOpacity={0.7}
      >
        <Ionicons
          name="camera-outline"
          size={iconSize}
          color="#64748B"
        />
        {showLabel && (
          <Text style={styles.label}>Camera</Text>
        )}
      </TouchableOpacity>

      <EnhancedCameraSearch
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  label: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
});

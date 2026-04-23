import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { requestForegroundLocation } from "../lib/requestForegroundLocation";
import { useLanguage } from "../lib/language";

interface LocationPermissionProps {
  visible: boolean;
  onWhileUsing: () => void;
  onOnlyThisTime: () => void;
  onDontAllow: () => void;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  visible,
  onWhileUsing,
  onOnlyThisTime,
  onDontAllow,
}) => {
  const { tr } = useLanguage();

  /** Triggers the real OS location permission dialog (expo-location), then the parent callback. */
  const runLocationThen = useCallback((onContinue: () => void) => {
    void (async () => {
      await requestForegroundLocation();
      onContinue();
    })();
  }, []);

  const handleWhileUsing = useCallback(() => {
    runLocationThen(onWhileUsing);
  }, [onWhileUsing, runLocationThen]);

  const handleOnlyThisTime = useCallback(() => {
    runLocationThen(onOnlyThisTime);
  }, [onOnlyThisTime, runLocationThen]);

  const handleDontAllow = useCallback(() => {
    onDontAllow();
  }, [onDontAllow]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Top Small Icon */}
          <Ionicons
            name="location-outline"
            size={28}
            color="#2F5BFF"
            style={{ marginBottom: 12 }}
          />

          {/* Title */}
          <Text style={styles.title}>
            {tr("Allow Maps to access this device's precise location?")}
          </Text>

          {/* Location Options */}
          <View style={styles.optionsContainer}>
            {/* Precise */}
            <View style={styles.option}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                  <Ionicons name="location" size={34} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.optionText}>{tr("Precise")}</Text>
            </View>

            {/* Approximate */}
            <View style={styles.option}>
              <View style={styles.outerCircle}>
                <View style={styles.innerCircle}>
                  <Ionicons name="map" size={34} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.optionText}>{tr("Approximate")}</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleWhileUsing}
            >
              <Text style={styles.primaryText}>
                {tr("While using the app")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleOnlyThisTime}
            >
              <Text style={styles.primaryText}>
                {tr("Only this time")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dontAllowButton]}
              onPress={handleDontAllow}
            >
              <Text style={styles.dontAllowText}>
                {tr("Don't allow")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  dialogContainer: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#222",
    marginBottom: 28,
    lineHeight: 24,
  },

  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 30,
  },

  option: {
    alignItems: "center",
    flex: 1,
  },

  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2F5BFF",
    justifyContent: "center",
    alignItems: "center",
  },

  optionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },

  buttonContainer: {
    width: "100%",
  },

  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: "#D6E4FF",
    alignItems: "center",
    marginBottom: 12,
  },

  primaryText: {
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "600",
  },

  dontAllowButton: {
    backgroundColor: "#E5E7EB",
  },

  dontAllowText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LocationPermission;

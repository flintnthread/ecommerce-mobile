import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useLanguage } from "../lib/language";


const { width: SCREEN_WIDTH } = Dimensions.get("window");

const REFERRAL_POPUP_KEY = "hasSeenReferralPopup";

export default function ReferralPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const { tr } = useLanguage();

  useEffect(() => {
    if (visible) {
      // Mark popup as seen
      AsyncStorage.setItem(REFERRAL_POPUP_KEY, new Date().toISOString());
    }
  }, [visible]);

  const handleStartNow = () => {
    onClose();
    router.push("/userrewords");
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Gift Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="gift" size={60} color="#E97A1F" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Invite Friends & Earn Rewards!</Text>

            {/* Description */}
            <Text style={styles.description}>
              Invite friends with your code. After 5 friends complete a purchase, you get 10% off your first order.
              {"\n\n"}
              Invite 5 friends to unlock exclusive rewards!
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>10% discount for friends</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Earn rewards per referral</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>Unlock special perks</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.startNowBtn} onPress={handleStartNow}>
                <Text style={styles.startNowBtnText}>Start Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.laterBtn} onPress={handleClose}>
                <Text style={styles.laterBtnText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  popupContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 1,
  },
  content: {
    padding: 30,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
  },
  benefitsContainer: {
    width: "100%",
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
    fontWeight: "500",
  },
  buttonsContainer: {
    width: "100%",
    gap: 12,
  },
  startNowBtn: {
    backgroundColor: "#E97A1F",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#E97A1F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startNowBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  laterBtn: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  laterBtnText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

// Helper function to check if popup should be shown
export const shouldShowReferralPopup = async (): Promise<boolean> => {
  try {
    const lastSeen = await AsyncStorage.getItem(REFERRAL_POPUP_KEY);
    
    if (!lastSeen) {
      return true; // Never seen before
    }
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    // Show once per day (24 hours)
    return diffInHours >= 24;
  } catch (error) {
    console.error("Error checking referral popup:", error);
    return true; // Show on error
  }
};

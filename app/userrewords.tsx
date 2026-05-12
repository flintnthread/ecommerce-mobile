import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import { getCurrentUserIdFromToken, validateAndRefreshToken } from "../services/pushNotifications";
import { useLanguage } from "../lib/language";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

type ReferralDashboard = {
  referralCode: string;
  confirmedReferrals: number;
  requiredReferrals: number;
  rewardUnlocked: boolean;
  alreadyUsedReferral: boolean;
};

const GIFT_IMAGE = require("../assets/images/userrewords-gift.png");

export default function UserRewardsScreen() {
  const { tr } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [applyCode, setApplyCode] = React.useState("");
  const [referralCode, setReferralCode] = React.useState("");
  const [dashboard, setDashboard] = React.useState<ReferralDashboard>({
    referralCode: "",
    confirmedReferrals: 0,
    requiredReferrals: 5,
    rewardUnlocked: false,
    alreadyUsedReferral: false,
  });
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // 🔥 FETCH DASHBOARD
  const fetchDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserIdFromToken();

      console.log("USER ID:", userId);

      if (!userId) {
        console.log("ERROR: No userId found - user might not be logged in");
        Alert.alert(
          "Login Required", 
          "Please login to view referral data",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Login",
              onPress: () => router.push("/login")
            }
          ]
        );
        return;
      }

      console.log("Making API call to:", "/api/referral/dashboard");
      const { data } = await api.get("/api/referral/dashboard");

      console.log("API RESPONSE:", data);

      // Backend returns ReferralDashboardDto
      setDashboard({
        referralCode: data.referralCode,
        confirmedReferrals: data.confirmedReferrals,
        requiredReferrals: data.requiredReferrals,
        rewardUnlocked: data.rewardUnlocked,
        alreadyUsedReferral: data.alreadyUsedReferral,
      });

      setReferralCode(data.referralCode);
    } catch (e: any) {
      console.log("Dashboard error details:", {
        message: e?.message,
        response: e?.response?.data,
        status: e?.response?.status,
        statusText: e?.response?.statusText
      });
      
      const errorMessage = e?.response?.data?.message || e?.message || "Unknown error occurred";
      Alert.alert("Referral Error", `Failed to load referral data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const checkAuth = async () => {
      const isValidToken = await validateAndRefreshToken();
      console.log("Auth check - Valid token:", isValidToken);
      setIsAuthenticated(isValidToken);
      
      if (isValidToken) {
        const userId = await getCurrentUserIdFromToken();
        if (userId) {
          fetchDashboard();
        }
      }
    };
    checkAuth();
  }, [fetchDashboard]);

  // 🔥 COPY REFERRAL CODE
  const handleCopyCode = async () => {
    if (!referralCode) {
      Alert.alert("Error", "No referral code available");
      return;
    }

    try {
      await Clipboard.setStringAsync(referralCode);
      Alert.alert("Success", "Referral code copied to clipboard!");
    } catch (error) {
      console.error("Copy error:", error);
      Alert.alert("Error", "Failed to copy referral code");
    }
  };

  // 🔥 APPLY REFERRAL
  const handleApplyReferralCode = async () => {
    const code = applyCode.trim();

    if (!code) {
      Alert.alert("Referral code", "Enter a referral code first.");
      return;
    }

    if (code.length < 3) {
      Alert.alert("Invalid code", "Referral code must be at least 3 characters long.");
      return;
    }

    try {
      const userId = await getCurrentUserIdFromToken();

      if (!userId) {
        Alert.alert(
          "Login Required", 
          "Please login to apply referral code",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Login", 
              onPress: () => router.push("/login")
            }
          ]
        );
        return;
      }

      console.log("Applying referral code:", { userId, referralCode: code });

      const { data } = await api.post("/api/referral/apply", {
        referralCode: code,
      });

      console.log("Apply response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to apply referral code");
      }

      Alert.alert("Success", data.message || "Referral code applied successfully!");
      setApplyCode("");
      fetchDashboard(); // Refresh dashboard
    } catch (e: any) {
      console.log("Apply error:", e?.response?.data || e.message);
      
      if (e.message.includes("Invalid referral code")) {
        Alert.alert("Invalid Code", "The referral code you entered is not valid. Please check and try again.");
      } else if (e.message.includes("Referral already used")) {
        Alert.alert("Already Used", "You have already used a referral code.");
      } else if (e.message.includes("Own code not allowed")) {
        Alert.alert("Invalid Code", "You cannot use your own referral code.");
      } else {
        Alert.alert("Error", e.message || "Failed to apply referral code");
      }
    }
  };

  // 🔥 SHARE
  const handleInviteFriends = async () => {
    try {
      const userId = await getCurrentUserIdFromToken();
      
      if (!userId) {
        Alert.alert(
          "Login Required", 
          "Please login to share referral code",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Login",
              onPress: () => router.push("/login")
            }
          ]
        );
        return;
      }

      const { data } = await api.get("/api/referral/share");

      console.log("Share response:", data);

      await Share.share({
        message: data.message + "\n" + data.shareLink,
      });
    } catch (e: any) {
      console.log("Share error:", e?.response?.data || e.message);
      Alert.alert("Share", "Could not open share options right now.");
    }
  };

  // Calculate progress percentage
  const progressPercentage = Math.min((dashboard.confirmedReferrals / dashboard.requiredReferrals) * 100, 100);

  return (
    <LinearGradient
      colors={["#17317A", "#1A1A4A", "#0E0B23", "#06060D"]}
      locations={[0, 0.34, 0.7, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.container}
    >
      <>
        {!isAuthenticated ? (
          <View style={styles.authMessage}>
            <Text style={styles.authMessageText}>
              Please login to view referral data
            </Text>
            <TouchableOpacity 
              style={styles.loginBtn} 
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.loginBtnText}>� Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardShell}>
            <View style={styles.giftIconWrap}>
              <Image source={GIFT_IMAGE} style={styles.giftImage} resizeMode="contain" />
            </View>

            {/* SECTION 1 - HEADER OFFER */}
            <Text style={styles.title}>
              Invite 5 friends{"\n"}and get 10% Discount on First Order
            </Text>

            <Text style={styles.subtitle}>
              After successful registration you and your{"\n"}friends will get Referral code
            </Text>

            {/* SECTION 2 - USER REFERRAL CODE */}
            <View style={styles.referralCodeWrap}>
              <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
              <View style={styles.referralCodeBox}>
                <Text style={styles.referralCodeText}>
                  {referralCode || "Loading..."}
                </Text>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                  <Ionicons name="copy-outline" size={20} color="#E97A1F" />
                </TouchableOpacity>
              </View>
            </View>

            {/* SECTION 3 - ENTER REFERRAL CODE (only show if not used) */}
            {!dashboard.alreadyUsedReferral && (
              <View style={styles.applyCodeWrap}>
                <Text style={styles.applyCodeLabel}>Enter Referral Code</Text>
                <View style={styles.applyCodeRow}>
                  <TextInput
                    value={applyCode}
                    onChangeText={setApplyCode}
                    placeholder="Enter referral code"
                    placeholderTextColor="#bba9ff"
                    style={styles.applyCodeInput}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity style={styles.applyCodeBtn} onPress={handleApplyReferralCode}>
                    <Text style={styles.applyCodeBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SECTION 4 & 5 - INVITES COUNT AND PROGRESS */}
            {/* SECTION 4 & 5 - INVITES COUNT AND PROGRESS */}
<View style={styles.invitesSection}>
  <View style={styles.invitesHeadRow}>
    <Text style={styles.invitesTitle}>Invites</Text>
    <Text style={styles.invitesCount}>
      {dashboard.confirmedReferrals}
    </Text>
  </View>

  <Text style={styles.confirmedText}>
    Confirmed referrals: {dashboard.confirmedReferrals}/{dashboard.requiredReferrals}
  </Text>

  {/* Progress Bar */}
  <View style={styles.progressContainer}>
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          { width: `${progressPercentage}%` }
        ]}
      />
    </View>

    <Text style={styles.progressText}>
      {Math.round(progressPercentage)}%
    </Text>
  </View>
</View>
          

            {/* SECTION 6 - REWARD STATUS */}
            {dashboard.rewardUnlocked && (
              <View style={styles.rewardUnlockedContainer}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.rewardUnlockedText}>🎉 Reward Unlocked!</Text>
              </View>
            )}

            {/* SECTION 7 - INVITE FRIENDS BUTTON */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleInviteFriends}>
                <LinearGradient colors={["#8B47FF", "#6B2BFF"]} style={styles.primaryBtnGradient}>
                  <Text style={styles.primaryBtnText}>Invite Friends</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 22,
    paddingBottom: 12,
  },
  authMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  authMessageText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: "#A0208C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  authRetryBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  authRetryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cardShell: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(176,152,255,0.2)",
    backgroundColor: "rgba(6, 7, 18, 0.35)",
    paddingTop: 18,
    paddingHorizontal: 14,
  },
  giftIconWrap: {
    width: 170,
    height: 150,
    alignSelf: "center",
    marginTop: 4,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  giftImage: {
    width: 168,
    height: 148,
  },
  title: {
    fontSize: 30,
    lineHeight: 49,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    lineHeight: 23,
  },
  referralCodeWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  referralCodeLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
    fontWeight: "600",
  },
  referralCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(120,83,255,0.2)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(165,136,255,0.45)",
    marginTop: 8,
  },
  referralCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 2,
    textAlign: "center",
  },
  copyBtn: {
    padding: 8,
    marginLeft: 12,
  },
  applyCodeWrap: {
    marginTop: 20,
    alignItems: "center",
  },
  applyCodeLabel: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
    fontWeight: "600",
  },
  applyCodeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    width: "100%",
  },
  applyCodeInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(165,136,255,0.55)",
    backgroundColor: "rgba(120,83,255,0.15)",
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "700",
    fontSize: 16,
  },
  applyCodeBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#8B47FF",
  },
  applyCodeBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  invitesSection: {
    marginTop: 25,
    alignItems: "center",
  },
  invitesHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  invitesTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
  },
  invitesCount: {
    color: "#E97A1F",
    fontSize: 32,
    fontWeight: "800",
    marginLeft: 8,
  },
  confirmedText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    position: "relative",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34C759",
    borderRadius: 4,
  },
  progressText: {
    position: "absolute",
    right: 10,
    top: -8,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  rewardUnlockedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,215,0,0.2)",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  rewardUnlockedText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  bottomActions: {
    marginTop: 20,
    alignItems: "center",
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "800",
  },
});
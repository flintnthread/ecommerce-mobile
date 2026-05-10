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

type ReferralOverview = {
  referralCode: string;
  confirmedReferrals: number;
  requiredReferrals: number;
  discountPercent: number;
  rewardUnlocked: boolean;
  rewardUsed: boolean;
};

const GIFT_IMAGE = require("../assets/images/userrewords-gift.png");

export default function UserRewardsScreen() {
  const { tr } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [applyCode, setApplyCode] = React.useState("");
  const [referralCode, setReferralCode] = React.useState("");
  const [overview, setOverview] = React.useState<ReferralOverview>({
    referralCode: "",
    confirmedReferrals: 0,
    requiredReferrals: 5,
    discountPercent: 10,
    rewardUnlocked: false,
    rewardUsed: false,
  });
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // 🔥 FETCH DASHBOARD
  const fetchOverview = React.useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserIdFromToken();

      console.log("USER ID:", userId);

      if (!userId) {
        console.log("ERROR: No userId found - user might not be logged in");
        Alert.alert("Login Required", "Please login to view referral data");
        return;
      }

      console.log("Making API call to:", `/api/referral/dashboard/${userId}`);
      const { data } = await api.get(`/api/referral/dashboard/${userId}`);

      console.log("API RESPONSE:", data);

      // Backend returns ReferralDashboardDto directly:
      // { referralCode, completedInvites, targetInvites, remainingInvites, eligible, reward }
      setOverview({
        referralCode: data.referralCode,
        confirmedReferrals: data.completedInvites, // ✅ FIXED: use completedInvites from backend
        requiredReferrals: data.targetInvites,     // ✅ FIXED: use targetInvites from backend
        discountPercent: 10,
        rewardUnlocked: data.eligible,
        rewardUsed: false,
      });

      setReferralCode(data.referralCode);
    } catch (e: any) {
      console.log("Dashboard error details:", {
        message: e?.message,
        response: e?.response?.data,
        status: e?.response?.status,
        statusText: e?.response?.statusText
      });
      
      // Show more specific error message
      const errorMessage = e?.response?.data?.message || e?.message || "Unknown error occurred";
      Alert.alert("Referral Error", `Failed to load referral data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const isValidToken = await validateAndRefreshToken();
      console.log("Auth check - Valid token:", isValidToken);
      setIsAuthenticated(isValidToken);
      
      if (isValidToken) {
        const userId = await getCurrentUserIdFromToken();
        if (userId) {
          fetchOverview();
        }
      }
    };
    checkAuth();
  }, []);

  // 🔥 REFRESH CODE
  const generateReferralCode = async () => {
    try {
      const userId = await getCurrentUserIdFromToken();

      if (!userId) {
        throw new Error("Invalid userId");
      }

      console.log("Refreshing referral code for user:", userId);

      const { data } = await api.post(`/api/referral/refresh/${userId}`);

      console.log("Refresh response:", data);

      // Backend returns the new referral code as a string
      setReferralCode(data);

      Alert.alert("Success", "New referral code generated: " + data);
      fetchOverview(); // Refresh dashboard to get updated data
    } catch (e: any) {
      console.log("Refresh error:", e?.response?.data || e.message);
      Alert.alert("Error", "Failed to refresh referral code");
    }
  };

  // 🔥 APPLY REFERRAL
  const handleApplyReferralCode = async () => {
    const code = applyCode.trim();

    if (!code) {
      Alert.alert("Referral code", "Enter a referral code first.");
      return;
    }

    // Validate code format (basic validation)
    if (code.length < 3) {
      Alert.alert("Invalid code", "Referral code must be at least 3 characters long.");
      return;
    }

    try {
      const userId = await getCurrentUserIdFromToken();

      if (!userId) {
        throw new Error("Invalid userId");
      }

      console.log("Applying referral code:", { userId, referralCode: code });

      const { data } = await api.post(`/api/referral/apply`, {
        userId,
        referralCode: code,
      });

      console.log("Apply response:", data);

      // Backend returns ReferralResponse directly: { success: boolean, message: string }
      if (!data.success) {
        throw new Error(data.message || "Failed to apply referral code");
      }

      Alert.alert("Success", data.message || "Referral code applied successfully!");
      setApplyCode("");
      fetchOverview();
    } catch (e: any) {
      console.log("Apply error:", e?.response?.data || e.message);
      
      // Handle specific error cases
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
        throw new Error("Invalid userId");
      }

      const { data } = await api.get(`/api/referral/share/${userId}`);

      console.log("Share response:", data);

      // Backend returns ShareDto: { message, shareLink }
      await Share.share({
        message: data.message + "\n" + data.shareLink,
      });
    } catch (e: any) {
      console.log("Share error:", e?.response?.data || e.message);
      Alert.alert("Share", "Could not open share options right now.");
    }
  };

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
              style={styles.authRetryBtn} 
              onPress={() => {
                // Clear old token and redirect to login
                AsyncStorage.removeItem("token");
                router.replace("/login");
              }}
            >
              <Text style={styles.authRetryBtnText}>🔄 Refresh Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardShell}>
            <View style={styles.giftIconWrap}>
              <Image source={GIFT_IMAGE} style={styles.giftImage} resizeMode="contain" />
            </View>

            <Text style={styles.title}>
              Invite 5 friends{"\n"}and get 10% Discount on First Order
            </Text>

            <Text style={styles.subtitle}>
              After successful registration you and your{"\n"}friends will get Referral code
            </Text>

            <View style={styles.referralCodeWrap}>
              <View style={styles.referralCodeChip}>
                <Ionicons name="ticket-outline" size={16} color="#d9ccff" />
                <Text style={styles.referralCodeText}>
                  {referralCode || "No code available"}
                </Text>
              </View>

              <TouchableOpacity style={styles.generateBtn} onPress={generateReferralCode}>
                <Text style={styles.generateBtnText}>
                  {loading ? "Loading..." : "Refresh ID"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.applyCodeWrap}>
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

            <View style={styles.invitesHeadRow}>
              <Text style={styles.invitesTitle}>Invites</Text>
              <Text style={styles.invitesCount}>
                {overview.confirmedReferrals}/{overview.requiredReferrals}
              </Text>
            </View>

            <View style={styles.invitesProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(overview.confirmedReferrals / overview.requiredReferrals) * 100}%` }
                  ]}
                />
              </View>
            </View>

            <View style={styles.invitesList}>
              {[/* ... */].map((item, index) => (
                <View key={index} style={styles.inviteItem}>
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={item.completed ? "#34C759" : "#9CA3AF"}
                  />
                  <Text style={styles.inviteItemText}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleInviteFriends}>
                <LinearGradient colors={["#8B47FF", "#6B2BFF"]} style={styles.primaryBtnGradient}>
                  <Text style={styles.primaryBtnText}>Invite friends</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {/* Alternative Options for Old Users */}
              <View style={styles.alternativeOptions}>
                <Text style={styles.alternativeTitle}>🎁 Alternative Ways to Earn</Text>
                
                <TouchableOpacity style={styles.alternativeItem} onPress={() => Alert.alert("Coming Soon", "Daily login rewards will be available soon!")}>
                  <Ionicons name="calendar-outline" size={20} color="#d9ccff" />
                  <View style={styles.alternativeContent}>
                    <Text style={styles.alternativeItemTitle}>Daily Login</Text>
                    <Text style={styles.alternativeItemDesc}>Get points for daily check-ins</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#d9ccff" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.alternativeItem} onPress={() => Alert.alert("Coming Soon", "Social sharing rewards will be available soon!")}>
                  <Ionicons name="share-social-outline" size={20} color="#d9ccff" />
                  <View style={styles.alternativeContent}>
                    <Text style={styles.alternativeItemTitle}>Share on Social</Text>
                    <Text style={styles.alternativeItemDesc}>Extra rewards for social shares</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#d9ccff" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.alternativeItem} onPress={() => Alert.alert("Coming Soon", "Purchase rewards will be available soon!")}>
                  <Ionicons name="cart-outline" size={20} color="#d9ccff" />
                  <View style={styles.alternativeContent}>
                    <Text style={styles.alternativeItemTitle}>Purchase Rewards</Text>
                    <Text style={styles.alternativeItemDesc}>Earn rewards on every purchase</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#d9ccff" />
                </TouchableOpacity>
              </View>
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
    marginTop: 12,
    alignItems: "center",
  },
  referralCodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(165,136,255,0.45)",
    backgroundColor: "rgba(120,83,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  referralCodeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  generateBtn: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: "rgba(139,71,255,0.28)",
    borderWidth: 1,
    borderColor: "rgba(165,136,255,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  generateBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  applyCodeWrap: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
  },
  applyCodeBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#8B47FF",
  },
  applyCodeBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  invitesHeadRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  invitesTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
  },
  invitesCount: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 32,
    fontWeight: "800",
  },
  invitesList: {
    marginTop: 10,
    gap: 12,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: 10,
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#32d583",
    backgroundColor: "#18192f",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteMeta: {
    flex: 1,
  },
  inviteEmail: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  inviteStatus: {
    marginTop: 2,
    color: "rgba(255,255,255,0.68)",
    fontSize: 16,
    fontWeight: "600",
  },
  remindBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  remindText: {
    color: "#8f7dff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomActions: {
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
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
  invitesProgress: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34C759",
    borderRadius: 4,
  },
  inviteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  inviteItemText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
  },
  alternativeOptions: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  alternativeTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  alternativeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  alternativeContent: {
    flex: 1,
    marginLeft: 15,
  },
  alternativeItemTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  alternativeItemDesc: {
    color: "#d9ccff",
    fontSize: 12,
    opacity: 0.8,
  },
});

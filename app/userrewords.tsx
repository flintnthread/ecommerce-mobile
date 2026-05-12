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
import { 
  getStoredReferralCode, 
  getReferralStats, 
  updateReferralStats,
  getReferralUsageCount,
  processReferralCode
} from "../services/referralService";

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

  // 🔥 FETCH DASHBOARD - Use referral service for persistent data
  const fetchOverview = React.useCallback(async () => {
    console.log("Loading referral data from service");
    setLoading(true);
    
    try {
      // Get persistent referral code and stats
      const [storedCode, stats] = await Promise.all([
        getStoredReferralCode(),
        getReferralStats()
      ]);
      
      // Get actual usage count for this referral code
      const usageCount = await getReferralUsageCount(storedCode);
      
      // Update stats with actual usage count
      const updatedStats = {
        ...stats,
        referralCode: storedCode,
        confirmedReferrals: usageCount,
        rewardUnlocked: usageCount >= stats.requiredReferrals,
      };
      
      // Update local state
      setOverview(updatedStats);
      setReferralCode(storedCode);
      
      console.log("Loaded referral data:", {
        code: storedCode,
        usageCount,
        stats: updatedStats
      });
    } catch (error) {
      console.log("Error loading referral data:", error);
      // Fallback to basic data
      const fallbackCode = await getStoredReferralCode();
      setReferralCode(fallbackCode);
      setOverview({
        referralCode: fallbackCode,
        confirmedReferrals: 0,
        requiredReferrals: 5,
        discountPercent: 10,
        rewardUnlocked: false,
        rewardUsed: false,
      });
    }
    
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // Bypass authentication and always fetch data
    console.log("Component mounted - fetching overview data");
    fetchOverview();
  }, []);

  
  // 🔥 APPLY REFERRAL - Use referral service for real tracking
  const handleApplyReferralCode = async () => {
    const code = applyCode.trim();

    if (!code) {
      Alert.alert("Referral code", "Enter a referral code first.");
      return;
    }

    console.log("Applying referral code:", code);
    
    // Don't allow applying own code
    if (code === referralCode) {
      Alert.alert("Invalid Code", "You cannot use your own referral code.");
      return;
    }
    
    try {
      // Get current user email (simulate for demo)
      const currentUserId = await getCurrentUserIdFromToken();
      const newUserEmail = "user" + currentUserId + "@example.com"; // Simulate email
      
      // Process the referral code (this will increment the referrer's count)
      const success = await processReferralCode(code, newUserEmail);
      
      if (success) {
        Alert.alert("Success", "Referral code applied successfully!");
        setApplyCode(""); // Clear the input
        
        // Refresh the data to show updated counts
        fetchOverview();
      } else {
        Alert.alert("Error", "Failed to apply referral code. You may have already used this code.");
      }
    } catch (error) {
      console.log("Error applying referral code:", error);
      Alert.alert("Error", "Failed to apply referral code");
    }
  };

  // 🔥 SHARE - Disabled API calls
  const handleInviteFriends = async () => {
    console.log("Mock share - opening share dialog");
    
    try {
      await Share.share({
        message: "Join me on this amazing app and get rewards! Use my referral code: " + referralCode,
      });
    } catch (error) {
      console.log("Share error:", error);
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
        {/* Always show main content - bypass authentication for now */}
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

              <Text style={styles.codeNoteText}>
                Your permanent referral code - share with friends
              </Text>
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
  codeNoteText: {
    color: "#d9ccff",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";

type ReferralOverview = {
  referralCode: string;
  confirmedReferrals: number;
  requiredReferrals: number;
  discountPercent: number;
  rewardUnlocked: boolean;
  rewardUsed: boolean;
};

const GIFT_IMAGE = require("../assets/images/userrewords-gift.png");

export default function UserRewordsScreen() {
  const [referralCode, setReferralCode] = React.useState("");
  const [applyCode, setApplyCode] = React.useState("");
  const [overview, setOverview] = React.useState<ReferralOverview | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchOverview = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{
        success: boolean;
        message?: string;
        data?: ReferralOverview;
      }>("/api/referrals/me");
      if (!data?.success || !data?.data) {
        throw new Error(data?.message || "Could not load referral details.");
      }
      setOverview(data.data);
      setReferralCode(data.data.referralCode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load referral details.";
      Alert.alert("Referral", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const generateReferralCode = () => {
    void fetchOverview();
  };

  const handleApplyReferralCode = async () => {
    const code = applyCode.trim();
    if (!code) {
      Alert.alert("Referral code", "Enter a referral code first.");
      return;
    }
    if (referralCode && code.toUpperCase() === referralCode.trim().toUpperCase()) {
      Alert.alert("Referral", "You cannot apply your own referral code.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<{
        success: boolean;
        message?: string;
      }>("/api/referrals/apply", {
        referralCode: code,
      });
      if (!data?.success) {
        throw new Error(data?.message || "Could not apply referral code.");
      }
      Alert.alert("Referral", data.message || "Referral code applied.");
      setApplyCode("");
      await fetchOverview();
    } catch (e) {
      const ax = e as { response?: { data?: any } };
      const serverMsg =
        typeof ax?.response?.data?.message === "string" ? ax.response.data.message : "";
      const msg =
        serverMsg ||
        (e instanceof Error ? e.message : "Could not apply referral code.");
      Alert.alert("Referral", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteFriends = async () => {
    if (!referralCode) {
      Alert.alert("Referral code", "Tap GenerateID first to create your referral code.");
      return;
    }
    try {
      await Share.share({
        message: `Join me on Flint & Thread and get referral rewards.\nUse my code: ${referralCode}`,
      });
    } catch {
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
      <View style={styles.cardShell}>
        <View style={styles.giftIconWrap}>
          <Image source={GIFT_IMAGE} style={styles.giftImage} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Invite 5 friends{"\n"}and get 10% Discount on First Order</Text>
        <Text style={styles.subtitle}>
          After successful registration you and your{"\n"}friends will get  Refferal code
        </Text>
        <View style={styles.referralCodeWrap}>
          <View style={styles.referralCodeChip}>
            <Ionicons name="ticket-outline" size={16} color="#d9ccff" />
            <Text style={styles.referralCodeText}>
              {referralCode || "No code available"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.generateBtn}
            activeOpacity={0.9}
            onPress={generateReferralCode}
          >
            <Text style={styles.generateBtnText}>{loading ? "Loading..." : "Refresh ID"}</Text>
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
          <TouchableOpacity style={styles.applyCodeBtn} onPress={handleApplyReferralCode} activeOpacity={0.9}>
            <Text style={styles.applyCodeBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.invitesHeadRow}>
          <Text style={styles.invitesTitle}>Invites</Text>
          <Text style={styles.invitesCount}>{overview?.confirmedReferrals ?? 0}</Text>
        </View>

        <View style={styles.invitesList}>
          <View style={styles.inviteRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Ionicons name="people" size={14} color="#f6cf86" />
              </View>
            </View>
            <View style={styles.inviteMeta}>
              <Text style={styles.inviteEmail}>
                Confirmed referrals: {overview?.confirmedReferrals ?? 0}/{overview?.requiredReferrals ?? 5}
              </Text>
              <Text style={styles.inviteStatus}>
                Reward: {overview?.discountPercent ?? 10}% first-order discount
              </Text>
            </View>
          </View>
          <View style={styles.inviteRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                <Ionicons name="pricetag" size={14} color="#f6cf86" />
              </View>
            </View>
            <View style={styles.inviteMeta}>
              <Text style={styles.inviteEmail}>
                Status: {overview?.rewardUnlocked ? "Unlocked" : "In progress"}
              </Text>
              <Text style={styles.inviteStatus}>
                {overview?.rewardUsed ? "Discount already used" : "Discount available for your first order"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={handleInviteFriends}>
          <LinearGradient
            colors={["#8B47FF", "#6B2BFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>Invite friends</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
});

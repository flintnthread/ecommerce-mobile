import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Share, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type InviteItem = {
  id: string;
  email: string;
  status: "Pending" | "Registered";
  remind?: boolean;
};

const INVITES: InviteItem[] = [
  { id: "1", email: "john.smith@gmail.com", status: "Pending", remind: true },
  { id: "2", email: "john.smith@gmail.com", status: "Registered" },
];

const GIFT_IMAGE = require("../assets/images/userrewords-gift.png");

export default function UserRewordsScreen() {
  const [referralCode, setReferralCode] = React.useState("");

  const generateReferralCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    for (let i = 0; i < 8; i += 1) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    setReferralCode(`FNT${token}`);
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
              {referralCode || "No code generated"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.generateBtn}
            activeOpacity={0.9}
            onPress={generateReferralCode}
          >
            <Text style={styles.generateBtnText}>GenerateID</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.invitesHeadRow}>
          <Text style={styles.invitesTitle}>Invites</Text>
          <Text style={styles.invitesCount}>2</Text>
        </View>

        <View style={styles.invitesList}>
          {INVITES.map((invite) => (
            <View key={invite.id} style={styles.inviteRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarRing}>
                  <Ionicons name="person" size={14} color="#f6cf86" />
                </View>
              </View>

              <View style={styles.inviteMeta}>
                <Text style={styles.inviteEmail}>{invite.email}</Text>
                <Text style={styles.inviteStatus}>{invite.status}</Text>
              </View>

              {invite.remind ? (
                <TouchableOpacity activeOpacity={0.9} style={styles.remindBtn}>
                  <Text style={styles.remindText}>Remind</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
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

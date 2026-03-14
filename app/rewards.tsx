import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RewardTab = "points" | "referral" | "coupons" | "history";

interface RewardHistory {
  id: string;
  date: string;
  type: "earned" | "redeemed" | "expired";
  description: string;
  points: number;
  status: "active" | "used" | "expired";
}

interface Coupon {
  id: string;
  code: string;
  title: string;
  discount: string;
  description: string;
  expiryDate: string;
  minPurchase: string;
  status: "available" | "used" | "expired";
}

export default function RewardsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RewardTab>("points");

  // Sample data
  const rewardPoints = 2450;
  const referralCode = "FASHION2024";
  const referralEarnings = 1250;
  const totalReferrals = 8;

  const rewardHistory: RewardHistory[] = [
    {
      id: "1",
      date: "25 Jan 2024",
      type: "earned",
      description: "Order #ORD-2024-005",
      points: 250,
      status: "active",
    },
    {
      id: "2",
      date: "22 Jan 2024",
      type: "redeemed",
      description: "Coupon: FLASH50",
      points: -500,
      status: "used",
    },
    {
      id: "3",
      date: "18 Jan 2024",
      type: "earned",
      description: "Referral Bonus",
      points: 200,
      status: "active",
    },
    {
      id: "4",
      date: "15 Jan 2024",
      type: "earned",
      description: "Order #ORD-2024-001",
      points: 300,
      status: "active",
    },
    {
      id: "5",
      date: "10 Jan 2024",
      type: "expired",
      description: "Points Expired",
      points: -100,
      status: "expired",
    },
  ];

  const coupons: Coupon[] = [
    {
      id: "1",
      code: "FLASH50",
      title: "Flash Sale",
      discount: "50% OFF",
      description: "Get 50% off on all fashion items",
      expiryDate: "31 Jan 2024",
      minPurchase: "₹999",
      status: "available",
    },
    {
      id: "2",
      code: "NEWUSER20",
      title: "New User Special",
      discount: "20% OFF",
      description: "Welcome offer for new customers",
      expiryDate: "28 Feb 2024",
      minPurchase: "₹500",
      status: "available",
    },
    {
      id: "3",
      code: "FREESHIP",
      title: "Free Shipping",
      discount: "FREE",
      description: "Free shipping on orders above ₹999",
      expiryDate: "15 Feb 2024",
      minPurchase: "₹999",
      status: "available",
    },
    {
      id: "4",
      code: "WEEKEND30",
      title: "Weekend Special",
      discount: "30% OFF",
      description: "Weekend shopping discount",
      expiryDate: "05 Feb 2024",
      minPurchase: "₹799",
      status: "used",
    },
  ];

  const tabs: { key: RewardTab; label: string; icon: string }[] = [
    { key: "points", label: "Reward Points", icon: "star" },
    { key: "referral", label: "Referral Rewards", icon: "people" },
    { key: "coupons", label: "Coupons", icon: "ticket" },
    { key: "history", label: "History", icon: "time" },
  ];

  const getFilteredHistory = () => {
    if (activeTab === "history") return rewardHistory;
    return [];
  };

  const getFilteredCoupons = () => {
    if (activeTab === "coupons") return coupons;
    return [];
  };

  const getHistoryTypeColor = (type: string) => {
    switch (type) {
      case "earned":
        return "#4CAF50";
      case "redeemed":
        return "#FF9800";
      case "expired":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getCouponStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "#4CAF50";
      case "used":
        return "#757575";
      case "expired":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Close Button - Absolute Positioned */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="close-circle" size={32} color="#666" />
        </TouchableOpacity>

        {/* Centered Title Section */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Your Rewards</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "points" && `${rewardPoints} points available`}
            {activeTab === "referral" && `${totalReferrals} successful referrals`}
            {activeTab === "coupons" && `${coupons.filter(c => c.status === "available").length} active coupons`}
            {activeTab === "history" && `${rewardHistory.length} transactions`}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? "#FFFFFF" : "#666"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
              {activeTab === tab.key && (
                <View style={styles.tabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Reward Points Tab */}
        {activeTab === "points" && (
          <View style={styles.pointsContainer}>
            {/* Points Card */}
            <View style={styles.pointsCard}>
              <View style={styles.pointsCardHeader}>
                <Ionicons name="star" size={32} color="#FFD700" />
                <View style={styles.pointsCardInfo}>
                  <Text style={styles.pointsLabel}>Total Reward Points</Text>
                  <Text style={styles.pointsValue}>{rewardPoints.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.pointsCardFooter}>
                <View style={styles.pointsStat}>
                  <Text style={styles.pointsStatLabel}>Available</Text>
                  <Text style={styles.pointsStatValue}>{rewardPoints}</Text>
                </View>
                <View style={styles.pointsStatDivider} />
                <View style={styles.pointsStat}>
                  <Text style={styles.pointsStatLabel}>Value</Text>
                  <Text style={styles.pointsStatValue}>₹{rewardPoints * 0.1}</Text>
                </View>
              </View>
            </View>

            {/* How to Earn */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to Earn Points</Text>
              <View style={styles.earnCard}>
                <View style={styles.earnItem}>
                  <Ionicons name="cart" size={20} color="#E97A1F" />
                  <View style={styles.earnItemContent}>
                    <Text style={styles.earnItemTitle}>Shop & Earn</Text>
                    <Text style={styles.earnItemDesc}>
                      Earn 10 points for every ₹100 spent
                    </Text>
                  </View>
                </View>
                <View style={styles.earnItem}>
                  <Ionicons name="people" size={20} color="#E97A1F" />
                  <View style={styles.earnItemContent}>
                    <Text style={styles.earnItemTitle}>Refer Friends</Text>
                    <Text style={styles.earnItemDesc}>
                      Get 200 points when your friend makes first purchase
                    </Text>
                  </View>
                </View>
                <View style={styles.earnItem}>
                  <Ionicons name="star" size={20} color="#E97A1F" />
                  <View style={styles.earnItemContent}>
                    <Text style={styles.earnItemTitle}>Write Reviews</Text>
                    <Text style={styles.earnItemDesc}>
                      Earn 50 points for each product review
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab("coupons")}
                >
                  <Ionicons name="ticket" size={24} color="#E97A1F" />
                  <Text style={styles.quickActionText}>Redeem Coupons</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setActiveTab("history")}
                >
                  <Ionicons name="time" size={24} color="#E97A1F" />
                  <Text style={styles.quickActionText}>View History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Referral Rewards Tab */}
        {activeTab === "referral" && (
          <View style={styles.referralContainer}>
            {/* Referral Card */}
            <View style={styles.referralCard}>
              <View style={styles.referralCardHeader}>
                <Ionicons name="people" size={40} color="#E97A1F" />
                <Text style={styles.referralCardTitle}>Refer & Earn</Text>
                <Text style={styles.referralCardSubtitle}>
                  Share your code and earn rewards
                </Text>
              </View>

              {/* Referral Code */}
              <View style={styles.referralCodeContainer}>
                <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCode}>{referralCode}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => {
                      // Copy to clipboard functionality
                    }}
                  >
                    <Ionicons name="copy-outline" size={20} color="#E97A1F" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Referral Stats */}
              <View style={styles.referralStats}>
                <View style={styles.referralStat}>
                  <Text style={styles.referralStatValue}>{totalReferrals}</Text>
                  <Text style={styles.referralStatLabel}>Total Referrals</Text>
                </View>
                <View style={styles.referralStatDivider} />
                <View style={styles.referralStat}>
                  <Text style={styles.referralStatValue}>{referralEarnings}</Text>
                  <Text style={styles.referralStatLabel}>Points Earned</Text>
                </View>
              </View>

              {/* Share Button */}
              <TouchableOpacity style={styles.shareBtn}>
                <Ionicons name="share-social" size={20} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share Referral Code</Text>
              </TouchableOpacity>
            </View>

            {/* How It Works */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How It Works</Text>
              <View style={styles.howItWorks}>
                <View style={styles.howItWorksItem}>
                  <View style={styles.howItWorksNumber}>
                    <Text style={styles.howItWorksNumberText}>1</Text>
                  </View>
                  <View style={styles.howItWorksContent}>
                    <Text style={styles.howItWorksTitle}>Share Your Code</Text>
                    <Text style={styles.howItWorksDesc}>
                      Share your referral code with friends and family
                    </Text>
                  </View>
                </View>
                <View style={styles.howItWorksItem}>
                  <View style={styles.howItWorksNumber}>
                    <Text style={styles.howItWorksNumberText}>2</Text>
                  </View>
                  <View style={styles.howItWorksContent}>
                    <Text style={styles.howItWorksTitle}>They Sign Up</Text>
                    <Text style={styles.howItWorksDesc}>
                      Your friend signs up using your referral code
                    </Text>
                  </View>
                </View>
                <View style={styles.howItWorksItem}>
                  <View style={styles.howItWorksNumber}>
                    <Text style={styles.howItWorksNumberText}>3</Text>
                  </View>
                  <View style={styles.howItWorksContent}>
                    <Text style={styles.howItWorksTitle}>You Both Earn</Text>
                    <Text style={styles.howItWorksDesc}>
                      You get 200 points when they make their first purchase
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <View style={styles.couponsContainer}>
            {getFilteredCoupons().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No coupons available</Text>
                <Text style={styles.emptySubtext}>
                  Start shopping to unlock exclusive coupons
                </Text>
              </View>
            ) : (
              getFilteredCoupons().map((coupon, index) => (
                <View
                  key={coupon.id}
                  style={[
                    styles.couponCard,
                    index === getFilteredCoupons().length - 1 && styles.couponCardLast,
                  ]}
                >
                  <View style={styles.couponCardLeft}>
                    <View style={styles.couponDiscountBox}>
                      <Text style={styles.couponDiscount}>{coupon.discount}</Text>
                    </View>
                    <View style={styles.couponInfo}>
                      <Text style={styles.couponTitle}>{coupon.title}</Text>
                      <Text style={styles.couponDescription}>{coupon.description}</Text>
                      <View style={styles.couponMeta}>
                        <Text style={styles.couponCode}>Code: {coupon.code}</Text>
                        <Text style={styles.couponExpiry}>
                          Expires: {coupon.expiryDate}
                        </Text>
                      </View>
                      <Text style={styles.couponMinPurchase}>
                        Min. purchase: {coupon.minPurchase}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.couponCardRight}>
                    <View
                      style={[
                        styles.couponStatusBadge,
                        {
                          backgroundColor: getCouponStatusColor(coupon.status) + "20",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.couponStatusDot,
                          { backgroundColor: getCouponStatusColor(coupon.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.couponStatusText,
                          { color: getCouponStatusColor(coupon.status) },
                        ]}
                      >
                        {coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1)}
                      </Text>
                    </View>
                    {coupon.status === "available" && (
                      <TouchableOpacity style={styles.applyBtn}>
                        <Text style={styles.applyBtnText}>Apply</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Rewards History Tab */}
        {activeTab === "history" && (
          <View style={styles.historyContainer}>
            {getFilteredHistory().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No history found</Text>
                <Text style={styles.emptySubtext}>
                  Your reward transactions will appear here
                </Text>
              </View>
            ) : (
              getFilteredHistory().map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyCard,
                    index === getFilteredHistory().length - 1 && styles.historyCardLast,
                  ]}
                >
                  <View style={styles.historyCardLeft}>
                    <View
                      style={[
                        styles.historyIcon,
                        {
                          backgroundColor: getHistoryTypeColor(item.type) + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          item.type === "earned"
                            ? "add-circle"
                            : item.type === "redeemed"
                            ? "remove-circle"
                            : "close-circle"
                        }
                        size={24}
                        color={getHistoryTypeColor(item.type)}
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDescription}>
                        {item.description}
                      </Text>
                      <Text style={styles.historyDate}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={styles.historyCardRight}>
                    <Text
                      style={[
                        styles.historyPoints,
                        {
                          color:
                            item.type === "earned"
                              ? "#4CAF50"
                              : item.type === "redeemed"
                              ? "#FF9800"
                              : "#F44336",
                        },
                      ]}
                    >
                      {item.points > 0 ? "+" : ""}
                      {item.points}
                    </Text>
                    <View
                      style={[
                        styles.historyStatusBadge,
                        {
                          backgroundColor: getHistoryTypeColor(item.type) + "20",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.historyStatusDot,
                          { backgroundColor: getHistoryTypeColor(item.type) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.historyStatusText,
                          { color: getHistoryTypeColor(item.type) },
                        ]}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    position: "relative",
  },
  headerTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 4,
    zIndex: 10,
  },
  tabsContainer: {
    backgroundColor: "transparent",
    marginBottom: 0,
    paddingBottom: 0,
  },
  tabsContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -12,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E97A1F",
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  // Points Tab Styles
  pointsContainer: {
    flex: 1,
  },
  pointsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pointsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  pointsCardInfo: {
    marginLeft: 16,
    flex: 1,
  },
  pointsLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
  },
  pointsCardFooter: {
    flexDirection: "row",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  pointsStat: {
    flex: 1,
  },
  pointsStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  pointsStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
  },
  pointsStatDivider: {
    width: 1,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  earnCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  earnItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  earnItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  earnItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  earnItemDesc: {
    fontSize: 12,
    color: "#666",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    marginTop: 8,
  },
  // Referral Tab Styles
  referralContainer: {
    flex: 1,
  },
  referralCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  referralCardHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  referralCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginTop: 12,
    marginBottom: 4,
  },
  referralCardSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  referralCodeContainer: {
    marginBottom: 20,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  referralCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  referralCode: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 2,
  },
  copyBtn: {
    padding: 8,
  },
  referralStats: {
    flexDirection: "row",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    marginBottom: 20,
  },
  referralStat: {
    flex: 1,
    alignItems: "center",
  },
  referralStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E97A1F",
    marginBottom: 4,
  },
  referralStatLabel: {
    fontSize: 12,
    color: "#666",
  },
  referralStatDivider: {
    width: 1,
    backgroundColor: "#E5E5E5",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E97A1F",
    borderRadius: 12,
    padding: 16,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  howItWorks: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  howItWorksItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  howItWorksNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E97A1F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  howItWorksNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  howItWorksContent: {
    flex: 1,
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  howItWorksDesc: {
    fontSize: 12,
    color: "#666",
  },
  // Coupons Tab Styles
  couponsContainer: {
    flex: 1,
  },
  couponCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  couponCardLast: {
    marginBottom: 0,
  },
  couponCardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  couponDiscountBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E97A1F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  couponDiscount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  couponMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  couponExpiry: {
    fontSize: 11,
    color: "#999",
  },
  couponMinPurchase: {
    fontSize: 11,
    color: "#666",
  },
  couponCardRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  couponStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  couponStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  couponStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  applyBtn: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // History Tab Styles
  historyContainer: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyCardLast: {
    marginBottom: 0,
  },
  historyCardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "#999",
  },
  historyCardRight: {
    alignItems: "flex-end",
  },
  historyPoints: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  historyStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  historyStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});


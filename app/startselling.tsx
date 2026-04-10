import React from "react";

import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SELLER_START_URL = "https://flintnthread.in/seller/index";
const SELLER_LOGIN_URL = "https://flintnthread.in/seller/login";

export default function SellerScreen() {
  const videoLink = "https://youtu.be/l-lBX-g2tEY?si=EXrHyaGc0_jtMPLD";
  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>


        {/* Main Card */}
        <LinearGradient
          colors={["#fff7ed", "#ffedd5", "#fef3c7"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mainSection}
        >
          <View style={styles.header}>
            <Image
              source={require("../assets/images/f&tlogoFull.png")}
              style={styles.logo}
            />
            <TouchableOpacity
              style={styles.headerSellerLink}
              onPress={() => Linking.openURL(SELLER_LOGIN_URL)}
              activeOpacity={0.75}
            >
              <Ionicons name="storefront-outline" size={18} color="#9a3412" />
              <Text style={styles.headerSellerLinkText}>Seller login</Text>
              <Ionicons name="chevron-forward" size={16} color="#c2410c" />
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroGlowOrb} />

            <LinearGradient
              colors={["#fb923c", "#f97316", "#ea580c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroFrame}
            >
              <View style={styles.heroCard}>
                <View style={styles.heroLiveBadge}>
                  <View style={styles.heroLiveDot} />
                  <Text style={styles.heroLiveBadgeText}>Seller perks live</Text>
                </View>

                <Text style={styles.heroKicker}>Flint & Thread marketplace</Text>

                <Text style={styles.title}>
                  <Text style={styles.titleAccent}>Sell smarter.</Text>
                  {"\n"}
                  <Text style={styles.titleStrong}>Grow everywhere.</Text>
                  {"\n"}
                  <Text style={styles.titleMuted}>
                    From local studios to global brands — one storefront flow.
                  </Text>
                </Text>

                <View style={styles.heroCtaRow}>
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => Linking.openURL(SELLER_START_URL)}
                    style={styles.heroCtaPrimaryWrap}
                  >
                    <LinearGradient
                      colors={["#18181b", "#27272a"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.heroCtaPrimary}
                    >
                      <Text style={styles.heroCtaPrimaryText}>Start selling</Text>
                      <Ionicons name="arrow-forward-circle" size={22} color="#fdba74" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.offerStrip}>
              <LinearGradient
                colors={["rgba(255,255,255,0.95)", "rgba(255,247,237,0.92)"]}
                style={styles.offerStripCard}
              >
                <View style={styles.offerStripHeader}>
                  <Ionicons name="sparkles" size={18} color="#ea580c" />
                  <Text style={styles.offerTitle}>Free banner ads — live now</Text>
                </View>

                <View style={styles.offerPoints}>
                  <View style={styles.pointItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#c2410c" />
                    <Text style={styles.pointText}>List new products faster</Text>
                  </View>

                  <View style={styles.pointItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#c2410c" />
                    <Text style={styles.pointText}>Price more competitively</Text>
                  </View>

                  <View style={styles.pointItem}>
                    <Ionicons name="checkmark-circle" size={15} color="#c2410c" />
                    <Text style={styles.pointText}>Savings back into your business</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Image
              source={require("../assets/images/image1.png")}
              style={styles.heroImage}
            />
          </View>
        </LinearGradient>

        {/* Features Grid */}
        <View style={styles.grid}>
          <View style={styles.box}>
            <Ionicons name="people-outline" size={34} color="#1a73e8" />
            <Text style={styles.boxText}>₹199 registration fee</Text>
          </View>

          <View style={styles.box}>
            <Ionicons name="wallet-outline" size={34} color="#1a73e8" />
            <Text style={styles.boxText}>7 days secure payments</Text>
          </View>

          <View style={styles.box}>
            <Ionicons name="pricetag-outline" size={34} color="#1a73e8" />
            <Text style={styles.boxText}>Low commission fees</Text>
          </View>

          <View style={styles.box}>
            <Ionicons name="call-outline" size={34} color="#1a73e8" />
            <Text style={styles.boxText}>24x7 Seller Support</Text>
          </View>
        </View>

        {/* Fee Drop Highlights Section */}
        <View style={styles.feeDropSection}>
          <View style={styles.feeDropCard}>
            <Text style={styles.feeDropTitle}>
              Fee Drop{"\n"}Highlights
            </Text>

            <View style={styles.highlightRow}>
              <View style={styles.highlightItem}>
                <View style={styles.zeroBadge}>
                  <Text style={styles.zeroBadgeText}>Zero</Text>
                </View>
                <Text style={styles.highlightMainText}>Zero Delivery fee</Text>
                <Text style={styles.highlightSubText}>unlimited products</Text>
              </View>

              <View style={styles.highlightItem}>
                <Image
                  source={require("../assets/images/image2.png")}
                  style={styles.highlightIcon}
                />
                <Text style={styles.highlightMainText}>Security payments</Text>
                <Text style={styles.highlightSubText}>
                  (Easy Ship Products from local to global)
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Image
                  source={require("../assets/images/image3.png")}
                  style={styles.highlightIcon}
                />
                <Text style={styles.highlightMainText}>Retailers & Wholesalers</Text>
                <Text style={styles.highlightSubText}>
                  small boutiques to large manufacturers
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Image
                  source={require("../assets/images/image4.png")}
                  style={styles.highlightIcon}
                />
                <Text style={styles.highlightMainText}>Fashion Designers</Text>
                <Text style={styles.highlightSubText}>Fashion Brands</Text>
                <Text style={styles.highlightSubText}></Text>
              </View>
            </View>

            <TouchableOpacity style={styles.knowMoreBtn}>
              <Text style={styles.knowMoreText}>Know more</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* banner */}

        {/* Online Selling Section */}
        <View style={styles.onlineSection}>
          <Image
            source={require("../assets/images/image2.png")}
            style={styles.onlineImage}
          />

          <View style={styles.onlineContent}>
            <Text style={styles.onlineTitle}>
              Online Selling made{"\n"}Simple
            </Text>

            <Text style={styles.onlineDesc}>
              Become a Flint and Thread  seller and start{" "}
              <Text style={styles.highlightPink}>selling{"\n"}products online</Text>
              {" "}at 15% commission to{"\n"}crores of customers
            </Text>
          </View>
        </View>
        {/* why selling on flint and thread */}


        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>Why Sell On Flint and Thread?</Text>

          <View style={styles.whyCard}>
            <Text style={styles.whyPinkText}>15%</Text>
            <Text style={styles.whyBlackText}>Commission</Text>
            <Text style={styles.whyDesc}>
              Sell your products online at 15% commission and enjoy a hassle-free
              selling experience on Flint and Thread.
            </Text>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.whyPinkText}>10L</Text>
            <Text style={styles.whyBlackText}>Customers</Text>
            <Text style={styles.whyDesc}>
              Our platform is designed to support sellers of all sizes and types.
              From individual artisans to large manufacturers
            </Text>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.whyPinkText}>12000+</Text>
            <Text style={styles.whyBlackText}>Pincode Served</Text>
            <Text style={styles.whyDesc}>
              Receive orders from all over India and sell products online to thousands
              of customers across 12000+ pincodes.
            </Text>
          </View>

          <View style={styles.whyCard}>
            <Text style={styles.whyPinkText}>Free of Cost</Text>
            <Text style={styles.whyBlackText}>Delivery</Text>
            <Text style={styles.whyDesc}>
              Enjoy the Free of  cost across India with our logistics
              partners, and offer fast delivery to your customers.
            </Text>
          </View>
        </View>


        {/* how to sell */}

      
      


 

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f3f3f3",
  },

  container: {
    flex: 1,
    backgroundColor: "#f3f3f3",
  },

  topBar: {
    backgroundColor: "#e5ba84",
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    marginRight: 10,
  },



  qrBtn: {
    marginLeft: 12,
  },

  mainSection: {
    paddingBottom: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
  },

  logo: {
    width: 168,
    height: 72,
    resizeMode: "contain",
  },

  headerSellerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1,
    borderColor: "rgba(234,88,12,0.25)",
  },

  headerSellerLinkText: {
    color: "#9a3412",
    fontSize: 14,
    fontWeight: "700",
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    position: "relative",
  },

  heroGlowOrb: {
    position: "absolute",
    top: -20,
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(251,146,60,0.22)",
    opacity: 0.9,
  },

  heroFrame: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 28,
    padding: 3,
    shadowColor: "#c2410c",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },

  heroCard: {
    borderRadius: 25,
    backgroundColor: "#fffdfa",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    overflow: "hidden",
  },

  heroLiveBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(254,243,199,0.9)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
    marginBottom: 14,
  },

  heroLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },

  heroLiveBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400e",
    letterSpacing: 0.3,
  },

  heroKicker: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#a16207",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#1c1917",
    textAlign: "center",
  },

  titleAccent: {
    color: "#ea580c",
    fontWeight: "900",
    fontSize: 32,
    lineHeight: 38,
  },

  titleStrong: {
    color: "#0f172a",
    fontWeight: "900",
  },

  titleMuted: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    color: "#57534e",
    marginTop: 10,
  },

  heroCtaRow: {
    marginTop: 22,
    gap: 12,
  },

  heroCtaPrimaryWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },

  heroCtaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  heroCtaPrimaryText: {
    color: "#fafafa",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  offerStrip: {
    marginTop: 22,
    width: "100%",
    maxWidth: 400,
    alignItems: "stretch",
  },

  offerStripCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(234,88,12,0.18)",
  },

  offerStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },

  offerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#c2410c",
  },

  offerPoints: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,237,213,0.55)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.22)",
  },

  pointItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },

  pointText: {
    fontSize: 13,
    color: "#44403c",
    marginLeft: 8,
    fontWeight: "600",
  },

  heroImage: {
    width: "100%",
    height: 360,
    resizeMode: "contain",
    marginTop: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff",
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  box: {
    width: "50%",
    paddingVertical: 24,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#eee",
  },

  boxText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  registerSection: {
    flexDirection: "row",
    padding: 20,
    marginTop: 16,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  registerImage: {
    width: 150,
    height: 220,
    borderRadius: 18,
    marginRight: 14,
    resizeMode: "cover",
  },

  registerContent: {
    flex: 1,
  },

  registerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e26a1b",
    marginBottom: 10,
  },

  registerDesc: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
    lineHeight: 20,
  },

  processTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    color: "#222",
  },

  processItem: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },

  registerBtn: {
    backgroundColor: "#ff7a18",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: "flex-start",
  },

  registerBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },




  feeDropSection: {
    backgroundColor: "#efefef",
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 26,
  },

  feeDropCard: {
    backgroundColor: "#0f1827",
    paddingTop: 48,
    paddingBottom: 42,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  feeDropTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 34,
  },

  highlightRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#f37b20",
    paddingBottom: 8,
  },

  highlightItem: {
    width: "24%",
    alignItems: "center",
  },

  zeroBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f37b20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  zeroBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  highlightIcon: {
    width: 54,
    height: 54,
    resizeMode: "contain",
    marginBottom: 10,
  },

  highlightMainText: {
    fontSize: 11,
    lineHeight: 14,
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },

  highlightSubText: {
    fontSize: 9,
    lineHeight: 12,
    color: "#ffffff",
    textAlign: "center",
    marginTop: 2,
  },

  knowMoreBtn: {
    marginTop: 34,
    backgroundColor: "#ffffff",
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#5b677a",
    paddingVertical: 18,
    paddingHorizontal: 52,
    minWidth: 220,
    alignItems: "center",
  },

  knowMoreText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1d2430",
  },



  onlineSection: {
    backgroundColor: "#efeff1",
    marginTop: 16,
    alignItems: "center",
  },

  onlineImage: {
    width: "100%",
    height: 390,
    resizeMode: "contain",

  },

  onlineContent: {
    paddingHorizontal: 30,
    paddingTop: 34,
    paddingBottom: 44,
  },

  onlineTitle: {
    fontSize: 34,
    lineHeight: 46,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 28,
  },

  onlineDesc: {
    fontSize: 22,
    lineHeight: 36,
    color: "#333333",
    fontWeight: "400",
  },

  highlightPink: {
    color: "#f37b20",
    fontWeight: "700",
  },

  // why selling on fnt
  whySection: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 30,
  },

  whyTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1d324e",
    textAlign: "center",
    marginBottom: 24,
  },

  whyCard: {
    backgroundColor: "#f0f0f3",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 18,
  },

  whyPinkText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#f37b20",
    marginBottom: 8,
  },

  whyBlackText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 14,
  },

  whyDesc: {
    fontSize: 17,
    lineHeight: 30,
    color: "#4a4a4a",
    fontWeight: "400",
  },


  // how to sell


  

});
  

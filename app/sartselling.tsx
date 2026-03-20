import React from "react";

import { useRouter } from "expo-router";
import { Video } from "expo-av";


import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SellerScreen() {
  const videoLink = "https://youtu.be/l-lBX-g2tEY?si=EXrHyaGc0_jtMPLD";
  const router = useRouter();
  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>


        {/* Main Card */}
        <View style={styles.mainSection}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assets/images/f&tlogoFull.png")}
              style={styles.logo}
            />
            <TouchableOpacity
              style={styles.startBtnTop}
              onPress={() => router.push("/sellerlogin")}
            >
              <Text style={styles.startBtnTopText}>Start Selling</Text>
            </TouchableOpacity>

          </View>

          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.title}>
              Sell Smarter. {"\n"}Grow Everywhere.{"\n"}From Local Shops to {"\n"}Global Brands
            </Text>

            <TouchableOpacity
              style={styles.startBtnTop}
              onPress={() => router.push("/sellerlogin")}
            >
              <Text style={styles.startBtnTopText}>Start Selling</Text>
            </TouchableOpacity>

            <View style={styles.offerStrip}>
              <Text style={styles.offerTitle}>Free banner ads Live Now</Text>

              <View style={styles.offerPoints}>
                <View style={styles.pointItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#111" />
                  <Text style={styles.pointText}>List New Products</Text>
                </View>

                <View style={styles.pointItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#111" />
                  <Text style={styles.pointText}>Price More Competitively</Text>
                </View>

                <View style={styles.pointItem}>
                  <Ionicons name="checkmark-circle" size={14} color="#111" />
                  <Text style={styles.pointText}>Fastest Savings Into Business</Text>
                </View>
              </View>
            </View>

            <Image
              source={require("../assets/images/applaunching.png")}
              style={styles.heroImage}
            />
          </View>
        </View>

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
                  source={require("../assets/images/secureimage.png")}
                  style={styles.highlightIcon}
                />
                <Text style={styles.highlightMainText}>Security payments</Text>
                <Text style={styles.highlightSubText}>
                  (Easy Ship Products from local to global)
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Image
                  source={require("../assets/images/fashiimage.png")}
                  style={styles.highlightIcon}
                />
                <Text style={styles.highlightMainText}>Retailers & Wholesalers</Text>
                <Text style={styles.highlightSubText}>
                  small boutiques to large manufacturers
                </Text>
              </View>

              <View style={styles.highlightItem}>
                <Image
                  source={require("../assets/images/manufacimage.png")}
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
            source={require("../assets/images/menn.png")}
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
    backgroundColor: "#f3f3f3",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 50,

  },

  logo: {
    width: 180,
    height: 80,
    resizeMode: "contain",

  },

  startBtnTop: {
    backgroundColor: "#ff7a00",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,

  },

  startBtnTopText: {
    color: "#111",
    fontSize: 18,
    fontWeight: "700",
  },

  hero: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  heroBtn: {
    backgroundColor: "#ff7a00",
    marginTop: 26,
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: "#fff",
  },

  heroBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  offerStrip: {
    marginTop: 28,
    alignItems: "center",
  },

  offerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#f37021",
    marginBottom: 6,
  },

  offerPoints: {
    borderWidth: 1,
    borderStyle: "dotted",
    borderColor: "#f0a15e",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#ffe7d0",
  },

  pointItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },

  pointText: {
    fontSize: 11,
    color: "#222",
    marginLeft: 5,
    fontWeight: "600",
  },

  heroImage: {
    width: "100%",
    height: 360,
    resizeMode: "contain",
    marginTop: 8,
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
  

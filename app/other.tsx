import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OtherScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  ];

  const appVersion = "1.0.0";

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    Alert.alert("Language Changed", `App language changed to ${language}`);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      "Privacy Policy",
      "Our Privacy Policy explains how we collect, use, and protect your personal information. Would you like to view the full policy?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "View Online",
          onPress: () => {
            Linking.openURL("https://example.com/privacy-policy");
          },
        },
      ]
    );
  };

  const handleTermsConditions = () => {
    Alert.alert(
      "Terms & Conditions",
      "Our Terms & Conditions outline the rules and regulations for using our app. Would you like to view the full terms?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "View Online",
          onPress: () => {
            Linking.openURL("https://example.com/terms-conditions");
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    Alert.alert(
      "Rate Our App",
      "Thank you for using our app! Would you like to rate us on the App Store?",
      [
        { text: "Maybe Later", style: "cancel" },
        {
          text: "Rate Now",
          onPress: () => {
            // In a real app, this would open the app store
            Alert.alert("Thank You!", "Redirecting to App Store...");
            // Linking.openURL("app-store-url");
          },
        },
      ]
    );
  };

  const handleNotificationToggle = (type: string) => {
    switch (type) {
      case "all":
        setNotificationsEnabled(!notificationsEnabled);
        if (!notificationsEnabled) {
          setEmailNotifications(true);
          setSmsNotifications(false);
          setPushNotifications(true);
        }
        break;
      case "email":
        setEmailNotifications(!emailNotifications);
        break;
      case "sms":
        setSmsNotifications(!smsNotifications);
        break;
      case "push":
        setPushNotifications(!pushNotifications);
        break;
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
          <Text style={styles.headerTitle}>Other</Text>
          <Text style={styles.headerSubtitle}>
            App settings and information
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color="#E97A1F" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingLabel}>Enable Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive updates about orders and offers
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={() => handleNotificationToggle("all")}
                trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {notificationsEnabled && (
              <>
                <View style={styles.settingDivider} />
                <View style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get updates via email
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={() => handleNotificationToggle("email")}
                trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get updates via SMS
                </Text>
              </View>
              <Switch
                value={smsNotifications}
                onValueChange={() => handleNotificationToggle("sms")}
                trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get instant app notifications
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={() => handleNotificationToggle("push")}
                trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                thumbColor="#FFFFFF"
              />
            </View>
              </>
            )}
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language" size={24} color="#E97A1F" />
            <Text style={styles.sectionTitle}>Language</Text>
          </View>
          <View style={styles.sectionCard}>
            {languages.map((lang, index) => (
              <View key={lang.code}>
                <TouchableOpacity
                  style={styles.languageItem}
                  onPress={() => handleLanguageSelect(lang.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemLeft}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    <Text style={styles.languageNative}>{lang.nativeName}</Text>
                  </View>
                  {selectedLanguage === lang.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
                {index < languages.length - 1 && <View style={styles.settingDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#E97A1F" />
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Text style={styles.infoLabel}>View Privacy Policy</Text>
                <Text style={styles.infoDescription}>
                  Learn how we protect your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Terms & Conditions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#E97A1F" />
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          </View>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={handleTermsConditions}
            activeOpacity={0.7}
          >
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Text style={styles.infoLabel}>View Terms & Conditions</Text>
                <Text style={styles.infoDescription}>
                  Read our terms of service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Rate App Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={24} color="#E97A1F" />
            <Text style={styles.sectionTitle}>Rate App</Text>
          </View>
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={handleRateApp}
            activeOpacity={0.7}
          >
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Text style={styles.infoLabel}>Rate Us on App Store</Text>
                <Text style={styles.infoDescription}>
                  Help us improve by rating the app
                </Text>
              </View>
              <View style={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Ionicons
                    key={index}
                    name="star"
                    size={20}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#E97A1F" />
            <Text style={styles.sectionTitle}>App Version</Text>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Text style={styles.infoLabel}>Current Version</Text>
                <Text style={styles.infoDescription}>
                  You're using the latest version
                </Text>
              </View>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>{appVersion}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Fashion E-Commerce App
          </Text>
          <Text style={styles.footerSubtext}>
            All rights reserved
          </Text>
        </View>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    position: "relative",
  },
  headerTitleContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  languageItemLeft: {
    flex: 1,
  },
  languageName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 13,
    color: "#666",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: "#666",
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
  },
  versionBadge: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  footerText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: "#CCC",
  },
});


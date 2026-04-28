import React, { useCallback, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  Linking,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import HomeBottomTabBar from "../components/HomeBottomTabBar";
import * as ImagePicker from "expo-image-picker";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  mapApiAddressToSavedProfileShape,
  parseServerAddressId,
  splitAddressLines,
  type CreateAddressPayload,
} from "../services/addresses";
import { uploadProfileImage } from "../services/userProfile";
import { fetchEmailLogs } from "../services/emailLogs";
import {
  fetchUnreadNotificationCount,
  getCurrentUserIdFromToken,
} from "../services/pushNotifications";
import api from "../services/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PROMOTE_WITH_US_URL = "https://flintnthread.in/ads-panel/index";
const RECENT_VIEW_SESSION_KEY = "ft_recent_view_session_id";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function extractUserIdFromToken(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const candidates = [payload.userId, payload.id, payload.uid, payload.sub];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return null;
}

type OrderStatus = "all" | "in_progress" | "delivered" | "cancelled" | "returns";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: number;
  total: string;
  /** Set when API provides a product thumbnail; otherwise list shows a neutral placeholder. */
  image: ImageSourcePropType | null;
}

type InvoiceRow = {
  id: number;
  orderId: number;
  invoiceNumber: string;
  invoicePath?: string | null;
};

export default function AccountScreen() {
  const router = useRouter();
  const [activeProfile, setActiveProfile] =
    useState<"sankar" | "new" | string>("sankar");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [accountPhotoUri, setAccountPhotoUri] = useState<string | null>(null);
  const [showAvatarPreviewModal, setShowAvatarPreviewModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  /** When true, Save always appends a new shopper (opened via Add), even if a saved profile is selected. */
  const [isAddingNewShopper, setIsAddingNewShopper] = useState(false);

  // Saved profiles array to support multiple accounts
  interface SavedProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    mobile: string;
    photoUri: string | null;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }

  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [emailActivityCount, setEmailActivityCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadSavedProfilesFromApi = useCallback(async () => {
    try {
      const rows = await fetchAddresses();
      setSavedProfiles(
        rows.map((row) => mapApiAddressToSavedProfileShape(row) as SavedProfile)
      );
    } catch {
      // Keep current list on failure (e.g. offline); avoid blocking the screen.
    }
  }, []);

  const loadEmailActivityFromApi = useCallback(async () => {
    const email = (getCurrentProfileData().email || "").trim();
    if (!email) {
      setEmailActivityCount(0);
      return;
    }

    try {
      const rows = await fetchEmailLogs({ recipient: email });
      setEmailActivityCount(rows.length);
    } catch {
      // Keep existing value when network/API fails.
    }
  }, [activeProfile, savedProfiles, newEmail]);

  const loadNotificationCountFromApi = useCallback(async () => {
    try {
      const userId = await getCurrentUserIdFromToken();
      const count = await fetchUnreadNotificationCount(userId);
      setNotificationCount(count);
    } catch {
      // Keep existing value when network/API fails.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSavedProfilesFromApi();
      void loadEmailActivityFromApi();
      void loadNotificationCountFromApi();
    }, [
      loadSavedProfilesFromApi,
      loadEmailActivityFromApi,
      loadNotificationCountFromApi,
    ])
  );

  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState<"all" | "in_progress" | "delivered" | "cancelled" | "returns">("all");

  const getCurrentProfileData = () => {
    if (activeProfile === "new") {
      return {
        email: newEmail || "newuser@example.com",
      };
    } else if (activeProfile.startsWith("saved_")) {
      const profileId = activeProfile.replace("saved_", "");
      const savedProfile = savedProfiles.find((p) => p.id === profileId);
      if (savedProfile) {
        return {
          email: savedProfile.email,
        };
      }
    }
    return {
      email: "",
    };
  };

  const currentProfile = getCurrentProfileData();

  const getCurrentHelpContact = () => {
    if (activeProfile === "new") {
      return {
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newMobile.trim(),
      };
    }
    if (activeProfile.startsWith("saved_")) {
      const profileId = activeProfile.replace("saved_", "");
      const savedProfile = savedProfiles.find((p) => p.id === profileId);
      return {
        name: savedProfile?.name?.trim() ?? "",
        email: savedProfile?.email?.trim() ?? "",
        phone: savedProfile?.mobile?.trim() ?? "",
      };
    }
    return {
      name: "",
      email: currentProfile.email?.trim() ?? "",
      phone: "",
    };
  };

  const accountAvatarUri = useMemo((): string | null => {
    if (activeProfile === "new" && newPhotoUri) {
      return newPhotoUri;
    }
    if (activeProfile.startsWith("saved_")) {
      const profileId = activeProfile.replace("saved_", "");
      const savedProfile = savedProfiles.find((p) => p.id === profileId);
      return savedProfile?.photoUri ?? null;
    }
    return accountPhotoUri;
  }, [activeProfile, newPhotoUri, savedProfiles, accountPhotoUri]);

  const applyAccountPhotoUri = (photoUri: string) => {
    if (activeProfile === "sankar") {
      setAccountPhotoUri(photoUri);
    } else if (activeProfile === "new") {
      setNewPhotoUri(photoUri);
    } else if (activeProfile.startsWith("saved_")) {
      const profileId = activeProfile.replace("saved_", "");
      setSavedProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, photoUri } : p
        )
      );
    }
  };

  const uploadAccountPhotoFromLocalUri = async (localUri: string) => {
    try {
      const url = await uploadProfileImage(localUri);
      applyAccountPhotoUri(url);
      Alert.alert("Success", "Profile photo updated.");
    } catch (e) {
      let msg = "Could not upload profile photo. Please try again.";
      if (isAxiosError(e)) {
        const status = e.response?.status;
        const d = e.response?.data as
          | { message?: string; error?: string }
          | undefined;
        const serverMsg =
          (typeof d?.message === "string" && d.message) ||
          (typeof d?.error === "string" && d.error);
        if (status === 401 || status === 403) {
          msg =
            serverMsg ||
            "Log in again so your session token is sent with this request.";
        } else {
          msg = serverMsg || e.message || msg;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      Alert.alert("Upload failed", String(msg));
    }
  };

  const handleUpdateAccountPhoto = () => {
    Alert.alert("Update profile photo", "Choose an option", [
      { text: "Camera", onPress: handleAccountPhotoFromCamera },
      { text: "Photo Library", onPress: handleAccountPhotoFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleAccountPhotoFromCamera = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your camera to take a photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadAccountPhotoFromLocalUri(result.assets[0].uri);
    }
  };

  const handleAccountPhotoFromLibrary = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photos to choose a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadAccountPhotoFromLocalUri(result.assets[0].uri);
    }
  };

  const handleNotificationPress = () => {
    router.push("/notifications");
  };

  const handleHelpPress = () => {
    const contact = getCurrentHelpContact();
    router.push({
      pathname: "/help-center",
      params: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
    });
  };

  const handleLanguagePress = () => {
    // Go to existing language selection screen
    router.push("/language");
  };

  const handleMyOrdersPress = () => {
    router.push("/orders");
  };

  const handleRewardsPress = () => {
    router.push("/rewards");
  };


  const handlePaymentMethodsPress = () => {
    router.push("/payment-methods");
  };

  const handleMyActivityPress = async () => {
    const email = (getCurrentProfileData().email || "").trim();
    let userIdParam = "";
    let sessionIdParam = "";
    let latestCount = emailActivityCount;

    try {
      const token = (await AsyncStorage.getItem("token"))?.trim();
      if (token) {
        const userId = extractUserIdFromToken(token);
        if (userId) {
          userIdParam = String(userId);
        }
      }
    } catch {
      // Keep navigation working if token read fails.
    }

    try {
      let storedSessionId =
        (await AsyncStorage.getItem(RECENT_VIEW_SESSION_KEY))?.trim() || "";
      if (!storedSessionId) {
        storedSessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        await AsyncStorage.setItem(RECENT_VIEW_SESSION_KEY, storedSessionId);
      }
      sessionIdParam = storedSessionId;
    } catch {
      // Keep navigation working if session id persistence fails.
    }

    try {
      if (email) {
        const rows = await fetchEmailLogs({ recipient: email });
        latestCount = rows.length;
        setEmailActivityCount(rows.length);
      }
    } catch {
      // Open My Activity screen even if this background refresh fails.
    }

    router.push({
      pathname: "/my-activity",
      params: {
        emailActivityCount: String(latestCount),
        userId: userIdParam,
        sessionId: sessionIdParam,
      },
    });
  };

  const handleBecomeSellerPress = () => {
    router.push("/startselling");
  };

  const handlePromoteWithUsPress = () => {
    Linking.openURL(PROMOTE_WITH_US_URL);
  };

  const handleOtherPress = () => {
    router.push("/other");
  };

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  const handleDownloadInvoice = async () => {
    const orderId = Number(selectedOrder?.id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      Alert.alert("Invoice", "Order ID is missing for this order.");
      return;
    }

    try {
      const { data } = await api.get<{
        success: boolean;
        message?: string;
        data?: InvoiceRow[];
      }>("/api/invoices", {
        params: { orderId: Math.floor(orderId) },
      });

      const rows = Array.isArray(data?.data) ? data.data : [];
      if (rows.length === 0) {
        Alert.alert("Invoice", "Invoice not available yet for this order.");
        return;
      }

      const latest = rows[0];
      const path = String(latest?.invoicePath ?? "").trim();
      if (!path) {
        Alert.alert("Invoice", "Invoice file path is missing.");
        return;
      }

      const baseUrl = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
      const invoiceUrl = /^https?:\/\//i.test(path)
        ? path
        : `${baseUrl}/${path.replace(/^\/+/, "")}`;

      const canOpen = await Linking.canOpenURL(invoiceUrl);
      if (!canOpen) {
        Alert.alert("Invoice", "Could not open invoice URL.");
        return;
      }
      await Linking.openURL(invoiceUrl);
    } catch (e) {
      let msg = "Could not download invoice right now.";
      if (isAxiosError(e)) {
        const serverMsg =
          (typeof e.response?.data?.message === "string" && e.response.data.message) ||
          (typeof e.response?.data?.error === "string" && e.response.data.error);
        msg = serverMsg || e.message || msg;
      } else if (e instanceof Error && e.message) {
        msg = e.message;
      }
      Alert.alert("Invoice", msg);
    }
  };

  // Orders data and functions

  const sampleOrders: Order[] = [
    {
      id: "1",
      orderNumber: "#ORD-2024-001",
      date: "15 Jan 2024",
      status: "delivered",
      items: 2,
      total: "₹2,499",
      image: null,
    },
    {
      id: "2",
      orderNumber: "#ORD-2024-002",
      date: "18 Jan 2024",
      status: "in_progress",
      items: 1,
      total: "₹1,299",
      image: null,
    },
    {
      id: "3",
      orderNumber: "#ORD-2024-003",
      date: "20 Jan 2024",
      status: "cancelled",
      items: 3,
      total: "₹3,999",
      image: null,
    },
    {
      id: "4",
      orderNumber: "#ORD-2024-004",
      date: "22 Jan 2024",
      status: "delivered",
      items: 1,
      total: "₹899",
      image: null,
    },
    {
      id: "5",
      orderNumber: "#ORD-2024-005",
      date: "25 Jan 2024",
      status: "returns",
      items: 2,
      total: "₹1,599",
      image: null,
    },
  ];

  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "#4CAF50";
      case "in_progress":
        return "#FF9800";
      case "cancelled":
        return "#F44336";
      case "returns":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  const getOrderStatusText = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "in_progress":
        return "In Progress";
      case "cancelled":
        return "Cancelled";
      case "returns":
        return "Returns & Refunds";
      default:
        return status;
    }
  };

  const getFilteredOrders = () => {
    if (activeOrderTab === "all") return sampleOrders;
    return sampleOrders.filter((order) => order.status === activeOrderTab);
  };

  const orderTabs: { key: OrderStatus; label: string }[] = [
    { key: "all", label: "All Orders" },
    { key: "in_progress", label: "In Progress" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
    { key: "returns", label: "Returns & Refunds" },
  ];

  const handleSaveNewProfile = async () => {
    if (
      !newName ||
      !newEmail ||
      !newMobile ||
      !newAddress ||
      !newCity ||
      !newState ||
      !newPincode
    ) {
      Alert.alert(
        "Missing info",
        "Please fill in all required fields for the new user."
      );
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(newMobile)) {
      Alert.alert("Invalid mobile", "Please enter a valid 10-digit number.");
      return;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(newPincode)) {
      Alert.alert("Invalid pincode", "Please enter a valid 6-digit pincode.");
      return;
    }

    const editingExisting =
      activeProfile.startsWith("saved_") && !isAddingNewShopper;

    if (editingExisting) {
      const profileId = activeProfile.replace("saved_", "");
      // Update existing profile
      setSavedProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId
            ? {
                ...p,
                name: newName.trim(),
                username: newUsername.trim() || newName.trim(),
                email: newEmail.trim(),
                mobile: newMobile.trim(),
                photoUri: newPhotoUri,
                address: newAddress.trim(),
                city: newCity.trim(),
                state: newState.trim(),
                pincode: newPincode.trim(),
              }
            : p
        )
      );
      setShowAddForm(false);
      setIsAddingNewShopper(false);
      setTimeout(() => {
        Alert.alert("Success", "Profile updated successfully!");
      }, 100);
    } else {
      const { line1, line2 } = splitAddressLines(newAddress);
      const payload: CreateAddressPayload = {
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newMobile.trim().replace(/\D/g, "").slice(0, 10),
        addressLine1: line1,
        addressLine2: line2,
        city: newCity.trim(),
        state: newState.trim(),
        country: "India",
        pincode: newPincode.trim(),
        addressType: "home",
        isDefault: savedProfiles.length === 0,
      };

      let responseBody: unknown;
      try {
        responseBody = await createAddress(payload);
      } catch (e) {
        let msg = "Could not save address. Please try again.";
        if (isAxiosError(e)) {
          const status = e.response?.status;
          const d = e.response?.data as
            | { message?: string; error?: string }
            | undefined;
          const serverMsg =
            (typeof d?.message === "string" && d.message) ||
            (typeof d?.error === "string" && d.error);
          if (status === 401 || status === 403) {
            msg =
              serverMsg ||
              "Access denied. Log in again from the login screen so your session token is sent with this request.";
          } else {
            msg = serverMsg || e.message || msg;
          }
        } else if (e instanceof Error) {
          msg = e.message;
        }
        Alert.alert("Save failed", String(msg));
        return;
      }

      const newId = parseServerAddressId(responseBody);
      await loadSavedProfilesFromApi();
      setShowAddForm(false);
      setIsAddingNewShopper(false);
      if (newId) {
        setActiveProfile(`saved_${newId}` as any);
      }

      setTimeout(() => {
        Alert.alert(
          "Profile saved",
          "New shopper account has been saved successfully!"
        );
      }, 100);
    }

    // Reset form
    setNewName("");
    setNewEmail("");
    setNewMobile("");
    setNewAddress("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setNewUsername("");
    setNewPhotoUri(null);
    setIsAddingNewShopper(false);
  };

  const handleRemoveNewProfile = () => {
    const isSavedAccount = activeProfile.startsWith("saved_");
    Alert.alert(
      "Remove account",
      isSavedAccount
        ? "This shopper will be removed permanently and will no longer appear in your list."
        : "Do you want to remove this shopper?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (isSavedAccount) {
              const profileId = activeProfile.replace("saved_", "");
              try {
                await deleteAddress(profileId);
                await loadSavedProfilesFromApi();
              } catch (e) {
                let msg = "Could not remove this address. Please try again.";
                if (isAxiosError(e)) {
                  const status = e.response?.status;
                  const d = e.response?.data as
                    | { message?: string; error?: string }
                    | undefined;
                  const serverMsg =
                    (typeof d?.message === "string" && d.message) ||
                    (typeof d?.error === "string" && d.error);
                  if (status === 401 || status === 403) {
                    msg =
                      serverMsg ||
                      "Access denied. Log in again and retry.";
                  } else {
                    msg = serverMsg || e.message || msg;
                  }
                } else if (e instanceof Error) {
                  msg = e.message;
                }
                Alert.alert("Remove failed", String(msg));
                return;
              }
            }
            setShowAddForm(false);
            setIsAddingNewShopper(false);
            setActiveProfile("sankar");
            setNewName("");
            setNewEmail("");
            setNewMobile("");
            setNewAddress("");
            setNewCity("");
            setNewState("");
            setNewPincode("");
            setNewUsername("");
            setNewPhotoUri(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card - Enhanced Design */}
        <View style={styles.profileCard}>
          {/* Header Section with Gradient Background */}
          <View style={styles.profileCardHeader}>
            <View style={styles.profileHeaderTop}>
              <View style={styles.profileHeaderTitleBlock}>
                <Text style={styles.profileLabel}>My Account</Text>
                {!!currentProfile.email && (
                  <Text style={styles.profileEmail}>{currentProfile.email}</Text>
                )}
              </View>
              <View style={styles.profileIconsContainer}>
                <TouchableOpacity
                  style={styles.circleIcon}
                  onPress={handleNotificationPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="notifications" size={20} color="#E97A1F" />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notificationCount > 99 ? "99+" : String(notificationCount)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.circleIcon}
                  onPress={handleHelpPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.circleIcon}
                  onPress={handleLanguagePress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="globe" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.accountAvatarSection}>
              <View style={styles.accountAvatarWrap}>
                <TouchableOpacity
                  onPress={() => setShowAvatarPreviewModal(true)}
                  activeOpacity={0.92}
                  accessibilityRole="button"
                  accessibilityLabel="View profile photo"
                >
                  <LinearGradient
                    colors={["#FFB86C", "#E97A1F", "#C45A10"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.accountAvatarRing}
                  >
                    <View style={styles.accountAvatarInner}>
                      {accountAvatarUri ? (
                        <Image
                          source={{ uri: accountAvatarUri }}
                          style={styles.accountAvatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={52} color="#CBD5E1" />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.accountAvatarCamera}
                  onPress={handleUpdateAccountPhoto}
                  activeOpacity={0.85}
                  accessibilityLabel="Change profile photo"
                >
                  <Ionicons name="camera" size={17} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Shoppers Section */}
          <View style={styles.shoppersSection}>
            <Text style={styles.shoppersSectionTitle}>Switch Shopper</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.shopperRowScroll}
            >
              {/* Display all saved profiles */}
              {savedProfiles.length > 0 &&
                savedProfiles.map((profile) => {
                const profileKey = `saved_${profile.id}`;
                const isActive = activeProfile === profileKey;
                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.shopperItem,
                      isActive && styles.shopperItemActive,
                    ]}
                    onPress={() => {
                      setActiveProfile(profileKey);
                      setShowAddForm(false);
                      setIsAddingNewShopper(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.shopperCircle,
                        isActive && styles.shopperCircleActive,
                      ]}
                    >
                      {profile.photoUri ? (
                        <Image
                          source={{ uri: profile.photoUri }}
                          style={styles.shopperCircleImage}
                        />
                      ) : (
                        <Text
                          style={[
                            styles.shopperInitial,
                            isActive && styles.shopperInitialActive,
                          ]}
                        >
                          {(profile.username || profile.name)
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      )}
                      {isActive && (
                        <View style={styles.shopperCheckmark}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.shopperName,
                        isActive && styles.shopperNameActive,
                      ]}
                    >
                      {profile.username || profile.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.shopperItemAdd}
                onPress={() => {
                  // Reset form and open add form (always create a new shopper on Save)
                  setNewName("");
                  setNewEmail("");
                  setNewMobile("");
                  setNewAddress("");
                  setNewCity("");
                  setNewState("");
                  setNewPincode("");
                  setNewUsername("");
                  setNewPhotoUri(null);
                  setIsAddingNewShopper(true);
                  setShowAddForm(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.shopperCircleAdd}>
                  <Ionicons name="add" size={20} color="#E97A1F" />
                </View>
                <Text style={styles.shopperNameAdd}>Add</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Edit account for primary profile */}
        {activeProfile === "sankar" && (
          <View style={styles.profileActionsCard}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => router.push("/settings")}
              activeOpacity={0.7}
            >
              <View style={styles.profileActionIconContainer}>
                <Ionicons name="create" size={18} color="#E97A1F" />
              </View>
              <Text style={styles.profileActionText}>Edit Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        )}

        {/* Edit / remove actions for saved profiles */}
        {activeProfile.startsWith("saved_") && (
          <View style={styles.profileActionsCard}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => {
                const profileId = activeProfile.replace("saved_", "");
                const profile = savedProfiles.find((p) => p.id === profileId);
                if (profile) {
                  setIsAddingNewShopper(false);
                  setNewName(profile.name);
                  setNewEmail(profile.email);
                  setNewMobile(profile.mobile);
                  setNewUsername(profile.username);
                  setNewPhotoUri(profile.photoUri);
                  setNewAddress(profile.address ?? "");
                  setNewCity(profile.city ?? "");
                  setNewState(profile.state ?? "");
                  setNewPincode(profile.pincode ?? "");
                  setShowAddForm(true);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.profileActionIconContainer}>
                <Ionicons name="create" size={18} color="#E97A1F" />
              </View>
              <Text style={styles.profileActionText}>Edit Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>

            <View style={styles.profileActionDivider} />

            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={handleRemoveNewProfile}
              activeOpacity={0.7}
            >
              <View style={[styles.profileActionIconContainer, styles.profileActionIconContainerDanger]}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </View>
              <Text style={styles.profileActionRemoveText}>Remove Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
        )}

        {/* Add new shopper form */}
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>
              {isAddingNewShopper ? "Add new shopper" : "Edit shopper"}
            </Text>

            <Text style={styles.addFieldLabel}>Full Name</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Enter full name"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.addFieldLabel}>Email Address</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Enter email address"
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />

            <Text style={styles.addFieldLabel}>Mobile Number</Text>
            <TextInput
              style={styles.addInput}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              value={newMobile}
              onChangeText={setNewMobile}
              maxLength={10}
            />

            <Text style={styles.addFieldLabel}>Area</Text>
            <TextInput
              style={styles.addInput}
              placeholder="H.no/Area Name"
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
            />

            <Text style={styles.addFieldLabel}>City</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Enter city"
              value={newCity}
              onChangeText={setNewCity}
            />

            <Text style={styles.addFieldLabel}>State</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Enter state"
              value={newState}
              onChangeText={setNewState}
            />

            <Text style={styles.addFieldLabel}>Pincode</Text>
            <TextInput
              style={styles.addInput}
              placeholder="6-digit pincode"
              keyboardType="number-pad"
              maxLength={6}
              value={newPincode}
              onChangeText={setNewPincode}
            />

            <Text style={styles.addFieldLabel}>Username (optional)</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Choose a username"
              value={newUsername}
              onChangeText={setNewUsername}
            />

            <View style={styles.addFormButtons}>
              <TouchableOpacity
                style={styles.addPrimaryButton}
                onPress={handleSaveNewProfile}
              >
                <Text style={styles.addPrimaryText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addSecondaryButton}
                onPress={() => {
                  setIsAddingNewShopper(false);
                  setShowAddForm(false);
                }}
              >
                <Text style={styles.addSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu items */}
        <View style={styles.menuSection}>
          <MenuItem label="My Orders" onPress={handleMyOrdersPress} />
          <MenuItem label="Your Rewards" onPress={handleRewardsPress} />
          <MenuItem label="My Activity" onPress={handleMyActivityPress} />
          <MenuItem label="Become a Seller" onPress={handleBecomeSellerPress} />
          <MenuItem label="Promote with Us" onPress={handlePromoteWithUsPress} />
          <MenuItem label="Other" onPress={handleOtherPress} />
          <MenuItem label="Help Center" onPress={handleHelpPress} />
          <MenuItem label="Settings" onPress={handleSettingsPress} />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace("/login")}
          accessibilityRole="button"
          accessibilityLabel="Log out and go to login"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <Modal
          visible={showAvatarPreviewModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAvatarPreviewModal(false)}
        >
          <View style={styles.fullImageModalContainer}>
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={() => setShowAvatarPreviewModal(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            {accountAvatarUri ? (
              <Image
                source={{ uri: accountAvatarUri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.fullImagePlaceholder}>
                <Ionicons name="person-outline" size={96} color="#94A3B8" />
                <Text style={styles.fullImagePlaceholderText}>
                  No profile photo yet
                </Text>
              </View>
            )}
          </View>
        </Modal>

        {/* My Orders Modal - New Improved Version */}
        <Modal
          visible={showOrdersModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOrdersModal(false)}
        >
          <View style={styles.newOrdersModalOverlay}>
            <View style={styles.newOrdersModalContainer}>
              {/* Header Section */}
              <View style={styles.newOrdersModalHeader}>
                <View style={styles.newOrdersHeaderTop}>
                  <View>
                    <Text style={styles.newOrdersModalTitle}>My Orders</Text>
                    <Text style={styles.newOrdersModalSubtitle}>
                      {getFilteredOrders().length} {getFilteredOrders().length === 1 ? "order" : "orders"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.newOrdersCloseBtn}
                    onPress={() => setShowOrdersModal(false)}
                  >
                    <Ionicons name="close-circle" size={32} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Tabs */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.newOrdersTabsContainer}
                  contentContainerStyle={styles.newOrdersTabsContent}
                >
                  {orderTabs.map((tab) => (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.newOrdersTab,
                        activeOrderTab === tab.key && styles.newOrdersActiveTab,
                      ]}
                      onPress={() => setActiveOrderTab(tab.key)}
                    >
                      <Text
                        style={[
                          styles.newOrdersTabText,
                          activeOrderTab === tab.key && styles.newOrdersActiveTabText,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      {activeOrderTab === tab.key && (
                        <View style={styles.newOrdersTabIndicator} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Orders List */}
              <ScrollView
                style={styles.newOrdersListScroll}
                contentContainerStyle={styles.newOrdersListContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {getFilteredOrders().length === 0 ? (
                  <View style={styles.newOrdersEmptyContainer}>
                    <View style={styles.newOrdersEmptyIcon}>
                      <Ionicons name="receipt-outline" size={80} color="#E0E0E0" />
                    </View>
                    <Text style={styles.newOrdersEmptyText}>No orders found</Text>
                    <Text style={styles.newOrdersEmptySubtext}>
                      {activeOrderTab === "all"
                        ? "You haven't placed any orders yet"
                        : `No ${getOrderStatusText(activeOrderTab).toLowerCase()} orders`}
                    </Text>
                  </View>
                ) : (
                  getFilteredOrders().map((order, index) => (
                    <TouchableOpacity
                      key={order.id}
                      style={[
                        styles.newOrdersCard,
                        index === getFilteredOrders().length - 1 && styles.newOrdersCardLast,
                      ]}
                      onPress={() => {
                        setSelectedOrder(order);
                        setShowOrdersModal(false);
                        setShowOrderDetailsModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.newOrdersCardLeft}>
                        {order.image ? (
                          <Image
                            source={order.image}
                            style={styles.newOrdersCardImage}
                          />
                        ) : (
                          <View
                            style={[
                              styles.newOrdersCardImage,
                              styles.orderImagePlaceholder,
                            ]}
                          >
                            <Ionicons
                              name="image-outline"
                              size={28}
                              color="#94A3B8"
                            />
                          </View>
                        )}
                        <View style={styles.newOrdersCardInfo}>
                          <Text style={styles.newOrdersCardNumber}>
                            {order.orderNumber}
                          </Text>
                          <Text style={styles.newOrdersCardDate}>
                            {order.date}
                          </Text>
                          <View style={styles.newOrdersCardMeta}>
                            <Text style={styles.newOrdersCardItems}>
                              {order.items} {order.items === 1 ? "item" : "items"}
                            </Text>
                            <Text style={styles.newOrdersCardTotal}>
                              {order.total}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.newOrdersCardRight}>
                        <View
                          style={[
                            styles.newOrdersStatusBadge,
                            {
                              backgroundColor:
                                getOrderStatusColor(order.status) + "20",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.newOrdersStatusDot,
                              { backgroundColor: getOrderStatusColor(order.status) },
                            ]}
                          />
                          <Text
                            style={[
                              styles.newOrdersStatusText,
                              { color: getOrderStatusColor(order.status) },
                            ]}
                          >
                            {getOrderStatusText(order.status)}
                          </Text>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#CCCCCC"
                          style={{ marginTop: 8 }}
                        />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Order Details Modal - New Improved Version */}
        <Modal
          visible={showOrderDetailsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowOrderDetailsModal(false);
            setShowOrdersModal(true);
          }}
        >
          <View style={styles.newModalOverlay}>
            <View style={styles.newModalContainer}>
              {/* Header with Status */}
              <View style={styles.newModalHeader}>
                <View style={styles.newModalHeaderTop}>
                  <View>
                    <Text style={styles.newModalOrderLabel}>Order Number</Text>
                    <Text style={styles.newModalOrderNumber}>
                      {selectedOrder?.orderNumber}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.newModalCloseBtn}
                    onPress={() => {
                      setShowOrderDetailsModal(false);
                      setShowOrdersModal(true);
                    }}
                  >
                    <Ionicons name="close-circle" size={28} color="#666" />
                  </TouchableOpacity>
                </View>
                {selectedOrder && (
                  <View style={styles.newModalStatusContainer}>
                    <View
                      style={[
                        styles.newModalStatusBadge,
                        {
                          backgroundColor:
                            getOrderStatusColor(selectedOrder.status) + "20",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.newModalStatusDot,
                          { backgroundColor: getOrderStatusColor(selectedOrder.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.newModalStatusText,
                          { color: getOrderStatusColor(selectedOrder.status) },
                        ]}
                      >
                        {getOrderStatusText(selectedOrder.status)}
                      </Text>
                    </View>
                    <Text style={styles.newModalDate}>{selectedOrder.date}</Text>
                  </View>
                )}
              </View>

              {selectedOrder && (
                <ScrollView
                  style={styles.newModalBody}
                  contentContainerStyle={styles.newModalBodyContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Product Card */}
                  <View style={styles.newModalProductCard}>
                    {selectedOrder.image ? (
                      <Image
                        source={selectedOrder.image}
                        style={styles.newModalProductImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.newModalProductImage,
                          styles.orderImagePlaceholder,
                        ]}
                      >
                        <Ionicons
                          name="image-outline"
                          size={36}
                          color="#94A3B8"
                        />
                      </View>
                    )}
                    <View style={styles.newModalProductInfo}>
                      <Text style={styles.newModalProductName}>
                        Product Name {selectedOrder.id}
                      </Text>
                      <Text style={styles.newModalProductMeta}>
                        Quantity: {selectedOrder.items} • {selectedOrder.total}
                      </Text>
                      <View style={styles.newModalProductActions}>
                        <TouchableOpacity style={styles.newModalProductActionBtn}>
                          <Ionicons name="heart-outline" size={16} color="#666" />
                          <Text style={styles.newModalProductActionText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.newModalProductActionBtn}>
                          <Ionicons name="share-outline" size={16} color="#666" />
                          <Text style={styles.newModalProductActionText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Order Timeline */}
                  <View style={styles.newModalSection}>
                    <Text style={styles.newModalSectionTitle}>Order Timeline</Text>
                    <View style={styles.newModalTimeline}>
                      <View style={styles.newModalTimelineItem}>
                        <View style={styles.newModalTimelineDot} />
                        <View style={styles.newModalTimelineContent}>
                          <Text style={styles.newModalTimelineLabel}>Order Placed</Text>
                          <Text style={styles.newModalTimelineDate}>
                            {selectedOrder.date}, 10:00 AM
                          </Text>
                        </View>
                      </View>
                      <View style={styles.newModalTimelineItem}>
                        <View
                          style={[
                            styles.newModalTimelineDot,
                            selectedOrder.status !== "cancelled" &&
                              styles.newModalTimelineDotActive,
                          ]}
                        />
                        <View style={styles.newModalTimelineContent}>
                          <Text style={styles.newModalTimelineLabel}>Confirmed</Text>
                          <Text style={styles.newModalTimelineDate}>
                            {selectedOrder.date}, 10:15 AM
                          </Text>
                        </View>
                      </View>
                      {selectedOrder.status === "delivered" ||
                      selectedOrder.status === "in_progress" ? (
                        <View style={styles.newModalTimelineItem}>
                          <View
                            style={[
                              styles.newModalTimelineDot,
                              styles.newModalTimelineDotActive,
                            ]}
                          />
                          <View style={styles.newModalTimelineContent}>
                            <Text style={styles.newModalTimelineLabel}>
                              {selectedOrder.status === "delivered"
                                ? "Delivered"
                                : "In Transit"}
                            </Text>
                            <Text style={styles.newModalTimelineDate}>
                              {selectedOrder.status === "delivered"
                                ? "18 Jan 2024, 03:30 PM"
                                : "Expected: 25 Jan 2024"}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Price Breakdown */}
                  <View style={styles.newModalSection}>
                    <Text style={styles.newModalSectionTitle}>Price Breakdown</Text>
                    <View style={styles.newModalPriceRow}>
                      <Text style={styles.newModalPriceLabel}>Item Total</Text>
                      <Text style={styles.newModalPriceValue}>
                        {selectedOrder.total}
                      </Text>
                    </View>
                    <View style={styles.newModalPriceRow}>
                      <Text style={styles.newModalPriceLabel}>Delivery Charges</Text>
                      <Text style={styles.newModalPriceValue}>₹99</Text>
                    </View>
                    <View style={styles.newModalPriceRow}>
                      <Text style={styles.newModalPriceLabel}>Tax & Charges</Text>
                      <Text style={styles.newModalPriceValue}>₹0</Text>
                    </View>
                    <View style={styles.newModalDivider} />
                    <View style={styles.newModalPriceRow}>
                      <Text style={styles.newModalTotalLabel}>Total Amount</Text>
                      <Text style={styles.newModalTotalValue}>
                        {selectedOrder.total}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.newModalSection}>
                    <Text style={styles.newModalSectionTitle}>Quick Actions</Text>
                    <View style={styles.newModalQuickActions}>
                      {selectedOrder.status === "in_progress" && (
                        <>
                          <TouchableOpacity
                            style={styles.newModalQuickActionBtn}
                            onPress={() => router.push("/orders")}
                          >
                            <Ionicons name="location" size={20} color="#E97A1F" />
                            <Text style={styles.newModalQuickActionText}>
                              Track Order
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.newModalQuickActionBtn}
                            onPress={() => {
                              Alert.alert(
                                "Cancel Order",
                                "Are you sure you want to cancel this order?",
                                [
                                  { text: "No", style: "cancel" },
                                  {
                                    text: "Yes",
                                    style: "destructive",
                                    onPress: () => {
                                      Alert.alert("Order Cancelled");
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Ionicons name="close-circle" size={20} color="#F44336" />
                            <Text
                              style={[
                                styles.newModalQuickActionText,
                                { color: "#F44336" },
                              ]}
                            >
                              Cancel Order
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {selectedOrder.status === "delivered" && (
                        <>
                          <TouchableOpacity
                            style={styles.newModalQuickActionBtn}
                            onPress={() => router.push("/orders")}
                          >
                            <Ionicons name="cart" size={20} color="#E97A1F" />
                            <Text style={styles.newModalQuickActionText}>
                              Buy Again
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.newModalQuickActionBtn}
                            onPress={() => router.push("/orders")}
                          >
                            <Ionicons name="return-down-back" size={20} color="#2196F3" />
                            <Text
                              style={[
                                styles.newModalQuickActionText,
                                { color: "#2196F3" },
                              ]}
                            >
                              Return / Replace
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        style={styles.newModalQuickActionBtn}
                        onPress={handleDownloadInvoice}
                      >
                        <Ionicons name="receipt" size={20} color="#666" />
                        <Text style={styles.newModalQuickActionText}>
                          Download Invoice
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.newModalQuickActionBtn}
                        onPress={() => router.push("/orders")}
                      >
                        <Ionicons name="help-circle" size={20} color="#666" />
                        <Text style={styles.newModalQuickActionText}>Need Help?</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
      <HomeBottomTabBar />
    </View>
  );
}

type MenuItemProps = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
};

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress, icon, iconColor = "#666" }) => {
  // Map labels to icons if icon not provided
  const getIconForLabel = (label: string): keyof typeof Ionicons.glyphMap => {
    if (icon) return icon;
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "My Orders": "receipt-outline",
      "Your Rewards": "gift-outline",
      "My Activity": "time-outline",
      "Become a Seller": "storefront-outline",
      "Promote with Us": "megaphone-outline",
      "Other": "ellipsis-horizontal-outline",
      "Help Center": "help-circle-outline",
      "Settings": "settings-outline",
    };
    return iconMap[label] || "chevron-forward-outline";
  };

  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={getIconForLabel(label)} size={20} color={iconColor} />
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#000" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  topRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginTop: 24,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  profileCardHeader: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  profileHeaderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileHeaderTitleBlock: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  profileIconsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  accountAvatarSection: {
    alignItems: "center",
    paddingBottom: 4,
  },
  accountAvatarWrap: {
    position: "relative",
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E97A1F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 12,
  },
  accountAvatarInner: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  accountAvatarImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  accountAvatarCamera: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E97A1F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    paddingHorizontal: 4,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  profileLabel: {
    fontSize: 22,
    color: "#1A1A1A",
    marginBottom: 6,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 0,
  },
  shoppersSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  shoppersSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  shopperRowScroll: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: 12,
    paddingVertical: 4,
    paddingRight: 4,
  },
  shopperItem: {
    alignItems: "center",
    position: "relative",
  },
  shopperItemActive: {
    transform: [{ scale: 1.05 }],
  },
  shopperCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  shopperCircleActive: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
    shadowColor: "#E97A1F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shopperCircleImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  shopperCircleAdd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E97A1F",
    borderStyle: "dashed",
  },
  shopperInitial: {
    fontWeight: "700",
    fontSize: 20,
    color: "#666666",
  },
  shopperInitialActive: {
    color: "#FFFFFF",
  },
  shopperCheckmark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  shopperName: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  shopperNameActive: {
    color: "#E97A1F",
    fontWeight: "700",
  },
  shopperItemAdd: {
    alignItems: "center",
  },
  shopperNameAdd: {
    fontSize: 12,
    color: "#E97A1F",
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 4,
    marginBottom: 24,
  },
  addForm: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  addFormTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  addFieldLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: "#555555",
  },
  addInput: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: "#FAFAFA",
  },
  addFormButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  addPrimaryButton: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  addSecondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginLeft: 12,
  },
  addSecondaryText: {
    fontSize: 13,
    color: "#555555",
  },
  profileActionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  profileActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: -4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileActionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E97A1F20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileActionIconContainerDanger: {
    backgroundColor: "#F4433620",
  },
  profileActionText: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
  },
  profileActionRemoveText: {
    flex: 1,
    fontSize: 15,
    color: "#F44336",
    fontWeight: "600",
  },
  profileActionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    alignSelf: "center",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 6,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  fullImagePlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    color: "#CBD5E1",
    fontWeight: "600",
  },
  ordersModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  ordersModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  ordersModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  ordersModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  ordersModalCloseButton: {
    padding: 4,
  },
  ordersTabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 0,
    paddingBottom: 0,
  },
  ordersTabsContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
    marginBottom: 0,
  },
  ordersTab: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 0,
    borderRadius: 5,
    backgroundColor: "#F5F5F5",
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  ordersActiveTab: {
    backgroundColor: "#E97A1F",
  },
  ordersTabText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    lineHeight: 13,
  },
  ordersActiveTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 11,
    lineHeight: 13,
  },
  ordersListContainer: {
    flex: 1,
    marginTop: 0,
  },
  ordersListContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
    marginTop: 0,
  },
  ordersOrderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ordersOrderImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  ordersOrderContent: {
    flex: 1,
  },
  ordersOrderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  ordersOrderInfo: {
    flex: 1,
  },
  ordersOrderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  ordersOrderDate: {
    fontSize: 11,
    color: "#999999",
  },
  ordersStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  ordersStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  ordersOrderBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ordersItemsText: {
    fontSize: 12,
    color: "#666666",
  },
  ordersTotalText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  ordersEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  ordersEmptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  ordersEmptySubtext: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  newOrdersModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  newOrdersModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "88%",
    flexDirection: "column",
  },
  newOrdersModalHeader: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexShrink: 0,
  },
  newOrdersHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  newOrdersModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  newOrdersModalSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  newOrdersCloseBtn: {
    padding: 4,
  },
  newOrdersTabsContainer: {
    backgroundColor: "transparent",
    marginBottom: 0,
    paddingBottom: 0,
    flexShrink: 0,
  },
  newOrdersTabsContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  newOrdersTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  newOrdersActiveTab: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  newOrdersTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  newOrdersActiveTabText: {
    color: "#FFFFFF",
  },
  newOrdersTabIndicator: {
    position: "absolute",
    bottom: -12,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E97A1F",
  },
  newOrdersListScroll: {
    flex: 1,
    minHeight: 0,
  },
  newOrdersListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  newOrdersCard: {
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
  newOrdersCardLast: {
    marginBottom: 0,
  },
  newOrdersCardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  newOrdersCardImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 14,
  },
  orderImagePlaceholder: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  newOrdersCardInfo: {
    flex: 1,
    justifyContent: "center",
  },
  newOrdersCardNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  newOrdersCardDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  newOrdersCardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newOrdersCardItems: {
    fontSize: 12,
    color: "#666",
  },
  newOrdersCardTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E97A1F",
  },
  newOrdersCardRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  newOrdersStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  newOrdersStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  newOrdersStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  newOrdersEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  newOrdersEmptyIcon: {
    marginBottom: 20,
  },
  newOrdersEmptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  newOrdersEmptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  newModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  newModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: 0,
  },
  newModalHeader: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  newModalHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  newModalOrderLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  newModalOrderNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  newModalCloseBtn: {
    padding: 4,
  },
  newModalStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newModalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  newModalStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  newModalStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  newModalDate: {
    fontSize: 12,
    color: "#666",
  },
  newModalBody: {
    flex: 1,
  },
  newModalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  newModalProductCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  newModalProductImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 16,
  },
  newModalProductInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  newModalProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },
  newModalProductMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  newModalProductActions: {
    flexDirection: "row",
    gap: 12,
  },
  newModalProductActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  newModalProductActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  newModalSection: {
    marginBottom: 24,
  },
  newModalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  newModalTimeline: {
    paddingLeft: 12,
  },
  newModalTimelineItem: {
    flexDirection: "row",
    marginBottom: 20,
    position: "relative",
  },
  newModalTimelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E0E0E0",
    marginRight: 16,
    marginTop: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  newModalTimelineDotActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  newModalTimelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  newModalTimelineLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  newModalTimelineDate: {
    fontSize: 12,
    color: "#666",
  },
  newModalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  newModalPriceLabel: {
    fontSize: 14,
    color: "#666",
  },
  newModalPriceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  newModalDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 12,
  },
  newModalTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  newModalTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E97A1F",
  },
  newModalQuickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  newModalQuickActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    minWidth: "47%",
  },
  newModalQuickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
});


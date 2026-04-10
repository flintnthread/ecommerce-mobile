import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NotificationPermission from "./notification";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PROMOTE_WITH_US_URL = "https://flintnthread.in/ads-panel/index";

export default function AccountScreen() {
  const router = useRouter();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [activeProfile, setActiveProfile] =
    useState<"sankar" | "kusuma" | "new" | string>("sankar");
  const [showSankar, setShowSankar] = useState(true);
  const [showKusuma, setShowKusuma] = useState(true);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [sankarPhotoUri, setSankarPhotoUri] = useState<string | null>(null);
  const [kusumaPhotoUri, setKusumaPhotoUri] = useState<string | null>(null);
  const [hasNewProfile, setHasNewProfile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Saved profiles array to support multiple accounts
  interface SavedProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    mobile: string;
    photoUri: string | null;
  }

  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState<"all" | "in_progress" | "delivered" | "cancelled" | "returns">("all");

  const getCurrentProfileData = () => {
    if (activeProfile === "kusuma") {
      return {
        name: "Kusuma",
        email: "kusuma@example.com",
      };
    } else if (activeProfile === "new") {
      return {
        name: (newUsername || newName || "New user").trim(),
        email: newEmail || "newuser@example.com",
      };
    } else if (activeProfile.startsWith("saved_")) {
      const profileId = activeProfile.replace("saved_", "");
      const savedProfile = savedProfiles.find((p) => p.id === profileId);
      if (savedProfile) {
        return {
          name: savedProfile.username || savedProfile.name,
          email: savedProfile.email,
        };
      }
    }
    return {
      name: "Sankar",
      email: "sankarp036@gmail.com",
    };
  };

  const currentProfile = getCurrentProfileData();

  const getCurrentImageSource = () => {
    if (activeProfile === "kusuma") {
      if (kusumaPhotoUri) {
        return { uri: kusumaPhotoUri };
      }
      return require("../assets/images/age6.png");
    } else if (activeProfile === "new" && newPhotoUri) {
      return { uri: newPhotoUri };
    } else if (activeProfile.startsWith("saved_")) {
      const profileId = activeProfile.replace("saved_", "");
      const savedProfile = savedProfiles.find((p) => p.id === profileId);
      if (savedProfile && savedProfile.photoUri) {
        return { uri: savedProfile.photoUri };
      }
      return require("../assets/images/age5.png");
    } else {
      // Sankar profile
      if (sankarPhotoUri) {
        return { uri: sankarPhotoUri };
      }
      return require("../assets/images/age5.png");
    }
  };

  const handleUpdateProfilePhoto = async () => {
    Alert.alert(
      "Update Profile Photo",
      "Choose an option",
      [
        {
          text: "Camera",
          onPress: () => handleTakePhotoForCurrentProfile(),
        },
        {
          text: "Photo Library",
          onPress: () => handlePickFromLibraryForCurrentProfile(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleTakePhotoForCurrentProfile = async () => {
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
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      if (activeProfile === "sankar") {
        setSankarPhotoUri(photoUri);
      } else if (activeProfile === "kusuma") {
        setKusumaPhotoUri(photoUri);
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
      Alert.alert("Success", "Profile photo updated successfully!");
    }
  };

  const handlePickFromLibraryForCurrentProfile = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photos to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      if (activeProfile === "sankar") {
        setSankarPhotoUri(photoUri);
      } else if (activeProfile === "kusuma") {
        setKusumaPhotoUri(photoUri);
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
      Alert.alert("Success", "Profile photo updated successfully!");
    }
  };

  const handleNotificationPress = () => {
    router.push("/notifications");
  };

  const handleNotificationAllow = () => {
    setShowNotificationModal(false);
  };

  const handleNotificationDeny = () => {
    setShowNotificationModal(false);
  };

  const handleHelpPress = () => {
    router.push("/help-center");
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

  const handleMyActivityPress = () => {
    router.push("/my-activity");
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

  // Orders data and functions
  type OrderStatus = "all" | "in_progress" | "delivered" | "cancelled" | "returns";

  interface Order {
    id: string;
    orderNumber: string;
    date: string;
    status: OrderStatus;
    items: number;
    total: string;
    image: any;
  }

  const sampleOrders: Order[] = [
    {
      id: "1",
      orderNumber: "#ORD-2024-001",
      date: "15 Jan 2024",
      status: "delivered",
      items: 2,
      total: "₹2,499",
      image: require("../assets/images/age5.png"),
    },
    {
      id: "2",
      orderNumber: "#ORD-2024-002",
      date: "18 Jan 2024",
      status: "in_progress",
      items: 1,
      total: "₹1,299",
      image: require("../assets/images/age6.png"),
    },
    {
      id: "3",
      orderNumber: "#ORD-2024-003",
      date: "20 Jan 2024",
      status: "cancelled",
      items: 3,
      total: "₹3,999",
      image: require("../assets/images/age5.png"),
    },
    {
      id: "4",
      orderNumber: "#ORD-2024-004",
      date: "22 Jan 2024",
      status: "delivered",
      items: 1,
      total: "₹899",
      image: require("../assets/images/age6.png"),
    },
    {
      id: "5",
      orderNumber: "#ORD-2024-005",
      date: "25 Jan 2024",
      status: "returns",
      items: 2,
      total: "₹1,599",
      image: require("../assets/images/age5.png"),
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

  const handleSaveNewProfile = () => {
    if (
      !newName ||
      !newEmail ||
      !newMobile ||
      !newPassword ||
      !newConfirmPassword ||
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

    if (newPassword.length < 6) {
      Alert.alert("Weak password", "Password should be at least 6 characters.");
      return;
    }

    if (newPassword !== newConfirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(newPincode)) {
      Alert.alert("Invalid pincode", "Please enter a valid 6-digit pincode.");
      return;
    }

    // Check if editing existing profile
    if (activeProfile.startsWith("saved_")) {
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
              }
            : p
        )
      );
      setShowAddForm(false);
      setTimeout(() => {
        Alert.alert("Success", "Profile updated successfully!");
      }, 100);
    } else {
      // Create new profile object
      const newProfile: SavedProfile = {
        id: `profile_${Date.now()}`,
        name: newName.trim(),
        username: newUsername.trim() || newName.trim(),
        email: newEmail.trim(),
        mobile: newMobile.trim(),
        photoUri: newPhotoUri,
      };

      // Add to saved profiles array
      setSavedProfiles((prev) => [...prev, newProfile]);
      setHasNewProfile(true);
      setShowAddForm(false);
      
      // Switch to the newly created profile
      setActiveProfile(`saved_${newProfile.id}` as any);
      
      setTimeout(() => {
        Alert.alert("Profile saved", "New shopper account has been saved successfully!");
      }, 100);
    }
    
    // Reset form
    setNewName("");
    setNewEmail("");
    setNewMobile("");
    setNewPassword("");
    setNewConfirmPassword("");
    setNewAddress("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
    setNewUsername("");
    setNewPhotoUri(null);
  };

  const handleRemoveNewProfile = () => {
    Alert.alert("Remove shopper", "Do you want to remove this shopper?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setHasNewProfile(false);
          setShowAddForm(false);
          setActiveProfile("sankar");
          setNewName("");
          setNewEmail("");
          setNewMobile("");
          setNewPassword("");
          setNewConfirmPassword("");
          setNewAddress("");
          setNewCity("");
          setNewState("");
          setNewPincode("");
          setNewUsername("");
          setNewPhotoUri(null);
        },
      },
    ]);
  };

  const handleRemoveBaseProfile = (target: "sankar" | "kusuma") => {
    const label = target === "sankar" ? "Sankar" : "Kusuma";
    Alert.alert(
      "Remove shopper",
      `Do you want to remove ${label} from this list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            if (target === "sankar") {
              setShowSankar(false);
              if (activeProfile === "sankar") {
                if (showKusuma) setActiveProfile("kusuma");
                else if (hasNewProfile) setActiveProfile("new");
              }
            } else {
              setShowKusuma(false);
              if (activeProfile === "kusuma") {
                if (showSankar) setActiveProfile("sankar");
                else if (hasNewProfile) setActiveProfile("new");
              }
            }
          },
        },
      ]
    );
  };

  const handleUploadPhotoPress = async () => {
    Alert.alert(
      "Select Photo",
      "Choose an option",
      [
        {
          text: "Camera",
          onPress: handleTakePhoto,
        },
        {
          text: "Photo Library",
          onPress: handlePickFromLibrary,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    // Request camera permissions
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
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickFromLibrary = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need access to your photos to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewPhotoUri(result.assets[0].uri);
    }
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
            <View style={styles.profileHeaderContent}>
              {/* Avatar with Border */}
              <View style={styles.avatarContainer}>
                <TouchableOpacity
                  onPress={() => setShowFullImageModal(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarBorder}>
                    <Image
                      source={getCurrentImageSource()}
                      style={styles.avatar}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.avatarEditBadge}
                  onPress={handleUpdateProfilePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfoSection}>
                <Text style={styles.profileLabel}>Profile</Text>
                <Text style={styles.profileEmail}>{currentProfile.email}</Text>
                <View style={styles.activeProfileBadge}>
                  <View style={styles.activeProfileDot} />
                  <Text style={styles.activeProfileText}>
                    Shopping for {currentProfile.name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Action Icons */}
            <View style={styles.profileIconsContainer}>
              {/* Notifications with count */}
              <TouchableOpacity
                style={styles.circleIcon}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications" size={20} color="#E97A1F" />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>

              {/* Help / support */}
              <TouchableOpacity
                style={styles.circleIcon}
                onPress={handleHelpPress}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle" size={20} color="#2196F3" />
              </TouchableOpacity>

              {/* Language change */}
              <TouchableOpacity
                style={styles.circleIcon}
                onPress={handleLanguagePress}
                activeOpacity={0.7}
              >
                <Ionicons name="globe" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Shoppers Section */}
          <View style={styles.shoppersSection}>
            <Text style={styles.shoppersSectionTitle}>Switch Shopper</Text>
            <View style={styles.shopperRow}>
              {showSankar && (
                <TouchableOpacity
                  style={[
                    styles.shopperItem,
                    activeProfile === "sankar" && styles.shopperItemActive,
                  ]}
                  onPress={() => setActiveProfile("sankar")}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.shopperCircle,
                      activeProfile === "sankar" && styles.shopperCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.shopperInitial,
                        activeProfile === "sankar" && styles.shopperInitialActive,
                      ]}
                    >
                      S
                    </Text>
                    {activeProfile === "sankar" && (
                      <View style={styles.shopperCheckmark}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.shopperName,
                      activeProfile === "sankar" && styles.shopperNameActive,
                    ]}
                  >
                    Sankar
                  </Text>
                </TouchableOpacity>
              )}

              {showKusuma && (
                <TouchableOpacity
                  style={[
                    styles.shopperItem,
                    activeProfile === "kusuma" && styles.shopperItemActive,
                  ]}
                  onPress={() => setActiveProfile("kusuma")}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.shopperCircle,
                      activeProfile === "kusuma" && styles.shopperCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.shopperInitial,
                        activeProfile === "kusuma" && styles.shopperInitialActive,
                      ]}
                    >
                      K
                    </Text>
                    {activeProfile === "kusuma" && (
                      <View style={styles.shopperCheckmark}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.shopperName,
                      activeProfile === "kusuma" && styles.shopperNameActive,
                    ]}
                  >
                    Kusuma
                  </Text>
                </TouchableOpacity>
              )}

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
                  // Reset form and open add form
                  setNewName("");
                  setNewEmail("");
                  setNewMobile("");
                  setNewPassword("");
                  setNewConfirmPassword("");
                  setNewAddress("");
                  setNewCity("");
                  setNewState("");
                  setNewPincode("");
                  setNewUsername("");
                  setNewPhotoUri(null);
                  setShowAddForm(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.shopperCircleAdd}>
                  <Ionicons name="add" size={20} color="#E97A1F" />
                </View>
                <Text style={styles.shopperNameAdd}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Edit / remove actions for active account */}
        {activeProfile === "sankar" && showSankar && (
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

            <View style={styles.profileActionDivider} />

            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => handleRemoveBaseProfile("sankar")}
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

        {activeProfile === "kusuma" && showKusuma && (
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

            <View style={styles.profileActionDivider} />

            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => handleRemoveBaseProfile("kusuma")}
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

        {/* Edit / remove actions for saved profiles */}
        {activeProfile.startsWith("saved_") && (
          <View style={styles.profileActionsCard}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => {
                const profileId = activeProfile.replace("saved_", "");
                const profile = savedProfiles.find((p) => p.id === profileId);
                if (profile) {
                  // Pre-fill form with existing data
                  setNewName(profile.name);
                  setNewEmail(profile.email);
                  setNewMobile(profile.mobile);
                  setNewUsername(profile.username);
                  setNewPhotoUri(profile.photoUri);
                  setShowAddForm(true);
                  // Update profile on save
                  Alert.alert("Edit Mode", "Update the details and save to update the profile.");
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
            <Text style={styles.addFormTitle}>Add new shopper</Text>

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

            <Text style={styles.addFieldLabel}>Password</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Enter password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.addFieldLabel}>Confirm Password</Text>
            <TextInput
              style={styles.addInput}
              placeholder="Re-enter password"
              secureTextEntry
              value={newConfirmPassword}
              onChangeText={setNewConfirmPassword}
            />

            <Text style={styles.addFieldLabel}>Address</Text>
            <TextInput
              style={styles.addInput}
              placeholder="House / Street, Area"
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

            <Text style={styles.addFieldLabel}>Profile Photo</Text>
            <View style={styles.uploadRow}>
              <View style={styles.uploadPreview}>
                {newPhotoUri ? (
                  <Image
                    source={{ uri: newPhotoUri }}
                    style={styles.uploadPreviewImage}
                  />
                ) : (
                  <Ionicons name="person-outline" size={22} color="#999" />
                )}
              </View>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadPhotoPress}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.uploadButtonText}>Upload photo</Text>
              </TouchableOpacity>
            </View>

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
          <MenuItem label="Payment Methods" onPress={handlePaymentMethodsPress} />
          <MenuItem label="My Activity" onPress={handleMyActivityPress} />
          <MenuItem label="Become a Seller" onPress={handleBecomeSellerPress} />
          <MenuItem label="Promote with Us" onPress={handlePromoteWithUsPress} />
          <MenuItem label="Other" onPress={handleOtherPress} />
          <MenuItem label="Help Center" onPress={handleHelpPress} />
          <MenuItem label="Settings" onPress={handleSettingsPress} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Notification permission modal */}
        <NotificationPermission
          visible={showNotificationModal}
          onAllow={handleNotificationAllow}
          onDeny={handleNotificationDeny}
        />

        {/* Full image modal */}
        <Modal
          visible={showFullImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullImageModal(false)}
        >
          <View style={styles.fullImageModalContainer}>
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={() => setShowFullImageModal(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={getCurrentImageSource()}
              style={styles.fullImage}
              resizeMode="contain"
            />
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
                        <Image
                          source={order.image}
                          style={styles.newOrdersCardImage}
                        />
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
                    <Image
                      source={selectedOrder.image}
                      style={styles.newModalProductImage}
                    />
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
                        onPress={() => router.push("/orders")}
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
      "Payment Methods": "wallet-outline",
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
    paddingBottom: 32,
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
  profileHeaderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    padding: 3,
    borderWidth: 3,
    borderColor: "#E97A1F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E97A1F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DDDDDD",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E97A1F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  profileInfoSection: {
    flex: 1,
    justifyContent: "center",
  },
  profileIconsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
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
    fontSize: 13,
    color: "#999999",
    marginBottom: 4,
    fontWeight: "500",
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  activeProfileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E97A1F20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  activeProfileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E97A1F",
    marginRight: 6,
  },
  activeProfileText: {
    fontSize: 12,
    color: "#E97A1F",
    fontWeight: "600",
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
  shopperRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
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
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  uploadPreview: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  uploadPreviewImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1d324e",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
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



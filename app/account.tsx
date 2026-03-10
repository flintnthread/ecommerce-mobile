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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NotificationPermission from "./notification";
import * as ImagePicker from "expo-image-picker";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AccountScreen() {
  const router = useRouter();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [activeProfile, setActiveProfile] =
    useState<"sankar" | "kusuma" | "new">("sankar");
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
  const [hasNewProfile, setHasNewProfile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeOrderTab, setActiveOrderTab] = useState<"all" | "in_progress" | "delivered" | "cancelled" | "returns">("all");

  const currentProfile =
    activeProfile === "kusuma"
      ? {
          name: "Kusuma",
          email: "kusuma@example.com",
        }
      : activeProfile === "new"
      ? {
          name: (newUsername || newName || "New user").trim(),
          email: newEmail || "newuser@example.com",
        }
      : {
          name: "Sankar",
          email: "sankarp036@gmail.com",
        };

  const getCurrentImageSource = () => {
    if (activeProfile === "kusuma") {
      return require("../assets/images/age6.png");
    } else if (activeProfile === "new" && newPhotoUri) {
      return { uri: newPhotoUri };
    } else {
      return require("../assets/images/age5.png");
    }
  };

  const handleNotificationPress = () => {
    setShowNotificationModal(true);
  };

  const handleNotificationAllow = () => {
    setShowNotificationModal(false);
  };

  const handleNotificationDeny = () => {
    setShowNotificationModal(false);
  };

  const handleHelpPress = () => {
    Alert.alert("Help Center", "Support options will be available here.");
  };

  const handleLanguagePress = () => {
    // Go to existing language selection screen
    router.push("/language");
  };

  const handleMyOrdersPress = () => {
    setShowOrdersModal(true);
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
    setShowAddForm(false);
    setActiveProfile("new");
    setHasNewProfile(true);
    setTimeout(() => {
      Alert.alert("Profile saved", "New shopper details have been saved.");
    }, 100);
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
        {/* Profile card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            onPress={() => setShowFullImageModal(true)}
            activeOpacity={0.8}
          >
            <Image
              source={getCurrentImageSource()}
              style={styles.avatar}
            />
          </TouchableOpacity>

          {/* Right-side quick action icons */}
          <View style={styles.profileIconsContainer}>
            {/* Notifications with count */}
            <TouchableOpacity
              style={styles.circleIcon}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={18} color="#000" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>

            {/* Help / support */}
            <TouchableOpacity
              style={styles.circleIcon}
              onPress={handleHelpPress}
            >
              <Ionicons name="help-circle-outline" size={18} color="#000" />
            </TouchableOpacity>

            {/* Language change */}
            <TouchableOpacity
              style={styles.circleIcon}
              onPress={handleLanguagePress}
            >
              <Ionicons name="globe-outline" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.profileLabel}>Profile</Text>
          <Text style={styles.profileEmail}>{currentProfile.email}</Text>

          <Text style={styles.shoppingFor}>
            Shopping for {currentProfile.name}
          </Text>

          <View style={styles.shopperRow}>
            {showSankar && (
              <TouchableOpacity
                style={styles.shopperItem}
                onPress={() => setActiveProfile("sankar")}
              >
                <View style={styles.shopperCircle}>
                  <Text style={styles.shopperInitial}>S</Text>
                </View>
                <Text style={styles.shopperName}>Sankar</Text>
              </TouchableOpacity>
            )}

            {showKusuma && (
              <TouchableOpacity
                style={styles.shopperItem}
                onPress={() => setActiveProfile("kusuma")}
              >
                <View style={styles.shopperCircle}>
                  <Text style={styles.shopperInitial}>K</Text>
                </View>
                <Text style={styles.shopperName}>Kusuma</Text>
              </TouchableOpacity>
            )}

            {hasNewProfile && (newUsername || newName) ? (
              <TouchableOpacity
                style={styles.shopperItem}
                onPress={() => {
                  setActiveProfile("new");
                  setShowAddForm(false);
                }}
              >
                <View style={styles.shopperCircle}>
                  <Text style={styles.shopperInitial}>
                    {(newUsername || newName)
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.shopperName}>
                  {(newUsername || newName).trim()}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.shopperItem}
              onPress={() => {
                setActiveProfile("new");
                setShowAddForm(true);
              }}
            >
              <View style={styles.shopperCircle}>
                <Text style={styles.shopperInitial}>+</Text>
              </View>
              <Text style={styles.shopperName}>Add</Text>
            </TouchableOpacity>

            <Ionicons
              name="person-circle-outline"
              size={26}
              color="#000"
              style={{ marginLeft: "auto" }}
            />
          </View>
        </View>

        {/* Edit / remove actions for active account */}
        {activeProfile === "sankar" && showSankar && (
          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() =>
                Alert.alert(
                  "Edit account",
                  "Edit options for Sankar can be wired to a detailed edit screen later."
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={16}
                color="#1d324e"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.profileActionText}>Edit account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => handleRemoveBaseProfile("sankar")}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#B00020"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.profileActionRemoveText}>Remove account</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeProfile === "kusuma" && showKusuma && (
          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() =>
                Alert.alert(
                  "Edit account",
                  "Edit options for Kusuma can be wired to a detailed edit screen later."
                )
              }
            >
              <Ionicons
                name="create-outline"
                size={16}
                color="#1d324e"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.profileActionText}>Edit account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => handleRemoveBaseProfile("kusuma")}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#B00020"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.profileActionRemoveText}>Remove account</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasNewProfile && activeProfile === "new" && (
          <View style={styles.profileActionsRow}>
            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color="#1d324e"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.profileActionText}>Edit account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileActionButton}
              onPress={handleRemoveNewProfile}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#B00020"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.profileActionRemoveText}>Remove account</Text>
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
          <MenuItem label="Your Rewards" />
          <MenuItem label="Payment Methods" />
          <MenuItem label="My Activity" />
          <MenuItem label="Other" />
          <MenuItem label="Help Center" onPress={handleHelpPress} />
          <MenuItem label="Settings" onPress={handleLanguagePress} />
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
};

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    marginTop: 24,
    marginBottom: 20,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DDDDDD",
    alignSelf: "center",
    marginBottom: 12,
  },
  profileIconsContainer: {
    position: "absolute",
    right: 16,
    top: 24,
    alignItems: "center",
  },
  circleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F1F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 14,
    paddingHorizontal: 3,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
  profileLabel: {
    textAlign: "center",
    fontSize: 14,
    color: "#777777",
  },
  profileEmail: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  shoppingFor: {
    textAlign: "left",
    fontSize: 13,
    color: "#555555",
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  shopperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  shopperItem: {
    alignItems: "center",
    marginRight: 18,
  },
  shopperCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  shopperInitial: {
    fontWeight: "600",
    fontSize: 16,
  },
  shopperName: {
    fontSize: 12,
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
    marginLeft: 12,
  },
  profileActionText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "500",
  },
  profileActionRemoveText: {
    fontSize: 12,
    color: "#B00020",
    fontWeight: "500",
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
  menuLabel: {
    fontSize: 14,
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



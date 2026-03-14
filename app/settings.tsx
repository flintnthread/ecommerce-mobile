import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SettingsTab = "account" | "address" | "security" | "notifications";

interface Address {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Account Information State
  const [fullName, setFullName] = useState("Sankar P");
  const [email, setEmail] = useState("sankarp036@gmail.com");
  const [phone, setPhone] = useState("9876543210");
  const [dateOfBirth, setDateOfBirth] = useState("15/05/1995");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  // Notification Settings State
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promotionNotifications, setPromotionNotifications] = useState(true);
  const [priceDropNotifications, setPriceDropNotifications] = useState(false);
  const [newArrivalNotifications, setNewArrivalNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Address Management State
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      type: "home",
      name: "Sankar P",
      phone: "9876543210",
      address: "123, Main Street, Apartment 4B",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      isDefault: true,
    },
    {
      id: "2",
      type: "work",
      name: "Sankar P",
      phone: "9876543210",
      address: "456, Tech Park, Floor 5",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560002",
      isDefault: false,
    },
  ]);

  // New Address Form State
  const [newAddressType, setNewAddressType] = useState<"home" | "work" | "other">("home");
  const [newAddressName, setNewAddressName] = useState("");
  const [newAddressPhone, setNewAddressPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: "account", label: "Account Info", icon: "person" },
    { key: "address", label: "Addresses", icon: "location" },
    { key: "security", label: "Security", icon: "lock-closed" },
    { key: "notifications", label: "Notifications", icon: "notifications" },
  ];

  const handleSaveAccount = () => {
    if (!fullName || !email || !phone) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }
    Alert.alert("Success", "Account information updated successfully!");
    setShowEditAccountModal(false);
  };

  const handleAddAddress = () => {
    if (
      !newAddressName ||
      !newAddressPhone ||
      !newAddress ||
      !newCity ||
      !newState ||
      !newPincode
    ) {
      Alert.alert("Missing Info", "Please fill in all address fields.");
      return;
    }
    Alert.alert("Success", "Address added successfully!");
    setShowAddAddressModal(false);
    // Reset form
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddress("");
    setNewCity("");
    setNewState("");
    setNewPincode("");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak Password", "Password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "New passwords do not match.");
      return;
    }
    Alert.alert("Success", "Password changed successfully!");
    setShowChangePasswordModal(false);
    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleRemoveAddress = (id: string) => {
    Alert.alert(
      "Remove Address",
      "Are you sure you want to remove this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Alert.alert("Removed", "Address has been removed successfully.");
          },
        },
      ]
    );
  };

  const handleSetDefaultAddress = (id: string) => {
    Alert.alert("Success", "Address set as default.");
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return "home";
      case "work":
        return "briefcase";
      default:
        return "location";
    }
  };

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case "home":
        return "Home";
      case "work":
        return "Work";
      default:
        return "Other";
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
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account and preferences
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
        {/* Account Information Tab */}
        {activeTab === "account" && (
          <View style={styles.accountContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{fullName}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{email}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{phone}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{dateOfBirth}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditAccountModal(true)}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Account Information</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Address Management Tab */}
        {activeTab === "address" && (
          <View style={styles.addressContainer}>
            {addresses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No addresses saved</Text>
                <Text style={styles.emptySubtext}>
                  Add an address for faster checkout
                </Text>
              </View>
            ) : (
              <>
                {addresses.map((address, index) => (
                  <View
                    key={address.id}
                    style={[
                      styles.addressCard,
                      index === addresses.length - 1 && styles.addressCardLast,
                    ]}
                  >
                    <View style={styles.addressCardLeft}>
                      <View
                        style={[
                          styles.addressIcon,
                          {
                            backgroundColor:
                              address.type === "home"
                                ? "#4CAF50"
                                : address.type === "work"
                                ? "#2196F3"
                                : "#9C27B0",
                          } + "20",
                        ]}
                      >
                        <Ionicons
                          name={getAddressTypeIcon(address.type) as any}
                          size={24}
                          color={
                            address.type === "home"
                              ? "#4CAF50"
                              : address.type === "work"
                              ? "#2196F3"
                              : "#9C27B0"
                          }
                        />
                      </View>
                      <View style={styles.addressInfo}>
                        <View style={styles.addressHeader}>
                          <Text style={styles.addressType}>
                            {getAddressTypeLabel(address.type)}
                          </Text>
                          {address.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressName}>{address.name}</Text>
                        <Text style={styles.addressPhone}>{address.phone}</Text>
                        <Text style={styles.addressText}>{address.address}</Text>
                        <Text style={styles.addressLocation}>
                          {address.city}, {address.state} - {address.pincode}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.addressCardRight}>
                      {!address.isDefault && (
                        <TouchableOpacity
                          style={styles.setDefaultBtn}
                          onPress={() => handleSetDefaultAddress(address.id)}
                        >
                          <Text style={styles.setDefaultBtnText}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveAddress(address.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddAddressModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#E97A1F" />
                  <Text style={styles.addButtonText}>Add New Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Password & Security Tab */}
        {activeTab === "security" && (
          <View style={styles.securityContainer}>
            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={24} color="#E97A1F" />
                <View style={styles.securityItemInfo}>
                  <Text style={styles.securityItemTitle}>Password</Text>
                  <Text style={styles.securityItemDesc}>
                    Change your account password
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.securityActionBtn}
                  onPress={() => setShowChangePasswordModal(true)}
                >
                  <Text style={styles.securityActionText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <View style={styles.securityItemInfo}>
                  <Text style={styles.securityItemTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.securityItemDesc}>
                    Add an extra layer of security
                  </Text>
                </View>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="finger-print" size={24} color="#9C27B0" />
                <View style={styles.securityItemInfo}>
                  <Text style={styles.securityItemTitle}>Biometric Login</Text>
                  <Text style={styles.securityItemDesc}>
                    Use fingerprint or face ID
                  </Text>
                </View>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="log-out" size={24} color="#F44336" />
                <View style={styles.securityItemInfo}>
                  <Text style={styles.securityItemTitle}>Active Sessions</Text>
                  <Text style={styles.securityItemDesc}>
                    Manage your logged-in devices
                  </Text>
                </View>
                <TouchableOpacity style={styles.securityActionBtn}>
                  <Text style={styles.securityActionText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Notification Settings Tab */}
        {activeTab === "notifications" && (
          <View style={styles.notificationsContainer}>
            <View style={styles.notificationsCard}>
              <Text style={styles.notificationsSectionTitle}>Order Updates</Text>
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>Order Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Get notified about order status
                  </Text>
                </View>
                <Switch
                  value={orderNotifications}
                  onValueChange={setOrderNotifications}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.notificationsCard}>
              <Text style={styles.notificationsSectionTitle}>Promotions</Text>
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>Promotional Offers</Text>
                  <Text style={styles.settingDescription}>
                    Receive offers and discounts
                  </Text>
                </View>
                <Switch
                  value={promotionNotifications}
                  onValueChange={setPromotionNotifications}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.settingDivider} />
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>Price Drop Alerts</Text>
                  <Text style={styles.settingDescription}>
                    Get notified when prices drop
                  </Text>
                </View>
                <Switch
                  value={priceDropNotifications}
                  onValueChange={setPriceDropNotifications}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.settingDivider} />
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>New Arrivals</Text>
                  <Text style={styles.settingDescription}>
                    Be first to know about new products
                  </Text>
                </View>
                <Switch
                  value={newArrivalNotifications}
                  onValueChange={setNewArrivalNotifications}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.notificationsCard}>
              <Text style={styles.notificationsSectionTitle}>Delivery Methods</Text>
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive updates via email
                  </Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.settingDivider} />
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Text style={styles.settingLabel}>SMS Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Receive updates via SMS
                  </Text>
                </View>
                <Switch
                  value={smsNotifications}
                  onValueChange={setSmsNotifications}
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
                  onValueChange={setPushNotifications}
                  trackColor={{ false: "#E0E0E0", true: "#E97A1F" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Account Modal */}
      <Modal
        visible={showEditAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Account Information</Text>
              <TouchableOpacity
                onPress={() => setShowEditAccountModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter full name"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="DD/MM/YYYY"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gender</Text>
                <View style={styles.genderSelector}>
                  {(["male", "female", "other"] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderOption,
                        gender === g && styles.genderOptionActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          gender === g && styles.genderOptionTextActive,
                        ]}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveAccount}
              >
                <Text style={styles.modalSubmitBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity
                onPress={() => setShowAddAddressModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address Type</Text>
                <View style={styles.addressTypeSelector}>
                  {(["home", "work", "other"] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.addressTypeOption,
                        newAddressType === type && styles.addressTypeOptionActive,
                      ]}
                      onPress={() => setNewAddressType(type)}
                    >
                      <Text
                        style={[
                          styles.addressTypeOptionText,
                          newAddressType === type && styles.addressTypeOptionTextActive,
                        ]}
                      >
                        {getAddressTypeLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter name"
                  value={newAddressName}
                  onChangeText={setNewAddressName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="10-digit mobile number"
                  value={newAddressPhone}
                  onChangeText={setNewAddressPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="House / Street, Area"
                  value={newAddress}
                  onChangeText={setNewAddress}
                  multiline
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>City</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter city"
                  value={newCity}
                  onChangeText={setNewCity}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter state"
                  value={newState}
                  onChangeText={setNewState}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pincode</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="6-digit pincode"
                  value={newPincode}
                  onChangeText={setNewPincode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddAddress}
              >
                <Text style={styles.modalSubmitBtnText}>Add Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setShowChangePasswordModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleChangePassword}
              >
                <Text style={styles.modalSubmitBtnText}>Change Password</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // Account Tab Styles
  accountContainer: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E97A1F",
    borderRadius: 12,
    padding: 16,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  // Address Tab Styles
  addressContainer: {
    flex: 1,
  },
  addressCard: {
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
  addressCardLast: {
    marginBottom: 16,
  },
  addressCardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  addressIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addressName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  addressLocation: {
    fontSize: 12,
    color: "#999",
  },
  addressCardRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  setDefaultBtn: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  setDefaultBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  removeBtn: {
    padding: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E97A1F",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E97A1F",
    marginLeft: 8,
  },
  // Security Tab Styles
  securityContainer: {
    flex: 1,
  },
  securityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  securityItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  securityItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  securityItemDesc: {
    fontSize: 12,
    color: "#666",
  },
  securityActionBtn: {
    backgroundColor: "#E97A1F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  securityActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Notifications Tab Styles
  notificationsContainer: {
    flex: 1,
  },
  notificationsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#F8F9FA",
  },
  genderSelector: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F8F9FA",
    alignItems: "center",
  },
  genderOptionActive: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  genderOptionTextActive: {
    color: "#FFFFFF",
  },
  addressTypeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  addressTypeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F8F9FA",
    alignItems: "center",
  },
  addressTypeOptionActive: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  addressTypeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  addressTypeOptionTextActive: {
    color: "#FFFFFF",
  },
  modalSubmitBtn: {
    backgroundColor: "#E97A1F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});


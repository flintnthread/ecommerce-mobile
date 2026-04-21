import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../lib/language";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PaymentTab = "cards" | "upi" | "wallet" | "cod";

interface PaymentCard {
  id: string;
  type: "credit" | "debit";
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  isDefault: boolean;
  bankName: string;
}

interface UPIAccount {
  id: string;
  upiId: string;
  provider: string;
  isDefault: boolean;
}

interface Wallet {
  id: string;
  name: string;
  balance: string;
  provider: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { tr } = useLanguage();
  const [activeTab, setActiveTab] = useState<PaymentTab>("cards");
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showAddUPIModal, setShowAddUPIModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);

  // Form states for adding new payment methods
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardType, setCardType] = useState<"credit" | "debit">("credit");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiProvider, setUpiProvider] = useState("");
  const [walletName, setWalletName] = useState("");
  const [walletProvider, setWalletProvider] = useState("");

  // Sample data
  const paymentCards: PaymentCard[] = [
    {
      id: "1",
      type: "credit",
      cardNumber: "**** **** **** 4532",
      cardHolder: "Sankar P",
      expiryDate: "12/25",
      cvv: "***",
      isDefault: true,
      bankName: "HDFC Bank",
    },
    {
      id: "2",
      type: "debit",
      cardNumber: "**** **** **** 7890",
      cardHolder: "Sankar P",
      expiryDate: "08/26",
      cvv: "***",
      isDefault: false,
      bankName: "SBI",
    },
  ];

  const upiAccounts: UPIAccount[] = [
    {
      id: "1",
      upiId: "sankar@paytm",
      provider: "Paytm",
      isDefault: true,
    },
    {
      id: "2",
      upiId: "sankar@ybl",
      provider: "PhonePe",
      isDefault: false,
    },
  ];

  const wallets: Wallet[] = [
    {
      id: "1",
      name: "Paytm Wallet",
      balance: "₹2,450",
      provider: "Paytm",
      isDefault: true,
    },
    {
      id: "2",
      name: "PhonePe Wallet",
      balance: "₹850",
      provider: "PhonePe",
      isDefault: false,
    },
  ];

  const tabs: { key: PaymentTab; label: string; icon: string }[] = [
    { key: "cards", label: tr("Cards"), icon: "card" },
    { key: "upi", label: "UPI", icon: "phone-portrait" },
    { key: "wallet", label: tr("Wallet"), icon: "wallet" },
    { key: "cod", label: tr("Cash on Delivery"), icon: "cash" },
  ];

  const getCardTypeIcon = (type: string) => {
    return type === "credit" ? "card-outline" : "card";
  };

  const getCardTypeColor = (type: string) => {
    return type === "credit" ? "#4CAF50" : "#2196F3";
  };

  const handleAddCard = () => {
    if (!cardNumber || !cardHolder || !expiryDate || !cvv || !bankName) {
      Alert.alert("Missing Info", "Please fill in all card details.");
      return;
    }
    Alert.alert("Success", "Card added successfully!");
    setShowAddCardModal(false);
    // Reset form
    setCardNumber("");
    setCardHolder("");
    setExpiryDate("");
    setCvv("");
    setBankName("");
  };

  const handleAddUPI = () => {
    if (!upiId || !upiProvider) {
      Alert.alert("Missing Info", "Please fill in UPI ID and provider.");
      return;
    }
    Alert.alert("Success", "UPI account added successfully!");
    setShowAddUPIModal(false);
    // Reset form
    setUpiId("");
    setUpiProvider("");
  };

  const handleAddWallet = () => {
    if (!walletName || !walletProvider) {
      Alert.alert("Missing Info", "Please fill in wallet details.");
      return;
    }
    Alert.alert("Success", "Wallet added successfully!");
    setShowAddWalletModal(false);
    // Reset form
    setWalletName("");
    setWalletProvider("");
  };

  const handleRemovePaymentMethod = (
    type: "card" | "upi" | "wallet",
    id: string
  ) => {
    Alert.alert(
      "Remove Payment Method",
      `Are you sure you want to remove this ${type}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Alert.alert("Removed", `${type} has been removed successfully.`);
          },
        },
      ]
    );
  };

  const handleSetDefault = (
    type: "card" | "upi" | "wallet",
    id: string
  ) => {
    Alert.alert("Success", `${type} set as default payment method.`);
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
          <Text style={styles.headerTitle}>{tr("Payment Methods")}</Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "cards" && `${paymentCards.length} saved cards`}
            {activeTab === "upi" && `${upiAccounts.length} UPI accounts`}
            {activeTab === "wallet" && `${wallets.length} wallets`}
            {activeTab === "cod" && "Available for all orders"}
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
        {/* Cards Tab */}
        {activeTab === "cards" && (
          <View style={styles.cardsContainer}>
            {paymentCards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No cards saved</Text>
                <Text style={styles.emptySubtext}>
                  Add a card to make payments faster
                </Text>
              </View>
            ) : (
              <>
                {paymentCards.map((card, index) => (
                  <View
                    key={card.id}
                    style={[
                      styles.cardItem,
                      index === paymentCards.length - 1 && styles.cardItemLast,
                    ]}
                  >
                    <View style={styles.cardItemLeft}>
                      <View
                        style={[
                          styles.cardIcon,
                          { backgroundColor: getCardTypeColor(card.type) + "20" },
                        ]}
                      >
                        <Ionicons
                          name={getCardTypeIcon(card.type) as any}
                          size={24}
                          color={getCardTypeColor(card.type)}
                        />
                      </View>
                      <View style={styles.cardInfo}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardNumber}>{card.cardNumber}</Text>
                          {card.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.cardHolder}>{card.cardHolder}</Text>
                        <View style={styles.cardMeta}>
                          <Text style={styles.cardExpiry}>Expires: {card.expiryDate}</Text>
                          <Text style={styles.cardBank}>{card.bankName}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.cardItemRight}>
                      {!card.isDefault && (
                        <TouchableOpacity
                          style={styles.setDefaultBtn}
                          onPress={() => handleSetDefault("card", card.id)}
                        >
                          <Text style={styles.setDefaultBtnText}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemovePaymentMethod("card", card.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddCardModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#E97A1F" />
                  <Text style={styles.addButtonText}>Add New Card</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* UPI Tab */}
        {activeTab === "upi" && (
          <View style={styles.upiContainer}>
            {upiAccounts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="phone-portrait-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No UPI accounts</Text>
                <Text style={styles.emptySubtext}>
                  Add a UPI account for quick payments
                </Text>
              </View>
            ) : (
              <>
                {upiAccounts.map((upi, index) => (
                  <View
                    key={upi.id}
                    style={[
                      styles.upiItem,
                      index === upiAccounts.length - 1 && styles.upiItemLast,
                    ]}
                  >
                    <View style={styles.upiItemLeft}>
                      <View style={styles.upiIcon}>
                        <Ionicons name="phone-portrait" size={24} color="#9C27B0" />
                      </View>
                      <View style={styles.upiInfo}>
                        <View style={styles.upiHeader}>
                          <Text style={styles.upiId}>{upi.upiId}</Text>
                          {upi.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.upiProvider}>{upi.provider}</Text>
                      </View>
                    </View>
                    <View style={styles.upiItemRight}>
                      {!upi.isDefault && (
                        <TouchableOpacity
                          style={styles.setDefaultBtn}
                          onPress={() => handleSetDefault("upi", upi.id)}
                        >
                          <Text style={styles.setDefaultBtnText}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemovePaymentMethod("upi", upi.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddUPIModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#E97A1F" />
                  <Text style={styles.addButtonText}>Add New UPI</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <View style={styles.walletContainer}>
            {wallets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No wallets added</Text>
                <Text style={styles.emptySubtext}>
                  Add a wallet for convenient payments
                </Text>
              </View>
            ) : (
              <>
                {wallets.map((wallet, index) => (
                  <View
                    key={wallet.id}
                    style={[
                      styles.walletItem,
                      index === wallets.length - 1 && styles.walletItemLast,
                    ]}
                  >
                    <View style={styles.walletItemLeft}>
                      <View style={styles.walletIcon}>
                        <Ionicons name="wallet" size={24} color="#FF9800" />
                      </View>
                      <View style={styles.walletInfo}>
                        <View style={styles.walletHeader}>
                          <Text style={styles.walletName}>{wallet.name}</Text>
                          {wallet.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.walletProvider}>{wallet.provider}</Text>
                        <Text style={styles.walletBalance}>Balance: {wallet.balance}</Text>
                      </View>
                    </View>
                    <View style={styles.walletItemRight}>
                      {!wallet.isDefault && (
                        <TouchableOpacity
                          style={styles.setDefaultBtn}
                          onPress={() => handleSetDefault("wallet", wallet.id)}
                        >
                          <Text style={styles.setDefaultBtnText}>Set Default</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemovePaymentMethod("wallet", wallet.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddWalletModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#E97A1F" />
                  <Text style={styles.addButtonText}>Add New Wallet</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Cash on Delivery Tab */}
        {activeTab === "cod" && (
          <View style={styles.codContainer}>
            <View style={styles.codCard}>
              <View style={styles.codIconContainer}>
                <Ionicons name="cash" size={48} color="#4CAF50" />
              </View>
              <Text style={styles.codTitle}>Cash on Delivery</Text>
              <Text style={styles.codDescription}>
                Pay with cash when your order is delivered. No need to add payment method.
              </Text>
              <View style={styles.codFeatures}>
                <View style={styles.codFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.codFeatureText}>
                    Available for all orders above ₹99
                  </Text>
                </View>
                <View style={styles.codFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.codFeatureText}>
                    Pay exact amount to delivery person
                  </Text>
                </View>
                <View style={styles.codFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.codFeatureText}>
                    No additional charges
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCardModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity
                onPress={() => setShowAddCardModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Type</Text>
                <View style={styles.cardTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.cardTypeOption,
                      cardType === "credit" && styles.cardTypeOptionActive,
                    ]}
                    onPress={() => setCardType("credit")}
                  >
                    <Text
                      style={[
                        styles.cardTypeOptionText,
                        cardType === "credit" && styles.cardTypeOptionTextActive,
                      ]}
                    >
                      Credit Card
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cardTypeOption,
                      cardType === "debit" && styles.cardTypeOptionActive,
                    ]}
                    onPress={() => setCardType("debit")}
                  >
                    <Text
                      style={[
                        styles.cardTypeOptionText,
                        cardType === "debit" && styles.cardTypeOptionTextActive,
                      ]}
                    >
                      Debit Card
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Holder Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="John Doe"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                />
              </View>
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>CVV</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="123"
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="number-pad"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bank Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., HDFC Bank"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddCard}
              >
                <Text style={styles.modalSubmitBtnText}>Add Card</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add UPI Modal */}
      <Modal
        visible={showAddUPIModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddUPIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New UPI</Text>
              <TouchableOpacity
                onPress={() => setShowAddUPIModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>UPI ID</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Provider</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Paytm, PhonePe, Google Pay"
                  value={upiProvider}
                  onChangeText={setUpiProvider}
                />
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddUPI}
              >
                <Text style={styles.modalSubmitBtnText}>Add UPI</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Wallet Modal */}
      <Modal
        visible={showAddWalletModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Wallet</Text>
              <TouchableOpacity
                onPress={() => setShowAddWalletModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Wallet Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Paytm Wallet"
                  value={walletName}
                  onChangeText={setWalletName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Provider</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Paytm, PhonePe"
                  value={walletProvider}
                  onChangeText={setWalletProvider}
                />
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddWallet}
              >
                <Text style={styles.modalSubmitBtnText}>Add Wallet</Text>
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
  // Cards Tab Styles
  cardsContainer: {
    flex: 1,
  },
  cardItem: {
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
  cardItemLast: {
    marginBottom: 16,
  },
  cardItemLeft: {
    flexDirection: "row",
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 16,
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
  cardHolder: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardExpiry: {
    fontSize: 12,
    color: "#999",
  },
  cardBank: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  cardItemRight: {
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
  // UPI Tab Styles
  upiContainer: {
    flex: 1,
  },
  upiItem: {
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
  upiItemLast: {
    marginBottom: 16,
  },
  upiItemLeft: {
    flexDirection: "row",
    flex: 1,
  },
  upiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#9C27B020",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  upiInfo: {
    flex: 1,
  },
  upiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  upiId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
  upiProvider: {
    fontSize: 14,
    color: "#666",
  },
  upiItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  // Wallet Tab Styles
  walletContainer: {
    flex: 1,
  },
  walletItem: {
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
  walletItemLast: {
    marginBottom: 16,
  },
  walletItemLeft: {
    flexDirection: "row",
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF980020",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  walletInfo: {
    flex: 1,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  walletName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginRight: 8,
  },
  walletProvider: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  walletItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  // Cash on Delivery Tab Styles
  codContainer: {
    flex: 1,
  },
  codCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4CAF5020",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  codTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  codDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  codFeatures: {
    width: "100%",
    gap: 12,
  },
  codFeature: {
    flexDirection: "row",
    alignItems: "center",
  },
  codFeatureText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
  },
  // Add Button
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
  formRow: {
    flexDirection: "row",
  },
  cardTypeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  cardTypeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F8F9FA",
    alignItems: "center",
  },
  cardTypeOptionActive: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  cardTypeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  cardTypeOptionTextActive: {
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


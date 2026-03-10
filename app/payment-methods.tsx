import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface PaymentMethod {
  id: string;
  type: "card" | "upi" | "wallet";
  name: string;
  details: string;
  expiry?: string;
  balance?: string;
  phone?: string;
  actionType: "arrow" | "edit" | "remove";
}

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const paymentMethods: PaymentMethod[] = [
    {
      id: "1",
      type: "card",
      name: "Visa",
      details: "Visa *** 2345",
      expiry: "08/25",
      actionType: "arrow",
    },
    {
      id: "2",
      type: "upi",
      name: "UPI",
      details: "Linked to:",
      phone: "+91 6305015198",
      actionType: "edit",
    },
    {
      id: "3",
      type: "wallet",
      name: "Paytm Wallet",
      details: "Balance:",
      balance: "₹850.00",
      actionType: "remove",
    },
  ];

  const handleAddPaymentMethod = () => {
    Alert.alert("Add Payment Method", "Add payment method functionality will be implemented here.");
  };

  const handleCardPress = (method: PaymentMethod) => {
    if (method.actionType === "arrow") {
      Alert.alert("Card Details", `Viewing details for ${method.details}`);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    Alert.alert("Edit", `Editing ${method.name}`);
  };

  const handleRemove = (method: PaymentMethod) => {
    Alert.alert(
      "Remove Payment Method",
      `Are you sure you want to remove ${method.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Alert.alert("Removed", `${method.name} has been removed.`);
          },
        },
      ]
    );
  };

  const renderPaymentMethodCard = (method: PaymentMethod) => {
    return (
      <View key={method.id} style={styles.paymentCard}>
        {/* Left side - Logo/Icon and Details */}
        <View style={styles.cardLeft}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            {method.type === "card" ? (
              <View style={styles.visaLogo}>
                <Text style={styles.visaText}>VISA</Text>
              </View>
            ) : method.type === "upi" ? (
              <View style={styles.upiLogo}>
                <Text style={styles.upiText}>UPI</Text>
              </View>
            ) : (
              <View style={styles.paytmLogo}>
                <Text style={styles.paytmText}>Paytm</Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.cardDetails}>
            {method.type === "card" ? (
              <>
                <Text style={styles.cardNumber}>{method.details}</Text>
                <Text style={styles.expiry}>Expires: {method.expiry}</Text>
              </>
            ) : method.type === "upi" ? (
              <>
                <Text style={styles.cardNumber}>{method.details}</Text>
                <Text style={styles.phoneNumber}>{method.phone}</Text>
              </>
            ) : (
              <>
                <Text style={styles.walletLabel}>{method.name}</Text>
                <Text style={styles.balance}>
                  {method.details} {method.balance}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Right side - Action Button/Icon */}
        <View style={styles.cardRight}>
          {method.actionType === "arrow" ? (
            <TouchableOpacity
              onPress={() => handleCardPress(method)}
              style={styles.arrowButton}
            >
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ) : method.actionType === "edit" ? (
            <TouchableOpacity
              onPress={() => handleEdit(method)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => handleRemove(method)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Payment Method Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPaymentMethod}
        >
          <Ionicons name="add" size={20} color="#FFF" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        {/* Payment Methods List */}
        <View style={styles.paymentMethodsContainer}>
          {paymentMethods.map((method) => renderPaymentMethodCard(method))}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addButton: {
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentMethodsContainer: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  visaLogo: {
    width: 50,
    height: 30,
    backgroundColor: "#1A1F71",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  visaText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  upiLogo: {
    width: 50,
    height: 30,
    backgroundColor: "#8B4513",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  upiText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  paytmLogo: {
    width: 50,
    height: 30,
    backgroundColor: "#B3E5FC",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  paytmText: {
    color: "#002970",
    fontSize: 11,
    fontWeight: "700",
  },
  cardDetails: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  expiry: {
    fontSize: 13,
    color: "#666",
  },
  phoneNumber: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  walletLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  balance: {
    fontSize: 13,
    color: "#666",
  },
  cardRight: {
    marginLeft: 12,
  },
  arrowButton: {
    padding: 4,
  },
  editButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  removeButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  removeButtonText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "500",
  },
});


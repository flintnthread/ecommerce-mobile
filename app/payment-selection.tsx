import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type PayMethod = "UPI" | "Card" | "NetBanking" | "COD";

export default function PaymentSelectionScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<PayMethod>("UPI");
  const [selectedUpi, setSelectedUpi] = useState("Google Pay");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardErrors, setCardErrors] = useState({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
  });

  const methods = useMemo(
    () =>
      [
        {
          key: "UPI" as const,
          title: "UPI",
          subtitle: "Pay using any UPI app",
          icon: "flash-outline" as const,
        },
        {
          key: "Card" as const,
          title: "Credit / Debit Card",
          subtitle: "Visa, MasterCard, RuPay",
          icon: "card-outline" as const,
        },
        {
          key: "NetBanking" as const,
          title: "Net Banking",
          subtitle: "All major banks supported",
          icon: "business-outline" as const,
        },
        {
          key: "COD" as const,
          title: "Cash on Delivery",
          subtitle: "Pay when you receive",
          icon: "cash-outline" as const,
        },
      ] as const,
    []
  );

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const validateCardDetails = () => {
    const nextErrors = {
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: "",
    };

    const cardDigits = cardNumber.replace(/\s/g, "");
    if (!/^\d{16}$/.test(cardDigits)) {
      nextErrors.cardNumber = "Enter a valid 16-digit card number";
    }

    if (!/^[A-Za-z ]{3,}$/.test(cardHolderName.trim())) {
      nextErrors.cardHolderName = "Enter valid card holder name";
    }

    const expiryMatch = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      nextErrors.expiryDate = "Use MM/YY format";
    } else {
      const month = Number(expiryMatch[1]);
      const year = Number(expiryMatch[2]);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;

      if (month < 1 || month > 12) {
        nextErrors.expiryDate = "Month should be between 01 and 12";
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        nextErrors.expiryDate = "Card is expired";
      }
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = "Enter valid 3 or 4 digit CVV";
    }

    setCardErrors(nextErrors);
    return Object.values(nextErrors).every((err) => !err);
  };

  const handlePay = () => {
    if (selected === "Card" && !validateCardDetails()) {
      Alert.alert("Invalid card details", "Please fix the highlighted fields to continue.");
      return;
    }

    Alert.alert(
      "Payment (demo)",
      `Selected: ${selected}\n\nNext: connect to real payment flow.`,
      [{ text: "OK", onPress: () => router.push("/home") }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#1d324e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed-outline" size={18} color="#10893E" />
          <Text style={styles.infoText}>
            100% secure payments • Choose your preferred method
          </Text>
        </View>

        {methods.map((m) => {
          const active = selected === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodCard, active && styles.methodCardActive]}
              activeOpacity={0.9}
              onPress={() => setSelected(m.key)}
            >
              <View style={styles.methodLeft}>
                <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
                  <Ionicons
                    name={m.icon}
                    size={18}
                    color={active ? "#ef7b1a" : "#1d324e"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodTitle}>{m.title}</Text>
                  <Text style={styles.methodSubtitle}>{m.subtitle}</Text>
                </View>
              </View>

              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Selected payment details tab */}
        <View style={styles.selectionPanel}>
          {selected === "UPI" && (
            <>
              <Text style={styles.panelTitle}>Choose UPI app</Text>
              <View style={styles.chipsRow}>
                {["Google Pay", "PhonePe", "Paytm", "BHIM"].map((app) => {
                  const active = selectedUpi === app;
                  return (
                    <TouchableOpacity
                      key={app}
                      activeOpacity={0.85}
                      onPress={() => setSelectedUpi(app)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {app}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.panelHint}>You will be redirected to {selectedUpi}.</Text>
            </>
          )}

          {selected === "Card" && (
            <>
              <Text style={styles.panelTitle}>Enter card details</Text>
              <TextInput
                style={[styles.cardInput, !!cardErrors.cardNumber && styles.cardInputError]}
                placeholder="Card number"
                placeholderTextColor="#8A96A3"
                value={cardNumber}
                onChangeText={(text) => {
                  setCardNumber(formatCardNumber(text));
                  if (cardErrors.cardNumber) {
                    setCardErrors((prev) => ({ ...prev, cardNumber: "" }));
                  }
                }}
                keyboardType="number-pad"
                maxLength={19}
              />
              {!!cardErrors.cardNumber && (
                <Text style={styles.fieldErrorText}>{cardErrors.cardNumber}</Text>
              )}
              <TextInput
                style={[styles.cardInput, !!cardErrors.cardHolderName && styles.cardInputError]}
                placeholder="Card holder name"
                placeholderTextColor="#8A96A3"
                value={cardHolderName}
                onChangeText={(text) => {
                  setCardHolderName(text);
                  if (cardErrors.cardHolderName) {
                    setCardErrors((prev) => ({ ...prev, cardHolderName: "" }));
                  }
                }}
              />
              {!!cardErrors.cardHolderName && (
                <Text style={styles.fieldErrorText}>{cardErrors.cardHolderName}</Text>
              )}
              <View style={styles.cardRow}>
                <TextInput
                  style={[
                    styles.cardInput,
                    styles.cardInputHalf,
                    !!cardErrors.expiryDate && styles.cardInputError,
                  ]}
                  placeholder="MM/YY"
                  placeholderTextColor="#8A96A3"
                  value={expiryDate}
                  onChangeText={(text) => {
                    setExpiryDate(formatExpiry(text));
                    if (cardErrors.expiryDate) {
                      setCardErrors((prev) => ({ ...prev, expiryDate: "" }));
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <TextInput
                  style={[
                    styles.cardInput,
                    styles.cardInputHalf,
                    !!cardErrors.cvv && styles.cardInputError,
                  ]}
                  placeholder="CVV"
                  placeholderTextColor="#8A96A3"
                  value={cvv}
                  onChangeText={(text) => {
                    setCvv(text.replace(/\D/g, "").slice(0, 4));
                    if (cardErrors.cvv) {
                      setCardErrors((prev) => ({ ...prev, cvv: "" }));
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
              {(!!cardErrors.expiryDate || !!cardErrors.cvv) && (
                <Text style={styles.fieldErrorText}>
                  {cardErrors.expiryDate || cardErrors.cvv}
                </Text>
              )}
              <Text style={styles.panelHint}>
                Enter valid card details to continue payment.
              </Text>
            </>
          )}

          {selected === "NetBanking" && (
            <>
              <Text style={styles.panelTitle}>Popular banks</Text>
              {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank"].map((bank) => {
                const active = selectedBank === bank;
                return (
                  <TouchableOpacity
                    key={bank}
                    onPress={() => setSelectedBank(bank)}
                    activeOpacity={0.85}
                    style={[styles.bankRow, active && styles.bankRowActive]}
                  >
                    <Text style={[styles.bankText, active && styles.bankTextActive]}>{bank}</Text>
                    {active ? <Ionicons name="checkmark-circle" size={18} color="#ef7b1a" /> : null}
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {selected === "COD" && (
            <>
              <Text style={styles.panelTitle}>Cash on Delivery</Text>
              <View style={styles.optionRow}>
                <Ionicons name="cash-outline" size={16} color="#10893E" />
                <Text style={styles.optionText}>Pay in cash when your order arrives.</Text>
              </View>
              <Text style={styles.panelHint}>
                A small COD fee may apply based on delivery location.
              </Text>
            </>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Selected</Text>
          <Text style={styles.bottomValue}>{selected}</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} activeOpacity={0.9} onPress={handlePay}>
          <Text style={styles.payBtnText}>Pay now</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F0" },
  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFF7F0",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29,50,78,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    color: "#1d324e",
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  content: { flex: 1 },
  contentContainer: { padding: 14, paddingBottom: 20 },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "700",
    flex: 1,
  },
  methodCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodCardActive: {
    borderColor: "rgba(239,123,26,0.55)",
    backgroundColor: "#FFF0E0",
  },
  methodLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconBubbleActive: {
    borderColor: "rgba(239,123,26,0.40)",
    backgroundColor: "#FFFFFF",
  },
  methodTitle: { fontSize: 13, color: "#1d324e", fontWeight: "900" },
  methodSubtitle: { marginTop: 2, fontSize: 11, color: "#666666", fontWeight: "600" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(29,50,78,0.28)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  radioActive: { borderColor: "#ef7b1a" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef7b1a" },
  selectionPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.12)",
    marginTop: 4,
  },
  panelTitle: {
    fontSize: 13,
    color: "#1d324e",
    fontWeight: "900",
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.20)",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#FFEBD3",
    borderColor: "rgba(239,123,26,0.45)",
  },
  chipText: {
    fontSize: 11,
    color: "#1d324e",
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#ef7b1a",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "700",
    flex: 1,
  },
  panelHint: {
    marginTop: 4,
    fontSize: 11,
    color: "#666666",
    fontWeight: "600",
  },
  cardInput: {
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.20)",
    paddingHorizontal: 12,
    color: "#1d324e",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInputHalf: {
    width: "48%",
  },
  cardInputError: {
    borderColor: "#D93025",
  },
  fieldErrorText: {
    marginTop: -4,
    marginBottom: 8,
    fontSize: 11,
    color: "#D93025",
    fontWeight: "600",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(29,50,78,0.15)",
    marginBottom: 8,
  },
  bankRowActive: {
    borderColor: "rgba(239,123,26,0.45)",
    backgroundColor: "#FFF0E0",
  },
  bankText: {
    fontSize: 12,
    color: "#1d324e",
    fontWeight: "700",
  },
  bankTextActive: {
    color: "#ef7b1a",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(29,50,78,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomLabel: { fontSize: 11, color: "#666666", fontWeight: "700" },
  bottomValue: { fontSize: 15, color: "#1d324e", fontWeight: "900", marginTop: 2 },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef7b1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  payBtnText: { fontSize: 13, color: "#FFFFFF", fontWeight: "900", marginRight: 8 },
});


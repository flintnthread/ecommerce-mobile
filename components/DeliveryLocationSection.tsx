import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  requestForegroundLocation,
  type RequestForegroundLocationResult,
} from "../lib/requestForegroundLocation";

/** Must match `home.tsx` so the same saved list and selection apply app-wide. */
export const DELIVERY_ADDRESSES_STORAGE_KEY = "home_savedDeliveryAddresses_v1";

export interface SavedDeliveryAddress {
  id: string;
  name: string;
  line: string;
  phone?: string;
}

const DEFAULT_SAVED_DELIVERY_ADDRESSES: SavedDeliveryAddress[] = [
  {
    id: "1",
    name: "Sai Ramya",
    line: "Kphb colony, road no 3, phase 1, near shivalaya temple",
  },
  {
    id: "2",
    name: "Sai Ramya",
    line: "Brundhavan gardens 3/2rd line, Maduri girls hostel",
  },
];

/** Same default preview line as `home.tsx` header pill. */
const INITIAL_DISPLAY_LINE =
  "Kphb colony ,road no 3 ,phase 1,near shi...";

/**
 * Delivery location row + bottom sheet — same behaviour as Home (search saved,
 * use current location, add new, persist to AsyncStorage).
 */
export default function DeliveryLocationSection() {
  const insets = useSafeAreaInsets();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [deliveryAddressModalVisible, setDeliveryAddressModalVisible] =
    useState(false);
  const [deliveryAddressSearchQuery, setDeliveryAddressSearchQuery] =
    useState("");
  const [displayDeliveryLine, setDisplayDeliveryLine] = useState(
    INITIAL_DISPLAY_LINE
  );
  const [savedDeliveryAddresses, setSavedDeliveryAddresses] = useState<
    SavedDeliveryAddress[]
  >(DEFAULT_SAVED_DELIVERY_ADDRESSES);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<
    string | null
  >("1");
  const [deliveryAddMode, setDeliveryAddMode] = useState<"list" | "add">(
    "list"
  );
  const [newAddressName, setNewAddressName] = useState("");
  const [newAddressPhone, setNewAddressPhone] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (cancelled) return;
        setIsLoggedIn(!!token);
        // For new users (no token), show a direct "Use current location" CTA by default.
        if (!token && displayDeliveryLine === INITIAL_DISPLAY_LINE) {
          setDisplayDeliveryLine("Use current location");
          setSelectedDeliveryAddressId(null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(DELIVERY_ADDRESSES_STORAGE_KEY);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as SavedDeliveryAddress[];
        if (!Array.isArray(parsed)) return;
        const valid =
          parsed.length === 0 ||
          parsed.every(
            (a) =>
              a &&
              typeof a.id === "string" &&
              typeof a.name === "string" &&
              typeof a.line === "string"
          );
        if (!valid) return;

        setSavedDeliveryAddresses(parsed);
        if (parsed.length === 0) {
          setSelectedDeliveryAddressId(null);
          setDisplayDeliveryLine("Use current location");
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistSavedDeliveryAddresses = useCallback(
    async (next: SavedDeliveryAddress[]) => {
      setSavedDeliveryAddresses(next);
      try {
        await AsyncStorage.setItem(
          DELIVERY_ADDRESSES_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        /* ignore */
      }
    },
    []
  );

  const closeDeliveryModal = useCallback(() => {
    setDeliveryAddressModalVisible(false);
    setDeliveryAddressSearchQuery("");
    setDeliveryAddMode("list");
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddressLine("");
  }, []);

  const openAddNewAddressForm = useCallback(() => {
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddressLine("");
    setDeliveryAddMode("add");
  }, []);

  const goBackAddAddressForm = useCallback(() => {
    setDeliveryAddMode("list");
    setNewAddressName("");
    setNewAddressPhone("");
    setNewAddressLine("");
  }, []);

  const filteredDeliveryAddresses = useMemo(() => {
    const q = deliveryAddressSearchQuery.trim().toLowerCase();
    if (!q) return savedDeliveryAddresses;
    return savedDeliveryAddresses.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.line.toLowerCase().includes(q) ||
        (a.phone?.toLowerCase().includes(q) ?? false)
    );
  }, [savedDeliveryAddresses, deliveryAddressSearchQuery]);

  const selectDeliveryAddress = useCallback(
    (addr: SavedDeliveryAddress) => {
      setSelectedDeliveryAddressId(addr.id);
      setDisplayDeliveryLine(addr.line);
      closeDeliveryModal();
    },
    [closeDeliveryModal]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const result: RequestForegroundLocationResult =
      await requestForegroundLocation();
    if (result.ok) {
      setDisplayDeliveryLine(result.addressLine);
      closeDeliveryModal();
      return;
    }

    // `ok: false` path (new user / denied / errors)
    const err = result as any;
    if (err.reason === "denied") {
      Alert.alert(
        "Location",
        "Location permission is required to use your current address."
      );
      return;
    }
    if (err.reason === "error") {
      Alert.alert("Location", err.message ?? "Unable to fetch your location.");
      return;
    }
    if (err.reason === "web") {
      Alert.alert("Location", "Current location is not supported on web.");
      return;
    }
  }, [closeDeliveryModal]);

  const handleSaveNewAddress = useCallback(() => {
    const name = newAddressName.trim();
    const line = newAddressLine.trim();
    const phone = newAddressPhone.trim();
    if (!name || !line) {
      Alert.alert(
        "Missing details",
        "Please enter the recipient name and full address."
      );
      return;
    }
    const newAddr: SavedDeliveryAddress = {
      id: `addr-${Date.now()}`,
      name,
      line,
      ...(phone ? { phone } : {}),
    };
    void (async () => {
      const next = [...savedDeliveryAddresses, newAddr];
      await persistSavedDeliveryAddresses(next);
      setDeliveryAddMode("list");
      setNewAddressName("");
      setNewAddressPhone("");
      setNewAddressLine("");
      selectDeliveryAddress(newAddr);
    })();
  }, [
    newAddressName,
    newAddressLine,
    newAddressPhone,
    savedDeliveryAddresses,
    persistSavedDeliveryAddresses,
    selectDeliveryAddress,
  ]);

  const handleDeleteSavedAddress = useCallback(
    (addr: SavedDeliveryAddress) => {
      Alert.alert("Delete address", `Delete "${addr.name}" address?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const next = savedDeliveryAddresses.filter((x) => x.id !== addr.id);
              await persistSavedDeliveryAddresses(next);
              // If the deleted address was selected, pick the next best value.
              if (selectedDeliveryAddressId === addr.id) {
                if (next.length > 0) {
                  setSelectedDeliveryAddressId(next[0].id);
                  setDisplayDeliveryLine(next[0].line);
                } else {
                  setSelectedDeliveryAddressId(null);
                  setDisplayDeliveryLine("Use current location");
                }
              }
            })();
          },
        },
      ]);
    },
    [
      persistSavedDeliveryAddresses,
      savedDeliveryAddresses,
      selectedDeliveryAddressId,
    ]
  );

  return (
    <>
      <TouchableOpacity
        style={styles.locationPillOuter}
        onPress={() => {
          if (!isLoggedIn && displayDeliveryLine === "Use current location") {
            void handleUseCurrentLocation();
            return;
          }
          setDeliveryAddressModalVisible(true);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Delivery address, tap to change"
      >
        <View style={styles.locationPill}>
          <MaterialIcons name="place" size={17} color="#0F172A" />
          <Text
            style={styles.locationPillText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayDeliveryLine}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#0F172A" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={deliveryAddressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDeliveryModal}
      >
        <View style={styles.deliveryModalRoot}>
          <Pressable style={styles.deliveryModalBackdrop} onPress={closeDeliveryModal} />
          <View
            style={[
              styles.deliveryAddressSheet,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.deliverySheetHandle} />

            {deliveryAddMode === "list" ? (
              <>
                <View style={styles.deliverySheetHeader}>
                  <Text style={styles.deliverySheetTitle}>
                    Select delivery address
                  </Text>
                  <TouchableOpacity
                    onPress={closeDeliveryModal}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={26} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.deliverySheetScroll}
                >
                  <View style={styles.deliverySearchBox}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                      placeholder="Search by area, street name, pin code"
                      placeholderTextColor="#999"
                      style={styles.deliverySearchInput}
                      value={deliveryAddressSearchQuery}
                      onChangeText={setDeliveryAddressSearchQuery}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.deliveryUseCurrentRow}
                    activeOpacity={0.75}
                    onPress={() => void handleUseCurrentLocation()}
                    accessibilityRole="button"
                    accessibilityLabel="Use my current location"
                  >
                    <View style={styles.deliveryUseCurrentIconWrap}>
                      <Ionicons name="locate" size={22} color="#1976D2" />
                    </View>
                    <View style={styles.deliveryUseCurrentTextCol}>
                      <Text style={styles.deliveryUseCurrentTitle}>
                        Use my current location
                      </Text>
                      <Text style={styles.deliveryUseCurrentSub}>
                        Allow access to location
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.deliveryDividerDashed} />

                  <View style={styles.deliverySavedHeaderRow}>
                    <Text style={styles.deliverySavedTitle}>Saved addresses</Text>
                    <TouchableOpacity
                      onPress={openAddNewAddressForm}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deliveryAddNewText}>+ Add New</Text>
                    </TouchableOpacity>
                  </View>

                  {filteredDeliveryAddresses.map((addr) => {
                    const selected = addr.id === selectedDeliveryAddressId;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={styles.deliveryAddressCard}
                        activeOpacity={0.8}
                        onPress={() => selectDeliveryAddress(addr)}
                      >
                        <MaterialIcons name="place" size={22} color="#666" />
                        <View style={styles.deliveryAddressCardBody}>
                          <View style={styles.deliveryAddressNameRow}>
                            <Text
                              style={styles.deliveryAddressName}
                              numberOfLines={1}
                            >
                              {addr.name}
                            </Text>
                            {selected ? (
                              <View style={styles.deliverySelectedBadge}>
                                <Text style={styles.deliverySelectedBadgeText}>
                                  Currently selected
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={styles.deliveryAddressLine}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {addr.line}
                          </Text>
                          {addr.phone ? (
                            <Text style={styles.deliveryAddressPhone} numberOfLines={1}>
                              {addr.phone}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={styles.deliveryAddressMenuBtn}
                          activeOpacity={0.7}
                          onPress={() => handleDeleteSavedAddress(addr)}
                          accessibilityRole="button"
                          accessibilityLabel="Delete saved address"
                        >
                          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.deliveryAddHeaderRow}>
                  <TouchableOpacity
                    onPress={goBackAddAddressForm}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.deliveryAddSheetTitle}>Add new address</Text>
                  <TouchableOpacity
                    onPress={closeDeliveryModal}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={26} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.deliverySheetScroll}
                >
                  <Text style={styles.deliveryFormLabel}>Full name</Text>
                  <TextInput
                    style={styles.deliveryFormInput}
                    placeholder="Recipient name"
                    placeholderTextColor="#999"
                    value={newAddressName}
                    onChangeText={setNewAddressName}
                  />

                  <Text style={styles.deliveryFormLabel}>Mobile number</Text>
                  <TextInput
                    style={styles.deliveryFormInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={newAddressPhone}
                    onChangeText={setNewAddressPhone}
                  />

                  <Text style={styles.deliveryFormLabel}>Address</Text>
                  <TextInput
                    style={[styles.deliveryFormInput, styles.deliveryFormInputMultiline]}
                    placeholder="House / flat no., street, area, landmark, pin code"
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                    value={newAddressLine}
                    onChangeText={setNewAddressLine}
                  />

                  <TouchableOpacity
                    style={styles.deliverySaveNewButton}
                    activeOpacity={0.85}
                    onPress={handleSaveNewAddress}
                  >
                    <Text style={styles.deliverySaveNewButtonText}>Save address</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationPillOuter: {
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.45)",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  locationPillText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "#0F172A",
    fontWeight: "600",
    minWidth: 0,
  },
  deliveryModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  deliveryModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  deliveryAddressSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "88%",
    paddingTop: 6,
  },
  deliverySheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D0D0D0",
    marginBottom: 12,
  },
  deliverySheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  deliverySheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  deliverySheetScroll: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  deliverySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  deliverySearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 0,
  },
  deliveryUseCurrentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  deliveryUseCurrentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryUseCurrentTextCol: {
    flex: 1,
    minWidth: 0,
  },
  deliveryUseCurrentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  deliveryUseCurrentSub: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 2,
  },
  deliveryDividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  deliverySavedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deliverySavedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  deliveryAddNewText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976D2",
  },
  deliveryAddHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  deliveryAddSheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginHorizontal: 8,
  },
  deliveryFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 4,
  },
  deliveryFormInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E0E0E0",
    marginBottom: 12,
  },
  deliveryFormInputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  deliverySaveNewButton: {
    backgroundColor: "#1976D2",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  deliverySaveNewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  deliveryAddressPhone: {
    fontSize: 13,
    color: "#1976D2",
    marginTop: 4,
    fontWeight: "500",
  },
  deliveryAddressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEE",
    gap: 10,
  },
  deliveryAddressCardBody: {
    flex: 1,
    minWidth: 0,
  },
  deliveryAddressNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  deliveryAddressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    flexShrink: 1,
  },
  deliverySelectedBadge: {
    backgroundColor: "#D9ECFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliverySelectedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1565C0",
  },
  deliveryAddressLine: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  deliveryAddressMenuBtn: {
    padding: 4,
    marginTop: -2,
  },
});

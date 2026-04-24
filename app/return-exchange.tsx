import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

type ReasonRow = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type IssueOptionMap = Record<string, string[]>;
const BRAND_COLORS = {
  orange: "#ef7b1a",
  navy: "#1d324e",
  sand: "#f6c795",
  brown: "#79411c",
  slate: "#69798c",
  steel: "#6c8494",
  charcoal: "#504f56",
};

const RETURN_REASONS: ReasonRow[] = [
  {
    id: "not-needed",
    title: "No longer required",
    subtitle: "Changed my mind or placed this order by accident",
    icon: "tshirt-crew-outline",
  },
  {
    id: "quality",
    title: "Quality concern",
    subtitle: "Material, stitching, or overall performance is below expectations",
    icon: "alert-circle-outline",
  },
  {
    id: "size-fit",
    title: "Sizing / fit problem",
    subtitle: "Item feels too tight, too loose, or does not fit properly",
    icon: "ruler-square-compass",
  },
  {
    id: "damaged",
    title: "Damaged or used item",
    subtitle: "Received a torn, broken, used, or unclean product",
    icon: "package-variant-closed-remove",
  },
  {
    id: "missing",
    title: "Missing item in package",
    subtitle: "Some parts are missing or quantity received is less than expected",
    icon: "package-variant-closed-minus",
  },
  {
    id: "different",
    title: "Wrong item delivered",
    subtitle: "Got a different product, color, or size than what I ordered",
    icon: "package-variant-closed",
  },
];

const ISSUE_OPTIONS: IssueOptionMap = {
  "not-needed": [
    "Ordered by mistake",
    "Found a better alternative",
    "No longer required",
  ],
  quality: [
    "Poor product quality or performance",
    "Stitching/finish is not good",
    "Material does not feel durable",
  ],
  "size-fit": [
    "Too tight after trying",
    "Too loose / not fitting well",
    "Size received is not as expected",
  ],
  damaged: [
    "Item is torn or damaged",
    "Product appears used",
    "Package arrived in bad condition",
  ],
  missing: [
    "Part/accessory is missing",
    "Quantity is less than ordered",
    "Incomplete package received",
  ],
  different: [
    "Wrong product was delivered",
    "Different color received",
    "Different size received",
  ],
};
const EXCHANGE_ELIGIBLE_REASONS = new Set(["size-fit", "different"]);
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const COLOR_OPTIONS = ["Black", "Blue", "Navy", "Brown", "Cream", "Pink"];
const EXCHANGE_OPTION_LIST = [
  "Same color, different size",
  "Same size, different color",
  "Different size and color",
];

export default function ReturnExchangeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    orderNumber?: string;
    productName?: string;
    productPrice?: string;
  }>();
  const [selectedReasonId, setSelectedReasonId] = useState<string>("");
  const [selectedIssueOption, setSelectedIssueOption] = useState<string>("");
  const [isIssueStepComplete, setIsIssueStepComplete] = useState(false);
  const [selectedVideoName, setSelectedVideoName] = useState("");
  const [selectedExchangeOption, setSelectedExchangeOption] = useState("");
  const [selectedNewSize, setSelectedNewSize] = useState("");
  const [selectedNewColor, setSelectedNewColor] = useState("");
  const [exchangeComment, setExchangeComment] = useState("");
  const [selectedAction, setSelectedAction] = useState<"return" | "exchange">(
    params.mode === "exchange" ? "exchange" : "return"
  );
  const scrollRef = useRef<ScrollView>(null);

  const modeLabel = useMemo(
    () => (params.mode === "exchange" ? "EXCHANGE" : "RETURN"),
    [params.mode]
  );
  const orderNumber = String(params.orderNumber ?? "#ORD-000000");
  const productName = String(params.productName ?? "Product");
  const productPrice = String(params.productPrice ?? "₹0");
  const selectedReason = RETURN_REASONS.find((r) => r.id === selectedReasonId) ?? null;
  const selectedReasonOptions = selectedReason ? ISSUE_OPTIONS[selectedReason.id] ?? [] : [];
  const isExchangeAvailable = selectedReasonId
    ? EXCHANGE_ELIGIBLE_REASONS.has(selectedReasonId)
    : false;
  const requiresSizeSelection =
    selectedReasonId === "size-fit" || selectedIssueOption.toLowerCase().includes("size");
  const requiresColorSelection =
    selectedReasonId === "different" ||
    selectedExchangeOption === "Same size, different color" ||
    selectedExchangeOption === "Different size and color";
  const pickUnboxingVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow media permission to upload a video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;
    const pickedVideo = result.assets[0];
    const fallbackName = pickedVideo.uri.split("/").pop() ?? "Selected video";
    setSelectedVideoName(pickedVideo.fileName ?? fallbackName);
  };
  const handleSubmit = () => {
    if (!selectedReasonId || !selectedIssueOption) {
      Alert.alert("Incomplete details", "Please select a reason and issue before submitting.");
      return;
    }

    if (!selectedVideoName) {
      Alert.alert("Video required", "Please upload unboxing video before submitting.");
      return;
    }

    if (selectedAction === "exchange" && !isExchangeAvailable) {
      Alert.alert(
        "Exchange unavailable",
        "Exchange is not available for this reason. Your return request has been submitted instead.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/orders" as any),
          },
        ]
      );
      return;
    }

    if (selectedAction === "exchange" && isExchangeAvailable) {
      if (!selectedExchangeOption) {
        Alert.alert("Exchange details needed", "Please choose an exchange option.");
        return;
      }
      if (requiresSizeSelection && !selectedNewSize) {
        Alert.alert("Size needed", "Please select the new size for exchange.");
        return;
      }
      if (requiresColorSelection && !selectedNewColor) {
        Alert.alert("Color needed", "Please select the new color for exchange.");
        return;
      }
    }

    const requestType = selectedAction === "exchange" ? "Exchange" : "Return";
    Alert.alert(
      "Request submitted",
      selectedAction === "exchange"
        ? "Exchange request submitted successfully. We will verify the product and schedule pickup for replacement."
        : `${requestType} request submitted successfully. We will review and update you shortly.`,
      [
        {
          text: "OK",
          onPress: () => router.replace("/orders" as any),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND_COLORS.sand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {modeLabel} FOR {orderNumber}
        </Text>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.productCard}>
          <Image
            source={require("../assets/images/age5.png")}
            style={styles.productImage}
          />
          <View style={styles.productMetaWrap}>
            <Text numberOfLines={1} style={styles.productName}>
              {productName}
            </Text>
            <Text style={styles.productMeta}>Size: 30A</Text>
            <Text style={styles.productPrice}>
              {productPrice} <Text style={styles.productMeta}>· All issue easy returns</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Please select reason for return/exchange</Text>
        {!selectedReason ? (
          <View style={styles.reasonList}>
            {RETURN_REASONS.map((reason) => {
              const selected = selectedReasonId === reason.id;
              return (
                <TouchableOpacity
                  key={reason.id}
                  style={styles.reasonRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedReasonId(reason.id);
                    setSelectedIssueOption("");
                    setIsIssueStepComplete(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name={reason.icon}
                    size={24}
                    color={BRAND_COLORS.orange}
                    style={styles.reasonIcon}
                  />
                  <View style={styles.reasonTextWrap}>
                    <Text style={styles.reasonTitle}>{reason.title}</Text>
                    <Text style={styles.reasonSubtitle}>{reason.subtitle}</Text>
                  </View>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <>
            <View style={styles.selectedReasonCard}>
              <View style={styles.selectedReasonLeft}>
                <MaterialCommunityIcons
                  name={selectedReason.icon}
                  size={24}
                  color={BRAND_COLORS.orange}
                  style={styles.reasonIcon}
                />
                <View style={styles.reasonTextWrap}>
                  <Text style={styles.reasonTitle}>{selectedReason.title}</Text>
                  <Text style={styles.reasonSubtitle}>{selectedReason.subtitle}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setSelectedReasonId("");
                  setSelectedIssueOption("");
                  setIsIssueStepComplete(false);
                }}
              >
                <Text style={styles.editBtnText}>EDIT</Text>
                <Ionicons name="chevron-down" size={16} color={BRAND_COLORS.orange} />
              </TouchableOpacity>
            </View>

            {!isIssueStepComplete ? (
              <>
                <Text style={styles.sectionTitle}>
                  What is the issue with {selectedReason.title.toLowerCase()}?
                </Text>
                <View style={styles.reasonList}>
                  {selectedReasonOptions.map((option) => {
                    const selected = selectedIssueOption === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={styles.reasonRow}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedIssueOption(option);
                          setIsIssueStepComplete(true);
                          setTimeout(() => {
                            scrollRef.current?.scrollTo({ y: 0, animated: true });
                          }, 0);
                        }}
                      >
                        <View style={styles.reasonTextWrap}>
                          <Text style={styles.reasonTitle}>{option}</Text>
                        </View>
                        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                          {selected ? <View style={styles.radioInner} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <View style={styles.stepHeaderRow}>
                  <Text style={styles.stepHeaderTitle}>
                    What is the issue with {selectedReason.title.toLowerCase()}?
                  </Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                      setSelectedIssueOption("");
                      setIsIssueStepComplete(false);
                    }}
                  >
                    <Text style={styles.editBtnText}>EDIT</Text>
                    <Ionicons name="chevron-down" size={16} color={BRAND_COLORS.orange} />
                  </TouchableOpacity>
                </View>
                <View style={styles.singleChoiceCard}>
                  <Text style={styles.reasonTitle}>{selectedIssueOption}</Text>
                </View>

                <Text style={styles.sectionTitle}>What do you want to do?</Text>
                <View style={styles.reasonList}>
                  <TouchableOpacity
                    style={styles.reasonRow}
                    activeOpacity={0.85}
                    onPress={() => setSelectedAction("return")}
                  >
                    <View style={styles.reasonTextWrap}>
                      <Text style={styles.reasonTitle}>Return</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedAction === "return" && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedAction === "return" ? <View style={styles.radioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reasonRow}
                    activeOpacity={0.85}
                    onPress={() => setSelectedAction("exchange")}
                  >
                    <View style={styles.reasonTextWrap}>
                      <Text style={styles.reasonTitle}>Exchange</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        selectedAction === "exchange" && styles.radioOuterSelected,
                      ]}
                    >
                      {selectedAction === "exchange" ? <View style={styles.radioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                </View>

                {selectedAction === "exchange" && !isExchangeAvailable ? (
                  <Text style={styles.warningText}>
                    Exchange is not available for this product for the selected reason. You can
                    return it and buy something else.
                  </Text>
                ) : null}

                {selectedAction === "exchange" && isExchangeAvailable ? (
                  <Text style={styles.successText}>
                    Exchange is available for this reason. Please submit your request.
                  </Text>
                ) : null}
                {selectedAction === "exchange" && isExchangeAvailable ? (
                  <View style={styles.nextStepsCard}>
                    <Text style={styles.nextStepsTitle}>Next steps for exchange</Text>
                    <Text style={styles.nextStepsItem}>1. Upload unboxing video clearly.</Text>
                    <Text style={styles.nextStepsItem}>2. Submit the exchange request.</Text>
                    <Text style={styles.nextStepsItem}>
                      3. Our team verifies and schedules pickup.
                    </Text>
                    <Text style={styles.nextStepsItem}>
                      4. Replacement is shipped after quality check.
                    </Text>
                  </View>
                ) : null}
                {selectedAction === "exchange" && isExchangeAvailable ? (
                  <View style={styles.exchangeFieldsCard}>
                    <Text style={styles.nextStepsTitle}>Exchange details</Text>
                    <Text style={styles.exchangeFieldLabel}>Choose exchange type</Text>
                    {EXCHANGE_OPTION_LIST.map((option) => {
                      const selected = selectedExchangeOption === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.exchangeOptionRow, selected && styles.exchangeOptionRowActive]}
                          onPress={() => {
                            setSelectedExchangeOption(option);
                            setSelectedNewColor("");
                          }}
                          activeOpacity={0.85}
                        >
                          <Text
                            style={[
                              styles.exchangeOptionText,
                              selected && styles.exchangeOptionTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {requiresSizeSelection ? (
                      <>
                        <Text style={styles.exchangeFieldLabel}>Select required new size</Text>
                        <View style={styles.sizeOptionsWrap}>
                          {SIZE_OPTIONS.map((size) => {
                            const selected = selectedNewSize === size;
                            return (
                              <TouchableOpacity
                                key={size}
                                style={[styles.sizeChip, selected && styles.sizeChipActive]}
                                onPress={() => setSelectedNewSize(size)}
                                activeOpacity={0.85}
                              >
                                <Text
                                  style={[styles.sizeChipText, selected && styles.sizeChipTextActive]}
                                >
                                  {size}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    ) : null}
                    {requiresColorSelection ? (
                      <>
                        <Text style={styles.exchangeFieldLabel}>Select required new color</Text>
                        <View style={styles.sizeOptionsWrap}>
                          {COLOR_OPTIONS.map((color) => {
                            const selected = selectedNewColor === color;
                            return (
                              <TouchableOpacity
                                key={color}
                                style={[styles.sizeChip, selected && styles.sizeChipActive]}
                                onPress={() => setSelectedNewColor(color)}
                                activeOpacity={0.85}
                              >
                                <Text
                                  style={[styles.sizeChipText, selected && styles.sizeChipTextActive]}
                                >
                                  {color}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    ) : null}
                    <Text style={styles.exchangeFieldLabel}>Comment (optional)</Text>
                    <TextInput
                      value={exchangeComment}
                      onChangeText={setExchangeComment}
                      placeholder="Add notes like preferred color, fit concern, or replacement preference"
                      placeholderTextColor={BRAND_COLORS.slate}
                      style={styles.exchangeInput}
                      multiline
                    />
                  </View>
                ) : null}

                <Text style={styles.sectionTitle}>Please upload unboxing video</Text>
                <TouchableOpacity
                  style={styles.addImageBtn}
                  activeOpacity={0.85}
                  onPress={pickUnboxingVideo}
                >
                  <Ionicons name="add" size={24} color={BRAND_COLORS.orange} />
                </TouchableOpacity>
                {selectedVideoName ? (
                  <Text style={styles.uploadedVideoName}>Uploaded: {selectedVideoName}</Text>
                ) : null}
                <Text style={styles.imageHint}>
                  Please upload a clear unboxing video of the delivered product to help verify
                  your request and avoid rejection.
                </Text>

                <View style={styles.addressSection}>
                  <View style={styles.stepHeaderRow}>
                    <Text style={styles.stepHeaderTitle}>Pickup Address</Text>
                    <TouchableOpacity style={styles.editBtn}>
                      <Text style={styles.editBtnText}>EDIT</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.addressName}>sravani</Text>
                  <Text style={styles.addressText}>
                    1-157/8/tara womens pg hostel, Vemukunta, Chanda Nagar, Road Number 6,
                    Serilingampally, Rangareddy District, Hyderabad, Telangana, 500050
                  </Text>
                  <Text style={styles.addressPhone}>6300885700</Text>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  activeOpacity={0.9}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitBtnText}>
                    {selectedAction === "exchange" && isExchangeAvailable
                      ? "Submit request for exchange"
                      : "Submit"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 46,
    paddingBottom: 14,
    backgroundColor: "#1d324e",
    borderBottomWidth: 1,
    borderBottomColor: "#6c8494",
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#f6c795",
  },
  content: {
    paddingVertical: 16,
    paddingBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1d324e",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  productCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#69798c",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 12,
  },
  productMetaWrap: {
    flex: 1,
    justifyContent: "center",
  },
  productName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d324e",
  },
  productMeta: {
    marginTop: 2,
    fontSize: 10,
    color: "#69798c",
  },
  productPrice: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#79411c",
  },
  reasonList: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#69798c",
    borderRadius: 14,
    overflow: "hidden",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f6c795",
  },
  reasonIcon: {
    marginRight: 12,
  },
  reasonTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d324e",
  },
  reasonSubtitle: {
    marginTop: 4,
    fontSize: 10,
    color: "#69798c",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#6c8494",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: "#1d324e",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#ef7b1a",
  },
  selectedReasonCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#69798c",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepHeaderRow: {
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stepHeaderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1d324e",
  },
  singleChoiceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#69798c",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedReasonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editBtnText: {
    color: "#ef7b1a",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.4,
  },
  warningText: {
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f6c795",
    borderWidth: 1,
    borderColor: "#79411c",
    fontSize: 11,
    color: "#79411c",
    lineHeight: 16,
    fontWeight: "600",
  },
  successText: {
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f6c795",
    borderWidth: 1,
    borderColor: "#6c8494",
    fontSize: 11,
    color: "#1d324e",
    lineHeight: 16,
    fontWeight: "600",
  },
  nextStepsCard: {
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#6c8494",
  },
  nextStepsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d324e",
    marginBottom: 6,
  },
  nextStepsItem: {
    fontSize: 11,
    color: "#504f56",
    lineHeight: 16,
    marginBottom: 2,
  },
  exchangeFieldsCard: {
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#6c8494",
  },
  exchangeFieldLabel: {
    fontSize: 11,
    color: "#504f56",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 6,
  },
  exchangeOptionRow: {
    borderWidth: 1,
    borderColor: "#6c8494",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 7,
    backgroundColor: "#FFFFFF",
  },
  exchangeOptionRowActive: {
    borderColor: "#1d324e",
    backgroundColor: "#f6c795",
  },
  exchangeOptionText: {
    fontSize: 11,
    color: "#1d324e",
    fontWeight: "600",
  },
  exchangeOptionTextActive: {
    color: "#79411c",
  },
  sizeOptionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: "#6c8494",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  sizeChipActive: {
    borderColor: "#1d324e",
    backgroundColor: "#f6c795",
  },
  sizeChipText: {
    fontSize: 11,
    color: "#1d324e",
    fontWeight: "700",
  },
  sizeChipTextActive: {
    color: "#79411c",
  },
  exchangeInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#6c8494",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#1d324e",
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: "top",
  },
  addImageBtn: {
    marginHorizontal: 16,
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#6c8494",
    borderStyle: "dashed",
    backgroundColor: "#fffaf2",
    alignItems: "center",
    justifyContent: "center",
  },
  imageHint: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 18,
    fontSize: 11,
    color: "#504f56",
    lineHeight: 16,
  },
  uploadedVideoName: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 11,
    color: "#1d324e",
    fontWeight: "600",
  },
  addressSection: {
    marginHorizontal: 16,
    backgroundColor: "#fffaf2",
    borderWidth: 1,
    borderColor: "#69798c",
    borderRadius: 14,
    paddingBottom: 14,
  },
  addressName: {
    marginHorizontal: 16,
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#1d324e",
  },
  addressText: {
    marginHorizontal: 16,
    marginTop: 6,
    fontSize: 11,
    color: "#504f56",
    lineHeight: 16,
  },
  addressPhone: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 11,
    color: "#504f56",
    fontWeight: "600",
  },
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: "#1d324e",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
  },
  submitBtnText: {
    color: "#f6c795",
    fontSize: 15,
    fontWeight: "800",
  },
});

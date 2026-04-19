import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  RefreshControl,
  Animated,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import HomeBottomTabBar from "../components/HomeBottomTabBar";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type OrderStatus = "all" | "processing" | "shipped" | "delivered" | "cancelled" | "returns";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: number;
  total: string;
  image: any;
  trackingNumber?: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  /** Optional UI stage for return orders (1–4). */
  returnStage?: 1 | 2 | 3 | 4;
  products?: {
    id: string;
    name: string;
    image: any;
    quantity: number;
    price: string;
  }[];
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
    trackingNumber: "TRK123456789",
    paymentMethod: "Credit Card",
    deliveryAddress: "123 Main Street, Apartment 4B",
    estimatedDelivery: "Delivered on 18 Jan 2024",
    products: [
      { id: "p1", name: "Premium Product A", image: require("../assets/images/age5.png"), quantity: 1, price: "₹1,299" },
      { id: "p2", name: "Premium Product B", image: require("../assets/images/age6.png"), quantity: 1, price: "₹1,200" },
    ],
  },
  {
    id: "2",
    orderNumber: "#ORD-2024-002",
    date: "18 Jan 2024",
    status: "shipped",
    items: 1,
    total: "₹1,299",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK987654321",
    paymentMethod: "UPI",
    deliveryAddress: "456 Park Avenue, Floor 2",
    estimatedDelivery: "Expected: 25 Jan 2024",
    products: [
      { id: "p3", name: "Premium Product C", image: require("../assets/images/age6.png"), quantity: 1, price: "₹1,299" },
    ],
  },
  {
    id: "3",
    orderNumber: "#ORD-2024-003",
    date: "20 Jan 2024",
    status: "processing",
    items: 3,
    total: "₹3,999",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK456789123",
    paymentMethod: "Debit Card",
    deliveryAddress: "789 Oak Street",
    estimatedDelivery: "Expected: 28 Jan 2024",
    products: [
      { id: "p4", name: "Premium Product D", image: require("../assets/images/age5.png"), quantity: 2, price: "₹2,000" },
      { id: "p5", name: "Premium Product E", image: require("../assets/images/age6.png"), quantity: 1, price: "₹1,999" },
    ],
  },
  {
    id: "4",
    orderNumber: "#ORD-2024-004",
    date: "22 Jan 2024",
    status: "delivered",
    items: 1,
    total: "₹899",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK789123456",
    paymentMethod: "Wallet",
    deliveryAddress: "321 Elm Street",
    estimatedDelivery: "Delivered on 24 Jan 2024",
    products: [
      { id: "p6", name: "Premium Product F", image: require("../assets/images/age6.png"), quantity: 1, price: "₹899" },
    ],
  },
  {
    id: "5",
    orderNumber: "#ORD-2024-005",
    date: "25 Jan 2024",
    status: "returns",
    returnStage: 2,
    items: 2,
    total: "₹1,599",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK111222333",
    paymentMethod: "Net Banking",
    deliveryAddress: "654 Pine Street",
    products: [
      { id: "p7", name: "Premium Product G", image: require("../assets/images/age5.png"), quantity: 2, price: "₹1,599" },
    ],
  },
  {
    id: "6",
    orderNumber: "#ORD-2024-006",
    date: "28 Jan 2024",
    status: "cancelled",
    items: 1,
    total: "₹1,499",
    image: require("../assets/images/age6.png"),
    paymentMethod: "UPI",
    deliveryAddress: "888 Pine Street",
    products: [
      { id: "p8", name: "Premium Product H", image: require("../assets/images/age6.png"), quantity: 1, price: "₹1,499" },
    ],
  },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  // Android hardware back should step back within this screen
  // (Details -> list, close modals/search) before leaving the page.
  useEffect(() => {
    const onHardwareBackPress = () => {
      if (showCancelModal) {
        setShowCancelModal(false);
        return true;
      }
      if (showReturnModal) {
        setShowReturnModal(false);
        return true;
      }
      if (showSearch) {
        setShowSearch(false);
        setSearchQuery("");
        searchInputRef.current?.blur();
        return true;
      }
      if (showDetails) {
        setShowDetails(false);
        return true;
      }
      return false; // allow default behaviour (router back)
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
    return () => sub.remove();
  }, [showCancelModal, showReturnModal, showSearch, showDetails]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearch]);

  const getFilteredOrders = () => {
    let filtered = activeTab === "all" 
      ? sampleOrders 
      : sampleOrders.filter((order) => order.status === activeTab);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        return (
          order.orderNumber.toLowerCase().includes(query) ||
          order.trackingNumber?.toLowerCase().includes(query) ||
          order.products?.some((p) => p.name.toLowerCase().includes(query)) ||
          order.paymentMethod?.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered;
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return { color: "#10B981", bgColor: "#D1FAE5", icon: "checkmark-circle", text: "Delivered" };
      case "shipped":
        return { color: "#3B82F6", bgColor: "#DBEAFE", icon: "car", text: "Shipped" };
      case "processing":
        return { color: "#F59E0B", bgColor: "#FEF3C7", icon: "time", text: "Processing" };
      case "cancelled":
        return { color: "#EF4444", bgColor: "#FEE2E2", icon: "close-circle", text: "Cancelled" };
      case "returns":
        return { color: "#8B5CF6", bgColor: "#EDE9FE", icon: "return-down-back", text: "Return" };
      default:
        return { color: "#6B7280", bgColor: "#F3F4F6", icon: "ellipse", text: status };
    }
  };

  const tabs = [
    { key: "all" as OrderStatus, label: "All", icon: "list" },
    { key: "processing" as OrderStatus, label: "Processing", icon: "time-outline" },
    { key: "shipped" as OrderStatus, label: "Shipped", icon: "car-outline" },
    { key: "delivered" as OrderStatus, label: "Delivered", icon: "checkmark-circle-outline" },
    { key: "cancelled" as OrderStatus, label: "Cancelled", icon: "close-circle-outline" },
    { key: "returns" as OrderStatus, label: "Returns", icon: "return-down-back-outline" },
  ];

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      Alert.alert("Required", "Please provide a reason");
      return;
    }
    Alert.alert("Success", "Order cancelled successfully");
    setShowCancelModal(false);
    setCancelReason("");
  };

  const handleReturn = () => {
    if (!returnReason) {
      Alert.alert("Required", "Please select a reason");
      return;
    }
    Alert.alert("Success", "Return request submitted");
    setShowReturnModal(false);
    setReturnReason("");
  };

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        {!showSearch ? (
          <>
            <TouchableOpacity
              onPress={() => {
                if (showDetails) {
                  setShowDetails(false);
                  return;
                }
                router.back();
              }}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{showDetails ? "Order Details" : "My Orders"}</Text>
              {!showDetails && (
                <Text style={styles.headerSubtitle}>{filteredOrders.length} orders</Text>
              )}
            </View>
            {!showDetails ? (
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search-outline" size={24} color="#111827" />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
          </>
        ) : (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search orders, tracking number..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
                searchInputRef.current?.blur();
              }}
              style={styles.cancelSearchBtn}
            >
              <Text style={styles.cancelSearchText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      {!showDetails && (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={isActive ? "#FFFFFF" : "#6B7280"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Orders List */}
      {showDetails && selectedOrder ? (
        <OrderDetailsView
          order={selectedOrder}
          onCancel={() => setShowCancelModal(true)}
          onReturn={() => setShowReturnModal(true)}
          getStatusConfig={getStatusConfig}
        />
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery.trim() ? "search-outline" : "receipt-outline"} 
                size={80} 
                color="#D1D5DB" 
              />
              <Text style={styles.emptyText}>
                {searchQuery.trim() ? "No results found" : "No orders found"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim() 
                  ? `No orders match "${searchQuery}"` 
                  : activeTab === "all" 
                    ? "Start shopping to see your orders here" 
                    : `No ${getStatusConfig(activeTab).text.toLowerCase()} orders`}
              </Text>
              {searchQuery.trim() && (
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => {
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.ordersList}>
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => handleOrderPress(order)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                        <Text style={styles.orderDate}>{order.date}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.text}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderCardBody}>
                      <Image source={order.image} style={styles.orderImage} />
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderItemsText}>
                          {order.items} {order.items === 1 ? "item" : "items"}
                        </Text>
                        <Text style={styles.orderTotal}>{order.total}</Text>
                      </View>
                    </View>

                    {order.trackingNumber && (
                      <View style={styles.trackingInfo}>
                        <Ionicons name="cube-outline" size={14} color="#6B7280" />
                        <Text style={styles.trackingText}>{order.trackingNumber}</Text>
                      </View>
                    )}

                    <View style={styles.orderCardFooter}>
                      <TouchableOpacity
                        style={styles.viewDetailsBtn}
                        onPress={() => handleOrderPress(order)}
                      >
                        <Text style={styles.viewDetailsText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={16} color="#E97A1F" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Cancel Modal */}
      <CancelModal
        visible={showCancelModal}
        order={selectedOrder}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        onCancel={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
      />

      {/* Return Modal */}
      <ReturnModal
        visible={showReturnModal}
        order={selectedOrder}
        reason={returnReason}
        onReasonChange={setReturnReason}
        onCancel={() => setShowReturnModal(false)}
        onConfirm={handleReturn}
      />

      <HomeBottomTabBar />
    </View>
  );
}

// Order Details Component
function OrderDetailsView({
  order,
  onCancel,
  onReturn,
  getStatusConfig,
}: {
  order: Order;
  onCancel: () => void;
  onReturn: () => void;
  getStatusConfig: (status: OrderStatus) => any;
}) {
  const statusConfig = getStatusConfig(order.status);

  return (
    <ScrollView
      style={styles.detailsContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 90 }}
    >
      {/* Order Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <View>
            <Text style={styles.statusCardLabel}>Order Status</Text>
            <Text style={styles.statusCardValue}>{statusConfig.text}</Text>
          </View>
          <View style={[styles.statusIconWrapper, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon as any} size={32} color={statusConfig.color} />
          </View>
        </View>
        {order.estimatedDelivery && (
          <View style={styles.deliveryInfo}>
            <Ionicons name="time-outline" size={16} color="#F59E0B" />
            <Text style={styles.deliveryText}>{order.estimatedDelivery}</Text>
          </View>
        )}

        {/* Processing-only progress like reference */}
        {order.status === "processing" && (
          <View style={styles.processingTrackerWrap}>
            {/* Visual state matches common e-commerce trackers while still "Processing" */}
            <OrderProgressStepper currentStep={3} />
            <View style={styles.processingMessageWrap}>
              <Text style={styles.processingMessageTitle}>We’re preparing your order</Text>
              <Text style={styles.processingMessageSub}>
                Your items are being picked and packed. You’ll get an update when it ships.
              </Text>
            </View>
          </View>
        )}

        {order.status === "returns" && (
          <View style={styles.returnTrackerWrap}>
            <OrderProgressStepper
              variant="returns"
              currentStep={order.returnStage ?? 2}
            />
            <View style={styles.returnMessageWrap}>
              <Text style={styles.returnMessageTitle}>Return is in progress</Text>
              <Text style={styles.returnMessageSub}>
                We’ll keep you posted at every step — from pickup to refund completion.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Order Info */}
      <View style={styles.infoCard}>
        <InfoRow label="Order Number" value={order.orderNumber} />
        <InfoRow label="Order Date" value={order.date} />
        {order.trackingNumber && (
          <InfoRow label="Tracking Number" value={order.trackingNumber} highlight />
        )}
        {order.paymentMethod && (
          <InfoRow label="Payment Method" value={order.paymentMethod} />
        )}
      </View>

      {/* Products */}
      <View style={styles.productsCard}>
        <Text style={styles.cardTitle}>Products ({order.items})</Text>
        {order.products?.map((product) => (
          <View key={product.id} style={styles.productItem}>
            <Image source={product.image} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>
                Qty: {product.quantity} × {product.price}
              </Text>
            </View>
            <Text style={styles.productPrice}>{product.price}</Text>
          </View>
        ))}
      </View>

      {/* Address */}
      {order.deliveryAddress && (
        <View style={styles.infoCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color="#E97A1F" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>{order.deliveryAddress}</Text>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        <SummaryRow label="Subtotal" value={order.total} />
        <SummaryRow label="Shipping" value="₹99" />
        <SummaryRow label="Tax" value="₹0" />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{order.total}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {order.status === "processing" && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
        {order.status === "shipped" && (
          <TouchableOpacity style={styles.trackBtn}>
            <Ionicons name="location" size={20} color="#FFFFFF" />
            <Text style={styles.trackBtnText}>Track Package</Text>
          </TouchableOpacity>
        )}
        {order.status === "delivered" && (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => Alert.alert("Success", "Added to cart")}
            >
              <Ionicons name="cart" size={20} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Buy Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onReturn}>
              <Ionicons name="return-down-back" size={20} color="#2196F3" />
              <Text style={styles.secondaryBtnText}>Return / Replace</Text>
            </TouchableOpacity>
          </>
        )}
        {order.status === "returns" && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onReturn}>
            <Ionicons name="refresh" size={20} color="#8B5CF6" />
            <Text style={[styles.secondaryBtnText, { color: "#8B5CF6" }]}>View Return Status</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function OrderProgressStepper({
  currentStep,
  variant = "fulfillment",
}: {
  currentStep: 1 | 2 | 3 | 4;
  variant?: "fulfillment" | "returns";
}) {
  const steps =
    variant === "returns"
      ? ([
          { key: 1 as const, label: "Return\nRequested", icon: "return-down-back-outline" as const },
          { key: 2 as const, label: "Item\nReceived", icon: "cube-outline" as const },
          { key: 3 as const, label: "Quality\nCheck", icon: "search-outline" as const },
          { key: 4 as const, label: "Refund\nCompleted", icon: "cash-outline" as const },
        ] as const)
      : ([
          { key: 1 as const, label: "Order\nPlaced", icon: "bag-outline" as const },
          { key: 2 as const, label: "Shipped", icon: "cube-outline" as const },
          { key: 3 as const, label: "In Transit", icon: "car-outline" as const },
          { key: 4 as const, label: "Delivered", icon: "checkmark" as const },
        ] as const);

  const clampedStep = Math.min(4, Math.max(1, currentStep)) as 1 | 2 | 3 | 4;
  const lineFillPct: Record<1 | 2 | 3 | 4, number> = {
    1: 18,
    2: 44,
    // Line reaches the end visually (like reference), while last node stays "pending"
    3: 100,
    4: 100,
  };
  const lineFillColor =
    clampedStep >= 3
      ? "rgba(0, 0, 0, 0)"
      : variant === "returns"
        ? "rgba(124, 58, 237, 0.55)"
        : "rgba(37, 99, 235, 0.55)";

  const trackBg = variant === "returns" ? "#EDE9FE" : "#CFE3F5";
  const completeFill = variant === "returns" ? "#DDD6FE" : "#CFE3F5";
  const completeBorder = variant === "returns" ? "#DDD6FE" : "#CFE3F5";
  const futureBg = variant === "returns" ? "#F5F3FF" : "#F4FAFF";
  const futureBorder = variant === "returns" ? "#E9D5FF" : "#D7E8F7";
  const currentBorder = variant === "returns" ? "#7C3AED" : "#3B82F6";
  const currentBg = variant === "returns" ? "#F3E8FF" : "#EFF6FF";
  const pendingBorder = variant === "returns" ? "#DDD6FE" : "#CFE3F5";
  const shadow = variant === "returns" ? "#7C3AED" : "#2563EB";

  const iconComplete = variant === "returns" ? "#5B21B6" : "#0B4F7A";
  const iconCurrent = variant === "returns" ? "#6D28D9" : "#1D4ED8";
  const iconMuted = variant === "returns" ? "#A78BFA" : "#7AA6C9";
  const iconFuture = variant === "returns" ? "#9CA3AF" : "#94A3B8";

  return (
    <View style={styles.stepperWrap}>
      <View style={[styles.stepperLineTrack, { backgroundColor: trackBg }]}>
        <View
          style={[
            styles.stepperLineFill,
            { width: `${lineFillPct[clampedStep]}%`, backgroundColor: lineFillColor },
          ]}
        />
      </View>
      <View style={styles.stepperRow}>
        {steps.map((s) => {
          const isComplete = s.key < clampedStep;
          const isCurrent = s.key === clampedStep;
          const isFuture = s.key > clampedStep;

          const isDeliveredNode = s.key === 4;
          const deliveredPending = isDeliveredNode && clampedStep < 4;
          const deliveredDone = isDeliveredNode && clampedStep === 4;

          let circleStyle = [
            styles.stepCircleBase,
            { shadowColor: shadow },
            { borderColor: futureBorder, backgroundColor: futureBg },
          ];
          if (deliveredPending) {
            circleStyle = [
              styles.stepCircleBase,
              { shadowColor: shadow },
              { borderColor: pendingBorder, backgroundColor: "#FFFFFF" },
            ];
          } else if (isComplete || deliveredDone) {
            circleStyle = [
              styles.stepCircleBase,
              { shadowColor: shadow },
              { borderColor: completeBorder, backgroundColor: completeFill },
            ];
          } else if (isCurrent) {
            circleStyle = [
              styles.stepCircleBase,
              { shadowColor: shadow, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5 },
              { borderColor: currentBorder, backgroundColor: currentBg },
            ];
          }

          let iconColor = iconFuture;
          if (deliveredPending) iconColor = iconMuted;
          else if (isComplete || deliveredDone) iconColor = iconComplete;
          else if (isCurrent) iconColor = iconCurrent;

          const labelStyle = isFuture && !deliveredPending ? styles.stepLabelMuted : styles.stepLabelRef;

          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              style={styles.stepNodeRef}
              onPress={() => {}}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={circleStyle}>
                <Ionicons
                  name={s.icon as any}
                  size={22}
                  color={iconColor}
                  style={isDeliveredNode ? { marginLeft: 1 } : undefined}
                />
              </View>
              <Text style={labelStyle} numberOfLines={2}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Info Row Component
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>{value}</Text>
    </View>
  );
}

// Summary Row Component
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

// Cancel Modal Component
function CancelModal({
  visible,
  order,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  order: Order | null;
  reason: string;
  onReasonChange: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          {order && (
            <View style={styles.modalOrderInfo}>
              <Text style={styles.modalOrderLabel}>Order: {order.orderNumber}</Text>
              <Text style={styles.modalOrderValue}>Amount: {order.total}</Text>
            </View>
          )}
          <Text style={styles.modalLabel}>Reason for cancellation</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter reason..."
            multiline
            value={reason}
            onChangeText={onReasonChange}
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Return Modal Component
function ReturnModal({
  visible,
  order,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  order: Order | null;
  reason: string;
  onReasonChange: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reasons = ["Wrong Item", "Defective", "Size Issue", "Not as Described", "Other"];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Return / Replace</Text>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          {order && (
            <View style={styles.modalProductInfo}>
              <Image source={order.image} style={styles.modalProductImage} />
              <View>
                <Text style={styles.modalProductName}>{order.products?.[0]?.name || "Product"}</Text>
                <Text style={styles.modalProductMeta}>{order.orderNumber}</Text>
              </View>
            </View>
          )}
          <Text style={styles.modalLabel}>Select reason</Text>
          {reasons.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonBtn, reason === r && styles.reasonBtnActive]}
              onPress={() => onReasonChange(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
              {reason === r && <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />}
            </TouchableOpacity>
          ))}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={onConfirm}>
              <Text style={styles.modalConfirmText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  searchBtn: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  cancelSearchBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelSearchText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E97A1F",
  },
  placeholder: {
    width: 32,
  },
  tabsWrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  tabActive: {
    backgroundColor: "#E97A1F",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  clearSearchBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#E97A1F",
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  orderCardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderItemsText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
  },
  trackingInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 12,
  },
  trackingText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  orderCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E97A1F",
    marginRight: 4,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statusCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusCardLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statusIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  deliveryText: {
    fontSize: 14,
    color: "#111827",
    marginLeft: 8,
    fontWeight: "500",
  },
  processingTrackerWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  returnTrackerWrap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  stepperWrap: {
    position: "relative",
    paddingTop: 6,
    paddingBottom: 2,
    overflow: "visible",
  },
  stepperLineTrack: {
    position: "absolute",
    left: 44,
    right: 44,
    top: 6 + 26, // centers line relative to 52px circle
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  stepperLineFill: {
    height: "100%",
    borderRadius: 999,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepNodeRef: {
    width: 78,
    alignItems: "center",
  },
  stepCircleBase: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  stepLabelRef: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    lineHeight: 16,
  },
  stepLabelMuted: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  processingMessageWrap: {
    marginTop: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  processingMessageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  processingMessageSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 16,
  },
  returnMessageWrap: {
    marginTop: 12,
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  returnMessageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  returnMessageSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  infoValueHighlight: {
    color: "#E97A1F",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  productsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E97A1F",
  },
  actionsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E97A1F",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalOrderInfo: {
    padding: 20,
    backgroundColor: "#F9FAFB",
    margin: 20,
    borderRadius: 12,
  },
  modalOrderLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  modalOrderValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalProductInfo: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#F9FAFB",
    margin: 20,
    borderRadius: 12,
  },
  modalProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  modalProductMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#F9FAFB",
  },
  reasonBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reasonBtnActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
  },
  reasonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  reasonTextActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E97A1F",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

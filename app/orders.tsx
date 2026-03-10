import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type OrderStatus = "all" | "in_progress" | "delivered" | "cancelled" | "returns";

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
    paymentMethod: "Credit Card •••• 1234",
    deliveryAddress: "123 Main Street, Apartment 4B, City, State - 123456",
    estimatedDelivery: "Delivered on 18 Jan 2024",
  },
  {
    id: "2",
    orderNumber: "#ORD-2024-002",
    date: "18 Jan 2024",
    status: "in_progress",
    items: 1,
    total: "₹1,299",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK987654321",
    paymentMethod: "UPI •••• 5678",
    deliveryAddress: "456 Park Avenue, Floor 2, City, State - 654321",
    estimatedDelivery: "Expected delivery: 25 Jan 2024",
  },
  {
    id: "3",
    orderNumber: "#ORD-2024-003",
    date: "20 Jan 2024",
    status: "cancelled",
    items: 3,
    total: "₹3,999",
    image: require("../assets/images/age5.png"),
    paymentMethod: "Debit Card •••• 9012",
    deliveryAddress: "789 Oak Street, City, State - 789012",
  },
  {
    id: "4",
    orderNumber: "#ORD-2024-004",
    date: "22 Jan 2024",
    status: "delivered",
    items: 1,
    total: "₹899",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK456789123",
    paymentMethod: "Wallet",
    deliveryAddress: "321 Elm Street, City, State - 345678",
    estimatedDelivery: "Delivered on 24 Jan 2024",
  },
  {
    id: "5",
    orderNumber: "#ORD-2024-005",
    date: "25 Jan 2024",
    status: "returns",
    items: 2,
    total: "₹1,599",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK789123456",
    paymentMethod: "Net Banking",
    deliveryAddress: "654 Pine Street, City, State - 456789",
  },
  {
    id: "6",
    orderNumber: "#ORD-2024-006",
    date: "28 Jan 2024",
    status: "delivered",
    items: 4,
    total: "₹4,299",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK111222333",
    paymentMethod: "Credit Card •••• 3456",
    deliveryAddress: "987 Maple Avenue, Suite 5, City, State - 789123",
    estimatedDelivery: "Delivered on 30 Jan 2024",
  },
  {
    id: "7",
    orderNumber: "#ORD-2024-007",
    date: "01 Feb 2024",
    status: "in_progress",
    items: 2,
    total: "₹1,899",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK444555666",
    paymentMethod: "UPI •••• 7890",
    deliveryAddress: "555 Cedar Lane, City, State - 123789",
    estimatedDelivery: "Expected delivery: 05 Feb 2024",
  },
  {
    id: "8",
    orderNumber: "#ORD-2024-008",
    date: "03 Feb 2024",
    status: "delivered",
    items: 1,
    total: "₹599",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK777888999",
    paymentMethod: "Wallet",
    deliveryAddress: "222 Birch Road, City, State - 456123",
    estimatedDelivery: "Delivered on 05 Feb 2024",
  },
  {
    id: "9",
    orderNumber: "#ORD-2024-009",
    date: "05 Feb 2024",
    status: "in_progress",
    items: 3,
    total: "₹3,199",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK000111222",
    paymentMethod: "Debit Card •••• 3456",
    deliveryAddress: "777 Spruce Drive, City, State - 789456",
    estimatedDelivery: "Expected delivery: 08 Feb 2024",
  },
  {
    id: "10",
    orderNumber: "#ORD-2024-010",
    date: "07 Feb 2024",
    status: "delivered",
    items: 2,
    total: "₹2,199",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK333444555",
    paymentMethod: "Credit Card •••• 5678",
    deliveryAddress: "333 Willow Way, City, State - 123456",
    estimatedDelivery: "Delivered on 09 Feb 2024",
  },
  {
    id: "11",
    orderNumber: "#ORD-2024-011",
    date: "09 Feb 2024",
    status: "cancelled",
    items: 1,
    total: "₹1,499",
    image: require("../assets/images/age5.png"),
    paymentMethod: "UPI •••• 9012",
    deliveryAddress: "888 Pine Street, City, State - 456789",
  },
  {
    id: "12",
    orderNumber: "#ORD-2024-012",
    date: "11 Feb 2024",
    status: "returns",
    items: 2,
    total: "₹1,799",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK666777888",
    paymentMethod: "Net Banking",
    deliveryAddress: "444 Elm Court, City, State - 789123",
  },
  {
    id: "13",
    orderNumber: "#ORD-2024-013",
    date: "13 Feb 2024",
    status: "delivered",
    items: 5,
    total: "₹5,499",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK999000111",
    paymentMethod: "Credit Card •••• 7890",
    deliveryAddress: "111 Oak Boulevard, City, State - 123789",
    estimatedDelivery: "Delivered on 15 Feb 2024",
  },
  {
    id: "14",
    orderNumber: "#ORD-2024-014",
    date: "15 Feb 2024",
    status: "in_progress",
    items: 1,
    total: "₹999",
    image: require("../assets/images/age6.png"),
    trackingNumber: "TRK222333444",
    paymentMethod: "Wallet",
    deliveryAddress: "666 Maple Circle, City, State - 456123",
    estimatedDelivery: "Expected delivery: 18 Feb 2024",
  },
  {
    id: "15",
    orderNumber: "#ORD-2024-015",
    date: "17 Feb 2024",
    status: "delivered",
    items: 3,
    total: "₹3,599",
    image: require("../assets/images/age5.png"),
    trackingNumber: "TRK555666777",
    paymentMethod: "Debit Card •••• 1234",
    deliveryAddress: "999 Cedar Avenue, City, State - 789456",
    estimatedDelivery: "Delivered on 19 Feb 2024",
  },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    setShowOrdersModal(true);
  }, []);

  const getFilteredOrders = () => {
    if (activeTab === "all") {
      return sampleOrders;
    }
    return sampleOrders.filter((order) => order.status === activeTab);
  };

  const filteredOrders = getFilteredOrders();

  const getStatusColor = (status: OrderStatus) => {
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

  const getStatusText = (status: OrderStatus) => {
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

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: "all", label: "All Orders" },
    { key: "in_progress", label: "In Progress" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
    { key: "returns", label: "Returns & Refunds" },
  ];

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrdersModal(false);
    setShowOrderModal(true);
  };

  const handleTabClick = (tabKey: OrderStatus) => {
    setActiveTab(tabKey);
  };

  const handleTrackOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowTrackModal(true);
  };

  const handleCancelOrder = (order: Order) => {
    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel order ${order.orderNumber}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
          },
        },
      ]
    );
  };

  const handleReturnReplace = (order: Order) => {
    setSelectedOrder(order);
    setShowReturnModal(true);
  };

  const handleBuyAgain = (order: Order) => {
    Alert.alert("Buy Again", `Adding items from order ${order.orderNumber} to cart...`);
  };

  const handleCloseOrdersModal = () => {
    setShowOrdersModal(false);
    router.back();
  };

  const trackingSteps = [
    { label: "Order Placed", completed: true, date: "25 Jan 2024, 10:00 AM" },
    { label: "Order Confirmed", completed: true, date: "25 Jan 2024, 10:15 AM" },
    { label: "Preparing Order", completed: true, date: "25 Jan 2024, 11:00 AM" },
    { label: "Shipped", completed: true, date: "26 Jan 2024, 02:00 PM" },
    { label: "Out for Delivery", completed: true, date: "27 Jan 2024, 09:00 AM" },
    { label: "Delivered", completed: true, date: "27 Jan 2024, 03:30 PM" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="rgba(0, 0, 0, 0.5)" />

      {/* Orders List Modal */}
      <Modal
        visible={showOrdersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseOrdersModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ordersModalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Orders</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={handleCloseOrdersModal}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
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
                  onPress={() => handleTabClick(tab.key)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.activeTabText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Orders List */}
            <ScrollView
              key={activeTab}
              style={styles.ordersList}
              contentContainerStyle={styles.ordersContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No orders found</Text>
                  <Text style={styles.emptySubtext}>
                    {activeTab === "all"
                      ? "You haven't placed any orders yet"
                      : `No ${getStatusText(activeTab).toLowerCase()} orders`}
                  </Text>
                </View>
              ) : (
                filteredOrders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    onPress={() => handleViewOrder(order)}
                  >
                    <Image source={order.image} style={styles.orderImage} />
                    <View style={styles.orderContent}>
                      <View style={styles.orderTopRow}>
                        <View style={styles.orderInfo}>
                          <Text style={styles.orderNumber}>
                            {order.orderNumber}
                          </Text>
                          <Text style={styles.orderDate}>{order.date}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                getStatusColor(order.status) + "15",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(order.status) },
                            ]}
                          >
                            {getStatusText(order.status)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderBottomRow}>
                        <Text style={styles.itemsText}>
                          {order.items} {order.items === 1 ? "item" : "items"}
                        </Text>
                        <Text style={styles.totalText}>{order.total}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowOrderModal(false);
          setShowOrdersModal(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowOrderModal(false);
                  setShowOrdersModal(true);
                }}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Order Info */}
                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Order Number</Text>
                    <Text style={styles.modalValue}>
                      {selectedOrder.orderNumber}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Order Date</Text>
                    <Text style={styles.modalValue}>{selectedOrder.date}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        {
                          backgroundColor:
                            getStatusColor(selectedOrder.status) + "15",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalStatusText,
                          { color: getStatusColor(selectedOrder.status) },
                        ]}
                      >
                        {getStatusText(selectedOrder.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Order Items</Text>
                  <View style={styles.modalItemCard}>
                    <Image
                      source={selectedOrder.image}
                      style={styles.modalItemImage}
                    />
                    <View style={styles.modalItemDetails}>
                      <Text style={styles.modalItemName}>
                        Product Name {selectedOrder.id}
                      </Text>
                      <Text style={styles.modalItemQuantity}>
                        Quantity: {selectedOrder.items}
                      </Text>
                      <Text style={styles.modalItemPrice}>
                        {selectedOrder.total}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Order Summary */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Order Summary</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Subtotal</Text>
                    <Text style={styles.modalValue}>{selectedOrder.total}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Shipping</Text>
                    <Text style={styles.modalValue}>₹99</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Tax</Text>
                    <Text style={styles.modalValue}>₹0</Text>
                  </View>
                  <View style={[styles.modalRow, styles.modalTotalRow]}>
                    <Text style={styles.modalTotalLabel}>Total</Text>
                    <Text style={styles.modalTotalValue}>
                      {selectedOrder.total}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  {selectedOrder.status === "in_progress" && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          styles.primaryButton,
                        ]}
                        onPress={() => {
                          setShowOrderModal(false);
                          handleTrackOrder(selectedOrder);
                        }}
                      >
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#FFFFFF"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.primaryButtonText}>Track Order</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          styles.dangerButton,
                        ]}
                        onPress={() => {
                          setShowOrderModal(false);
                          handleCancelOrder(selectedOrder);
                        }}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color="#FFFFFF"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.dangerButtonText}>Cancel Order</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedOrder.status === "delivered" && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          styles.primaryButton,
                        ]}
                        onPress={() => {
                          setShowOrderModal(false);
                          handleBuyAgain(selectedOrder);
                        }}
                      >
                        <Ionicons
                          name="cart-outline"
                          size={18}
                          color="#FFFFFF"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.primaryButtonText}>Buy Again</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          styles.secondaryButton,
                        ]}
                        onPress={() => {
                          setShowOrderModal(false);
                          handleReturnReplace(selectedOrder);
                        }}
                      >
                        <Ionicons
                          name="return-down-back-outline"
                          size={18}
                          color="#E97A1F"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.secondaryButtonText}>
                          Return / Replace
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {selectedOrder.status === "returns" && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.secondaryButton]}
                      onPress={() => {
                        setShowOrderModal(false);
                        handleReturnReplace(selectedOrder);
                      }}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color="#E97A1F"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.secondaryButtonText}>
                        View Return Status
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedOrder.status === "cancelled" && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.primaryButton]}
                      onPress={() => {
                        setShowOrderModal(false);
                        handleBuyAgain(selectedOrder);
                      }}
                    >
                      <Ionicons
                        name="cart-outline"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.primaryButtonText}>Order Again</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.secondaryButton]}
                    onPress={() => {
                      setShowOrderModal(false);
                      setShowPaymentModal(true);
                    }}
                  >
                    <Ionicons
                      name="card-outline"
                      size={18}
                      color="#E97A1F"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Payment Method Info
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.secondaryButton]}
                    onPress={() => {
                      setShowOrderModal(false);
                      setShowAddressModal(true);
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#E97A1F"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Delivery Address
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.secondaryButton]}
                    onPress={() => {
                      setShowOrderModal(false);
                      setShowInvoiceModal(true);
                    }}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={18}
                      color="#E97A1F"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>Invoice / Bill</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Track Order Modal */}
      <Modal
        visible={showTrackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTrackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Order</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTrackModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Order Number</Text>
                  <Text style={styles.modalValue}>
                    {selectedOrder.orderNumber}
                  </Text>
                </View>
                {selectedOrder.trackingNumber && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Tracking Number</Text>
                    <Text style={styles.trackingNumber}>
                      {selectedOrder.trackingNumber}
                    </Text>
                  </View>
                )}
                {selectedOrder.estimatedDelivery && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Estimated Delivery</Text>
                    <Text style={styles.modalValue}>
                      {selectedOrder.estimatedDelivery}
                    </Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Order Status</Text>
                  <View style={styles.trackingContainer}>
                    {trackingSteps.map((step, index) => (
                      <View key={index} style={styles.trackingStep}>
                        <View
                          style={[
                            styles.trackingDot,
                            step.completed && styles.trackingDotCompleted,
                          ]}
                        >
                          {step.completed && (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        {index < trackingSteps.length - 1 && (
                          <View
                            style={[
                              styles.trackingLine,
                              step.completed && styles.trackingLineCompleted,
                            ]}
                          />
                        )}
                        <View style={styles.trackingStepContent}>
                          <Text
                            style={[
                              styles.trackingStepLabel,
                              step.completed && styles.trackingStepLabelCompleted,
                            ]}
                          >
                            {step.label}
                          </Text>
                          <Text style={styles.trackingStepDate}>
                            {step.date}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Method</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Payment Method</Text>
                    <Text style={styles.modalValue}>
                      {selectedOrder.paymentMethod || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Amount Paid</Text>
                    <Text style={styles.modalValue}>{selectedOrder.total}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Payment Status</Text>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        { backgroundColor: "#4CAF5015" },
                      ]}
                    >
                      <Text
                        style={[styles.modalStatusText, { color: "#4CAF50" }]}
                      >
                        Paid
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Transaction ID</Text>
                    <Text style={styles.modalValue}>TXN{selectedOrder.id}789</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Delivery Address Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Address</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddressModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalSection}>
                  <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                      <Ionicons name="location" size={20} color="#E97A1F" />
                      <Text style={styles.addressType}>Home</Text>
                    </View>
                    <Text style={styles.addressText}>
                      {selectedOrder.deliveryAddress ||
                        "No address available"}
                    </Text>
                    <View style={styles.addressActions}>
                      <TouchableOpacity style={styles.addressActionButton}>
                        <Ionicons name="create-outline" size={16} color="#E97A1F" />
                        <Text style={styles.addressActionText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice / Bill</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowInvoiceModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalSection}>
                  <Text style={styles.invoiceTitle}>INVOICE</Text>
                  <Text style={styles.invoiceNumber}>
                    {selectedOrder.orderNumber}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Bill To</Text>
                  <Text style={styles.modalValue}>Customer Name</Text>
                  <Text style={styles.modalLabel}>
                    {selectedOrder.deliveryAddress || "Address not available"}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Items</Text>
                  <View style={styles.invoiceItemRow}>
                    <Text style={styles.invoiceItemName}>
                      Product Name {selectedOrder.id}
                    </Text>
                    <Text style={styles.invoiceItemQty}>
                      Qty: {selectedOrder.items}
                    </Text>
                    <Text style={styles.invoiceItemPrice}>
                      {selectedOrder.total}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Subtotal</Text>
                    <Text style={styles.modalValue}>{selectedOrder.total}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Shipping</Text>
                    <Text style={styles.modalValue}>₹99</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Tax</Text>
                    <Text style={styles.modalValue}>₹0</Text>
                  </View>
                  <View style={[styles.modalRow, styles.modalTotalRow]}>
                    <Text style={styles.modalTotalLabel}>Total</Text>
                    <Text style={styles.modalTotalValue}>
                      {selectedOrder.total}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.primaryButton]}
                  >
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.primaryButtonText}>Download PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.secondaryButton]}
                  >
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color="#E97A1F"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.secondaryButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Return / Replace Modal */}
      <Modal
        visible={showReturnModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReturnModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Return / Replace</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowReturnModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Select Reason</Text>
                  <TouchableOpacity style={styles.returnOption}>
                    <Text style={styles.returnOptionText}>Wrong Item</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.returnOption}>
                    <Text style={styles.returnOptionText}>Defective Item</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.returnOption}>
                    <Text style={styles.returnOptionText}>Size / Fit Issue</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.returnOption}>
                    <Text style={styles.returnOptionText}>Not as Described</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.returnOption}>
                    <Text style={styles.returnOptionText}>Other</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Return Type</Text>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.primaryButton]}
                  >
                    <Text style={styles.primaryButtonText}>Return</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.secondaryButton]}
                  >
                    <Text style={styles.secondaryButtonText}>Replace</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  ordersModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    flexDirection: "column",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  modalCloseButton: {
    padding: 4,
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 0,
    paddingBottom: 0,
    flexShrink: 0,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
    marginBottom: 0,
  },
  tab: {
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
  activeTab: {
    backgroundColor: "#E97A1F",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    lineHeight: 13,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 11,
    lineHeight: 13,
  },
  ordersList: {
    flex: 1,
    marginTop: 0,
    minHeight: 0,
  },
  ordersContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
    color: "#999999",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  orderBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsText: {
    fontSize: 12,
    color: "#666666",
  },
  totalText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  modalLabel: {
    fontSize: 14,
    color: "#666666",
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  modalTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalItemCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
  },
  modalItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  modalItemDetails: {
    flex: 1,
    justifyContent: "center",
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  modalItemQuantity: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  modalItemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E97A1F",
  },
  modalActions: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalActionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#E97A1F",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E97A1F",
  },
  dangerButton: {
    backgroundColor: "#F44336",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E97A1F",
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E97A1F",
    marginTop: 4,
  },
  trackingContainer: {
    marginTop: 16,
  },
  trackingStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  trackingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  trackingDotCompleted: {
    backgroundColor: "#4CAF50",
  },
  trackingLine: {
    position: "absolute",
    left: 11,
    top: 24,
    width: 2,
    height: 20,
    backgroundColor: "#E0E0E0",
  },
  trackingLineCompleted: {
    backgroundColor: "#4CAF50",
  },
  trackingStepContent: {
    flex: 1,
    paddingTop: 2,
  },
  trackingStepLabel: {
    fontSize: 14,
    color: "#999999",
    marginBottom: 4,
  },
  trackingStepLabelCompleted: {
    color: "#000",
    fontWeight: "600",
  },
  trackingStepDate: {
    fontSize: 12,
    color: "#999999",
  },
  addressCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 12,
  },
  addressActions: {
    flexDirection: "row",
  },
  addressActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addressActionText: {
    fontSize: 14,
    color: "#E97A1F",
    marginLeft: 4,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#666666",
  },
  invoiceItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  invoiceItemName: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  invoiceItemQty: {
    fontSize: 12,
    color: "#666666",
    marginHorizontal: 12,
  },
  invoiceItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  returnOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  returnOptionText: {
    fontSize: 14,
    color: "#000",
  },
});

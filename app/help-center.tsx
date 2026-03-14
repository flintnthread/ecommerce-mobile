import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HelpTab = "faqs" | "order_help" | "delivery_payment" | "support_ticket" | "contact";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  date: string;
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HelpTab>("faqs");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showSupportTicketModal, setShowSupportTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState("order");

  const tabs: { key: HelpTab; label: string; icon: string }[] = [
    { key: "faqs", label: "FAQs", icon: "help-circle" },
    { key: "order_help", label: "Order Help", icon: "receipt" },
    { key: "delivery_payment", label: "Delivery & Payment", icon: "card" },
    { key: "support_ticket", label: "Support Ticket", icon: "ticket" },
    { key: "contact", label: "Contact", icon: "call" },
  ];

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "How do I place an order?",
      answer:
        "To place an order, browse our products, add items to your cart, and proceed to checkout. Enter your shipping address and payment details, then confirm your order.",
      category: "general",
    },
    {
      id: "2",
      question: "What payment methods do you accept?",
      answer:
        "We accept Credit/Debit Cards, UPI, Wallets (Paytm, PhonePe), and Cash on Delivery for orders above ₹99.",
      category: "payment",
    },
    {
      id: "3",
      question: "How long does delivery take?",
      answer:
        "Standard delivery takes 3-7 business days. Express delivery (1-2 days) is available in select cities for an additional charge.",
      category: "delivery",
    },
    {
      id: "4",
      question: "Can I cancel my order?",
      answer:
        "Yes, you can cancel your order within 24 hours of placing it. Go to 'My Orders' and select the order you want to cancel.",
      category: "order",
    },
    {
      id: "5",
      question: "What is your return policy?",
      answer:
        "You can return products within 7 days of delivery. Items must be unused, in original packaging with tags attached. Refunds will be processed within 5-7 business days.",
      category: "returns",
    },
    {
      id: "6",
      question: "How do I track my order?",
      answer:
        "You can track your order by going to 'My Orders' and clicking on the order. You'll receive SMS and email updates with tracking information.",
      category: "order",
    },
    {
      id: "7",
      question: "Do you offer international shipping?",
      answer:
        "Currently, we only ship within India. International shipping will be available soon.",
      category: "delivery",
    },
    {
      id: "8",
      question: "How do I apply a coupon code?",
      answer:
        "During checkout, enter your coupon code in the 'Apply Coupon' field. Valid codes will be automatically applied to your order total.",
      category: "payment",
    },
  ];

  const orderHelpTopics = [
    {
      id: "1",
      title: "How to Place an Order",
      icon: "cart",
      description: "Step-by-step guide to placing your first order",
    },
    {
      id: "2",
      title: "Track Your Order",
      icon: "location",
      description: "Learn how to track your order status",
    },
    {
      id: "3",
      title: "Cancel or Modify Order",
      icon: "close-circle",
      description: "Cancel or modify your order before it ships",
    },
    {
      id: "4",
      title: "Return or Exchange",
      icon: "return-down-back",
      description: "Return or exchange products you've received",
    },
    {
      id: "5",
      title: "Order History",
      icon: "time",
      description: "View your past orders and invoices",
    },
  ];

  const deliveryPaymentIssues = [
    {
      id: "1",
      title: "Delivery Delayed",
      icon: "time-outline",
      description: "Your order is taking longer than expected",
    },
    {
      id: "2",
      title: "Wrong Item Delivered",
      icon: "alert-circle",
      description: "Received a different product than ordered",
    },
    {
      id: "3",
      title: "Payment Failed",
      icon: "card-outline",
      description: "Payment transaction was unsuccessful",
    },
    {
      id: "4",
      title: "Refund Issues",
      icon: "cash-outline",
      description: "Problems with refund processing",
    },
    {
      id: "5",
      title: "COD Not Available",
      icon: "ban",
      description: "Cash on Delivery option not showing",
    },
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: "1",
      subject: "Order not delivered",
      description: "Order #ORD-2024-001 was supposed to be delivered yesterday",
      status: "in_progress",
      date: "20 Jan 2024",
    },
    {
      id: "2",
      subject: "Refund request",
      description: "Requesting refund for cancelled order",
      status: "resolved",
      date: "15 Jan 2024",
    },
  ];

  const contactOptions = [
    {
      id: "1",
      title: "Call Us",
      icon: "call",
      value: "+91 9063499092",
      action: () => {
        Linking.openURL("tel:+919063499092");
      },
      color: "#4CAF50",
    },
    {
      id: "2",
      title: "Email Us",
      icon: "mail",
      value: "support@fashionapp.com",
      action: () => {
        Linking.openURL("mailto:support@flintnthread.in");
      },
      color: "#2196F3",
    },
    {
      id: "3",
      title: "Live Chat",
      icon: "chatbubbles",
      value: "Available 24/7",
      action: () => {
        Alert.alert("Live Chat", "Connecting you to a support agent...");
      },
      color: "#E97A1F",
    },
    {
      id: "4",
      title: "WhatsApp",
      icon: "logo-whatsapp",
      value: "+91 9063499092",
      action: () => {
        Linking.openURL("https://wa.me/919063499092");
      },
      color: "#25D366",
    },
  ];

  const handleSubmitTicket = () => {
    if (!ticketSubject || !ticketDescription) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }
    Alert.alert(
      "Ticket Submitted",
      "Your support ticket has been submitted successfully. Ticket ID: #TKT-2024-" +
        Math.floor(Math.random() * 1000),
      [
        {
          text: "OK",
          onPress: () => {
            setShowSupportTicketModal(false);
            setTicketSubject("");
            setTicketDescription("");
            setTicketCategory("order");
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "#FF9800";
      case "in_progress":
        return "#2196F3";
      case "resolved":
        return "#4CAF50";
      default:
        return "#757575";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Open";
      case "in_progress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      default:
        return status;
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
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSubtitle}>
            We're here to help you
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
        {/* FAQs Tab */}
        {activeTab === "faqs" && (
          <View style={styles.faqsContainer}>
            <Text style={styles.sectionSubtitle}>
              Frequently Asked Questions
            </Text>
            {faqs.map((faq, index) => (
              <View
                key={faq.id}
                style={[
                  styles.faqCard,
                  index === faqs.length - 1 && styles.faqCardLast,
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() =>
                    setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={
                      expandedFAQ === faq.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Order Help Tab */}
        {activeTab === "order_help" && (
          <View style={styles.orderHelpContainer}>
            <Text style={styles.sectionSubtitle}>
              Order Related Help Topics
            </Text>
            {orderHelpTopics.map((topic, index) => (
              <TouchableOpacity
                key={topic.id}
                style={[
                  styles.helpTopicCard,
                  index === orderHelpTopics.length - 1 &&
                    styles.helpTopicCardLast,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.helpTopicLeft}>
                  <View style={styles.helpTopicIcon}>
                    <Ionicons name={topic.icon as any} size={24} color="#E97A1F" />
                  </View>
                  <View style={styles.helpTopicInfo}>
                    <Text style={styles.helpTopicTitle}>{topic.title}</Text>
                    <Text style={styles.helpTopicDesc}>{topic.description}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Delivery & Payment Issues Tab */}
        {activeTab === "delivery_payment" && (
          <View style={styles.deliveryPaymentContainer}>
            <Text style={styles.sectionSubtitle}>
              Common Issues & Solutions
            </Text>
            {deliveryPaymentIssues.map((issue, index) => (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueCard,
                  index === deliveryPaymentIssues.length - 1 &&
                    styles.issueCardLast,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.issueCardLeft}>
                  <View style={styles.issueIcon}>
                    <Ionicons name={issue.icon as any} size={24} color="#F44336" />
                  </View>
                  <View style={styles.issueInfo}>
                    <Text style={styles.issueTitle}>{issue.title}</Text>
                    <Text style={styles.issueDesc}>{issue.description}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Support Ticket Tab */}
        {activeTab === "support_ticket" && (
          <View style={styles.supportTicketContainer}>
            <View style={styles.ticketHeader}>
              <Text style={styles.sectionSubtitle}>Your Support Tickets</Text>
              <TouchableOpacity
                style={styles.newTicketBtn}
                onPress={() => setShowSupportTicketModal(true)}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.newTicketBtnText}>New Ticket</Text>
              </TouchableOpacity>
            </View>

            {supportTickets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyText}>No support tickets</Text>
                <Text style={styles.emptySubtext}>
                  Raise a ticket if you need assistance
                </Text>
              </View>
            ) : (
              supportTickets.map((ticket, index) => (
                <View
                  key={ticket.id}
                  style={[
                    styles.ticketCard,
                    index === supportTickets.length - 1 && styles.ticketCardLast,
                  ]}
                >
                  <View style={styles.ticketCardLeft}>
                    <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                    <Text style={styles.ticketDescription}>
                      {ticket.description}
                    </Text>
                    <Text style={styles.ticketDate}>{ticket.date}</Text>
                  </View>
                  <View style={styles.ticketCardRight}>
                    <View
                      style={[
                        styles.ticketStatusBadge,
                        {
                          backgroundColor: getStatusColor(ticket.status) + "20",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.ticketStatusDot,
                          { backgroundColor: getStatusColor(ticket.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.ticketStatusText,
                          { color: getStatusColor(ticket.status) },
                        ]}
                      >
                        {getStatusLabel(ticket.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Contact Support Tab */}
        {activeTab === "contact" && (
          <View style={styles.contactContainer}>
            <Text style={styles.sectionSubtitle}>
              Get in Touch with Us
            </Text>
            <Text style={styles.contactDescription}>
              Choose your preferred method to contact our support team
            </Text>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.contactCard,
                  index === contactOptions.length - 1 && styles.contactCardLast,
                ]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={styles.contactCardLeft}>
                  <View
                    style={[
                      styles.contactIcon,
                      { backgroundColor: option.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={option.color}
                    />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>{option.title}</Text>
                    <Text style={styles.contactValue}>{option.value}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}

            <View style={styles.businessHoursCard}>
              <Text style={styles.businessHoursTitle}>Business Hours</Text>
              <Text style={styles.businessHoursText}>
                Monday - Friday: 9:00 AM - 8:00 PM
              </Text>
              <Text style={styles.businessHoursText}>
                Saturday - Sunday: 10:00 AM - 6:00 PM
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Support Ticket Modal */}
      <Modal
        visible={showSupportTicketModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupportTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Support Ticket</Text>
              <TouchableOpacity
                onPress={() => setShowSupportTicketModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categorySelector}>
                  {["order", "delivery", "payment", "returns", "other"].map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          ticketCategory === cat && styles.categoryOptionActive,
                        ]}
                        onPress={() => setTicketCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryOptionText,
                            ticketCategory === cat &&
                              styles.categoryOptionTextActive,
                          ]}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subject</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter ticket subject"
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Describe your issue in detail"
                  value={ticketDescription}
                  onChangeText={setTicketDescription}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitTicket}
              >
                <Text style={styles.modalSubmitBtnText}>Submit Ticket</Text>
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
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  // FAQs Tab Styles
  faqsContainer: {
    flex: 1,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  faqCardLast: {
    marginBottom: 0,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginTop: 12,
  },
  // Order Help Tab Styles
  orderHelpContainer: {
    flex: 1,
  },
  helpTopicCard: {
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
  helpTopicCardLast: {
    marginBottom: 0,
  },
  helpTopicLeft: {
    flexDirection: "row",
    flex: 1,
  },
  helpTopicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E97A1F20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  helpTopicInfo: {
    flex: 1,
  },
  helpTopicTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  helpTopicDesc: {
    fontSize: 13,
    color: "#666",
  },
  // Delivery & Payment Issues Tab Styles
  deliveryPaymentContainer: {
    flex: 1,
  },
  issueCard: {
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
  issueCardLast: {
    marginBottom: 0,
  },
  issueCardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  issueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F4433620",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  issueDesc: {
    fontSize: 13,
    color: "#666",
  },
  // Support Ticket Tab Styles
  supportTicketContainer: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  newTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E97A1F",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newTicketBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  ticketCard: {
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
  ticketCardLast: {
    marginBottom: 0,
  },
  ticketCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 12,
    color: "#999",
  },
  ticketCardRight: {
    alignItems: "flex-end",
  },
  ticketStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ticketStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  ticketStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Contact Tab Styles
  contactContainer: {
    flex: 1,
  },
  contactDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  contactCard: {
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
  contactCardLast: {
    marginBottom: 16,
  },
  contactCardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 13,
    color: "#666",
  },
  businessHoursCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  businessHoursTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  businessHoursText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
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
  formTextArea: {
    height: 120,
    textAlignVertical: "top",
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F8F9FA",
  },
  categoryOptionActive: {
    backgroundColor: "#E97A1F",
    borderColor: "#E97A1F",
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  categoryOptionTextActive: {
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


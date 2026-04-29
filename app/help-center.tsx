import React, { useEffect, useState } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HelpTab = "faqs" | "order_help" | "support_ticket" | "contact";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  type: string;
  description: string;
  status: string;
  date: string;
}

type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  options?: string[];
};

const LIVE_CHAT_STORAGE_KEY = "ft_live_chat_messages_v1";
const DEFAULT_BOT_MESSAGE: ChatMessage = {
  id: "bot_welcome",
  sender: "bot",
  text:
    "Hi! I am your support assistant. Ask me about orders, delivery, payments, returns, refunds, or account issues.",
  time: "Now",
  options: ["An order I placed", "Not about an order"],
};

export default function HelpCenterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string | string[];
    email?: string | string[];
    phone?: string | string[];
  }>();
  const [activeTab, setActiveTab] = useState<HelpTab>("faqs");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showSupportTicketModal, setShowSupportTicketModal] = useState(false);
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState("order");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [showLiveChatModal, setShowLiveChatModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    DEFAULT_BOT_MESSAGE,
  ]);

  useEffect(() => {
    const asString = (value: string | string[] | undefined): string =>
      Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

    setTicketName(asString(params.name).trim());
    setTicketEmail(asString(params.email).trim());
    setTicketPhone(asString(params.phone).trim());
  }, [params.name, params.email, params.phone]);

  const tabs: { key: HelpTab; label: string; icon: string }[] = [
    { key: "faqs", label: "FAQs", icon: "help-circle" },
    { key: "order_help", label: "Order Help", icon: "receipt" },
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

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LIVE_CHAT_STORAGE_KEY);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (m) =>
              m &&
              typeof m.id === "string" &&
              (m.sender === "user" || m.sender === "bot") &&
              typeof m.text === "string" &&
              typeof m.time === "string" &&
              (typeof m.options === "undefined" || Array.isArray(m.options))
          )
        ) {
          setChatMessages(parsed);
        }
      } catch {
        // Ignore storage read issues and keep default welcome message.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(LIVE_CHAT_STORAGE_KEY, JSON.stringify(chatMessages)).catch(
      () => {
        // Ignore storage write issues.
      }
    );
  }, [chatMessages]);

  const getChatReplyPayload = (
    question: string
  ): { text: string; options?: string[] } => {
    const normalized = question.toLowerCase().replace(/[^\w\s#-]/g, " ");
    const q = normalized.replace(/\s+/g, " ").trim();
    const orderIdMatch = q.match(/(?:order|ord|#)\s*[-:]?\s*(\d{3,})/i);
    const orderHint = orderIdMatch?.[1]
      ? ` for order #${orderIdMatch[1]}`
      : "";

    const hasAny = (keywords: string[]) => keywords.some((k) => q.includes(k));

    if (hasAny(["an order i placed", "order related", "about order"])) {
      return {
        text: "Sure, what is your order-related issue?",
        options: [
          "Track my order",
          "Cancel order",
          "Return or replace item",
          "Refund status",
        ],
      };
    }

    if (hasAny(["not about an order", "not order", "general help"])) {
      return {
        text: "Sure, what is your question about?",
        options: [
          "Account and login",
          "Payment issue",
          "Coupons and offers",
          "Talk to support agent",
        ],
      };
    }

    if (hasAny(["hi", "hello", "hey"])) {
      return {
        text: "Hello! I can help with orders, account, payment, delivery, and refunds.",
        options: ["An order I placed", "Not about an order"],
      };
    }

    if (
      hasAny(["track", "where", "status", "not delivered", "not receive"]) &&
      hasAny(["order", "shipment", "parcel", "package", "courier"])
    ) {
      return {
        text: `You can track your order${orderHint} from My Orders > select order > Track. If tracking is not updating for 24 hours, share the order id and I will escalate it.`,
        options: ["Refund status", "Talk to support agent"],
      };
    }

    if (hasAny(["cancel", "stop order", "cancelled"])) {
      return {
        text: `You can cancel eligible orders${orderHint} before shipment from My Orders. If already shipped, you can place a return request after delivery.`,
        options: ["Return or replace item", "Talk to support agent"],
      };
    }

    if (hasAny(["return", "replace", "exchange", "wrong item", "damaged"])) {
      return {
        text: `For return/replacement${orderHint}, open My Orders and tap Return/Replace within 7 days of delivery. Keep item tags and original packaging ready.`,
        options: ["Refund status", "Talk to support agent"],
      };
    }

    if (hasAny(["refund", "money", "amount", "credited", "credit"])) {
      return {
        text: `Refunds${orderHint} are processed in 5-7 business days after cancellation/return approval. UPI refunds are usually quicker than card refunds.`,
        options: ["Track my order", "Talk to support agent"],
      };
    }

    if (hasAny(["delivery", "late", "delay", "delayed", "expected", "eta"])) {
      return {
        text: `Standard delivery is 3-7 business days. If your order is delayed${orderHint}, share order id and pincode so I can raise priority support.`,
        options: ["Track my order", "Talk to support agent"],
      };
    }

    if (hasAny(["payment", "upi", "card", "failed", "debited", "transaction"])) {
      return {
        text: "If payment failed but money was debited, it usually auto-reverses within 3-5 business days. You can retry with UPI/card from checkout.",
        options: ["Refund status", "Talk to support agent"],
      };
    }

    if (hasAny(["coupon", "promo", "discount", "offer code", "code"])) {
      return {
        text: "Apply your coupon on checkout page in Apply Coupon. If code fails, verify expiry, minimum order value, and category restrictions.",
        options: ["Payment issue", "Talk to support agent"],
      };
    }

    if (hasAny(["account", "login", "otp", "signin", "sign in", "password"])) {
      return {
        text: "For login issues, check network and request OTP again after 30 seconds. If OTP still does not arrive, verify mobile/email and try re-login.",
        options: ["Talk to support agent", "Not about an order"],
      };
    }

    if (hasAny(["agent", "human", "executive", "representative", "call back"])) {
      return {
        text: "I can connect you to a support agent. Please raise a Support Ticket with order id and issue details for faster resolution.",
        options: ["Raise support ticket", "Call Us"],
      };
    }

    if (hasAny(["thanks", "thank you"])) {
      return {
        text: "You are welcome! If you need anything else, ask me or choose an option below.",
        options: ["An order I placed", "Not about an order"],
      };
    }

    return {
      text: "I can help with tracking, cancellation, return, refund, delivery, payment, and login issues.",
      options: ["An order I placed", "Not about an order"],
    };
  };

  const openLiveChat = () => {
    setChatMessages([DEFAULT_BOT_MESSAGE]);
    setShowLiveChatModal(true);
  };

  const handleSendChatMessage = () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text,
      time: "Now",
    };
    const reply = getChatReplyPayload(text);
    const botMessage: ChatMessage = {
      id: `bot_${Date.now() + 1}`,
      sender: "bot",
      text: reply.text,
      time: "Now",
      options: reply.options,
    };

    setChatMessages((prev) => [...prev, userMessage, botMessage]);
    setChatInput("");
  };

  const handleQuickOptionTap = (option: string) => {
    const normalizedOption = option.trim().toLowerCase();
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: option,
      time: "Now",
    };
    const reply = getChatReplyPayload(option);
    const botMessage: ChatMessage = {
      id: `bot_${Date.now() + 1}`,
      sender: "bot",
      text: reply.text,
      time: "Now",
      options: reply.options,
    };
    setChatMessages((prev) => [...prev, userMessage, botMessage]);

    if (normalizedOption === "call us") {
      void Linking.openURL("tel:+919063499092");
      return;
    }

    if (normalizedOption === "raise support ticket") {
      setShowLiveChatModal(false);
      setActiveTab("support_ticket");
      return;
    }
  };

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
      action: openLiveChat,
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

  const resetTicketForm = () => {
    setTicketSubject("");
    setTicketDescription("");
    setTicketCategory("order");
    setEditingTicketId(null);
  };

  const openNewTicketModal = () => {
    resetTicketForm();
    setShowSupportTicketModal(true);
  };

  const openEditTicketModal = (ticket: SupportTicket) => {
    setEditingTicketId(ticket.id);
    setTicketSubject(ticket.subject);
    setTicketDescription(ticket.description);
    setTicketCategory(ticket.type || "other");
    setShowSupportTicketModal(true);
  };

  const handleSubmitTicket = async () => {
    const subject = ticketSubject.trim();
    const description = ticketDescription.trim();
    const type = ticketCategory === "returns" ? "return" : ticketCategory;

    if (!description) {
      Alert.alert("Missing Info", "Please enter ticket description.");
      return;
    }

    try {
      setIsSubmittingTicket(true);
      if (editingTicketId) {
        const response = await api.patch(`/api/support-tickets/${editingTicketId}`, {
          type,
          subject: subject || `${type} support request`,
          description,
        });

        const successMessage =
          typeof response?.data?.message === "string" && response.data.message.trim()
            ? response.data.message.trim()
            : "Support ticket updated successfully.";

        Alert.alert("Ticket Updated", successMessage, [
          {
            text: "OK",
            onPress: () => {
              const updated = response?.data?.data as
                | {
                    id?: number | string;
                    subject?: string;
                    type?: string;
                    message?: string;
                    status?: string;
                    updatedAt?: string | null;
                  }
                | undefined;

              if (updated) {
                const updatedAt = updated.updatedAt ? new Date(updated.updatedAt) : new Date();
                setSupportTickets((prev) =>
                  prev.map((ticket) =>
                    ticket.id === String(updated.id ?? editingTicketId)
                      ? {
                          ...ticket,
                          subject: String(
                            updated.subject ?? (subject || `${type} support request`)
                          ),
                          type: String(updated.type ?? type),
                          description: String(updated.message ?? description),
                          status: String(updated.status ?? ticket.status),
                          date: updatedAt.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }),
                        }
                      : ticket
                  )
                );
              }
              setShowSupportTicketModal(false);
              resetTicketForm();
            },
          },
        ]);
        return;
      }

      const response = await api.post("/api/support-tickets", {
        type,
        subject: subject || `${type} support request`,
        description,
      });

      const successMessage =
        typeof response?.data?.message === "string" && response.data.message.trim()
          ? response.data.message.trim()
          : "Your support request has been submitted successfully.";

      Alert.alert("Ticket Submitted", successMessage, [
        {
          text: "OK",
          onPress: () => {
            const created = response?.data?.data as
              | {
                  id?: number | string;
                  subject?: string;
                  message?: string;
                  status?: "open" | "in_progress" | "resolved";
                  createdAt?: string | null;
                }
              | undefined;
            if (created) {
              const createdAt = created.createdAt ? new Date(created.createdAt) : new Date();
              setSupportTickets((prev) => [
                {
                  id: String(created.id ?? `${Date.now()}`),
                  subject: String(created.subject ?? (subject || `${type} support request`)),
                  type,
                  description: String(created.message ?? description),
                  status: created.status ?? "open",
                  date: createdAt.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                },
                ...prev,
              ]);
            }
            setShowSupportTicketModal(false);
            resetTicketForm();
          },
        },
      ]);
    } catch (error) {
      let messageText = "Failed to submit support ticket. Please try again.";
      if (axios.isAxiosError(error)) {
        const serverData = error.response?.data as
          | { message?: string; error?: string }
          | undefined;
        messageText =
          (typeof serverData?.message === "string" && serverData.message) ||
          (typeof serverData?.error === "string" && serverData.error) ||
          error.message ||
          messageText;
      } else if (error instanceof Error) {
        messageText = error.message;
      }
      Alert.alert("Submission Failed", messageText);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const loadSupportTickets = async () => {
    try {
      setTicketsLoading(true);
      setTicketsError(null);
      const response = await api.get("/api/support-tickets");
      const rows = Array.isArray(response?.data?.data)
        ? (response.data.data as Array<{
            id?: number | string;
            subject?: string;
            type?: string;
            message?: string;
            status?: string;
            createdAt?: string | null;
          }>)
        : [];

      const mapped: SupportTicket[] = rows.map((row) => {
        const createdAt = row.createdAt ? new Date(row.createdAt) : new Date();
        const validDate = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;
        return {
          id: String(row.id ?? `${Date.now()}`),
          subject: String(row.subject ?? "Support ticket"),
          type: String(row.type ?? "other"),
          description: String(row.message ?? ""),
          status: String(row.status ?? "open"),
          date: validDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };
      });
      setSupportTickets(mapped);
    } catch (error) {
      let messageText = "Failed to load support tickets.";
      if (axios.isAxiosError(error)) {
        const serverData = error.response?.data as
          | { message?: string; error?: string }
          | undefined;
        messageText =
          (typeof serverData?.message === "string" && serverData.message) ||
          (typeof serverData?.error === "string" && serverData.error) ||
          error.message ||
          messageText;
      } else if (error instanceof Error) {
        messageText = error.message;
      }
      setTicketsError(messageText);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "support_ticket") return;
    void loadSupportTickets();
  }, [activeTab]);

  const deleteTicket = async (ticketId: string) => {
    try {
      setDeletingTicketId(ticketId);
      const response = await api.delete(`/api/support-tickets/${ticketId}`);
      const successMessage =
        typeof response?.data?.message === "string" && response.data.message.trim()
          ? response.data.message.trim()
          : "Support ticket deleted successfully";
      setSupportTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
      Alert.alert("Ticket Deleted", successMessage);
    } catch (error) {
      let messageText = "Failed to delete support ticket.";
      if (axios.isAxiosError(error)) {
        const serverData = error.response?.data as
          | { message?: string; error?: string }
          | undefined;
        messageText =
          (typeof serverData?.message === "string" && serverData.message) ||
          (typeof serverData?.error === "string" && serverData.error) ||
          error.message ||
          messageText;
      } else if (error instanceof Error) {
        messageText = error.message;
      }
      Alert.alert("Delete Failed", messageText);
    } finally {
      setDeletingTicketId(null);
    }
  };

  const confirmDeleteTicket = (ticketId: string) => {
    Alert.alert("Delete Ticket", "Are you sure you want to delete this ticket?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteTicket(ticketId);
        },
      },
    ]);
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
            We&apos;re here to help you
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

        {/* Support Ticket Tab */}
        {activeTab === "support_ticket" && (
          <View style={styles.supportTicketContainer}>
            <View style={styles.ticketHeader}>
              <Text style={styles.sectionSubtitle}>Your Support Tickets</Text>
              <TouchableOpacity
                style={styles.newTicketBtn}
                onPress={openNewTicketModal}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.newTicketBtnText}>New Ticket</Text>
              </TouchableOpacity>
            </View>

            {ticketsLoading ? (
              <Text style={styles.emptySubtext}>Loading tickets...</Text>
            ) : ticketsError ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Could not load tickets</Text>
                <Text style={styles.emptySubtext}>{ticketsError}</Text>
                <TouchableOpacity
                  style={styles.newTicketBtn}
                  onPress={() => void loadSupportTickets()}
                >
                  <Text style={styles.newTicketBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : supportTickets.length === 0 ? (
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
                    <TouchableOpacity
                      style={styles.ticketEditBtn}
                      onPress={() => openEditTicketModal(ticket)}
                    >
                      <Text style={styles.ticketEditBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.ticketDeleteBtn,
                        deletingTicketId === ticket.id && styles.ticketDeleteBtnDisabled,
                      ]}
                      disabled={deletingTicketId === ticket.id}
                      onPress={() => confirmDeleteTicket(ticket.id)}
                    >
                      <Text style={styles.ticketDeleteBtnText}>
                        {deletingTicketId === ticket.id ? "Deleting..." : "Delete"}
                      </Text>
                    </TouchableOpacity>
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
        onRequestClose={() => {
          setShowSupportTicketModal(false);
          resetTicketForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTicketId ? "Edit Support Ticket" : "Raise Support Ticket"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSupportTicketModal(false);
                  resetTicketForm();
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter your full name"
                  value={ticketName}
                  onChangeText={setTicketName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={ticketEmail}
                  onChangeText={setTicketEmail}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  value={ticketPhone}
                  onChangeText={setTicketPhone}
                />
              </View>
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
                style={[
                  styles.modalSubmitBtn,
                  isSubmittingTicket && styles.modalSubmitBtnDisabled,
                ]}
                onPress={handleSubmitTicket}
                disabled={isSubmittingTicket}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isSubmittingTicket
                    ? editingTicketId
                      ? "Updating..."
                      : "Submitting..."
                    : editingTicketId
                      ? "Update Ticket"
                      : "Submit Ticket"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLiveChatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLiveChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Live Chat</Text>
              <TouchableOpacity
                onPress={() => setShowLiveChatModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close-circle" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatMessagesWrap} contentContainerStyle={styles.chatMessagesContent}>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubble,
                    msg.sender === "user" ? styles.chatBubbleUser : styles.chatBubbleBot,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      msg.sender === "user" ? styles.chatBubbleTextUser : styles.chatBubbleTextBot,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  {msg.sender === "bot" &&
                  Array.isArray(msg.options) &&
                  msg.options.length > 0 ? (
                    <View style={styles.quickOptionsWrap}>
                      {msg.options.map((option) => (
                        <TouchableOpacity
                          key={`${msg.id}_${option}`}
                          style={styles.quickOptionBtn}
                          activeOpacity={0.8}
                          onPress={() => handleQuickOptionTap(option)}
                        >
                          <Text style={styles.quickOptionText}>{option}</Text>
                          <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            <View style={styles.chatComposer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your question..."
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendChatMessage}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
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
  ticketEditBtn: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  ticketEditBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  ticketDeleteBtn: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  ticketDeleteBtnDisabled: {
    opacity: 0.65,
  },
  ticketDeleteBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
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
  chatModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "82%",
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
  chatMessagesWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatMessagesContent: {
    paddingVertical: 12,
    gap: 10,
  },
  chatBubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chatBubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#E97A1F",
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatBubbleTextBot: {
    color: "#0F172A",
  },
  chatBubbleTextUser: {
    color: "#FFFFFF",
  },
  quickOptionsWrap: {
    marginTop: 10,
    gap: 8,
  },
  quickOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  quickOptionText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    paddingRight: 8,
    flex: 1,
  },
  chatComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    fontSize: 14,
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E97A1F",
    alignItems: "center",
    justifyContent: "center",
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
  modalSubmitBtnDisabled: {
    opacity: 0.7,
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});


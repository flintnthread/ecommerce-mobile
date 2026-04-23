import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { buildRazorpayCheckoutHtml } from "../lib/payment/razorpayWebHtml";
import { verifyRazorpayPayment } from "../lib/payment/razorpayFlow";

function oneParam(v: string | string[] | undefined): string {
  if (v == null) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

export default function RazorpayWebCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    key?: string | string[];
    orderId?: string | string[];
    amount?: string | string[];
    currency?: string | string[];
  }>();

  const key = oneParam(params.key);
  const orderId = oneParam(params.orderId);
  const amount = oneParam(params.amount);
  const currency = oneParam(params.currency) || "INR";

  const html = useMemo(() => {
    if (!key || !orderId || !amount) return "";
    return buildRazorpayCheckoutHtml({ key, orderId, amount, currency });
  }, [key, orderId, amount, currency]);

  const onMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let data: { type?: string; message?: string; razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string };
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (data.type === "success" && data.razorpay_order_id && data.razorpay_payment_id && data.razorpay_signature) {
        try {
          const verify = await verifyRazorpayPayment({
            orderId: data.razorpay_order_id,
            paymentId: data.razorpay_payment_id,
            signature: data.razorpay_signature,
          });
          if (verify.success) {
            Alert.alert("Payment successful", verify.message ?? "Your payment was verified.", [
              { text: "OK", onPress: () => router.replace("/orders" as any) },
            ]);
          } else {
            Alert.alert("Payment", verify.message ?? "Verification failed.");
            router.back();
          }
        } catch {
          Alert.alert("Payment", "Could not verify payment with the server.");
          router.back();
        }
        return;
      }

      if (data.type === "dismiss") {
        router.back();
        return;
      }

      if (data.type === "error") {
        Alert.alert("Payment", data.message ?? "Checkout error.");
        router.back();
      }
    },
    [router]
  );

  if (!html) {
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>Missing payment parameters.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn} activeOpacity={0.8}>
          <Ionicons name="close" size={24} color="#1d324e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure payment</Text>
        <View style={{ width: 40 }} />
      </View>
      <WebView
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        {...(Platform.OS === "android" ? { mixedContentMode: "always" as const } : {})}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#ef7b1a" />
          </View>
        )}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F0" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFF7F0",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(29,50,78,0.12)",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#1d324e" },
  webview: { flex: 1, backgroundColor: "#FFFFFF" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  err: { fontSize: 14, color: "#1d324e", textAlign: "center", marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#ef7b1a", borderRadius: 12 },
  backBtnText: { color: "#FFFFFF", fontWeight: "800" },
});

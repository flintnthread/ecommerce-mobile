import { Alert } from "react-native";

export type RazorpaySheetSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpaySheetOptions = {
  key: string;
  amount: string;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color: string };
};

export function openRazorpaySheet(_options: RazorpaySheetOptions): Promise<RazorpaySheetSuccess> {
  Alert.alert(
    "Payments",
    "Razorpay runs on Android and iOS. Use a dev build or device for checkout."
  );
  return Promise.reject(new Error("RAZORPAY_WEB_UNSUPPORTED"));
}

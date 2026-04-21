import Constants from "expo-constants";
import { NativeModules } from "react-native";
import RazorpayCheckout from "react-native-razorpay";

function nativeUnavailableMessage(): string {
  // Expo Go: appOwnership is "expo". A real dev build uses the "MyLoginApp" icon, not Expo Go.
  if (Constants.appOwnership === "expo") {
    return [
      "You opened this project in Expo Go. Razorpay is not inside Expo Go.",
      "",
      "Fix: close Expo Go. In a terminal (ecommerce-mobile folder) run:",
      "npx expo run:android",
      "",
      "When the build finishes, tap the MyLoginApp icon on your phone — do not scan the QR into Expo Go.",
    ].join("\n");
  }
  return [
    "Razorpay native module is missing from this install.",
    "From the ecommerce-mobile folder run: npx expo prebuild --clean",
    "then: npx expo run:android",
    "Open MyLoginApp (not Expo Go). Rebuild after any native dependency change.",
  ].join("\n");
}

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

export function openRazorpaySheet(
  options: RazorpaySheetOptions
): Promise<RazorpaySheetSuccess> {
  const mod = NativeModules.RNRazorpayCheckout as { open?: (o: RazorpaySheetOptions) => void } | null;
  if (!mod || typeof mod.open !== "function") {
    return Promise.reject(new Error(nativeUnavailableMessage()));
  }
  return RazorpayCheckout.open(options) as Promise<RazorpaySheetSuccess>;
}

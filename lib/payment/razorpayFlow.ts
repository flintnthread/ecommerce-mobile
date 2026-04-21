import { NativeModules } from "react-native";
import api from "../../services/api";
import { openRazorpaySheet } from "./razorpayCheckout";

export function isRazorpayNativeModuleAvailable(): boolean {
  try {
    const mod = (NativeModules as { RNRazorpayCheckout?: { open?: unknown } }).RNRazorpayCheckout;
    return mod != null && typeof mod.open === "function";
  } catch {
    return false;
  }
}

/** Backend expects amount in INR (rupees); server converts to paise for Razorpay. */
export type CreateRazorpayOrderResponse = {
  success: boolean;
  message?: string;
  razorpayKeyId?: string;
  data?: {
    id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    receipt?: string;
    [key: string]: unknown;
  };
};

export type VerifyPaymentResponse = {
  success: boolean;
  message?: string;
};

export async function createRazorpayOrder(
  amountRupees: number
): Promise<CreateRazorpayOrderResponse> {
  const { data } = await api.post<CreateRazorpayOrderResponse>(
    "/api/payment/create-order",
    { amount: amountRupees }
  );
  return data;
}

export async function verifyRazorpayPayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<VerifyPaymentResponse> {
  const qs = new URLSearchParams({
    orderId: params.orderId,
    paymentId: params.paymentId,
    signature: params.signature,
  });
  const { data } = await api.post<VerifyPaymentResponse>(
    `/api/payment/verify?${qs.toString()}`
  );
  return data;
}

/**
 * Creates a server order, opens Razorpay, then POSTs verification to your API.
 * @param amountRupees Payable total in INR rupees (same unit as your Postman `amount`).
 */
export type PayWithRazorpayResult =
  | { ok: true; verify: VerifyPaymentResponse }
  | {
      ok: false;
      reason: "create_failed" | "checkout_failed" | "verify_failed" | "cancelled";
      message: string;
    }
  | {
      ok: false;
      reason: "use_web_checkout";
      razorpayKeyId: string;
      orderId: string;
      amountPaise: number;
      currency: string;
    };

export async function payWithRazorpay(amountRupees: number): Promise<PayWithRazorpayResult> {
  if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
    return {
      ok: false,
      reason: "create_failed",
      message: "Invalid payable amount.",
    };
  }

  const created = await createRazorpayOrder(amountRupees);
  if (!created.success || !created.razorpayKeyId || !created.data?.id) {
    return {
      ok: false,
      reason: "create_failed",
      message: created.message ?? "Could not start payment.",
    };
  }

  const order = created.data;
  const amountPaise = order.amount;
  if (typeof amountPaise !== "number" || !Number.isFinite(amountPaise)) {
    return {
      ok: false,
      reason: "create_failed",
      message: "Invalid order from server.",
    };
  }

  if (!isRazorpayNativeModuleAvailable()) {
    return {
      ok: false,
      reason: "use_web_checkout",
      razorpayKeyId: created.razorpayKeyId,
      orderId: String(order.id),
      amountPaise,
      currency: String(order.currency ?? "INR"),
    };
  }

  try {
    const payment = await openRazorpaySheet({
      key: created.razorpayKeyId,
      amount: String(amountPaise),
      currency: String(order.currency ?? "INR"),
      order_id: String(order.id),
      name: "Order payment",
      description: `Pay ₹${Math.round(amountRupees).toLocaleString("en-IN")}`,
      theme: { color: "#ef7b1a" },
    });

    const verify = await verifyRazorpayPayment({
      orderId: payment.razorpay_order_id,
      paymentId: payment.razorpay_payment_id,
      signature: payment.razorpay_signature,
    });

    if (!verify.success) {
      return {
        ok: false,
        reason: "verify_failed",
        message: verify.message ?? "Payment could not be verified.",
      };
    }

    return { ok: true, verify };
  } catch (e: unknown) {
    const err = e as { code?: number; description?: string; message?: string };
    const code = err?.code;
    const desc = err?.description ?? err?.message ?? String(e);
    if (code === 0 || /back/i.test(desc) || /cancel/i.test(desc)) {
      return { ok: false, reason: "cancelled", message: "Payment cancelled." };
    }
    return {
      ok: false,
      reason: "checkout_failed",
      message: desc || "Payment failed.",
    };
  }
}

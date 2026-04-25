import api from "../services/api";

export type ApiOrderRow = {
  orderId: number;
  orderNumber: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  totalAmount?: number;
  finalAmount?: number;
  createdDate?: string;
  firstProductImage?: string | null;
  totalItems?: number;
  shippingAddress?: string;
  shiprocketAwbCode?: string | null;
  shiprocketTrackingUrl?: string | null;
  shiprocketCourierName?: string | null;
  shiprocketStatus?: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/** GET /api/orders — requires JWT (same axios instance as rest of app). */
export async function fetchUserOrdersList(): Promise<ApiOrderRow[]> {
  const { data } = await api.get<ApiEnvelope<ApiOrderRow[]>>("/api/orders");
  if (!data?.success || !Array.isArray(data.data)) {
    return [];
  }
  return data.data;
}

/** PUT /api/orders/{id}/cancel — requires JWT. */
export async function cancelOrderById(orderId: number): Promise<{ success: boolean; message: string }> {
  const id = Math.floor(Number(orderId));
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, message: "Invalid order id." };
  }
  const { data } = await api.put<ApiEnvelope<string>>(`/api/orders/${id}/cancel`);
  return {
    success: Boolean(data?.success),
    message: data?.message || (data?.success ? "Order cancelled successfully" : "Could not cancel order."),
  };
}

import api from "../services/api";

export type ApiOrderRow = {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  paymentStatus?: string;
  paymentMethod?: string;
  totalAmount?: number;
  finalAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalItems?: number;
  firstProductImage?: string | null;
  createdDate?: string;
  shippingAddress?: string;
  shiprocketAwbCode?: string | null;
  shiprocketTrackingUrl?: string | null;
  shiprocketCourierName?: string | null;
  shiprocketStatus?: string | null;
  items?: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    sellingPrice?: number;
    productImage?: string;
    size?: string;
    color?: string;
  }>;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

/**
 * GET /api/orders — requires JWT (same axios instance as rest of app).
 * Backend returns: { success: boolean, message: string, data: OrderResponseDTO[] }
 */
export async function fetchUserOrdersList(
  status?: string
): Promise<ApiOrderRow[]> {
  try {
    const { data } = await api.get<ApiEnvelope<ApiOrderRow[]>>("/api/orders", {
      params: status ? { status } : undefined,
    });
    
    console.log("Orders API Response:", data);
    
    if (data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    
    // Fallback for unexpected response format
    if (Array.isArray(data)) {
      return data.filter((row): row is ApiOrderRow => Boolean(row && typeof row === "object"));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

/** PUT /api/orders/{id}/cancel — requires JWT. */
export async function cancelOrderById(orderId: number): Promise<{ success: boolean; message: string }> {
  const id = Math.floor(Number(orderId));
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, message: "Invalid order id." };
  }
const { data } = await api.post<ApiEnvelope<string>>(`/api/orders/${id}/cancel`);
  return {
    success: Boolean(data?.success),
    message: data?.message || (data?.success ? "Order cancelled successfully" : "Could not cancel order."),
  };
}

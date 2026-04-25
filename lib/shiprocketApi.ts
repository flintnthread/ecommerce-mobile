import api from "../services/api";

export type ShiprocketTrackResponse = {
  success: boolean;
  message?: string;
  data?: string;
};

/**
 * Live tracking via your backend (JWT required — same as other /api/* calls).
 * `awb` is the Shiprocket AWB stored on the order after payment/shipment create.
 */
export async function fetchShiprocketTracking(awb: string): Promise<string> {
  const trimmed = awb.trim();
  if (!trimmed) {
    throw new Error("Missing AWB");
  }
  const { data } = await api.get<ShiprocketTrackResponse>(
    `/api/shiprocket/track/${encodeURIComponent(trimmed)}`
  );
  if (!data?.success || data.data == null) {
    throw new Error(data?.message || "Could not load tracking.");
  }
  return data.data;
}

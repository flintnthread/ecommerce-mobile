import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";
import { Buffer } from "buffer";


type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type PushNotificationDto = {
  id?: number | string | null;
  userId?: number | string | null;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  link?: string | null;
  isRead?: boolean | null;
  createdAt?: string | null;
  readAt?: string | null;
};

export type PushNotificationItem = {
  id: string;
  userId: number | null;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  readAt: string;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const decoded = Buffer.from(padded, "base64").toString("utf-8");

    const parsed = JSON.parse(decoded);

    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;

  } catch (e) {
    console.log("JWT decode error:", e);
    return null;
  }
}

export function extractUserIdFromToken(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const candidates = [payload.userId, payload.id, payload.uid, payload.sub];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return null;
}

export async function getCurrentUserIdFromToken(): Promise<number | null> {
  try {
    const token = (await AsyncStorage.getItem("token"))?.trim();
    if (!token) {
      console.log("No token found in AsyncStorage");
      return null;
    }
    
    // Validate token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log("Invalid token format - not a proper JWT");
      // Clear invalid token
      await AsyncStorage.removeItem("token");
      return null;
    }
    
    const userId = extractUserIdFromToken(token);
    if (!userId) {
      console.log("Could not extract user ID from token - token may be invalid or expired");
      // Clear invalid token
      await AsyncStorage.removeItem("token");
      return null;
    }
    
    console.log("Successfully extracted user ID from token:", userId);
    return userId;
  } catch (error) {
    console.log("Error getting user ID from token:", error);
    // Clear potentially corrupted token
    await AsyncStorage.removeItem("token");
    return null;
  }
}

// Add function to validate and refresh token if needed
export async function validateAndRefreshToken(): Promise<boolean> {
  try {
    const userId = await getCurrentUserIdFromToken();
    if (!userId) {
      console.log("Token validation failed - user needs to login again");
      return false;
    }
    
    // Optionally: You could make a backend call to validate the token
    // const response = await api.get('/api/user/validate-token');
    // if (!response.data.valid) {
    //   await AsyncStorage.removeItem("token");
    //   return false;
    // }
    
    return true;
  } catch (error) {
    console.log("Token validation error:", error);
    return false;
  }
}

function toPushNotificationItem(row: PushNotificationDto): PushNotificationItem | null {
  const idNum = Number(row.id);
  if (!Number.isFinite(idNum) || idNum <= 0) return null;

  const userIdNum = Number(row.userId);
  return {
    id: String(Math.floor(idNum)),
    userId: Number.isFinite(userIdNum) && userIdNum > 0 ? Math.floor(userIdNum) : null,
    title: String(row.title ?? "").trim(),
    message: String(row.message ?? "").trim(),
    type: String(row.type ?? "general").trim() || "general",
    link: String(row.link ?? "").trim(),
    isRead: Boolean(row.isRead),
    createdAt: String(row.createdAt ?? ""),
    readAt: String(row.readAt ?? ""),
  };
}

function normalizeRows(payload: unknown): PushNotificationItem[] {
  const body = payload as ApiResponse<unknown>;
  const data = body?.data;
  let rawRows: unknown[] = [];
  if (Array.isArray(data)) {
    rawRows = data;
  } else if (data && typeof data === "object") {
    const maybePage = data as { content?: unknown };
    if (Array.isArray(maybePage.content)) {
      rawRows = maybePage.content;
    }
  }

  if (!Array.isArray(rawRows)) return [];
  const out: PushNotificationItem[] = [];
  for (const row of rawRows) {
    if (!row || typeof row !== "object") continue;
    const normalized = toPushNotificationItem(row as PushNotificationDto);
    if (normalized) out.push(normalized);
  }
  return out;
}

export async function fetchPushNotifications(
  userId?: number | null
): Promise<PushNotificationItem[]> {
  const params: Record<string, string | number | boolean> = {
    type: "order",
    isRead: false,
  };
  if (Number.isFinite(userId) && Number(userId) > 0) {
    params.userId = Math.floor(Number(userId));
  }
  try {
    const { data } = await api.get<ApiResponse<unknown>>("/api/push-notifications", {
      params,
    });
    return normalizeRows(data);
  } catch {
    // Fallback for environments wired only to paged endpoint.
    const { data } = await api.get<ApiResponse<unknown>>("/api/push-notifications/paged", {
      params: {
        ...params,
        page: 0,
        size: 50,
        sort: "createdAt,desc",
      },
    });
    return normalizeRows(data);
  }
}

export async function fetchUnreadNotificationCount(
  userId?: number | null
): Promise<number> {
  const rows = await fetchPushNotifications(userId);
  return rows.length;
}

export async function markPushNotificationAsRead(notificationId: string | number) {
  const id = Math.floor(Number(notificationId));
  if (!Number.isFinite(id) || id <= 0) return;
  await api.patch(`/api/push-notifications/${id}/read`);
}

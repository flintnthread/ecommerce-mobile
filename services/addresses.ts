import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Relative to `api` baseURL (see `services/api.tsx`). */
export const ADDRESSES_ENDPOINT = "/api/addresses";

/** `DELETE /api/addresses/{id}` path segment (no host). */
export function addressDetailPath(id: string | number): string {
  return `${ADDRESSES_ENDPOINT}/${encodeURIComponent(String(id))}`;
}

/** `PUT /api/addresses/{id}/default` — mark as default (path only; host from `api`). */
export function addressDefaultPath(id: string | number): string {
  return `${addressDetailPath(id)}/default`;
}

export type AddressType = "home" | "work" | "other";

/** One row from `GET /api/addresses` → `data[]`. */
export interface ApiAddress {
  id: number;
  userId?: number;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AddressesListResponse {
  success: boolean;
  message?: string;
  data: ApiAddress[];
}

export interface CreateAddressPayload {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
}

/** `GET /api/addresses` — uses shared `api` instance (auth base URL). */
export async function fetchAddresses(): Promise<ApiAddress[]> {
  try {
    console.log("Fetching addresses from API...");

    const { data } = await api.get<AddressesListResponse>(
      ADDRESSES_ENDPOINT
    );

    console.log("Address API response:", data);

    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error: any) {
    console.error("fetchAddresses FAILED:", error);

    if (error.code === "ERR_NETWORK") {
      throw new Error(
        "Network error. Please check your internet connection."
      );
    }

    throw error;
  }
}

function joinAddressLines(line1: string, line2: string): string {
  const a = (line1 || "").trim();
  const b = (line2 || "").trim();
  if (a && b) return `${a}\n${b}`;
  return a || b;
}

/** Account screen → Switch Shopper chips (from API rows). */
export function mapApiAddressToSavedProfileShape(a: ApiAddress) {
  return {
    id: String(a.id),
    name: a.name.trim(),
    username: a.name.trim(),
    email: a.email.trim(),
    mobile: String(a.phone).trim(),
    photoUri: null as string | null,
    address: joinAddressLines(a.addressLine1, a.addressLine2),
    city: a.city.trim(),
    state: a.state.trim(),
    pincode: String(a.pincode).trim(),
  };
}

/** Settings → Addresses tab list row. */
export interface SettingsAddressCard {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export function mapApiAddressToSettingsCard(a: ApiAddress): SettingsAddressCard {
  const t = (a.addressType || "home").toLowerCase();
  const type: "home" | "work" | "other" =
    t === "work" ? "work" : t === "other" ? "other" : "home";
  const line2 = (a.addressLine2 || "").trim();
  const addressDisplay = line2
    ? `${(a.addressLine1 || "").trim()}, ${line2}`
    : (a.addressLine1 || "").trim();
  return {
    id: String(a.id),
    type,
    name: a.name.trim(),
    phone: String(a.phone).trim(),
    address: addressDisplay,
    city: a.city.trim(),
    state: a.state.trim(),
    pincode: String(a.pincode).trim(),
    isDefault: Boolean(a.isDefault),
  };
}

/** Split multiline "Address" into line1 / line2 for the API. */
export function splitAddressLines(raw: string): {
  line1: string;
  line2: string;
} {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    line1: lines[0] ?? "",
    line2: lines.slice(1).join(", ").trim(),
  };
}

/** Best-effort id from various common API response shapes (e.g. POST create body). */
export function parseServerAddressId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const direct = o.id ?? o.addressId;
  if (typeof direct === "string" || typeof direct === "number") {
    return String(direct);
  }
  const nested = o.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return null;
}

export async function createAddress(
  payload: CreateAddressPayload
): Promise<unknown> {
  try {
    // Check if user has token
    const token = await AsyncStorage.getItem("token");
    if (!token || token.trim() === "") {
      throw new Error("Please login to add an address.");
    }

    console.log("Creating address with payload:", payload);
    const { data } = await api.post<unknown>(ADDRESSES_ENDPOINT, payload);
    console.log("Address creation response:", data);
    return data;
  } catch (error: any) {
    console.error("Address creation failed:", error);
    
    // Handle authentication errors
  
    
    // Handle network errors
    if (error.code === "ERR_NETWORK") {
      throw new Error("Network error. Please check your connection.");
    }
    
    throw error;
  }
}

/** `DELETE /api/addresses/{id}` — uses shared `api` instance. */
export async function deleteAddress(id: string | number): Promise<void> {
  try {
    await api.delete(addressDetailPath(id));
  } catch (error: any) {
    console.error("Delete address failed:", error);
  
}
}
export interface SetDefaultAddressResponse {
  success?: boolean;
  message?: string;
  data?: ApiAddress;
}

/**
 * Set this row as the user's default address.
 * Uses `PUT` with an empty JSON body; if your API expects `POST` instead, change to `api.post`.
 */
export async function setDefaultAddress(
  id: string | number
): Promise<SetDefaultAddressResponse> {
  try {
    const { data } = await api.put<SetDefaultAddressResponse>(
      addressDefaultPath(id),
      {}
    );
    return data;
  } catch (error: any) {
    console.error("Set default address failed:", error);
    throw error;
  }
}

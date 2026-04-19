import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_PORT = "8080";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getHostFromExpo(): string | null {
  try {
    // Try different Expo Constants properties
    let hostUri: string | undefined;
    
    if (Constants.expoConfig?.hostUri) {
      hostUri = Constants.expoConfig.hostUri;
    } else if ((Constants as any).manifest2?.extra?.expoClient?.hostUri) {
      hostUri = (Constants as any).manifest2.extra.expoClient.hostUri;
    } else if ((Constants as any).manifest?.debuggerHost) {
      hostUri = (Constants as any).manifest.debuggerHost;
    }

    if (!hostUri) return null;
    const host = hostUri.split(":")[0]?.trim();
    if (!host) return null;
    if (host === "localhost" || host === "127.0.0.1") return null;
    return host;
  } catch (error) {
    console.log("Error getting host from Expo Constants:", error);
    return null;
  }
}

function resolveBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) return normalizeBaseUrl(envBaseUrl);

  const expoHost = getHostFromExpo();
  if (expoHost) return `http://${expoHost}:${API_PORT}`;

  if (Platform.OS === "android") {
    // Android emulator cannot access host machine via localhost.
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

const normalizedBaseUrl = resolveBaseUrl();

const api = axios.create({
  baseURL: normalizedBaseUrl,

  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ crucial for session/cookies
});

// Add JWT token interceptor to include bearer token in all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log("Error getting token from AsyncStorage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      await AsyncStorage.removeItem("token");
      // You might want to add navigation logic here
      console.log("Token expired, please login again");
    }
    return Promise.reject(error);
  }
);

/**
 * Product listing for one subcategory — path only (use with `api.get(...)`).
 * Base URL comes from `api.defaults.baseURL` (env / Expo host / emulator), so this stays correct if the server host changes.
 */
export function productsBySubcategoryPath(subcategoryId: number): string {
  const id = Math.floor(Number(subcategoryId));
  if (!Number.isFinite(id) || id <= 0) return "/api/products/subcategory/0";
  return `/api/products/subcategory/${id}`;
}

/** Single product for detail screen — path only (use with `api.get(...)`). */
export function productByIdPath(productId: number): string {
  const id = Math.floor(Number(productId));
  if (!Number.isFinite(id) || id <= 0) return "/api/products/0";
  return `/api/products/${id}`;
}

// ===== ADDRESS API FUNCTIONS =====

// Address interface for TypeScript
export interface AddressRequest {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType: "home" | "work" | "other";
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Address {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  addressType: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Add a new address for the authenticated user
 */
export const addAddress = async (addressData: AddressRequest): Promise<ApiResponse<Address>> => {
  const response = await api.post("/api/addresses", addressData);
  return response.data;
};

/**
 * Get all addresses for the authenticated user
 */
export const getUserAddresses = async (): Promise<ApiResponse<Address[]>> => {
  const response = await api.get("/api/addresses");
  return response.data;
};

/**
 * Update an existing address
 */
export const updateAddress = async (id: number, addressData: AddressRequest): Promise<ApiResponse<Address>> => {
  const response = await api.put(`/api/addresses/${id}`, addressData);
  return response.data;
};

/**
 * Delete an address
 */
export const deleteAddress = async (id: number): Promise<ApiResponse<string>> => {
  const response = await api.delete(`/api/addresses/${id}`);
  return response.data;
};

/**
 * Set an address as default
 */
export const setDefaultAddress = async (id: number): Promise<ApiResponse<Address>> => {
  const response = await api.put(`/api/addresses/${id}/default`);
  return response.data;
};

/**
 * Get the default address
 */
export const getDefaultAddress = async (): Promise<ApiResponse<Address>> => {
  const response = await api.get("/api/addresses/default");
  return response.data;
};

export default api;
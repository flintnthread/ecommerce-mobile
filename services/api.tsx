import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

function resolveFlintScheme(): "http" | "https" {
  try {
    if (typeof window !== "undefined" && window.location?.protocol === "https:") {
      return "https";
    }
  } catch {
    // no-op: keep default
  }
  return "http";
}

const FLINT_SCHEME = resolveFlintScheme();
const FLINT_HOST = "flintnthread.com";
function resolveWebOrigin(): string | null {
  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return String(window.location.origin).replace(/\/+$/, "");
    }
  } catch {
    // no-op
  }
  return null;
}

const WEB_ORIGIN = resolveWebOrigin();
function isFlintOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    return u.hostname === FLINT_HOST || u.hostname.endsWith(`.${FLINT_HOST}`);
  } catch {
    return false;
  }
}

const WEB_ORIGIN_IS_FLINT = isFlintOrigin(WEB_ORIGIN);
const API_BASE_URL = WEB_ORIGIN_IS_FLINT
  ? `${WEB_ORIGIN}/api`
  : `${FLINT_SCHEME}://${FLINT_HOST}/api`;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractUserIdFromToken(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const candidate = Number(
    payload.userId ?? payload.id ?? payload.uid ?? payload.sub
  );
  if (!Number.isFinite(candidate) || candidate <= 0) return null;
  return Math.floor(candidate);
}

function resolveBaseUrl(): string {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envBaseUrl) return normalizeBaseUrl(envBaseUrl);
  return API_BASE_URL;
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

// Auth API instance for login/OTP only (single `/api/...` path).
// Use resolveBaseUrl() to respect EXPO_PUBLIC_API_BASE_URL env var for deployed environments
const AUTH_BASE_URL = resolveBaseUrl();
console.log("Auth API Base URL:", AUTH_BASE_URL);

const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Disable for HTTP cross-domain to avoid CORS issues
});

// Add JWT token interceptor for authApi requests
authApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log("Auth API Request:", config.method?.toUpperCase(), config.baseURL + config.url);
    } catch (error) {
      console.log("Error getting token from AsyncStorage for authApi:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for authApi to log errors
authApi.interceptors.response.use(
  (response) => {
    console.log("Auth API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("Auth API Error:", {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// Add JWT token interceptor to include bearer token in all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const rawUrl = String(config.url ?? "");
      const isSearchRequest =
        rawUrl.startsWith("/api/search") &&
        !rawUrl.startsWith("/api/search/history") &&
        !rawUrl.startsWith("/api/search/suggestions");

      if (isSearchRequest) {
        const base = String(config.baseURL ?? api.defaults.baseURL ?? "").replace(
          /\/$/,
          ""
        );
        const absolute = rawUrl.startsWith("http")
          ? rawUrl
          : `${base}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
        const u = new URL(absolute);
        const hasUserId = u.searchParams.has("userId");
        const hasSessionId = u.searchParams.has("sessionId");

        if (!hasUserId && token) {
          const userId = extractUserIdFromToken(token);
          if (userId) {
            u.searchParams.set("userId", String(userId));
          }
        }

        if (!hasSessionId) {
          const sessionId =
            (await AsyncStorage.getItem("ft_recent_view_session_id"))?.trim() || "";
          if (sessionId) {
            u.searchParams.set("sessionId", sessionId);
          }
        }

        config.url = `${u.pathname}${u.search}`;
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

/** POST add to wishlist — server uses JWT; `userId` in body is optional. */
export const WISHLIST_ADD_PATH = "/api/wishlist/add";

/** GET current user's wishlist (JWT). */
export const WISHLIST_USER_PATH = "/api/wishlist/user";

/** DELETE with query params `productId`, `variantId`. */
export const WISHLIST_REMOVE_PATH = "/api/wishlist/remove";

/** GET current user's cart (JWT). */
export const CART_PATH = "/api/cart";

/** POST add line — body `{ productId, variantId, quantity }`. */
export const CART_ADD_PATH = "/api/cart/add";

/** DELETE clear entire cart. */
export const CART_CLEAR_PATH = "/api/cart/clear";

/** PUT update quantity by signed delta — `/api/cart/item/{itemId}?quantity=±n`. */
export function cartItemPath(itemId: number): string {
  const id = Math.floor(Number(itemId));
  if (!Number.isFinite(id) || id <= 0) return "/api/cart/item/0";
  return `/api/cart/item/${id}`;
}

export type WishlistAddPayload = {
  userId?: number;
  productId: number;
  variantId: number;
};

/** Related products for a product — path only (use with `api.get(...)`). */
export function relatedProductsPath(productId: number): string {
  const id = Math.floor(Number(productId));
  if (!Number.isFinite(id) || id <= 0) return "/api/products/related/0";
  return `/api/products/related/${id}`;
}


/** Search products by keyword — path only (use with `api.get(...)`). */
export function searchProductsPath(
  keyword: string,
  params?: { userId?: number | null; sessionId?: string | null }
): string {
  const sanitizedKeyword = keyword.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const sp = new URLSearchParams();
  if (sanitizedKeyword) {
    sp.set("keyword", sanitizedKeyword);
  }
  const uid = Number(params?.userId);
  if (Number.isFinite(uid) && uid > 0) {
    sp.set("userId", String(Math.floor(uid)));
  }
  const sid = String(params?.sessionId ?? "").trim();
  if (sid) {
    sp.set("sessionId", sid);
  }
  const qs = sp.toString();
  return qs ? `/api/search?${qs}` : "/api/search";
}

/** Search suggestions by keyword — path only (use with `api.get(...)`). */
export function searchSuggestionsPath(keyword: string): string {
  const sanitizedKeyword = keyword.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  if (!sanitizedKeyword) return "/api/search/suggestions";
  return `/api/search/suggestions?keyword=${encodeURIComponent(sanitizedKeyword)}`;
}

export type SearchUiResult = {
  id: string;
  name: string;
  imageUri: string;
  sellingPrice: number;
  mrpPrice: number;
  discountPercentage: number;
  rating: number;
  kind: "product" | "category";
};

function toSafeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function resolveSearchImageUri(raw: unknown, apiBase: string): string {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (!apiBase) return value;
  if (value.startsWith("/")) return `${apiBase}${value}`;
  if (value.includes("/")) return `${apiBase}/${value.replace(/^\/+/, "")}`;
  return `${apiBase}/uploads/${value}`;
}

function collectSearchRows(payload: unknown): Record<string, unknown>[] {
  const normalizePayload = (value: unknown): unknown => {
    if (typeof value !== "string") return value;
    const text = value.trim();
    if (!text) return value;

    try {
      return JSON.parse(text);
    } catch {
      // Some responses are streamed as "success JSON" followed by an error JSON block.
      const trailingErrorIdx = text.lastIndexOf('{"success":false');
      if (trailingErrorIdx > 0) {
        const head = text.slice(0, trailingErrorIdx).trim();
        try {
          return JSON.parse(head);
        } catch {
          return value;
        }
      }
      return value;
    }
  };

  const normalizedPayload = normalizePayload(payload);
  const rows: Record<string, unknown>[] = [];
  const pushRows = (value: unknown) => {
    if (!Array.isArray(value)) return;
    for (const item of value) {
      if (item && typeof item === "object") {
        rows.push(item as Record<string, unknown>);
      }
    }
  };

  pushRows(normalizedPayload);

  if (normalizedPayload && typeof normalizedPayload === "object") {
    const obj = normalizedPayload as Record<string, unknown>;
    pushRows(obj.products);
    pushRows(obj.categories);
    pushRows(obj.relatedProducts);
    pushRows(obj.related);
    pushRows(obj.matchedProducts);
    pushRows(obj.content);
    pushRows(obj.items);
    pushRows(obj.results);

    const nested = obj.data;
    pushRows(nested);
    if (nested && typeof nested === "object") {
      const d = nested as Record<string, unknown>;
      pushRows(d.products);
      pushRows(d.categories);
      pushRows(d.relatedProducts);
      pushRows(d.related);
      pushRows(d.matchedProducts);
      pushRows(d.content);
      pushRows(d.items);
      pushRows(d.results);
    }
  }

  return rows;
}

export function mapSearchResultsToUi(payload: unknown): SearchUiResult[] {
  const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  const rows = collectSearchRows(payload);
  const seen = new Set<string>();
  const out: SearchUiResult[] = [];

  for (const item of rows) {
    const id = String(item.id ?? item.productId ?? item.categoryId ?? "");
    if (!id) continue;

    const name = String(
      item.name ??
        item.productName ??
        item.title ??
        item.categoryName ??
        ""
    ).trim();
    if (!name) continue;

    const hasCategoryName =
      typeof item.categoryName === "string" && item.categoryName.trim().length > 0;
    const hasProductishName =
      typeof item.productName === "string" ||
      typeof item.sellingPrice !== "undefined" ||
      Array.isArray(item.images);
    const kind: "product" | "category" =
      hasCategoryName && !hasProductishName ? "category" : "product";

    const images = Array.isArray(item.images) ? item.images : [];
    const firstImage =
      images.find((img) => img && typeof img === "object") as
        | Record<string, unknown>
        | undefined;

    const imageRaw =
      item.mobileImage ??
      item.imageUrl ??
      item.image ??
      item.bannerImage ??
      item.thumbnail ??
      firstImage?.imagePath ??
      firstImage?.imageUrl ??
      "";

    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id,
      name,
      imageUri: resolveSearchImageUri(imageRaw, apiBase),
      sellingPrice: toSafeNumber(
        item.sellingPrice ?? item.salePrice ?? item.price ?? 0
      ),
      mrpPrice: toSafeNumber(item.mrpPrice ?? item.maxRetailPrice ?? item.mrp ?? 0),
      discountPercentage: toSafeNumber(item.discountPercentage ?? 0),
      rating: toSafeNumber(item.rating ?? 0),
      kind,
    });
  }

  return out;
}

/** Products by category — path only (use with `api.get(...)`). */
export function productsByCategoryPath(categoryId: number): string {
  const id = Math.floor(Number(categoryId));
  if (!Number.isFinite(id) || id <= 0) return "/api/products/category/0";
  return `/api/products/category/${id}`;
}

/** Products by main category — path only (use with `api.get(...)`). */
export function productsByMainCategoryPath(mainCategoryId: number): string {
  const id = Math.floor(Number(mainCategoryId));
  if (!Number.isFinite(id) || id <= 0) return "/api/products/main-category/0";
  return `/api/products/main-category/${id}`;
}

/** Feed listing for one main category, e.g. spotlight/trending/latest/top-collections. */
export function productsByMainCategoryFeedPath(
  mainCategoryId: number,
  feedKey: string
): string {
  const id = Math.floor(Number(mainCategoryId));
  const key = String(feedKey ?? "").trim().toLowerCase();
  if (!Number.isFinite(id) || id <= 0) return "/api/products/main-category/0/spotlight";
  if (!key) return `/api/products/main-category/${id}/spotlight`;
  return `/api/products/main-category/${id}/${encodeURIComponent(key)}`;
}

/** Recently viewed products by user/session — path only (use with `api.get(...)`). */
export function recentlyViewedProductsPath(params: {
  userId?: number | null;
  sessionId?: string | null;
}): string {
  const sp = new URLSearchParams();
  const uid = Number(params.userId);
  if (Number.isFinite(uid) && uid > 0) {
    sp.set("userId", String(Math.floor(uid)));
  }
  const sid = String(params.sessionId ?? "").trim();
  if (sid) {
    sp.set("sessionId", sid);
  }
  const qs = sp.toString();
  return qs ? `/api/products/recently-viewed?${qs}` : "/api/products/recently-viewed";
}

/** Search history by user/session — path only (use with `api.get(...)`). */
export function searchHistoryPath(params: {
  userId?: number | null;
  sessionId?: string | null;
}): string {
  const sp = new URLSearchParams();
  const uid = Number(params.userId);
  if (Number.isFinite(uid) && uid > 0) {
    sp.set("userId", String(Math.floor(uid)));
  }
  const sid = String(params.sessionId ?? "").trim();
  if (sid) {
    sp.set("sessionId", sid);
  }
  const qs = sp.toString();
  return qs ? `/api/search/history?${qs}` : "/api/search/history";
}

/**
 * Product search with query params — path only (use with `api.get(...)`).
 * Example: `/api/products/search?q=men&categoryId=29` (base URL from axios `baseURL`).
 */
export function productsSearchPath(params: {
  q?: string;
  categoryId?: number;
  sort?: string;
  gender?: string;
}): string {
  const sp = new URLSearchParams();
  const q = String(params.q ?? "").trim();
  if (q) sp.set("q", q);
  const cid = params.categoryId;
  if (cid != null && Number.isFinite(cid) && cid > 0) {
    sp.set("categoryId", String(Math.floor(Number(cid))));
  }
  const sort = String(params.sort ?? "").trim();
  if (sort) sp.set("sort", sort);
  const gender = String(params.gender ?? "").trim();
  if (gender) sp.set("gender", gender);
  const qs = sp.toString();
  return qs ? `/api/products/search?${qs}` : "/api/products/search";
}

/** Subcategories by category — path only (use with `api.get(...)`). */
export function subcategoriesByCategoryPath(categoryId: number): string {
  const id = Math.floor(Number(categoryId));
  if (!Number.isFinite(id) || id <= 0) return "/api/categories/0/subcategories";
  return `/api/categories/${id}/subcategories`;
}

/** Categories tree — path only (use with `api.get(...)`). */
export const categoriesTreePath = "/api/categories/tree";

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

// ===== OTP API FUNCTIONS (using flintnthread.com) =====

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export interface OtpRequest {
  email?: string;
  mobile?: string;
  otp: string;
}

export interface SendOtpRequest {
  email?: string;
  mobile?: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

/**
 * Send OTP to email for verification - uses http://flintnthread.com
 */
export const sendOtp = async (otpData: SendOtpRequest): Promise<OtpResponse> => {
  try {
    console.log("Sending OTP request to:", AUTH_BASE_URL + "/auth/send-otp", "with email:", otpData.email);
    const response = await authApi.post("/auth/send-otp", otpData);
    console.log("OTP response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Send OTP failed:", error.message, error.code);
    if (error.code === "ERR_NETWORK") {
      throw new Error("Cannot connect to server. Please check your internet connection or try again later.");
    }
    throw error;
  }
};

/**
 * Verify OTP for email - uses http://flintnthread.com
 */
export const verifyOtp = async (otpData: OtpRequest): Promise<LoginResponse> => {
  try {
    console.log("Verifying OTP at:", AUTH_BASE_URL + "/auth/verify-otp");
    const response = await authApi.post("/auth/verify-otp", otpData);
    console.log("Verify OTP response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Verify OTP failed:", error.message, error.code);
    if (error.code === "ERR_NETWORK") {
      throw new Error("Cannot connect to server. Please check your internet connection or try again later.");
    }
    throw error;
  }
};

/**
 * Logout user - clear token
 */
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await AsyncStorage.removeItem("token");
    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    return { success: false, message: "Failed to logout" };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("token");
    return !!token;
  } catch (error) {
    return false;
  }
};

/**
 * Search products by image - POST request with image data
 */
export const searchProductsByImage = async (
  imageUri: string,
  params?: { userId?: number | null; sessionId?: string | null }
): Promise<SearchUiResult[]> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'search.jpg',
  } as any);

  // Add query parameters
  const sp = new URLSearchParams();
  const uid = Number(params?.userId);
  if (Number.isFinite(uid) && uid > 0) {
    sp.set("userId", String(Math.floor(uid)));
  }
  const sid = String(params?.sessionId ?? "").trim();
  if (sid) {
    sp.set("sessionId", sid);
  }
  const qs = sp.toString();
  const url = qs ? `/api/search/image?${qs}` : "/api/search/image";

  try {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return mapSearchResultsToUi(response.data);
  } catch (error) {
    console.error('Error searching by image:', error);
    return [];
  }
};

export default api;
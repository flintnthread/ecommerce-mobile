import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Platform } from "react-native";

import Constants from "expo-constants";



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

  const hostUri =

    Constants.expoConfig?.hostUri ??

    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ??

    (Constants as any)?.manifest?.debuggerHost ??

    "";

  const lanHost = String(hostUri).split(":")[0].trim();

  if (lanHost && lanHost !== "localhost" && lanHost !== "127.0.0.1") {

    return `http://${lanHost}:8080`;

  }

  if (Platform.OS === "android") {

    // Android emulator cannot access host localhost directly.

    return "http://10.0.2.2:8080";

  }

return "http://localhost:8080";

}



const API_BASE_URL = resolveBaseUrl();

const LOCAL_API_ORIGIN = resolveBaseUrl();



const normalizedBaseUrl = resolveBaseUrl();

console.log("Main API Base URL:", normalizedBaseUrl);



function getMainOriginFallbacks(): string[] {

  const origins = [API_BASE_URL];

  const hostUri =

    Constants.expoConfig?.hostUri ??

    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ??

    (Constants as any)?.manifest?.debuggerHost ??

    "";

  const lanHost = String(hostUri).split(":")[0].trim();

  if (lanHost && lanHost !== "localhost" && lanHost !== "127.0.0.1") {

    origins.push(`http://${lanHost}:8080`);

  }

  if (Platform.OS === "android") {

    origins.push("http://10.0.2.2:8080", "http://10.0.3.2:8080");

  }

  return [...new Set(origins)];

}



const api = axios.create({

  baseURL: normalizedBaseUrl,



  timeout: 10000,

  headers: {

    "Content-Type": "application/json",

  },

  withCredentials: true, // ✅ crucial for session/cookies

});



// Auth API instance for login/OTP only (no `/api` prefix).

const AUTH_BASE_URL = LOCAL_API_ORIGIN;

console.log("Auth API Base URL:", AUTH_BASE_URL);



const authApi = axios.create({

  baseURL: AUTH_BASE_URL,

  timeout: 15000, // Increased timeout for slower connections

  headers: {

    "Content-Type": "application/json",

  },

  withCredentials: false, // Disable for HTTP cross-domain to avoid CORS issues

});



function getAuthOriginFallbacks(): string[] {

  const origins = [LOCAL_API_ORIGIN];

  const hostUri =

    Constants.expoConfig?.hostUri ??

    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ??

    (Constants as any)?.manifest?.debuggerHost ??

    "";

  const lanHost = String(hostUri).split(":")[0].trim();

  if (lanHost && lanHost !== "localhost" && lanHost !== "127.0.0.1") {

    origins.push(`http://${lanHost}:8080`);

  }

  if (Platform.OS === "android") {

    // Android emulators cannot hit host machine via localhost.

    origins.push("http://10.0.2.2:8080", "http://10.0.3.2:8080");

  }

  return [...new Set(origins)];

}



async function postAuthWithFallback<T>(path: string, payload: unknown): Promise<T> {

  const origins = getAuthOriginFallbacks();

  let lastError: unknown = null;



  for (const origin of origins) {

    try {

      console.log("Auth fallback try:", `${origin}${path}`);

      const response = await axios.post<T>(`${origin}${path}`, payload, {

        timeout: 15000,

        headers: { "Content-Type": "application/json" },

        withCredentials: false,

      });

      return response.data;

    } catch (error: any) {

      lastError = error;

      if (error?.code !== "ERR_NETWORK") {

        throw error;

      }

    }

  }

  throw lastError;

}



// Add JWT token interceptor for authApi requests

authApi.interceptors.request.use(  async (config) => {

    const token = await AsyncStorage.getItem("token");



    console.log("ASYNC STORAGE TOKEN:", token);



    if (token && token.trim() !== "") {

      config.headers.Authorization = `Bearer ${token}`;

    }



    return config;

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

      const requestConfig = config as any;

      if (!requestConfig.__originFallbacks) {

        requestConfig.__originFallbacks = getMainOriginFallbacks();

      }

      if (typeof requestConfig.__originIndex !== "number") {

        requestConfig.__originIndex = 0;

      }

      const fallbacks = Array.isArray(requestConfig.__originFallbacks)

        ? requestConfig.__originFallbacks

        : [API_BASE_URL];

      const origin =

        fallbacks[requestConfig.__originIndex] ??

        fallbacks[0] ??

        API_BASE_URL;

      config.baseURL = origin;



      const token = await AsyncStorage.getItem("token");

      console.log("ASYNC STORAGE TOKEN:", token);

      if (token && token.trim() !== "") {

        config.headers.Authorization = `Bearer ${token}`;

        console.log("API Request with token:", config.method?.toUpperCase(), config.baseURL + config.url);

        console.log("Token being sent:", token.substring(0, 30) + "...");

      } else {

        console.log("API Request without token:", config.method?.toUpperCase(), config.baseURL + config.url);

        console.log("No token found in AsyncStorage");

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

    const requestConfig = error?.config as any;

    if (error?.code === "ERR_NETWORK" && requestConfig) {

      const fallbacks = Array.isArray(requestConfig.__originFallbacks)

        ? requestConfig.__originFallbacks

        : [API_BASE_URL];

      const currentIndex =

        typeof requestConfig.__originIndex === "number"

          ? requestConfig.__originIndex

          : 0;

      const nextIndex = currentIndex + 1;

      if (nextIndex < fallbacks.length) {

        requestConfig.__originIndex = nextIndex;

        requestConfig.baseURL = fallbacks[nextIndex];

        console.log(

          "Main API fallback retry:",

          `${requestConfig.baseURL}${String(requestConfig.url ?? "")}`

        );

        return api.request(requestConfig);

      }

    }



    if (error.response?.status === 401) {

  console.log("401 Unauthorized");

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



/** Sizes — path only (use with `api.get(...)`). */

export const sizesPath = "/api/sizes";



/** Colors — path only (use with `api.get(...)`). */

export const colorsPath = "/api/colors";



/** Gender — path only (use with `api.get(...)`). */

export const genderPath = "/api/gender";



/** Prices — path only (use with `api.get(...)`). */

export const pricesPath = "/api/prices";



/** Rating — path only (use with `api.get(...)`). */

export const ratingPath = "/api/rating";



// ===== PRODUCT FILTER API FUNCTIONS =====



// Enhanced Filter API Functions

/** Get filter options for categories, colors, sizes, genders, etc. */
export const getFilterOptions = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await api.get('/api/filters', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    throw error;
  }
};

/** Enhanced product filtering with all filter parameters */
export const filterProductsEnhanced = async (filters: any) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    // Build filter payload
    const filterPayload = {
      categoryIds: filters.categoryIds || [],
      subcategoryIds: filters.subcategoryIds || [],
      genders: filters.genders || [],
      colorIds: filters.colorIds || [],
      colorNames: filters.colorNames || [],
      sizeIds: filters.sizeIds || [],
      sizeNames: filters.sizeNames || [],
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      selectedPriceRanges: filters.selectedPriceRanges || [],
      minRating: filters.minRating,
      inStock: filters.inStock,
      sellerId: filters.sellerId,
      keyword: filters.keyword || '',
      sort: filters.sort || 'relevance',
      page: filters.page || 0,
      size: filters.size || 20,
    };
    
    const response = await api.post('/api/products/filter', filterPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return {
      products: response.data.content || [],
      totalElements: response.data.totalElements || 0,
      totalPages: response.data.totalPages || 0,
      currentPage: response.data.number || 0,
    };
  } catch (error) {
    console.error('Failed to filter products:', error);
    throw error;
  }
};

/** Filter products by price range */

export const filterProductsByPriceRange = async (

  minPrice?: number,

  maxPrice?: number,

  page?: number,

  size?: number,

  sortBy?: string,

  sortDirection?: string

) => {

  const params = new URLSearchParams();

  if (minPrice !== undefined) params.append('minPrice', minPrice.toString());

  if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());

  if (page !== undefined) params.append('page', page.toString());

  if (size !== undefined) params.append('size', size.toString());

  if (sortBy) params.append('sortBy', sortBy);

  if (sortDirection) params.append('sortDirection', sortDirection);



  const response = await api.get(`/api/products/filter/price-range?${params.toString()}`);

  return response.data;

};



/** Filter products by rating */

export const filterProductsByRating = async (

  minRating?: number,

  page?: number,

  size?: number,

  sortBy?: string,

  sortDirection?: string

) => {

  const params = new URLSearchParams();

  if (minRating !== undefined) params.append('minRating', minRating.toString());

  if (page !== undefined) params.append('page', page.toString());

  if (size !== undefined) params.append('size', size.toString());

  if (sortBy) params.append('sortBy', sortBy);

  if (sortDirection) params.append('sortDirection', sortDirection);



  const response = await api.get(`/api/products/filter/rating?${params.toString()}`);

  return response.data;

};



/** Filter products by price and rating combined */

export const filterProductsByPriceAndRating = async (

  minPrice?: number,

  maxPrice?: number,

  minRating?: number,

  page?: number,

  size?: number,

  sortBy?: string,

  sortDirection?: string

) => {

  const params = new URLSearchParams();

  if (minPrice !== undefined) params.append('minPrice', minPrice.toString());

  if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());

  if (minRating !== undefined) params.append('minRating', minRating.toString());

  if (page !== undefined) params.append('page', page.toString());

  if (size !== undefined) params.append('size', size.toString());

  if (sortBy) params.append('sortBy', sortBy);

  if (sortDirection) params.append('sortDirection', sortDirection);



  const response = await api.get(`/api/products/filter/price-rating?${params.toString()}`);

  return response.data;

};



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



// ===== OTP API FUNCTIONS (using localhost:8080) =====



export interface LoginResponse {

  success: boolean;

  message?: string;

  token?: string;

  role?: string;

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

 * Send OTP to email for verification - uses http://localhost:8080

 */

export const sendOtp = async (otpData: SendOtpRequest): Promise<OtpResponse> => {

  try {

    console.log("Sending OTP request to:", AUTH_BASE_URL + "/auth/send-otp", "with email:", otpData.email);

    const data = await postAuthWithFallback<OtpResponse>("/auth/send-otp", otpData);

    console.log("OTP response:", data);

    return data;

  } catch (error: any) {

    console.error("Send OTP failed:", error.message, error.code);

    if (error.code === "ERR_NETWORK") {

      throw new Error("Cannot connect to server. Please check your internet connection or try again later.");

    }

    throw error;

  }

};



/**

 * Verify OTP for email - uses http://localhost:8080

 */

export const verifyOtp = async (otpData: OtpRequest): Promise<LoginResponse> => {

  try {

    console.log("Verifying OTP at:", AUTH_BASE_URL + "/auth/verify-otp");

    const data = await postAuthWithFallback<LoginResponse>("/auth/verify-otp", otpData);

    console.log("Verify OTP response:", data);

    return data;

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



// ===== ORDER PLACING API FUNCTIONS =====



export interface PlaceOrderRequest {

  addressId: number;

  paymentMethod: string;

  orderNotes?: string;

  couponCode?: string;

  useWallet?: boolean;

  walletAmount?: number;

  razorpayOrderId?: string;

}



export interface PlaceOrderResponse {

  orderId: number;

  orderNumber: string;

  message: string;

}



/**

 * Place a new order

 */

export const placeOrder = async (orderData: PlaceOrderRequest): Promise<PlaceOrderResponse> => {

  console.log("Place order request data:", JSON.stringify(orderData, null, 2));

  

  try {

    const response = await api.post<ApiResponse<PlaceOrderResponse>>("/api/orders/place", orderData);

    console.log("Place order API response:", response.data);

    

    if (!response.data?.success) {

      throw new Error(response.data.message || "Failed to place order");

    }

    

    if (!response.data.data?.orderId) {

      throw new Error("Order placed but no order ID returned");

    }

    

    return response.data.data;

  } catch (error: any) {

    console.error("Place order API error:", error);

    console.error("Error response data:", error.response?.data);

    console.error("Error status:", error.response?.status);

    console.error("Error headers:", error.response?.headers);

    

    // Extract backend error message if available

    if (error.response?.data?.message) {

      throw new Error(error.response.data.message);

    }

    

    throw error;

  }

};



// ===== PAYMENT API FUNCTIONS =====



export interface CreatePaymentOrderRequest {

  amount: number;

}



export interface CreatePaymentOrderResponse {

  success: boolean;

  message: string;

  data: {

    id: string;

    entity: string;

    amount: number;

    currency: string;

    status: string;

    razorpayKeyId: string;

  };

}



export interface VerifyPaymentRequest {

  orderId: string;

  paymentId: string;

  signature: string;

}



export interface VerifyPaymentResponse {

  success: boolean;

  message: string;

  shipping_initiated?: boolean;

  order_number?: string;

  shiprocket?: any;

}



/**

 * Create Razorpay payment order

 */

export const createPaymentOrder = async (requestData: CreatePaymentOrderRequest): Promise<CreatePaymentOrderResponse> => {

  const response = await api.post("/api/payment/create-order", requestData);

  return response.data;

};



/**

 * Verify Razorpay payment

 */

export const verifyPayment = async (verifyData: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {

  const response = await api.post("/api/payment/verify", null, {

    params: verifyData,

  });

  return response.data;

};



// ===== REVIEW API FUNCTIONS =====



export interface CreateReviewRequest {

  productId: number;

  orderId: number;

  rating: number;

  comment: string;

}



export interface ReviewResponse {

  id: number;

  productId: number;

  orderId: number;

  rating: number;

  comment: string;

  status: boolean;

  createdAt: string;

}



/**

 * Create a product review

 */

export const createReview = async (reviewData: CreateReviewRequest): Promise<ReviewResponse> => {

  const response = await api.post("/api/reviews", reviewData);

  return response.data;

};



/**

 * Get reviews for a product

 */

export const getProductReviews = async (productId: number): Promise<ReviewResponse[]> => {

  const response = await api.get(`/api/reviews/product/${productId}`);

  return response.data;

};



// ===== RETURN/EXCHANGE API FUNCTIONS =====



export interface CreateReturnRequest {

  orderId: number;

  reason: string;

  description: string;

  images?: string[];

}



export interface CreateExchangeRequest {

  orderId: number;

  reason: string;

  description: string;

  images?: string[];

  exchangeSize?: string;

  exchangeColor?: string;

}



/**

 * Create a return request

 */

export const createReturn = async (returnData: CreateReturnRequest) => {

  const response = await api.post("/api/returns", returnData);

  return response.data;

};



/**

 * Create an exchange request

 */

export const createExchange = async (exchangeData: CreateExchangeRequest) => {

  const response = await api.post("/api/exchanges", exchangeData);

  return response.data;

};



/**

 * Get user's return requests

 */

export const getUserReturns = async () => {

  const response = await api.get("/api/returns");

  return response.data;

};



/**

 * Get user's exchange requests

 */

export const getUserExchanges = async () => {

  const response = await api.get("/api/exchanges");

  return response.data;

};



// ===== PAYMENT RETRY FUNCTIONS =====



export interface RetryPaymentRequest {

  orderId: number;

}



export interface VerifyRetryPaymentRequest {

  orderId: number;

  paymentId?: string;

  razorpayOrderId?: string;

  razorpayPaymentId?: string;

  razorpaySignature?: string;

}



/**

 * Retry failed payment for an order

 */

export const retryPayment = async (retryData: RetryPaymentRequest) => {

  const response = await api.post("/api/orders/retry-payment", retryData);

  return response.data;

};



/**

 * Verify retry payment

 */

export const verifyRetryPayment = async (verifyData: VerifyRetryPaymentRequest) => {

  const response = await api.post("/api/orders/verify-retry-payment", verifyData);

  return response.data;

};



// ===== INVOICE API FUNCTIONS =====



export interface CreateInvoiceRequest {

  orderId: number;

}



/**

 * Generate invoice for an order

 */

export const createInvoice = async (invoiceData: CreateInvoiceRequest) => {

  const response = await api.post("/api/invoices", invoiceData);

  return response.data;

};



// ===== REFERRAL API FUNCTIONS =====

export interface ReferralDashboardResponse {
  referralCode: string;
  confirmedReferrals: number;
  requiredReferrals: number;
  rewardUnlocked: boolean;
  alreadyUsedReferral: boolean;
}

export interface ApplyReferralRequest {
  referralCode: string;
}

export interface ApplyReferralResponse {
  success: boolean;
  message: string;
}

export interface ShareResponse {
  message: string;
  shareLink: string;
}

/**
 * Get referral dashboard data
 */
export const getReferralDashboard = async (): Promise<ReferralDashboardResponse> => {
  const response = await api.get("/api/referral/dashboard");
  return response.data;
};

/**
 * Apply a referral code
 */
export const applyReferralCode = async (referralData: ApplyReferralRequest): Promise<ApplyReferralResponse> => {
  const response = await api.post("/api/referral/apply", referralData);
  return response.data;
};

/**
 * Get share data for referral
 */
export const getReferralShareData = async (): Promise<ShareResponse> => {
  const response = await api.get("/api/referral/share");
  return response.data;
};

/**
 * Refresh referral code (deprecated - kept for compatibility)
 */
export const refreshReferralCode = async (): Promise<string> => {
  const response = await api.post("/api/referral/refresh");
  return response.data;
};


export default api;
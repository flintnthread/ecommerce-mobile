/**
 * Server cart (JWT): GET list, POST add, PUT quantity delta, DELETE line / clear.
 * When not signed in, callers should fall back to `shopStorage` local cart.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, {
  CART_ADD_PATH,
  CART_CLEAR_PATH,
  CART_COUNT_PATH,
  CART_PATH,
  cartItemPath,
  variantStockPath,
} from "../services/api";
import { addProductToCart, loadCart } from "./shopStorage";

export type ApiCartPriceSummary = {
  deliveryCharge: number;
  discount: number;
  finalTotal: number;
  subtotal: number;
};

export type ApiCartItem = {
  itemId: number;
  productId: number;
  variantId: number;
  name: string;
  productName?: string | null;
  quantity: number;
  stock?: number;
  /** Available stock from backend (preferred over stock). */
  availableStock?: number;
  /** Flag indicating if item is out of stock. */
  outOfStock?: boolean;
  /** Unit selling price (API may also send `sellingPrice`). */
  price: number;
  /** Unit MRP / list price (API may also send `mrpPrice`). */
  originalPrice: number;
  /** Explicit unit selling from GET /cart (preferred when present). */
  sellingPrice?: number;
  /** Explicit unit MRP from GET /cart (preferred when present). */
  mrpPrice?: number;
  total: number;
  size?: string | null;
  /** Resolved display color name from API. */
  color?: string | null;
  imageUrl?: string | null;
};

export type ServerCartBundle = {
  items: ApiCartItem[];
  priceSummary: ApiCartPriceSummary | null;
  couponApplied: unknown;
  /** Distinct product count (unique products), not total quantity. */
  productCount?: number;
};

function numLike(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "object" && v !== null && "value" in (v as object)) {
    const inner = (v as { value?: unknown }).value;
    if (typeof inner === "string" || typeof inner === "number") {
      return numLike(inner);
    }
  }
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function scalarToTrimmedString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(Math.trunc(v));
  }
  return null;
}

function resolveCartImageUrl(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const base = String(api.defaults.baseURL ?? "").replace(/\/+$/, "");
  if (!base) return value;
  return `${base}/${value.replace(/^\/+/, "")}`;
}

function parseCartItem(raw: unknown): ApiCartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const itemId = Math.floor(Number(o.itemId));
  const productId = Math.floor(Number(o.productId));
  const variantId = Math.floor(Number(o.variantId));
  if (!Number.isFinite(itemId) || itemId <= 0) return null;
  if (!Number.isFinite(productId) || productId <= 0) return null;
  if (!Number.isFinite(variantId) || variantId <= 0) return null;
  const productNameStr = scalarToTrimmedString(o.productName);
  const nameStr = scalarToTrimmedString(o.name);
  const name =
    productNameStr ??
    nameStr ??
    `Product ${productId}`;
  const sellingExplicit = numLike(o.sellingPrice);
  const mrpExplicit = numLike(o.mrpPrice);
  const priceLegacy = numLike(o.price);
  const originalLegacy = numLike(o.originalPrice);
  const unitSelling = sellingExplicit > 0 ? sellingExplicit : priceLegacy;
  const unitMrp = mrpExplicit > 0 ? mrpExplicit : originalLegacy;
  // Try multiple possible field names for stock (different APIs use different names).
  // Important: do NOT default to 0 when stock is missing/unknown (that reads as "out of stock").
  const stockCandidate =
    (o as any).availableStock ??
    (o as any).available_stock ??
    (o as any).availableQty ??
    (o as any).available_qty ??
    (o as any).quantityAvailable ??
    (o as any).quantity_available ??
    (o as any).availableQuantity ??
    (o as any).available_quantity ??
    (o as any).stockQuantity ??
    (o as any).stock_quantity ??
    (o as any).stockQty ??
    (o as any).stock_qty ??
    (o as any).inventory ??
    (o as any).inventoryQuantity ??
    (o as any).inventory_quantity ??
    (o as any).stock;
  const stockNum = stockCandidate == null ? NaN : Math.floor(Number(stockCandidate));
  const stock = Number.isFinite(stockNum) && stockNum >= 0 ? stockNum : undefined;

  const outOfStockRaw =
    (o as any).outOfStock ??
    (o as any).out_of_stock ??
    (o as any).isOutOfStock ??
    (o as any).is_out_of_stock;
  const outOfStock = typeof outOfStockRaw === "boolean" ? outOfStockRaw : undefined;

  return {
    itemId,
    productId,
    variantId,
    name,
    productName: productNameStr ?? nameStr ?? null,
    quantity: Math.max(0, Math.floor(Number(o.quantity) || 0)),
    stock,
    availableStock: stock,
    outOfStock,
    sellingPrice: sellingExplicit > 0 ? sellingExplicit : undefined,
    mrpPrice: mrpExplicit > 0 ? mrpExplicit : undefined,
    price: unitSelling,
    originalPrice: unitMrp,
    total: numLike(o.total),
    size: scalarToTrimmedString(o.size),
    color:
      scalarToTrimmedString(o.colorName) ??
      scalarToTrimmedString(o.color),
    imageUrl: resolveCartImageUrl(o.imageUrl),
  };
}

function parsePriceSummary(raw: unknown): ApiCartPriceSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    deliveryCharge: numLike(o.deliveryCharge),
    discount: numLike(o.discount),
    finalTotal: numLike(o.finalTotal),
    subtotal: numLike(o.subtotal),
  };
}

/** Unwraps `{ success, data: { items, priceSummary } }` or raw `data` object. */
export function normalizeServerCartPayload(payload: unknown): ServerCartBundle | null {
  if (payload == null) return null;
  let root: unknown = payload;
  if (typeof payload === "object" && !Array.isArray(payload)) {
    const o = payload as Record<string, unknown>;
    if (o.data != null && typeof o.data === "object") root = o.data;
  }
  if (!root || typeof root !== "object" || Array.isArray(root)) return null;
  const d = root as Record<string, unknown>;
  const itemsRaw = d.items;
  const items: ApiCartItem[] = [];
  if (Array.isArray(itemsRaw)) {
    for (const row of itemsRaw) {
      const it = parseCartItem(row);
      if (it) items.push(it);
    }
  }
  return {
    items,
    priceSummary: parsePriceSummary(d.priceSummary),
    couponApplied: d.couponApplied ?? null,
  };
}

export function parseCartApiError(e: unknown, fallback: string): string {
  const ax = e as { response?: { data?: unknown } };
  const d = ax.response?.data;
  if (typeof d === "string" && d.trim()) return d.trim();
  if (d && typeof d === "object") {
    const m = (d as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return fallback;
}

export async function fetchServerCartBundle(): Promise<ServerCartBundle | null> {
  const token = (await AsyncStorage.getItem("token"))?.trim();
  if (!token) return null;
  try {
    const { data } = await api.get<unknown>(CART_PATH);
    // Debug: Log first item to see stock field names
    if (data && typeof data === "object") {
      const items = (data as any).items || (data as any).data || (data as any).cartItems;
      if (Array.isArray(items) && items.length > 0) {
        console.log("[Cart API] First item raw:", JSON.stringify(items[0], null, 2));
        console.log("[Cart API] Stock fields found:", {
          stock: items[0].stock,
          availableStock: items[0].availableStock,
          inventory: items[0].inventory,
          quantityAvailable: items[0].quantityAvailable,
          availableQuantity: items[0].availableQuantity,
          inStock: items[0].inStock,
          stockQuantity: items[0].stockQuantity,
        });
      }
    }
    return normalizeServerCartPayload(data);
  } catch {
    return null;
  }
}

export async function serverCartContainsVariant(
  productId: number,
  variantId: number
): Promise<boolean> {
  const bundle = await fetchServerCartBundle();
  if (!bundle) return false;
  const pid = Math.floor(productId);
  const vid = Math.floor(variantId);
  return bundle.items.some(
    (i) => i.productId === pid && i.variantId === vid && i.quantity > 0
  );
}

/** Distinct product count for header badges; local cart if guest. */
export async function getCartUnitCount(): Promise<number> {
  const token = (await AsyncStorage.getItem("token"))?.trim();
  if (!token) {
    const cart = await loadCart();
    // Count distinct products (unique productIds), not total quantity
    const distinctProducts = new Set(cart.map((l) => l.id).filter(Boolean));
    return distinctProducts.size;
  }

  // Fetch distinct product count from backend
  try {
    const resp = await api.get<{ success: boolean; data: number }>(CART_COUNT_PATH);
    if (resp.data?.success && typeof resp.data.data === "number") {
      return Math.max(0, resp.data.data);
    }
  } catch {
    // Fallback to calculating from bundle if count endpoint fails
  }

  // Fallback: calculate from cart bundle
  const bundle = await fetchServerCartBundle();
  if (!bundle) {
    const cart = await loadCart();
    const distinctProducts = new Set(cart.map((l) => l.id).filter(Boolean));
    return distinctProducts.size;
  }

  // Count distinct productIds from server cart items
  const distinctProductIds = new Set(bundle.items.map((i) => i.productId).filter((id) => id > 0));
  return distinctProductIds.size;
}

export type CartAddResult =
  | { ok: true; cart?: ServerCartBundle }
  | { ok: false; message: string; stock?: number };

export async function postCartAdd(
  productId: number,
  variantId: number,
  quantity = 1
): Promise<CartAddResult> {
  const pid = Math.floor(productId);
  const vid = Math.floor(variantId);
  const q = Math.max(1, Math.floor(quantity));

  try {
    const resp = await api.post<{
      success: boolean;
      message?: string;
      data?: ServerCartBundle;
    }>(CART_ADD_PATH, {
      productId: pid,
      variantId: vid,
      quantity: q,
    });

    if (resp.data?.success) {
      return { ok: true, cart: resp.data.data };
    }

    // Extract stock from message like "Only 1 items available in stock"
    const msg = resp.data?.message || "Could not add to cart";
    const stockMatch = msg.match(/Only\s+(\d+)\s+items?\s+available/i);
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : undefined;

    return { ok: false, message: msg, stock };
  } catch (e: unknown) {
    const msg = parseCartApiError(e, "Could not add to cart");
    // Extract stock from error message
    const stockMatch = msg.match(/Only\s+(\d+)\s+items?\s+available/i);
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : undefined;
    return { ok: false, message: msg, stock };
  }
}

/** Backend uses signed delta, e.g. `+1` / `-1`. */
export async function putCartItemQuantityDelta(
  itemId: number,
  delta: number
): Promise<void> {
  const id = Math.floor(itemId);
  const raw = Math.floor(delta);
  const q = raw > 0 ? 1 : raw < 0 ? -1 : 0;
  if (!Number.isFinite(id) || id <= 0) throw new Error("Invalid cart item");
  if (!Number.isFinite(q) || q === 0) return;
  await api.put(cartItemPath(id), undefined, { params: { quantity: q } });
}

export async function deleteCartLineServer(itemId: number): Promise<void> {
  const id = Math.floor(itemId);
  if (!Number.isFinite(id) || id <= 0) return;
  await api.delete(cartItemPath(id));
}

export async function deleteCartClearServer(): Promise<void> {
  await api.delete(CART_CLEAR_PATH);
}

/**
 * When logged in with valid `productId` + `variantId`, POST `/api/cart/add`.
 * Otherwise append one unit to local AsyncStorage cart.
 */
export type CartAddWithStockResult =
  | { ok: true }
  | { ok: false; message: string; stock?: number };

export async function addToCartPtbOrLocal(input: {
  productId: number;
  variantId?: number;
  quantity?: number;
  localLine: { id: string; name: string; price: number; mrp: number };
}): Promise<CartAddWithStockResult> {
  const token = (await AsyncStorage.getItem("token"))?.trim();
  const pid = Math.floor(input.productId);
  const vid =
    input.variantId != null ? Math.floor(input.variantId) : NaN;
  if (token && pid > 0 && Number.isFinite(vid) && vid > 0) {
    const result: CartAddResult = await postCartAdd(pid, vid, input.quantity ?? 1);
    if (!result.ok) {
      const errorResult = result as { ok: false; message: string; stock?: number };
      return {
        ok: false,
        message: errorResult.message,
        stock: errorResult.stock,
      };
    }
    return { ok: true };
  }
  try {
    await addProductToCart({
      id: input.localLine.id,
      name: input.localLine.name,
      price: input.localLine.price,
      mrp: input.localLine.mrp,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not update cart." };
  }
}

/** Fetch real-time stock for a specific variant. */
export async function fetchVariantStock(variantId: number): Promise<{ stock: number; message?: string } | null> {
  const id = Math.floor(variantId);
  if (!Number.isFinite(id) || id <= 0) return null;

  try {
    const resp = await api.get<{
      variantId: number;
      stock: number;
      message?: string;
    }>(variantStockPath(id));

    if (resp.data && typeof resp.data.stock === "number") {
      return {
        stock: Math.max(0, resp.data.stock),
        message: resp.data.message,
      };
    }
    return null;
  } catch {
    return null;
  }
}

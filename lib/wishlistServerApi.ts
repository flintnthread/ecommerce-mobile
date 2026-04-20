/**
 * Server wishlist: GET list, POST add (with optional userId), DELETE remove.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, {
  WISHLIST_ADD_PATH,
  WISHLIST_REMOVE_PATH,
  WISHLIST_USER_PATH,
} from "../services/api";
import { normalizeWishlistApiRows } from "./wishlistApi";
import {
  addWishlistProductIfAbsent,
  removeWishlistLine,
  toggleWishlistProduct,
} from "./shopStorage";

const ASYNC_USER_ID_KEYS = ["userId", "id"] as const;

function extractSpringLongUserIdSegment(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^\{[^}]+\}$/.test(s)) return null;
  if (!/^\d+$/.test(s)) return null;
  return s;
}

export async function readNumericUserIdFromStorage(): Promise<string | null> {
  for (const key of ASYNC_USER_ID_KEYS) {
    const seg = extractSpringLongUserIdSegment(
      (await AsyncStorage.getItem(key)) ?? undefined
    );
    if (seg) return seg;
  }
  return null;
}

export function wishlistVariantKey(productId: number, variantId: number): string {
  return `${Math.floor(productId)}-${Math.floor(variantId)}`;
}

/** Heart state for PTB grids: server keys when signed in + variant id, else local product id set. */
export function categoryPtbRowWishlisted(
  product: { id: string; variantId?: number },
  hasAuth: boolean,
  serverKeys: Set<string>,
  localIds: Set<string>
): boolean {
  const pid = Math.floor(Number(product.id));
  const vid = product.variantId;
  if (hasAuth && vid != null && vid > 0 && Number.isFinite(pid) && pid > 0) {
    return serverKeys.has(wishlistVariantKey(pid, vid));
  }
  return localIds.has(product.id);
}

export async function fetchWishlistServerKeySet(): Promise<Set<string>> {
  const token = (await AsyncStorage.getItem("token"))?.trim();
  if (!token) return new Set();
  try {
    const { data } = await api.get<unknown>(WISHLIST_USER_PATH);
    const rows = normalizeWishlistApiRows(data);
    const s = new Set<string>();
    for (const r of rows) {
      const pid = Math.floor(Number(r.productId));
      const vid = Math.floor(Number(r.variantId));
      if (Number.isFinite(pid) && pid > 0 && Number.isFinite(vid) && vid > 0) {
        s.add(wishlistVariantKey(pid, vid));
      }
    }
    return s;
  } catch {
    return new Set();
  }
}

export type WishlistAddBody = {
  userId?: number;
  productId: number;
  variantId: number;
};

export async function buildWishlistAddBody(
  productId: number,
  variantId: number
): Promise<WishlistAddBody> {
  const uidSeg = await readNumericUserIdFromStorage();
  const userIdNum = uidSeg ? Math.floor(Number(uidSeg)) : NaN;
  const body: WishlistAddBody = {
    productId: Math.floor(productId),
    variantId: Math.floor(variantId),
  };
  if (Number.isFinite(userIdNum) && userIdNum > 0) {
    body.userId = userIdNum;
  }
  return body;
}

export async function postWishlistAdd(
  productId: number,
  variantId: number
): Promise<{ productName?: string }> {
  const body = await buildWishlistAddBody(productId, variantId);
  const { data } = await api.post<{ productName?: string | null }>(
    WISHLIST_ADD_PATH,
    body
  );
  const name =
    typeof data?.productName === "string" ? data.productName.trim() : "";
  return { productName: name || undefined };
}

export async function deleteWishlistItem(
  productId: number,
  variantId: number
): Promise<void> {
  await api.delete(WISHLIST_REMOVE_PATH, {
    params: {
      productId: Math.floor(productId),
      variantId: Math.floor(variantId),
    },
  });
}

export function parseWishlistApiError(e: unknown, fallback: string): string {
  const ax = e as { response?: { data?: unknown } };
  const d = ax.response?.data;
  if (typeof d === "string" && d.trim()) return d.trim();
  if (d && typeof d === "object") {
    const m = (d as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m.trim();
  }
  return fallback;
}

export type PtbWishlistProductInput = {
  id: string;
  name: string;
  sellingNum: number;
  mrpNum: number;
  variantId?: number;
};

/**
 * PTB grid wishlist: POST/DELETE with `variantId` when signed in and ids are valid;
 * otherwise local `toggleWishlistProduct`. Call `reload` after to refresh UI sets.
 */
export async function togglePtbWishlistWithServer(
  product: PtbWishlistProductInput,
  reload: () => Promise<void>
): Promise<
  | { ok: true; title: string; body: string }
  | { ok: false; message: string }
> {
  const token = (await AsyncStorage.getItem("token"))?.trim();
  const pid = Math.floor(Number(product.id));
  const vid = product.variantId;
  if (token && Number.isFinite(pid) && pid > 0 && vid != null && vid > 0) {
    const keys = await fetchWishlistServerKeySet();
    const key = wishlistVariantKey(pid, vid);
    try {
      if (keys.has(key)) {
        await deleteWishlistItem(pid, vid);
        await removeWishlistLine(String(pid));
        await reload();
        return { ok: true, title: "Removed from wishlist", body: product.name };
      }
      await postWishlistAdd(pid, vid);
      await addWishlistProductIfAbsent({
        id: String(pid),
        name: product.name,
        price: product.sellingNum,
        mrp: product.mrpNum,
      });
      await reload();
      return { ok: true, title: "Added to wishlist", body: product.name };
    } catch (e: unknown) {
      return {
        ok: false,
        message: parseWishlistApiError(
          e,
          "Wishlist could not be updated. Please try again."
        ),
      };
    }
  }
  const nowIn = await toggleWishlistProduct({
    id: product.id,
    name: product.name,
    price: product.sellingNum,
    mrp: product.mrpNum,
  });
  await reload();
  return {
    ok: true,
    title: nowIn ? "Added to wishlist" : "Removed from wishlist",
    body: product.name,
  };
}

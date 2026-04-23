/**
 * Shared helpers for GET `/api/wishlist/user` response parsing (Spring list or wrapped payloads).
 */

export type ApiWishlistImage = {
  imageUrl?: string | null;
  imagePath?: string | null;
};

export type ApiWishlistRow = {
  wishlistId?: number | string | null;
  productId?: number | string | null;
  variantId?: number | string | null;
  productName?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  images?: ApiWishlistImage[] | null;
  sellingPrice?: number | string | null;
  mrpPrice?: number | string | null;
  addedAt?: string | null;
  inStock?: boolean | null;
  size?: string | null;
  color?: string | null;
};

export function firstWishlistRowImageUri(row: ApiWishlistRow): string {
  const imgs = Array.isArray(row.images) ? row.images : [];
  for (const im of imgs) {
    if (!im || typeof im !== "object") continue;
    const u = String(im.imageUrl ?? im.imagePath ?? "").trim();
    if (u) return u;
  }
  return String(row.imageUrl ?? row.image ?? "").trim();
}

/** Spring returns a JSON array; some gateways wrap the body. */
export function normalizeWishlistApiRows(payload: unknown): ApiWishlistRow[] {
  if (Array.isArray(payload)) return payload as ApiWishlistRow[];
  if (payload == null || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  for (const key of ["data", "items", "content", "wishlist", "wishlistItems"] as const) {
    const v = o[key];
    if (Array.isArray(v)) return v as ApiWishlistRow[];
  }
  const inner = o.data;
  if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
    return normalizeWishlistApiRows(inner);
  }
  return [];
}

export function numLike(v: unknown): number {
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

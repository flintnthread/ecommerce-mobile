/**
 * Shared helpers for “PTB” (product tile block) grids fed by main-category product APIs.
 * Used by sweets, women, gifts, indoorplay screens.
 */
import api from "../services/api";
import { pickProductImageUriFromApi } from "./pickProductImageUri";

export type MainCategoryApiRowPtb = {
  id?: number;
  categoryName?: string | null;
  status?: number | null;
  image?: string | null;
  mobileImage?: string | null;
  bannerImage?: string | null;
};

function getAssetUriFromApiPath(pathOrUrl: string): string {
  const raw = String(pathOrUrl ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  if (!apiBase) return raw;
  return `${apiBase}/${raw.replace(/^\/+/, "")}`;
}

/** Normalize category names for fuzzy matching (lowercase, strip punctuation). */
export function normalizeMainCategoryName(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/** Primary product image URI for PTB cards; empty string if none. */
export function pickPtbProductImageUri(p: unknown): string {
  const uri = pickProductImageUriFromApi(p as any, getAssetUriFromApiPath);
  return uri ?? "";
}

function numLike(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function pickPtbVariantPricing(p: unknown): {
  sellingPrice: number;
  mrpPrice: number;
  discountPercentage: number;
  /** Backend `ProductVariantDTO.id` for POST `/api/wishlist/add`. */
  variantId?: number;
} {
  const o = p as Record<string, any>;
  const variants = Array.isArray(o?.variants) ? o.variants : [];
  const v =
    variants.find((x: any) => x && x.inStock === true) ?? variants[0];
  const selling = numLike(
    v?.sellingPrice ?? v?.finalPrice ?? o?.sellingPrice ?? o?.salePrice ?? o?.price
  );
  const mrpRaw = numLike(v?.mrpPrice ?? o?.mrp ?? o?.maxRetailPrice);
  const mrp = mrpRaw > 0 ? mrpRaw : selling;
  const discountPct = numLike(v?.discountPercentage ?? o?.discountPercentage);
  const rawVid = v?.id ?? v?.variantId;
  const vidNum =
    typeof rawVid === "string"
      ? Number.parseInt(rawVid, 10)
      : Number(rawVid);
  const variantId =
    Number.isFinite(vidNum) && vidNum > 0 ? Math.floor(vidNum) : undefined;
  return {
    sellingPrice: Math.max(0, Math.round(selling)),
    mrpPrice: Math.max(Math.round(selling), Math.round(mrp)),
    discountPercentage: discountPct,
    ...(variantId != null ? { variantId } : {}),
  };
}

/** Strip HTML / entities from API titles for UI. */
export function safePtbText(raw: string): string {
  let s = String(raw ?? "");
  s = s.replace(/<[^>]*>/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  const out = s.trim();
  return out.length > 0 ? out : "Product";
}

export function pickPtbProductRating(p: unknown): string {
  const o = p as Record<string, any>;
  const r =
    o?.rating ??
    o?.averageRating ??
    o?.average_rating ??
    o?.reviewRating ??
    o?.review_rating;
  if (typeof r === "number" && Number.isFinite(r)) return r.toFixed(1);
  if (typeof r === "string") {
    const n = parseFloat(r);
    return Number.isFinite(n) ? n.toFixed(1) : "—";
  }
  return "—";
}
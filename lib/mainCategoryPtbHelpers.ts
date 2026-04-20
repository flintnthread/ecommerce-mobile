/**
 * Shared helpers for main-category PLP screens (gifts, sweets, indoor play, women):
 * resolve category rows, product images, variants, ratings from Spring-style APIs.
 */

import api from "../services/api";
import {
  pickPrimaryProductImage,
  resolveProductPrimaryImageUri,
  type ApiProductImageRow,
} from "./productImage";

export type MainCategoryApiRowPtb = {
  id: number;
  categoryName?: string | null;
  status?: number | null;
};

export function normalizeMainCategoryName(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\u2019/g, "'");
}

export function safePtbText(raw: string): string {
  return String(raw ?? "")
    .replace(/\u0019/g, "'")
    .trim();
}

function resolveRelativePath(path: string): string {
  const root = String(api.defaults.baseURL ?? "").replace(/\/+$/, "");
  const s = String(path ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (!root) return s;
  return s.startsWith("/") ? `${root}${s}` : `${root}/${s}`;
}

export function pickPtbProductImageUri(product: unknown): string {
  if (!product || typeof product !== "object") return "";
  const p = product as Record<string, unknown>;
  const images = Array.isArray(p.images) ? p.images : [];
  const primary = pickPrimaryProductImage(images as ApiProductImageRow[]);
  const uri = resolveProductPrimaryImageUri(
    primary as ApiProductImageRow | undefined,
    resolveRelativePath
  );
  if (uri) return uri;
  const flat = String(
    p.imageUrl ?? p.image ?? p.mobileImage ?? p.thumbnail ?? ""
  ).trim();
  if (!flat) return "";
  if (/^https?:\/\//i.test(flat)) return flat;
  return resolveRelativePath(flat);
}

type VariantLike = {
  sellingPrice?: number | null;
  mrpPrice?: number | null;
  discountPercentage?: number | null;
  inStock?: boolean | null;
};

function pickPtbVariant(product: Record<string, unknown>): VariantLike | undefined {
  const vs = Array.isArray(product.variants)
    ? (product.variants as VariantLike[])
    : [];
  if (!vs.length) return undefined;
  return vs.find((v) => v && v.inStock === true) ?? vs[0];
}

export function pickPtbVariantPricing(product: unknown): {
  sellingPrice: number | null;
  mrpPrice: number | null;
  discountPercentage: number | null;
} {
  const empty = {
    sellingPrice: null as number | null,
    mrpPrice: null as number | null,
    discountPercentage: null as number | null,
  };
  if (!product || typeof product !== "object") return empty;
  const p = product as Record<string, unknown>;
  const v = pickPtbVariant(p);
  const selling = Number(
    v?.sellingPrice ?? p.salePrice ?? p.sellingPrice ?? p.price ?? 0
  );
  const mrp = Number(v?.mrpPrice ?? p.mrp ?? p.maxRetailPrice ?? 0);
  const discRaw =
    typeof v?.discountPercentage === "number"
      ? v.discountPercentage
      : typeof p.discountPercentage === "number"
        ? p.discountPercentage
        : NaN;
  const sellingOk =
    Number.isFinite(selling) && selling > 0 ? selling : null;
  const mrpOk =
    Number.isFinite(mrp) && mrp > 0 ? mrp : sellingOk;
  const discOk =
    Number.isFinite(discRaw) && discRaw >= 0 ? discRaw : null;
  return {
    sellingPrice: sellingOk,
    mrpPrice: mrpOk,
    discountPercentage: discOk,
  };
}

export function pickPtbProductRating(product: unknown): number | null {
  if (!product || typeof product !== "object") return null;
  const p = product as Record<string, unknown>;
  const r = p.rating ?? p.averageRating ?? p.avgRating;
  const n =
    typeof r === "string" ? Number.parseFloat(r.trim()) : Number(r);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

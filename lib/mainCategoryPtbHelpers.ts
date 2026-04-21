import api from "../services/api";
import { pickProductImageUriFromApi } from "./pickProductImageUri";

export type MainCategoryApiRowPtb = {
  id: number;
  categoryName: string;
  status?: number;
};

export function safePtbText(value: string): string {
  return value.replace(/\u0019/g, "'").trim();
}

export function getPtbAssetUriFromApiPath(pathOrUrl: string): string {
  const raw = String(pathOrUrl ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  if (!apiBase) return raw;
  return `${apiBase}/${raw.replace(/^\/+/, "")}`;
}

export function pickPtbProductImageUri(p: unknown): string | null {
  return pickProductImageUriFromApi(p as any, getPtbAssetUriFromApiPath);
}

export function pickPtbVariantPricing(p: unknown): {
  sellingPrice: number | null;
  mrpPrice: number | null;
  discountPercentage: number | null;
} {
  const o = p as { variants?: unknown[] };
  const variants = Array.isArray(o?.variants) ? o.variants : [];
  const v =
    variants.find(
      (x: any) =>
        x &&
        (typeof x.sellingPrice === "number" ||
          typeof x.mrpPrice === "number" ||
          typeof x.sellingPrice === "string" ||
          typeof x.mrpPrice === "string")
    ) ?? null;
  if (!v) return { sellingPrice: null, mrpPrice: null, discountPercentage: null };
  const num = (x: unknown): number | null => {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string") {
      const n = parseFloat(x);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  return {
    sellingPrice: num((v as any).sellingPrice),
    mrpPrice: num((v as any).mrpPrice),
    discountPercentage: num((v as any).discountPercentage),
  };
}

export function pickPtbProductRating(p: unknown): number | null {
  const o = p as Record<string, unknown>;
  const r =
    o?.rating ?? o?.averageRating ?? o?.average_rating ?? o?.reviewRating ?? o?.review_rating;
  if (typeof r === "number" && Number.isFinite(r)) return r;
  if (typeof r === "string") {
    const n = parseFloat(r);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeMainCategoryName(name: string): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ");
}

/** First variant id from a product payload (for `POST /api/wishlist/add`). */
export function pickPtbFirstVariantId(p: unknown): number | null {
  const variants = Array.isArray((p as { variants?: unknown[] })?.variants)
    ? ((p as { variants: unknown[] }).variants as unknown[])
    : [];
  const v =
    variants.find(
      (x: any) =>
        x &&
        (typeof x.sellingPrice === "number" ||
          typeof x.mrpPrice === "number" ||
          typeof x.sellingPrice === "string" ||
          typeof x.mrpPrice === "string")
    ) ?? variants[0];
  const id = (v as { id?: unknown })?.id;
  if (typeof id === "number" && Number.isFinite(id) && id > 0) return id;
  if (typeof id === "string") {
    const n = Number.parseInt(id, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.29:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ crucial for session/cookies
});

/** Hub category ids for `GET /api/categories/{id}/subcategories-table`. */
export const FOOTWEAR_WOMENS_CATEGORY_ID = 45;
export const FOOTWEAR_MENS_CATEGORY_ID = 44;
export const FOOTWEAR_KIDS_CATEGORY_ID = 46;

/** Sweets — `GET /api/categories/{id}/subcategories-table`. */
export const SWEETS_DRY_CATEGORY_ID = 55;
export const SWEETS_MILK_CATEGORY_ID = 56;

export type ApiSubcategoryRow = {
  id: number;
  name: string;
  image: string;
};

export type ApiSubcategoriesTableEntry = {
  categoryName: string;
  subcategories: ApiSubcategoryRow[];
};

const SUBCATEGORY_IMAGE_UPLOAD_PREFIX = "/uploads/subcategories/";

export function subcategoryTableImageUrl(fileName: string): string {
  const trimmed = (fileName || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = String(api.defaults.baseURL || "").replace(/\/$/, "");
  const path = SUBCATEGORY_IMAGE_UPLOAD_PREFIX.replace(/^\//, "");
  return `${base}/${path}${encodeURIComponent(trimmed)}`;
}

export async function fetchSubcategoriesTable(
  categoryId: number
): Promise<ApiSubcategoriesTableEntry[]> {
  const { data } = await api.get<ApiSubcategoriesTableEntry[]>(
    `/api/categories/${categoryId}/subcategories-table`
  );
  return Array.isArray(data) ? data : [];
}

export default api;

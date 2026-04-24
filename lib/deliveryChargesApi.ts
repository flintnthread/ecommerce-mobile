import api from "../services/api";

export type DeliveryChargeRow = {
  id: number;
  weightSlab: string;
  weightMin: number;
  weightMax: number;
  intraCityCharge: number;
  metroMetroCharge: number;
  isCustom: boolean;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function toNum(v: unknown): number {
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseRow(raw: unknown): DeliveryChargeRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Math.floor(Number(o.id));
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    id,
    weightSlab: String(o.weightSlab ?? "").trim(),
    weightMin: toNum(o.weightMin),
    weightMax: toNum(o.weightMax),
    intraCityCharge: toNum(o.intraCityCharge),
    metroMetroCharge: toNum(o.metroMetroCharge),
    isCustom: Boolean(o.isCustom),
    status: Boolean(o.status),
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
  };
}

export async function fetchDeliveryChargeRows(
  status?: boolean
): Promise<DeliveryChargeRow[]> {
  const { data } = await api.get<ApiResponse<unknown[]>>("/api/delivery-charges", {
    params: status == null ? undefined : { status },
  });
  const rowsRaw = Array.isArray(data?.data) ? data.data : [];
  const rows: DeliveryChargeRow[] = [];
  for (const raw of rowsRaw) {
    const row = parseRow(raw);
    if (row) rows.push(row);
  }
  return rows;
}

export async function fetchDeliveryChargeByWeight(weightKg: number): Promise<DeliveryChargeRow | null> {
  const safeWeight = Math.max(0, toNum(weightKg));
  const { data } = await api.get<ApiResponse<unknown>>("/api/delivery-charges/by-weight", {
    params: { weight: safeWeight },
  });
  return parseRow(data?.data);
}

/**
 * Uses active slabs from API and picks a deterministic default:
 * lowest-weight non-custom slab, then intra-city if present, else metro-metro.
 */
export function getDefaultDeliveryChargeFromRows(rows: DeliveryChargeRow[]): number {
  const active = rows.filter((r) => r.status);
  if (!active.length) return 0;
  const ordered = [...active].sort((a, b) => a.weightMin - b.weightMin);
  const base = ordered.find((r) => !r.isCustom) ?? ordered[0];
  const intra = toNum(base.intraCityCharge);
  const metro = toNum(base.metroMetroCharge);
  if (intra > 0) return intra;
  if (metro > 0) return metro;
  return Math.max(intra, metro, 0);
}

function pickRowByWeight(rows: DeliveryChargeRow[], weightKg: number): DeliveryChargeRow | null {
  const active = rows.filter((r) => r.status);
  if (!active.length) return null;
  const weight = Math.max(0, toNum(weightKg));
  const containing = active.filter((r) => weight >= r.weightMin && weight <= r.weightMax);
  if (!containing.length) {
    const ordered = [...active].sort((a, b) => a.weightMin - b.weightMin);
    return ordered[ordered.length - 1] ?? null;
  }
  // For boundary overlaps (for example 0.5), prefer the slab with higher lower-bound.
  const orderedContaining = [...containing].sort((a, b) => b.weightMin - a.weightMin);
  return orderedContaining[0] ?? null;
}

export function getDeliveryChargeByEstimatedItemCount(
  rows: DeliveryChargeRow[],
  itemCount: number
): number {
  // In current mobile flow, cart lines do not carry product weight.
  // We estimate total order weight from quantity so charge can change with item count.
  const ASSUMED_WEIGHT_PER_ITEM_KG = 0.5;
  const units = Math.max(1, Math.floor(Number(itemCount) || 1));
  const estimatedWeightKg = units * ASSUMED_WEIGHT_PER_ITEM_KG;
  const row = pickRowByWeight(rows, estimatedWeightKg);
  if (!row) return getDefaultDeliveryChargeFromRows(rows);
  const intra = toNum(row.intraCityCharge);
  const metro = toNum(row.metroMetroCharge);
  return intra > 0 ? intra : Math.max(intra, metro, 0);
}

export function estimateCartWeightKgFromItemCount(itemCount: number): number {
  // Current cart payload has no item-level weight; estimate until real weight is available.
  const ASSUMED_WEIGHT_PER_ITEM_KG = 0.5;
  const units = Math.max(1, Math.floor(Number(itemCount) || 1));
  return units * ASSUMED_WEIGHT_PER_ITEM_KG;
}

export function pickPreferredCharge(row: DeliveryChargeRow | null): number | null {
  if (!row) return null;
  const intra = toNum(row.intraCityCharge);
  const metro = toNum(row.metroMetroCharge);
  const preferred = intra > 0 ? intra : Math.max(intra, metro, 0);
  return preferred;
}

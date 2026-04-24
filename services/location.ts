import api from "./api";

export const CITIES_ENDPOINT = "/api/location/cities";
export const STATES_ENDPOINT = "/api/location/states";
export const COUNTRIES_ENDPOINT = "/api/location/countries";
export const PINCODES_ENDPOINT = "/api/location/pincodes";

export interface ApiCityRow {
  id: number;
  cityName: string;
  stateId: number;
  countryId: number;
  status: boolean;
  createdAt?: string;
}

export interface ApiStateRow {
  id: number;
  stateName: string;
  countryId: number;
  status: boolean;
  createdAt?: string;
}

export interface ApiCountryRow {
  id: number;
  countryName: string;
  status: boolean;
  createdAt?: string;
}

export interface ApiPincodeRow {
  id: number;
  countryId: number;
  stateId: number;
  cityId: number;
  areaId: number;
  pincode: string;
  status: boolean;
  createdAt?: string;
}

interface CitiesResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

interface StatesResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

interface CountriesResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

interface PincodesResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

export interface FetchCitiesParams {
  countryId?: number;
  stateId?: number;
  status?: boolean;
}

export interface FetchStatesParams {
  countryId?: number;
  status?: boolean;
}

export interface FetchCountriesParams {
  status?: boolean;
}

export interface FetchPincodesParams {
  countryId?: number;
  stateId?: number;
  cityId?: number;
  areaId?: number;
  status?: boolean;
}

function normalizePincode(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length === 6 ? digitsOnly : "";
}

export async function fetchCities(
  params: FetchCitiesParams = {}
): Promise<ApiCityRow[]> {
  const query: Record<string, number | boolean> = {};
  if (typeof params.stateId === "number" && Number.isFinite(params.stateId)) {
    query.stateId = params.stateId;
  }
  if (typeof params.countryId === "number" && Number.isFinite(params.countryId)) {
    query.countryId = params.countryId;
  }
  // Match backend contract: default to active cities (`status=true`).
  query.status = typeof params.status === "boolean" ? params.status : true;

  const { data } = await api.get<CitiesResponse>(CITIES_ENDPOINT, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  const typedRows = rows.filter((row): row is ApiCityRow => {
    if (!row || typeof row !== "object") return false;
    const city = row as Record<string, unknown>;
    return (
      typeof city.id === "number" &&
      typeof city.cityName === "string" &&
      typeof city.stateId === "number" &&
      typeof city.countryId === "number" &&
      (typeof city.status !== "boolean" || city.status)
    );
  });
  // Defensive client-side filter in case backend returns cross-country rows.
  if (typeof params.countryId === "number" && Number.isFinite(params.countryId)) {
    return typedRows.filter((row) => row.countryId === params.countryId);
  }
  return typedRows;
}

export async function fetchStates(
  params: FetchStatesParams = {}
): Promise<ApiStateRow[]> {
  const query: Record<string, number | boolean> = {};
  if (
    typeof params.countryId === "number" &&
    Number.isFinite(params.countryId)
  ) {
    query.countryId = params.countryId;
  }
  query.status = typeof params.status === "boolean" ? params.status : true;

  const { data } = await api.get<StatesResponse>(STATES_ENDPOINT, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  const typedRows = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const state = row as Record<string, unknown>;
      const rawName =
        (typeof state.stateName === "string" && state.stateName) ||
        (typeof state.name === "string" && state.name) ||
        "";
      if (
        typeof state.id !== "number" ||
        typeof state.countryId !== "number" ||
        !rawName.trim()
      ) {
        return null;
      }
      return {
        id: state.id,
        stateName: rawName.trim(),
        countryId: state.countryId,
        status: typeof state.status !== "boolean" ? true : state.status,
      } satisfies ApiStateRow;
    })
    .filter((row): row is ApiStateRow => Boolean(row && row.status));

  if (
    typeof params.countryId === "number" &&
    Number.isFinite(params.countryId)
  ) {
    return typedRows.filter((row) => row.countryId === params.countryId);
  }
  return typedRows;
}

export async function fetchCountries(
  params: FetchCountriesParams = {}
): Promise<ApiCountryRow[]> {
  const query: Record<string, boolean> = {};
  query.status = typeof params.status === "boolean" ? params.status : true;

  const { data } = await api.get<CountriesResponse>(COUNTRIES_ENDPOINT, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const country = row as Record<string, unknown>;
      const rawName =
        (typeof country.countryName === "string" && country.countryName) ||
        (typeof country.name === "string" && country.name) ||
        "";
      if (typeof country.id !== "number" || !rawName.trim()) return null;
      return {
        id: country.id,
        countryName: rawName.trim(),
        status: typeof country.status !== "boolean" ? true : country.status,
      } satisfies ApiCountryRow;
    })
    .filter((row): row is ApiCountryRow => Boolean(row && row.status));
}

export async function fetchPincodes(
  params: FetchPincodesParams = {}
): Promise<ApiPincodeRow[]> {
  const query: Record<string, number | boolean> = {};
  if (
    typeof params.countryId === "number" &&
    Number.isFinite(params.countryId)
  ) {
    query.countryId = params.countryId;
  }
  if (typeof params.stateId === "number" && Number.isFinite(params.stateId)) {
    query.stateId = params.stateId;
  }
  if (typeof params.cityId === "number" && Number.isFinite(params.cityId)) {
    query.cityId = params.cityId;
  }
  if (typeof params.areaId === "number" && Number.isFinite(params.areaId)) {
    query.areaId = params.areaId;
  }
  query.status = typeof params.status === "boolean" ? params.status : true;

  const { data } = await api.get<PincodesResponse>(PINCODES_ENDPOINT, {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const p = row as Record<string, unknown>;
      const rawPincodeSource =
        p.pincode ?? p.pinCode ?? p.postalCode ?? p.zipCode ?? p.zip;
      const rawPincode =
        typeof rawPincodeSource === "number"
          ? String(rawPincodeSource).trim()
          : typeof rawPincodeSource === "string"
          ? rawPincodeSource.trim()
          : "";
      const normalizedPincode = normalizePincode(rawPincode);
      const stateId = typeof p.stateId === "number" ? p.stateId : 0;
      const cityId = typeof p.cityId === "number" ? p.cityId : 0;
      const areaId = typeof p.areaId === "number" ? p.areaId : 0;
      if (
        typeof p.id !== "number" ||
        typeof p.countryId !== "number" ||
        !normalizedPincode
      ) {
        return null;
      }
      return {
        id: p.id,
        countryId: p.countryId,
        stateId,
        cityId,
        areaId,
        pincode: normalizedPincode,
        status: typeof p.status !== "boolean" ? true : p.status,
      } satisfies ApiPincodeRow;
    })
    .filter((row): row is ApiPincodeRow => Boolean(row && row.status));
}

export function toUniqueCityNames(rows: ApiCityRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const name = row.cityName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function toUniqueStateNames(rows: ApiStateRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const name = row.stateName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function toUniqueCountryNames(rows: ApiCountryRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const name = row.countryName.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function toUniquePincodes(rows: ApiPincodeRow[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const code = normalizePincode(row.pincode.trim());
    if (!code) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

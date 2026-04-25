import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  type ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, {
  mapSearchResultsToUi,
  productsBySubcategoryPath,
  type SearchUiResult,
  searchProductsPath,
  searchSuggestionsPath,
} from "../services/api";
import { pickProductImageUriFromApi } from "../lib/pickProductImageUri";
import { useLanguage } from "../lib/language";

type SearchSuggestionsResponse = {
  success?: boolean;
  message?: string;
  data?: string[];
};

type GridProduct = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  price: number;
  mrp: number;
  discount: string;
  rating: string;
  ratingCount: string;
  kind: "product" | "category";
};

const PLACEHOLDER = require("../assets/images/product1.png");
const SEARCH_SESSION_KEY = "ft_recent_view_session_id";

function formatInrAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function mapApiToGrid(rows: SearchUiResult[]): GridProduct[] {
  return rows.map((row) => {
    const price = Number(row.sellingPrice) > 0 ? Number(row.sellingPrice) : 0;
    const mrp = Number(row.mrpPrice) > 0 ? Number(row.mrpPrice) : price;
    const discount =
      row.discountPercentage > 0
        ? `${Math.round(row.discountPercentage)}% off`
        : mrp > price && mrp > 0
          ? `${Math.round(((mrp - price) / mrp) * 100)}% off`
          : "—";
    const isCategory = row.kind === "category";
    return {
      id: String(row.id),
      name: row.name,
      image: row.imageUri ? ({ uri: row.imageUri } as const) : PLACEHOLDER,
      price,
      mrp,
      discount,
      rating: isCategory ? "—" : "4.2",
      ratingCount: isCategory ? "Category" : "—",
      kind: row.kind,
    };
  });
}

function pickRowsFromProductListingPayload(payload: unknown): Record<string, any>[] {
  if (Array.isArray(payload)) return payload as Record<string, any>[];
  if (!payload || typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  if (Array.isArray(o.content)) return o.content as Record<string, any>[];
  if (Array.isArray(o.products)) return o.products as Record<string, any>[];
  if (Array.isArray(o.items)) return o.items as Record<string, any>[];
  if (Array.isArray(o.data)) return o.data as Record<string, any>[];
  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.content)) return d.content as Record<string, any>[];
    if (Array.isArray(d.products)) return d.products as Record<string, any>[];
    if (Array.isArray(d.items)) return d.items as Record<string, any>[];
    if (Array.isArray(d.data)) return d.data as Record<string, any>[];
  }
  return [];
}

function normalizeSearchPayload(payload: unknown): Record<string, any> | null {
  if (payload && typeof payload === "object") return payload as Record<string, any>;
  if (typeof payload !== "string") return null;
  const text = payload.trim();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    const trailingErrorIdx = text.lastIndexOf('{"success":false');
    if (trailingErrorIdx > 0) {
      try {
        return JSON.parse(text.slice(0, trailingErrorIdx)) as Record<string, any>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractSubcategoryIdsFromSearchPayload(payload: unknown): number[] {
  const normalized = normalizeSearchPayload(payload);
  if (!normalized) return [];
  const data = normalized.data;
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const list = Array.isArray(d.subCategories)
    ? d.subCategories
    : Array.isArray(d.subcategories)
      ? d.subcategories
      : [];
  const out: number[] = [];
  for (const row of list) {
    const id = Number((row as any)?.id);
    if (Number.isFinite(id) && id > 0 && !out.includes(id)) out.push(id);
  }
  return out;
}

export default function SearchResults() {
  const router = useRouter();
  const { tr } = useLanguage();
  const params = useLocalSearchParams<{ q?: string }>();
  const paramQ = (params.q || "").toString();

  const [inputQ, setInputQ] = useState(paramQ);
  const [items, setItems] = useState<GridProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsDropdownVisible, setSuggestionsDropdownVisible] =
    useState(false);
  const suggestionsReqId = useRef(0);

  useEffect(() => {
    setInputQ(paramQ);
  }, [paramQ]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const id = ++reqId.current;
    setLoading(true);
    setError(null);

    try {
      const token = (await AsyncStorage.getItem("token"))?.trim() || "";
      const sessionId =
        (await AsyncStorage.getItem(SEARCH_SESSION_KEY))?.trim() || "";
      let userId: number | undefined;
      if (token) {
        try {
          const part = token.split(".")[1] || "";
          const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
          const candidate = Number(
            payload.userId ?? payload.id ?? payload.uid ?? payload.sub
          );
          if (Number.isFinite(candidate) && candidate > 0) {
            userId = Math.floor(candidate);
          }
        } catch {
          // Continue with session-based history tracking.
        }
      }

      const { data } = await api.get<unknown>(
        searchProductsPath(trimmed, { userId, sessionId })
      );
      if (reqId.current !== id) return;
      const rows = mapSearchResultsToUi(data);
      const mapped = mapApiToGrid(rows);
      const hasProductsFromSearch = mapped.some((x) => x.kind === "product");

      // Fallback: if `/api/search` returns only names/categories, fetch products list and filter locally.
      if (!hasProductsFromSearch) {
        try {
          const apiBase = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
          const toGridProduct = (p: Record<string, any>): GridProduct => {
            const sale = Number(p?.sellingPrice ?? p?.salePrice ?? p?.price ?? 0);
            const mrp = Number(p?.mrpPrice ?? p?.mrp ?? p?.maxRetailPrice ?? sale ?? 0);
            const discountPct = Number(p?.discountPercentage ?? 0);
            const imageUri =
              pickProductImageUriFromApi(p, (path: string) => {
                const v = String(path ?? "").trim();
                if (!v) return "";
                if (/^https?:\/\//i.test(v)) return v;
                if (!apiBase) return v;
                return v.startsWith("/")
                  ? `${apiBase}${v}`
                  : `${apiBase}/${v.replace(/^\/+/, "")}`;
              }) || "";
            const discount =
              discountPct > 0
                ? `${Math.round(discountPct)}% off`
                : mrp > sale && mrp > 0
                  ? `${Math.round(((mrp - sale) / mrp) * 100)}% off`
                  : "—";
            return {
              id: String(p?.id ?? p?.productId ?? `${Math.random()}`),
              name: String(p?.name ?? p?.productName ?? p?.title ?? p?.displayName ?? "Product"),
              image: imageUri ? ({ uri: imageUri } as const) : PLACEHOLDER,
              price: Number.isFinite(sale) && sale > 0 ? sale : 0,
              mrp: Number.isFinite(mrp) && mrp > 0 ? mrp : Number.isFinite(sale) ? sale : 0,
              discount,
              rating: "4.2",
              ratingCount: "—",
              kind: "product",
            };
          };

          let relatedProductsBySubcategory: GridProduct[] = [];
          const subCategoryIds = extractSubcategoryIdsFromSearchPayload(data).slice(0, 4);
          if (subCategoryIds.length > 0) {
            const responses = await Promise.all(
              subCategoryIds.map((subId) =>
                api.get<unknown>(productsBySubcategoryPath(subId)).catch(() => null)
              )
            );
            if (reqId.current !== id) return;
            const rowsFromSubs = responses
              .filter((res): res is { data: unknown } => !!res)
              .flatMap((res) => pickRowsFromProductListingPayload(res.data));
            relatedProductsBySubcategory = rowsFromSubs.slice(0, 24).map(toGridProduct);
          }

          const fallbackRes = await api.get<unknown>("/api/products", {
            params: { page: 0, size: 120 },
          });
          if (reqId.current !== id) return;
          const allRows = pickRowsFromProductListingPayload(fallbackRes.data);
          const queryLower = trimmed.toLowerCase();

          const fallbackProducts: GridProduct[] = allRows
            .filter((p) => {
              const name = String(
                p?.name ?? p?.productName ?? p?.title ?? p?.displayName ?? ""
              )
                .trim()
                .toLowerCase();
              return !!name && name.includes(queryLower);
            })
            .slice(0, 20)
            .map(toGridProduct);

          const dedupe = new Map<string, GridProduct>();
          for (const row of [...relatedProductsBySubcategory, ...fallbackProducts, ...mapped]) {
            const key = `${row.kind}:${row.id}`;
            if (!dedupe.has(key)) dedupe.set(key, row);
          }
          setItems(Array.from(dedupe.values()));
        } catch {
          setItems(mapped);
        }
      } else {
        setItems(mapped);
      }
    } catch {
      if (reqId.current !== id) return;
      setItems([]);
      setError("Could not load results. Check your connection and try again.");
    } finally {
      if (reqId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void runSearch(inputQ);
    }, 280);
    return () => clearTimeout(t);
  }, [inputQ, runSearch]);

  useEffect(() => {
    const keyword = inputQ.trim();
    if (!keyword) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    const id = ++suggestionsReqId.current;
    setSuggestionsLoading(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const { data } = await api.get<SearchSuggestionsResponse>(
            searchSuggestionsPath(keyword)
          );
          if (suggestionsReqId.current !== id) return;
          const rows = Array.isArray(data?.data) ? data.data : [];
          setSuggestions(
            rows.filter((s) => typeof s === "string" && s.trim().length > 0)
          );
        } catch {
          if (suggestionsReqId.current !== id) return;
          setSuggestions([]);
        } finally {
          if (suggestionsReqId.current === id) setSuggestionsLoading(false);
        }
      })();
    }, 120);

    return () => clearTimeout(t);
  }, [inputQ]);

  const titleText = useMemo(() => {
    const s = inputQ.trim();
    return s ? `${tr("Results for")} “${s}”` : tr("Search products");
  }, [inputQ, tr]);

  const openProductDetail = (id: string) => {
    router.push({ pathname: "/productdetail", params: { id } });
  };

  const trimmed = inputQ.trim();
  const productItems = useMemo(
    () => items.filter((item) => item.kind === "product"),
    [items]
  );
  const categoryItems = useMemo(
    () => items.filter((item) => item.kind === "category"),
    [items]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={tr("Go back")}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {titleText}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBarWrap}>
          <TouchableOpacity
            onPress={() => {
              setSuggestionsDropdownVisible(false);
              void runSearch(inputQ);
            }}
            accessibilityRole="button"
            accessibilityLabel={tr("Run search")}
          >
            <Ionicons name="search-outline" size={20} color="#64748B" />
          </TouchableOpacity>
          <TextInput
            placeholder={tr("Search products")}
            placeholderTextColor="#94a3b8"
            style={styles.searchField}
            value={inputQ}
            onChangeText={(t) => {
              setInputQ(t);
              if (!suggestionsDropdownVisible) setSuggestionsDropdownVisible(true);
            }}
            onFocus={() => setSuggestionsDropdownVisible(true)}
            onBlur={() => {
              setTimeout(() => setSuggestionsDropdownVisible(false), 150);
            }}
            returnKeyType="search"
            onSubmitEditing={() => {
              setSuggestionsDropdownVisible(false);
              void runSearch(inputQ);
            }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {loading ? <ActivityIndicator size="small" color="#e53935" /> : null}
        </View>
        {suggestionsDropdownVisible &&
        (suggestionsLoading || inputQ.trim().length > 0) ? (
          <View style={styles.suggestionsDropdown}>
            {suggestionsLoading ? (
              <View style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>Searching…</Text>
              </View>
            ) : suggestions.length > 0 ? (
              suggestions.slice(0, 10).map((s, i) => (
                <TouchableOpacity
                  key={`sugg-${i}-${String(s).slice(0, 48)}`}
                  style={styles.suggestionRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSuggestionsDropdownVisible(false);
                    setInputQ(s);
                    void runSearch(s);
                  }}
                >
                  <Ionicons
                    name="search-outline"
                    size={16}
                    color="#94a3b8"
                    style={styles.suggestionIcon}
                  />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.suggestionItem}>
                <Text style={styles.suggestionText}>
                  No suggestions — try another keyword
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionBlock}>
          <Text style={styles.resultSummary}>
            {!trimmed
              ? "Type a keyword to search the catalog."
              : loading
                ? "Searching…"
                : items.length
                  ? `${items.length} results found`
                  : "No products found for this search."}
          </Text>
        </View>

        {trimmed && !loading && productItems.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Related products
            </Text>
            <View style={styles.allProductsGrid}>
              {productItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.allProductCard}
                  activeOpacity={0.85}
                  onPress={() => openProductDetail(item.id)}
                >
                  <View style={styles.allProductImageWrapper}>
                    <Image source={item.image} style={styles.allProductImage} />
                  </View>
                  <Text style={styles.allProductName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.allProductPriceRow}>
                    <Text style={styles.allProductPrice}>
                      {formatInrAmount(item.price)}
                    </Text>
                    {item.mrp > item.price ? (
                      <Text style={styles.allProductMrp}>
                        {formatInrAmount(item.mrp)}
                      </Text>
                    ) : null}
                    {item.discount && item.discount !== "—" ? (
                      <Text style={styles.allProductDiscount}>{item.discount}</Text>
                    ) : null}
                  </View>
                  <View style={styles.allProductRatingRow}>
                    <View style={styles.allProductRatingBadge}>
                      <Text style={styles.allProductRatingText}>{item.rating}</Text>
                      <Ionicons
                        name="star"
                        size={9}
                        color="#FFFFFF"
                        style={{ marginLeft: 2 }}
                      />
                    </View>
                    <Text style={styles.allProductRatingCount}>
                      ({item.ratingCount})
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {trimmed && !loading && categoryItems.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Categories</Text>
            <View style={styles.allProductsGrid}>
              {categoryItems.map((item) => (
                <TouchableOpacity
                  key={`cat-${item.id}`}
                  style={styles.allProductCard}
                  activeOpacity={0.85}
                  onPress={() => {
                    setInputQ(item.name);
                    void runSearch(item.name);
                  }}
                >
                  <View style={styles.allProductImageWrapper}>
                    <Image source={item.image} style={styles.allProductImage} />
                  </View>
                  <Text style={styles.allProductName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.categoryHint}>Tap to search products</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  searchSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    zIndex: 20,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    gap: 8,
  },
  suggestionsDropdown: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 4,
    maxHeight: 220,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  searchField: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#ffebee",
  },
  errorText: { fontSize: 13, color: "#b71c1c" },
  content: {
    paddingBottom: 24,
  },
  sectionBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultSummary: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  sectionLabelAccent: {
    color: "#e53935",
  },
  allProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  allProductCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 8,
  },
  allProductImageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
  },
  allProductImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  allProductName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  allProductPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
    gap: 6,
  },
  allProductPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  allProductMrp: {
    fontSize: 12,
    color: "#777",
    textDecorationLine: "line-through",
  },
  allProductDiscount: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
  },
  allProductRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  allProductRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  allProductRatingText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  allProductRatingCount: {
    marginLeft: 4,
    fontSize: 11,
    color: "#777",
  },
  categoryHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
});

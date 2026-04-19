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
import api from "../services/api";
import {
  pickPrimaryProductImage,
  resolveProductPrimaryImageUri,
} from "../lib/productImage";

/** Product search — base URL comes from `services/api.tsx` */
const PRODUCTS_SEARCH_PATH = "/api/products/search";

/** Type-ahead suggestions — `GET` with `params: { keyword }` (base URL in `services/api.tsx`) */
const SEARCH_SUGGESTIONS_PATH = "/api/search/suggestions";

type SearchSuggestionsResponse = {
  success?: boolean;
  message?: string;
  data?: string[];
};

type SearchApiImage = {
  imagePath?: string | null;
  imageUrl?: string | null;
  isPrimary?: boolean | null;
  sortOrder?: number | null;
};

type SearchApiVariant = {
  sellingPrice?: number | null;
  mrpPrice?: number | null;
  finalPrice?: number | null;
  discountPercentage?: number | null;
  inStock?: boolean | null;
};

type SearchApiProduct = {
  id: number;
  name?: string | null;
  productName?: string | null;
  title?: string | null;
  status?: string | null;
  salePrice?: number | null;
  sellingPrice?: number | null;
  price?: number | null;
  mrp?: number | null;
  maxRetailPrice?: number | null;
  discountPercentage?: number | null;
  images?: SearchApiImage[] | null;
  variants?: SearchApiVariant[] | null;
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
};

const PLACEHOLDER = require("../assets/images/product1.png");

function formatInrAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function pickVariant(p: SearchApiProduct): SearchApiVariant | undefined {
  const vs = Array.isArray(p.variants) ? p.variants : [];
  if (vs.length === 0) return undefined;
  const inStock = vs.find((v) => v && v.inStock === true);
  return inStock ?? vs[0];
}

function normalizeRows(data: unknown): SearchApiProduct[] {
  if (Array.isArray(data)) return data as SearchApiProduct[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.content)) return o.content as SearchApiProduct[];
    if (Array.isArray(o.data)) return o.data as SearchApiProduct[];
    if (Array.isArray(o.products)) return o.products as SearchApiProduct[];
  }
  return [];
}

function mapApiToGrid(
  rows: SearchApiProduct[],
  apiBase: string
): GridProduct[] {
  const root = apiBase.replace(/\/$/, "");
  const resolvePath = (p: string) => {
    const s = String(p ?? "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (!root) return "";
    return s.startsWith("/") ? `${root}${s}` : `${root}/${s}`;
  };

  const out: GridProduct[] = [];

  for (const p of rows) {
    const st = String(p.status ?? "").trim().toLowerCase();
    if (st && st !== "active") continue;

    const primary = pickPrimaryProductImage(p.images);
    const uri = resolveProductPrimaryImageUri(primary, resolvePath);

    const name =
      String(p.name ?? p.productName ?? p.title ?? "").trim() ||
      `Product ${p.id}`;

    const v = pickVariant(p);
    const sale = Number(
      v?.sellingPrice ?? v?.finalPrice ?? p.salePrice ?? p.sellingPrice ?? p.price ?? 0
    );
    const mrp = Number(v?.mrpPrice ?? p.mrp ?? p.maxRetailPrice ?? 0);

    let discount = "";
    if (mrp > 0 && sale > 0 && mrp > sale) {
      discount = `${Math.round(((mrp - sale) / mrp) * 100)}% off`;
    } else if (
      typeof v?.discountPercentage === "number" &&
      v.discountPercentage > 0
    ) {
      discount = `${Math.round(v.discountPercentage)}% off`;
    } else if (
      typeof p.discountPercentage === "number" &&
      p.discountPercentage > 0
    ) {
      discount = `${Math.round(p.discountPercentage)}% off`;
    }

    out.push({
      id: String(p.id),
      name,
      image: uri ? ({ uri } as const) : PLACEHOLDER,
      price: sale > 0 ? sale : 0,
      mrp: mrp > 0 ? mrp : sale > 0 ? sale : 0,
      discount: discount || "—",
      rating: "4.2",
      ratingCount: "—",
    });
  }

  return out;
}

export default function SearchResults() {
  const router = useRouter();
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
      const { data } = await api.get<unknown>(PRODUCTS_SEARCH_PATH, {
        params: { q: trimmed },
      });
      if (reqId.current !== id) return;

      const base = String((api.defaults.baseURL as string | undefined) ?? "").trim();
      const rows = normalizeRows(data);
      setItems(mapApiToGrid(rows, base));
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
            SEARCH_SUGGESTIONS_PATH,
            { params: { keyword } }
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
    return s ? `Results for “${s}”` : "Search products";
  }, [inputQ]);

  const openProductDetail = (id: string) => {
    router.push({ pathname: "/productdetail", params: { id } });
  };

  const trimmed = inputQ.trim();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
          <Ionicons name="search-outline" size={20} color="#64748B" />
          <TextInput
            placeholder="Search products"
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
                  ? `${items.length} products found`
                  : "No products found for this search."}
          </Text>
        </View>

        {trimmed && !loading && items.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, styles.sectionLabelAccent]}>
              Products
            </Text>
            <View style={styles.allProductsGrid}>
              {items.map((item) => (
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
});

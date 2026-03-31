import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ALL_PRODUCTS } from "./productdetail";

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ALL_PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(s)
    ).slice(0, 6);
  }, [q]);

  const featured = useMemo(() => {
    const base = q.trim()
      ? ALL_PRODUCTS.filter((p) =>
          p.name.toLowerCase().includes(q.trim().toLowerCase())
        )
      : ALL_PRODUCTS;
    return base.slice(0, 6);
  }, [q]);

  const goToResults = (text: string) => {
    const value = text.trim();
    if (!value) return;
    router.push({ pathname: "/searchresults", params: { q: value } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products"
            placeholderTextColor="#888"
            value={q}
            onChangeText={setQ}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => goToResults(q)}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {q.trim().length > 0 && suggestions.length > 0 && (
          <View style={styles.suggestionBlock}>
            <Text style={styles.sectionTitle}>Search suggestions</Text>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                onPress={() => goToResults(item.name)}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="#777"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Popular products</Text>
          <View style={styles.grid}>
            {featured.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => goToResults(item.name)}
              >
                <View style={styles.imageWrap}>
                  <Image source={item.image} style={styles.image} />
                </View>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 24,
    paddingHorizontal: 10,
    height: 44,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  suggestionBlock: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: "#333",
  },
  sectionBlock: {
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: 16,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    marginBottom: 6,
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
});


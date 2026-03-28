import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Product = {
  id: string;
  name: string;
  price: number;
  image: any;
};

const demoProducts: Product[] = [
  {
    id: "p1",
    name: "Floral Printed Cotton Dress",
    price: 1299,
    image: require("../assets/images/look1.png"),
  },
  {
    id: "p2",
    name: "Casual A-line dress",
    price: 849,
    image: require("../assets/images/look2.png"),
  },
  {
    id: "p3",
    name: "Printed summer dress",
    price: 899,
    image: require("../assets/images/look3.png"),
  },
];

export default function Products() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return demoProducts;
    return demoProducts.filter((p) => p.name.toLowerCase().includes(s));
  }, [q]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Products</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search products"
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/productdetail")}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
          >
            <Image source={item.image} style={styles.img} />
            <View style={styles.meta}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        )}
      />
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
  title: { fontSize: 18, fontWeight: "700", color: "#111" },
  searchRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: "#111" },
  list: { paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  img: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#f4f4f4" },
  meta: { flex: 1, marginLeft: 12, marginRight: 8 },
  name: { fontSize: 14, fontWeight: "600", color: "#111" },
  price: { marginTop: 4, fontSize: 13, fontWeight: "700", color: "#111" },
});


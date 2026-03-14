import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

interface WishlistItem {
  id: string;
  name: string;
  image: any;
  price: number;
  originalPrice?: number;
  addedDate: string;
  inStock: boolean;
  size?: string;
  color?: string;
}

export default function WishlistScreen() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    {
      id: "1",
      name: "Premium Cotton T-Shirt",
      image: require("../assets/images/age5.png"),
      price: 1299,
      originalPrice: 1999,
      addedDate: "2 days ago",
      inStock: true,
      size: "M",
      color: "Blue",
    },
    {
      id: "2",
      name: "Designer Denim Jeans",
      image: require("../assets/images/age6.png"),
      price: 2499,
      addedDate: "5 days ago",
      inStock: true,
      size: "L",
      color: "Dark Blue",
    },
    {
      id: "3",
      name: "Casual Sneakers",
      image: require("../assets/images/age5.png"),
      price: 3499,
      originalPrice: 4999,
      addedDate: "1 week ago",
      inStock: false,
      size: "42",
      color: "White",
    },
    {
      id: "4",
      name: "Leather Jacket",
      image: require("../assets/images/age6.png"),
      price: 4999,
      originalPrice: 6999,
      addedDate: "3 days ago",
      inStock: true,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductOriginalPrice, setNewProductOriginalPrice] = useState("");

  // Move item to cart
  const handleMoveToCart = (item: WishlistItem) => {
    Alert.alert(
      "Move to Cart",
      `Add "${item.name}" to your cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add to Cart",
          onPress: () => {
            // Here you would typically add to cart state/context
            Alert.alert("Success", `${item.name} has been added to your cart!`);
            // Optionally remove from wishlist after adding to cart
            // setWishlistItems((prev) => prev.filter((i) => i.id !== item.id));
          },
        },
      ]
    );
  };

  // Remove item from wishlist
  const handleRemoveItem = (id: string, name: string) => {
    Alert.alert(
      "Remove Item",
      `Remove "${name}" from your wishlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setWishlistItems((prev) => prev.filter((item) => item.id !== id));
            Alert.alert("Removed", "Item has been removed from your wishlist.");
          },
        },
      ]
    );
  };

  // Add new item to wishlist
  const handleAddToWishlist = () => {
    if (!newProductName.trim() || !newProductPrice.trim()) {
      Alert.alert("Missing Info", "Please enter product name and price.");
      return;
    }

    const price = parseFloat(newProductPrice);
    const originalPrice = newProductOriginalPrice
      ? parseFloat(newProductOriginalPrice)
      : undefined;

    if (isNaN(price) || price <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }

    if (originalPrice && (isNaN(originalPrice) || originalPrice <= price)) {
      Alert.alert(
        "Invalid Original Price",
        "Original price must be greater than current price."
      );
      return;
    }

    const newItem: WishlistItem = {
      id: `item_${Date.now()}`,
      name: newProductName.trim(),
      image: require("../assets/images/age5.png"), // Default image
      price: price,
      originalPrice: originalPrice,
      addedDate: "Just now",
      inStock: true,
    };

    setWishlistItems((prev) => [newItem, ...prev]);
    setNewProductName("");
    setNewProductPrice("");
    setNewProductOriginalPrice("");
    setShowAddForm(false);
    Alert.alert("Success", "Item has been added to your wishlist!");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Your Wishlist</Text>
            <Text style={styles.headerSubtitle}>
              {wishlistItems.length}{" "}
              {wishlistItems.length === 1 ? "item" : "items"} saved
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="close-circle" size={32} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Add to Wishlist Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add to Wishlist</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Ionicons
                name={showAddForm ? "remove" : "add"}
                size={20}
                color="#E97A1F"
              />
              <Text style={styles.addButtonText}>
                {showAddForm ? "Cancel" : "Add Item"}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formLabel}>Product Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter product name"
                value={newProductName}
                onChangeText={setNewProductName}
              />

              <Text style={styles.formLabel}>Price (₹)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter price"
                value={newProductPrice}
                onChangeText={setNewProductPrice}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Original Price (₹) - Optional</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter original price"
                value={newProductOriginalPrice}
                onChangeText={setNewProductOriginalPrice}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddToWishlist}
              >
                <Text style={styles.saveButtonText}>Add to Wishlist</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Wishlist Product List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wishlist Product List</Text>

          {wishlistItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={80} color="#E0E0E0" />
              </View>
              <Text style={styles.emptyText}>Your wishlist is empty</Text>
              <Text style={styles.emptySubtext}>
                Add items you love to your wishlist!
              </Text>
            </View>
          ) : (
            wishlistItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.wishlistCard,
                  index === wishlistItems.length - 1 && styles.wishlistCardLast,
                ]}
              >
                <Image source={item.image} style={styles.wishlistImage} />
                <View style={styles.wishlistInfo}>
                  <View style={styles.wishlistHeader}>
                    <View style={styles.wishlistTitleRow}>
                      <Text style={styles.wishlistName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {!item.inStock && (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {item.size && (
                    <Text style={styles.wishlistMeta}>
                      Size: {item.size} {item.color && `• Color: ${item.color}`}
                    </Text>
                  )}

                  <View style={styles.wishlistPriceRow}>
                    <Text style={styles.wishlistPrice}>
                      ₹{item.price.toLocaleString()}
                    </Text>
                    {item.originalPrice && (
                      <Text style={styles.wishlistOriginalPrice}>
                        ₹{item.originalPrice.toLocaleString()}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.wishlistDate}>Added {item.addedDate}</Text>

                  {/* Action Buttons */}
                  <View style={styles.wishlistActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.moveToCartButton,
                        !item.inStock && styles.actionButtonDisabled,
                      ]}
                      onPress={() => handleMoveToCart(item)}
                      disabled={!item.inStock}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="cart-outline"
                        size={16}
                        color={item.inStock ? "#FFFFFF" : "#999"}
                      />
                      <Text
                        style={[
                          styles.actionButtonText,
                          styles.moveToCartButtonText,
                          !item.inStock && styles.actionButtonTextDisabled,
                        ]}
                      >
                        Move to Cart
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => handleRemoveItem(item.id, item.name)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#F44336" />
                      <Text
                        style={[
                          styles.actionButtonText,
                          styles.removeButtonText,
                        ]}
                      >
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    flexShrink: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 10,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFF5F0",
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E97A1F",
  },
  addForm: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#E97A1F",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
  },
  wishlistCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  wishlistCardLast: {
    marginBottom: 0,
  },
  wishlistImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  wishlistInfo: {
    flex: 1,
    marginLeft: 16,
  },
  wishlistHeader: {
    marginBottom: 8,
  },
  wishlistTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  wishlistName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    marginRight: 8,
  },
  outOfStockBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#F57C00",
  },
  wishlistMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  wishlistPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  wishlistPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E97A1F",
  },
  wishlistOriginalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  wishlistDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  wishlistActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  moveToCartButton: {
    backgroundColor: "#E97A1F",
  },
  actionButtonDisabled: {
    backgroundColor: "#F5F5F5",
  },
  removeButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  moveToCartButtonText: {
    color: "#FFFFFF",
  },
  actionButtonTextDisabled: {
    color: "#999",
  },
  removeButtonText: {
    color: "#F44336",
  },
});


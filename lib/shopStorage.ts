import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";

const CART_KEY = "@ecommerce_cart_v1";
const WISHLIST_KEY = "@ecommerce_wishlist_v1";

export type PersistedCartLine = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  quantity: number;
  /** Optional absolute/relative uri for the chosen variant image (guest cart). */
  imageUri?: string;
  /** Optional selected variant metadata (guest cart). */
  variantId?: number;
  size?: string;
  color?: string;
  /** Optional variant stock captured at add time for guest cart checks. */
  stock?: number;
};

export type PersistedWishlistLine = {
  id: string;
  name: string;
  price: number;
  mrp: number;
};

const PRODUCT_IMAGES: Record<string, ImageSourcePropType> = {
  p1: require("../assets/images/look1.png"),
  p2: require("../assets/images/look2.png"),
  p3: require("../assets/images/look3.png"),
  p4: require("../assets/images/look4.png"),
  p5: require("../assets/images/product1.png"),
  p6: require("../assets/images/product2.png"),
  p7: require("../assets/images/product3.png"),
  p8: require("../assets/images/product4.png"),
  p9: require("../assets/images/sports6.png"),
  p10: require("../assets/images/sports2.png"),
  p11: require("../assets/images/premium1.png"),
  p12: require("../assets/images/product5.png"),
  sim1: require("../assets/images/age5.png"),
  sim2: require("../assets/images/age6.png"),
  sim3: require("../assets/images/age5.png"),
  sim4: require("../assets/images/age6.png"),
  sim5: require("../assets/images/age5.png"),
  sim6: require("../assets/images/age6.png"),
  /** Home “Suggested for you” — same assets as cards, stable ids for cart */
  sg1: require("../assets/images/look1.png"),
  sg2: require("../assets/images/look2.png"),
  sg3: require("../assets/images/look3.png"),
  sg4: require("../assets/images/sports2.png"),
};

export function resolveProductImage(id: string): ImageSourcePropType {
  return PRODUCT_IMAGES[id] ?? require("../assets/images/product1.png");
}

export async function loadCart(): Promise<PersistedCartLine[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedCartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCart(lines: PersistedCartLine[]): Promise<void> {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(lines));
}

export async function addProductToCart(
  product: Omit<PersistedCartLine, "quantity">
): Promise<PersistedCartLine[]> {
  const cart = await loadCart();
  const idx = cart.findIndex((x) => x.id === product.id);
  const productStock =
    typeof product.stock === "number" && Number.isFinite(product.stock)
      ? Math.max(0, Math.floor(product.stock))
      : undefined;

  if (idx >= 0) {
    // Calculate new quantity, respecting stock limit
    const currentStock =
      productStock ??
      (typeof cart[idx].stock === "number"
        ? Math.max(0, Math.floor(cart[idx].stock))
        : undefined);

    let newQuantity = cart[idx].quantity + 1;
    if (typeof currentStock === "number") {
      newQuantity = Math.min(newQuantity, currentStock);
    }

    cart[idx] = {
      ...cart[idx],
      quantity: newQuantity,
      // Keep latest selected image/variant metadata.
      imageUri: product.imageUri ?? cart[idx].imageUri,
      variantId: product.variantId ?? cart[idx].variantId,
      size: product.size ?? cart[idx].size,
      color: product.color ?? cart[idx].color,
      stock: currentStock,
    };
  } else {
    // For new items, quantity is 1 (unless stock is 0)
    const initialQuantity =
      typeof productStock === "number" && productStock > 0 ? 1 : 1;
    cart.push({ ...product, quantity: initialQuantity });
  }
  await saveCart(cart);
  return cart;
}

export async function adjustCartQuantity(
  id: string,
  delta: number,
  stock?: number
): Promise<PersistedCartLine[]> {
  const cart = await loadCart();
  const next = cart
    .map((line) => {
      if (line.id !== id) return line;
      let newQuantity = Math.max(1, line.quantity + delta);
      // Enforce stock limit if provided
      if (typeof stock === "number" && Number.isFinite(stock) && stock >= 0) {
        newQuantity = Math.min(newQuantity, Math.max(0, Math.floor(stock)));
      }
      // Also enforce line's own stock if present
      if (typeof line.stock === "number" && line.stock >= 0) {
        newQuantity = Math.min(newQuantity, Math.floor(line.stock));
      }
      return { ...line, quantity: newQuantity };
    })
    .filter((line) => line.quantity > 0);
  await saveCart(next);
  return next;
}

export async function removeCartLine(id: string): Promise<PersistedCartLine[]> {
  const cart = await loadCart();
  const next = cart.filter((line) => line.id !== id);
  await saveCart(next);
  return next;
}

export async function loadWishlist(): Promise<PersistedWishlistLine[]> {
  try {
    const raw = await AsyncStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedWishlistLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWishlist(lines: PersistedWishlistLine[]): Promise<void> {
  await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(lines));
}

/** Add to local wishlist if not already present (used after server add). */
export async function addWishlistProductIfAbsent(
  product: PersistedWishlistLine
): Promise<void> {
  const list = await loadWishlist();
  if (list.some((x) => x.id === product.id)) return;
  list.push(product);
  await saveWishlist(list);
}

/** Returns true if product is now in the wishlist after toggle. */
export async function toggleWishlistProduct(
  product: PersistedWishlistLine
): Promise<boolean> {
  const list = await loadWishlist();
  const idx = list.findIndex((x) => x.id === product.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await saveWishlist(list);
    return false;
  }
  list.push(product);
  await saveWishlist(list);
  return true;
}

export async function getWishlistIds(): Promise<Set<string>> {
  const list = await loadWishlist();
  return new Set(list.map((x) => x.id));
}

export async function removeWishlistLine(id: string): Promise<void> {
  const list = await loadWishlist();
  await saveWishlist(list.filter((x) => x.id !== id));
}

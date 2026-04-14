import type { ImageSourcePropType } from "react-native";

export type RatePurchaseCard = {
  id: string;
  brand: string;
  title: string;
  deliveredOn: string;
  image: ImageSourcePropType;
};

export const RATE_STAR_LABELS = [
  "Terrible",
  "Bad",
  "Okay",
  "Good",
  "Great",
] as const;

export const RATE_PURCHASE_CARDS: RatePurchaseCard[] = [
  {
    id: "r1",
    brand: "AVANOVA",
    title: "Women Ruched Fit & Flare Dress",
    deliveredOn: "Delivered on Mar 03, 2026",
    image: require("../assets/images/premium1.png"),
  },
  {
    id: "r2",
    brand: "NIKE",
    title: "Air Zoom Running Shoes",
    deliveredOn: "Delivered on Mar 01, 2026",
    image: require("../assets/images/sports6.png"),
  },
  {
    id: "r3",
    brand: "ADIDAS",
    title: "Gym Training Tee",
    deliveredOn: "Delivered on Feb 28, 2026",
    image: require("../assets/images/sports2.png"),
  },
];

export function getRatePurchaseCard(
  id: string | undefined
): RatePurchaseCard | undefined {
  if (!id) return undefined;
  return RATE_PURCHASE_CARDS.find((c) => c.id === id);
}

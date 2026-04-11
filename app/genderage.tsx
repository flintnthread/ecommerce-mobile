import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type GenderOption = "FEMALE" | "MALE";

const AGE_GROUPS = ["0-18 YEARS", "19-24 YEARS", "25-40 YEARS", "40+ YEARS"] as const;

export default function GenderAgeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [gender, setGender] = useState<GenderOption | null>(null);
  const [ageGroup, setAgeGroup] = useState<(typeof AGE_GROUPS)[number] | null>(null);

  const canContinue = useMemo(() => Boolean(gender && ageGroup), [gender, ageGroup]);

  const goBack = () => router.replace("/language");
  const skip = () => router.replace("/login");
  const continueNext = () => router.replace("/login");

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <TouchableOpacity
        onPress={goBack}
        style={[styles.backBtnTop, { top: Math.max(insets.top, 12) }]}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={22} color="#0F172A" />
      </TouchableOpacity>

      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#9A3412" />
            <Text style={styles.heroBadgeText}>Personalize</Text>
          </View>
          <View style={styles.heroStepPill}>
            <Text style={styles.heroStepText}>Step 2 of 3</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Tell us about you</Text>
        <Text style={styles.heroSubtitle}>
          Pick a gender and age group to improve recommendations.
        </Text>

        <View style={styles.progressTrack} accessibilityLabel="Progress">
          <View style={styles.progressFill} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Gender</Text>
            <Text style={styles.blockHint}>Choose 1</Text>
          </View>

          <View style={styles.tileStack}>
            <Pressable
              onPress={() => setGender("FEMALE")}
              accessibilityRole="button"
              accessibilityLabel="Select female"
              style={({ pressed }) => [
                styles.tile,
                gender === "FEMALE" && styles.tileSelected,
                pressed && styles.tilePressed,
              ]}
            >
              <View style={styles.tileIcon}>
                <Ionicons
                  name="female"
                  size={22}
                  color={gender === "FEMALE" ? "#9A3412" : "#334155"}
                />
              </View>
              <View style={styles.tileText}>
                <Text style={styles.tileTitle}>Female</Text>
                <Text style={styles.tileSubtitle}>Shop women’s picks</Text>
              </View>
              <Ionicons
                name={gender === "FEMALE" ? "checkmark-circle" : "chevron-forward"}
                size={22}
                color={gender === "FEMALE" ? "#EA580C" : "#94A3B8"}
              />
            </Pressable>

            <Pressable
              onPress={() => setGender("MALE")}
              accessibilityRole="button"
              accessibilityLabel="Select male"
              style={({ pressed }) => [
                styles.tile,
                gender === "MALE" && styles.tileSelected,
                pressed && styles.tilePressed,
              ]}
            >
              <View style={styles.tileIcon}>
                <Ionicons
                  name="male"
                  size={22}
                  color={gender === "MALE" ? "#9A3412" : "#334155"}
                />
              </View>
              <View style={styles.tileText}>
                <Text style={styles.tileTitle}>Male</Text>
                <Text style={styles.tileSubtitle}>Shop men’s picks</Text>
              </View>
              <Ionicons
                name={gender === "MALE" ? "checkmark-circle" : "chevron-forward"}
                size={22}
                color={gender === "MALE" ? "#EA580C" : "#94A3B8"}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Age group</Text>
            <Text style={styles.blockHint}>Choose 1</Text>
          </View>

          <View style={styles.ageTilesGrid}>
            {AGE_GROUPS.map((g) => {
              const selected = ageGroup === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setAgeGroup(g)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select age group ${g}`}
                  style={({ pressed }) => [
                    styles.ageTile,
                    selected && styles.ageTileSelected,
                    pressed && styles.tilePressed,
                  ]}
                >
                  <Text style={[styles.ageTileText, selected && styles.ageTileTextSelected]}>
                    {g}
                  </Text>
                  <View style={[styles.ageTileCheck, selected && styles.ageTileCheckSelected]}>
                    <Ionicons
                      name={selected ? "checkmark" : "add"}
                      size={16}
                      color={selected ? "#0F172A" : "#94A3B8"}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 12), paddingTop: 10 },
        ]}
      >
        <TouchableOpacity onPress={skip} style={styles.footerBtnGhost} activeOpacity={0.75}>
          <Text style={styles.footerBtnGhostText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={continueNext}
          disabled={!canContinue}
          style={[styles.footerBtnPrimary, !canContinue && styles.footerBtnPrimaryDisabled]}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={[styles.footerBtnPrimaryText, !canContinue && styles.footerBtnTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  backBtnTop: {
    position: "absolute",
    left: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.12)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },

  hero: {
    marginTop: 56,
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.10)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.18)",
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#9A3412",
    letterSpacing: 0.4,
  },
  heroStepPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.10)",
  },
  heroStepText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFill: {
    width: "66%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#EA580C",
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  block: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 23, 42, 0.10)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  blockHint: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },

  tileStack: {
    gap: 10,
  },
  tile: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.10)",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tileSelected: {
    borderColor: "rgba(234, 88, 12, 0.38)",
    backgroundColor: "#FFFBF7",
  },
  tilePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  tileText: {
    flex: 1,
    minWidth: 0,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  tileSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  ageTilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  ageTile: {
    width: "48.5%",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.10)",
    backgroundColor: "#FFFFFF",
    minHeight: 76,
    justifyContent: "space-between",
  },
  ageTileSelected: {
    borderColor: "rgba(234, 88, 12, 0.38)",
    backgroundColor: "#FFFBF7",
  },
  ageTileText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  ageTileTextSelected: {
    color: "#0F172A",
  },
  ageTileCheck: {
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  ageTileCheckSelected: {
    backgroundColor: "#FFF1E6",
    borderColor: "rgba(234, 88, 12, 0.22)",
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(15, 23, 42, 0.10)",
    backgroundColor: "rgba(246, 247, 251, 0.98)",
  },
  footerBtnGhost: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.14)",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnGhostText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  footerBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EA580C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  footerBtnPrimaryDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  footerBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  footerBtnTextDisabled: {
    color: "#475569",
  },
});


import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import { PetAvatar } from "./PetAvatar";
import { radius, shadow, space } from "./theme";
import type { Pet } from "./types";

interface PetsListProps {
  pets: Pet[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function PetsList({ pets, activeId, onSelect }: PetsListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Your cats</Text>
      {pets.map((pet) => {
        const active = pet.id === activeId;
        return (
          <Pressable
            key={pet.id}
            onPress={() => onSelect(pet.id)}
            style={({ pressed }) => [
              styles.row,
              active && styles.rowActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: active ? "#1B1A17" : "#DCE3D2" },
              ]}
            >
              {active ? (
                <PetAvatar pet={pet} size={36} />
              ) : (
                <Text style={[styles.initial, { color: "#5E7242" }]}>{pet.name.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, active && styles.nameActive]}>
                {pet.name} {active && <Text style={styles.tagActive}>· active</Text>}
              </Text>
              <Text style={[styles.meta, active && styles.metaActive]}>
                Rating {pet.stats?.rating.toLocaleString() ?? 0} · {pet.stats?.tier ?? "Bronze"}
              </Text>
            </View>
            <Ionicons
              name={active ? "checkmark-circle" : "chevron-forward"}
              size={22}
              color={active ? colors.green : "#C7C2B6"}
            />
          </Pressable>
        );
      })}
      <Pressable style={styles.addBtn}>
        <Ionicons name="add" size={20} color="#A39A88" />
        <Text style={styles.addText}>Add a cat</Text>
      </Pressable>
    </ScrollView>
  );
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      paddingBottom: 120,
      gap: space.sm,
    },
    heading: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.02,
      color: colors.text,
      marginBottom: space.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.md,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.xl,
      padding: space.md,
    },
    rowActive: {
      backgroundColor: "#1B1A17",
      borderColor: "#1B1A17",
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    initial: {
      fontSize: 22,
      fontWeight: "800",
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    nameActive: {
      color: "#F4F1EA",
    },
    tagActive: {
      fontSize: 11,
      color: "#9A968D",
      fontWeight: "600",
    },
    meta: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      fontVariant: ["tabular-nums"],
    },
    metaActive: {
      color: "#9A968D",
    },
    addBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      borderWidth: 2,
      borderColor: "#C7C2B6",
      borderStyle: "dashed",
      borderRadius: radius.xl,
      padding: space.lg,
      marginTop: space.xs,
    },
    addText: {
      color: "#A39A88",
      fontWeight: "600",
      fontSize: 15,
    },
  });
}

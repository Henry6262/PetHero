import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "./ThemeContext";
import { PetAvatar } from "./PetAvatar";
import { radius, space } from "./theme";
import type { Pet } from "./types";

interface PetNavigatorProps {
  pets: Pet[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function PetNavigator({ pets, activeId, onSelect }: PetNavigatorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {pets.map((pet) => {
        const active = pet.id === activeId;
        return (
          <Pressable
            key={pet.id}
            onPress={() => onSelect(pet.id)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <PetAvatar pet={pet} size={28} />
            <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
              {pet.name}
            </Text>
            {active && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: space.sm,
      paddingVertical: space.sm,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipActive: {
      borderColor: colors.text,
      backgroundColor: colors.card,
    },
    name: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      maxWidth: 90,
    },
    nameActive: {
      color: colors.text,
      fontWeight: "700",
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.green,
      marginLeft: 2,
    },
  });
}

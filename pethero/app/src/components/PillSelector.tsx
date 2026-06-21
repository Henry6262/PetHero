import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius, shadow, space } from "../theme";
import type { Medication } from "../types";

interface PillSelectorProps {
  medications: Medication[];
  onGive: (name: string) => void;
}

const PILL_COLORS: Record<string, string> = {
  red: "#DC2626",
  black: "#1B1A18",
  blue: "#3B82F6",
};

export function PillSelector({ medications, onGive }: PillSelectorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  if (!medications.length) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.muted }]}>Pills</Text>
      <View style={styles.row}>
        {medications.map((med) => {
          const key = med.name.toLowerCase().replace(/\s+pill$/, "");
          const pillColor = PILL_COLORS[key] ?? colors.amber;
          return (
            <Pressable
              key={med.id}
              onPress={() => onGive(med.name)}
              style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            >
              <Ionicons name="ellipse" size={14} color={pillColor} />
              <Text style={[styles.pillText, { color: colors.text }]}>{med.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      marginTop: space.sm,
      marginBottom: space.sm,
    },
    title: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: space.sm,
    },
    row: {
      flexDirection: "row",
      gap: space.sm,
    },
    pill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: 10,
      ...shadow.card,
    },
    pillPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
    pillText: {
      fontSize: 13,
      fontWeight: "700",
    },
  });
}

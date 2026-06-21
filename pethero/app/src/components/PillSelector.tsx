import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, shadow, space } from "../theme";
import type { Medication } from "../types";

interface PillSelectorProps {
  medications: Medication[];
  onGive: (name: string) => void;
}

const PILL_IMAGES: Record<string, any> = {
  "red pill": require("../../assets/pills/red.png"),
  "black pill": require("../../assets/pills/black.png"),
  "blue pill": require("../../assets/pills/blue.png"),
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
          const image = PILL_IMAGES[med.name.toLowerCase()];
          return (
            <Pressable
              key={med.id}
              onPress={() => onGive(med.name)}
              style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
            >
              {image ? (
                <Image source={image} style={styles.pillImage} resizeMode="contain" />
              ) : (
                <View style={styles.pillDot} />
              )}
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
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingVertical: 14,
      ...shadow.card,
    },
    pillPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
    pillImage: {
      width: 64,
      height: 64,
    },
    pillDot: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.amber,
    },
    pillText: {
      fontSize: 13,
      fontWeight: "700",
    },
  });
}

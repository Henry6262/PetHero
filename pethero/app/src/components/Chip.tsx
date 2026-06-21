import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../ThemeContext";
import { radius, space } from "../theme";

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
}

export function Chip({ children, active, danger, onPress, leading }: ChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: colors.card, borderColor: colors.borderStrong },
        active && { borderColor: colors.text, backgroundColor: colors.card },
        danger && { borderColor: colors.red },
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
      ]}
    >
      {leading}
      <Text style={[styles.chipText, { color: danger ? colors.red : colors.text }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, fontWeight: "600" },
});

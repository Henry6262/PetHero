import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { Icon } from "../Icon";
import { radius, shadow, space } from "../theme";
import type { Pet } from "../types";

interface AlertBannerProps {
  pet: Pet;
  onPress: () => void;
}

export function AlertBanner({ pet, onPress }: AlertBannerProps) {
  const { colors } = useTheme();
  const med = pet.medications[0];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.alert, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.alertPressed]}>
      <View style={[styles.alertIconChip, { backgroundColor: "rgba(28,24,18,0.06)" }]}>
        <Icon name="medicine" size={22} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.alertTitle, { color: colors.text }]}>
          {med ? `${capitalize(med.name)} due for ${pet.name}` : `${pet.name} needs attention`}
        </Text>
        <Text style={[styles.alertSub, { color: colors.muted }]}>tap to select {pet.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
    marginBottom: space.sm,
    gap: space.md,
    borderWidth: 1,
    ...shadow.card,
  },
  alertPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  alertIconChip: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  alertTitle: { fontWeight: "700", fontSize: 17 },
  alertSub: { fontSize: 13, marginTop: space.xs },
});

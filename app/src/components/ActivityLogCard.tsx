import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../ThemeContext";
import { AgentPanel } from "../AgentPanel";
import { radius, shadow, space } from "../theme";
import type { ActivityEvent, DispenseDecision, Pet } from "../types";

interface ActivityLogCardProps {
  pets: Pet[];
  decision: DispenseDecision | null;
  lastEvent: ActivityEvent | null;
  log: ActivityEvent[];
}

export function ActivityLogCard({ pets, decision, lastEvent, log }: ActivityLogCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Recent activity</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AgentPanel decision={decision} lastEvent={lastEvent} log={log} pets={pets} maxItems={6} />
      </View>
    </View>
  );
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      marginTop: space.sm,
    },
    title: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.5,
      textTransform: "uppercase",
      marginBottom: space.sm,
    },
    card: {
      borderWidth: 1.5,
      borderRadius: radius.lg,
      paddingVertical: space.sm,
      ...shadow.card,
    },
  });
}

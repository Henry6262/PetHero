import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius, shadow, space } from "../theme";
import type { EnforceResult, Pet, RobotCommandResult } from "../types";

interface RobotCardProps {
  pet: Pet | null;
  candyClass: string | null;
  onEnforce: (petId: string, foodLabel: string) => Promise<EnforceResult> | void;
  onRobotCommand: (cmd: "feed" | "protect" | "pick", cup?: string) => Promise<RobotCommandResult> | void;
  lastCommand: { type: "enforce"; result: EnforceResult } | { type: "raw"; result: RobotCommandResult } | null;
}

export function RobotCard({ pet, candyClass, onEnforce, onRobotCommand, lastCommand }: RobotCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  const foodLabel = candyClass ?? pet?.food_options.find((f) => f.is_default)?.name ?? "food";
  const disabled = !pet;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconChip, { backgroundColor: colors.amberSoft }]}>
          <Ionicons name="hardware-chip-outline" size={18} color={colors.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Robot command</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {pet ? `${pet.color} ${pet.species}, feed 1 ${foodLabel}` : "No pet selected"}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <RobotButton
          label="Feed"
          icon="fast-food-outline"
          color={colors.green}
          disabled={disabled}
          onPress={() => pet && onEnforce(pet.id, foodLabel)}
        />
        <RobotButton
          label="Protect"
          icon="shield-outline"
          color={colors.red}
          onPress={() => onRobotCommand("protect")}
        />
      </View>

      <View style={styles.row}>
        {[1, 2, 3].map((cup) => (
          <RobotButton
            key={cup}
            label={`Pick ${cup}`}
            icon="cube-outline"
            color={colors.blue}
            small
            onPress={() => onRobotCommand("pick", String(cup))}
          />
        ))}
      </View>

      {lastCommand && (
        <View style={[styles.lastCmd, { backgroundColor: colors.screen }]}>
          <Text style={[styles.lastCmdLabel, { color: colors.muted }]}>
            {lastCommand.type === "enforce" ? "Last enforce" : "Last command"}
          </Text>
          <Text style={[styles.lastCmdText, { color: colors.text }]}>
            {formatLast(lastCommand)}
          </Text>
        </View>
      )}
    </View>
  );
}

function RobotButton({
  label,
  icon,
  color,
  small,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  small?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { borderColor: colors.border },
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Ionicons name={icon} size={small ? 16 : 18} color={disabled ? colors.muted : color} />
      <Text style={[styles.btnText, { color: disabled ? colors.muted : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function formatLast(last: RobotCardProps["lastCommand"]) {
  if (!last) return "";
  if (last.type === "enforce") {
    const r = last.result;
    return `${r.robot_cmd.toUpperCase()} · ${r.pet_name ?? "?"} · ${r.reason}`;
  }
  const r = last.result;
  return `${r.command.cmd.toUpperCase()}${r.command.cup ? ` cup ${r.command.cup}` : ""} · ${r.sent ? "sent" : "failed"}`;
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      borderWidth: 1.5,
      borderRadius: radius.xl,
      padding: space.md,
      marginTop: space.sm,
      marginBottom: space.sm,
      ...shadow.card,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.sm,
      marginBottom: space.md,
    },
    iconChip: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
    },
    subtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    row: {
      flexDirection: "row",
      gap: space.sm,
      marginBottom: space.sm,
    },
    btn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingVertical: 10,
      backgroundColor: colors.screen,
    },
    btnSmall: {
      paddingVertical: 8,
    },
    btnPressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },
    btnDisabled: {
      opacity: 0.5,
    },
    btnText: {
      fontSize: 13,
      fontWeight: "700",
    },
    lastCmd: {
      borderRadius: radius.md,
      paddingHorizontal: space.sm,
      paddingVertical: space.sm,
      marginTop: space.sm,
    },
    lastCmdLabel: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    lastCmdText: {
      fontSize: 12,
      fontWeight: "600",
    },
  });
}

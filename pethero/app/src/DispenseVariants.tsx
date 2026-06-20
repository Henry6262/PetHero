import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import { radius, shadow, space } from "./theme";
import { useTheme } from "./ThemeContext";
import { Icon, type IconName } from "./Icon";
import type { Action, Pet } from "./types";

export type DispenseVariant = "1" | "2" | "3";

interface Props {
  pet: Pet | null;
  onDispense: (action: Action) => void;
}

export function DispenseSection({ variant, ...p }: Props & { variant: DispenseVariant }) {
  if (variant === "1") return <TintedTiles {...p} />;
  if (variant === "2") return <PrimarySecondary {...p} />;
  return <Segmented {...p} />;
}

function useActions() {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      FEED: { action: "feed" as Action, icon: "feed" as IconName, label: "Feed", tint: colors.green, soft: colors.greenSoft },
      WATER: { action: "water" as Action, icon: "water" as IconName, label: "Water", tint: colors.blue, soft: colors.blueSoft },
      MED: { action: "medicine" as Action, icon: "medicine" as IconName, label: "Med", tint: colors.amber, soft: colors.amberSoft },
    }),
    [colors]
  );
}

function ActionPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  return (
    <Pressable
      onPress={() => {
        Vibration.vibrate(6);
        onPress();
      }}
      style={({ pressed }) => [style, pressed && { opacity: 0.82, transform: [{ scale: 0.97 }] }]}
    >
      {children}
    </Pressable>
  );
}

/* 1 — Tinted action tiles: each action gets its own soft tint + colored icon chip. */
function TintedTiles({ pet, onDispense }: Props) {
  const { colors } = useTheme();
  const styles = useTintedStyles(colors);
  const { FEED, WATER, MED } = useActions();
  const ALL = [FEED, WATER, MED];
  const off = !pet;

  return (
    <View style={styles.row}>
      {ALL.map((x) => (
        <ActionPressable
          key={x.action}
          onPress={() => onDispense(x.action)}
          style={[styles.tile, off && styles.off]}
        >
          <View style={[styles.iconChip, { backgroundColor: x.soft }]}>
            <Icon name={x.icon} size={32} color={x.tint} />
          </View>
          <Text style={styles.label}>{x.label}</Text>
        </ActionPressable>
      ))}
    </View>
  );
}

/* 2 — Primary + secondary: surface the recommended action big, the rest as chips. */
function PrimarySecondary({ pet, onDispense }: Props) {
  const { colors } = useTheme();
  const styles = usePrimaryStyles(colors);
  const { FEED, WATER, MED } = useActions();
  const ALL = [FEED, WATER, MED];

  if (!pet) {
    return (
      <View style={styles.row}>
        {ALL.map((x) => (
          <ActionPressable key={x.action} onPress={() => onDispense(x.action)} style={[styles.chip, styles.off]}>
            <Icon name={x.icon} size={24} color={x.tint} />
            <Text style={styles.chipText}>{x.label}</Text>
          </ActionPressable>
        ))}
      </View>
    );
  }
  const hasMed = pet.medications.length > 0;
  const primary = hasMed ? MED : FEED;
  const primaryLabel = hasMed ? `Give ${pet.medications[0].name}` : `Feed ${pet.name}`;
  const rest = ALL.filter((x) => x.action !== primary.action);
  return (
    <View>
      <ActionPressable onPress={() => onDispense(primary.action)} style={[styles.primary, { backgroundColor: primary.tint }]}>
        <Icon name={primary.icon} size={28} color="#fff" />
        <Text style={styles.primaryText}>{primaryLabel}</Text>
      </ActionPressable>
      <View style={styles.secondaryRow}>
        {rest.map((x) => (
          <ActionPressable key={x.action} onPress={() => onDispense(x.action)} style={styles.chip}>
            <Icon name={x.icon} size={24} color={x.tint} />
            <Text style={styles.chipText}>{x.label}</Text>
          </ActionPressable>
        ))}
      </View>
    </View>
  );
}

/* 3 — Segmented bar: one unified rounded control, three segments. */
function Segmented({ pet, onDispense }: Props) {
  const { colors } = useTheme();
  const styles = useSegmentedStyles(colors);
  const { FEED, WATER, MED } = useActions();
  const ALL = [FEED, WATER, MED];
  const off = !pet;

  return (
    <View style={[styles.bar, off && { opacity: 0.45 }]}>
      {ALL.map((x, i) => (
        <React.Fragment key={x.action}>
          {i > 0 && <View style={styles.divider} />}
          <ActionPressable onPress={() => onDispense(x.action)} style={styles.seg}>
            <Icon name={x.icon} size={28} color={x.tint} />
            <Text style={[styles.segLabel, { color: x.tint }]}>{x.label}</Text>
          </ActionPressable>
        </React.Fragment>
      ))}
    </View>
  );
}

function useTintedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: "row", gap: space.md },
        tile: { flex: 1, minHeight: 96, borderRadius: radius.lg, backgroundColor: colors.card, paddingVertical: space.md, alignItems: "center", justifyContent: "center", gap: space.sm, borderWidth: 1, borderColor: colors.border, ...shadow.lift },
        iconChip: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
        label: { fontSize: 14, fontWeight: "700", color: colors.text },
        off: { opacity: 0.45 },
      }),
    [colors]
  );
}

function usePrimaryStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: "row", gap: space.md },
        primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, borderRadius: radius.lg, paddingVertical: space.lg, ...shadow.card },
        primaryIcon: { fontSize: 20 },
        primaryText: { color: "#fff", fontSize: 17, fontWeight: "800" },
        secondaryRow: { flexDirection: "row", gap: space.md, marginTop: space.md },
        chip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: space.md, borderWidth: 1.5, borderColor: colors.border },
        chipText: { fontSize: 15, fontWeight: "700", color: colors.text },
        off: { opacity: 0.45 },
      }),
    [colors]
  );
}

function useSegmentedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        bar: { flexDirection: "row", backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: space.md, ...shadow.card },
        seg: { flex: 1, alignItems: "center", gap: 6, minHeight: 64, justifyContent: "center" },
        segLabel: { fontSize: 14, fontWeight: "700" },
        divider: { width: 1, backgroundColor: colors.border, marginVertical: 6 },
      }),
    [colors]
  );
}

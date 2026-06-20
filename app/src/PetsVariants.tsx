import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { radius, shadow, space } from "./theme";
import { useTheme } from "./ThemeContext";
import { deriveStatus } from "./petStatus";
import { PetAvatar } from "./PetAvatar";
import { Icon } from "./Icon";
import type { ActivityEvent, Pet } from "./types";

export type PetsVariant = "A" | "B" | "C";

interface Props {
  pets: Pet[];
  log: ActivityEvent[];
  activeId: string | null;
  onPick: (id: string) => void;
}

export function PetsSection({ variant, ...p }: Props & { variant: PetsVariant }) {
  if (variant === "A") return <PetsRows {...p} />;
  if (variant === "B") return <PetsVitals {...p} />;
  return <PetsRingTray {...p} />;
}

function PetPressable({
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
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      {children}
    </Pressable>
  );
}

/* A — Care rows: console-style, one full-width row per pet. */
function PetsRows({ pets, log, activeId, onPick }: Props) {
  const { colors } = useTheme();
  const styles = useVariantAStyles(colors);

  return (
    <View style={{ gap: space.sm }}>
      {pets.map((pet) => {
        const s = deriveStatus(pet, log);
        const c = tone(s.tone, colors);
        const active = pet.id === activeId;
        return (
          <PetPressable key={pet.id} onPress={() => onPick(pet.id)} style={[styles.row, active && { borderColor: colors.text }]}>
            <View style={[styles.accent, { backgroundColor: c }]} />
            <PetAvatar pet={pet} size={48} style={{ marginRight: space.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{pet.name}</Text>
              <Text style={styles.species}>{pet.species.toUpperCase()}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: toneSoft(s.tone, colors) }]}>
              <View style={[styles.dot, { backgroundColor: c }]} />
              <Text style={[styles.pillText, { color: c }]}>{s.label}</Text>
            </View>
          </PetPressable>
        );
      })}
    </View>
  );
}

/* B — Vitals cards: richer card with Fed / Water / Meds micro-indicators. */
function PetsVitals({ pets, log, activeId, onPick }: Props) {
  const { colors } = useTheme();
  const styles = useVariantBStyles(colors);

  return (
    <View style={styles.grid}>
      {pets.map((pet) => {
        const s = deriveStatus(pet, log);
        const c = tone(s.tone, colors);
        const active = pet.id === activeId;
        const mine = log.filter((e) => e.pet_name === pet.name && e.allowed);
        const fed = mine.some((e) => e.action === "feed");
        const watered = mine.some((e) => e.action === "water");
        const dosedOrNoMeds = pet.medications.length === 0 || mine.some((e) => e.action === "medicine");
        return (
          <PetPressable key={pet.id} onPress={() => onPick(pet.id)} style={[styles.card, active && { borderColor: colors.text }]}>
            <View style={[styles.topAccent, { backgroundColor: c }]} />
            <View style={styles.head}>
              <PetAvatar pet={pet} size={48} />
              <View>
                <Text style={styles.name}>{pet.name}</Text>
                <Text style={styles.species}>{pet.species}</Text>
              </View>
            </View>
            <View style={styles.vitals}>
              <Vital icon="feed" label="Fed" ok={fed} />
              <Vital icon="water" label="Water" ok={watered} />
              <Vital icon="medicine" label="Meds" ok={dosedOrNoMeds} warn={!dosedOrNoMeds} />
            </View>
          </PetPressable>
        );
      })}
    </View>
  );
}

function Vital({ icon, label, ok, warn }: { icon: "feed" | "water" | "medicine"; label: string; ok: boolean; warn?: boolean }) {
  const { colors } = useTheme();
  const styles = useVariantBStyles(colors);
  const c = warn ? colors.red : ok ? colors.green : colors.muted;
  return (
    <View style={styles.vital}>
      <Icon name={icon} size={22} color={c} />
      <Text style={[styles.vitalLabel, { color: c }]}>{label}</Text>
      <View style={[styles.vitalDot, { backgroundColor: c }]} />
    </View>
  );
}

/* C — Status-ring tray: horizontal scroll of avatars in activity-style rings. */
function PetsRingTray({ pets, log, activeId, onPick }: Props) {
  const { colors } = useTheme();
  const styles = useVariantCStyles(colors);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg, paddingVertical: space.xs }}>
      {pets.map((pet) => {
        const s = deriveStatus(pet, log);
        const c = tone(s.tone, colors);
        const active = pet.id === activeId;
        return (
          <PetPressable key={pet.id} onPress={() => onPick(pet.id)} style={styles.item}>
            <View style={[styles.ring, active && { borderColor: colors.text, borderWidth: 2.5 }]}>
              <PetAvatar pet={pet} size={80} />
            </View>
            <Text style={styles.name}>{pet.name}</Text>
            <Text style={[styles.status, { color: c }]}>{s.label}</Text>
          </PetPressable>
        );
      })}
    </ScrollView>
  );
}

function tone(t: "good" | "alert" | "muted", colors: ReturnType<typeof useTheme>["colors"]) {
  if (t === "alert") return colors.red;
  if (t === "good") return colors.green;
  return colors.muted;
}

function toneSoft(t: "good" | "alert" | "muted", colors: ReturnType<typeof useTheme>["colors"]) {
  if (t === "alert") return colors.redSoft;
  if (t === "good") return colors.greenSoft;
  return colors.border;
}

// Muted ring tones — a calm cue, not a stoplight. Strong color stays in the label.
function ringTone(t: "good" | "alert" | "muted", colors: ReturnType<typeof useTheme>["colors"]) {
  if (t === "alert") return "#E7AEA4";
  if (t === "good") return "#AAD4BB";
  return colors.borderStrong;
}

function useVariantAStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, paddingLeft: space.lg, overflow: "hidden", ...shadow.card },
        accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
        name: { fontSize: 16, fontWeight: "700", color: colors.text },
        species: { fontSize: 11, fontWeight: "700", color: colors.label, letterSpacing: 1, marginTop: 1 },
        pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
        dot: { width: 8, height: 8, borderRadius: 4 },
        pillText: { fontSize: 13, fontWeight: "700" },
      }),
    [colors]
  );
}

function useVariantBStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
        card: { flexGrow: 1, flexBasis: "45%", backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: space.md, paddingTop: space.lg, overflow: "hidden", ...shadow.card },
        topAccent: { position: "absolute", left: 0, right: 0, top: 0, height: 5 },
        head: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md },
        name: { fontSize: 16, fontWeight: "700", color: colors.text },
        species: { fontSize: 12, color: colors.muted, textTransform: "capitalize" },
        vitals: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.border, borderRadius: radius.md, padding: space.sm },
        vital: { alignItems: "center", gap: 3, flex: 1 },
        vitalLabel: { fontSize: 10, color: colors.muted, fontWeight: "600" },
        vitalDot: { width: 6, height: 6, borderRadius: 3, marginTop: 1 },
      }),
    [colors]
  );
}

function useVariantCStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        item: { alignItems: "center", width: 88 },
        ring: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 2, borderColor: colors.borderStrong, ...shadow.lift },
        name: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: space.sm },
        status: { fontSize: 11, fontWeight: "700", marginTop: 1, textAlign: "center" },
      }),
    [colors]
  );
}

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, space } from "./theme";
import type { Action, Pet } from "./types";

export type DispenseVariant = "1" | "2" | "3";

interface Props {
  pet: Pet | null;
  onDispense: (action: Action) => void;
}

const FEED = { action: "feed" as Action, icon: "🍽", label: "Feed", tint: colors.green, soft: colors.greenSoft };
const WATER = { action: "water" as Action, icon: "💧", label: "Water", tint: colors.blue, soft: colors.blueSoft };
const MED = { action: "medicine" as Action, icon: "💊", label: "Med", tint: colors.amber, soft: colors.amberSoft };
const ALL = [FEED, WATER, MED];

export function DispenseSection({ variant, ...p }: Props & { variant: DispenseVariant }) {
  if (variant === "1") return <TintedTiles {...p} />;
  if (variant === "2") return <PrimarySecondary {...p} />;
  return <Segmented {...p} />;
}

/* 1 — Tinted action tiles: each action gets its own soft tint + colored icon chip. */
function TintedTiles({ pet, onDispense }: Props) {
  const off = !pet;
  return (
    <View style={t.row}>
      {ALL.map((x) => (
        <Pressable key={x.action} disabled={off} onPress={() => onDispense(x.action)} style={[t.tile, off && t.off]}>
          <Text style={t.icon}>{x.icon}</Text>
          <Text style={t.label}>{x.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/* 2 — Primary + secondary: surface the recommended action big, the rest as chips. */
function PrimarySecondary({ pet, onDispense }: Props) {
  if (!pet) {
    return (
      <View style={t.row}>
        {ALL.map((x) => (
          <View key={x.action} style={[s.chip, t.off]}>
            <Text style={{ fontSize: 16 }}>{x.icon}</Text>
            <Text style={s.chipText}>{x.label}</Text>
          </View>
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
      <Pressable onPress={() => onDispense(primary.action)} style={[s.primary, { backgroundColor: primary.tint }]}>
        <Text style={s.primaryIcon}>{primary.icon}</Text>
        <Text style={s.primaryText}>{primaryLabel}</Text>
      </Pressable>
      <View style={s.secondaryRow}>
        {rest.map((x) => (
          <Pressable key={x.action} onPress={() => onDispense(x.action)} style={s.chip}>
            <Text style={{ fontSize: 16 }}>{x.icon}</Text>
            <Text style={s.chipText}>{x.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* 3 — Segmented bar: one unified rounded control, three segments. */
function Segmented({ pet, onDispense }: Props) {
  const off = !pet;
  return (
    <View style={[g.bar, off && t.off]}>
      {ALL.map((x, i) => (
        <React.Fragment key={x.action}>
          {i > 0 && <View style={g.divider} />}
          <Pressable disabled={off} onPress={() => onDispense(x.action)} style={g.seg}>
            <Text style={{ fontSize: 19 }}>{x.icon}</Text>
            <Text style={[g.segLabel, { color: x.tint }]}>{x.label}</Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

const t = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md },
  tile: { flex: 1, borderRadius: radius.lg, backgroundColor: "#FFFFFF", paddingVertical: 20, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(28,24,18,0.05)", ...shadow.lift },
  icon: { fontSize: 32 },
  label: { fontSize: 14, fontWeight: "700", color: colors.text },
  off: { opacity: 0.45 },
});

const s = StyleSheet.create({
  primary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: radius.lg, paddingVertical: 18, ...shadow.card },
  primaryIcon: { fontSize: 20 },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  secondaryRow: { flexDirection: "row", gap: space.md, marginTop: space.md },
  chip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#fff", borderRadius: radius.md, paddingVertical: 14, borderWidth: 1.5, borderColor: colors.border },
  chipText: { fontSize: 15, fontWeight: "700", color: colors.text },
});

const g = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: "#fff", borderRadius: radius.lg, paddingVertical: 14, ...shadow.card },
  seg: { flex: 1, alignItems: "center", gap: 6 },
  segLabel: { fontSize: 14, fontWeight: "700" },
  divider: { width: 1, backgroundColor: colors.border, marginVertical: 6 },
});

import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, space } from "./theme";
import { deriveStatus, petEmoji } from "./petStatus";
import type { ActivityEvent, Pet } from "./types";

export type PetsVariant = "A" | "B" | "C";

function tone(t: "good" | "alert" | "muted") {
  if (t === "alert") return colors.red;
  if (t === "good") return colors.green;
  return colors.muted;
}
function toneSoft(t: "good" | "alert" | "muted") {
  if (t === "alert") return colors.redSoft;
  if (t === "good") return colors.greenSoft;
  return "#F0ECE4";
}

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

/* A — Care rows: console-style, one full-width row per pet. */
function PetsRows({ pets, log, activeId, onPick }: Props) {
  return (
    <View style={{ gap: space.sm }}>
      {pets.map((pet) => {
        const s = deriveStatus(pet, log);
        const c = tone(s.tone);
        const active = pet.id === activeId;
        return (
          <Pressable key={pet.id} onPress={() => onPick(pet.id)} style={[a.row, active && a.rowActive]}>
            <View style={[a.accent, { backgroundColor: c }]} />
            <View style={a.avatar}>
              <Text style={a.emoji}>{petEmoji(pet.species)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={a.name}>{pet.name}</Text>
              <Text style={a.species}>{pet.species.toUpperCase()}</Text>
            </View>
            <View style={[a.pill, { backgroundColor: toneSoft(s.tone) }]}>
              <View style={[a.dot, { backgroundColor: c }]} />
              <Text style={[a.pillText, { color: c }]}>{s.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* B — Vitals cards: richer card with Fed / Water / Meds micro-indicators. */
function PetsVitals({ pets, log, activeId, onPick }: Props) {
  return (
    <View style={b.grid}>
      {pets.map((pet) => {
        const s = deriveStatus(pet, log);
        const c = tone(s.tone);
        const active = pet.id === activeId;
        const mine = log.filter((e) => e.pet_name === pet.name && e.allowed);
        const fed = mine.some((e) => e.action === "feed");
        const watered = mine.some((e) => e.action === "water");
        const dosedOrNoMeds = pet.medications.length === 0 || mine.some((e) => e.action === "medicine");
        return (
          <Pressable key={pet.id} onPress={() => onPick(pet.id)} style={[b.card, active && { borderColor: colors.text }]}>
            <View style={[b.topAccent, { backgroundColor: c }]} />
            <View style={b.head}>
              <View style={b.avatar}>
                <Text style={{ fontSize: 22 }}>{petEmoji(pet.species)}</Text>
              </View>
              <View>
                <Text style={b.name}>{pet.name}</Text>
                <Text style={b.species}>{pet.species}</Text>
              </View>
            </View>
            <View style={b.vitals}>
              <Vital icon="🍽" label="Fed" ok={fed} />
              <Vital icon="💧" label="Water" ok={watered} />
              <Vital icon="💊" label="Meds" ok={dosedOrNoMeds} warn={!dosedOrNoMeds} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Vital({ icon, label, ok, warn }: { icon: string; label: string; ok: boolean; warn?: boolean }) {
  const c = warn ? colors.red : ok ? colors.green : colors.muted;
  return (
    <View style={b.vital}>
      <Text style={{ fontSize: 15 }}>{icon}</Text>
      <Text style={b.vitalLabel}>{label}</Text>
      <View style={[b.vitalDot, { backgroundColor: c }]} />
    </View>
  );
}

/* C — Status-ring tray: horizontal scroll of avatars in activity-style rings. */
function PetsRingTray({ pets, log, activeId, onPick }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg, paddingVertical: 4, paddingHorizontal: space.xs, flexGrow: 1, justifyContent: "center" }}>
      {pets.map((pet) => {
        const s = deriveStatus(pet, log);
        const c = tone(s.tone);
        const active = pet.id === activeId;
        return (
          <Pressable key={pet.id} onPress={() => onPick(pet.id)} style={cc.item}>
            <View style={[cc.ring, { borderColor: c }, active && cc.ringActive]}>
              <View style={cc.avatar}>
                <Text style={{ fontSize: 30 }}>{petEmoji(pet.species)}</Text>
              </View>
            </View>
            <Text style={cc.name}>{pet.name}</Text>
            <Text style={[cc.status, { color: c }]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const a = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: radius.lg, padding: space.md, paddingLeft: space.lg, overflow: "hidden", ...shadow.card },
  rowActive: { borderWidth: 1.5, borderColor: colors.text },
  accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EFEAE2", alignItems: "center", justifyContent: "center", marginRight: space.md },
  emoji: { fontSize: 20 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  species: { fontSize: 11, fontWeight: "700", color: colors.label, letterSpacing: 1, marginTop: 1 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 13, fontWeight: "700" },
});

const b = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  card: { flexGrow: 1, flexBasis: "45%", backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: space.md, paddingTop: space.lg, overflow: "hidden", ...shadow.card },
  topAccent: { position: "absolute", left: 0, right: 0, top: 0, height: 5 },
  head: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: space.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFEAE2", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  species: { fontSize: 12, color: colors.muted, textTransform: "capitalize" },
  vitals: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#FAF7F1", borderRadius: radius.md, padding: space.sm },
  vital: { alignItems: "center", gap: 3, flex: 1 },
  vitalLabel: { fontSize: 10, color: colors.muted, fontWeight: "600" },
  vitalDot: { width: 6, height: 6, borderRadius: 3, marginTop: 1 },
});

const cc = StyleSheet.create({
  item: { alignItems: "center", width: 92 },
  ring: { width: 78, height: 78, borderRadius: 39, borderWidth: 3, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", ...shadow.card },
  ringActive: { borderWidth: 4 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#EFEAE2", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700", color: colors.text, marginTop: 8 },
  status: { fontSize: 11, fontWeight: "700", marginTop: 1, textAlign: "center" },
});

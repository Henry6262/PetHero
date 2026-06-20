import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { api } from "./src/api";
import { useBackend } from "./src/useBackend";
import { colors, radius, shadow, space } from "./src/theme";
import { deriveStatus, petEmoji } from "./src/petStatus";
import { PetsSection, type PetsVariant } from "./src/PetsVariants";
import { DispenseSection, type DispenseVariant } from "./src/DispenseVariants";
import type { Action, Pet } from "./src/types";

// Which Pets-section design to render (A = care rows, B = vitals cards, C = ring tray).
const PETS_VARIANT: PetsVariant = "C";
// Which Dispense control to render (1 = tinted tiles, 2 = primary+secondary, 3 = segmented).
const DISPENSE_VARIANT: DispenseVariant = "1";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <Home />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Home() {
  const backend = useBackend();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    api.pets().then(setPets).catch(() => {});
  }, [backend.connected]);

  const currentPetId = backend.detection?.pet_id ?? selected;
  const currentPet = pets.find((p) => p.id === currentPetId) ?? null;

  const simulate = useCallback(async (petId: string | null) => {
    setSelected(petId);
    setBusy(true);
    try {
      await api.setCurrentPet(petId);
      await api.process();
    } catch {}
    setBusy(false);
  }, []);

  const dispense = useCallback(
    async (action: Action) => {
      if (!currentPet) return;
      const med =
        action === "medicine" ? currentPet.medications[0]?.name : undefined;
      setBusy(true);
      try {
        await api.trigger(currentPet.id, action, med);
      } catch {}
      setBusy(false);
    },
    [currentPet]
  );

  const duePet = pets.find((p) => deriveStatus(p, backend.log).tone === "alert");

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: space.lg, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <Header
        connected={backend.connected}
        mode={backend.status?.mode ?? "demo"}
        agent={backend.status?.agent_backend ?? "rules"}
        alerts={duePet ? 1 : 0}
        onOpenDemo={() => setDemoOpen(true)}
      />

      {duePet && <AlertBanner pet={duePet} />}

      <LivePanel
        frame={backend.frame}
        watching={backend.detection?.present ? backend.detection.pet_name : null}
        confidence={backend.detection?.confidence ?? 0}
        busy={busy}
      />

      {backend.decision && (
        <ReasoningCard
          reasoning={backend.decision.reasoning}
          allowed={backend.lastEvent?.allowed ?? true}
          verdict={backend.lastEvent?.reason ?? ""}
          rule={backend.lastEvent?.rule ?? null}
        />
      )}

      <SectionLabel text="PETS" right="tap to simulate" />
      <PetsSection
        variant={PETS_VARIANT}
        pets={pets}
        log={backend.log}
        activeId={currentPetId}
        onPick={simulate}
      />
      <View style={{ height: space.xl }} />

      <SectionLabel text="DISPENSE NOW" right={currentPet ? `for ${currentPet.name}` : "pick a pet"} />
      <DispenseSection variant={DISPENSE_VARIANT} pet={currentPet} onDispense={dispense} />
    </ScrollView>

    <DemoDrawer
      visible={demoOpen}
      pets={pets}
      selected={selected}
      onPick={(id) => {
        simulate(id);
        setDemoOpen(false);
      }}
      onClose={() => setDemoOpen(false)}
    />
    </>
  );
}

/* ---------------- components ---------------- */

function Header({ connected, mode, agent, alerts, onOpenDemo }: { connected: boolean; mode: string; agent: string; alerts: number; onOpenDemo: () => void }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>PetHero</Text>
        <View style={styles.subRow}>
          <View style={[styles.dot, { backgroundColor: connected ? colors.green : colors.muted }]} />
          <Text style={styles.subText}>
            Arm · {mode === "live" ? "live" : "simulated"} · {agent === "mistral" ? "Mistral" : "rules"}
          </Text>
        </View>
      </View>
      <View style={styles.headerIcons}>
        <Pressable style={[styles.iconBtn, styles.iconBtnAccent]} onPress={onOpenDemo} hitSlop={8}>
          <Text style={styles.iconGlyph}>🐾</Text>
        </Pressable>
        <View style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>🔔</Text>
          {alerts > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alerts}</Text>
            </View>
          )}
        </View>
        <View style={styles.iconBtn}>
          <Text style={styles.iconGlyph}>⚙️</Text>
        </View>
      </View>
    </View>
  );
}

function AlertBanner({ pet }: { pet: Pet }) {
  const med = pet.medications[0];
  return (
    <View style={styles.alert}>
      <Text style={styles.alertEmoji}>💊</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.alertTitle}>
          {med ? `${cap(med.name)} due for ${pet.name}` : `${pet.name} needs attention`}
        </Text>
        <Text style={styles.alertSub}>tap {pet.name}'s tile to dispense</Text>
      </View>
      <Text style={styles.alertChevron}>→</Text>
    </View>
  );
}

function LivePanel({ frame, watching, confidence, busy }: { frame: string | null; watching: string | null; confidence: number; busy: boolean }) {
  return (
    <View style={styles.live}>
      {frame ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${frame}` }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}
      <CornerBrackets active={!!watching} />
      <View style={styles.liveTopRow}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
        <Text style={styles.liveCam}>cam-01</Text>
      </View>
      <View style={styles.liveBottom}>
        {busy && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
        <Text style={styles.liveStatus}>
          {watching ? `Watching · ${watching} (${Math.round(confidence * 100)}%)` : "Watching · no pet at the bowl"}
        </Text>
      </View>
    </View>
  );
}

function CornerBrackets({ active }: { active: boolean }) {
  const c = active ? colors.green : "rgba(255,255,255,0.22)";
  return (
    <>
      <View style={[styles.bracket, styles.brTL, { borderColor: c }]} />
      <View style={[styles.bracket, styles.brTR, { borderColor: c }]} />
      <View style={[styles.bracket, styles.brBL, { borderColor: c }]} />
      <View style={[styles.bracket, styles.brBR, { borderColor: c }]} />
    </>
  );
}

function ReasoningCard({ reasoning, allowed, verdict, rule }: { reasoning: string; allowed: boolean; verdict: string; rule: string | null }) {
  const tone = allowed ? colors.green : colors.red;
  const bg = allowed ? colors.greenSoft : colors.redSoft;
  return (
    <View style={[styles.reason, { borderColor: tone }]}>
      <View style={styles.reasonHead}>
        <Text style={styles.reasonKicker}>AGENT REASONING</Text>
        <View style={[styles.verdictPill, { backgroundColor: bg }]}>
          <Text style={[styles.verdictText, { color: tone }]}>
            {allowed ? "DISPENSED" : `BLOCKED${rule ? ` · ${rule}` : ""}`}
          </Text>
        </View>
      </View>
      <Text style={styles.reasonBody}>{reasoning}</Text>
      {!!verdict && <Text style={[styles.reasonVerdict, { color: tone }]}>{verdict}</Text>}
    </View>
  );
}

function DemoDrawer({ visible, pets, selected, onPick, onClose }: { visible: boolean; pets: Pet[]; selected: string | null; onPick: (id: string | null) => void; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.drawerBackdrop} onPress={onClose}>
        <Pressable style={styles.drawerSheet} onPress={() => {}}>
          <View style={styles.drawerHandle} />
          <Text style={styles.drawerKicker}>DEMO</Text>
          <Text style={styles.drawerTitle}>Simulate a pet walking up to the bowl</Text>
          <View style={styles.demoChips}>
            {pets.map((p) => (
              <Chip key={p.id} active={selected === p.id} onPress={() => onPick(p.id)}>
                {petEmoji(p.species)} {p.name}
              </Chip>
            ))}
            <Chip active={selected === null} danger onPress={() => onPick(null)}>
              ? Unknown
            </Chip>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chip({ children, active, danger, onPress }: { children: React.ReactNode; active?: boolean; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { borderColor: colors.text, backgroundColor: "#fff" },
        danger && { borderColor: colors.red },
      ]}
    >
      <Text style={[styles.chipText, danger && { color: colors.red }]}>{children}</Text>
    </Pressable>
  );
}

function PetCard({ pet, active, status, onPress }: { pet: Pet; active: boolean; status: ReturnType<typeof deriveStatus>; onPress: () => void }) {
  const toneColor = status.tone === "alert" ? colors.red : status.tone === "good" ? colors.green : colors.muted;
  return (
    <Pressable onPress={onPress} style={[styles.petCard, active && { borderColor: colors.text }]}>
      <View style={styles.avatar}>
        <Text style={{ fontSize: 22 }}>{petEmoji(pet.species)}</Text>
      </View>
      <Text style={styles.petName}>{pet.name}</Text>
      <View style={styles.subRow}>
        <View style={[styles.dot, { backgroundColor: toneColor }]} />
        <Text style={[styles.petStatus, { color: toneColor }]}>{status.label}</Text>
      </View>
    </Pressable>
  );
}

function DispenseCard({ emoji, label, tint, disabled, onPress }: { emoji: string; label: string; tint: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.dispenseCard, disabled && { opacity: 0.4 }]}>
      <Text style={styles.dispenseEmoji}>{emoji}</Text>
      <Text style={[styles.dispenseLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

function SectionLabel({ text, right }: { text: string; right?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{text}</Text>
      {right && <Text style={styles.sectionRight}>{right}</Text>}
    </View>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screen },
  screen: { flex: 1, backgroundColor: colors.screen },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg },
  brand: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
  subRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  subText: { fontSize: 13, color: colors.muted },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...shadow.card },
  iconBtnAccent: { backgroundColor: colors.amberSoft, borderWidth: 1.5, borderColor: colors.amber },
  iconGlyph: { fontSize: 16 },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  alert: { flexDirection: "row", alignItems: "center", backgroundColor: colors.redSoft, borderRadius: radius.lg, padding: space.md, marginBottom: space.lg, gap: 10 },
  alertEmoji: { fontSize: 20 },
  alertTitle: { color: colors.red, fontWeight: "700", fontSize: 15 },
  alertSub: { color: "#B4736B", fontSize: 12, marginTop: 2 },
  alertChevron: { color: colors.red, fontSize: 18, fontWeight: "700" },

  live: { height: 200, borderRadius: radius.lg, backgroundColor: colors.live, overflow: "hidden", marginBottom: space.md, justifyContent: "space-between", padding: space.md },
  liveTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  liveTagText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  liveCam: { color: colors.liveText, fontSize: 11 },
  liveBottom: { flexDirection: "row", alignItems: "center" },
  liveStatus: { color: "#EAE8E3", fontSize: 13 },

  bracket: { position: "absolute", width: 26, height: 26 },
  brTL: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  brTR: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  brBL: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  brBR: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },

  reason: { backgroundColor: "#fff", borderRadius: radius.lg, borderLeftWidth: 4, padding: space.md, marginBottom: space.lg, ...shadow.card },
  reasonHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reasonKicker: { fontSize: 11, fontWeight: "700", color: colors.label, letterSpacing: 1 },
  verdictPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  verdictText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  reasonBody: { color: colors.text, fontSize: 15, lineHeight: 21 },
  reasonVerdict: { fontSize: 13, marginTop: 6, fontWeight: "600" },

  drawerBackdrop: { flex: 1, backgroundColor: "rgba(20,16,10,0.35)", justifyContent: "flex-end" },
  drawerSheet: { backgroundColor: colors.screen, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: space.xl, paddingBottom: 40 },
  drawerHandle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: space.lg },
  drawerKicker: { fontSize: 11, fontWeight: "800", color: colors.amber, letterSpacing: 1.2, marginBottom: 4 },
  drawerTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: space.lg },
  demoChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#fff" },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.text },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm },
  section: { fontSize: 12, fontWeight: "700", color: colors.label, letterSpacing: 1.2 },
  sectionRight: { fontSize: 12, color: colors.muted },

  petGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginBottom: space.xl },
  petCard: { flexGrow: 1, flexBasis: "45%", backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: space.md, ...shadow.card },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EFEAE2", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  petName: { fontSize: 16, fontWeight: "700", color: colors.text },
  petStatus: { fontSize: 13, fontWeight: "600" },

  dispenseRow: { flexDirection: "row", gap: space.md },
  dispenseCard: { flex: 1, aspectRatio: 1, backgroundColor: "#fff", borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 8, ...shadow.card },
  dispenseEmoji: { fontSize: 26 },
  dispenseLabel: { fontSize: 14, fontWeight: "700" },
});

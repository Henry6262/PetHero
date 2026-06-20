import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

import { api } from "./src/api";
import { useBackend } from "./src/useBackend";
import { radius, shadow, space } from "./src/theme";
import { ThemeProvider, useTheme } from "./src/ThemeContext";
import { deriveStatus } from "./src/petStatus";
import { PetAvatar } from "./src/PetAvatar";
import { PetsSection, type PetsVariant } from "./src/PetsVariants";
import { DispenseSection, type DispenseVariant } from "./src/DispenseVariants";
import { AgentPanel } from "./src/AgentPanel";
import { Icon } from "./src/Icon";
import { SEED_PETS } from "./src/seed";
import type { Action, Pet } from "./src/types";

// Which Pets-section design to render (A = care rows, B = vitals cards, C = ring tray).
const PETS_VARIANT: PetsVariant = "C";
// Which Dispense control to render (1 = tinted tiles, 2 = primary+secondary, 3 = segmented).
const DISPENSE_VARIANT: DispenseVariant = "1";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(colors);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Home />
    </SafeAreaView>
  );
}

function Home() {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  const backend = useBackend();
  const [pets, setPets] = useState<Pet[]>(SEED_PETS);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);

  useEffect(() => {
    api.pets().then((p) => p.length && setPets(p)).catch(() => {});
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
    async (action: Action, petId?: string) => {
      const targetId = petId ?? currentPet?.id;
      if (!targetId) {
        setPendingAction(action);
        setDemoOpen(true);
        return;
      }
      const target = pets.find((p) => p.id === targetId);
      if (!target) return;
      const med = action === "medicine" ? target.medications[0]?.name : undefined;
      Vibration.vibrate(8);
      setBusy(true);
      try {
        await api.trigger(target.id, action, med);
      } catch {}
      setBusy(false);
    },
    [currentPet, pets]
  );

  const handleDemoPick = useCallback(
    (id: string | null) => {
      simulate(id);
      setDemoOpen(false);
      if (pendingAction && id) {
        const action = pendingAction;
        setPendingAction(null);
        dispense(action, id);
      }
    },
    [pendingAction, simulate, dispense]
  );

  const duePet = pets.find((p) => deriveStatus(p, backend.log).tone === "alert");

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          connected={backend.connected}
          mode={backend.status?.mode ?? "demo"}
          agent={backend.status?.agent_backend ?? "rules"}
          alerts={duePet ? 1 : 0}
          onOpenDemo={() => setDemoOpen(true)}
        />

        <LivePanel
          frame={backend.frame}
          watching={backend.detection?.present ? backend.detection.pet_name : null}
          confidence={backend.detection?.confidence ?? 0}
          busy={busy}
        />

        {duePet && <AlertBanner pet={duePet} />}

        <AgentPanel
          decision={backend.decision}
          lastEvent={backend.lastEvent}
          log={backend.log}
          pets={pets}
        />

        <Separator />

        <SectionLabel text="PETS" right="tap to simulate" />
        <PetsSection
          variant={PETS_VARIANT}
          pets={pets}
          log={backend.log}
          activeId={currentPetId}
          onPick={simulate}
        />

        <Separator />

        <SectionLabel text="DISPENSE NOW" right={currentPet ? `for ${currentPet.name}` : "pick a pet"} />
        <DispenseSection variant={DISPENSE_VARIANT} pet={currentPet} onDispense={dispense} />
      </ScrollView>

      <DemoDrawer
        visible={demoOpen}
        pets={pets}
        selected={selected}
        onPick={handleDemoPick}
        onClose={() => setDemoOpen(false)}
      />
    </>
  );
}

/* ---------------- components ---------------- */

function Header({ connected, mode, agent, alerts, onOpenDemo }: { connected: boolean; mode: string; agent: string; alerts: number; onOpenDemo: () => void }) {
  const { colors, isDark, toggle } = useTheme();
  const styles = useThemedStyles(colors);

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
        <Pressable style={styles.iconBtn} onPress={onOpenDemo} hitSlop={8}>
          <Ionicons name="paw" size={22} color={colors.text} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={toggle} hitSlop={8}>
          <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={colors.text} />
        </Pressable>
        <View style={styles.iconBtn}>
          <Ionicons name="notifications" size={22} color={colors.text} />
          {alerts > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alerts}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function AlertBanner({ pet }: { pet: Pet }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  const med = pet.medications[0];
  return (
    <View style={styles.alert}>
      <Icon name="medicine" size={24} color={colors.red} />
      <View style={{ flex: 1 }}>
        <Text style={styles.alertTitle}>
          {med ? `${cap(med.name)} due for ${pet.name}` : `${pet.name} needs attention`}
        </Text>
        <Text style={styles.alertSub}>tap {pet.name}'s tile to dispense</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.red} />
    </View>
  );
}

function LivePanel({ frame, watching, confidence, busy }: { frame: string | null; watching: string | null; confidence: number; busy: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  return (
    <View style={styles.live}>
      {frame ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${frame}` }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          resizeMode="cover"
        />
      ) : (
        <Image
          source={require("./assets/live-preview.png")}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          resizeMode="contain"
        />
      )}
      <View style={styles.liveScrim} />
      <CornerBrackets active={!!watching} />
      <View style={styles.liveTopRow}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
        <Text style={styles.liveCam}>cam-01</Text>
      </View>
      <View style={styles.liveBottom}>
        {busy && <ActivityIndicator color="#fff" style={{ marginRight: space.sm }} />}
        <Text style={styles.liveStatus}>
          {watching ? `Watching · ${watching} (${Math.round(confidence * 100)}%)` : "Watching · no pet at the bowl"}
        </Text>
      </View>
    </View>
  );
}

function Separator() {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={["transparent", colors.greenSoft, "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ height: 1.5, borderRadius: 1, marginVertical: space.lg }}
    />
  );
}

function CornerBrackets({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
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

function DemoDrawer({ visible, pets, selected, onPick, onClose }: { visible: boolean; pets: Pet[]; selected: string | null; onPick: (id: string | null) => void; onClose: () => void }) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(colors);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 42, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <BlurView intensity={24} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <Pressable
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? "rgba(0,0,0,0.55)" : "rgba(20,16,10,0.38)" },
            ]}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={[styles.drawerSheet, { transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={onClose} style={styles.drawerHandleBar}>
            <View style={styles.drawerHandle} />
          </Pressable>
          <Text style={styles.drawerKicker}>DEMO</Text>
          <Text style={styles.drawerTitle}>Simulate a pet walking up to the bowl</Text>
          <View style={styles.demoChips}>
            {pets.map((p) => (
              <Chip
                key={p.id}
                active={selected === p.id}
                onPress={() => onPick(p.id)}
                leading={<PetAvatar pet={p} size={22} />}
              >
                {p.name}
              </Chip>
            ))}
            <Chip active={selected === null} danger onPress={() => onPick(null)}>
              ? Unknown
            </Chip>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Chip({ children, active, danger, onPress, leading }: { children: React.ReactNode; active?: boolean; danger?: boolean; onPress: () => void; leading?: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && { borderColor: colors.text, backgroundColor: colors.card },
        danger && { borderColor: colors.red },
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
      ]}
    >
      {leading}
      <Text style={[styles.chipText, danger && { color: colors.red }]}>{children}</Text>
    </Pressable>
  );
}

function PetCard({ pet, active, status, onPress }: { pet: Pet; active: boolean; status: ReturnType<typeof deriveStatus>; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  const toneColor = status.tone === "alert" ? colors.red : status.tone === "good" ? colors.green : colors.muted;
  return (
    <Pressable onPress={onPress} style={[styles.petCard, active && { borderColor: colors.text }]}>
      <PetAvatar pet={pet} size={44} style={{ marginBottom: space.sm }} />
      <Text style={styles.petName}>{pet.name}</Text>
      <View style={styles.subRow}>
        <View style={[styles.dot, { backgroundColor: toneColor }]} />
        <Text style={[styles.petStatus, { color: toneColor }]}>{status.label}</Text>
      </View>
    </Pressable>
  );
}

function SectionLabel({ text, right }: { text: string; right?: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
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

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.screen },
        screen: { flex: 1, backgroundColor: colors.screen },

        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg },
        brand: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -0.5 },
        subRow: { flexDirection: "row", alignItems: "center", marginTop: space.xs },
        subText: { fontSize: 13, color: colors.muted },
        dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
        headerIcons: { flexDirection: "row", gap: space.sm },
        iconBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          ...shadow.card,
        },
        badge: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
        badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

        alert: { flexDirection: "row", alignItems: "center", backgroundColor: colors.redSoft, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: space.lg, marginBottom: space.lg, gap: space.md },
        alertTitle: { color: colors.red, fontWeight: "700", fontSize: 18 },
        alertSub: { color: colors.muted, fontSize: 13, marginTop: space.xs },

        live: { height: 220, borderRadius: radius.lg, backgroundColor: colors.live, marginBottom: space.md, justifyContent: "space-between", padding: space.md, overflow: "hidden" },
        liveScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.lg, backgroundColor: "rgba(18,14,8,0.28)" },
        liveTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        liveTag: { flexDirection: "row", alignItems: "center", gap: 6 },
        liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
        liveTagText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
        liveCam: { color: colors.liveText, fontSize: 11 },
        liveBottom: { flexDirection: "row", alignItems: "center" },
        liveStatus: { color: "#EAE8E3", fontSize: 13 },

        bracket: { position: "absolute", width: 38, height: 38 },
        brTL: { top: -4, left: -4, borderTopWidth: 6, borderLeftWidth: 6, borderTopLeftRadius: radius.lg + 4 },
        brTR: { top: -4, right: -4, borderTopWidth: 6, borderRightWidth: 6, borderTopRightRadius: radius.lg + 4 },
        brBL: { bottom: -4, left: -4, borderBottomWidth: 6, borderLeftWidth: 6, borderBottomLeftRadius: radius.lg + 4 },
        brBR: { bottom: -4, right: -4, borderBottomWidth: 6, borderRightWidth: 6, borderBottomRightRadius: radius.lg + 4 },

        drawerSheet: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.sheet,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: space.lg,
          paddingBottom: space.xxl,
          ...shadow.lift,
        },
        drawerHandleBar: { alignSelf: "center", paddingVertical: space.sm, paddingHorizontal: space.lg, marginBottom: space.sm },
        drawerHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
        drawerKicker: { fontSize: 11, fontWeight: "800", color: colors.amber, letterSpacing: 1.2, marginBottom: space.xs },
        drawerTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: space.lg },
        demoChips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
        chip: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.card },
        chipText: { fontSize: 14, fontWeight: "600", color: colors.text },

        sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: space.md },
        section: { fontSize: 12, fontWeight: "700", color: colors.label, letterSpacing: 1.2 },
        sectionRight: { fontSize: 12, color: colors.muted },

        petGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginBottom: space.xl },
        petCard: { flexGrow: 1, flexBasis: "45%", backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: space.md, ...shadow.card },
        avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: space.sm },
        petName: { fontSize: 16, fontWeight: "700", color: colors.text },
        petStatus: { fontSize: 13, fontWeight: "600" },
      }),
    [colors]
  );
}

import React, { useEffect, useRef } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PetAvatar } from "./PetAvatar";
import { radius, shadow, space } from "./theme";
import type { Pet } from "./types";

interface LooksmaxHubProps {
  pet: Pet | null;
  onGenerate?: () => void;
  onRetry?: () => void;
}

// Palette straight from the BrainMax Hub mockup (warm, light theme).
const INK = "#1B1A17";
const CREAM = "#F4F1EA";
const MUTED_DARK = "#9A968D";
const GREEN = "#8FCBA8";
const LABEL = "#A39A88";
const SUB = "#98938A";
const LOCK_BG = "#EFEAE0";
const TILE_BORDER = "#ECE7DE";
const CONNECT = "#D8D0C2";

const SKILLS = [
  { g: "G1", name: "Foundation", state: "done", detail: "✓ 4/4" },
  { g: "G2", name: "Connection", state: "current", detail: "3/5" },
  { g: "G3", name: "", state: "locked", detail: "" },
  { g: "G4", name: "", state: "locked", detail: "" },
  { g: "G5", name: "", state: "locked", detail: "" },
] as const;

const STATS = [
  { icon: "flame" as const, value: "12", label: "streak" },
  { icon: "locate" as const, value: "87%", label: "accuracy" },
  { icon: "trophy" as const, value: "8", label: "badges" },
  { icon: "time-outline" as const, value: "45m", label: "this wk" },
];

// The BrainMax Hub — the "Brainmax your cat" training screen.
export function LooksmaxHub({ pet, onGenerate }: LooksmaxHubProps) {
  const name = pet?.name ?? "your cat";

  // gentle float on the hero avatar
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1700, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
      {/* header */}
      <View style={s.headerRow}>
        <View style={s.titleRow}>
          <Text style={{ fontSize: 22 }}>🧠</Text>
          <Text style={s.title}>BrainMax</Text>
        </View>
        <View style={s.helpBtn}>
          <Ionicons name="help" size={18} color="#6E695F" />
        </View>
      </View>

      {/* HERO — rating */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.heroLabel}>BRAINMAX RATING</Text>
            <Text style={s.rating}>2,340</Text>
            <View style={s.badgeRow}>
              <View style={s.tier}>
                <Ionicons name="medal" size={13} color={CREAM} />
                <Text style={s.tierText}>Gold III</Text>
              </View>
              <View style={s.delta}>
                <Ionicons name="trending-up" size={13} color={GREEN} />
                <Text style={s.deltaText}>+180 / wk</Text>
              </View>
            </View>
          </View>
          <Animated.View style={[s.heroAvatar, { transform: [{ translateY: float }] }]}>
            {pet ? <PetAvatar pet={pet} size={56} /> : <Text style={{ fontSize: 30 }}>🐱</Text>}
          </Animated.View>
        </View>
        <View style={{ marginTop: space.md }}>
          <View style={s.progRow}>
            <Text style={s.progText}>{name} · Trainer Lv.7</Text>
            <Text style={s.progText}>660 to Lv.8</Text>
          </View>
          <View style={s.progTrack}>
            <View style={[s.progFill, { width: "64%" }]} />
          </View>
        </View>
      </View>

      {/* DAILY CHALLENGE */}
      <View style={s.sectionRow}>
        <Text style={s.sectionLabel}>DAILY CHALLENGE</Text>
        <Text style={s.countdown}>06:12:40</Text>
      </View>
      <View style={s.challenge}>
        <View style={s.challengeHead}>
          <View style={s.challengeIcon}>
            <Ionicons name="sync" size={22} color={INK} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.challengeTitle}>Teach {name} to Spin</Text>
            <Text style={s.challengeSub}>150 pts · ×1.5 bonus · keeps your streak</Text>
          </View>
        </View>
        <Pressable
          onPress={onGenerate}
          style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="play" size={17} color={CREAM} />
          <Text style={s.startText}>Start training session</Text>
        </Pressable>
      </View>

      {/* SKILL TREE */}
      <Text style={[s.sectionLabel, { marginTop: space.lg, marginBottom: space.sm }]}>
        CURRICULUM · SKILL TREE
      </Text>
      <View style={s.tree}>
        {SKILLS.map((n, i) => (
          <React.Fragment key={n.g}>
            {i > 0 && <View style={[s.connector, { backgroundColor: SKILLS[i - 1].state === "done" ? INK : CONNECT }]} />}
            <View
              style={[
                s.node,
                n.state === "done" && { backgroundColor: INK },
                n.state === "current" && { backgroundColor: "#fff", borderWidth: 2, borderColor: INK },
                n.state === "locked" && { backgroundColor: LOCK_BG },
              ]}
            >
              <Text style={[s.nodeG, { color: n.state === "done" ? CREAM : n.state === "locked" ? LABEL : INK }]}>{n.g}</Text>
              {n.state === "locked" ? (
                <Ionicons name="lock-closed" size={14} color={LABEL} />
              ) : (
                <>
                  <Text style={[s.nodeName, { color: n.state === "done" ? MUTED_DARK : SUB }]}>{n.name}</Text>
                  <Text style={[s.nodeDetail, { color: n.state === "done" ? CREAM : INK }]}>{n.detail}</Text>
                </>
              )}
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* QUICK STATS */}
      <Text style={[s.sectionLabel, { marginTop: space.lg, marginBottom: space.sm }]}>QUICK STATS</Text>
      <View style={s.statsRow}>
        {STATS.map((st) => (
          <View key={st.label} style={s.statTile}>
            <Ionicons name={st.icon} size={19} color={INK} />
            <Text style={s.statValue}>{st.value}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>
      <View style={[s.statsRow, { marginTop: space.sm }]}>
        <Pressable style={({ pressed }) => [s.wideBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="podium" size={17} color={INK} />
          <Text style={s.wideBtnText}>Leaderboard</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.wideBtn, pressed && { opacity: 0.85 }]}>
          <Ionicons name="trophy" size={17} color={INK} />
          <Text style={s.wideBtnText}>Badges</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingTop: space.sm, paddingBottom: 140 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4, color: INK },
  helpBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", ...shadow.card },

  hero: { backgroundColor: INK, borderRadius: 26, padding: 20, paddingTop: 22 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { fontSize: 11, letterSpacing: 1.4, color: MUTED_DARK, fontWeight: "600", fontVariant: ["tabular-nums"] },
  rating: { fontSize: 56, fontWeight: "800", color: CREAM, lineHeight: 58, marginTop: 4, letterSpacing: -1 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  tier: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(244,241,234,0.14)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 30 },
  tierText: { fontSize: 12, fontWeight: "700", color: CREAM },
  delta: { flexDirection: "row", alignItems: "center", gap: 3 },
  deltaText: { fontSize: 12, fontWeight: "600", color: GREEN },
  heroAvatar: { width: 62, height: 62, borderRadius: 18, backgroundColor: "#2a2723", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  progRow: { flexDirection: "row", justifyContent: "space-between" },
  progText: { fontSize: 11, color: MUTED_DARK, fontVariant: ["tabular-nums"] },
  progTrack: { height: 7, backgroundColor: "rgba(244,241,234,0.16)", borderRadius: 4, marginTop: 5, overflow: "hidden" },
  progFill: { height: "100%", backgroundColor: CREAM, borderRadius: 4 },

  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.lg, marginBottom: space.sm },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: LABEL, letterSpacing: 0.9 },
  countdown: { fontSize: 12, color: INK, fontVariant: ["tabular-nums"], fontWeight: "600" },

  challenge: { backgroundColor: "#fff", borderWidth: 2, borderColor: INK, borderRadius: 20, padding: 15 },
  challengeHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  challengeIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: CREAM, alignItems: "center", justifyContent: "center" },
  challengeTitle: { fontSize: 17, fontWeight: "800", color: INK },
  challengeSub: { fontSize: 12, color: SUB, marginTop: 2 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 13, backgroundColor: INK, borderRadius: 13, paddingVertical: 13 },
  startText: { fontSize: 15, fontWeight: "700", color: CREAM },

  tree: { flexDirection: "row", alignItems: "center" },
  connector: { width: 12, height: 2 },
  node: { flex: 1, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 4, alignItems: "center", minHeight: 56, justifyContent: "center" },
  nodeG: { fontSize: 13, fontWeight: "800" },
  nodeName: { fontSize: 9, marginTop: 1 },
  nodeDetail: { fontSize: 10, marginTop: 2, fontVariant: ["tabular-nums"] },

  statsRow: { flexDirection: "row", gap: 9 },
  statTile: { flex: 1, backgroundColor: "#fff", borderWidth: 1.5, borderColor: TILE_BORDER, borderRadius: 14, paddingVertical: 11, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: INK, marginTop: 2, fontVariant: ["tabular-nums"] },
  statLabel: { fontSize: 9, color: SUB, marginTop: 1 },
  wideBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#fff", borderWidth: 1.5, borderColor: TILE_BORDER, borderRadius: 14, paddingVertical: 13 },
  wideBtnText: { fontSize: 14, fontWeight: "700", color: INK },
});

import React from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { radius, space } from "../theme";

interface LivePanelProps {
  frame: string | null;
  watching: string | null;
  confidence: number;
  busy: boolean;
  candyClass: string | null;
  candyConfidence: number;
}

export function LivePanel({ frame, watching, confidence, busy, candyClass, candyConfidence }: LivePanelProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.live, { backgroundColor: colors.live }]}>
      {frame ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${frame}` }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          resizeMode="cover"
        />
      ) : (
        <>
          <Image
            source={require("../../assets/live-preview.png")}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, opacity: 0.55 }]}
            resizeMode="cover"
          />
          <View style={styles.liveFallback}>
            <Ionicons name="videocam-off" size={40} color="rgba(255,255,255,0.65)" />
            <Text style={styles.liveFallbackText}>Camera offline</Text>
          </View>
        </>
      )}
      <View style={styles.liveScrim} />
      <CornerBrackets active={!!watching} />
      <View style={styles.liveTopRow}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
        {candyClass && (
          <View style={styles.candyBadge}>
            <Text style={styles.candyBadgeText}>
              {candyClass} {Math.round(candyConfidence * 100)}%
            </Text>
          </View>
        )}
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

function CornerBrackets({ active }: { active: boolean }) {
  const { colors } = useTheme();
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

const styles = StyleSheet.create({
  live: { height: 280, borderRadius: 18, marginBottom: 8, justifyContent: "space-between", padding: 16, overflow: "hidden" },
  liveScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18, backgroundColor: "rgba(10,8,4,0.48)" },
  liveTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E5372B" },
  liveTagText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  candyBadge: { backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 30, paddingHorizontal: 10, paddingVertical: 4 },
  candyBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  liveBottom: { flexDirection: "row", alignItems: "center" },
  liveStatus: { color: "#EAE8E3", fontSize: 13 },
  liveFallback: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 8 },
  liveFallbackText: { color: "rgba(255,255,255,0.75)", fontSize: 17, fontWeight: "700" },
  bracket: { position: "absolute", width: 38, height: 38 },
  brTL: { top: -4, left: -4, borderTopWidth: 6, borderLeftWidth: 6, borderTopLeftRadius: 22 },
  brTR: { top: -4, right: -4, borderTopWidth: 6, borderRightWidth: 6, borderTopRightRadius: 22 },
  brBL: { bottom: -4, left: -4, borderBottomWidth: 6, borderLeftWidth: 6, borderBottomLeftRadius: 22 },
  brBR: { bottom: -4, right: -4, borderBottomWidth: 6, borderRightWidth: 6, borderBottomRightRadius: 22 },
});

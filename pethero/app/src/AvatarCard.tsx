import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import { PetAvatar } from "./PetAvatar";
import { radius, shadow, space } from "./theme";
import type { Pet, PetStats } from "./types";

interface AvatarCardProps {
  pet: Pet;
  onGenerate?: () => void;
  onRetry?: () => void;
  onView3D?: () => void;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Text style={{ width: 70, fontSize: 12, fontWeight: "600", color: colors.muted }}>{label}</Text>
      <View style={{ flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: "hidden" }}>
        <View style={{ width: `${clamp(value)}%`, height: "100%", borderRadius: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

function QuickStat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string | number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: space.sm, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 2, fontVariant: ["tabular-nums"] }}>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.muted, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

export function AvatarCard({ pet, onGenerate, onRetry, onView3D }: AvatarCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);

  const stats: PetStats = pet.stats ?? {
    hunger: 70,
    hydration: 60,
    health: 90,
    happiness: 75,
    looks: 45,
    level: 1,
    xp: 120,
    xp_to_next: 500,
    streak_days: 3,
    rating: 1240,
    tier: "Silver II",
  };

  const xpPct = Math.min(100, Math.round((stats.xp / stats.xp_to_next) * 100));

  const renderAvatar = () => {
    if (!pet.avatar || pet.avatar.status === "pending") {
      return (
        <Pressable onPress={onGenerate} style={styles.avatarPlaceholder}>
          <PetAvatar pet={pet} size={54} />
          <Text style={styles.generateText}>Generate 3D avatar</Text>
        </Pressable>
      );
    }

    if (pet.avatar.status === "generating") {
      return (
        <View style={styles.avatarPlaceholder}>
          <PetAvatar pet={pet} size={54} />
          <Text style={styles.generateText}>Sculpting… {pet.avatar.progress}%</Text>
        </View>
      );
    }

    if (pet.avatar.status === "failed") {
      return (
        <Pressable onPress={onRetry} style={styles.avatarPlaceholder}>
          <Ionicons name="refresh" size={28} color={colors.red} />
          <Text style={[styles.generateText, { color: colors.red }]}>Retry</Text>
        </Pressable>
      );
    }

    return (
      <Pressable onPress={onView3D} style={styles.avatarPlaceholder}>
        <PetAvatar pet={pet} size={54} />
        <View style={styles.badge3d}>
          <Text style={styles.badge3dText}>3D</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>LOOKSMAX RATING</Text>
            <Text style={styles.rating}>{stats.rating.toLocaleString("en-US")}</Text>
            <View style={styles.heroBadges}>
              <View style={styles.tierBadge}>
                <Ionicons name="trophy" size={12} color="#1B1A17" />
                <Text style={styles.tierText}>{stats.tier}</Text>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: "rgba(244,241,234,0.14)" }]}>
                <Ionicons name="trending-up" size={12} color="#8FCBA8" />
                <Text style={styles.trendText}>+180 / wk</Text>
              </View>
            </View>
          </View>
          <View style={styles.avatarWrap}>{renderAvatar()}</View>
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.levelText}>
            {pet.name} · Care Lv.{stats.level}
          </Text>
          <Text style={styles.levelText}>{stats.xp_to_next - stats.xp} to Lv.{stats.level + 1}</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
        </View>
      </View>

      <View style={styles.statsCard}>
        <StatBar label="Hunger" value={stats.hunger} color="#E5372B" />
        <StatBar label="Hydration" value={stats.hydration} color="#3BA0E3" />
        <StatBar label="Health" value={stats.health} color="#16A34A" />
        <StatBar label="Happiness" value={stats.happiness} color="#F0A33C" />
        <StatBar label="Looks" value={stats.looks} color="#C98A2B" />
      </View>

      <View style={styles.quickStats}>
        <QuickStat icon="flame" value={stats.streak_days} label="streak" />
        <QuickStat icon="heart" value={`${clamp(stats.happiness)}%`} label="mood" />
        <QuickStat icon="paw" value={stats.level} label="level" />
        <QuickStat icon="time" value="45m" label="this wk" />
      </View>
    </View>
  );
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      gap: space.md,
      marginTop: space.sm,
    },
    hero: {
      backgroundColor: "#1B1A17",
      borderRadius: radius.xl,
      padding: space.lg,
      overflow: "hidden",
      ...shadow.lift,
    },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.14,
      color: "#9A968D",
    },
    rating: {
      fontSize: 48,
      fontWeight: "700",
      color: "#F4F1EA",
      lineHeight: 54,
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },
    heroBadges: {
      flexDirection: "row",
      gap: space.sm,
      marginTop: space.sm,
    },
    tierBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#F4F1EA",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 30,
    },
    tierText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#1B1A17",
    },
    trendBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 30,
    },
    trendText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#8FCBA8",
    },
    avatarWrap: {
      width: 80,
      height: 80,
      borderRadius: 22,
      backgroundColor: "rgba(244,241,234,0.08)",
      overflow: "hidden",
    },
    badge3d: {
      position: "absolute",
      bottom: 4,
      right: 4,
      backgroundColor: "#F4F1EA",
      borderRadius: 8,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    badge3dText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#1B1A17",
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: "rgba(244,241,234,0.08)",
    },
    generateText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#F4F1EA",
      textAlign: "center",
      paddingHorizontal: 4,
    },
    levelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: space.lg,
    },
    levelText: {
      fontSize: 12,
      color: "#9A968D",
    },
    xpTrack: {
      height: 7,
      backgroundColor: "rgba(244,241,234,0.16)",
      borderRadius: 4,
      marginTop: 5,
    },
    xpFill: {
      height: "100%",
      backgroundColor: "#F4F1EA",
      borderRadius: 4,
    },
    statsCard: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.xl,
      padding: space.md,
      gap: space.sm,
    },
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: space.sm,
    },
    statLabel: {
      width: 70,
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
    },
    statTrack: {
      flex: 1,
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    statFill: {
      height: "100%",
      borderRadius: 4,
    },
    quickStats: {
      flexDirection: "row",
      gap: space.sm,
    },
    quickStat: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingVertical: space.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    quickStatValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
      fontVariant: ["tabular-nums"],
    },
    quickStatLabel: {
      fontSize: 9,
      color: colors.muted,
      marginTop: 1,
    },
  });
}

import React from "react";
import { View, Pressable, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { shadow, space } from "../theme";

interface HeaderProps {
  connected: boolean;
  alerts: number;
  onOpenDemo: () => void;
  onOpenActivity: () => void;
}

export function Header({ connected, alerts, onOpenDemo, onOpenActivity }: HeaderProps) {
  const { colors, isDark, toggle } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} resizeMode="cover" />
        <View style={[styles.dot, { backgroundColor: connected ? colors.green : colors.muted }]} />
      </View>
      <View style={styles.headerIcons}>
        <Pressable style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.iconBtnPressed]} onPress={onOpenDemo} hitSlop={8}>
          <Ionicons name="paw" size={22} color={colors.text} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.iconBtnPressed]} onPress={toggle} hitSlop={8}>
          <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={colors.text} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.iconBtnPressed]} onPress={onOpenActivity} hitSlop={8}>
          <Ionicons name="notifications" size={22} color={colors.text} />
          {alerts > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{alerts}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg },
  logoRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  logo: { width: 64, height: 64, borderRadius: 18 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  headerIcons: { flexDirection: "row", gap: space.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  iconBtnPressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});

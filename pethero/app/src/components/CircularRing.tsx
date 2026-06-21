import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../ThemeContext";
import { space } from "../theme";

interface CircularRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 - 1
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}

export function CircularRing({
  size = 92,
  strokeWidth = 8,
  progress,
  color,
  icon,
  value,
  label,
}: CircularRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dash = clamped * circumference;

  return (
    <View style={[styles.container, { width: size, height: size + 26 }]}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.inner}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: space.xs,
  },
});

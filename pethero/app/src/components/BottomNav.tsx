import React, { useEffect, useRef } from "react";
import { View, Pressable, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shadow } from "../theme";

export type AppTab = "home" | "train" | "pets";

interface BottomNavProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { key: AppTab; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: "home", icon: "home", label: "Home" },
  { key: "train", icon: "sparkles", label: "Looksmax" },
  { key: "pets", icon: "paw", label: "Cats" },
];

const SCREEN_WIDTH = Dimensions.get("window").width;
const BAR_WIDTH = SCREEN_WIDTH - 40;
const BLOB = 66;
// x-offset (in px) that centers the blob over tab i
const centerFor = (i: number) => (BAR_WIDTH * (i + 0.5)) / TABS.length - BLOB / 2;

export function BottomNav({ active, onChange }: BottomNavProps) {
  const styles = useThemedStyles();
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === active));

  // Animated horizontal position of the floating blob — glides between tabs.
  const x = useRef(new Animated.Value(centerFor(activeIndex))).current;
  useEffect(() => {
    Animated.spring(x, {
      toValue: centerFor(activeIndex),
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [activeIndex, x]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab} hitSlop={8}>
              {/* hide the icon under the blob when active */}
              <Ionicons name={tab.icon} size={24} color={isActive ? "transparent" : "#6E695F"} />
              <Text style={[styles.tabLabel, { color: isActive ? "#F4F1EA" : "#6E695F" }]}>{tab.label}</Text>
            </Pressable>
          );
        })}

        {/* Floating active blob — slides via Animated translateX */}
        <Animated.View style={[styles.blob, { transform: [{ translateX: x }] }]}>
          <Ionicons name={TABS[activeIndex].icon} size={28} color="#1B1A17" />
        </Animated.View>
      </View>
    </View>
  );
}

function useThemedStyles() {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 8,
      alignItems: "center",
    },
    bar: {
      height: 72,
      width: BAR_WIDTH,
      backgroundColor: "#1B1A17",
      borderRadius: 34,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 6,
      ...shadow.lift,
    },
    tab: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    blob: {
      position: "absolute",
      left: 0,
      top: -16,
      width: BLOB,
      height: BLOB,
      borderRadius: BLOB / 2,
      backgroundColor: "#F4F1EA",
      borderWidth: 5,
      borderColor: "#1B1A17",
      alignItems: "center",
      justifyContent: "center",
      ...shadow.card,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.03,
    },
  });
}

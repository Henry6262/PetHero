import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTheme } from "../ThemeContext";
import { Icon } from "../Icon";
import { shadow, space } from "../theme";
import type { Action } from "../types";

interface ActionOverlayProps {
  onDispense: (action: Action) => void;
}

interface ActionItem {
  action: Action;
  icon: "feed" | "water" | "medicine" | "pet";
  color: string;
}

export function ActionOverlay({ onDispense }: ActionOverlayProps) {
  const { colors } = useTheme();
  const items: ActionItem[] = [
    { action: "feed", icon: "feed", color: colors.green },
    { action: "water", icon: "water", color: colors.blue },
    { action: "medicine", icon: "medicine", color: colors.amber },
    { action: "pet", icon: "pet", color: colors.pink ?? "#F472B6" },
  ];

  return (
    <View style={styles.actionOverlay} pointerEvents="box-none">
      {items.map((item) => (
        <Pressable
          key={item.action}
          onPress={() => onDispense(item.action)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
        >
          <View style={[styles.actionBtnInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name={item.icon} size={30} color={item.color} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  actionOverlay: { position: "absolute", right: 16, top: 8, bottom: 8, justifyContent: "center", gap: 24 },
  actionBtn: { width: 52, height: 52, borderRadius: 26 },
  actionBtnPressed: { opacity: 0.75, transform: [{ scale: 0.92 }] },
  actionBtnInner: { flex: 1, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});

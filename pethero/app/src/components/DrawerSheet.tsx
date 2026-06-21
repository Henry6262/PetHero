import React, { useEffect, useRef } from "react";
import { View, Pressable, Text, Animated, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../ThemeContext";
import { radius, shadow, space } from "../theme";

interface DrawerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  kicker: string;
  children: React.ReactNode;
}

const SCREEN_HEIGHT = 800;

export function DrawerSheet({ visible, onClose, title, kicker, children }: DrawerSheetProps) {
  const { colors, isDark } = useTheme();
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
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <BlurView intensity={24} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(0,0,0,0.55)" : "rgba(20,16,10,0.38)" }]}
            onPress={onClose}
          />
        </Animated.View>
        <Animated.View style={[styles.drawerSheet, { backgroundColor: colors.sheet, transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={onClose} style={styles.drawerHandleBar}>
            <View style={[styles.drawerHandle, { backgroundColor: colors.borderStrong }]} />
          </Pressable>
          <View style={styles.drawerHeader}>
            <View>
              <Text style={[styles.drawerKicker, { color: colors.amber }]}>{kicker}</Text>
              <Text style={[styles.drawerTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.drawerCloseBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.drawerCloseBtnPressed]} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingBottom: space.xxl,
    ...shadow.lift,
  },
  drawerHandleBar: { alignSelf: "center", paddingVertical: space.sm, paddingHorizontal: space.lg, marginBottom: space.sm },
  drawerHandle: { width: 40, height: 5, borderRadius: 3 },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg },
  drawerCloseBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  drawerCloseBtnPressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  drawerKicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: space.xs },
  drawerTitle: { fontSize: 16, fontWeight: "700", flexShrink: 1, marginRight: space.sm },
});

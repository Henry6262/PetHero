import React from "react";
import { Image, type StyleProp, type ImageStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ThemeColors } from "./theme";

export type IconName =
  | "feed"
  | "water"
  | "medicine"
  | "pet"
  | "agent"
  | "notifications"
  | "settings"
  | "demo"
  | "chevron";

// 3D rendered PNG assets take precedence when present. Drop exports from
// Meshy / Rodin into assets/icons/3d/<name>.png to override the Ionicons.
const ICON_3D_ASSETS: Record<IconName, ReturnType<typeof require> | null> = {
  feed: null,
  water: null,
  medicine: null,
  pet: null,
  agent: null,
  notifications: null,
  settings: null,
  demo: null,
  chevron: null,
};

const IONICON_MAP: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  feed: "nutrition",
  water: "water",
  medicine: "medical",
  pet: "hand-left",
  agent: "bulb",
  notifications: "notifications",
  settings: "settings",
  demo: "paw",
  chevron: "chevron-forward",
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  colors?: ThemeColors;
  style?: StyleProp<ImageStyle>;
}

export function Icon({ name, size = 20, color, colors, style }: IconProps) {
  const asset = ICON_3D_ASSETS[name];
  if (asset) {
    return <Image source={asset} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
  }

  const tint = color ?? colors?.text ?? "#1B1A18";
  return <Ionicons name={IONICON_MAP[name]} size={size} color={tint} style={style} />;
}

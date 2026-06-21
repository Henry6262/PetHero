import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../ThemeContext";
import { space } from "../theme";

export function Separator() {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={["transparent", colors.borderStrong, colors.borderStrong, "transparent"]}
      locations={[0, 0.38, 0.62, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ height: 1.5, borderRadius: 1, marginVertical: space.sm }}
    />
  );
}

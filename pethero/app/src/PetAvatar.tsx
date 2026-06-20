import React from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { petImage } from "./petImages";
import { petEmoji } from "./petStatus";
import type { Pet } from "./types";

interface Props {
  pet: Pick<Pet, "id" | "species">;
  size?: number;
  style?: StyleProp<ViewStyle>;
  emojiSize?: number;
}

// Circular pet avatar: shows the bundled photo when we have one, otherwise the
// species emoji. One component so a pet's picture shows up consistently across
// the cards, the activity log, and the demo picker.
export function PetAvatar({ pet, size = 44, style, emojiSize }: Props) {
  const img = petImage(pet);
  const r = size / 2;
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: r }, style]}>
      {img ? (
        <Image source={img} style={{ width: size, height: size, borderRadius: r }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: emojiSize ?? size * 0.5 }}>{petEmoji(pet.species)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#EFEAE2", alignItems: "center", justifyContent: "center", overflow: "hidden" },
});

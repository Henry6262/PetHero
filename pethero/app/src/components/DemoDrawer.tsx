import React from "react";
import { View, StyleSheet } from "react-native";
import { DrawerSheet } from "./DrawerSheet";
import { Chip } from "./Chip";
import { PetAvatar } from "../PetAvatar";
import { space } from "../theme";
import type { Pet } from "../types";

interface DemoDrawerProps {
  visible: boolean;
  pets: Pet[];
  selected: string | null;
  onPick: (id: string | null) => void;
  onClose: () => void;
}

export function DemoDrawer({ visible, pets, selected, onPick, onClose }: DemoDrawerProps) {
  return (
    <DrawerSheet visible={visible} onClose={onClose} kicker="DEMO" title="Simulate a pet walking up to the bowl">
      <View style={styles.demoChips}>
        {pets.map((p) => (
          <Chip key={p.id} active={selected === p.id} onPress={() => onPick(p.id)} leading={<PetAvatar pet={p} size={22} />}>
            {p.name}
          </Chip>
        ))}
        <Chip active={selected === null} danger onPress={() => onPick(null)}>
          ? Unknown
        </Chip>
      </View>
    </DrawerSheet>
  );
}

const styles = StyleSheet.create({
  demoChips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});

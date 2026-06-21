import React from "react";
import { ScrollView } from "react-native";
import { Header } from "../components/Header";
import { LivePanel } from "../components/LivePanel";
import { AlertBanner } from "../components/AlertBanner";
import { Separator } from "../components/Separator";
import { AvatarCard } from "../AvatarCard";
import { PetNavigator } from "../PetNavigator";
import { space } from "../theme";
import type { Action, Pet } from "../types";

interface HomeScreenProps {
  pets: Pet[];
  currentPet: Pet | null;
  currentPetId: string | null;
  connected: boolean;
  alerts: number;
  frame: string | null;
  watching: string | null;
  confidence: number;
  busy: boolean;
  candyClass: string | null;
  candyConfidence: number;
  onOpenDemo: () => void;
  onOpenActivity: () => void;
  onDispense: (action: Action) => void;
  onSelectPet: (id: string) => void;
  onGenerateAvatar: () => void;
  onView3D: () => void;
}

export function HomeScreen({
  pets,
  currentPet,
  currentPetId,
  connected,
  alerts,
  frame,
  watching,
  confidence,
  busy,
  candyClass,
  candyConfidence,
  onOpenDemo,
  onOpenActivity,
  onDispense,
  onSelectPet,
  onGenerateAvatar,
  onView3D,
}: HomeScreenProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: space.lg,
        paddingTop: space.sm,
        paddingBottom: 200,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Header
        connected={connected}
        alerts={alerts}
        onOpenDemo={onOpenDemo}
        onOpenActivity={onOpenActivity}
      />

      <LivePanel
        frame={frame}
        watching={watching}
        confidence={confidence}
        busy={busy}
        candyClass={candyClass}
        candyConfidence={candyConfidence}
        onDispense={onDispense}
      />

      {currentPet && currentPet.medications.length > 0 && (
        <AlertBanner pet={currentPet} onPress={() => onSelectPet(currentPet.id)} />
      )}

      <Separator />

      <PetNavigator pets={pets} activeId={currentPetId} onSelect={onSelectPet} />

      {currentPet && (
        <AvatarCard
          pet={currentPet}
          onGenerate={onGenerateAvatar}
          onRetry={onGenerateAvatar}
          onView3D={onView3D}
        />
      )}
    </ScrollView>
  );
}

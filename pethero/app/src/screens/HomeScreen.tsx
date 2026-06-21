import React from "react";
import { ScrollView } from "react-native";
import { Header } from "../components/Header";
import { LivePanel } from "../components/LivePanel";
import { Separator } from "../components/Separator";
import { ActivityLogCard } from "../components/ActivityLogCard";
import { RobotCard } from "../components/RobotCard";
import { PillSelector } from "../components/PillSelector";
import { PetNavigator } from "../PetNavigator";
import { space } from "../theme";
import type { ActivityEvent, DispenseDecision, EnforceResult, Pet, RobotCommandResult } from "../types";

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
  decision: DispenseDecision | null;
  lastEvent: ActivityEvent | null;
  log: ActivityEvent[];
  onOpenDemo: () => void;
  onOpenActivity: () => void;
  onSelectPet: (id: string) => void;
  onOpenPetSettings?: (id: string) => void;
  onGiveMedicine: (name: string) => void;
  onEnforce: (petId: string, foodLabel: string) => Promise<EnforceResult> | void;
  onRobotCommand: (cmd: "feed" | "protect" | "pick", cup?: string) => Promise<RobotCommandResult> | void;
  lastRobotCommand: { type: "enforce"; result: EnforceResult } | { type: "raw"; result: RobotCommandResult } | null;
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
  decision,
  lastEvent,
  log,
  onOpenDemo,
  onOpenActivity,
  onSelectPet,
  onOpenPetSettings,
  onGiveMedicine,
  onEnforce,
  onRobotCommand,
  lastRobotCommand,
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
      />

      <RobotCard
        pet={currentPet}
        candyClass={candyClass}
        onEnforce={onEnforce}
        onRobotCommand={onRobotCommand}
        lastCommand={lastRobotCommand}
      />

      {currentPet && (
        <PillSelector medications={currentPet.medications} onGive={onGiveMedicine} />
      )}

      <Separator />

      <PetNavigator pets={pets} activeId={currentPetId} onSelect={onSelectPet} onOpenSettings={onOpenPetSettings} />

      <ActivityLogCard pets={pets} decision={decision} lastEvent={lastEvent} log={log} />
    </ScrollView>
  );
}

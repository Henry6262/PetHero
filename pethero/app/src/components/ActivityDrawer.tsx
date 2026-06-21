import React from "react";
import { DrawerSheet } from "./DrawerSheet";
import { AgentPanel } from "../AgentPanel";
import type { ActivityEvent, DispenseDecision, Pet } from "../types";

interface ActivityDrawerProps {
  visible: boolean;
  decision: DispenseDecision | null;
  lastEvent: ActivityEvent | null;
  log: ActivityEvent[];
  pets: Pet[];
  onClose: () => void;
}

export function ActivityDrawer({ visible, decision, lastEvent, log, pets, onClose }: ActivityDrawerProps) {
  return (
    <DrawerSheet visible={visible} onClose={onClose} kicker="ACTIVITY" title="Agent log & decisions">
      <AgentPanel decision={decision} lastEvent={lastEvent} log={log} pets={pets} />
    </DrawerSheet>
  );
}

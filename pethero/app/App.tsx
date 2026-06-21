import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Vibration, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { api } from "./src/api";
import { useBackend } from "./src/useBackend";
import { ThemeProvider, useTheme } from "./src/ThemeContext";
import { deriveStatus } from "./src/petStatus";
import { SEED_PETS } from "./src/seed";
import type { Action, EnforceResult, Pet, RobotCommandResult } from "./src/types";

import { HomeScreen } from "./src/screens/HomeScreen";
import { PetsList } from "./src/PetsList";
import { BottomNav, type AppTab } from "./src/components/BottomNav";
import { DemoDrawer } from "./src/components/DemoDrawer";
import { ActivityDrawer } from "./src/components/ActivityDrawer";
import { PetSettingsDrawer } from "./src/components/PetSettingsDrawer";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Main />
    </SafeAreaView>
  );
}

function Main() {
  const backend = useBackend();
  const [pets, setPets] = useState<Pet[]>(SEED_PETS);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPetId, setSettingsPetId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [lastRobot, setLastRobot] = useState<
    { type: "enforce"; result: EnforceResult } | { type: "raw"; result: RobotCommandResult } | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [toastAnim]);

  useEffect(() => {
    api.pets().then((p) => p.length && setPets(p)).catch(() => {});
  }, [backend.connected]);

  const currentPetId = backend.detection?.pet_id ?? selected ?? pets[0]?.id ?? null;
  const currentPet = pets.find((p) => p.id === currentPetId) ?? null;

  const simulate = useCallback(async (petId: string | null) => {
    setSelected(petId);
    setBusy(true);
    try {
      await api.setCurrentPet(petId);
      await api.process();
    } catch (e) {
      showToast("Backend unreachable — running in demo mode");
    }
    setBusy(false);
  }, [showToast]);

  const dispense = useCallback(
    async (action: Action, petId?: string) => {
      const targetId = petId ?? currentPet?.id;
      if (!targetId) {
        setPendingAction(action);
        setDemoOpen(true);
        return;
      }
      const target = pets.find((p) => p.id === targetId);
      if (!target) return;
      Vibration.vibrate(8);
      setBusy(true);
      try {
        await api.trigger(target.id, action);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        showToast(`Action failed: ${msg}`);
      }
      setBusy(false);
    },
    [currentPet, pets]
  );

  const giveMedicine = useCallback(
    async (name: string) => {
      const targetId = currentPet?.id;
      if (!targetId) {
        setPendingAction("medicine");
        setDemoOpen(true);
        return;
      }
      Vibration.vibrate(8);
      setBusy(true);
      try {
        await api.trigger(targetId, "medicine", name);
        showToast(`Gave ${name}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        showToast(`Pill failed: ${msg}`);
      }
      setBusy(false);
    },
    [currentPet]
  );

  const handleDemoPick = useCallback(
    (id: string | null) => {
      simulate(id);
      setDemoOpen(false);
      if (pendingAction && id) {
        const action = pendingAction;
        setPendingAction(null);
        dispense(action, id);
      }
    },
    [pendingAction, simulate, dispense]
  );

  const alerts = pets.some((p) => deriveStatus(p, backend.log).tone === "alert") ? 1 : 0;

  const openSettings = useCallback((petId: string) => {
    setSettingsPetId(petId);
    setSettingsOpen(true);
  }, []);

  const handleSettingsSaved = useCallback((updated: Pet) => {
    setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const refreshPets = useCallback(async () => {
    try {
      const p = await api.pets();
      if (p.length) setPets(p);
    } catch {
      showToast("Could not refresh pets — using cached data");
    }
  }, [showToast]);

  const enforce = useCallback(async (petId: string, foodLabel: string) => {
    try {
      const result = await api.enforce(petId, foodLabel);
      setLastRobot({ type: "enforce", result });
      return result;
    } catch (e) {
      const reason = e instanceof Error ? e.message : "enforce failed";
      setLastRobot({ type: "enforce", result: { allow: false, action: "push_away", robot_cmd: "protect", reason, pet_name: null, food: foodLabel } });
      throw e;
    }
  }, []);

  const robotCommand = useCallback(async (cmd: "feed" | "protect" | "pick", cup?: string) => {
    try {
      const result = await api.robotCommand(cmd, cup);
      setLastRobot({ type: "raw", result });
      return result;
    } catch (e) {
      const result: RobotCommandResult = { sent: false, command: { cmd, cup }, robot: "unknown" };
      setLastRobot({ type: "raw", result });
      throw e;
    }
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            pets={pets}
            currentPet={currentPet}
            currentPetId={currentPetId}
            connected={backend.connected}
            alerts={alerts}
            frame={backend.frame}
            watching={backend.detection?.present ? backend.detection.pet_name : null}
            confidence={backend.detection?.confidence ?? 0}
            busy={busy}
            candyClass={backend.candyClass}
            candyConfidence={backend.candyConfidence}
            decision={backend.decision}
            lastEvent={backend.lastEvent}
            log={backend.log}
            onOpenDemo={() => setDemoOpen(true)}
            onOpenActivity={() => setActivityOpen(true)}
            onSelectPet={(id) => simulate(id)}
            onOpenPetSettings={openSettings}
            onGiveMedicine={giveMedicine}
            onEnforce={enforce}
            onRobotCommand={robotCommand}
            lastRobotCommand={lastRobot}
          />
        );
      case "pets":
        return (
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 8 }}>
            <PetsList pets={pets} activeId={currentPetId} onSelect={(id) => simulate(id)} />
          </View>
        );
    }
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {renderTab()}
        <BottomNav active={activeTab} onChange={setActiveTab} />
      </View>

      <DemoDrawer
        visible={demoOpen}
        pets={pets}
        selected={selected}
        onPick={handleDemoPick}
        onClose={() => setDemoOpen(false)}
      />

      <ActivityDrawer
        visible={activityOpen}
        decision={backend.decision}
        lastEvent={backend.lastEvent}
        log={backend.log}
        pets={pets}
        onClose={() => setActivityOpen(false)}
      />

      <PetSettingsDrawer
        visible={settingsOpen}
        pet={pets.find((p) => p.id === settingsPetId) ?? null}
        onClose={() => setSettingsOpen(false)}
        onSaved={(updated) => {
          handleSettingsSaved(updated);
          refreshPets();
        }}
      />

      {toast && (
        <Animated.View style={[toastStyles.toast, { opacity: toastAnim }]} pointerEvents="none">
          <Text style={toastStyles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </>
  );
}

const toastStyles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: "rgba(20,14,8,0.88)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    zIndex: 9999,
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

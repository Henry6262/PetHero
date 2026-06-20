import React, { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConversation } from "@elevenlabs/react-native";
import { api } from "./api";
import type { Action, Pet } from "./types";

// Public PetHero agent (auth disabled), so the app connects with just the id.
const AGENT_ID = process.env.EXPO_PUBLIC_AGENT_ID ?? "agent_8201kvkgw1w3f7sbt88dhg9jv8t5";

const PET_IDS = ["mochi", "biscuit", "pixel"];

function resolveTargets(petName?: string): string[] {
  if (!petName) return [];
  const n = petName.trim().toLowerCase();
  if (["all", "everyone", "the cats", "cats", "them", "everybody"].some((w) => n.includes(w))) return [...PET_IDS];
  return PET_IDS.filter((id) => n.includes(id));
}

function toAction(item: string): Action {
  const i = (item || "").trim().toLowerCase();
  if (i.startsWith("food") || i.includes("feed") || i.includes("eat")) return "feed";
  if (i.startsWith("med") || i.includes("pill") || i.includes("medicine")) return "medicine";
  return "water";
}

// The voice assistant: a big mic button pinned center-bottom. Tap to talk to the
// ElevenLabs agent; it calls these client tools, which drive the existing
// backend (so "feed the cats" runs through the same safety rules as the buttons).
export function VoiceAssistant() {
  const petsRef = useRef<Pet[]>([]);
  useEffect(() => {
    api.pets().then((p) => (petsRef.current = p)).catch(() => {});
  }, []);

  const conversation = useConversation({
    clientTools: {
      dispense: async ({ pet_name, item }: { pet_name?: string; item: string }) => {
        const action = toAction(item);
        const targets = resolveTargets(pet_name);
        if (!targets.length) return "Which cat do you mean — Mochi, Biscuit, or Pixel?";
        const out: string[] = [];
        for (const id of targets) {
          const pet = petsRef.current.find((p) => p.id === id);
          const med = action === "medicine" ? pet?.medications[0]?.name : undefined;
          try {
            const r = await api.trigger(id, action, med);
            out.push(`${id}: ${r.event.allowed ? "done" : "skipped — " + (r.event.reason || "safety rule")}`);
          } catch {
            out.push(`${id}: failed to reach the robot`);
          }
        }
        return out.join("; ");
      },
      get_activity: async ({ pet_name }: { pet_name?: string }) => {
        try {
          let log = await api.log();
          if (pet_name) {
            const n = pet_name.toLowerCase();
            log = log.filter((e) => (e.pet_name || "").toLowerCase().includes(n));
          }
          const recent = log.slice(0, 5);
          if (!recent.length) return "Nothing logged yet — the cats have been quiet.";
          return recent
            .map((e) => `${e.pet_name || "shared"} ${e.action}${e.allowed ? "" : " (blocked)"}`)
            .join("; ");
        } catch {
          return "I couldn't reach the activity log right now.";
        }
      },
      inspect_bowl: async () => {
        try {
          const r = await api.process();
          return r.decision ? `${r.decision.pet_name}: ${r.decision.reasoning}` : "No cat at the bowl right now.";
        } catch {
          return "I couldn't check the camera right now.";
        }
      },
    },
    onError: (message: string) => console.warn("[voice] error:", message),
  });

  const status = conversation.status; // "disconnected" | "connecting" | "connected"
  const speaking = conversation.isSpeaking;
  const connected = status === "connected";
  const connecting = status === "connecting";

  const toggle = useCallback(async () => {
    try {
      if (connected) await conversation.endSession();
      else await conversation.startSession({ agentId: AGENT_ID });
    } catch (e) {
      console.warn("[voice] toggle failed:", e);
    }
  }, [connected, conversation]);

  // Gentle pulse while a session is live.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!connected) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [connected, pulse]);

  const label = connecting
    ? "Connecting…"
    : connected
      ? speaking
        ? "🔊 PetHero is speaking"
        : "🎤 Listening… tap to end"
      : null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.82, transform: [{ scale: 0.96 }] }]}
          hitSlop={12}
        >
          {connecting ? <ActivityIndicator color="#fff" /> : <Ionicons name={connected ? "stop" : "mic"} size={30} color="#fff" />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 36, alignItems: "center" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1B1A18",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
  },
  btn: {
    width: 84,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1B19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 9,
  },
});

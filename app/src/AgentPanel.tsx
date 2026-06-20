import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, space } from "./theme";
import { petEmoji } from "./petStatus";
import type { Action, ActivityEvent, DispenseDecision, Pet } from "./types";

interface AgentPanelProps {
  decision: DispenseDecision | null;
  lastEvent: ActivityEvent | null;
  log: ActivityEvent[];
  pets: Pet[];
  maxItems?: number;
}

export function AgentPanel({
  decision,
  lastEvent,
  log,
  pets,
  maxItems = 8,
}: AgentPanelProps) {
  const events = log.slice(0, maxItems);
  if (!decision && events.length === 0) return null;

  const allowed = lastEvent?.allowed ?? true;
  const rule = lastEvent?.rule ?? null;
  const tone = allowed ? colors.green : colors.red;
  const bg = allowed ? colors.greenSoft : colors.redSoft;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {decision && (
          <ReasoningRow
            reasoning={decision.reasoning}
            allowed={allowed}
            rule={rule}
            hasMore={events.length > 0}
          />
        )}
        {events.map((event, index) => (
          <EventRow
            key={`${event.timestamp}-${index}`}
            event={event}
            pet={pets.find((p) => p.name === event.pet_name)}
            isLast={index === events.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function ReasoningRow({
  reasoning,
  allowed,
  rule,
  hasMore,
}: {
  reasoning: string;
  allowed: boolean;
  rule: string | null;
  hasMore: boolean;
}) {
  const tone = allowed ? colors.green : colors.red;
  const bg = allowed ? colors.greenSoft : colors.redSoft;

  return (
    <View style={styles.row}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: tone }]} />
        {hasMore && <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={styles.actor} numberOfLines={1}>
            🧠 Agent
          </Text>
          <View style={[styles.verdictPill, { backgroundColor: bg }]}>
            <Text style={[styles.verdictText, { color: tone }]}>
              {allowed ? "DISPENSED" : `BLOCKED${rule ? ` · ${rule}` : ""}`}
            </Text>
          </View>
        </View>
        <Text style={[styles.outcome, { color: colors.text }]} numberOfLines={3}>
          {reasoning}
        </Text>
      </View>
    </View>
  );
}

function EventRow({
  event,
  pet,
  isLast,
}: {
  event: ActivityEvent;
  pet?: Pet;
  isLast: boolean;
}) {
  const allowed = event.allowed && event.action !== "none";
  const toneColor = allowed ? colors.green : event.allowed ? colors.muted : colors.red;
  const outcome = eventOutcome(event);

  return (
    <View style={styles.row}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: toneColor }]} />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={styles.actor} numberOfLines={1}>
            {event.action === "water"
              ? "💧 Shared"
              : pet
                ? `${petEmoji(pet.species)} ${pet.name}`
                : event.pet_name ?? "Unknown"}
            {event.action !== "water" && (
              <Text style={styles.actionIcon}> {actionIcon(event.action)}</Text>
            )}
          </Text>
          <Text style={styles.time}>{formatTime(event.timestamp)}</Text>
        </View>
        <Text style={[styles.outcome, { color: toneColor }]} numberOfLines={2}>
          {outcome}
        </Text>
      </View>
    </View>
  );
}

function eventOutcome(event: ActivityEvent): string {
  if (!event.allowed) return `Blocked · ${event.reason || "safety rule"}`;
  if (event.action === "none") return event.reason || "No action needed";
  return event.reason || `${cap(event.action)} completed`;
}

function actionIcon(action: Action): string {
  switch (action) {
    case "feed":
      return "🍽";
    case "water":
      return "💧";
    case "medicine":
      return "💊";
    default:
      return "—";
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { marginBottom: space.lg },
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingRight: space.md,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  timeline: {
    width: 38,
    alignItems: "center",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    zIndex: 1,
  },
  line: {
    position: "absolute",
    top: 18,
    bottom: -14,
    width: 1.5,
    backgroundColor: colors.borderStrong,
  },
  content: {
    flex: 1,
    paddingTop: 1,
  },
  topLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  actor: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
    marginRight: 8,
  },
  actionIcon: {
    fontSize: 14,
    fontWeight: "400",
  },
  verdictPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  verdictText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    color: colors.muted,
    fontVariant: ["tabular-nums"],
  },
  outcome: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
});

import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, shadow, space } from "./theme";
import { useTheme } from "./ThemeContext";
import { PetAvatar } from "./PetAvatar";
import { Icon } from "./Icon";
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
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
  const events = log.slice(0, maxItems);
  if (!decision && events.length === 0) return null;

  const allowed = lastEvent?.allowed ?? true;
  const rule = lastEvent?.rule ?? null;

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
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
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
          <View style={styles.actorRow}>
            <Icon name="agent" size={18} color={colors.text} />
            <Text style={[styles.actor, { marginLeft: 6 }]} numberOfLines={1}>
              Agent
            </Text>
          </View>
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
  const { colors } = useTheme();
  const styles = useThemedStyles(colors);
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
          <View style={styles.actorRow}>
            {event.action === "water" ? (
              <View style={styles.actorRow}>
                <Icon name="water" size={18} color={colors.text} />
                <Text style={[styles.actor, { marginLeft: 6 }]} numberOfLines={1}>Shared</Text>
              </View>
            ) : pet ? (
              <View style={styles.actorRow}>
                <PetAvatar pet={pet} size={20} style={{ marginRight: 6 }} />
                <Text style={styles.actor} numberOfLines={1}>
                  {pet.name}
                </Text>
                <Icon name={event.action === "feed" ? "feed" : event.action === "medicine" ? "medicine" : "agent"} size={16} color={colors.text} style={{ marginLeft: 6 }} />
              </View>
            ) : (
              <Text style={styles.actor} numberOfLines={1}>{event.pet_name ?? "Unknown"}</Text>
            )}
          </View>
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function useThemedStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: space.lg },
        card: {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          paddingVertical: space.sm,
          paddingRight: space.md,
          ...shadow.card,
        },
        row: {
          flexDirection: "row",
          paddingVertical: space.sm,
        },
        timeline: {
          width: 40,
          alignItems: "center",
        },
        dot: {
          width: 10,
          height: 10,
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
          marginBottom: space.xs,
        },
        actorRow: {
          flexDirection: "row",
          alignItems: "center",
          flexShrink: 1,
          marginRight: 8,
        },
        actor: {
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
          flexShrink: 1,
        },
        actionIcon: {
          fontSize: 14,
          fontWeight: "400",
        },
        verdictPill: {
          paddingHorizontal: space.sm,
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
          lineHeight: 20,
          fontWeight: "600",
        },
      }),
    [colors]
  );
}

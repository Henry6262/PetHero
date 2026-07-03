import type { AgentRecord, FormationPlan, GridCell, MissionIntent } from "./types.ts";

export function proposeFormation(input: {
  intent: MissionIntent;
  agents: AgentRecord[];
  staleCells: GridCell[];
  targetCells?: string[];
}): FormationPlan {
  const activeAgents = input.agents.filter((agent) => agent.status !== "offline");
  const agentIds = activeAgents.map((agent) => agent.id);

  switch (input.intent) {
    case "area_scan":
      return {
        intent: input.intent,
        formation: "fan-out",
        rationale: "Maximize first-pass coverage by splitting unknown or low-freshness cells.",
        tasks: agentIds.map((agentId, index) => ({
          agentId,
          role: "sector_scout",
          targetCellId: input.targetCells?.[index],
          instruction: `Sweep sector ${index + 1}; send map_cell and detection packets before video.`,
          priority: 80 - index,
        })),
      };
    case "perimeter_watch":
      return {
        intent: input.intent,
        formation: "ring-patrol",
        rationale: "Maintain awareness around the station while preserving one nearby relay.",
        tasks: agentIds.map((agentId, index) => ({
          agentId,
          role: index === 0 ? "dock_relay" : "perimeter_patrol",
          instruction:
            index === 0
              ? "Hold near dock as context relay and packet validator."
              : `Patrol perimeter arc ${index}; report stale cells and link quality.`,
          priority: index === 0 ? 95 : 70,
        })),
      };
    case "building_approach":
      return {
        intent: input.intent,
        formation: "overwatch-plus-scout",
        rationale: "Use wide-area overwatch while a ground agent checks blind corners and entrances.",
        tasks: agentIds.map((agentId, index) => ({
          agentId,
          role: index === 0 ? "lead_scout" : "overwatch",
          instruction:
            index === 0
              ? "Approach entrances slowly; prioritize close-range map events and confidence scores."
              : "Hold offset view; watch route, entrance, and adjacent blind zones.",
          priority: index === 0 ? 90 : 75,
        })),
      };
    case "lost_link_recovery":
      return {
        intent: input.intent,
        formation: "sync-point-return",
        rationale: "Preserve local observations and move toward known sync points for delayed upload.",
        tasks: agentIds.map((agentId) => ({
          agentId,
          role: "store_and_forward",
          instruction: "Cache deltas locally, move toward nearest sync point, upload at dock or relay.",
          priority: 100,
        })),
      };
    case "recheck_stale_zones":
      return {
        intent: input.intent,
        formation: "return-and-refresh",
        rationale: "Refresh old context by priority: age, risk, distance, and available battery.",
        tasks: agentIds.map((agentId, index) => {
          const target = input.staleCells[index];
          return {
            agentId,
            role: "stale_zone_checker",
            targetCellId: target?.id,
            instruction: target
              ? `Re-check ${target.id}; preserve old and new reports with provenance.`
              : "Stand by near dock; no stale cell currently assigned.",
            priority: target ? Math.round((1 - target.freshnessScore) * 100) : 20,
          };
        }),
      };
    case "relay_chain":
      return {
        intent: input.intent,
        formation: "relay-chain",
        rationale: "Extend context sync into difficult terrain by assigning relay roles.",
        tasks: agentIds.map((agentId, index) => ({
          agentId,
          role: index === 0 ? "dock_anchor" : index === agentIds.length - 1 ? "forward_scout" : "relay",
          instruction:
            index === 0
              ? "Stay closest to dock and validate incoming packets."
              : index === agentIds.length - 1
                ? "Move forward only while relay quality remains acceptable."
                : "Hold midpoint and forward meaning-first packets in both directions.",
          priority: 85 - index,
        })),
      };
  }
}

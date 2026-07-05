import type { Agent, AgentAction } from "../../types/data";
import ActionIcon from "./ActionIcon";

export interface AgentPopoverProps {
  agent: Agent;
  position: { top: number; left: number; height: number };
  onAction: (agent: Agent, action: AgentAction) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function AgentPopover({
  agent,
  position,
  onAction,
  onMouseEnter,
  onMouseLeave,
}: AgentPopoverProps) {
  const pw = 246;
  let popoverLeft = position.left - pw - 14;
  if (popoverLeft < 8) popoverLeft = position.left + 304;
  const popoverTop = Math.max(10, Math.min(position.top - 8, window.innerHeight - 320));
  const pointTop = Math.max(16, position.top - popoverTop + position.height / 2);

  return (
    <div
      className="agent-popover"
      style={{
        left: popoverLeft,
        top: popoverTop,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="agent-popover-point" style={{ top: pointTop }} />
      <div className="agent-popover-head">
        <span style={{ background: agent.accent, boxShadow: `0 0 8px ${agent.accent}` }} />
        <span>{agent.name}</span>
        <span>{agent.role}</span>
      </div>
      <div className="agent-popover-status">{agent.status}</div>
      <div className="agent-popover-actions">
        <div className="lbl">QUICK ACTIONS</div>
        {agent.actions.map((action) => (
          <div key={action.label} onClick={() => onAction(agent, action)}>
            <ActionIcon icon={action.icon} accent={agent.accent} />
            <span>{action.label}</span>
            <span className="mono">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { JSX } from "react";

export const agentIcons: Record<string, JSX.Element> = {
  op: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="15" r="6" />
      <path d="M13 38v-3a11 11 0 0122 0v3" />
      <path d="M18 14a8 8 0 0112 0" />
    </svg>
  ),
  quad: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="11" y="19" width="21" height="9" rx="2.5" />
      <path d="M32 21l6-4" />
      <circle cx="39" cy="16" r="2.2" fill="currentColor" stroke="none" />
      <path d="M14 28v7M20 28v7M27 28v7M31 28v7" />
    </svg>
  ),
  hexapod: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 18h12l4 6-4 6H18l-4-6z" />
      <path d="M18 21l-7-4M15 24H7M18 27l-7 4M30 21l7-4M33 24h8M30 27l7 4" />
    </svg>
  ),
  drone: (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="4.5" />
      <path d="M24 19V12M24 29v7M19 24h-7M29 24h7" />
      <circle cx="24" cy="11" r="3.6" />
      <circle cx="24" cy="37" r="3.6" />
      <circle cx="11" cy="24" r="3.6" />
      <circle cx="37" cy="24" r="3.6" />
    </svg>
  ),
};

export default function AgentIcon({ icon }: { icon: string }) {
  return agentIcons[icon] ?? null;
}

import { useState, type ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  right,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section style={{ marginBottom: 28 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "transparent",
          border: "none",
          padding: "0 0 10px",
          color: "#e5e7eb",
          cursor: "pointer",
          textAlign: "left",
          borderBottom: "1px solid rgba(31, 41, 55, 0.55)",
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {right}
          <span
            style={{
              display: "inline-block",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            ▼
          </span>
        </span>
      </button>
      {open && <div style={{ paddingTop: 14 }}>{children}</div>}
    </section>
  );
}

const ACTION_ICON_PATHS: Record<string, string> = {
  goto: "M12 21s-7-6.3-7-11a7 7 0 0114 0c0 4.7-7 11-7 11zM12 10a2 2 0 100 4 2 2 0 000-4z",
  dock: "M5 21V8l7-4 7 4v13M9 21v-6h6v6",
  scan: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3",
  mode: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 3v3M12 18v3M3 12h3M18 12h3",
  recall: "M9 14l-4-4 4-4M5 10h9a5 5 0 015 5v3",
  advise: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  photo: "M3 6h18v13H3zM8 6l1.5-2h5L16 6M12 12.5a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z",
  call: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.5-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z",
  launch: "M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  orbit: "M3 12a9 4 0 1018 0 9 4 0 10-18 0M12 12m-2.5 0a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0",
  hold: "M7 6h3.5v12H7zM13.5 6H17v12h-3.5z",
};

export default function ActionIcon({ icon, accent }: { icon: string; accent: string }) {
  const path = ACTION_ICON_PATHS[icon] ?? "";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

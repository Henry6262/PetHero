export default function ActionToast({ msg, accent }: { msg: string; accent: string }) {
  return (
    <div className="action-toast" style={{ borderColor: accent }}>
      <span style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
      <span>{msg}</span>
    </div>
  );
}

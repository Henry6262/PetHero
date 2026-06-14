export function Landing({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="tr-landing" style={{ minHeight: '100vh', padding: 40 }}>
      <h1 style={{ fontSize: 48 }}>TRENCH ROYALE</h1>
      <button onClick={onPlay} className="tr-play-placeholder">PLAY NOW</button>
    </div>
  )
}

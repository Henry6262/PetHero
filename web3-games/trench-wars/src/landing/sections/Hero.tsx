import { Suspense, lazy } from 'react'
import SideRays from '../reactbits/SideRays'

// The R3F battle preview pulls in three + drei — lazy-load so WebGL never blocks first paint.
const BattlePreview = lazy(() =>
  import('../three/BattlePreview').then((m) => ({ default: m.BattlePreview })),
)

export function Hero() {
  return (
    <section
      className="tr-hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '88px 0 40px',
      }}
    >
      {/* Background layer — dark trench atmosphere. */}
      <div className="tr-hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden>
        <div className="tr-hero-bg-grid" />
        <div className="tr-hero-bg-glow tr-hero-bg-glow-gold" />
        <div className="tr-hero-bg-glow tr-hero-bg-glow-ember" />
        <div className="tr-hero-bg-vignette" />
      </div>

      {/* Side rays — dramatic top-right light, behind content. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
        <SideRays
          origin="top-right"
          rayColor1="#f5c842"
          rayColor2="#ff7a2f"
          opacity={0.55}
          intensity={1.6}
          speed={1.2}
          spread={2.2}
          falloff={1.7}
          blend={0.7}
        />
      </div>

      {/* Full-bleed battlefield — the hero IS the game preview. Edges fade into the dark. */}
      <div
        className="tr-hero-stage-fb"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: 'clamp(460px, 82vh, 980px)',
        }}
      >
        <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
          <BattlePreview />
        </Suspense>
      </div>

      {/* Scroll hint */}
      <div
        className="tr-hero-scroll"
        style={{
          position: 'absolute',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          color: 'var(--color-muted)',
          fontSize: 11,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          opacity: 0.7,
        }}
      >
        <span>Scroll</span>
        <span style={{ fontSize: 18, animation: 'tr-bounce 1.6s infinite' }}>↓</span>
      </div>
    </section>
  )
}

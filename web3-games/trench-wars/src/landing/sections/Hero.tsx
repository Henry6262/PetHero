import { Suspense, lazy } from 'react'
import SideRays from '../reactbits/SideRays'
import { SceneLoader } from '../three/SceneLoader'

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
        justifyContent: 'stretch',
        padding: '0',
      }}
    >
      {/* Background layer — dark trench atmosphere. */}
      <div className="tr-hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden>
        <div className="tr-hero-bg-grid" />
        <div className="tr-hero-moon" />
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

      {/* Big brand title — top-left, below the nav. */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(96px, 13vh, 150px)',
          left: 'clamp(20px, 4vw, 48px)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            lineHeight: 0.92,
            letterSpacing: '0.04em',
            fontSize: 'clamp(46px, 8vw, 112px)',
            textShadow: '0 6px 30px rgba(0,0,0,0.65)',
            whiteSpace: 'nowrap',
          }}
        >
          Trench Royale
        </h1>
        <div
          style={{
            marginTop: 12,
            color: 'var(--color-platinum)',
            fontSize: 'clamp(11px, 1.3vw, 15px)',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            opacity: 0.78,
          }}
        >
          the trenches have heroes now
        </div>
      </div>

      {/* Full-bleed battlefield — the hero IS the game preview. Fills the whole
          hero so there's no black strip; edges fade into the dark. */}
      <div
        className="tr-hero-stage-fb"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          flex: '1 1 auto',
          minHeight: '100vh',
        }}
      >
        <Suspense fallback={<div style={{ width: '100%', height: '100%' }} />}>
          <BattlePreview />
        </Suspense>
        {/* Branded loading overlay — covers the blank gap until the 3D assets stream in. */}
        <SceneLoader />
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

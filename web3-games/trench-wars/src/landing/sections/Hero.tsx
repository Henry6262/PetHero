import { Suspense, lazy } from 'react'
import SplitText from '../reactbits/SplitText'
import CountUp from '../reactbits/CountUp'
import StarBorder from '../reactbits/StarBorder'
import { BattlefieldDiorama } from '../three/BattlefieldDiorama'

// DarkVeil pulls in `ogl` + a WebGL canvas — lazy-load so it never blocks first paint.
const DarkVeil = lazy(() => import('../reactbits/DarkVeil'))

type Stat = { value: number; suffix?: string; label: string }

const STATS: Stat[] = [
  { value: 7, label: 'Commanders' },
  { value: 12, label: 'Cards' },
  { value: 50, suffix: '%', label: 'Burn rate' },
]

export function Hero({ onPlay }: { onPlay: () => void }) {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Background layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }} aria-hidden>
        <Suspense fallback={null}>
          {/* Tuned dark with a gold/amber tint via hueShift; slow drift + faint warp. */}
          <DarkVeil
            hueShift={28}
            speed={0.35}
            warpAmount={0.18}
            noiseIntensity={0.02}
            scanlineIntensity={0.08}
            scanlineFrequency={2}
            resolutionScale={1}
          />
        </Suspense>
        {/* Radial vignette so the left column stays readable over the shader. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 50%, rgba(7,9,13,0) 0%, rgba(7,9,13,0.85) 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Content layer */}
      <div
        className="tr-hero-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '120px 32px 64px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* LEFT */}
        <div>
          <div
            style={{
              color: 'var(--color-gold)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            Traders vs Jeets
          </div>

          <h1
            aria-label="TRENCH ROYALE"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 8vw, 92px)',
              fontWeight: 900,
              lineHeight: 0.95,
              margin: 0,
              color: 'var(--color-platinum)',
            }}
          >
            <SplitText text="TRENCH" tag="span" textAlign="left" />
            <br />
            <span style={{ color: 'var(--color-gold)' }}>
              <SplitText text="ROYALE" tag="span" textAlign="left" />
            </span>
          </h1>

          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'clamp(15px, 1.6vw, 19px)',
              lineHeight: 1.5,
              maxWidth: 480,
              margin: '24px 0 0',
            }}
          >
            Real-time lane warfare on Solana. Stack your deck, storm the trench,
            burn $ROYALE.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              marginTop: 32,
              alignItems: 'center',
            }}
          >
            <StarBorder
              as="button"
              color="var(--color-gold)"
              speed="5s"
              onClick={onPlay}
              style={{ cursor: 'pointer' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--color-gold)',
                }}
              >
                PLAY NOW
              </span>
            </StarBorder>

            <button
              onClick={onPlay}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-platinum)',
                borderRadius: 12,
                padding: '12px 24px',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>
          </div>

          {/* Stat strip */}
          <div style={{ display: 'flex', gap: 36, marginTop: 40, flexWrap: 'wrap' }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(28px, 3vw, 40px)',
                    fontWeight: 900,
                    color: 'var(--color-gold)',
                    lineHeight: 1,
                  }}
                >
                  <CountUp to={s.value} duration={1.6} />
                  {s.suffix ?? ''}
                </div>
                <div
                  style={{
                    color: 'var(--color-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <BattlefieldDiorama />
        </div>
      </div>
    </section>
  )
}

import { useRef, useState } from 'react'
import { ROSTER } from '../data'
import { Divider } from './Divider'
import TiltedCard from '../reactbits/TiltedCard'

const FACTION_COLOR: Record<string, string> = {
  Trader: 'var(--color-trader)',
  Jeet: 'var(--color-jeet)',
}

const CARD_WIDTH = 380
const CARD_GAP = 28

export function Roster() {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const scrollTo = (index: number) => {
    const el = track.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, ROSTER.length - 1))
    setActive(clamped)
    el.scrollTo({ left: clamped * (CARD_WIDTH + CARD_GAP), behavior: 'smooth' })
  }

  const next = () => scrollTo(active + 1)
  const prev = () => scrollTo(active - 1)

  return (
    <section id="roster" style={{ position: 'relative', overflow: 'hidden' }}>
      <Divider numeral="I" label="The Roster" />

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '24px 32px 80px',
          position: 'relative',
        }}
      >
        <div
          ref={track}
          className="tr-roster-track"
          style={{
            display: 'flex',
            gap: CARD_GAP,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            padding: '20px 4px 40px',
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={(e) => {
            const el = e.currentTarget
            const idx = Math.round(el.scrollLeft / (CARD_WIDTH + CARD_GAP))
            setActive(Math.max(0, Math.min(idx, ROSTER.length - 1)))
          }}
        >
          {ROSTER.map((c) => (
            <div
              key={c.id}
              className="tr-roster-card"
              style={{
                flex: '0 0 auto',
                width: CARD_WIDTH,
                scrollSnapAlign: 'start',
                background:
                  'linear-gradient(180deg, rgba(15,18,25,0.95), rgba(10,12,17,0.95))',
                border: '1px solid rgba(42, 58, 94, 0.5)',
                borderRadius: 24,
                overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,161,60,0.55)'
                e.currentTarget.style.boxShadow = '0 24px 70px rgba(0,0,0,0.55), 0 0 40px rgba(212,161,60,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(42, 58, 94, 0.5)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <TiltedCard
                imageSrc={c.portrait}
                altText={c.name}
                containerHeight="460px"
                containerWidth="100%"
                imageHeight="460px"
                imageWidth="100%"
                scaleOnHover={1.03}
                rotateAmplitude={10}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent
                overlayContent={
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '0 0 26px',
                      background:
                        'linear-gradient(180deg, transparent 35%, rgba(7,9,13,0.88) 75%, rgba(7,9,13,0.98) 100%)',
                    }}
                  >
                    <div style={{ padding: '0 26px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          gap: 16,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 28,
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            color: 'var(--color-platinum)',
                          }}
                        >
                          {c.name}
                        </h3>
                        <span
                          style={{
                            fontSize: 13,
                            textTransform: 'uppercase',
                            letterSpacing: '0.16em',
                            fontWeight: 700,
                            color: FACTION_COLOR[c.faction],
                          }}
                        >
                          {c.faction}
                        </span>
                      </div>
                      <p
                        style={{
                          color: 'var(--color-muted)',
                          fontSize: 16,
                          lineHeight: 1.5,
                          margin: '10px 0 0',
                        }}
                      >
                        {c.flavor}
                      </p>
                    </div>
                  </div>
                }
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={prev}
            disabled={active === 0}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              border: '1px solid rgba(212,161,60,0.35)',
              background: 'var(--color-panel)',
              color: 'var(--color-gold)',
              fontSize: 20,
              cursor: active === 0 ? 'not-allowed' : 'pointer',
              opacity: active === 0 ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            ←
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {ROSTER.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: i === active ? 'var(--color-gold)' : 'rgba(212,161,60,0.25)',
                  transition: 'background 0.2s',
                }}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={active === ROSTER.length - 1}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              border: '1px solid rgba(212,161,60,0.35)',
              background: 'var(--color-panel)',
              color: 'var(--color-gold)',
              fontSize: 20,
              cursor: active === ROSTER.length - 1 ? 'not-allowed' : 'pointer',
              opacity: active === ROSTER.length - 1 ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            →
          </button>
        </div>
      </div>
    </section>
  )
}

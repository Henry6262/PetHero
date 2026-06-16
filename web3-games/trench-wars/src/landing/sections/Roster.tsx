import { useRef, useState } from 'react'
import { ROSTER } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'
import TiltedCard from '../reactbits/TiltedCard'

const CARD_WIDTH = 360
const CARD_GAP = 24

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
    <section id="roster" style={{ position: 'relative', overflow: 'hidden', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 0 80px' }}>
        <SectionHeader
          eyebrow="The Roster"
          title={<>Choose your <span style={{ color: 'var(--color-gold)' }}>commander</span></>}
          subtitle="Nine distinct warlords. Two factions. One trench."
        />

        <ScrollReveal delay={0.1}>
          <div
            ref={track}
            className="tr-roster-track"
            style={{
              display: 'flex',
              gap: CARD_GAP,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              padding: '28px 4px 44px',
              WebkitOverflowScrolling: 'touch',
              marginTop: 40,
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
                  background: 'linear-gradient(180deg, rgba(17,20,27,0.95), rgba(10,12,17,0.98))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 24,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,161,60,0.45)'
                  e.currentTarget.style.boxShadow = '0 24px 70px rgba(0,0,0,0.5), 0 0 36px rgba(212,161,60,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <TiltedCard
                  imageSrc={c.portrait}
                  altText={c.name}
                  containerHeight="420px"
                  containerWidth="100%"
                  imageHeight="420px"
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
                        padding: '0 0 22px',
                        background:
                          'linear-gradient(180deg, transparent 45%, rgba(7,9,13,0.9) 78%, rgba(7,9,13,0.98) 100%)',
                      }}
                    >
                      <div style={{ padding: '0 24px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            fontWeight: 700,
                            color: 'var(--color-gold)',
                            border: '1px solid rgba(212,161,60,0.35)',
                            borderRadius: 999,
                            padding: '4px 10px',
                            marginBottom: 12,
                          }}
                        >
                          {c.faction}
                        </span>
                        <h3
                          style={{
                            fontSize: 26,
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            color: 'var(--color-platinum)',
                            margin: 0,
                          }}
                        >
                          {c.name}
                        </h3>
                        <p
                          style={{
                            color: 'var(--color-muted)',
                            fontSize: 15,
                            lineHeight: 1.45,
                            margin: '8px 0 0',
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
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={prev}
              disabled={active === 0}
              aria-label="Previous commander"
              className="tr-roster-btn"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--color-platinum)',
                fontSize: 18,
                cursor: active === 0 ? 'not-allowed' : 'pointer',
                opacity: active === 0 ? 0.35 : 1,
                transition: 'all 0.15s',
              }}
            >
              ←
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              {ROSTER.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to commander ${i + 1}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: i === active ? 'var(--color-gold)' : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              disabled={active === ROSTER.length - 1}
              aria-label="Next commander"
              className="tr-roster-btn"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--color-platinum)',
                fontSize: 18,
                cursor: active === ROSTER.length - 1 ? 'not-allowed' : 'pointer',
                opacity: active === ROSTER.length - 1 ? 0.35 : 1,
                transition: 'all 0.15s',
              }}
            >
              →
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

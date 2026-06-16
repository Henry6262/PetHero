import { useEffect, useState } from 'react'
import { ROSTER, type Commander } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'
import GradientCarousel from '../reactbits/GradientCarousel'

const FACTION_COLOR: Record<string, string> = {
  Trader: 'var(--color-trader)',
  Jeet: 'var(--color-jeet)',
}

/** Probe a portrait — resolves true only if the image actually loads. */
function imageExists(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

export function Roster() {
  // Only commanders whose portrait actually loads make it into the carousel —
  // a deleted / missing image drops the card entirely (no blank slots).
  const [available, setAvailable] = useState<Commander[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all(ROSTER.map((c) => imageExists(c.portrait))).then((flags) => {
      if (cancelled) return
      setAvailable(ROSTER.filter((_, i) => flags[i]))
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (available.length === 0) return null

  const commander = available[Math.min(active, available.length - 1)]
  const factionColor = FACTION_COLOR[commander.faction] ?? 'var(--color-gold)'

  return (
    <section id="roster" style={{ position: 'relative', overflow: 'hidden', padding: '0 6%' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '96px 0 80px' }}>
        <SectionHeader
          eyebrow="The Roster"
          title={<>Choose your <span style={{ color: 'var(--color-gold)' }}>commander</span></>}
          subtitle={`${available.length} distinct warlords. Two factions. One trench.`}
        />

        <ScrollReveal delay={0.1}>
          <div
            style={{
              position: 'relative',
              marginTop: 36,
              height: 'clamp(420px, 52vw, 560px)',
              borderRadius: 28,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
            }}
          >
            <GradientCarousel
              key={available.map((c) => c.id).join(',')}
              images={available.map((c) => c.portrait)}
              onCardChange={setActive}
              cardAspectRatio={4 / 5}
              gradientIntensity={0.5}
              backgroundBlur={44}
            />
          </div>
        </ScrollReveal>

        {/* Live caption for the centred commander */}
        <ScrollReveal delay={0.15}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: 30,
            }}
          >
            <span
              key={`badge-${commander.id}`}
              className="tr-roster-fade"
              style={{
                display: 'inline-block',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                fontWeight: 700,
                color: factionColor,
                border: `1px solid ${factionColor}`,
                borderRadius: 999,
                padding: '5px 14px',
                marginBottom: 14,
                opacity: 0.92,
              }}
            >
              {commander.faction}
            </span>
            <h3
              key={`name-${commander.id}`}
              className="tr-roster-fade"
              style={{
                fontSize: 'clamp(30px, 5vw, 48px)',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: 'var(--color-platinum)',
                margin: '0 0 10px',
              }}
            >
              {commander.name}
            </h3>
            <p
              key={`flavor-${commander.id}`}
              className="tr-roster-fade"
              style={{
                color: 'var(--color-muted)',
                fontSize: 17,
                lineHeight: 1.55,
                maxWidth: 520,
                margin: 0,
              }}
            >
              {commander.flavor}
            </p>

            {/* Position dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 26 }}>
              {available.map((c, i) => (
                <span
                  key={c.id}
                  style={{
                    width: i === active ? 22 : 8,
                    height: 8,
                    borderRadius: 999,
                    background: i === active ? 'var(--color-gold)' : 'rgba(255,255,255,0.18)',
                    transition: 'width 0.25s ease, background 0.25s ease',
                  }}
                />
              ))}
            </div>

            <span
              style={{
                marginTop: 18,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-muted)',
                opacity: 0.6,
              }}
            >
              Drag · scroll · ← → to explore
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

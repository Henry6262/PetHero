import { useState } from 'react'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'
import { CharacterModel } from '../three/CharacterModel'

interface FeaturedCharacter {
  id: string
  name: string
  role: string
  description: string
  charName: string
  stats: { label: string; value: number; max: number }[]
}

/** Featured characters for the 3D showcase.
 *  `charName` maps to `/assets/3d/chars/{charName}/model.glb`, `walk.glb`, `attack.glb`. */
const CHARACTERS: FeaturedCharacter[] = [
  {
    id: 'sbf',
    name: 'SBF',
    role: 'Final Boss Tank',
    description:
      'The last thing a jeet sees. Massive HP, heavy armor, and a taunt that pulls the whole lane into his rug.',
    charName: 'sbf',
    stats: [
      { label: 'HP', value: 2600, max: 3000 },
      { label: 'Damage', value: 115, max: 200 },
      { label: 'Armor', value: 12, max: 16 },
    ],
  },
  {
    id: 'mert',
    name: 'Mert',
    role: 'Golden Brawler',
    description:
      'Charges towers in golden armor. High HP, solid damage, and a rage that turns a losing fight around.',
    charName: 'mert',
    stats: [
      { label: 'HP', value: 720, max: 1200 },
      { label: 'Damage', value: 145, max: 200 },
      { label: 'Armor', value: 5, max: 16 },
    ],
  },
  {
    id: 'ansem',
    name: 'Ansem',
    role: 'Hooded Assassin',
    description:
      'Strikes from the shadows, deletes a target, and vanishes before the candle dumps.',
    charName: 'ansem',
    stats: [
      { label: 'HP', value: 200, max: 1200 },
      { label: 'Damage', value: 260, max: 400 },
      { label: 'Stealth', value: 85, max: 100 },
    ],
  },
  {
    id: 'vucan',
    name: 'Vucan',
    role: 'Ranged Sniper',
    description:
      'Picks targets from a distance and deletes them before they close the gap.',
    charName: 'vucan',
    stats: [
      { label: 'HP', value: 320, max: 1200 },
      { label: 'Damage', value: 180, max: 400 },
      { label: 'Range', value: 95, max: 100 },
    ],
  },
  {
    id: 'toly',
    name: 'Toly',
    role: 'Chain Architect',
    description:
      'The builder who holds the line. Fast strikes, heavy aura, never flinches.',
    charName: 'toly',
    stats: [
      { label: 'HP', value: 580, max: 1200 },
      { label: 'Damage', value: 55, max: 400 },
      { label: 'Aura', value: 90, max: 100 },
    ],
  },
]

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 700,
            color: 'var(--color-muted)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--color-platinum)',
          }}
        >
          {value}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 99,
            background: 'var(--color-gold)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

export function CharacterShowcase() {
  const [active, setActive] = useState(0)
  const char = CHARACTERS[active]

  return (
    <section id="showcase" style={{ position: 'relative', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 0 80px' }}>
        <SectionHeader
          eyebrow="Character Showcase"
          title={<>Meet the <span style={{ color: 'var(--color-gold)' }}>trench lords</span></>}
          subtitle="Fully rigged warlords. Walk, attack, repeat."
        />

        <ScrollReveal delay={0.1}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 40,
              marginTop: 48,
              alignItems: 'center',
            }}
          >
            {/* Left: stats */}
            <div>
              <div style={{ marginBottom: 28 }}>
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
                    padding: '4px 12px',
                    marginBottom: 14,
                  }}
                >
                  {char.role}
                </span>
                <h3
                  style={{
                    fontSize: 'clamp(36px, 5vw, 56px)',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: 'var(--color-platinum)',
                    margin: '0 0 12px',
                  }}
                >
                  {char.name}
                </h3>
                <p
                  style={{
                    color: 'var(--color-muted)',
                    fontSize: 17,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {char.description}
                </p>
              </div>

              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(17,20,27,0.95), rgba(10,12,17,0.85))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '26px 28px',
                  marginBottom: 24,
                }}
              >
                {char.stats.map((s) => (
                  <StatBar key={s.label} {...s} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {CHARACTERS.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActive(i)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '1px solid',
                      borderColor: i === active ? 'rgba(212,161,60,0.55)' : 'rgba(255,255,255,0.1)',
                      background: i === active ? 'rgba(212,161,60,0.1)' : 'rgba(255,255,255,0.03)',
                      color: i === active ? 'var(--color-gold)' : 'var(--color-muted)',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: animated 3D model */}
            <div style={{ height: 520, minHeight: 420 }}>
              <CharacterModel charName={char.charName} />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

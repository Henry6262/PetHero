import { MECHANICS } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'
import MagicBento from '../reactbits/MagicBento/MagicBento'

export function Mechanics() {
  const cards = MECHANICS.map((m) => ({
    label: m.label,
    title: m.title,
    description: m.body,
  }))

  return (
    <section id="mechanics" style={{ position: 'relative', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 0 80px' }}>
        <SectionHeader
          eyebrow="Mechanics"
          title={<>Built for <span style={{ color: 'var(--color-gold)' }}>depth</span></>}
          subtitle="Simple rules. Skill ceiling for days."
        />

        <ScrollReveal delay={0.1} style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
          <MagicBento
            cards={cards}
            glowColor="212, 161, 60"
            textAutoHide={false}
            enableStars
            enableSpotlight
            enableBorderGlow
            enableTilt
            enableMagnetism
            clickEffect
          />
        </ScrollReveal>
      </div>
    </section>
  )
}

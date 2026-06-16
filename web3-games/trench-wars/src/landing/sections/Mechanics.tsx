import type { ReactNode } from 'react'
import { MECHANICS } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'
import MagicBento from '../reactbits/MagicBento/MagicBento'

const ICONS: Record<string, ReactNode> = {
  Lanes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M12 2v20M6 4v16M18 4v16" />
      <path d="M3 8h3M18 8h3M3 16h3M18 16h3" />
    </svg>
  ),
  Spells: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <polygon points="13 2 4.5 13.5 11 13.5 10 22 19.5 10.5 13 10.5 13 2" />
    </svg>
  ),
  Progression: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M6 4h12v10a6 6 0 0 1-12 0V4Z" />
      <path d="M6 20h12M9 20v2M15 20v2" />
    </svg>
  ),
  Units: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
}

export function Mechanics() {
  const cards = MECHANICS.map((m) => ({
    label: m.label,
    title: m.title,
    description: m.body,
    icon: ICONS[m.label],
  }))

  return (
    <section id="mechanics" style={{ position: 'relative', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 0 100px' }}>
        <SectionHeader
          eyebrow="Mechanics"
          title={<>Built for <span style={{ color: 'var(--color-gold)' }}>depth</span></>}
          subtitle="Simple rules. Skill ceiling for days."
        />

        <ScrollReveal delay={0.1} style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
          <MagicBento
            cards={cards}
            glowColor="212, 161, 60"
            textAutoHide={false}
            enableStars={false}
            enableSpotlight={false}
            enableBorderGlow
            enableTilt
            enableMagnetism={false}
            clickEffect={false}
          />
        </ScrollReveal>
      </div>
    </section>
  )
}

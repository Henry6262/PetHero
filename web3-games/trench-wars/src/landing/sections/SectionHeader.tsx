import { ScrollReveal } from '../reactbits/ScrollReveal'

interface SectionHeaderProps {
  eyebrow: string
  title: React.ReactNode
  subtitle: string
  align?: 'left' | 'center'
}

export function SectionHeader({ eyebrow, title, subtitle, align = 'center' }: SectionHeaderProps) {
  return (
    <ScrollReveal className="tr-section-header" style={{ textAlign: align }}>
      <span
        style={{
          display: 'inline-block',
          fontFamily: 'var(--font-display)',
          color: 'var(--color-gold)',
          fontSize: 12,
          letterSpacing: '0.28em',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        {eyebrow}
      </span>
      <h2
        style={{
          fontSize: 'clamp(30px, 5vw, 52px)',
          fontWeight: 900,
          letterSpacing: '0.04em',
          lineHeight: 1.05,
          color: 'var(--color-platinum)',
          margin: '0 0 16px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: 'var(--color-muted)',
          fontSize: 17,
          lineHeight: 1.55,
          maxWidth: 560,
          margin: align === 'center' ? '0 auto' : '0',
        }}
      >
        {subtitle}
      </p>
    </ScrollReveal>
  )
}

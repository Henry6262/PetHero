import { STEPS } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'

export function HowItWorks() {
  return (
    <section id="how" style={{ position: 'relative', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 0 100px' }}>
        <SectionHeader
          eyebrow="How It Works"
          title={<>Three moves to <span style={{ color: 'var(--color-gold)' }}>win</span></>}
          subtitle="No tutorials. No hand-holding. Just build, deploy, and dominate."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 28,
            marginTop: 64,
          }}
        >
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.1}>
              <div
                style={{
                  position: 'relative',
                  padding: '42px 36px',
                  background: 'var(--color-panel)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 24,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,161,60,0.35)'
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 26px 60px rgba(0,0,0,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 56,
                      fontWeight: 900,
                      color: 'var(--color-gold)',
                      lineHeight: 0.9,
                      opacity: 0.85,
                    }}
                  >
                    {s.n}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'linear-gradient(90deg, rgba(212,161,60,0.35), transparent)',
                    }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'var(--color-platinum)',
                    margin: '0 0 14px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: 'var(--color-muted)',
                    fontSize: 16,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {s.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

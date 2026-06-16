import { STEPS } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'

export function HowItWorks() {
  return (
    <section id="how" style={{ position: 'relative', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 0 80px' }}>
        <SectionHeader
          eyebrow="How It Works"
          title={<>Three moves to <span style={{ color: 'var(--color-gold)' }}>win</span></>}
          subtitle="No tutorials. No hand-holding. Just build, deploy, and dominate."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            marginTop: 48,
          }}
        >
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.1}>
              <div
                style={{
                  position: 'relative',
                  padding: '32px 28px',
                  background: 'linear-gradient(180deg, rgba(17,20,27,0.95), rgba(10,12,17,0.85))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,161,60,0.45)'
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 26px 60px rgba(0,0,0,0.45), 0 0 32px rgba(212,161,60,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 54,
                      fontWeight: 900,
                      background: 'linear-gradient(180deg, var(--color-gold), rgba(212,161,60,0.12))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      lineHeight: 0.9,
                    }}
                  >
                    {s.n}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'linear-gradient(90deg, rgba(212,161,60,0.5), transparent)',
                    }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'var(--color-platinum)',
                    margin: '0 0 10px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: 'var(--color-muted)',
                    fontSize: 15,
                    lineHeight: 1.5,
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

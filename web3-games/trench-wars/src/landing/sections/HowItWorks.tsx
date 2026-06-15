import { STEPS } from '../data'
import { Divider } from './Divider'

export function HowItWorks() {
  return (
    <section id="how" style={{ position: 'relative' }}>
      <Divider numeral="II" label="How It Works" />
      <div
        className="tr-steps-grid"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '24px 32px 64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {STEPS.map((s) => (
          <div
            key={s.n}
            style={{
              padding: '28px 24px',
              background:
                'linear-gradient(180deg, rgba(15,18,25,0.95), rgba(10,12,17,0.8))',
              border: '1px solid rgba(42, 58, 94, 0.5)',
              borderTop: '3px solid var(--color-gold)',
              borderRadius: 18,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212,161,60,0.5)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(42, 58, 94, 0.5)'
              e.currentTarget.style.borderTopColor = 'var(--color-gold)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-gold)',
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: '0.04em',
                marginBottom: 12,
              }}
            >
              {s.n}
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '0.06em',
                margin: '0 0 10px',
                color: 'var(--color-platinum)',
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 15,
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

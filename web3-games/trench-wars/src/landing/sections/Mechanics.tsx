import { MECHANICS } from '../data'
import { Divider } from './Divider'
import SpotlightCard from '../reactbits/SpotlightCard'

export function Mechanics() {
  return (
    <section id="mechanics" style={{ position: 'relative' }}>
      <Divider numeral="III" label="Mechanics" />

      <div
        className="tr-bento"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '24px 32px 64px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }}
      >
        {MECHANICS.map((m, i) => (
          <div
            key={i}
            className="tr-bento-cell"
            style={{ gridColumn: m.span ? 'span 2' : 'span 1' }}
          >
            <SpotlightCard
              className="!bg-[#0f1219] !border-[rgba(42,58,94,0.5)] h-full"
              spotlightColor="rgba(212, 161, 60, 0.22)"
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: 'var(--color-platinum)',
                  margin: '0 0 10px',
                }}
              >
                {m.title}
              </h3>
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 14,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {m.body}
              </p>
            </SpotlightCard>
          </div>
        ))}
      </div>
    </section>
  )
}

import CountUp from '../reactbits/CountUp'
import { TOKEN } from '../data'
import { SectionHeader } from './SectionHeader'
import { ScrollReveal } from '../reactbits/ScrollReveal'

export function TokenEconomy() {
  return (
    <section id="economy" style={{ position: 'relative', padding: '0 10%' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 0 80px' }}>
        <SectionHeader
          eyebrow="Token Economy"
          title={<>Supply only goes <span style={{ color: 'var(--color-gold)' }}>down</span></>}
          subtitle="Every spend routes on-chain. Half is burned forever."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 18,
            marginTop: 48,
          }}
        >
          {TOKEN.splits.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 0.1}>
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(17,20,27,0.95), rgba(10,12,17,0.85))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: 26,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(212,161,60,0.35)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--color-platinum)',
                    }}
                  >
                    {s.label}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 28,
                      color: 'var(--color-gold)',
                    }}
                  >
                    {s.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: 'rgba(255,255,255,0.06)',
                    marginTop: 18,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${s.pct}%`,
                      height: '100%',
                      background: 'var(--color-gold)',
                      borderRadius: 99,
                    }}
                  />
                </div>
                <p
                  style={{
                    color: 'var(--color-muted)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    margin: '14px 0 0',
                  }}
                >
                  {s.note}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <div
            style={{
              display: 'flex',
              gap: 32,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: 44,
              padding: '28px 32px',
              background: 'linear-gradient(180deg, rgba(17,20,27,0.95), rgba(10,12,17,0.85))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 40,
                  fontWeight: 900,
                  color: 'var(--color-gold)',
                  letterSpacing: '0.02em',
                }}
              >
                <CountUp to={TOKEN.burnedToDate} separator="," />
              </div>
              <div
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  marginTop: 4,
                }}
              >
                {TOKEN.ticker} burned to date
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 220,
                color: 'var(--color-muted)',
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              Fair launch on <strong style={{ color: 'var(--color-platinum)' }}>pump.fun</strong>. No presale.
              No team allocation. Coming soon.
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

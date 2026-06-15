import CountUp from '../reactbits/CountUp'
import { TOKEN } from '../data'
import { Divider } from './Divider'

const FLOW = [
  'Spend $ROYALE on lootbox',
  'Routed to burn / treasury contract',
  '50% burned · 30% rewards · 20% treasury',
]

export function TokenEconomy() {
  return (
    <section id="economy" style={{ position: 'relative' }}>
      <Divider numeral="IV" label="Token Economy" />

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '24px 32px 80px',
        }}
      >
        <p
          style={{
            color: 'var(--color-muted)',
            maxWidth: 640,
            fontSize: 18,
            lineHeight: 1.6,
            margin: '0 0 32px',
          }}
        >
          <strong style={{ color: 'var(--color-gold)' }}>{TOKEN.ticker}</strong> is the fuel of the trench.
          Spend it on lootboxes and card packs — every spend routes on-chain, and half is{' '}
          <strong style={{ color: 'var(--color-ember)' }}>burned forever</strong>. Supply only shrinks.
        </p>

        <div
          className="tr-flow"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            margin: '0 0 36px',
          }}
        >
          {FLOW.map((t, i, arr) => (
            <span
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  border: '1px solid rgba(212,161,60,0.35)',
                  borderRadius: 999,
                  padding: '12px 20px',
                  background: 'var(--color-panel)',
                  fontSize: 14,
                  color: 'var(--color-platinum)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </span>
              {i < arr.length - 1 && (
                <span
                  style={{
                    color: 'var(--color-gold)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                  }}
                >
                  →
                </span>
              )}
            </span>
          ))}
        </div>

        <div
          className="tr-splits"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 18,
            marginBottom: 40,
          }}
        >
          {TOKEN.splits.map((s) => (
            <div
              key={s.label}
              style={{
                background: 'var(--color-panel)',
                border: '1px solid rgba(42, 58, 94, 0.5)',
                borderRadius: 18,
                padding: 22,
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
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'var(--color-platinum)',
                  }}
                >
                  {s.label}
                </h3>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 24,
                    color: s.color,
                  }}
                >
                  {s.pct}%
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 99,
                  background: '#1a1f29',
                  marginTop: 14,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${s.pct}%`,
                    height: '100%',
                    background: s.color,
                    borderRadius: 99,
                  }}
                />
              </div>
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  margin: '12px 0 0',
                }}
              >
                {s.note}
              </p>
            </div>
          ))}
        </div>

        <div
          className="tr-burn-row"
          style={{
            display: 'flex',
            gap: 32,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 44,
                fontWeight: 900,
                color: 'var(--color-ember)',
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
                letterSpacing: '0.2em',
                marginTop: 4,
              }}
            >
              {TOKEN.ticker} burned to date
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgba(212,161,60,0.35)',
              borderRadius: 18,
              padding: '18px 24px',
              background: 'var(--color-panel)',
            }}
          >
            <div
              style={{
                color: 'var(--color-gold)',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: '0.06em',
              }}
            >
              Fair launch on pump.fun
            </div>
            <div
              style={{
                color: 'var(--color-muted)',
                fontSize: 14,
                marginTop: 6,
              }}
            >
              No presale. No team allocation. Coming soon.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

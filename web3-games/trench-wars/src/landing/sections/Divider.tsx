interface DividerProps {
  numeral: string
  label: string
}

export function Divider({ numeral, label }: DividerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        maxWidth: 1280,
        margin: '0 auto',
        padding: '80px 32px 24px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-gold)',
          fontSize: 13,
          letterSpacing: '0.34em',
          fontWeight: 700,
        }}
      >
        {numeral}
      </span>
      <span
        style={{
          height: 1,
          flex: 1,
          background: 'linear-gradient(90deg, rgba(212,161,60,0.5), transparent)',
        }}
      />
      <h2
        style={{
          fontSize: 'clamp(22px, 3.6vw, 36px)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 900,
          color: 'var(--color-platinum)',
        }}
      >
        {label}
      </h2>
    </div>
  )
}

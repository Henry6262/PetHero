export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(212,161,60,0.14)',
        padding: '28px 10%',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        color: 'var(--color-muted)',
        fontSize: 13,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-gold)',
          fontWeight: 900,
          letterSpacing: '0.12em',
        }}
      >
        TRENCH ROYALE
      </span>
      <span>Traders vs Jeets · {year}</span>
    </footer>
  )
}

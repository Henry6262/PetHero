export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(212,161,60,0.14)',
        padding: '40px 10%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        color: 'var(--color-muted)',
        fontSize: 14,
        letterSpacing: '0.04em',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-gold)',
          fontWeight: 900,
          letterSpacing: '0.14em',
        }}
      >
        TRENCH ROYALE
      </span>
      <span>Traders vs Jeets · {year}</span>
    </footer>
  )
}

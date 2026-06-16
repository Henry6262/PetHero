import StarBorder from '../reactbits/StarBorder'

interface FinalCtaProps {
  onPlay: () => void
}

export function FinalCta({ onPlay }: FinalCtaProps) {
  return (
    <section
      id="enlist"
      style={{
        position: 'relative',
        textAlign: 'center',
        padding: '140px 10%',
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(212,161,60,0.07), transparent 60%)',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 900,
          letterSpacing: '0.06em',
          lineHeight: 1,
          color: 'var(--color-platinum)',
          margin: '0 0 18px',
        }}
      >
        ENTER THE TRENCH
      </h2>
      <p
        style={{
          color: 'var(--color-muted)',
          margin: '0 auto 32px',
          maxWidth: 460,
          fontSize: 18,
          lineHeight: 1.55,
        }}
      >
        Traders vs Jeets. Last line standing wins.
      </p>
      <StarBorder
        as="button"
        color="#d4a13c"
        speed="5s"
        onClick={onPlay}
        className="!text-[var(--color-gold)]"
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            letterSpacing: '0.12em',
            fontSize: 16,
          }}
        >
          PLAY NOW
        </span>
      </StarBorder>
    </section>
  )
}

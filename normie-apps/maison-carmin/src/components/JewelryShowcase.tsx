import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { useT } from "@app/i18n";
import { PIECES } from "@app/data/pieces";
import { JewelryStage } from "@app/components/JewelryStage";

const ADVANCE_MS = 6500; // slow auto-advance

const CORNERS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
];

/** Prefill the enquiry form with a piece and glide to it. */
function enquire(pieceId: string) {
  window.dispatchEvent(new CustomEvent("enquiry:piece", { detail: pieceId }));
  const el = document.querySelector("#enquiry");
  if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth" });
}

/**
 * Single-canvas 3D jewelry carousel (ported from the PokeDex creature showcase).
 * One WebGL context cycles every piece; auto-advances, pauses on hover, and
 * crossfades the caption + ruby glow on each swap.
 */
export function JewelryShowcase() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, amount: 0.2 });

  useEffect(() => {
    if (paused || reduced || PIECES.length <= 1) return undefined;
    const id = window.setInterval(() => setI((p) => (p + 1) % PIECES.length), ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduced]);

  const piece = PIECES[i];
  const accent = piece.glow;
  const go = (n: number) => setI((n + PIECES.length) % PIECES.length);

  return (
    <div
      ref={wrapRef}
      className="group relative grid grid-cols-1 items-center gap-6 overflow-hidden bg-white/[0.012] p-6 backdrop-blur-sm sm:p-9 md:grid-cols-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* corner brackets (ruby-tinted) */}
      {CORNERS.map((pos) => (
        <span
          key={pos}
          className={`pointer-events-none absolute z-20 h-7 w-7 ${pos}`}
          style={{ borderColor: accent, transition: "border-color 0.6s ease" }}
        />
      ))}

      {/* ruby glow pool (crossfades on swap) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${piece.id}-glow`}
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{ background: `radial-gradient(46% 58% at 32% 46%, ${accent}26, transparent 70%)` }}
        />
      </AnimatePresence>

      {/* LIVE 3D stage */}
      <div className="relative h-[360px] w-full sm:h-[460px]">
        {inView && <JewelryStage piece={piece} reduced={reduced} glow={accent} className="absolute inset-0" />}

        {/* arrows */}
        {PIECES.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(i - 1)}
              aria-label="Previous piece"
              className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line-2 bg-ink/50 text-2xl text-platinum/80 backdrop-blur-sm transition hover:border-gold/50 hover:text-platinum"
            >
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label="Next piece"
              className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line-2 bg-ink/50 text-2xl text-platinum/80 backdrop-blur-sm transition hover:border-gold/50 hover:text-platinum"
            >
              &rsaquo;
            </button>
          </>
        )}
      </div>

      {/* INFO (crossfades on swap) */}
      <div className="relative min-h-[280px] text-center md:text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${piece.id}-info`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35 }}
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: accent, background: `${accent}1a`, boxShadow: `inset 0 0 0 1px ${accent}3a` }}
            >
              <span className="h-1.5 w-1.5" style={{ background: accent }} />
              {piece.stone}
            </span>

            <h3 className="mt-5 font-display text-5xl tracking-tight text-platinum sm:text-6xl">
              {piece.name}
            </h3>

            <p className="mx-auto mt-4 max-w-md text-silver md:mx-0">{piece.blurb}</p>

            <dl className="mx-auto mt-7 grid max-w-md grid-cols-3 gap-4 md:mx-0">
              <Spec label={t("collection.metal")} value={piece.metal} />
              <Spec label={t("collection.stone")} value={piece.stone} />
              <Spec label={t("collection.carat")} value={piece.carat} />
            </dl>

            <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:items-center">
              <button
                type="button"
                onClick={() => enquire(piece.id)}
                className="group/btn inline-flex items-center gap-3 rounded-[2px] bg-ruby px-7 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-platinum transition-colors hover:bg-ruby-lit"
              >
                {t("collection.enquire")}
                <span className="h-px w-5 bg-platinum transition-all duration-200 group-hover/btn:w-9" />
              </button>
              <span className="text-[0.7rem] uppercase tracking-[0.24em] text-gold/80">
                {t("collection.price")}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* dots */}
        <div className="mt-9 flex justify-center gap-3 md:justify-start">
          {PIECES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show ${s.name}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: idx === i ? 24 : 8,
                background: idx === i ? accent : "rgba(179,169,166,0.28)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[0.6rem] uppercase tracking-[0.2em] text-silver/60">{label}</dt>
      <dd className="text-sm text-platinum">{value}</dd>
    </div>
  );
}

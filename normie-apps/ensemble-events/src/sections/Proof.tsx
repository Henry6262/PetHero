import LogoLoop, { type LogoItem } from "@/free/Animations/LogoLoop/LogoLoop";
import { useT } from "@app/i18n";

// PLACEHOLDER testimonials — founder to replace with real (NDA-cleared) quotes.
const FEATURED = {
  quote:
    "They didn't manage our suppliers — they were the suppliers. One team, one phone call, and a flawless night.",
  author: "Private client",
  detail: "200-guest celebration · Zürich",
};

const SECONDARY = [
  {
    quote: "The same faces returned for our third event. By now they know the family better than we do.",
    author: "Family office",
    detail: "Recurring private events",
  },
  {
    quote: "Kitchen, music, and floor in perfect time. The room noticed only the night.",
    author: "Corporate host",
    detail: "Brand anniversary",
  },
];

// Empty until real client logos are NDA-cleared.
const LOGOS: LogoItem[] = [];

export function Proof() {
  const { t } = useT();
  return (
    <section className="bg-cream px-6 py-28 text-ink md:px-10 md:py-40">
      <div className="mx-auto max-w-6xl">
        <p className="label mb-6 text-gold">{t("proof.eyebrow")}</p>

        {/* Oversized featured pull-quote */}
        <figure className="max-w-4xl">
          <span className="font-display text-7xl leading-none text-gold/40">“</span>
          <blockquote className="-mt-6 font-display text-[2rem] leading-[1.22] text-ink md:text-[3.2rem]">
            {FEATURED.quote}
          </blockquote>
          <figcaption className="mt-7 flex items-center gap-3 text-sm text-ink/60">
            <span className="h-px w-8 bg-gold" />
            <span className="text-ink">{FEATURED.author}</span>
            <span className="text-ink/45">· {FEATURED.detail}</span>
          </figcaption>
        </figure>

        {/* Two supporting quotes, offset */}
        <div className="mt-20 grid gap-10 border-t border-ink/15 pt-14 md:grid-cols-2">
          {SECONDARY.map((s, i) => (
            <blockquote key={i} className="max-w-md">
              <p className="font-display text-xl leading-relaxed text-ink/80">“{s.quote}”</p>
              <footer className="mt-4 text-xs text-ink/50">
                <span className="uppercase tracking-[0.18em]">{s.author}</span> · {s.detail}
              </footer>
            </blockquote>
          ))}
        </div>

        {LOGOS.length > 0 ? (
          <div className="mt-20">
            <LogoLoop logos={LOGOS} logoHeight={26} gap={56} fadeOut fadeOutColor="#f4efe6" pauseOnHover />
          </div>
        ) : (
          <p className="mt-16 max-w-xl text-sm leading-relaxed text-ink/55">{t("proof.fallback")}</p>
        )}

        <p className="mt-12 font-display text-2xl italic text-gold md:text-3xl">
          {t("proof.scarcity")}
        </p>
      </div>
    </section>
  );
}

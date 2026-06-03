import CardSwap, { Card } from "@/free/Components/CardSwap/CardSwap";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";

// PLACEHOLDER testimonials — founder to replace with real (NDA-cleared) quotes.
const TESTIMONIALS = [
  {
    quote:
      "They didn't manage our suppliers — they were the suppliers. One team, one phone call, a flawless night.",
    author: "Private client",
    detail: "200-guest celebration · Zürich",
  },
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

export function Proof() {
  const { t } = useT();
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-cream px-6 py-28 text-ink md:px-10 md:py-40">
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
        {/* left: statement */}
        <div>
          <h2 className="font-display text-[2.6rem] leading-[1.04] text-ink md:text-[3.6rem]">
            {t("proof.title")}
          </h2>
          <p className="mt-7 max-w-md text-base leading-relaxed text-ink/65">{t("proof.fallback")}</p>
          <p className="mt-10 font-display text-2xl italic text-gold md:text-3xl">
            {t("proof.scarcity")}
          </p>
        </div>

        {/* right: rotating testimonial cards */}
        {reduced ? (
          <div className="space-y-5">
            {TESTIMONIALS.map((tt, i) => (
              <blockquote key={i} className="rounded-sm border border-ink/15 bg-cream-dark/50 p-7">
                <p className="font-display text-xl leading-relaxed text-ink/85">“{tt.quote}”</p>
                <footer className="mt-4 text-xs uppercase tracking-[0.18em] text-ink/50">
                  {tt.author} · {tt.detail}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          // Cap the box width and pin it to the right of the column so the
          // fanned stack stays in its own lane and never reaches the heading.
          <div className="relative mx-auto h-[440px] w-full max-w-[420px] md:ml-auto md:mr-0">
            <CardSwap
              width={360}
              height={232}
              cardDistance={40}
              verticalDistance={46}
              delay={4200}
              pauseOnHover
            >
              {TESTIMONIALS.map((tt, i) => (
                <Card
                  key={i}
                  customClass="rounded-sm !border-gold/30 bg-espresso p-7 text-cream shadow-2xl"
                >
                  <span className="font-display text-4xl leading-none text-gold/50">“</span>
                  <p className="-mt-3 font-display text-xl leading-snug text-cream">{tt.quote}</p>
                  <footer className="mt-5 text-[0.65rem] uppercase tracking-[0.2em] text-gold-soft">
                    {tt.author} · {tt.detail}
                  </footer>
                </Card>
              ))}
            </CardSwap>
          </div>
        )}
      </div>
    </section>
  );
}

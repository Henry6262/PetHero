import { lazy, Suspense } from "react";
import { useT } from "@app/i18n";
import { cn } from "@app/lib/cn";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { CtaButton } from "@app/components/CtaButton";
import ShinyText from "@/free/TextAnimations/ShinyText/ShinyText";
import StarBorder from "@/free/Animations/StarBorder/StarBorder";
import CountUp from "@/free/TextAnimations/CountUp/CountUp";

// The 3D cluster pulls in three.js — lazy-load it so first paint stays fast.
const HeroCluster = lazy(() =>
  import("@app/components/HeroCluster").then((m) => ({ default: m.HeroCluster }))
);

export function Hero() {
  const { t } = useT();
  const reduced = useReducedMotion();

  return (
    <section id="top" className="relative min-h-screen overflow-hidden px-6 pb-16 pt-32 md:px-10">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 md:min-h-[calc(100vh-12rem)] md:grid-cols-[1.05fr_0.95fr] md:gap-10">
        {/* LEFT — the pitch */}
        <div className="order-2 text-left md:order-1">
          <p className="label mb-8 text-gold/90">{t("hero.tag")}</p>

          <h1 className="font-display text-[clamp(3rem,8.4vw,6.4rem)] font-bold leading-[0.9] tracking-[-0.015em] text-platinum">
            <span className="block">{t("hero.titleLine1")}</span>
            <span className="block italic">
              <ShinyText
                text={t("hero.titleLine2")}
                speed={4}
                color="#ff4259"
                shineColor="#ffe3e8"
                className="font-display font-bold"
              />
            </span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-silver md:text-lg">
            {t("hero.sub")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <StarBorder as="a" href="#collection">{t("hero.ctaCollection")}</StarBorder>
            <CtaButton as="a" href="#bespoke" variant="ghost">{t("hero.ctaBespoke")}</CtaButton>
          </div>

          {/* hairline gold separator */}
          <div className="mt-12 h-px w-full max-w-lg gold-rule" />

          <dl className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            <Stat value={42} label={t("hero.stats.pieces")} />
            <Stat value={310} label={t("hero.stats.carats")} />
            <Stat value={26} label={t("hero.stats.years")} />
            <StaticStat value={t("hero.cityValue")} label={t("hero.stats.city")} />
          </dl>
        </div>

        {/* RIGHT — the three pieces, big, floating + orbiting under a ruby spotlight */}
        <div className="relative order-1 h-[48vh] min-h-[360px] md:order-2 md:h-[calc(100vh-12rem)]">
          {/* spotlight: a soft dark pool + ruby light behind the cluster, both
              fading to transparent before the edges (no container box). */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(62% 68% at 52% 50%, rgba(6,3,4,0.5), transparent 74%)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(50% 54% at 54% 48%, rgba(255,43,70,0.22), transparent 66%)" }}
            />
          </div>
          <Suspense
            fallback={
              <div className="absolute inset-0 grid place-items-center">
                <div className="size-36 animate-pulse rounded-full border border-ruby/30" />
              </div>
            }
          >
            <HeroCluster reduced={reduced} className="absolute inset-0" />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start", className)}>
      <span className="flex items-baseline font-display text-4xl text-platinum md:text-5xl">
        <CountUp to={value} duration={1.8} separator="," />
        <span className="ml-0.5 text-ruby-lit">+</span>
      </span>
      <dt className="mt-2 text-[0.66rem] uppercase tracking-[0.2em] text-silver/70">{label}</dt>
    </div>
  );
}

function StaticStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className="font-display text-4xl text-platinum md:text-5xl">{value}</span>
      <dt className="mt-2 text-[0.66rem] uppercase tracking-[0.2em] text-silver/70">{label}</dt>
    </div>
  );
}

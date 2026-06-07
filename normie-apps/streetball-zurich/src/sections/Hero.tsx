import { lazy, Suspense } from "react";
import { useT } from "@app/i18n";
import { cn } from "@app/lib/cn";
import { CtaButton } from "@app/components/CtaButton";
import GlitchText from "@/free/TextAnimations/GlitchText/GlitchText";
import CountUp from "@/free/TextAnimations/CountUp/CountUp";
import StarBorder from "@/free/Animations/StarBorder/StarBorder";

// The 3D ball pulls in three.js — lazy-load it so first paint stays fast.
const BasketBall3D = lazy(() =>
  import("@app/components/BasketBall3D").then((m) => ({ default: m.BasketBall3D }))
);

// Season tip-off — drives the live countdown. Placeholder; organiser to confirm.
const TIP_OFF = new Date("2026-07-04T00:00:00");
function daysToTipOff(): number {
  const ms = TIP_OFF.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function Hero() {
  const { t } = useT();
  const days = daysToTipOff();

  return (
    <section
      id="top"
      className="relative min-h-screen overflow-hidden px-6 pb-16 pt-28 md:px-10"
    >
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 md:min-h-[calc(100vh-11rem)] md:grid-cols-[1.05fr_0.95fr] md:gap-10">
        {/* LEFT — the pitch */}
        <div className="order-2 text-left md:order-1">
          <p className="label mb-7 text-lime">{t("hero.tag")}</p>

          <h1 className="flex flex-col items-start gap-1 text-[clamp(2.6rem,7.4vw,6rem)]">
            <GlitchText speed={0.7} className="text-chalk">ZURICH</GlitchText>
            <GlitchText speed={0.55} className="text-lime">STREET</GlitchText>
            <span className="flex items-end gap-3">
              <GlitchText speed={0.85} className="text-chalk">BALL</GlitchText>
              <span className="mb-[0.35em] font-display text-[0.22em] text-lime/70">'26</span>
            </span>
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-chalk-dim md:text-lg">
            {t("hero.sub")}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <StarBorder as="a" href="#register">{t("hero.ctaJam")}</StarBorder>
            <CtaButton as="a" href="#coaching" variant="ghost">{t("hero.ctaTrain")}</CtaButton>
          </div>

          {/* branded separator — fades out toward both ends */}
          <div className="mt-12 h-px w-full max-w-lg bg-[linear-gradient(to_right,transparent,rgba(198,255,46,0.55),transparent)]" />

          <dl className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
            <Stat value={240} label={t("hero.stats.ballers")} />
            <Stat value={18} label={t("hero.stats.courts")} />
            <Stat value={5} label={t("hero.stats.brackets")} />
            <Stat value={days} label={t("hero.stats.days")} />
          </dl>
        </div>

        {/* RIGHT — the big dunk, lit by a branded spotlight */}
        <div className="relative order-1 h-[40vh] min-h-[300px] md:order-2 md:h-[calc(100vh-11rem)]">
          {/* spotlight: a soft dark pool + lime light behind the figure. Both fade
              to transparent well before the edges, so there's no container box. */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(62% 68% at 56% 55%, rgba(7,8,10,0.6), transparent 72%)" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "radial-gradient(48% 52% at 58% 53%, rgba(198,255,46,0.2), transparent 64%)" }}
            />
          </div>
          <Suspense
            fallback={
              <div className="absolute inset-0 grid place-items-center">
                <div className="size-40 animate-pulse rounded-full border-2 border-lime/30" />
              </div>
            }
          >
            <BasketBall3D className="absolute inset-0" />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start", className)}>
      <CountUp to={value} duration={1.6} className="font-display text-4xl text-lime md:text-5xl" />
      <dt className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-chalk-dim">{label}</dt>
    </div>
  );
}

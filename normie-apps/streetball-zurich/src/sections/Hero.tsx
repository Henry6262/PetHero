import { useT } from "@app/i18n";
import { cn } from "@app/lib/cn";
import { CourtBackdrop } from "@app/components/CourtBackdrop";
import { CtaButton } from "@app/components/CtaButton";
import GlitchText from "@/free/TextAnimations/GlitchText/GlitchText";
import CountUp from "@/free/TextAnimations/CountUp/CountUp";
import StarBorder from "@/free/Animations/StarBorder/StarBorder";

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
    <section id="top" className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-concrete px-6 pb-16 pt-28 md:px-10">
      <CourtBackdrop />

      <div className="relative mx-auto w-full max-w-5xl text-center">
        <p className="label mb-10 text-lime">{t("hero.tag")}</p>

        <h1 className="flex flex-col items-center gap-1 text-[clamp(3.2rem,13vw,10rem)]">
          <GlitchText speed={0.7} className="text-chalk">ZÜRI</GlitchText>
          <GlitchText speed={0.55} className="text-lime">STREET</GlitchText>
          <span className="flex items-end gap-4">
            <GlitchText speed={0.85} className="text-chalk">BALL</GlitchText>
            <span className="mb-[0.35em] font-display text-[0.2em] text-lime/70">'26</span>
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-chalk-dim md:text-lg">
          {t("hero.sub")}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <StarBorder as="a" href="#register">
            {t("hero.ctaJam")}
          </StarBorder>
          <CtaButton as="a" href="#coaching" variant="ghost">
            {t("hero.ctaTrain")}
          </CtaButton>
        </div>

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          <Stat value={240} label={t("hero.stats.ballers")} />
          <Stat value={18} label={t("hero.stats.courts")} />
          <Stat value={5} label={t("hero.stats.brackets")} />
          <Stat value={days} label={t("hero.stats.days")} />
        </dl>
      </div>
    </section>
  );
}

function Stat({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <CountUp to={value} duration={1.6} className="font-display text-4xl text-lime md:text-5xl" />
      <dt className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-chalk-dim">{label}</dt>
    </div>
  );
}

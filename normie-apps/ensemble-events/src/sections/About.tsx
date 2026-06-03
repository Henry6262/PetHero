import CountUp from "@/free/TextAnimations/CountUp/CountUp";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { FOUNDER_IMG } from "@app/assets/placeholders";

export function About() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const points = [t("about.point1"), t("about.point2"), t("about.point3")];

  return (
    <section className="relative overflow-hidden bg-espresso-2 px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-20">
        {/* framed founder image with floating stat card */}
        <div className="relative">
          <figure className="frame-gold relative aspect-[4/5] overflow-hidden">
            <img
              src={FOUNDER_IMG}
              alt="The founder"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </figure>
          <div className="glass-dark absolute -bottom-8 -right-4 z-[3] w-56 p-6 md:-right-8">
            <div className="font-display text-5xl text-gold">
              {reduced ? 80 : <CountUp to={80} duration={2} />}%
            </div>
            <p className="mt-2 text-xs leading-relaxed text-cream/70">{t("about.statLabel")}</p>
          </div>
        </div>

        {/* credentials */}
        <div>
          <h2 className="font-display text-[2.4rem] leading-[1.05] text-cream md:text-[3.6rem]">
            {t("about.title")}
          </h2>
          <p className="mt-7 max-w-md text-base leading-relaxed text-cream/72 md:text-lg">
            {t("about.body")}
          </p>
          <ul className="mt-10 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-4 text-cream/85">
                <svg width="14" height="14" viewBox="0 0 14 14" className="mt-1.5 shrink-0" aria-hidden>
                  <path d="M7 0 L9 5 L14 7 L9 9 L7 14 L5 9 L0 7 L5 5 Z" fill="#c0a160" />
                </svg>
                <span className="text-base">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

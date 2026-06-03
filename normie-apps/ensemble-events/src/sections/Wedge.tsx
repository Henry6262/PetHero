import ScrollReveal from "@/free/TextAnimations/ScrollReveal/ScrollReveal";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { WEDGE_IMG } from "@app/assets/placeholders";

export function Wedge() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const body = t("wedge.body");

  return (
    <section id="about" className="relative overflow-hidden bg-espresso px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-20">
        {/* statement */}
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-2 -top-24 font-display text-[18rem] leading-none text-cream/[0.03]"
          >
            I
          </span>
          {reduced ? (
            <p className="font-display text-[2rem] leading-[1.16] text-cream md:text-[3.4rem]">{body}</p>
          ) : (
            <ScrollReveal
              enableBlur
              baseOpacity={0.16}
              baseRotation={1.5}
              blurStrength={5}
              containerClassName="!my-0"
              textClassName="font-display !text-[2rem] md:!text-[3.4rem] !font-normal leading-[1.16] text-cream"
            >
              {body}
            </ScrollReveal>
          )}
        </div>

        {/* framed image */}
        <figure className="frame-gold relative aspect-[3/4] w-full overflow-hidden">
          <img
            src={WEDGE_IMG}
            alt="One team, end to end"
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <figcaption className="absolute bottom-5 left-5 z-[3] max-w-[12rem] font-display text-lg italic text-cream drop-shadow">
            One roof. One team.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

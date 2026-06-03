import ScrollReveal from "@/free/TextAnimations/ScrollReveal/ScrollReveal";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";

export function Wedge() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const body = t("wedge.body");

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-espresso px-6 py-32 md:px-10 md:py-52"
    >
      {/* faint oversized watermark numeral */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-6 font-display text-[34vw] leading-none text-cream/[0.03] md:top-0"
      >
        I
      </span>

      <div className="relative mx-auto max-w-5xl">
        {reduced ? (
          <p className="font-display text-[2rem] leading-[1.18] text-cream md:text-[3.6rem]">
            {body}
          </p>
        ) : (
          <ScrollReveal
            enableBlur
            baseOpacity={0.16}
            baseRotation={1.5}
            blurStrength={5}
            containerClassName="!my-0"
            textClassName="font-display !text-[2rem] md:!text-[3.6rem] !font-normal leading-[1.18] text-cream"
          >
            {body}
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

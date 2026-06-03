import { lazy, Suspense } from "react";
import TiltedCard from "@/free/Components/TiltedCard/TiltedCard";
import { useT } from "@app/i18n";
import { useReducedMotion } from "@app/lib/useReducedMotion";
import { BRIGADE_SHOTS, TEAM } from "@app/assets/placeholders";

const CircularGallery = lazy(() => import("@/free/Components/CircularGallery/CircularGallery"));

export function Brigade() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const items = BRIGADE_SHOTS.map((image) => ({ image, text: "" }));

  return (
    <section className="relative overflow-hidden bg-espresso px-6 py-28 md:px-10 md:py-40">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-10 font-display text-[26vw] leading-none text-cream/[0.03]"
      >
        II
      </span>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 className="font-display text-[2.8rem] leading-[1.0] text-cream md:text-[4.4rem]">
              {t("brigade.title")}
            </h2>
          </div>
          <p className="text-base leading-relaxed text-cream/70 md:col-span-5 md:text-lg">
            {t("brigade.body")}
          </p>
        </div>
      </div>

      {/* curved WebGL gallery — a different visual language to the masonry/portfolio */}
      <div className="relative mt-12 h-[420px] w-full md:h-[520px]">
        {reduced ? (
          <div className="no-bar flex h-full gap-4 overflow-x-auto px-2">
            {BRIGADE_SHOTS.map((src, i) => (
              <img key={i} src={src} alt="" className="h-full w-auto rounded-sm object-cover grayscale" />
            ))}
          </div>
        ) : (
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-espresso-2" />}>
            <CircularGallery items={items} bend={2.5} textColor="#f4efe6" borderRadius={0.06} />
          </Suspense>
        )}
      </div>

      {/* named, recurring faces — tilted cards */}
      <div className="relative mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-10 border-t border-cream/12 pt-16 sm:grid-cols-3">
        {TEAM.map((m) => (
          <div key={m.name} className="flex flex-col items-center text-center">
            <TiltedCard
              imageSrc={m.img}
              altText={m.name}
              containerHeight="360px"
              containerWidth="100%"
              imageHeight="360px"
              imageWidth="280px"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
            />
            <p className="mt-5 font-display text-2xl text-cream">{m.name}</p>
            <p className="label mt-1 text-gold">{m.role}</p>
          </div>
        ))}
      </div>

      <p className="relative mx-auto mt-16 max-w-md font-display text-2xl italic text-cream/65 md:text-3xl">
        {t("brigade.caption")}
      </p>
    </section>
  );
}

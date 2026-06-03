import { lazy, Suspense } from "react";
import { useT } from "@app/i18n";
import { BEFORE_IMG, AFTER_IMG } from "@app/assets/placeholders";

const ComparisonSlider = lazy(() => import("@/pro/react-bits/comparison-slider"));

export function BeforeAfter() {
  const { t } = useT();
  return (
    <section className="bg-cream px-6 py-28 text-ink md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <h2 className="font-display text-[2.6rem] leading-[1.02] text-ink md:text-6xl">
            {t("beforeAfter.title")}
          </h2>
          <div className="md:text-right">
            <p className="label text-gold">{t("beforeAfter.eyebrow")}</p>
            <p className="mt-3 text-sm text-ink/55">↔ {t("beforeAfter.hint")}</p>
          </div>
        </div>

        {/* explicit aspect box — the slider fills it absolutely */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-ink/10 md:aspect-[16/8]">
          <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-greige/30" />}>
            <ComparisonSlider
              beforeImage={BEFORE_IMG}
              afterImage={AFTER_IMG}
              beforeAlt={t("beforeAfter.before")}
              afterAlt={t("beforeAfter.after")}
              initialPosition={50}
              dividerWidth={2}
              dividerColor="#c0a160"
              handleColor="#c0a160"
              showLabels
              labelText={{ before: t("beforeAfter.before"), after: t("beforeAfter.after") }}
              className="absolute inset-0 h-full w-full"
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

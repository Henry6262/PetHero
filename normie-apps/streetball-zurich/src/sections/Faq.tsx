import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useT } from "@app/i18n";
import { Section, Eyebrow } from "@app/components/Section";
import { cn } from "@app/lib/cn";

const ITEMS = ["cost", "gear", "solo", "rain", "coaching"] as const;

export function Faq() {
  const { t } = useT();
  const [open, setOpen] = useState<string | null>("cost");

  return (
    <Section id="faq" tone="concrete">
      <div className="grid gap-12 md:grid-cols-[0.7fr_1.3fr] md:items-start">
        <div>
          <Eyebrow>{t("faq.eyebrow")}</Eyebrow>
          <h2 className="font-display text-[2.4rem] leading-[0.95] text-chalk md:text-[3.4rem]">
            {t("faq.title")}
          </h2>
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {ITEMS.map((key) => {
            const isOpen = open === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg uppercase tracking-wide text-chalk">
                    {t(`faq.items.${key}.q`)}
                  </span>
                  {isOpen ? (
                    <Minus className="size-5 shrink-0 text-lime" />
                  ) : (
                    <Plus className="size-5 shrink-0 text-chalk-dim" />
                  )}
                </button>
                <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="max-w-xl text-chalk-dim">{t(`faq.items.${key}.a`)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

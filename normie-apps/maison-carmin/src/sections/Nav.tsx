import { useEffect, useState } from "react";
import { BRAND_NAME } from "@app/brand";
import { useT, type Lang, LANG_LABEL } from "@app/i18n";
import { cn } from "@app/lib/cn";

export function Nav() {
  const { t, lang, setLang } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#collection", label: t("nav.collection") },
    { href: "#craft", label: t("nav.craft") },
    { href: "#bespoke", label: t("nav.bespoke") },
    { href: "#atelier", label: t("nav.atelier") },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-obsidian/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label={BRAND_NAME}>
          <Monogram />
          <span className="font-display text-xl tracking-[0.08em] text-platinum">
            Maison <span className="text-ruby-lit">Carmin</span>
          </span>
        </a>

        <div className="hidden items-center md:flex">
          <div className="flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[0.82rem] tracking-wide text-silver transition-colors hover:text-platinum"
              >
                {l.label}
              </a>
            ))}
          </div>
          <span className="mx-7 h-5 w-px bg-line-2" aria-hidden />
          <LangSwitch lang={lang} onChange={setLang} />
          <a
            href="#enquiry"
            className="ml-7 rounded-[2px] bg-ruby px-6 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-platinum transition-colors hover:bg-ruby-lit"
          >
            {t("nav.cta")}
          </a>
        </div>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-7 bg-platinum" />
          <span className="block h-0.5 w-7 bg-platinum" />
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-obsidian px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-silver"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-2">
              <LangSwitch lang={lang} onChange={setLang} />
              <a
                href="#enquiry"
                onClick={() => setOpen(false)}
                className="rounded-[2px] bg-ruby px-5 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-platinum"
              >
                {t("nav.cta")}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** A small ruby-on-gold monogram lozenge. */
function Monogram() {
  return (
    <span className="grid size-9 place-items-center rounded-[2px] border border-gold/40 bg-ink">
      <span className="font-display text-base leading-none text-gold">C</span>
    </span>
  );
}

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs tracking-widest text-silver">
      {(["en", "de"] as Lang[]).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-line-2">/</span>}
          <button
            onClick={() => onChange(l)}
            className={cn("uppercase transition-colors hover:text-platinum", lang === l && "!text-gold")}
          >
            {LANG_LABEL[l]}
          </button>
        </span>
      ))}
    </div>
  );
}

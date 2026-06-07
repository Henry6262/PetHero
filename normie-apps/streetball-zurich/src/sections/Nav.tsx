import { useEffect, useState } from "react";
import { BRAND_NAME, BRAND_SHORT } from "@app/brand";
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
    { href: "#brackets", label: t("nav.brackets") },
    { href: "#coaching", label: t("nav.coaching") },
    { href: "#season", label: t("nav.season") },
    { href: "#faq", label: t("nav.faq") },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line bg-concrete/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <a href="#top" className="flex items-center gap-2" aria-label={BRAND_NAME}>
          <span className="grid size-8 place-items-center rounded-md bg-lime font-display text-sm text-ink">
            {BRAND_SHORT.slice(0, 3)}
          </span>
          <span className="hidden font-display text-lg uppercase tracking-wide text-chalk sm:block">
            Zurich Street Ball
          </span>
        </a>

        <div className="hidden items-center md:flex">
          <div className="flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm tracking-wide text-chalk-dim transition-colors hover:text-chalk"
              >
                {l.label}
              </a>
            ))}
          </div>
          <span className="mx-6 h-5 w-px bg-line" aria-hidden />
          <LangSwitch lang={lang} onChange={setLang} />
          <a
            href="#register"
            className="ml-7 rounded-full bg-lime px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-lime-soft"
          >
            {t("nav.cta")}
          </a>
        </div>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-7 bg-chalk" />
          <span className="block h-0.5 w-7 bg-chalk" />
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-concrete px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-chalk-dim"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-2">
              <LangSwitch lang={lang} onChange={setLang} />
              <a
                href="#register"
                onClick={() => setOpen(false)}
                className="rounded-full bg-lime px-5 py-2 text-sm font-semibold uppercase tracking-[0.1em] text-ink"
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

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs tracking-widest text-chalk-dim">
      {(["en", "de"] as Lang[]).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-line">/</span>}
          <button
            onClick={() => onChange(l)}
            className={cn("uppercase transition-colors hover:text-chalk", lang === l && "!text-lime")}
          >
            {LANG_LABEL[l]}
          </button>
        </span>
      ))}
    </div>
  );
}

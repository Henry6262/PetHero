import { useEffect, useState } from "react";
import { BRAND_NAME } from "@app/brand";
import { useT, type Lang } from "@app/i18n";
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
    { href: "#services", label: t("nav.services") },
    { href: "#portfolio", label: t("nav.portfolio") },
    { href: "#about", label: t("nav.about") },
    { href: "#contact", label: t("nav.contact") },
  ];

  const toggleLang = (l: Lang) => setLang(l);

  // Light treatment while over the dark hero; solid cream once scrolled.
  const onLight = !scrolled;
  const linkColor = onLight ? "text-cream/75 hover:text-cream" : "text-ink/70 hover:text-ink";
  const wordmark = onLight ? "text-cream" : "text-ink";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-ink/10 bg-cream/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <a
          href="#top"
          className={cn("font-display text-2xl tracking-tight md:text-[1.7rem]", wordmark)}
          aria-label={BRAND_NAME}
        >
          {BRAND_NAME}
          <span className="text-gold">.</span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn("text-sm tracking-wide transition-colors", linkColor)}
            >
              {l.label}
            </a>
          ))}
          <LangSwitch lang={lang} onChange={toggleLang} light={onLight} />
          <a
            href="#contact"
            className={cn(
              "rounded-full border border-gold px-5 py-2 text-sm tracking-wide transition-colors hover:bg-gold",
              onLight ? "text-cream hover:text-espresso" : "text-ink hover:text-cream"
            )}
          >
            {t("nav.cta")}
          </a>
        </div>

        <button
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={cn("block h-px w-7", onLight ? "bg-cream" : "bg-ink")} />
          <span className={cn("mt-1.5 block h-px w-7", onLight ? "bg-cream" : "bg-ink")} />
        </button>
      </nav>

      {open && (
        <div className="border-t border-greige/50 bg-cream px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-ink/80"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-2">
              <LangSwitch lang={lang} onChange={toggleLang} light={false} />
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="rounded-full border border-gold px-5 py-2 text-sm text-ink"
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

function LangSwitch({
  lang,
  onChange,
  light,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs tracking-widest",
        light ? "text-cream/55" : "text-ink/55"
      )}
    >
      {(["en", "de"] as Lang[]).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className={light ? "text-cream/30" : "text-greige"}>/</span>}
          <button
            onClick={() => onChange(l)}
            className={cn(
              "uppercase transition-colors",
              light ? "hover:text-cream" : "hover:text-ink",
              lang === l && "!text-gold"
            )}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

import { BRAND_NAME, BRAND_CITY, CONTACT } from "@app/brand";
import { useT } from "@app/i18n";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="bg-espresso px-6 py-16 text-cream-dark md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-3xl text-cream">
            {BRAND_NAME}
            <span className="text-gold">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-cream-dark/70">{t("footer.tagline")}</p>
        </div>

        <div className="text-sm text-cream-dark/70">
          <p>{BRAND_CITY} · Switzerland</p>
          <a href={CONTACT.emailHref} className="hover:text-gold">
            {CONTACT.email}
          </a>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-cream-dark/50">
            {t("footer.discretion")}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl items-center justify-between border-t border-cream-dark/15 pt-6 text-xs text-cream-dark/45">
        <span>
          © {BRAND_NAME} · {t("footer.rights")}
        </span>
        <span>DE / EN</span>
      </div>
    </footer>
  );
}

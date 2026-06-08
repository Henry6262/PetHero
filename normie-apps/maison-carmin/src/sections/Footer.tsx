import { Instagram, MapPin, Clock } from "lucide-react";
import { BRAND_NAME, CONTACT, SOCIAL, ATELIER } from "@app/brand";
import { useT, type Lang, LANG_LABEL } from "@app/i18n";
import { cn } from "@app/lib/cn";

export function Footer() {
  const { t, lang, setLang } = useT();

  return (
    <footer id="atelier" className="border-t border-line bg-ink/50 px-6 py-16 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-3xl tracking-[0.06em] text-platinum">
              Maison <span className="text-ruby-lit">Carmin</span>
            </p>
            <p className="mt-3 text-silver">{t("footer.tagline")}</p>
          </div>

          <div className="flex flex-col gap-3 text-sm text-silver">
            <span className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-gold" />
              <span>
                {ATELIER.street}
                <br />
                {ATELIER.postcode}, {ATELIER.country}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-4 text-gold" />
              {ATELIER.hours}
            </span>
            <a className="transition-colors hover:text-platinum" href={CONTACT.emailHref}>
              {CONTACT.email}
            </a>
            <a className="transition-colors hover:text-platinum" href={CONTACT.phoneHref}>
              {CONTACT.phone}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={SOCIAL.instagram}
              aria-label="Instagram"
              className="grid size-10 place-items-center rounded-[2px] border border-line-2 text-silver transition-colors hover:border-gold hover:text-gold"
            >
              <Instagram className="size-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-line pt-8 text-sm text-silver md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {BRAND_NAME}. {t("footer.rights")}</span>
          <div className="flex items-center gap-1 text-xs tracking-widest">
            {(["en", "de"] as Lang[]).map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                {i > 0 && <span className="text-line-2">/</span>}
                <button
                  onClick={() => setLang(l)}
                  className={cn("uppercase transition-colors hover:text-platinum", lang === l && "!text-gold")}
                >
                  {LANG_LABEL[l]}
                </button>
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-silver/55">{t("footer.madeIn")}</p>
      </div>
    </footer>
  );
}

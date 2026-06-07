import { Instagram, Music2, MapPin } from "lucide-react";
import { BRAND_NAME, CONTACT, SOCIAL } from "@app/brand";
import { useT, type Lang, LANG_LABEL } from "@app/i18n";
import { cn } from "@app/lib/cn";

export function Footer() {
  const { t, lang, setLang } = useT();

  return (
    <footer className="border-t border-line bg-concrete-2/40 px-6 py-14 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-3xl uppercase tracking-wide text-chalk">Zurich Street Ball</p>
            <p className="mt-2 max-w-sm text-chalk-dim">{t("footer.tagline")}</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={SOCIAL.instagram}
              aria-label="Instagram"
              className="grid size-10 place-items-center rounded-full border border-line text-chalk-dim transition-colors hover:border-lime hover:text-lime"
            >
              <Instagram className="size-5" />
            </a>
            <a
              href={SOCIAL.tiktok}
              aria-label="TikTok"
              className="grid size-10 place-items-center rounded-full border border-line text-chalk-dim transition-colors hover:border-lime hover:text-lime"
            >
              <Music2 className="size-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-line pt-8 text-sm text-chalk-dim md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-lime" />
              {t("footer.location")}
            </span>
            <a className="transition-colors hover:text-lime" href={CONTACT.emailHref}>{CONTACT.email}</a>
            <a className="transition-colors hover:text-lime" href={CONTACT.whatsappHref}>WhatsApp</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs tracking-widest">
              {(["en", "de"] as Lang[]).map((l, i) => (
                <span key={l} className="flex items-center gap-1">
                  {i > 0 && <span className="text-line">/</span>}
                  <button
                    onClick={() => setLang(l)}
                    className={cn("uppercase transition-colors hover:text-chalk", lang === l && "!text-lime")}
                  >
                    {LANG_LABEL[l]}
                  </button>
                </span>
              ))}
            </div>
            <span>© {new Date().getFullYear()} {BRAND_NAME}. {t("footer.rights")}</span>
          </div>
        </div>

        <p className="text-xs text-chalk-dim/60">{t("footer.madeIn")}</p>
      </div>
    </footer>
  );
}

import { useState, type FormEvent } from "react";
import StarBorder from "@/free/Animations/StarBorder/StarBorder";
import { useT } from "@app/i18n";
import { CONTACT } from "@app/brand";
import { cn } from "@app/lib/cn";

type Status = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const { t } = useT();
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full border-0 border-b border-ink/20 bg-transparent py-3 text-ink placeholder-ink/35 outline-none transition-colors focus:border-gold";
  const label = "label !tracking-[0.2em] text-ink/55";

  return (
    <section id="contact" className="relative overflow-hidden bg-espresso px-6 py-28 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-[1fr_1.1fr] md:items-center">
        {/* Left: invitation + concierge */}
        <div>
          <h2 className="font-display text-[2.8rem] leading-[1.02] text-cream md:text-[4rem]">
            {t("contact.title")}
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-cream/70">{t("contact.body")}</p>

          <div className="mt-12">
            <p className="label text-cream/45">{t("contact.concierge")}</p>
            <ul className="mt-5 space-y-2 font-display text-2xl text-cream">
              <li>
                <a className="transition-colors hover:text-gold" href={CONTACT.whatsappHref}>
                  WhatsApp · {CONTACT.whatsapp}
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-gold" href={CONTACT.phoneHref}>
                  {CONTACT.phone}
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-gold" href={CONTACT.emailHref}>
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: cream form card */}
        <div className="rounded-sm border border-cream/10 bg-cream p-8 text-ink shadow-2xl shadow-black/30 md:p-12">
          {status === "sent" ? (
            <div className="flex min-h-[26rem] flex-col items-start justify-center">
              <span className="font-display text-4xl text-gold">{t("contact.successTitle")}</span>
              <p className="mt-4 max-w-sm text-ink/70">{t("contact.successBody")}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-7">
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
                aria-hidden
              />

              <div>
                <label className={label} htmlFor="name">
                  {t("contact.fields.name")}
                </label>
                <input id="name" name="name" required className={field} />
              </div>

              <div>
                <label className={label} htmlFor="email">
                  {t("contact.fields.email")}
                </label>
                <input id="email" name="email" type="email" required className={field} />
              </div>

              <div className="grid gap-7 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="eventType">
                    {t("contact.fields.eventType")}
                  </label>
                  <select id="eventType" name="eventType" className={cn(field, "appearance-none")}>
                    <option value="private">{t("contact.eventTypes.private")}</option>
                    <option value="corporate">{t("contact.eventTypes.corporate")}</option>
                    <option value="wedding">{t("contact.eventTypes.wedding")}</option>
                    <option value="other">{t("contact.eventTypes.other")}</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="guests">
                    {t("contact.fields.guests")}
                  </label>
                  <input id="guests" name="guests" inputMode="numeric" className={field} />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="date">
                  {t("contact.fields.date")}
                </label>
                <input id="date" name="date" type="text" placeholder="—" className={field} />
              </div>

              <label className="flex items-start gap-3 text-sm text-ink/70">
                <input type="checkbox" name="consent" required className="mt-1 accent-[#c0a160]" />
                <span>{t("contact.fields.consent")}</span>
              </label>

              <div className="flex pt-2">
                <StarBorder
                  as="button"
                  type="submit"
                  disabled={status === "sending"}
                  color="#c0a160"
                  speed="6s"
                >
                  <span className="px-8 py-3.5 text-sm tracking-[0.12em] text-cream">
                    {status === "sending" ? t("contact.sending") : t("contact.submit")}
                  </span>
                </StarBorder>
              </div>

              {status === "error" && <p className="text-sm text-[#8a2b2b]">{t("contact.error")}</p>}

              <p className="text-xs leading-relaxed text-ink/45">{t("contact.privacy")}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

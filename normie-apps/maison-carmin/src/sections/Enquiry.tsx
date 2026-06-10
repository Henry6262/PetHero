import { useEffect, useRef, useState, type FormEvent } from "react";
import { useT } from "@app/i18n";
import { cn } from "@app/lib/cn";
import { Section, Eyebrow } from "@app/components/Section";
import { CtaButton } from "@app/components/CtaButton";
import { PIECES } from "@app/data/pieces";
import { storeLead } from "@app/lib/leads";

type Mode = "collection" | "bespoke";
type Status = "idle" | "sending" | "sent" | "error";

const BUDGETS = ["< CHF 5k", "CHF 5–15k", "CHF 15–40k", "CHF 40k +"];

export function Enquiry() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>("collection");
  const [piece, setPiece] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);

  // The collection cards dispatch this to prefill a piece + flip to collection mode.
  useEffect(() => {
    const onPiece = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (PIECES.some((p) => p.id === id)) {
        setMode("collection");
        setPiece(id);
      }
    };
    window.addEventListener("enquiry:piece", onPiece);
    return () => window.removeEventListener("enquiry:piece", onPiece);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    try {
      await storeLead({
        name: data.name,
        email: data.email,
        phone: data.phone,
        piece: mode === "collection" ? data.piece : "Bespoke commission",
        budget: data.budget,
        message: data.message,
        company: data.company, // honeypot
      });
      setStatus("sent");
      form.reset();
      setPiece("");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-full border border-line-2 bg-ink px-5 py-3 text-platinum placeholder-silver/45 outline-none transition-colors focus:border-gold";
  const label = "mb-1.5 block text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-silver/80";

  return (
    <Section id="enquiry" tone="ink">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Eyebrow>{t("enquiry.eyebrow")}</Eyebrow>
          <h2 className="font-display text-[2.6rem] leading-[1.0] text-platinum md:text-[3.4rem]">
            {t("enquiry.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-silver">{t("enquiry.body")}</p>
        </div>

        <div className="mt-10 rounded-3xl border border-line bg-charcoal/60 p-6 backdrop-blur-sm md:p-9">
          {status === "sent" ? (
            <div className="flex min-h-[22rem] flex-col items-start justify-center">
              <span className="font-display text-5xl italic text-ruby-lit">{t("enquiry.successTitle")}</span>
              <p className="mt-5 max-w-sm text-silver">{t("enquiry.successBody")}</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
              {/* honeypot */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              {/* mode toggle */}
              <div>
                <span className={label}>{t("enquiry.modeLabel")}</span>
                <div className="grid grid-cols-2 gap-2 rounded-full border border-line-2 p-1">
                  {(["collection", "bespoke"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "rounded-full px-3 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.1em] transition-colors",
                        mode === m ? "bg-ruby text-platinum" : "text-silver hover:text-platinum"
                      )}
                    >
                      {t(m === "collection" ? "enquiry.modeCollection" : "enquiry.modeBespoke")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={label} htmlFor="name">{t("enquiry.fields.name")}</label>
                <input id="name" name="name" required className={field} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="email">{t("enquiry.fields.email")}</label>
                  <input id="email" name="email" type="email" required className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="phone">{t("enquiry.fields.phone")}</label>
                  <input id="phone" name="phone" inputMode="tel" className={field} />
                </div>
              </div>

              {mode === "collection" ? (
                <div>
                  <label className={label} htmlFor="piece">{t("enquiry.fields.piece")}</label>
                  <select
                    id="piece"
                    name="piece"
                    value={piece}
                    onChange={(e) => setPiece(e.target.value)}
                    className={cn(field, "appearance-none")}
                  >
                    <option value="">{t("enquiry.pieceAny")}</option>
                    {PIECES.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={label} htmlFor="budget">{t("enquiry.fields.budget")}</label>
                  <select id="budget" name="budget" className={cn(field, "appearance-none")}>
                    <option value="">{t("enquiry.budgetPlaceholder")}</option>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={label} htmlFor="message">{t("enquiry.fields.message")}</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder={t("enquiry.messagePlaceholder")}
                  className={cn(field, "resize-none rounded-2xl")}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-silver">
                <input type="checkbox" name="consent" required className="mt-1 size-4 accent-ruby" />
                <span>{t("enquiry.consent")}</span>
              </label>

              <div className="pt-1">
                <CtaButton as="button" type="submit" disabled={status === "sending"}>
                  {status === "sending" ? t("enquiry.sending") : t("enquiry.submit")}
                </CtaButton>
              </div>

              {status === "error" && <p className="text-sm text-rose">{t("enquiry.error")}</p>}
              <p className="text-xs leading-relaxed text-silver/60">{t("enquiry.privacy")}</p>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

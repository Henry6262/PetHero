import { useEffect, useState, type FormEvent } from "react";
import { useT } from "@app/i18n";
import { cn } from "@app/lib/cn";
import { Section, Eyebrow } from "@app/components/Section";
import { CtaButton } from "@app/components/CtaButton";
import { BracketBadge } from "@app/components/BracketBadge";
import { BIRTH_YEARS, bracketForBirthYear, isMinor } from "@app/data/brackets";

type Mode = "jam" | "coaching";
type Status = "idle" | "sending" | "sent" | "error";

export function Register() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>("jam");
  const [birthYear, setBirthYear] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");

  // Enroll buttons in the Coaching section flip the form to coaching mode.
  useEffect(() => {
    const onMode = (e: Event) => {
      const detail = (e as CustomEvent<Mode>).detail;
      if (detail === "coaching" || detail === "jam") setMode(detail);
    };
    window.addEventListener("register:mode", onMode);
    return () => window.removeEventListener("register:mode", onMode);
  }, []);

  const year = Number.parseInt(birthYear, 10);
  const bracket = bracketForBirthYear(year);
  const yearChosen = birthYear !== "";
  const outOfRange = yearChosen && !bracket;
  const minor = bracket ? isMinor(year) : false;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (outOfRange) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, mode }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      form.reset();
      setBirthYear("");
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-concrete px-4 py-3 text-chalk placeholder-chalk-dim/60 outline-none transition-colors focus:border-lime";
  const label = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-chalk-dim";

  return (
    <Section id="register" tone="ink">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Eyebrow>{t("register.eyebrow")}</Eyebrow>
          <h2 className="font-display text-[2.6rem] leading-[0.95] text-chalk md:text-[3.6rem]">
            {t("register.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-chalk-dim">{t("register.body")}</p>
        </div>

        <div className="mt-10 rounded-3xl border border-line bg-ink p-6 md:p-9">
          {status === "sent" ? (
            <div className="flex min-h-[24rem] flex-col items-start justify-center">
              <span className="font-display text-4xl text-lime">{t("register.successTitle")}</span>
              <p className="mt-4 max-w-sm text-chalk-dim">{t("register.successBody")}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
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
                <span className={label}>{t("register.modeLabel")}</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-line p-1">
                  {(["jam", "coaching"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] transition-colors",
                        mode === m ? "bg-lime text-ink" : "text-chalk-dim hover:text-chalk"
                      )}
                    >
                      {t(m === "jam" ? "register.modeJam" : "register.modeCoaching")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={label} htmlFor="name">{t("register.fields.name")}</label>
                <input id="name" name="name" required className={field} />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="birthYear">{t("register.fields.birthYear")}</label>
                  <select
                    id="birthYear"
                    name="birthYear"
                    required
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className={cn(field, "appearance-none")}
                  >
                    <option value="" disabled>{t("register.birthYearPlaceholder")}</option>
                    {BIRTH_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className={label}>{t("register.bracketHint")}</span>
                  <div className="flex h-[3.25rem] items-center">
                    {bracket ? (
                      <BracketBadge id={bracket.id} note={bracket.format} active />
                    ) : (
                      <span className="text-sm text-chalk-dim">—</span>
                    )}
                  </div>
                </div>
              </div>

              {outOfRange && (
                <p className="rounded-xl border border-line bg-concrete px-4 py-3 text-sm text-chalk-dim">
                  {t("register.outOfRange")}
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="email">{t("register.fields.email")}</label>
                  <input id="email" name="email" type="email" required className={field} />
                </div>
                <div>
                  <label className={label} htmlFor="phone">{t("register.fields.phone")}</label>
                  <input id="phone" name="phone" inputMode="tel" className={field} />
                </div>
              </div>

              {/* mode-specific */}
              {mode === "jam" ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="position">{t("register.fields.position")}</label>
                    <select id="position" name="position" className={cn(field, "appearance-none")}>
                      <option value="guard">{t("register.positions.guard")}</option>
                      <option value="forward">{t("register.positions.forward")}</option>
                      <option value="center">{t("register.positions.center")}</option>
                      <option value="any">{t("register.positions.any")}</option>
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="skill">{t("register.fields.skill")}</label>
                    <select id="skill" name="skill" className={cn(field, "appearance-none")}>
                      <option value="rookie">{t("register.skills.rookie")}</option>
                      <option value="baller">{t("register.skills.baller")}</option>
                      <option value="hooper">{t("register.skills.hooper")}</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className={label} htmlFor="program">{t("register.fields.program")}</label>
                  <select id="program" name="program" className={cn(field, "appearance-none")}>
                    <option value="weekly">{t("register.programOptions.weekly")}</option>
                    <option value="camps">{t("register.programOptions.camps")}</option>
                  </select>
                </div>
              )}

              <label className="flex items-start gap-3 text-sm text-chalk-dim">
                <input
                  type="checkbox"
                  name="consent"
                  required={minor}
                  className="mt-1 size-4 accent-lime"
                />
                <span>{t("register.consent")}</span>
              </label>

              <div className="pt-1">
                <CtaButton as="button" type="submit" disabled={status === "sending" || outOfRange}>
                  {status === "sending" ? t("register.sending") : t("register.submit")}
                </CtaButton>
              </div>

              {status === "error" && <p className="text-sm text-[#ff6b6b]">{t("register.error")}</p>}
              <p className="text-xs leading-relaxed text-chalk-dim/70">{t("register.privacy")}</p>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

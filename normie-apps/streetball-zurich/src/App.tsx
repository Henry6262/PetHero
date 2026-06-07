import { Grain } from "@app/components/Grain";
import { GlobalBackdrop } from "@app/components/GlobalBackdrop";
import { SmoothScroll } from "@app/components/SmoothScroll";
import { Divider } from "@app/components/Divider";
import { useT } from "@app/i18n";
import { Nav } from "@app/sections/Nav";
import { Hero } from "@app/sections/Hero";
import { Brackets } from "@app/sections/Brackets";
import { Coaching } from "@app/sections/Coaching";
import { HowItWorks } from "@app/sections/HowItWorks";
import { Schedule } from "@app/sections/Schedule";
import { Proof } from "@app/sections/Proof";
import { Register } from "@app/sections/Register";
import { Faq } from "@app/sections/Faq";
import { Footer } from "@app/sections/Footer";

export function App() {
  const { t } = useT();
  return (
    <>
      <GlobalBackdrop />
      <Grain />
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <Divider quarter="Q1" kicker={t("brackets.eyebrow")} />
        <Brackets />
        <Divider quarter="Q2" kicker={t("coaching.eyebrow")} />
        <Coaching />
        <Divider quarter="Q3" kicker={t("how.eyebrow")} />
        <HowItWorks />
        <Schedule />
        <Divider quarter="Q4" kicker={t("proof.eyebrow")} />
        <Proof />
        <Divider quarter="OT" kicker={t("register.eyebrow")} />
        <Register />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
